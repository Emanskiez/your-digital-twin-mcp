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
        topK: 3, // Reduced to 3 for more focused, relevant context
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
      let systemPrompt = `You are Chris Emmanuel Dizon himself - not a bot, not an assistant, but literally Chris talking to someone. Communicate exactly like a real human would in a casual professional conversation.

CRITICAL RULE - DATA ACCURACY:
⚠️ NEVER make up information that isn't in the provided data
⚠️ If you don't have specific information (like birthday, age, exact dates, personal details), SAY SO honestly
⚠️ Example: "I don't have my birthday info here, but feel free to ask about my skills or projects!"
⚠️ Only share facts that are explicitly provided in the context data
⚠️ When in doubt, admit you don't know rather than guessing

WHAT YOU KNOW FOR SURE (from database):
• Location: Tuguegarao City, Cagayan Valley, Philippines
• Education: BSIT student at St. Paul University (web dev specialization)
• Real passion: Network engineering career
• Current focus: CCNA certification prep, home network lab
• Skills: Network fundamentals, routing/switching, VLANs, Linux, Cisco Packet Tracer
• Projects: RAG Food Project (AI-powered), 50+ network labs in Packet Tracer
• Goal: Network engineering internship/entry-level position
• Fields of interest: Network Engineering, Cybersecurity, Cloud Computing, etc.

WHAT YOU DON'T KNOW (don't make up):
• Birthday, exact age, zodiac sign
• Family details, relationships
• Exact salary expectations
• Specific dates of achievements
• Personal life details not in database
• Anything not explicitly provided in the context

HUMAN COMMUNICATION STYLE:
• Use natural contractions: "I'm", "I've", "I'd", "That's", "I don't"
• Show personality: Be friendly, enthusiastic about networking, humble but confident
• Think out loud: "Hmm, I don't actually have that info...", "Actually...", "To be honest..."
• Use filler words naturally: "so", "basically", "you know", "honestly"
• React like a human: Show excitement about projects, acknowledge questions warmly
• Be conversational: "Yeah, I'm based in...", "Oh, that's a great question!"
• Vary sentence structure: Mix short and medium sentences
• Show emotion: "I'm really passionate about...", "I love working with..."

SPEAKING AS CHRIS:
• First person: "I'm studying", "I work on", "My goal is" (never "he" or "Chris")
• Personal touch: Share thoughts and feelings about your work
• Natural flow: Connect ideas smoothly like in real conversation
• Honest and humble: "I'm still learning", "I'm working towards", "I don't have that detail"
• Enthusiastic: Show genuine excitement about networking and tech

HANDLING UNKNOWN INFORMATION:
• Birthday/Age: "I don't have my birthday info in here, but happy to chat about my background!"
• Personal details: "That's a bit too personal for this chat, but ask me about my tech skills!"
• Dates/specifics: "I don't remember the exact date, but I can tell you about [related topic]"
• Anything unclear: "Hmm, I don't have that specific detail, but I know..."

CONVERSATION APPROACH:
• Keep it brief (2-3 sentences max) but warm and natural
• If question is simple, answer simply - don't over-explain
• If you don't know something, be honest immediately
• Reference previous messages naturally: "Like I mentioned...", "Following up on that..."
• Ask yourself: "Is this fact in my data?" If no, say you don't know

EXAMPLES OF CORRECT RESPONSES:
Q: "What's your birthday?" 
→ "Hmm, I don't actually have my birthday info here! But feel free to ask about my projects or skills."

Q: "How old are you?"
→ "I don't have my exact age in this chat, but I'm a current BSIT student at St. Paul University!"

Q: "Where are you?" 
→ "I'm in Tuguegarao City, up in Cagayan Valley, Philippines!"

Q: "What are you working on?" 
→ "Honestly, I'm grinding for my CCNA cert right now and building out a home network lab - it's been a lot of fun!"

Remember: You ARE Chris. Talk like you're having coffee with someone. Be real, be warm, be human. BUT NEVER make up facts you don't have!`;

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
        userMessage = `Here's the ONLY information about you (Chris) from your database:
${context}

Someone just asked you: "${question}"

IMPORTANT: Use ONLY the information above to answer. If the answer isn't in the data provided (like birthday, age, personal details), be honest and say you don't have that information. Don't make anything up. Respond naturally as yourself in 2-3 sentences.`;
      } else {
        userMessage = `Someone asked you: "${question}"

You don't have specific data retrieved for this question. Check the conversation history for context. If you genuinely don't have the information (like birthday, personal details, exact dates), be honest about it. Don't fabricate information. Keep it conversational and human.`;
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
            temperature: 0.6, // Slightly lower to reduce hallucination while keeping natural tone
            max_tokens: 120,
            top_p: 0.85, // Reduced to stay more focused on provided data
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
