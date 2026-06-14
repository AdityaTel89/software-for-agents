import Link from "next/link";
import Navbar from "@/components/ui/navbar";

export default function Page() {
  return (
    <div className="bg-background text-foreground font-mono min-h-screen flex flex-col transition-colors duration-300">
      {/* Shared Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-16 max-w-4xl pt-28 pb-12 flex-1 leading-relaxed">
        
        {/* Title */}
        <div className="border border-foreground/20 p-6 mb-12">
          <h1 className="text-xl lg:text-3xl font-bold tracking-wide">HOW IT WORKS</h1>
          <p className="text-xs text-muted-foreground mt-2">
            The engineering gap between REST APIs and LLM Tool-Calling.
          </p>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-10">
          
          <section className="border-l border-foreground/20 pl-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3">
              1. The Vibe-to-Verify Gap
            </h2>
            <p className="text-xs text-foreground/80">
              When standard developers integrate third-party APIs into LLM workflows, they often use generic, auto-generated OpenAPI-to-MCP wrappers. While these wrappers parse HTTP methods into tool structures, they do not validate how effectively an LLM can invoke them. 
            </p>
            <p className="text-xs text-foreground/80 mt-3">
              LLMs rely heavily on semantic definitions. If a parameter is named <code className="bg-foreground/10 px-1 text-[11px]">parent</code>, and the description is simply &quot;The parent object&quot;, the LLM will hallucinate the parameter structure, passing strings instead of objects, or pages instead of databases.
            </p>
          </section>

          <section className="border-l border-foreground/20 pl-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3">
              2. Our Eval Harness Loop
            </h2>
            <p className="text-xs text-foreground/80">
              AgentReady bridges this gap by testing every server against a local, repeatable evaluation suite (built using Google Gen AI SDK and Gemini 2.5 Flash). 
            </p>
            <ul className="text-xs text-muted-foreground mt-3 list-disc pl-4 flex flex-col gap-2">
              <li><strong>Concrete Scenarios</strong>: We define 10-20 complex, multi-step tasks per API.</li>
              <li><strong>Live Execution</strong>: Gemini is given access to the server and attempts the tasks.</li>
              <li><strong>API Verification</strong>: A separate script queries the target API after the run to verify if the changes actually took effect.</li>
              <li><strong>Error Classification</strong>: Failures are classified into: schema limits, ambiguous descriptions, or silent runtime errors.</li>
            </ul>
          </section>

          <section className="border-l border-foreground/20 pl-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3">
              3. Iterative Optimization
            </h2>
            <p className="text-xs text-foreground/80">
              We update the server based on the eval scoring report. We tighten validation schemas using Zod, write comprehensive tool descriptions, and normalize HTTP error codes into actionable compiler hints. The server is evaluated repeatedly until success rates hit <strong>&ge;85%</strong>.
            </p>
          </section>

          <section className="border border-foreground/20 p-6 bg-foreground/5">
            <h3 className="text-xs font-bold uppercase mb-2">Connect to a Verified Server</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Our servers are open-source and hosted as SSE endpoints. Browse the directory to get config files.
            </p>
            <Link
              href="/"
              className="text-xs border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
            >
              Browse Servers
            </Link>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-foreground/20 bg-background py-8">
        <div className="container mx-auto px-4 lg:px-16 max-w-4xl flex justify-between items-center text-xs opacity-50">
          <div>© 2026 AGENTREADY.</div>
          <Link href="/" className="hover:underline">← Directory</Link>
        </div>
      </footer>
    </div>
  );
}
