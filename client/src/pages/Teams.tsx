import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { 
  Users, 
  Plus, 
  Trash2, 
  Crown, 
  Shield, 
  UserPlus, 
  ArrowLeft, 
  Lock,
  Loader2,
  ChevronRight,
  User,
  X,
  QrCode,
  Share2,
  Copy,
  Check,
  BarChart3,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { useIsStandalone } from "@/hooks/use-mobile";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

function TeamsContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [addUsername, setAddUsername] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const tier = (user?.tier || "FREE").toUpperCase();
  const canCreateTeam = tier === "GROUPS" || tier === "ENTERPRISE";

  const { data: teams = [], isLoading } = useQuery<Array<any>>({
    queryKey: ["/api/teams"],
  });

  const { data: teamDetail } = useQuery<any>({
    queryKey: ["/api/teams", selectedTeamId, "members"],
    queryFn: async () => {
      if (!selectedTeamId) return null;
      const res = await fetch(`/api/teams/${selectedTeamId}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTeamId,
  });

  const { data: teamStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/teams", selectedTeamId, "stats"],
    queryFn: async () => {
      if (!selectedTeamId) return null;
      const res = await fetch(`/api/teams/${selectedTeamId}/stats`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTeamId,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/teams", { name });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('common.success'), description: lang === "uk" ? "Команду створено" : lang === "ru" ? "Команда создана" : lang === "es" ? "Equipo creado" : lang === "de" ? "Team erstellt" : "Team created" });
      setNewTeamName("");
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: "destructive" });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, username }: { teamId: number; username: string }) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/members`, { username });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('common.success'), description: lang === "uk" ? "Учасника додано" : lang === "ru" ? "Участник добавлен" : lang === "es" ? "Miembro añadido" : lang === "de" ? "Mitglied hinzugefügt" : "Member added" });
      setAddUsername("");
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeamId, "members"] });
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: number; userId: number }) => {
      const res = await apiRequest("DELETE", `/api/teams/${teamId}/members/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('common.success'), description: lang === "uk" ? "Учасника видалено" : lang === "ru" ? "Участник удалён" : lang === "es" ? "Miembro eliminado" : lang === "de" ? "Mitglied entfernt" : "Member removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeamId, "members"] });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const res = await apiRequest("DELETE", `/api/teams/${teamId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('common.success'), description: lang === "uk" ? "Команду видалено" : lang === "ru" ? "Команда удалена" : lang === "es" ? "Equipo eliminado" : lang === "de" ? "Team gelöscht" : "Team deleted" });
      setSelectedTeamId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });

  const joinTeamMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await apiRequest("POST", "/api/teams/join", { inviteCode });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('common.success'), description: lang === "uk" ? "Приєднано до команди!" : lang === "ru" ? "Вы вступили в команду!" : lang === "es" ? "Te uniste al equipo!" : lang === "de" ? "Team beigetreten!" : "Joined team!" });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedTeamId && teamDetail) {
    const isOwner = teamDetail.team.ownerId === user?.id;
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-5">
        <Button variant="ghost" onClick={() => setSelectedTeamId(null)} data-testid="button-back-teams">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate" data-testid="text-team-name">{teamDetail.team.name}</h1>
              <p className="text-xs text-muted-foreground">
                {teamDetail.members.length + 1}/{teamDetail.team.maxMembers || 10} {lang === "uk" ? "учасників" : lang === "ru" ? "участников" : lang === "es" ? "miembros" : lang === "de" ? "Mitglieder" : "members"}
              </p>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTeamMutation.mutate(selectedTeamId)}
                data-testid="button-delete-team"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            )}
          </div>
        </div>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              <Crown className="w-4 h-4 text-amber-400" />
              {lang === "uk" ? "Власник" : lang === "ru" ? "Владелец" : lang === "es" ? "Propietario" : lang === "de" ? "Besitzer" : "Owner"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid="text-owner-username">@{teamDetail.owner.username || "unknown"}</p>
                <p className="text-xs text-muted-foreground">{teamDetail.owner.tier || "FREE"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              <QrCode className="w-4 h-4 text-primary" />
              {lang === "uk" ? "Запросити" : lang === "ru" ? "Пригласить" : lang === "es" ? "Invitar" : lang === "de" ? "Einladen" : "Invite"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={teamDetail.team.inviteCode || "—"}
                className="bg-white/5 border-white/10 font-mono text-sm flex-1"
                data-testid="input-invite-code"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (teamDetail.team.inviteCode) {
                    navigator.clipboard.writeText(teamDetail.team.inviteCode);
                    setCopiedInvite(true);
                    setTimeout(() => setCopiedInvite(false), 2000);
                  }
                }}
                data-testid="button-copy-invite"
              >
                {copiedInvite ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowQR(!showQR)}
                data-testid="button-show-qr"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
            <AnimatePresence>
              {showQR && teamDetail.team.inviteCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-center pt-2"
                >
                  <div className="p-4 bg-white rounded-xl" data-testid="qr-code-container">
                    <QRCodeSVG
                      value={`https://www.darkshare.store/teams/join/${teamDetail.team.inviteCode}`}
                      size={180}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-[11px] text-muted-foreground text-center">
              {lang === "uk" ? "Поділіться кодом або QR для запрошення в команду" : lang === "ru" ? "Поделитесь кодом или QR для приглашения в команду" : lang === "es" ? "Comparte el código o QR para invitar al equipo" : lang === "de" ? "Teile den Code oder QR, um ins Team einzuladen" : "Share the code or QR to invite to the team"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              <Users className="w-4 h-4 text-violet-400" />
              {lang === "uk" ? "Учасники" : lang === "ru" ? "Участники" : lang === "es" ? "Miembros" : lang === "de" ? "Mitglieder" : "Members"} ({teamDetail.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teamDetail.members.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{lang === "uk" ? "Ще немає учасників" : lang === "ru" ? "Пока нет участников" : lang === "es" ? "Aún no hay miembros" : lang === "de" ? "Noch keine Mitglieder" : "No members yet"}</p>
            )}
            {teamDetail.members.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid={`text-member-${member.userId}`}>@{member.username || "unknown"}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{member.tier || "FREE"}</Badge>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMemberMutation.mutate({ teamId: selectedTeamId, userId: member.userId })}
                    data-testid={`button-remove-member-${member.userId}`}
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </Button>
                )}
              </div>
            ))}

            {isOwner && (
              <div className="pt-3 border-t border-white/5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (addUsername.trim()) {
                      addMemberMutation.mutate({ teamId: selectedTeamId, username: addUsername.trim() });
                    }
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    placeholder="@username"
                    className="bg-white/5 border-white/10 flex-1"
                    data-testid="input-add-member"
                  />
                  <Button
                    type="submit"
                    disabled={addMemberMutation.isPending || !addUsername.trim()}
                    data-testid="button-add-member"
                  >
                    {addMemberMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* A. Team Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          data-testid="section-team-stats"
        >
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground">
                    {lang === "uk" ? "Всього перевірок" : lang === "ru" ? "Всего проверок" : lang === "es" ? "Total verificaciones" : lang === "de" ? "Gesamtprüfungen" : "Total Checks"}
                  </span>
                </div>
                <p className="text-2xl font-bold" data-testid="stat-total-checks">
                  {statsLoading ? <span className="inline-block w-12 h-7 bg-muted-foreground/20 rounded animate-pulse" /> : (teamStats?.totalChecks ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-muted-foreground">
                    {lang === "uk" ? "Учасників" : lang === "ru" ? "Участников" : lang === "es" ? "Miembros" : lang === "de" ? "Mitglieder" : "Members"}
                  </span>
                </div>
                <p className="text-2xl font-bold" data-testid="stat-total-members">
                  {statsLoading ? <span className="inline-block w-12 h-7 bg-muted-foreground/20 rounded animate-pulse" /> : (teamStats?.totalMembers ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-muted-foreground">
                    {lang === "uk" ? "Топ тип" : lang === "ru" ? "Топ тип" : lang === "es" ? "Tipo principal" : lang === "de" ? "Top-Typ" : "Top Check Type"}
                  </span>
                </div>
                <p className="text-lg font-bold uppercase" data-testid="stat-top-check-type">
                  {statsLoading ? (
                    <span className="inline-block w-16 h-6 bg-muted-foreground/20 rounded animate-pulse" />
                  ) : (
                    (() => {
                      const types = teamStats?.checksByType || {};
                      const sorted = Object.entries(types).sort((a: any, b: any) => b[1] - a[1]);
                      return sorted.length > 0 ? sorted[0][0] : "—";
                    })()
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">
                    {lang === "uk" ? "За 7 днів" : lang === "ru" ? "За 7 дней" : lang === "es" ? "Últimos 7 días" : lang === "de" ? "Letzte 7 Tage" : "Last 7 Days"}
                  </span>
                </div>
                <p className="text-2xl font-bold" data-testid="stat-recent-activity">
                  {statsLoading ? (
                    <span className="inline-block w-12 h-7 bg-muted-foreground/20 rounded animate-pulse" />
                  ) : (
                    (() => {
                      const reports = teamStats?.recentReports || [];
                      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                      return reports.filter((r: any) => new Date(r.createdAt || r.date).getTime() > weekAgo).length;
                    })()
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* B. Check Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50" data-testid="section-check-types">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                {lang === "uk" ? "Розподіл типів перевірок" : lang === "ru" ? "Распределение типов проверок" : lang === "es" ? "Distribución de tipos" : lang === "de" ? "Typverteilung" : "Check Type Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1">
                      <div className="w-16 h-4 bg-muted-foreground/20 rounded animate-pulse" />
                      <div className="w-full h-5 bg-muted-foreground/10 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (() => {
                const types = teamStats?.checksByType || {};
                const entries = Object.entries(types).sort((a: any, b: any) => b[1] - a[1]);
                const maxVal = entries.length > 0 ? Math.max(...entries.map((e: any) => e[1])) : 1;
                const typeColors: Record<string, string> = {
                  ip: "bg-blue-500",
                  domain: "bg-purple-500",
                  wallet: "bg-amber-500",
                  email: "bg-green-500",
                  url: "bg-cyan-500",
                  phone: "bg-pink-500",
                  hash: "bg-red-500",
                  cve: "bg-orange-500",
                  username: "bg-indigo-500",
                  bot_token: "bg-slate-500",
                };
                const typeBadgeColors: Record<string, string> = {
                  ip: "border-blue-500/30 text-blue-400",
                  domain: "border-purple-500/30 text-purple-400",
                  wallet: "border-amber-500/30 text-amber-400",
                  email: "border-green-500/30 text-green-400",
                  url: "border-cyan-500/30 text-cyan-400",
                  phone: "border-pink-500/30 text-pink-400",
                  hash: "border-red-500/30 text-red-400",
                  cve: "border-orange-500/30 text-orange-400",
                  username: "border-indigo-500/30 text-indigo-400",
                  bot_token: "border-slate-500/30 text-slate-400",
                };
                if (entries.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {lang === "uk" ? "Немає даних" : lang === "ru" ? "Нет данных" : lang === "es" ? "Sin datos" : lang === "de" ? "Keine Daten" : "No data"}
                    </p>
                  );
                }
                return entries.map(([type, count]: any) => (
                  <div key={type} className="space-y-1" data-testid={`check-type-${type}`}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={`text-[10px] uppercase ${typeBadgeColors[type] || "border-border text-muted-foreground"}`}>
                        {type}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{count}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted-foreground/10">
                      <div
                        className={`h-full rounded-full ${typeColors[type] || "bg-muted-foreground"}`}
                        style={{ width: `${Math.max((count / maxVal) * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        </motion.div>

        {/* C. Member Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/50" data-testid="section-member-leaderboard">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                {lang === "uk" ? "Рейтинг учасників" : lang === "ru" ? "Рейтинг участников" : lang === "es" ? "Clasificación de miembros" : lang === "de" ? "Mitglieder-Rangliste" : "Member Leaderboard"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="w-6 h-6 bg-muted-foreground/20 rounded-full animate-pulse" />
                      <div className="flex-1 h-4 bg-muted-foreground/20 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (() => {
                const memberStats = teamStats?.memberStats || [];
                const sorted = [...memberStats].sort((a: any, b: any) => (b.checkCount || 0) - (a.checkCount || 0));
                if (sorted.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {lang === "uk" ? "Немає даних" : lang === "ru" ? "Нет данных" : lang === "es" ? "Sin datos" : lang === "de" ? "Keine Daten" : "No data"}
                    </p>
                  );
                }
                const maxChecks = Math.max(...sorted.map((m: any) => m.checkCount || 0), 1);
                return sorted.map((member: any, idx: number) => (
                  <div
                    key={member.userId || idx}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                    data-testid={`leaderboard-member-${member.userId || idx}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-amber-500/20 text-amber-400" : idx === 1 ? "bg-slate-400/20 text-slate-300" : idx === 2 ? "bg-orange-500/20 text-orange-400" : "bg-muted-foreground/10 text-muted-foreground"}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">@{member.username || "unknown"}</span>
                        <Badge variant="outline" className="text-[10px]">{member.tier || "FREE"}</Badge>
                      </div>
                      <div className="mt-1 w-full h-1.5 rounded-full bg-muted-foreground/10">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${Math.max(((member.checkCount || 0) / maxChecks) * 100, 2)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {member.checkCount || 0} {lang === "uk" ? "перевірок" : lang === "ru" ? "проверок" : lang === "es" ? "verificaciones" : lang === "de" ? "Prüfungen" : "checks"}
                    </span>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        </motion.div>

        {/* D. Recent Team Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/50" data-testid="section-recent-activity">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <Activity className="w-4 h-4 text-green-400" />
                {lang === "uk" ? "Остання активність" : lang === "ru" ? "Последняя активность" : lang === "es" ? "Actividad reciente" : lang === "de" ? "Letzte Aktivität" : "Recent Activity"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex-1 h-4 bg-muted-foreground/20 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (() => {
                const reports = teamStats?.recentReports || [];
                const recent = reports.slice(0, 15);
                if (recent.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {lang === "uk" ? "Немає активності" : lang === "ru" ? "Нет активности" : lang === "es" ? "Sin actividad" : lang === "de" ? "Keine Aktivität" : "No activity"}
                    </p>
                  );
                }
                const riskColors: Record<string, string> = {
                  critical: "border-red-500/30 text-red-400",
                  high: "border-red-500/30 text-red-400",
                  medium: "border-amber-500/30 text-amber-400",
                  low: "border-green-500/30 text-green-400",
                };
                const typeColors: Record<string, string> = {
                  ip: "border-blue-500/30 text-blue-400",
                  domain: "border-purple-500/30 text-purple-400",
                  wallet: "border-amber-500/30 text-amber-400",
                  email: "border-green-500/30 text-green-400",
                  url: "border-cyan-500/30 text-cyan-400",
                  phone: "border-pink-500/30 text-pink-400",
                  hash: "border-red-500/30 text-red-400",
                  cve: "border-orange-500/30 text-orange-400",
                  username: "border-indigo-500/30 text-indigo-400",
                  bot_token: "border-slate-500/30 text-slate-400",
                };
                const timeAgo = (dateStr: string) => {
                  const diff = Date.now() - new Date(dateStr).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return lang === "uk" ? "щойно" : lang === "ru" ? "только что" : lang === "es" ? "ahora" : lang === "de" ? "gerade" : "just now";
                  if (mins < 60) return `${mins}${lang === "uk" ? "хв" : lang === "ru" ? "мин" : lang === "es" ? "min" : lang === "de" ? "Min" : "m"}`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}${lang === "uk" ? "год" : lang === "ru" ? "ч" : lang === "es" ? "h" : lang === "de" ? "Std" : "h"}`;
                  const days = Math.floor(hrs / 24);
                  return `${days}${lang === "uk" ? "д" : lang === "ru" ? "д" : lang === "es" ? "d" : lang === "de" ? "T" : "d"}`;
                };
                const maskTarget = (target: string) => {
                  if (!target) return "***";
                  if (target.length <= 6) return target[0] + "***" + target[target.length - 1];
                  return target.slice(0, 3) + "***" + target.slice(-3);
                };
                return recent.map((report: any, idx: number) => (
                  <div
                    key={report.id || idx}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                    data-testid={`activity-report-${report.id || idx}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">@{report.username || "unknown"}</span>
                        <Badge variant="outline" className={`text-[10px] uppercase ${typeColors[report.type] || "border-border text-muted-foreground"}`}>
                          {report.type || "?"}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground truncate">{maskTarget(report.target || "")}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${riskColors[(report.riskLevel || report.risk || "").toLowerCase()] || "border-border text-muted-foreground"}`}>
                      {report.riskLevel || report.risk || "—"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {timeAgo(report.createdAt || report.date || new Date().toISOString())}
                    </span>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center border border-violet-500/20">
          <Users className="w-7 h-7 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-teams-title">{t('nav.teams')}</h1>
        <p className="text-muted-foreground text-sm">{lang === "uk" ? "Керуйте своїми командами та співпрацюйте" : lang === "ru" ? "Управляйте командами и сотрудничайте" : lang === "es" ? "Gestiona tus equipos y colabora" : lang === "de" ? "Verwalte deine Teams und arbeite zusammen" : "Manage your teams and collaborate"}</p>
      </div>

      {!canCreateTeam && (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Shield className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{lang === "uk" ? "Оновити до GROUPS" : lang === "ru" ? "Обновить до GROUPS" : lang === "es" ? "Actualizar a GROUPS" : lang === "de" ? "Auf GROUPS upgraden" : "Upgrade to GROUPS"}</p>
                <p className="text-xs text-muted-foreground">{lang === "uk" ? "Командні функції потребують GROUPS ($55/міс) або ENTERPRISE" : lang === "ru" ? "Командные функции требуют GROUPS ($55/мес) или ENTERPRISE" : lang === "es" ? "Las funciones de equipo requieren GROUPS ($55/mes) o ENTERPRISE" : lang === "de" ? "Teamfunktionen erfordern GROUPS ($55/Mo) oder ENTERPRISE" : "Team features require GROUPS ($55/mo) or ENTERPRISE tier"}</p>
              </div>
              <Button size="sm" onClick={() => setLocation("/pricing")} data-testid="button-upgrade-groups">
                {t('pricing.upgrade')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canCreateTeam && (
        <AnimatePresence>
          {showCreateForm ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newTeamName.trim()) createTeamMutation.mutate(newTeamName.trim());
                    }}
                    className="space-y-3"
                  >
                    <Input
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder={lang === "uk" ? "Назва команди..." : lang === "ru" ? "Название команды..." : lang === "es" ? "Nombre del equipo..." : lang === "de" ? "Teamname..." : "Team name..."}
                      className="bg-white/5 border-white/10"
                      data-testid="input-team-name"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={createTeamMutation.isPending || !newTeamName.trim()}
                        className="flex-1 bg-violet-600"
                        data-testid="button-create-team"
                      >
                        {createTeamMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {lang === "uk" ? "Створити команду" : lang === "ru" ? "Создать команду" : lang === "es" ? "Crear equipo" : lang === "de" ? "Team erstellen" : "Create Team"}
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowCreateForm(false); setNewTeamName(""); }} data-testid="button-cancel-create">
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Button
              className="w-full bg-violet-600 gap-2"
              onClick={() => setShowCreateForm(true)}
              data-testid="button-show-create-team"
            >
              <Plus className="w-4 h-4" />
              {lang === "uk" ? "Створити нову команду" : lang === "ru" ? "Создать новую команду" : lang === "es" ? "Crear nuevo equipo" : lang === "de" ? "Neues Team erstellen" : "Create New Team"}
            </Button>
          )}
        </AnimatePresence>
      )}

      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const code = (e.target as HTMLFormElement).inviteCode.value.trim();
              if (code) {
                joinTeamMutation.mutate(code);
              }
            }}
            className="flex gap-2"
          >
            <Input
              name="inviteCode"
              placeholder="DS-XXXXXX"
              className="bg-white/5 border-white/10 font-mono flex-1"
              data-testid="input-join-invite-code"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={joinTeamMutation.isPending}
              data-testid="button-join-team"
            >
              {joinTeamMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {lang === "uk" ? "Приєднатися" : lang === "ru" ? "Вступить" : lang === "es" ? "Unirse" : lang === "de" ? "Beitreten" : "Join"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {teams.length === 0 && !showCreateForm && (
          <div className="text-center py-10">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{lang === "uk" ? "Ще немає команд" : lang === "ru" ? "Пока нет команд" : lang === "es" ? "Aún no hay equipos" : lang === "de" ? "Noch keine Teams" : "No teams yet"}</p>
          </div>
        )}

        {teams.map((team: any) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              className="border-border/50 bg-card/50 cursor-pointer hover-elevate"
              onClick={() => setSelectedTeamId(team.id)}
              data-testid={`card-team-${team.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center border border-violet-500/30 flex-shrink-0">
                    <Users className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid={`text-team-name-${team.id}`}>{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.role === "owner" ? (lang === "uk" ? "Власник" : lang === "ru" ? "Владелец" : lang === "es" ? "Propietario" : lang === "de" ? "Besitzer" : "Owner") : (lang === "uk" ? "Учасник" : lang === "ru" ? "Участник" : lang === "es" ? "Miembro" : lang === "de" ? "Mitglied" : "Member")}
                    </p>
                  </div>
                  {team.memberCount != null && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Users className="w-3 h-3 mr-1" />
                      {team.memberCount}
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-[10px] ${team.role === "owner" ? "border-amber-500/30 text-amber-400" : "border-violet-500/30 text-violet-400"}`}>
                    {team.role === "owner" ? (lang === "uk" ? "Власник" : lang === "ru" ? "Владелец" : lang === "es" ? "Propietario" : lang === "de" ? "Besitzer" : "Owner") : (lang === "uk" ? "Учасник" : lang === "ru" ? "Участник" : lang === "es" ? "Miembro" : lang === "de" ? "Mitglied" : "Member")}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Teams() {
  const isStandalone = useIsStandalone();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <Shield className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <PageLayout title="Teams" appMode={isStandalone}>
        <TeamsContent />
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="relative z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer" onClick={() => setLocation("/")} data-testid="link-home-brand-teams">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-base sm:text-lg">DARKSHARE</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="minimal" />
            <MobileMenu isAuthenticated={false} />
          </div>
        </div>
      </nav>
      <div className="flex-1">
        <TeamsContent />
      </div>
      <Footer />
    </div>
  );
}
