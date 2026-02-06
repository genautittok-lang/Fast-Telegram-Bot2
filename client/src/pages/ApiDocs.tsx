import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Shield,
  Key,
  Copy,
  Check,
  ChevronRight,
  Code2,
  Terminal,
  Send,
  Loader2,
  FileText,
  Eye,
  EyeOff,
  Globe,
  Zap,
  Lock,
  PlayCircle,
  BookOpen,
  Layers,
  Radio,
  Download,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/PageLayout";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface ApiKeyResponse {
  apiKey: string;
}

const endpoints = [
  {
    method: "POST",
    path: "/api/check",
    title: "Perform a Check",
    description: "Run an OSINT check on a target (IP, email, domain, wallet, phone, URL, bot, CVE, hash, username, or card).",
    requestBody: {
      type: "string (ip | wallet | email | phone | domain | url | bot | cve | hash | username | card)",
      target: "string",
    },
    requestExample: JSON.stringify({ type: "ip", target: "8.8.8.8" }, null, 2),
    responseExample: JSON.stringify({
      id: 42,
      type: "ip",
      target: "8.8.8.8",
      riskScore: 15,
      riskLevel: "low",
      summary: "Google Public DNS - No threats detected",
      findings: ["Geolocation: US", "ISP: Google LLC", "Not on any blacklist"],
      sources: ["ip-api", "abuseipdb"],
      timestamp: "2026-02-06T12:00:00Z",
    }, null, 2),
    icon: Search,
    color: "text-blue-400",
    bg: "from-blue-500/20 via-blue-500/5 to-transparent",
    border: "border-blue-500/30",
  },
  {
    method: "POST",
    path: "/api/bulk-check",
    title: "Bulk Check",
    description: "Run multiple OSINT checks at once. Submit an array of targets to be checked in parallel.",
    requestBody: {
      type: "string",
      targets: "string[] (max 50)",
    },
    requestExample: JSON.stringify({ type: "email", targets: ["user@example.com", "admin@test.org"] }, null, 2),
    responseExample: JSON.stringify({
      results: [
        { target: "user@example.com", riskScore: 25, riskLevel: "low", status: "completed" },
        { target: "admin@test.org", riskScore: 72, riskLevel: "high", status: "completed" },
      ],
      total: 2,
      completed: 2,
    }, null, 2),
    icon: Layers,
    color: "text-purple-400",
    bg: "from-purple-500/20 via-purple-500/5 to-transparent",
    border: "border-purple-500/30",
  },
  {
    method: "GET",
    path: "/api/reports",
    title: "List Reports",
    description: "Retrieve a list of all your previous check reports, sorted by date.",
    requestBody: null,
    requestExample: null,
    responseExample: JSON.stringify([
      {
        id: 42,
        type: "ip",
        target: "8.8.8.8",
        riskLevel: "low",
        riskScore: 15,
        createdAt: "2026-02-06T12:00:00Z",
      },
    ], null, 2),
    icon: FileText,
    color: "text-green-400",
    bg: "from-green-500/20 via-green-500/5 to-transparent",
    border: "border-green-500/30",
  },
  {
    method: "GET",
    path: "/api/reports/:id/pdf",
    title: "Download PDF Report",
    description: "Download a detailed PDF report for a specific check by its ID.",
    requestBody: null,
    requestExample: null,
    responseExample: "Binary PDF file (application/pdf)",
    icon: Download,
    color: "text-orange-400",
    bg: "from-orange-500/20 via-orange-500/5 to-transparent",
    border: "border-orange-500/30",
  },
  {
    method: "POST",
    path: "/api/watches",
    title: "Create Watch",
    description: "Create a monitoring watch to continuously track a target and receive alerts on changes.",
    requestBody: {
      type: "string",
      target: "string",
      interval: "number (minutes, min: 60)",
    },
    requestExample: JSON.stringify({ type: "domain", target: "example.com", interval: 360 }, null, 2),
    responseExample: JSON.stringify({
      id: 7,
      type: "domain",
      target: "example.com",
      interval: 360,
      active: true,
      createdAt: "2026-02-06T12:00:00Z",
    }, null, 2),
    icon: Radio,
    color: "text-cyan-400",
    bg: "from-cyan-500/20 via-cyan-500/5 to-transparent",
    border: "border-cyan-500/30",
  },
  {
    method: "GET",
    path: "/api/watches",
    title: "List Watches",
    description: "Retrieve all active monitoring watches for your account.",
    requestBody: null,
    requestExample: null,
    responseExample: JSON.stringify([
      {
        id: 7,
        type: "domain",
        target: "example.com",
        interval: 360,
        active: true,
        lastCheck: "2026-02-06T18:00:00Z",
        createdAt: "2026-02-06T12:00:00Z",
      },
    ], null, 2),
    icon: Eye,
    color: "text-amber-400",
    bg: "from-amber-500/20 via-amber-500/5 to-transparent",
    border: "border-amber-500/30",
  },
];

