import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/data";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-background text-foreground font-mono min-h-screen flex flex-col transition-colors duration-300">
      {/* Shared Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-16 max-w-3xl pt-28 pb-12 flex-1">
        
        {/* Post Metadata */}
        <div className="border-b border-foreground/20 pb-6 mb-8">
          <div className="flex justify-between text-[10px] opacity-50 mb-3">
            <span>{post.date}</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="text-xl lg:text-3xl font-bold tracking-wide leading-tight">
            {post.title}
          </h1>
        </div>

        {/* Article Content */}
        <article className="prose prose-invert max-w-none text-xs lg:text-sm text-muted-foreground leading-relaxed flex flex-col gap-6 font-mono whitespace-pre-wrap">
          <div dangerouslySetInnerHTML={{
            __html: post.content
              // Basic markdown mappings for presentation
              .replace(/### (.*)/g, '<h3 class="text-foreground font-bold text-base mt-8 mb-2">$1</h3>')
              .replace(/#### (.*)/g, '<h4 class="text-foreground font-bold text-sm mt-6 mb-2">$1</h4>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-bold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
              .replace(/`(.*?)`/g, '<code class="bg-foreground/10 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')
              .replace(/---/g, '<hr class="border-foreground/20 my-6" />')
              .replace(/\| (.*) \|/g, (match) => {
                const cells = match.split("|").slice(1, -1).map(c => c.trim());
                return `<tr class="border-b border-foreground/10">${cells.map(c => `<td class="p-2 border-r border-foreground/10 last:border-0">${c}</td>`).join("")}</tr>`;
              })
              .replace(/<table>/g, '<table class="border border-foreground/20 w-full text-left font-mono my-4 text-xs">')
          }} />
        </article>

        {/* Back Link */}
        <div className="mt-12 pt-6 border-t border-foreground/20">
          <Link href="/" className="text-xs border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
            ← Back to Servers Directory
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-foreground/20 bg-background py-8">
        <div className="container mx-auto px-4 lg:px-16 max-w-3xl flex justify-between items-center text-xs opacity-50">
          <div>© 2026 AGENTREADY.</div>
          <Link href="/" className="hover:underline">← Directory</Link>
        </div>
      </footer>
    </div>
  );
}
