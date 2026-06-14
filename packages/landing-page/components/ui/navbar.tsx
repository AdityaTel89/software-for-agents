'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/theme-toggle";

export default function Navbar() {
  const pathname = usePathname();

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
