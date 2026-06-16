"use client";
import { use, useState } from "react";
import { notFound } from "next/navigation";
import { servers } from "@/lib/data";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";
import ServerStatus from "@/components/ui/server-status";
import { useLiveScore } from "@/components/ui/live-score";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function Page({ params }: PageProps) {
  const { slug } = use(params);
  const server = servers.find((s) => s.slug === slug);

  // Hook must be called unconditionally (before any early return / notFound guard)
  const liveScore = useLiveScore(server?.slug ?? '', {
    successRate: server?.successRate ?? 0,
    totalTasks: server?.totalTasks ?? 0,
    avgSteps: server?.avgSteps ?? 0,
  });

  const [os, setOs] = useState<"windows" | "mac">("windows");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!server) {
    notFound();
  }

  return (
    <div className="bg-background text-foreground font-mono min-h-screen flex flex-col transition-colors duration-300">
      {/* Shared Unified Navbar */}
      <Navbar />

      {/* Detail Content */}
      <main className="container mx-auto px-4 lg:px-16 max-w-6xl pt-28 pb-12 flex-1">
        
        {/* Title Block */}
        <div className="border border-foreground/20 p-6 mb-8 relative">
          <span className="absolute top-0 right-0 text-[8px] bg-foreground/10 px-2 py-0.5 border-b border-l border-foreground/20">
            {server.category.toUpperCase()}
          </span>
          <h1 className="text-xl lg:text-3xl font-bold tracking-wide">{server.name}</h1>
          <p className="text-xs text-muted-foreground mt-2">{server.tagline}</p>
          <div className="mt-4">
            <ServerStatus sseUrl={server.sseUrl} initialStatus={server.status} />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6 pt-6 border-t border-foreground/10">
            <div>
              <div className="text-[10px] opacity-40">READINESS SCORE</div>
              <div className="text-xl font-bold mt-1 tabular-nums transition-all duration-500">{liveScore.successRate}% SUCCESS</div>
            </div>
            <div>
              <div className="text-[10px] opacity-40">EXPOSED TOOLS</div>
              <div className="text-xl font-bold mt-1">{server.tools.length} TOOLS</div>
            </div>
            <div>
              <div className="text-[10px] opacity-40">EVALUATION TASKS</div>
              <div className="text-xl font-bold mt-1 tabular-nums transition-all duration-500">{liveScore.totalTasks} RUNS</div>
            </div>
            <div>
              <div className="text-[10px] opacity-40">AVG STEPS TO SUCCESS</div>
              <div className="text-xl font-bold mt-1 tabular-nums transition-all duration-500">{liveScore.avgSteps} STEPS</div>
            </div>
          </div>
        </div>

        {/* Two Column Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Columns (3/5): Connection Info & Config */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            
            {/* SSE Endpoint */}
            <div className="border border-foreground/20 p-6">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-4 opacity-50">
                1. SSE Endpoint URL
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={server.sseUrl}
                  className="bg-foreground/5 border border-foreground/10 px-3 py-2 text-xs font-mono flex-1 text-foreground select-all outline-none"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Provide this URL to your client runtime to establish an SSE handshake.
              </p>
            </div>

            {/* Auth setup */}
            <div className="border border-foreground/20 p-6">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-4 opacity-50">
                2. Authentication Setup
              </h2>
              <p className="text-xs text-foreground/80 mb-6 leading-relaxed">
                This server authenticates using a custom API credential. Set the variable <code className="bg-foreground/10 px-1 text-[11px] font-mono">{server.authEnvVar}</code> in your environment before starting the server.
              </p>
              
              <div className="border border-foreground/10 bg-foreground/5 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 font-mono">
                  <div className="text-[10px] opacity-45 uppercase">Action Required</div>
                  <div className="text-xs font-bold text-foreground mt-1">Obtain your {server.authEnvVar} integration token.</div>
                </div>
                <a
                  href={server.authDocUrl}
                  target="_blank"
                  className="w-full sm:w-auto text-center text-xs font-bold border border-foreground bg-foreground text-background px-4 py-2 hover:bg-transparent hover:text-foreground transition-colors duration-200 inline-block font-mono uppercase tracking-wider select-none cursor-pointer"
                >
                  GET {server.authEnvVar} →
                </a>
              </div>
            </div>

            {/* Config Snippet & Guide */}
            <div className="border border-foreground/20 p-6">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-4 opacity-50">
                3. Configure in Claude Desktop
              </h2>
              
              {/* OS Tabs */}
              <div className="flex border-b border-foreground/20 mb-4 font-mono text-xs">
                <button
                  onClick={() => setOs("windows")}
                  className={`px-4 py-2 border-t border-l border-r border-transparent -mb-[1px] select-none cursor-pointer ${
                    os === "windows"
                      ? "border-foreground/20 bg-background font-bold"
                      : "opacity-45 hover:opacity-100"
                  }`}
                >
                  WINDOWS
                </button>
                <button
                  onClick={() => setOs("mac")}
                  className={`px-4 py-2 border-t border-l border-r border-transparent -mb-[1px] select-none cursor-pointer ${
                    os === "mac"
                      ? "border-foreground/20 bg-background font-bold"
                      : "opacity-45 hover:opacity-100"
                  }`}
                >
                  MACOS
                </button>
              </div>

              {/* Guide based on OS */}
              <div className="text-xs text-foreground/80 leading-relaxed mb-4">
                {os === "windows" ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="font-bold">File Path:</span>
                      <div className="flex gap-2 items-center mt-1">
                        <code className="bg-foreground/10 px-2 py-1 text-[11px] font-mono break-all flex-1">
                          %appdata%\Claude\claude_desktop_config.json
                        </code>
                        <button
                          onClick={() => handleCopy("%appdata%\\Claude\\claude_desktop_config.json", "path")}
                          className="border border-foreground/30 px-2 py-1 text-[10px] hover:bg-foreground hover:text-background transition-colors duration-200 select-none cursor-pointer font-bold"
                        >
                          {copiedText === "path" ? "COPIED" : "COPY PATH"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="font-bold">Quick Open (Run in Run Dialog, CMD or PowerShell):</span>
                      <div className="flex gap-2 items-center mt-1">
                        <code className="bg-foreground/10 px-2 py-1 text-[11px] font-mono break-all flex-1">
                          cmd /c "mkdir %appdata%\Claude & notepad %appdata%\Claude\claude_desktop_config.json"
                        </code>
                        <button
                          onClick={() => handleCopy("cmd /c \"mkdir %appdata%\\Claude & notepad %appdata%\\Claude\\claude_desktop_config.json\"", "cmd")}
                          className="border border-foreground/30 px-2 py-1 text-[10px] hover:bg-foreground hover:text-background transition-colors duration-200 select-none cursor-pointer font-bold"
                        >
                          {copiedText === "cmd" ? "COPIED" : "COPY COMMAND"}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                        *Tip: Press <kbd className="bg-foreground/10 px-1 rounded">Win + R</kbd>, paste the command above, and hit Enter to automatically create the folder and edit the config file.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="font-bold">File Path:</span>
                      <div className="flex gap-2 items-center mt-1">
                        <code className="bg-foreground/10 px-2 py-1 text-[11px] font-mono break-all flex-1">
                          ~/Library/Application Support/Claude/claude_desktop_config.json
                        </code>
                        <button
                          onClick={() => handleCopy("~/Library/Application Support/Claude/claude_desktop_config.json", "path")}
                          className="border border-foreground/30 px-2 py-1 text-[10px] hover:bg-foreground hover:text-background transition-colors duration-200 select-none cursor-pointer font-bold"
                        >
                          {copiedText === "path" ? "COPIED" : "COPY PATH"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="font-bold">Quick Open (Run in Terminal):</span>
                      <div className="flex gap-2 items-center mt-1">
                        <code className="bg-foreground/10 px-2 py-1 text-[11px] font-mono break-all flex-1">
                          mkdir -p ~/Library/Application\ Support/Claude && touch ~/Library/Application\ Support/Claude/claude_desktop_config.json && open -e ~/Library/Application\ Support/Claude/claude_desktop_config.json
                        </code>
                        <button
                          onClick={() => handleCopy("mkdir -p ~/Library/Application\\ Support/Claude && touch ~/Library/Application\\ Support/Claude/claude_desktop_config.json && open -e ~/Library/Application\\ Support/Claude/claude_desktop_config.json", "cmd")}
                          className="border border-foreground/30 px-2 py-1 text-[10px] hover:bg-foreground hover:text-background transition-colors duration-200 select-none cursor-pointer font-bold"
                        >
                          {copiedText === "cmd" ? "COPIED" : "COPY COMMAND"}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                        *Tip: Paste the command above in Terminal to automatically create the folder and open the config file in TextEdit.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-foreground/10 pt-4 mt-4 relative">
                <span className="font-bold text-xs block mb-1">4. Append configuration code:</span>
                <p className="text-[11px] text-muted-foreground mb-3 leading-normal">
                  Copy and merge the following snippet into the <code className="bg-foreground/10 px-1">mcpServers</code> block in your configuration file:
                </p>
                <div className="relative group">
                  <pre className="bg-foreground/5 border border-foreground/10 p-4 text-[10px] leading-relaxed overflow-x-auto select-all pr-24">
                    {server.sampleConfig}
                  </pre>
                  <button
                    onClick={() => handleCopy(server.sampleConfig, "config")}
                    className="absolute top-2 right-2 border border-foreground/30 bg-background/80 px-2 py-1 text-[10px] hover:bg-foreground hover:text-background transition-colors duration-200 select-none cursor-pointer font-mono font-bold"
                  >
                    {copiedText === "config" ? "COPIED CONFIG" : "COPY SNIPPET"}
                  </button>
                </div>
              </div>
            </div>

            {/* Example Tasks */}
            <div className="border border-foreground/20 p-6">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-4 opacity-50">
                Proven Prompt Tasks
              </h2>
              <ul className="text-xs text-foreground/80 flex flex-col gap-3">
                {server.exampleTasks.map((task, i) => (
                  <li key={i} className="flex gap-2 leading-relaxed">
                    <span className="opacity-45">[{i + 1}]</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Right Columns (2/5): Exposed Tools List */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="border border-foreground/20 p-6">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-4 opacity-50">
                Exposed Tools ({server.tools.length})
              </h2>
              <div className="flex flex-col gap-4">
                {server.tools.map((tool) => (
                  <div key={tool.name} className="border-b border-foreground/10 pb-4 last:border-0 last:pb-0">
                    <span className="text-xs bg-foreground/10 px-2 py-0.5 font-bold tracking-wide">
                      {tool.name}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Link back to blog */}
            {(server.slug === "notion" || server.slug === "freshsales") && (
              <div className="border border-foreground/20 p-6 bg-foreground/5">
                <h3 className="text-xs font-bold uppercase mb-2">Tuning Case Study</h3>
                <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                  Read how we iterated this server&apos;s schemas and descriptions to achieve a {liveScore.successRate}% success rate.
                </p>
                <Link href={`/blog/${server.slug === "notion" ? "notion-iteration" : "freshsales-iteration"}`} className="text-xs text-foreground underline font-bold">
                  View write-up →
                </Link>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-foreground/20 bg-background py-8">
        <div className="container mx-auto px-4 lg:px-16 max-w-6xl flex justify-between items-center text-xs opacity-50">
          <div>© 2026 AGENTREADY.</div>
          <Link href="/" className="hover:underline">← Directory</Link>
        </div>
      </footer>
    </div>
  );
}
