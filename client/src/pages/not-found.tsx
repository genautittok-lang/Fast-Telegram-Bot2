import { Link } from "wouter";
import { Shield, Terminal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.05)_0%,transparent_70%)]" />
      
      <div className="relative z-10 flex flex-col items-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        
        <div className="font-mono text-primary/60 text-xs mb-4 tracking-widest">ERROR_CODE: 404</div>
        
        <h1 className="text-6xl font-bold text-white mb-3 font-mono">404</h1>
        
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-primary/60" />
          <p className="text-muted-foreground font-mono text-sm">route_not_found</p>
        </div>
        
        <p className="text-muted-foreground/60 text-sm mb-8 max-w-xs">
          The requested resource could not be located on this server.
        </p>
        
        <Link href="/">
          <Button variant="outline" className="gap-2 font-mono text-sm border-primary/30 text-primary" data-testid="button-return-dashboard">
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </Link>
        
        <div className="mt-12 font-mono text-[10px] text-muted-foreground/30 tracking-wider">
          DARKSHARE SECURITY OSINT v4.3
        </div>
      </div>
    </div>
  );
}
