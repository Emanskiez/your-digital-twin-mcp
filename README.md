# Digital Twin MCP Server

A Model Context Protocol (MCP) server that provides RAG-powered digital twin assistant functionality using Upstash Vector and Groq.

## Features

- 🤖 **RAG-Powered Queries**: Query professional profile information using Retrieval-Augmented Generation
- 🔗 **Upstash Vector**: Built-in embeddings for semantic search
- ⚡ **Groq AI**: Fast inference using LLaMA 3.1 8B Instant
- 🎯 **MCP Compatible**: Works with Claude Desktop and other MCP clients
- 💻 **TypeScript**: Fully typed with Next.js 15.5+

## Prerequisites

- Node.js 18+ or 20+
- pnpm (recommended package manager)
- Upstash Vector database with populated data
- Groq API key

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
Create `.env.local` with:
```env
UPSTASH_VECTOR_REST_URL="your-upstash-url"
UPSTASH_VECTOR_REST_TOKEN="your-upstash-token"
GROQ_API_KEY="your-groq-api-key"
```

## Running the MCP Server

### Method 1: Direct Execution
```bash
pnpm mcp
```

### Method 2: With Claude Desktop

1. Locate your Claude Desktop configuration file:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add the MCP server configuration:
```json
{
  "mcpServers": {
    "digital-twin": {
      "command": "pnpm",
      "args": ["mcp"],
      "cwd": "C:\\Users\\Manuel\\Desktop\\digital-twin-workshop",
      "env": {
        "UPSTASH_VECTOR_REST_URL": "your-upstash-url",
        "UPSTASH_VECTOR_REST_TOKEN": "your-upstash-token",
        "GROQ_API_KEY": "your-groq-api-key"
      }
    }
  }
}
```

3. Restart Claude Desktop

## Available MCP Tools

### query-digital-twin

Query the digital twin's professional profile using RAG.

**Parameters:**
- `question` (string, required): Question about professional background, skills, or experience

**Example:**
```json
{
  "question": "What are your technical skills?"
}
```

## Project Structure

```
digital-twin-workshop/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles with dark theme
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/
│   └── rag.ts             # RAG server actions
├── data/
│   └── digitaltwin.json   # Profile data
├── mcp-server.ts          # MCP server implementation
├── .env.local             # Environment variables
└── package.json           # Dependencies and scripts
```

## Development

Run the Next.js development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the web interface.

## Technical Stack

- **Framework**: Next.js 15.5.3+ with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS with dark mode
- **Vector DB**: Upstash Vector
- **AI Model**: Groq (LLaMA 3.1 8B Instant)
- **Protocol**: Model Context Protocol (MCP)

## RAG Implementation

The RAG pipeline matches the Python implementation:

1. **Query**: User asks a question
2. **Vector Search**: Queries Upstash Vector for top 3 relevant chunks
3. **Context Building**: Extracts content from matched vectors
4. **Generation**: Groq generates a response using the context
5. **Response**: Returns first-person answer as digital twin

## Troubleshooting

### MCP Server Not Connecting
- Check Claude Desktop logs
- Verify environment variables are set correctly
- Ensure pnpm is in your system PATH
- Try running `pnpm mcp` directly to see errors

### No Results from Vector Search
- Verify Upstash Vector database is populated
- Check `.env.local` credentials
- Test connection using the Python script first

### Groq API Errors
- Verify API key is valid
- Check API rate limits
- Ensure model name is correct

## License

MIT
