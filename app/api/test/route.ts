import { NextResponse } from "next/server";
import { Index } from "@upstash/vector";
import Groq from "groq-sdk";

export async function GET() {
  try {
    // Test environment variables
    const envCheck = {
      hasUpstashUrl: !!process.env.UPSTASH_VECTOR_REST_URL,
      hasUpstashToken: !!process.env.UPSTASH_VECTOR_REST_TOKEN,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      upstashUrlLength: process.env.UPSTASH_VECTOR_REST_URL?.length || 0,
      upstashTokenLength: process.env.UPSTASH_VECTOR_REST_TOKEN?.length || 0,
      groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
    };

    // Test Upstash connection
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });

    const results = await index.query({
      data: "test query",
      topK: 1,
      includeMetadata: true,
    });

    // Test Groq connection
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 10,
    });

    return NextResponse.json({
      success: true,
      envCheck,
      vectorResults: results.length,
      groqResponse: completion.choices[0]?.message?.content,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
