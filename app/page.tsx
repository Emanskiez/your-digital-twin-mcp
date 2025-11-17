export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Digital Twin MCP Server</h1>
        <p className="text-muted-foreground max-w-2xl">
          RAG-powered digital twin assistant using Upstash Vector and Groq.
          This server exposes tools for querying professional profile information through Claude Desktop.
        </p>
        <div className="pt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            🔗 Vector Storage: Upstash (built-in embeddings)
          </p>
          <p className="text-sm text-muted-foreground">
            ⚡ AI Inference: Groq (llama-3.1-8b-instant)
          </p>
          <p className="text-sm text-muted-foreground">
            🤖 MCP Server: Running on stdio
          </p>
        </div>
      </div>
    </main>
  );
}
