"use server";

export async function testVercelEnv() {
  return {
    hasUpstashUrl: !!process.env.UPSTASH_VECTOR_REST_URL,
    hasUpstashToken: !!process.env.UPSTASH_VECTOR_REST_TOKEN,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    upstashUrlPrefix: process.env.UPSTASH_VECTOR_REST_URL?.substring(0, 30),
    upstashTokenPrefix: process.env.UPSTASH_VECTOR_REST_TOKEN?.substring(0, 20),
    groqKeyPrefix: process.env.GROQ_API_KEY?.substring(0, 20),
  };
}
