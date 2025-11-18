import { config } from "dotenv";
import { Index } from "@upstash/vector";
import Groq from "groq-sdk";

// Load environment variables
config({ path: ".env.local" });

async function testQuery() {
  try {
    console.log("Testing Upstash Vector connection...");
    
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });

    const results = await index.query({
      data: "What is my work experience?",
      topK: 3,
      includeMetadata: true,
    });

    console.log("✅ Vector query successful!");
    console.log("Results:", JSON.stringify(results, null, 2));

    console.log("\nTesting Groq connection...");
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: "Say hello!",
        },
      ],
      max_tokens: 50,
    });

    console.log("✅ Groq API successful!");
    console.log("Response:", completion.choices[0]?.message?.content);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testQuery();
