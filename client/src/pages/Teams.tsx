import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
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
  const { t } = useTranslation();
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [addUsername, setAddUsername] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  const createTeamMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/teams", { name });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('common.success'), description: "Team created" });
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
      toast({ title: t('common.success'), description: "Member added" });
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
      toast({ title: t('common.success'), description: "Member removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeamId, "members"] });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const res = await apiRequest("DELETE", `/api/teams/${teamId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('common.success'), description: "Team deleted" });
      setSelectedTeamId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
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
                {teamDetail.members.length + 1}/{teamDetail.team.maxMembers || 10} members
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
              Owner
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
              <Users className="w-4 h-4 text-violet-400" />
              Members ({teamDetail.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teamDetail.members.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
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
                    placeholder="Telegram username..."
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
        <p className="text-muted-foreground text-sm">Manage your teams and collaborate</p>
      </div>

      {!canCreateTeam && (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Shield className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Upgrade to GROUPS</p>
                <p className="text-xs text-muted-foreground">Team features require GROUPS ($65/mo) or ENTERPRISE tier</p>
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
                      placeholder="Team name..."
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
                        Create Team
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
              Create New Team
            </Button>
          )}
        </AnimatePresence>
      )}

      <div className="space-y-3">
        {teams.length === 0 && !showCreateForm && (
          <div className="text-center py-10">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No teams yet</p>
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
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30 flex-shrink-0">
                    <Users className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid={`text-team-name-${team.id}`}>{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.role === "owner" ? "Owner" : "Member"}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${team.role === "owner" ? "border-amber-500/30 text-amber-400" : "border-violet-500/30 text-violet-400"}`}>
                    {team.role === "owner" ? "Owner" : "Member"}
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
      <PageLayout>
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
