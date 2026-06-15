import Hero from "@/components/ui/hero-ascii";
import { servers, blogPosts } from "@/lib/data";
import Link from "next/link";
import ServerStatus from "@/components/ui/server-status";
import { LiveSuccessRate } from "@/components/ui/live-score";

export default function Page() {
  return (
    <div className="bg-background text-foreground font-mono min-h-screen flex flex-col transition-colors duration-300">
      {/* 1. ASCII Hero Section */}
      <Hero />

      {/* 2. Directory Section */}
      <section id="servers" className="border-t border-foreground/20 bg-background py-20 relative transition-colors duration-300">
        {/* Background grid accent (faint grid overlay) */}
        <div className="absolute inset-0 opacity-[0.03] grid-bg pointer-events-none"></div>

        <div className="container mx-auto px-4 lg:px-16 max-w-6xl relative z-10">
          {/* Section Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-2 opacity-60">
              <div className="w-6 h-px bg-foreground"></div>
              <span className="text-[10px] tracking-widest">002</span>
              <div className="flex-1 h-px bg-foreground/20"></div>
            </div>
            <h2 className="text-xl lg:text-3xl font-bold tracking-wider">
              VERIFIED SERVERS DIRECTORY
            </h2>
            <p className="text-xs lg:text-sm text-muted-foreground mt-2 max-w-xl">
              Model Context Protocol endpoints scored on multi-step task success. Click an integration to inspect schemas and setup.
            </p>
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {servers.map((server) => (
              <div
                key={server.slug}
                className="border border-foreground/20 bg-card p-6 flex flex-col justify-between hover:border-foreground transition-all duration-300 group relative"
              >
                {/* Tech corner tick marks */}
                <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-foreground opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-foreground opacity-0 group-hover:opacity-100 transition-opacity"></span>

                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] border border-foreground/30 px-2 py-0.5 opacity-60 text-xs">
                        {server.category.toUpperCase()}
                      </span>
                      <h3 className="text-lg lg:text-xl font-bold mt-2 tracking-wide">
                        {server.name}
                      </h3>
                    </div>
                    
                    {/* Success Circle/Badge */}
                    <div className="text-right">
                      <LiveSuccessRate slug={server.slug} fallback={server.successRate} />
                      <div className="text-[8px] opacity-50 tracking-wider">SUCCESS RATE</div>
                    </div>
                  </div>

                  {/* Staging/Production indicator */}
                  <ServerStatus sseUrl={server.sseUrl} initialStatus={server.status} />

                  {/* Tagline */}
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                    {server.tagline}
                  </p>

                  {/* Core Tools Sneak Peek */}
                  <div className="mb-6">
                    <div className="text-[9px] opacity-40 mb-2">EXPOSED TOOLS ({server.tools.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {server.tools.slice(0, 4).map((tool) => (
                        <span key={tool.name} className="text-[9px] bg-foreground/5 border border-foreground/10 px-2 py-0.5 font-mono">
                          {tool.name}
                        </span>
                      ))}
                      {server.tools.length > 4 && (
                        <span className="text-[9px] opacity-50 px-2 py-0.5">
                          +{server.tools.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="mt-4 pt-4 border-t border-foreground/10 flex justify-between items-center">
                  <div className="text-[9px] opacity-40">ENV: {server.authEnvVar}</div>
                  <Link
                    href={`/servers/${server.slug}`}
                    className="text-xs border border-foreground px-4 py-1.5 hover:bg-foreground hover:text-background transition-colors duration-200"
                  >
                    INSPECT SCHEMAS →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Case Studies & Resources Section */}
      <section className="border-t border-foreground/20 bg-background py-20 relative transition-colors duration-300">
        <div className="container mx-auto px-4 lg:px-16 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Methodology teaser */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-2 opacity-60">
                <div className="w-6 h-px bg-foreground"></div>
                <span className="text-[10px] tracking-widest">003</span>
              </div>
              <h2 className="text-lg lg:text-2xl font-bold tracking-wider">
                EVALUATION METHODOLOGY
              </h2>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Why do standard auto-generated MCP servers fail? They lack machine-readable documentation, contain loose schemas, and return unhelpful raw exceptions.
              </p>
              <div className="mt-6">
                <Link
                  href="/how-it-works"
                  className="text-xs border-b border-foreground hover:opacity-75 pb-1 transition-opacity"
                >
                  READ HOW IT WORKS →
                </Link>
              </div>
            </div>

            {/* Right Column: Case Studies Index */}
            <div className="lg:col-span-2 border-l border-foreground/10 lg:pl-12 flex flex-col gap-8">
              <div>
                <h3 className="text-xs opacity-40 tracking-widest uppercase mb-4">REPORTS & CASE STUDIES</h3>
                <div className="flex flex-col gap-6">
                  {blogPosts.map((post) => (
                    <div key={post.slug} className="border border-foreground/10 p-5 hover:border-foreground/30 transition-colors">
                      <div className="flex justify-between text-[9px] opacity-40 mb-2">
                        <span>{post.date}</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h4 className="text-base font-bold mb-2 tracking-wide hover:underline">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        {post.summary}
                      </p>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-[10px] text-foreground underline hover:opacity-80"
                      >
                        Read write-up
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Global Footer */}
      <footer className="border-t border-foreground/20 bg-background py-8 mt-auto transition-colors duration-300">
        <div className="container mx-auto px-4 lg:px-16 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-50">
          <div>
            © 2026 AGENTREADY — ALL SERVERS OPEN SOURCE.
          </div>
          <div className="flex gap-6">
            <Link href="/how-it-works" className="hover:underline">HOW IT WORKS</Link>
            <Link href="/blog" className="hover:underline">CASE STUDIES</Link>
            <a href="https://github.com/AdityaTel89/software-for-agents" target="_blank" className="hover:underline">GITHUB</a>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .grid-bg {
          background-image: 
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}} />
    </div>
  );
}