function generateCurl(endpoint: typeof endpoints[0], apiKey: string) {
  const base = "https://darkshare.store";
  const headers = `-H "Authorization: Bearer ${apiKey || "YOUR_API_KEY"}" -H "Content-Type: application/json"`;

  if (endpoint.method === "GET") {
    return `curl -X GET "${base}${endpoint.path}" \\\n  ${headers}`;
  }
  return `curl -X POST "${base}${endpoint.path}" \\\n  ${headers} \\\n  -d '${endpoint.requestExample}'`;
}

function generateJS(endpoint: typeof endpoints[0], apiKey: string) {
  const key = apiKey || "YOUR_API_KEY";
  if (endpoint.method === "GET") {
    return `const response = await fetch("https://darkshare.store${endpoint.path}", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${key}",
  },
});

const data = await response.json();
console.log(data);`;
  }
  return `const response = await fetch("https://darkshare.store${endpoint.path}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${endpoint.requestExample}),
});

const data = await response.json();
console.log(data);`;
}

export default function ApiDocs() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState(0);
  const [tryType, setTryType] = useState("ip");
  const [tryTarget, setTryTarget] = useState("");
  const [tryResult, setTryResult] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.tier !== "ENTERPRISE" && user?.tier !== "ADMIN"))) {
      toast({
        title: "Enterprise Required",
        description: "API access is available for Enterprise tier users only.",
        variant: "destructive",
      });
      setLocation("/pricing");
    }
  }, [authLoading, isAuthenticated, user?.tier, setLocation, toast]);

  const { data: apiKeyData, isLoading: keyLoading } = useQuery<ApiKeyResponse>({
    queryKey: ["/api/user/api-key"],
    enabled: isAuthenticated && (user?.tier === "ENTERPRISE" || user?.tier === "ADMIN"),
  });

  const tryMutation = useMutation({
    mutationFn: async ({ type, target }: { type: string; target: string }) => {
      const res = await apiRequest("POST", "/api/check", { type, target });
      return res.json();
    },
    onSuccess: (data) => {
      setTryResult(JSON.stringify(data, null, 2));
    },
    onError: (error: Error) => {
      setTryResult(JSON.stringify({ error: error.message }, null, 2));
    },
  });

  const apiKey = apiKeyData?.apiKey || "";

  const handleCopyKey = async () => {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      toast({ title: t("common.copied"), description: "API key copied to clipboard" });
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      toast({ title: t("common.copied") });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  if (authLoading || (!isAuthenticated) || (user?.tier !== "ENTERPRISE" && user?.tier !== "ADMIN")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <Shield className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-mono text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const currentEndpoint = endpoints[activeEndpoint];
  const curlCode = generateCurl(currentEndpoint, apiKey);
  const jsCode = generateJS(currentEndpoint, apiKey);

  return (
    <PageLayout>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center border border-primary/20">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("nav.apiDocs")}</h1>
                <p className="text-sm text-muted-foreground font-mono">DARKSHARE OSINT REST API v1</p>
              </div>
              <Badge className="bg-gradient-to-r from-amber-600 to-orange-500 text-white border-amber-400/50 ml-auto">
                <Zap className="w-3 h-3 mr-1" />
                ENTERPRISE
              </Badge>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-5 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-cyan-500/5">
              <div className="flex items-center gap-3 mb-3">
                <Key className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-sm">API Key</h2>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  <Lock className="w-3 h-3 mr-1" />
                  Bearer Token
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/40 rounded-lg px-4 py-2.5 font-mono text-sm border border-white/10 flex items-center gap-2">
                  {keyLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="truncate text-muted-foreground" data-testid="text-api-key">
                      {showKey ? apiKey : apiKey.replace(/./g, "\u2022")}
                    </span>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowKey(!showKey)}
                  data-testid="button-toggle-key-visibility"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopyKey}
                  data-testid="button-copy-api-key"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                Include in all requests: <span className="text-primary">Authorization: Bearer {"<your_api_key>"}</span>
              </p>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-1"
            >
              <p className="text-xs text-muted-foreground font-mono tracking-wider px-2 pb-2">ENDPOINTS</p>
              {endpoints.map((ep, i) => (
                <button
                  key={ep.path + ep.method}
                  onClick={() => setActiveEndpoint(i)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 text-left ${
                    activeEndpoint === i
                      ? "bg-gradient-to-r from-primary/15 to-transparent border border-primary/25 text-white"
                      : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                  data-testid={`button-endpoint-${i}`}
                >
                  <ep.icon className={`w-4 h-4 flex-shrink-0 ${activeEndpoint === i ? "text-primary" : ep.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 font-mono ${
                          ep.method === "POST"
                            ? "border-blue-500/40 text-blue-400"
                            : "border-green-500/40 text-green-400"
                        }`}
                      >
                        {ep.method}
                      </Badge>
                      <span className="font-mono text-xs truncate">{ep.path}</span>
                    </div>
                  </div>
                  {activeEndpoint === i && (
                    <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </motion.div>

            <motion.div
              key={activeEndpoint}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <Card className={`p-5 border ${currentEndpoint.border} bg-gradient-to-br ${currentEndpoint.bg}`}>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs ${
                      currentEndpoint.method === "POST"
                        ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
                        : "border-green-500/50 text-green-400 bg-green-500/10"
                    }`}
                  >
                    {currentEndpoint.method}
                  </Badge>
                  <code className="font-mono text-sm text-white">{currentEndpoint.path}</code>
                </div>
                <h3 className="text-lg font-semibold mb-1">{currentEndpoint.title}</h3>
                <p className="text-sm text-muted-foreground">{currentEndpoint.description}</p>

                {currentEndpoint.requestBody && (
                  <div className="mt-4">
                    <p className="text-xs font-mono text-muted-foreground mb-2 tracking-wider">REQUEST BODY</p>
                    <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground text-xs font-mono">
                            <td className="pb-2 pr-4">Parameter</td>
                            <td className="pb-2">Type</td>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(currentEndpoint.requestBody).map(([key, val]) => (
                            <tr key={key} className="border-t border-white/5">
                              <td className="py-2 pr-4 font-mono text-primary text-xs">{key}</td>
                              <td className="py-2 font-mono text-xs text-muted-foreground">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-0 border border-white/10 overflow-hidden">
                <Tabs defaultValue="curl">
                  <div className="flex items-center justify-between px-4 pt-3 pb-0 gap-2 flex-wrap">
                    <TabsList className="bg-white/5 border border-white/10">
                      <TabsTrigger value="curl" className="text-xs font-mono gap-1.5" data-testid="tab-curl">
                        <Terminal className="w-3.5 h-3.5" />
                        cURL
                      </TabsTrigger>
                      <TabsTrigger value="js" className="text-xs font-mono gap-1.5" data-testid="tab-js">
                        <Code2 className="w-3.5 h-3.5" />
                        JavaScript
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="curl" className="mt-0 p-4">
                    <div className="relative">
                      <pre className="bg-black/60 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto border border-white/5 whitespace-pre-wrap break-all">
                        {curlCode}
                      </pre>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyCode(curlCode, `curl-${activeEndpoint}`)}
                        data-testid="button-copy-curl"
                      >
                        {copiedCode === `curl-${activeEndpoint}` ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="js" className="mt-0 p-4">
                    <div className="relative">
                      <pre className="bg-black/60 rounded-lg p-4 font-mono text-xs text-cyan-400 overflow-x-auto border border-white/5 whitespace-pre-wrap break-all">
                        {jsCode}
                      </pre>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyCode(jsCode, `js-${activeEndpoint}`)}
                        data-testid="button-copy-js"
                      >
                        {copiedCode === `js-${activeEndpoint}` ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              {currentEndpoint.responseExample && (
                <Card className="p-4 border border-white/10">
                  <p className="text-xs font-mono text-muted-foreground mb-2 tracking-wider">RESPONSE EXAMPLE</p>
                  <pre className="bg-black/60 rounded-lg p-4 font-mono text-xs text-amber-300 overflow-x-auto border border-white/5 whitespace-pre-wrap break-all">
                    {typeof currentEndpoint.responseExample === "string"
                      ? currentEndpoint.responseExample
                      : JSON.stringify(currentEndpoint.responseExample, null, 2)}
                  </pre>
                </Card>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-5 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-transparent to-primary/5">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <PlayCircle className="w-4 h-4 text-cyan-400" />
                </div>
                <h2 className="font-semibold">Try It</h2>
                <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                  Interactive
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Select value={tryType} onValueChange={setTryType}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-black/40 border-white/10" data-testid="select-try-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ip">IP Address</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="username">Username</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Enter target value..."
                  value={tryTarget}
                  onChange={(e) => setTryTarget(e.target.value)}
                  className="flex-1 bg-black/40 border-white/10 font-mono text-sm"
                  data-testid="input-try-target"
                />
                <Button
                  onClick={() => {
                    if (!tryTarget.trim()) {
                      toast({ title: "Enter a target", variant: "destructive" });
                      return;
                    }
                    tryMutation.mutate({ type: tryType, target: tryTarget.trim() });
                  }}
                  disabled={tryMutation.isPending}
                  className="gap-2"
                  data-testid="button-try-send"
                >
                  {tryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {t("common.submit")}
                </Button>
              </div>
              {tryResult && (
                <div className="mt-4 relative">
                  <pre className="bg-black/60 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto border border-white/5 max-h-[400px] overflow-y-auto whitespace-pre-wrap break-all" data-testid="text-try-result">
                    {tryResult}
                  </pre>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopyCode(tryResult, "try-result")}
                    data-testid="button-copy-try-result"
                  >
                    {copiedCode === "try-result" ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="font-semibold text-sm">Rate Limits & Authentication</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <Globe className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs font-mono text-muted-foreground mb-1">BASE URL</p>
                  <p className="font-mono text-sm text-white">https://darkshare.store</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <Lock className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs font-mono text-muted-foreground mb-1">AUTH METHOD</p>
                  <p className="font-mono text-sm text-white">Bearer Token (Header)</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <Zap className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs font-mono text-muted-foreground mb-1">RATE LIMIT</p>
                  <p className="font-mono text-sm text-white">Unlimited (Enterprise)</p>
                </div>
              </div>
              <div className="mt-4 bg-black/20 rounded-lg p-3 border border-white/5">
                <p className="text-xs text-muted-foreground">
                  All API responses are in JSON format. Error responses include a <code className="text-primary">message</code> field.
                  HTTP status codes: <code className="text-green-400">200</code> success, <code className="text-yellow-400">400</code> bad request,
                  <code className="text-orange-400"> 401</code> unauthorized, <code className="text-red-400">429</code> rate limited,
                  <code className="text-red-400"> 500</code> server error.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
