import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Shield, 
  FileText, 
  Download, 
  ArrowLeft,
  Globe,
  Wallet,
  Mail,
  Phone,
  Building,
  Link2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  FileJson,
  FileSpreadsheet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { MobileMenu } from "@/components/MobileMenu";

interface Report {
  id: number;
  type: string;
  target: string;
  riskLevel: string;
  riskScore: number;
  createdAt: string;
}

const typeIcons: Record<string, any> = {
  ip: Globe,
  wallet: Wallet,
  email: Mail,
  phone: Phone,
  domain: Building,
  url: Link2,
};

export default function History() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-500/20 text-red-500 border-red-500/50";
      case "high": return "bg-orange-500/20 text-orange-500 border-orange-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "low": return "bg-green-500/20 text-green-500 border-green-500/50";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <Clock className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const handleDownload = (id: number) => {
    window.open(`/api/reports/${id}/pdf`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="hidden sm:flex" data-testid="button-back-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-display font-bold text-lg sm:text-xl">DARKSHARE</span>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">Історія</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex gap-1"
              onClick={() => window.open('/api/reports/export/json', '_blank')}
              data-testid="button-export-json"
            >
              <FileJson className="w-4 h-4" />
              JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex gap-1"
              onClick={() => window.open('/api/reports/export/csv', '_blank')}
              data-testid="button-export-csv"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </Button>
            <Link href="/dashboard">
              <Button size="sm" className="hidden sm:flex" data-testid="button-new-check">
                Нова перевірка
              </Button>
            </Link>
            <MobileMenu lang="UA" isAuthenticated={true} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Історія перевірок
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report, idx) => {
                  const TypeIcon = typeIcons[report.type] || Globe;
                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm truncate">{report.target}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.createdAt).toLocaleString('uk-UA')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getRiskColor(report.riskLevel)} border flex items-center gap-1`}>
                          {getRiskIcon(report.riskLevel)}
                          {report.riskScore}/100
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownload(report.id)}
                          data-testid={`button-download-${report.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Історія порожня</p>
                <p className="text-sm mt-1">Виконайте першу перевірку</p>
                <Link href="/dashboard">
                  <Button className="mt-4" data-testid="button-start-checking">
                    Почати перевірку
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
