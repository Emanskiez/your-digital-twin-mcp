#!/usr/bin/env node

import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Index } from "@upstash/vector";
import Groq from "groq-sdk";

/**
 * Type Definitions for MCP Server
 */
interface VectorMetadata {
  title: string;
  type: string;
  content: string;
  category?: string;
  tags?: string[];
  [key: string]: any;
}

interface VectorResult {
  id: string | number;
  score: number;
  metadata?: VectorMetadata;
}

/**
 * Configuration Constants
 */
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const TOP_K = 3;
const QUERY_TIMEOUT = 10000; // 10 seconds
const GENERATION_TIMEOUT = 15000; // 15 seconds

/**
 * Client Caching for Performance
 */
let cachedUpstashIndex: Index | null = null;
let cachedGroqClient: Groq | null = null;

/**
 * Get or create cached Upstash Vector client
 */
function getUpstashIndex(): Index {
  if (cachedUpstashIndex) {
    return cachedUpstashIndex;
  }

  if (
    !process.env.UPSTASH_VECTOR_REST_URL ||
    !process.env.UPSTASH_VECTOR_REST_TOKEN
  ) {
    throw new Error(
      "Missing Upstash credentials. Check UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN in .env.local"
    );
  }

  cachedUpstashIndex = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });

  return cachedUpstashIndex;
}

/**
 * Get or create cached Groq client
 */
function getGroqClient(): Groq {
  if (cachedGroqClient) {
    return cachedGroqClient;
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY in .env.local");
  }

  cachedGroqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  return cachedGroqClient;
}

/**
 * Query Upstash Vector database with timeout protection
 */
async function queryVectors(
  query: string,
  topK: number = TOP_K
): Promise<VectorResult[]> {
  try {
    if (!query || query.trim().length === 0) {
      throw new Error("Query cannot be empty");
    }

    const index = getUpstashIndex();

    // Add timeout protection
    const queryPromise = index.query<VectorMetadata>({
      data: query,
      topK: topK,
      includeMetadata: true,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Vector query timeout")), QUERY_TIMEOUT)
    );

    const results = await Promise.race([queryPromise, timeoutPromise]);

    if (!results) {
      throw new Error("No results returned from vector database");
    }

    return results
      .filter((result) => result.id != null)
      .map((result) => ({
        id: result.id,
        score: result.score || 0,
        metadata: result.metadata,
      }));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("unauthorized")) {
        throw new Error("Invalid Upstash credentials. Check your token.");
      }
      if (error.message.includes("timeout")) {
        throw new Error("Vector query timed out. Upstash may be slow or unavailable.");
      }
      if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
        throw new Error("Cannot connect to Upstash. Check network connection.");
      }
    }
    throw new Error(`Failed to query vector database: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate response using Groq with timeout protection
 */
async function generateResponseWithGroq(
  prompt: string,
  model: string = DEFAULT_MODEL
): Promise<string> {
  try {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt cannot be empty");
    }

    if (prompt.length > 30000) {
      throw new Error("Prompt too long (max 30000 characters)");
    }

    const client = getGroqClient();

    // Add timeout protection
    const completionPromise = client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content:
            "You are an AI digital twin. Answer questions as if you are the person, speaking in first person about your background, skills, and experience. Be professional, concise, and authentic.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      stream: false,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Groq generation timeout")), GENERATION_TIMEOUT)
    );

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    const response = completion.choices?.[0]?.message?.content;

    if (!response || response.trim().length === 0) {
      throw new Error("Groq returned empty response");
    }

    return response.trim();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("invalid api key")) {
        throw new Error("Invalid Groq API key. Check your GROQ_API_KEY.");
      }
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        throw new Error("Groq rate limit exceeded. Wait before retrying.");
      }
      if (error.message.includes("timeout")) {
        throw new Error("Groq generation timed out. Service may be experiencing high load.");
      }
      if (error.message.includes("model")) {
        throw new Error(`Model '${model}' unavailable. Try 'llama-3.1-8b-instant'.`);
      }
    }
    throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Main RAG query function with comprehensive error handling
 * Optimized for performance with client caching and timeout protection
 */
async function ragQuery(question: string): Promise<string> {
  try {
    // Input validation
    if (!question || question.trim().length === 0) {
      return "Please provide a question.";
    }

    if (question.trim().length > 1000) {
      return "Question is too long (maximum 1000 characters).";
    }

    // Step 1: Query vector database
    const results = await queryVectors(question, TOP_K);

    if (!results || results.length === 0) {
      return "I don't have specific information about that topic in my knowledge base. Try asking about my technical skills, projects, education, or career goals.";
    }

    // Step 2: Extract relevant content with validation
    const contextStrings: string[] = [];
    let validResultsCount = 0;

    for (const result of results) {
      const metadata = result.metadata;
      if (metadata) {
        const title = metadata.title || "Information";
        const content = metadata.content || "";

        if (content && content.trim().length > 0) {
          contextStrings.push(`${title}: ${content}`);
          validResultsCount++;
        }
      }
    }

    if (contextStrings.length === 0) {
      return "I found some information but couldn't extract meaningful details. The database may need to be repopulated with the correct data structure.";
    }

    // Step 3: Generate response with context
    const context = contextStrings.join("\n\n");
    const prompt = `Based on the following information about yourself, answer the question.
Speak in first person as if you are describing your own background.
Be professional, concise, and authentic.

Your Information:
${context}

Question: ${question}

Provide a helpful, professional response:`;

    const response = await generateResponseWithGroq(prompt);
    return response;

  } catch (error) {
    // Return user-friendly error messages
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "An unexpected error occurred. Please try again.";
  }
}

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "query-digital-twin",
    description:
      "Query the digital twin's professional profile using RAG (Retrieval-Augmented Generation). Ask questions about work experience, technical skills, projects, education, or career goals. The response will be generated based on vectorized profile data stored in Upstash Vector and enhanced by Groq's LLaMA model.",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description:
            "The question to ask about the person's professional background, skills, or experience",
        },
      },
      required: ["question"],
    },
  },
];

// Create MCP server instance
const server = new Server(
  {
    name: "digital-twin-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Error handler (silent for stdio)
server.onerror = () => {};

// Handle list tools request
// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (name === "query-digital-twin") {
      const question = args?.question as string;

      if (!question) {
        throw new Error("Question parameter is required");
      }

      try {
        const answer = await ragQuery(question);

        return {
          content: [
            {
              type: "text",
              text: answer,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error querying digital twin: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    throw error;
  }
});

// Start server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Prevent the process from exiting
    // The transport will keep stdin open and listening
    // This interval ensures the event loop stays active
    setInterval(() => {}, 1000 * 60 * 60); // Keep alive indefinitely
  } catch (error) {
    process.exit(1);
  }
}

main().catch(() => {
  process.exit(1);
});
