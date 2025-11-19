"use server";

import { Index } from "@upstash/vector";
import Groq from "groq-sdk";

/**
 * Main RAG query function with conversation history support
 */
export async function queryDigitalTwin(
  question: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  try {
    // Input validation
    if (!question || question.trim().length === 0) {
      return "Please provide a question.";
    }

    if (question.trim().length > 1000) {
      return "Question is too long (maximum 1000 characters).";
    }

    // Check for required environment variables
    const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL;
    const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN;
    const groqKey = process.env.GROQ_API_KEY;

    if (!upstashUrl || !upstashToken) {
      console.error("Missing Upstash credentials");
      return "⚠️ Database Error: Upstash credentials missing. Check your .env.local file.";
    }

    if (!groqKey) {
      console.error("Missing Groq API key");
      return "⚠️ API Error: Groq API key missing. Check your .env.local file.";
    }

    console.log("Querying with question:", question);

    // Initialize Upstash Index
    let results;
    try {
      const index = new Index({
        url: upstashUrl,
        token: upstashToken,
      });

      console.log("Querying Upstash Vector database...");
      results = await index.query({
        data: question,
        topK: 3,
        includeMetadata: true,
      });
      console.log("Upstash query successful, results:", results?.length);
    } catch (upstashError) {
      console.error("Upstash Vector Error:", upstashError);
      return "⚠️ Database Error: Could not query the vector database. Please check your Upstash credentials.";
    }

    if (!results || results.length === 0) {
      console.log("No results from Upstash, but continuing with Groq for conversational response");
      // Even without database results, let Groq provide a conversational response
    }

    // Extract context from results if available
    const contextStrings: string[] = [];
    if (results && results.length > 0) {
      for (const result of results) {
        const metadata = result.metadata as any;
        if (metadata && metadata.content) {
          const title = metadata.title || "Information";
          contextStrings.push(`${title}: ${metadata.content}`);
        }
      }
    }

    console.log("Context prepared, items:", contextStrings.length);

    // Generate response using Groq
    try {
      const groqClient = new Groq({
        apiKey: groqKey,
      });

      console.log("Calling Groq API...");
      
      // Build more intelligent system prompt with conversation awareness
      let systemPrompt = `You are an AI digital twin representing Chris Emmanuel Dizon, a BSIT 4 student at St. Paul University Philippines. You are chatting with a stranger/visitor who is interested in learning about Chris's background, skills, and experience.

KEY INSTRUCTIONS:
1. CONTEXT AWARENESS: Always consider the full conversation history. Understand if follow-up questions relate to previous topics or if the conversation is shifting to a new topic.
2. TOPIC ADAPTATION: Detect when a visitor is:
   - Asking follow-up questions on the same topic (provide deeper insights or details)
   - Shifting to a new topic (acknowledge the shift and provide fresh perspective)
   - Asking clarification or related questions (connect to previous context)
3. PORTFOLIO REFERENCES: When appropriate, guide visitors to relevant sections of the portfolio page:
   - For skills: "You can see more in the portfolio's Skills section"
   - For projects: "Check out the RAG Food Project or Network Lab in the portfolio"
   - For goals: "His detailed goals are outlined in the portfolio"
   - For education: "More details on education and certifications are on the portfolio"
   - For experience: "Review specific achievements in the portfolio's projects section"
4. STAY FOCUSED: Answer ONLY what is asked. Do not add unnecessary information or go off-topic.
5. BE CONCISE: Keep responses short (2-3 sentences maximum unless more detail is essential). Avoid rambling.
6. SPEAK IN THIRD PERSON: Refer to Chris as "he", "Chris", or "I (Chris)" - NOT assume the visitor is Chris.
7. NO REPETITION: Reference earlier points naturally without repeating word-for-word. Build on previous answers.
8. PROFESSIONAL TONE: Be friendly but professional. This is a portfolio chatbot, not casual chat.
9. DIRECT ANSWERS: Lead with the answer to the question immediately.
10. DIRECT TO PAGE SECTIONS: If specific detailed information isn't in your knowledge base but exists in the portfolio, tell visitors exactly where to find it.

CHRIS'S PROFILE:
- Role: BSIT 4 student at St. Paul University Philippines
- Location: Tuguegarao City, Cagayan Valley, Philippines (studies in Philippines)
- Career Status: Seeking internship/graduate roles in Network Engineering
- Core Interests: Network Engineering, Cloud Infrastructure, Network Security
- Technical Skills: IP Networking, routing, switching, VLANs, network security, Linux, cloud networking, TCP/IP
- Current Goal: CCNA certification pursuit with hands-on networking experience
- Focus Areas: Enterprise Networking, Cloud Networking, Network Automation

PORTFOLIO SECTIONS AVAILABLE:
- Hero Section: Introduction and career focus
- Skills Section: Lists expertise areas (Networking, Technical, Tools, Soft Skills)
- Fields of Interest: Network Engineering, Enterprise Networking, Cloud Networking, Network Security, Network Automation
- Footer Contact: Location, phone, email, social media, and map

RESPONSE GUIDELINES:
- If asked about experience: Provide specifics or direct to "projects" in portfolio
- If asked about skills: Mention key ones, direct to portfolio's Skills section for complete list
- If asked about goals: Share immediate/short/long-term, direct to portfolio for details
- If asked about education: Mention BSIT specialization, direct to portfolio's education section
- If asked about certifications: Mention CCNA in progress, direct to portfolio for target certifications
- If asked about projects: Describe the RAG Food Project or Network Labs, direct to portfolio for details
- If follow-up detected: Reference previous context and expand or clarify
- If topic shifts: Acknowledge and provide answer with fresh perspective
- If information is unavailable: Say "I don't have that specific information, but you can find more details in the portfolio's [section name]"
- If question is unclear: Ask for clarification briefly
- Never fabricate achievements or experience

CONVERSATION MEMORY: You have access to the full conversation history below. Use this to:
- Understand what topics have been covered
- Detect if current question is related to previous ones
- Avoid repeating already-discussed points
- Provide progressive depth to the conversation
- Notice when the visitor changes topics
- Guide them to new portfolio sections when they shift topics`;

      // Build messages array including conversation history
      const messages: any[] = [
        {
          role: "system",
          content: systemPrompt,
        },
      ];

      // Add conversation history if available (excluding the current question)
      if (conversationHistory && conversationHistory.length > 0) {
        for (const historyItem of conversationHistory) {
          messages.push({
            role: historyItem.role,
            content: historyItem.content,
          });
        }
        console.log(`Added ${conversationHistory.length} history items to context`);
      }

      // Build user prompt based on whether we have context or not
      let userMessage;
      if (contextStrings.length > 0) {
        const context = contextStrings.join("\n\n");
        userMessage = `RELEVANT INFORMATION ABOUT CHRIS:
${context}

VISITOR'S QUESTION: ${question}

INSTRUCTIONS FOR YOUR RESPONSE:
- Analyze if this question is a follow-up to previous messages or a new topic
- If it's a follow-up: Reference the previous context naturally and provide deeper insights
- If it's a new topic: Acknowledge the shift and answer directly
- Keep it concise (2-3 sentences max)
- Reference prior discussion if relevant, but don't repeat verbatim
- IMPORTANT: If the answer requires more detail than you have, suggest which portfolio section they should visit
- Guide them to specific portfolio areas: Hero, Skills, Fields of Interest, Projects, Education, Footer (Contact/Location)`;
      } else {
        userMessage = `VISITOR'S QUESTION: ${question}

INSTRUCTIONS FOR YOUR RESPONSE:
- Analyze the conversation history above to understand context
- If this is a follow-up question: Connect it to previous topics and provide expanded answers
- If this is a new topic: Start fresh with a clear answer
- Keep answers brief (2-3 sentences)
- Focus only on what's asked
- If more detail is needed, suggest they check the portfolio - specify which section (Hero, Skills, Fields of Interest, Projects, Education, or Footer)`;
      }

      // Add the current user question
      messages.push({
        role: "user",
        content: userMessage,
      });

      let completion;
      let retries = 0;
      const maxRetries = 2;

      while (retries < maxRetries) {
        try {
          completion = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: messages,
            temperature: 0.5, // Lower for more focused, concise responses
            max_tokens: 300, // Reduced for shorter answers
            top_p: 0.9,
          });
          break; // Success, exit retry loop
        } catch (retryError) {
          retries++;
          console.error(`Groq API attempt ${retries} failed:`, retryError);
          
          if (retries < maxRetries) {
            console.log(`Retrying (${retries}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          } else {
            throw retryError; // All retries exhausted
          }
        }
      }

      if (!completion) {
        // Fallback: Return information from the database directly if Groq fails
        console.log("Groq failed, returning fallback response");
        
        if (contextStrings.length > 0) {
          const fallbackResponse = contextStrings
            .map(str => str.split(":").slice(1).join(":").trim())
            .filter(Boolean)
            .join(" ");
          
          if (fallbackResponse) {
            return `Here's what I know: ${fallbackResponse.substring(0, 300)}...`;
          }
        }
        return "I couldn't generate a response at the moment. Please try again in a moment.";
      }

      const response = completion.choices?.[0]?.message?.content;

      if (!response || response.trim().length === 0) {
        console.log("Empty response from Groq");
        return "I couldn't generate a response. Please try again.";
      }

      console.log("Groq response successful");
      return response.trim();
    } catch (groqError) {
      console.error("Groq API Error:", groqError);
      const errorMessage = groqError instanceof Error ? groqError.message : String(groqError);
      
      // If Groq fails completely, try to provide helpful fallback
      if (contextStrings && contextStrings.length > 0) {
        console.log("Groq failed, using fallback response from database");
        const fallbackResponse = contextStrings
          .map(str => {
            const parts = str.split(":");
            if (parts.length > 1) {
              return parts.slice(1).join(":").trim();
            }
            return str;
          })
          .filter(Boolean)
          .join("\n\n");
        
        if (fallbackResponse) {
          return `Here's what I found: ${fallbackResponse.substring(0, 400)}`;
        }
      }
      
      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        return "⚠️ Authentication Error: Your Groq API key is invalid or expired. Check your .env.local file.";
      }
      if (errorMessage.includes("429")) {
        return "⚠️ Rate Limit: Too many requests. Please wait a moment and try again.";
      }
      if (errorMessage.includes("500") || errorMessage.includes("Internal server error")) {
        return "⚠️ Service Issue: The AI service is temporarily experiencing issues. Please try again in a moment.";
      }
      
      return `⚠️ Error: Service temporarily unavailable.`;
    }
  } catch (error) {
    console.error("Digital Twin Query Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `⚠️ Unexpected Error: ${errorMessage}`;
  }
}
