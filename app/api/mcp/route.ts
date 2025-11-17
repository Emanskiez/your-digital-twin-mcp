import { NextRequest, NextResponse } from "next/server";
import { ragQuery, healthCheck } from "@/lib/rag";

/**
 * MCP HTTP API Endpoint with SSE Support
 * Handles JSON-RPC 2.0 requests for the Model Context Protocol
 * Supports both standard HTTP and Server-Sent Events (SSE) for mcp-remote
 */

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

interface SSEMessage {
  event?: string;
  data: string;
}

/**
 * Create SSE message format
 */
function formatSSEMessage(message: SSEMessage): string {
  let formatted = "";
  if (message.event) {
    formatted += `event: ${message.event}\n`;
  }
  formatted += `data: ${message.data}\n\n`;
  return formatted;
}

// JSON-RPC Error Codes
const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

/**
 * Create JSON-RPC success response
 */
function createSuccessResponse(id: string | number, result: any): JSONRPCResponse {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

/**
 * Create JSON-RPC error response
 */
function createErrorResponse(
  id: string | number | null,
  error: JSONRPCError
): JSONRPCResponse {
  return {
    jsonrpc: "2.0",
    id: id || 0,
    error,
  };
}

/**
 * Handle MCP initialize request
 */
function handleInitialize() {
  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "digital-twin-mcp-server",
      version: "1.0.0",
    },
  };
}

/**
 * Handle MCP tools/list request
 */
