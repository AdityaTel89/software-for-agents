'use client';

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/theme-toggle";
import { servers } from "@/lib/data";

export default function Navbar() {
  const pathname = usePathname();

  // Keep-alive system: ping the hosted Render/Fly servers' health endpoints
  useEffect(() => {
    const pingServers = () => {
      servers.forEach((server) => {
        // Render free tier sleeping workaround: replace '/sse' with '/health' and trigger ping
        const healthUrl = server.sseUrl.replace(/\/sse$/, "/health");
        fetch(healthUrl).catch((err) => {
          console.warn(`[Keep-Alive] Failed to ping health for ${server.name}:`, err);
        });
      });
    };

    // Ping immediately on load to wake up sleeping Render servers
    pingServers();

    // Ping every 5 minutes (300000 ms) to prevent sleeping
    const interval = setInterval(pingServers, 300000);

    return () => clearInterval(interval);
  }, []);

  // Determine current page marker
  let pageMarker = "[ DIRECTORY ]";
  if (pathname === "/how-it-works") {
    pageMarker = "[ METHODOLOGY ]";
  } else if (pathname.startsWith("/servers/notion")) {
    pageMarker = "[ INTEGRATION: NOTION ]";
  } else if (pathname.startsWith("/servers/freshsales")) {
    pageMarker = "[ INTEGRATION: FRESHSALES ]";
  } else if (pathname.startsWith("/blog")) {
    pageMarker = "[ CASE STUDY ]";
  } else if (pathname === "/demo") {
    pageMarker = "[ DEMO ]";
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-20 border-b border-foreground/20 bg-background/80 backdrop-blur-sm transition-colors duration-300">
      <div className="container mx-auto px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
        
        {/* Logo & Year */}
        <div className="flex items-center gap-2 lg:gap-4">
          <Link 
            href="/" 
            className="font-mono text-foreground text-xl lg:text-2xl font-bold tracking-widest italic transform -skew-x-12 hover:opacity-85 transition-opacity"
          >
            AGENTREADY
          </Link>
          <div className="h-3 lg:h-4 w-px bg-foreground/40"></div>
          <span className="text-foreground/60 text-[8px] lg:text-[10px] font-mono">EST. 2026</span>
          <span className="hidden md:inline-block text-foreground/80 text-[8px] lg:text-[9px] font-mono bg-foreground/5 border border-foreground/10 px-2 py-0.5 ml-2">
            {pageMarker}
          </span>
          <div className="lg:hidden ml-2 flex items-center">
            <ThemeToggle />
          </div>
        </div>
        
        {/* System Status & Theme Toggle */}
        <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-foreground/60">
          <span>EVALS: ACTIVE</span>
          <div className="w-1 h-1 bg-foreground/40 rounded-full"></div>
          <span>SERVERS: 2 ONLINE</span>
          <div className="w-1 h-1 bg-foreground/40 rounded-full"></div>
          <ThemeToggle />
        </div>

      </div>
    </div>
  );
}
