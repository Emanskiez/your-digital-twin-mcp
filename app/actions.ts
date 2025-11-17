"use server";

import { Index } from "@upstash/vector";
import Groq from "groq-sdk";

const DEFAULT_MODEL = "llama-3.1-8b-instant";

type QueryResult = {
  response: string;
  sources: Array<{ title: string; score: number }>;
  error?: string;
};

export async function queryDigitalTwin(question: string): Promise<QueryResult> {
  try {
    // Initialize Upstash Vector
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });

    // Initialize Groq
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });

    // Step 1: Query vector database
    const results = await index.query({
      data: question,
      topK: 3,
      includeMetadata: true,
    });

    if (!results || results.length === 0) {
      return {
        response: "I don't have specific information about that topic.",
        sources: [],
      };
    }

    // Step 2: Extract relevant content
    const sources: Array<{ title: string; score: number }> = [];
    const topDocs: string[] = [];

    for (const result of results) {
      const metadata = result.metadata || {};
      const title = (metadata.title as string) || "Information";
      const content = (metadata.content as string) || "";
      const score = result.score;

      sources.push({ title, score });

      if (content) {
        topDocs.push(`${title}: ${content}`);
      }
    }

    if (topDocs.length === 0) {
      return {
        response: "I found some information but couldn't extract details.",
        sources,
      };
    }

    // Step 3: Generate response with Groq
    const context = topDocs.join("\n\n");
    const prompt = `Based on the following information about yourself, answer the question.
Speak in first person as if you are describing your own background.

Your Information:
${context}

Question: ${question}

Provide a helpful, professional response:`;

    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an AI digital twin. Answer questions as if you are the person, speaking in first person about your background, skills, and experience.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content?.trim() || "No response generated.";

    return {
      response,
      sources,
    };
  } catch (error) {
    console.error("Error in queryDigitalTwin:", error);
    return {
      response: "Sorry, I encountered an error while processing your request. Please try again.",
      sources: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
