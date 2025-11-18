import { config } from "dotenv";
import { Index } from "@upstash/vector";
import Groq from "groq-sdk";

// Load environment variables
config({ path: ".env.local" });

console.log("\n🔍 ENVIRONMENT VARIABLES CHECK\n");
console.log("================================");
console.log("UPSTASH_VECTOR_REST_URL:", process.env.UPSTASH_VECTOR_REST_URL ? "✅ Set" : "❌ Missing");
console.log("UPSTASH_VECTOR_REST_TOKEN:", process.env.UPSTASH_VECTOR_REST_TOKEN ? "✅ Set" : "❌ Missing");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "✅ Set" : "❌ Missing");
console.log("\nValues:");
console.log("URL:", process.env.UPSTASH_VECTOR_REST_URL);
console.log("TOKEN:", process.env.UPSTASH_VECTOR_REST_TOKEN?.substring(0, 20) + "...");
console.log("GROQ:", process.env.GROQ_API_KEY?.substring(0, 20) + "...");

async function testConnections() {
  console.log("\n\n🧪 TESTING UPSTASH VECTOR\n");
  console.log("================================");
  
  try {
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });

    // Test 1: Query the database
    console.log("Test 1: Querying database...");
    const results = await index.query({
      data: "What is my work experience?",
      topK: 3,
      includeMetadata: true,
    });

    if (results && results.length > 0) {
      console.log("✅ Vector query successful!");
      console.log(`   Found ${results.length} results`);
      results.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.id} (score: ${r.score?.toFixed(4)})`);
        console.log(`      Title: ${r.metadata?.title}`);
      });
    } else {
      console.log("⚠️  Query returned no results");
    }

    // Test 2: Get vector count
    console.log("\nTest 2: Checking vector count...");
    const info = await index.info();
    console.log("✅ Database info retrieved!");
    console.log(`   Vector count: ${info.vectorCount}`);
    console.log(`   Dimension: ${info.dimension}`);
    
  } catch (error: any) {
    console.log("❌ Upstash Vector Error:");
    console.log("   Message:", error.message);
    console.log("   Stack:", error.stack);
  }

  console.log("\n\n🧪 TESTING GROQ API\n");
  console.log("================================");
  
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });

    console.log("Test 1: Simple completion...");
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: "Say 'Hello' in one word",
        },
      ],
      max_tokens: 10,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    console.log("✅ Groq API successful!");
    console.log(`   Response: "${response}"`);
    console.log(`   Model: ${completion.model}`);
    console.log(`   Tokens used: ${completion.usage?.total_tokens}`);
    
  } catch (error: any) {
    console.log("❌ Groq API Error:");
    console.log("   Message:", error.message);
    if (error.response) {
      console.log("   Status:", error.response.status);
      console.log("   Data:", error.response.data);
    }
  }

  console.log("\n\n🧪 TESTING FULL RAG WORKFLOW\n");
  console.log("================================");
  
  try {
    console.log("Simulating full queryDigitalTwin function...");
    
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });

    // Step 1: Vector search
    console.log("\nStep 1: Vector search...");
    const results = await index.query({
      data: "Tell me about my networking skills",
      topK: 3,
      includeMetadata: true,
    });
    console.log(`✅ Found ${results.length} relevant documents`);

    // Step 2: Build context
    const topDocs: string[] = [];
    const sources: Array<{ title: string; score: number }> = [];

    for (const result of results) {
      const metadata = result.metadata || {};
      const title = (metadata.title as string) || "Information";
      const content = (metadata.content as string) || "";
      const score = result.score || 0;

      sources.push({ title, score });
      if (content) {
        topDocs.push(`${title}: ${content}`);
      }
    }

    console.log(`✅ Built context from ${topDocs.length} documents`);

    // Step 3: Generate response
    console.log("\nStep 2: Generating AI response...");
    const context = topDocs.join("\n\n");
    const prompt = `Based on the following information about yourself, answer the question.
Speak in first person as if you are describing your own background.

Your Information:
${context}

Question: Tell me about my networking skills

Provide a helpful, professional response:`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an AI digital twin. Answer questions as if you are the person, speaking in first person about your background, skills, and experience.",
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
    
    console.log("✅ Full RAG workflow successful!");
    console.log("\nGenerated Response:");
    console.log("-------------------");
    console.log(response);
    console.log("\nSources:");
    sources.forEach((s, i) => {
      console.log(`${i + 1}. ${s.title} (relevance: ${(s.score * 100).toFixed(1)}%)`);
    });
    
  } catch (error: any) {
    console.log("❌ RAG Workflow Error:");
    console.log("   Message:", error.message);
    console.log("   Stack:", error.stack);
  }

  console.log("\n\n✅ ALL TESTS COMPLETED\n");
}

testConnections().catch(console.error);
