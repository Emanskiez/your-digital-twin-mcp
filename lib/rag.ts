"use server";

import { Index } from "@upstash/vector";
import Groq from "groq-sdk";

// Types
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

interface RAGQueryResult {
  success: boolean;
  answer: string;
  context?: Array<{
    title: string;
    content: string;
    score: number;
  }>;
  error?: string;
  errorType?: string;
  duration?: number;
}

// Custom Error Classes
class VectorSearchError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "VectorSearchError";
  }
}

class GroqGenerationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "GroqGenerationError";
  }
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

// Constants
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const TOP_K = 3;
const MAX_QUERY_LENGTH = 1000;
const MAX_PROMPT_LENGTH = 30000;
const QUERY_TIMEOUT = 10000;
const GENERATION_TIMEOUT = 15000;

// Client Caching
let cachedUpstashIndex: Index | null = null;
let cachedGroqClient: Groq | null = null;

/**
 * Validate environment variables
 */
function validateEnvironment(): void {
  const missing: string[] = [];
  
  if (!process.env.UPSTASH_VECTOR_REST_URL) missing.push("UPSTASH_VECTOR_REST_URL");
  if (!process.env.UPSTASH_VECTOR_REST_TOKEN) missing.push("UPSTASH_VECTOR_REST_TOKEN");
  if (!process.env.GROQ_API_KEY) missing.push("GROQ_API_KEY");

  if (missing.length > 0) {
    throw new ConfigurationError(
      "Missing required environment variables: " + missing.join(", ")
    );
  }
}

/**
 * Get or create cached Upstash Vector client
 */
function getUpstashIndex(): Index {
  if (cachedUpstashIndex) {
    return cachedUpstashIndex;
  }

  validateEnvironment();

  cachedUpstashIndex = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
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

  validateEnvironment();

  cachedGroqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
  });

  return cachedGroqClient;
}

/**
 * Query Upstash Vector database with error handling
 */
async function queryVectors(
  query: string,
  topK: number = TOP_K
): Promise<VectorResult[]> {
  try {
    if (!query || query.trim().length === 0) {
      throw new VectorSearchError("Query cannot be empty");
    }

    if (query.trim().length > 5000) {
      throw new VectorSearchError("Query too long (max 5000 characters)");
    }

    const index = getUpstashIndex();
    
    const queryPromise = index.query<VectorMetadata>({
      data: query,
      topK: topK,
      includeMetadata: true,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), QUERY_TIMEOUT)
    );

    const results = await Promise.race([queryPromise, timeoutPromise]);

    if (!results) {
      throw new VectorSearchError("Vector search returned null results");
    }

    return results
      .filter((result) => result.id != null)
      .map((result) => ({
        id: result.id,
        score: result.score || 0,
        metadata: result.metadata,
      }));

  } catch (error) {
    if (error instanceof VectorSearchError || error instanceof ConfigurationError) {
      throw error;
    }

    if (error && typeof error === "object") {
      const err = error as any;
      const status = err.status || err.statusCode;
      const message = err.message || "";

      if (status === 401 || message.includes("unauthorized")) {
        throw new VectorSearchError("Invalid Upstash credentials", error);
      }

      if (status === 404 || message.includes("not found")) {
        throw new VectorSearchError("Vector index not found", error);
      }

      if (status === 429 || message.includes("rate limit")) {
        throw new VectorSearchError("Rate limit exceeded", error);
      }

      if (message.includes("timeout")) {
        throw new VectorSearchError("Request timed out", error);
      }

      if (message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
        throw new VectorSearchError("Cannot connect to Upstash", error);
      }
    }

    throw new VectorSearchError("Failed to search vector database", error);
  }
}

/**
 * Generate response using Groq with error handling
 */
async function generateResponseWithGroq(
  prompt: string,
  model: string = DEFAULT_MODEL
): Promise<string> {
  try {
    if (!prompt || prompt.trim().length === 0) {
      throw new GroqGenerationError("Prompt cannot be empty");
    }

    if (prompt.trim().length > MAX_PROMPT_LENGTH) {
      throw new GroqGenerationError("Prompt too long");
    }

    const client = getGroqClient();

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
      setTimeout(() => reject(new Error("Generation timeout")), GENERATION_TIMEOUT)
    );

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    const response = completion.choices?.[0]?.message?.content;

    if (!response || response.trim().length === 0) {
      throw new GroqGenerationError("Groq returned empty response");
    }

    return response.trim();

  } catch (error) {
    if (error instanceof GroqGenerationError || error instanceof ConfigurationError) {
      throw error;
    }

    if (error && typeof error === "object") {
      const err = error as any;
      const status = err.status || err.statusCode;
      const message = err.message || "";

      if (status === 401 || message.includes("invalid api key")) {
        throw new GroqGenerationError("Invalid Groq API key", error);
      }

      if (status === 429 || message.includes("rate limit")) {
        throw new GroqGenerationError("Groq rate limit exceeded", error);
      }

      if (message.includes("timeout")) {
        throw new GroqGenerationError("Request timed out", error);
      }

      if (status === 400 && message.includes("model")) {
        throw new GroqGenerationError("Model unavailable", error);
      }

      if (message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
        throw new GroqGenerationError("Cannot connect to Groq API", error);
      }

      if (status >= 500) {
        throw new GroqGenerationError("Groq server error", error);
      }
    }

    throw new GroqGenerationError("Failed to generate response", error);
  }
}

