import { testVercelEnv } from "../test-env";

export default async function TestEnvPage() {
  const env = await testVercelEnv();
  
  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Environment Variables Test</h1>
      <pre>{JSON.stringify(env, null, 2)}</pre>
    </div>
  );
}
