import { blogPosts } from "@/lib/data";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";

export default function Page() {
  return (
    <div className="bg-background text-foreground font-mono min-h-screen flex flex-col transition-colors duration-300">
      {/* Shared Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-16 max-w-4xl pt-28 pb-12 flex-1">
        
        {/* Title */}
        <div className="border border-foreground/20 p-6 mb-12">
          <h1 className="text-xl lg:text-3xl font-bold tracking-wide">CASE STUDIES</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Detailed engineering logs of tuning REST APIs for LLM reliability.
          </p>
        </div>

        {/* Blog Posts List */}
        <div className="flex flex-col gap-8">
          {blogPosts.map((post) => (
            <div key={post.slug} className="border border-foreground/20 p-6 hover:border-foreground transition-colors duration-200">
              <div className="flex justify-between text-[10px] opacity-50 mb-3">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-lg lg:text-xl font-bold tracking-wide hover:underline mb-3">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                {post.summary}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="text-xs border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
              >
                Read write-up →
              </Link>
            </div>
          ))}
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