/**
 * Main RAG query function
 */
export async function ragQuery(question: string): Promise<RAGQueryResult> {
  const startTime = Date.now();
  
  try {
    if (!question || question.trim().length === 0) {
      return {
        success: false,
        answer: "",
        error: "Question cannot be empty",
        errorType: "ValidationError",
        duration: Date.now() - startTime,
      };
    }

    if (question.trim().length > MAX_QUERY_LENGTH) {
      return {
        success: false,
        answer: "",
        error: "Question too long (max 1000 characters)",
        errorType: "ValidationError",
        duration: Date.now() - startTime,
      };
    }

    let results: VectorResult[];
    try {
      results = await queryVectors(question, TOP_K);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof VectorSearchError) {
        return {
          success: false,
          answer: "",
          error: error.message,
          errorType: "VectorSearchError",
          duration,
        };
      }
      throw error;
    }

    if (!results || results.length === 0) {
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        answer: "I don't have specific information about that topic. Try asking about my technical skills, projects, education, or career goals.",
        context: [],
        duration,
      };
    }

    const topDocs: Array<{ title: string; content: string; score: number }> = [];
    const contextStrings: string[] = [];

    for (const result of results) {
      const metadata = result.metadata;
      if (metadata) {
        const title = metadata.title || "Information";
        const content = metadata.content || "";
        const score = result.score;

        if (content && content.trim().length > 0) {
          topDocs.push({ title, content, score });
          contextStrings.push(title + ": " + content);
        }
      }
    }

    if (topDocs.length === 0) {
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        answer: "I found some information but couldn't extract meaningful details.",
        context: [],
        duration,
      };
    }

    const context = contextStrings.join("\n\n");
    const prompt = "Based on the following information about yourself, answer the question.\nSpeak in first person as if you are describing your own background.\nBe professional, concise, and authentic.\n\nYour Information:\n" + context + "\n\nQuestion: " + question + "\n\nProvide a helpful, professional response:";

    let response: string;
    try {
      response = await generateResponseWithGroq(prompt);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof GroqGenerationError) {
        return {
          success: false,
          answer: "",
          error: error.message,
          errorType: "GroqGenerationError",
          context: topDocs,
          duration,
        };
      }
      throw error;
    }

    const duration = Date.now() - startTime;

    return {
      success: true,
      answer: response,
      context: topDocs,
      duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof ConfigurationError) {
      return {
        success: false,
        answer: "",
        error: error.message,
        errorType: "ConfigurationError",
        duration,
      };
    }

    if (error instanceof VectorSearchError) {
      return {
        success: false,
        answer: "",
        error: error.message,
        errorType: "VectorSearchError",
        duration,
      };
    }

    if (error instanceof GroqGenerationError) {
      return {
        success: false,
        answer: "",
        error: error.message,
        errorType: "GroqGenerationError",
        duration,
      };
    }

    return {
      success: false,
      answer: "",
      error: "An unexpected error occurred",
      errorType: "UnknownError",
      duration,
    };
  }
}

/**
 * Health check function
 */
export async function healthCheck(): Promise<{
  success: boolean;
  services: {
    upstash: boolean;
    groq: boolean;
    environment: boolean;
  };
  errors: string[];
  details?: {
    vectorCount?: number;
    upstashUrl?: string;
    groqModel?: string;
  };
}> {
  const errors: string[] = [];
  const services = {
    upstash: false,
    groq: false,
    environment: false,
  };
  const details: {
    vectorCount?: number;
    upstashUrl?: string;
    groqModel?: string;
  } = {};

  try {
    validateEnvironment();
    services.environment = true;
    
    details.upstashUrl = process.env.UPSTASH_VECTOR_REST_URL?.substring(0, 30) + "...";
    details.groqModel = DEFAULT_MODEL;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      errors.push("Environment: " + error.message);
    }
  }

  if (services.environment) {
    try {
      const index = getUpstashIndex();
      
      await index.query({
        data: "health check test",
        topK: 1,
        includeMetadata: false,
      });
      
      const info = await index.info();
      details.vectorCount = info.vectorCount || 0;
      
      services.upstash = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push("Upstash: " + message);
    }
  }

  if (services.environment) {
    try {
      const client = getGroqClient();
      
      await client.chat.completions.create({
        messages: [{ role: "user", content: "test" }],
        model: DEFAULT_MODEL,
        max_tokens: 5,
      });
      
      services.groq = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push("Groq: " + message);
    }
  }

  const success = services.upstash && services.groq && services.environment;

  return {
    success,
    services,
    errors,
    details,
  };
}