function handleToolsList() {
  return {
    tools: [
      {
        name: "query-digital-twin",
        description:
          "Query the digital twin's professional profile using RAG (Retrieval-Augmented Generation). Ask questions about work experience, technical skills, projects, education, or career goals.",
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
      {
        name: "health-check",
        description:
          "Check the health status of all services (Upstash Vector, Groq API, environment configuration)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
}

/**
 * Handle MCP tools/call request
 */
async function handleToolsCall(params: any) {
  const { name, arguments: args } = params;

  if (!name) {
    throw {
      code: ErrorCodes.INVALID_PARAMS,
      message: "Tool name is required",
    };
  }

  switch (name) {
    case "query-digital-twin": {
      const question = args?.question;

      if (!question || typeof question !== "string") {
        throw {
          code: ErrorCodes.INVALID_PARAMS,
          message: "Question parameter is required and must be a string",
        };
      }

      const result = await ragQuery(question);

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${result.error || "Unknown error occurred"}`,
            },
          ],
          isError: true,
        };
      }

      // Include context information in response
      let responseText = result.answer;
      
      if (result.context && result.context.length > 0) {
        responseText += "\n\n---\n**Sources:**\n";
        result.context.forEach((ctx, idx) => {
          responseText += `${idx + 1}. ${ctx.title} (relevance: ${(ctx.score * 100).toFixed(1)}%)\n`;
        });
      }

      if (result.duration) {
        responseText += `\n*Response time: ${result.duration}ms*`;
      }

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    }

    case "health-check": {
      const result = await healthCheck();

      let statusText = `**Health Check Results**\n\n`;
      statusText += `Overall Status: ${result.success ? "✅ Healthy" : "❌ Unhealthy"}\n\n`;
      statusText += `**Services:**\n`;
      statusText += `- Environment: ${result.services.environment ? "✅" : "❌"}\n`;
      statusText += `- Upstash Vector: ${result.services.upstash ? "✅" : "❌"}\n`;
      statusText += `- Groq API: ${result.services.groq ? "✅" : "❌"}\n`;

      if (result.details) {
        statusText += `\n**Details:**\n`;
        if (result.details.vectorCount !== undefined) {
          statusText += `- Vector Count: ${result.details.vectorCount}\n`;
        }
        if (result.details.groqModel) {
          statusText += `- Model: ${result.details.groqModel}\n`;
        }
        if (result.details.upstashUrl) {
          statusText += `- Upstash URL: ${result.details.upstashUrl}\n`;
        }
      }

      if (result.errors.length > 0) {
        statusText += `\n**Errors:**\n`;
        result.errors.forEach((error) => {
          statusText += `- ${error}\n`;
        });
      }

      return {
        content: [
          {
            type: "text",
            text: statusText,
          },
        ],
        isError: !result.success,
      };
    }

    default:
      throw {
        code: ErrorCodes.METHOD_NOT_FOUND,
        message: `Unknown tool: ${name}`,
      };
  }
}

/**
 * Main POST handler for MCP requests (SSE and standard JSON-RPC)
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const acceptHeader = request.headers.get("accept") || "";
  const isSSE = acceptHeader.includes("text/event-stream");

  // Handle SSE transport for mcp-remote
  if (isSSE) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection message
          controller.enqueue(
            encoder.encode(
              formatSSEMessage({
                event: "message",
                data: JSON.stringify({
                  jsonrpc: "2.0",
                  method: "server/ready",
                }),
              })
            )
          );

          // Parse request body
          let body: JSONRPCRequest;
          try {
            const text = await request.text();
            body = JSON.parse(text);
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                formatSSEMessage({
                  event: "message",
                  data: JSON.stringify(
                    createErrorResponse(null, {
                      code: ErrorCodes.PARSE_ERROR,
                      message: "Invalid JSON",
                    })
                  ),
                })
              )
            );
            controller.close();
            return;
          }

          // Validate JSON-RPC structure
          if (!body.jsonrpc || body.jsonrpc !== "2.0") {
            controller.enqueue(
              encoder.encode(
                formatSSEMessage({
                  event: "message",
                  data: JSON.stringify(
                    createErrorResponse(body.id || null, {
                      code: ErrorCodes.INVALID_REQUEST,
                      message: "Invalid JSON-RPC version (must be 2.0)",
                    })
                  ),
                })
              )
            );
            controller.close();
            return;
          }

          if (!body.method || typeof body.method !== "string") {
            controller.enqueue(
              encoder.encode(
                formatSSEMessage({
                  event: "message",
                  data: JSON.stringify(
                    createErrorResponse(body.id || null, {
                      code: ErrorCodes.INVALID_REQUEST,
                      message: "Method is required",
                    })
                  ),
                })
              )
            );
            controller.close();
            return;
          }

          // Handle different MCP methods
          let result: any;

          try {
            switch (body.method) {
              case "initialize":
                result = handleInitialize();
                break;

              case "notifications/initialized":
                // Handle initialization notification (no response needed)
                controller.close();
                return;

              case "tools/list":
                result = handleToolsList();
                break;

              case "tools/call":
                result = await handleToolsCall(body.params);
                break;

              default:
                controller.enqueue(
                  encoder.encode(
                    formatSSEMessage({
                      event: "message",
                      data: JSON.stringify(
                        createErrorResponse(body.id, {
                          code: ErrorCodes.METHOD_NOT_FOUND,
                          message: `Method not found: ${body.method}`,
                        })
                      ),
                    })
                  )
                );
                controller.close();
                return;
            }

            // Send success response
            controller.enqueue(
              encoder.encode(
                formatSSEMessage({
                  event: "message",
                  data: JSON.stringify(createSuccessResponse(body.id, result)),
                })
              )
            );
          } catch (error: any) {
            // Handle JSON-RPC errors
            if (error.code && error.message) {
              controller.enqueue(
                encoder.encode(
                  formatSSEMessage({
                    event: "message",
                    data: JSON.stringify(createErrorResponse(body.id, error)),
                  })
                )
              );
            } else {
              // Handle unexpected errors
              console.error("MCP API Error:", error);
              controller.enqueue(
                encoder.encode(
                  formatSSEMessage({
                    event: "message",
                    data: JSON.stringify(
                      createErrorResponse(body.id, {
                        code: ErrorCodes.INTERNAL_ERROR,
                        message: "Internal server error",
                        data: error instanceof Error ? error.message : String(error),
                      })
                    ),
                  })
                )
              );
            }
          }

          controller.close();
        } catch (error) {
          console.error("Fatal MCP SSE Error:", error);
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Handle standard HTTP JSON-RPC requests
  try {
    // Parse JSON-RPC request
    let body: JSONRPCRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        createErrorResponse(null, {
          code: ErrorCodes.PARSE_ERROR,
          message: "Invalid JSON",
        }),
        { status: 400 }
      );
    }

    // Validate JSON-RPC structure
    if (!body.jsonrpc || body.jsonrpc !== "2.0") {
      return NextResponse.json(
        createErrorResponse(body.id || null, {
          code: ErrorCodes.INVALID_REQUEST,
          message: "Invalid JSON-RPC version (must be 2.0)",
        }),
        { status: 400 }
      );
    }

    if (!body.method || typeof body.method !== "string") {
      return NextResponse.json(
        createErrorResponse(body.id || null, {
          code: ErrorCodes.INVALID_REQUEST,
          message: "Method is required",
        }),
        { status: 400 }
      );
    }

    // Handle different MCP methods
    let result: any;

    try {
      switch (body.method) {
        case "initialize":
          result = handleInitialize();
          break;

        case "tools/list":
          result = handleToolsList();
          break;

        case "tools/call":
          result = await handleToolsCall(body.params);
          break;

        default:
          return NextResponse.json(
            createErrorResponse(body.id, {
              code: ErrorCodes.METHOD_NOT_FOUND,
              message: `Method not found: ${body.method}`,
            }),
            { status: 404 }
          );
      }

      return NextResponse.json(createSuccessResponse(body.id, result));
    } catch (error: any) {
      // Handle JSON-RPC errors
      if (error.code && error.message) {
        return NextResponse.json(
          createErrorResponse(body.id, error),
          { status: 400 }
        );
      }

      // Handle unexpected errors
      console.error("MCP API Error:", error);
      return NextResponse.json(
        createErrorResponse(body.id, {
          code: ErrorCodes.INTERNAL_ERROR,
          message: "Internal server error",
          data: error instanceof Error ? error.message : String(error),
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Fatal MCP API Error:", error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: 0,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: "Fatal server error",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for API endpoint info
 */
export async function GET() {
  return NextResponse.json({
    name: "Digital Twin MCP Server",
    version: "1.0.0",
    protocol: "Model Context Protocol (MCP)",
    transport: "HTTP",
    methods: ["initialize", "tools/list", "tools/call"],
    tools: [
      {
        name: "query-digital-twin",
        description: "Query professional profile using RAG",
      },
      {
        name: "health-check",
        description: "Check service health status",
      },
    ],
    documentation: "Send POST requests with JSON-RPC 2.0 format",
    example: {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "query-digital-twin",
        arguments: {
          question: "What are your technical skills?",
        },
      },
    },
  });
}
