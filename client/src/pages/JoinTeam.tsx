import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Shield, Loader2, CheckCircle, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function JoinTeam() {
  const [, params] = useRoute("/teams/join/:code");
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { lang } = useTranslation();
  const [joined, setJoined] = useState(false);

  const joinMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await apiRequest("POST", "/api/teams/join", { inviteCode });
      return res.json();
    },
    onSuccess: () => {
      setJoined(true);
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && params?.code && !joined && !joinMutation.isPending && !joinMutation.isError) {
      joinMutation.mutate(params.code);
    }
  }, [authLoading, isAuthenticated, params?.code]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-border/50 bg-card/50">
          <CardContent className="py-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold">
              {lang === "uk" ? "Увійдіть, щоб приєднатися" : lang === "ru" ? "Войдите, чтобы присоединиться" : lang === "es" ? "Inicia sesión para unirte" : lang === "de" ? "Melde dich an, um beizutreten" : "Sign in to join"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lang === "uk" ? "Вам потрібно увійти в акаунт, щоб приєднатися до команди." : lang === "ru" ? "Вам нужно войти в аккаунт, чтобы присоединиться к команде." : "You need to sign in to join a team."}
            </p>
            <Button onClick={() => setLocation("/login")} data-testid="button-login-to-join">
              {lang === "uk" ? "Увійти" : lang === "ru" ? "Войти" : "Sign In"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-sm w-full border-border/50 bg-card/50">
        <CardContent className="py-8 text-center space-y-4">
          {joinMutation.isPending && (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                {lang === "uk" ? "Приєднання до команди..." : lang === "ru" ? "Присоединение к команде..." : "Joining team..."}
              </p>
            </>
          )}
          {joined && (
            <>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-lg font-bold">
                {lang === "uk" ? "Ви приєдналися!" : lang === "ru" ? "Вы присоединились!" : "You joined!"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === "uk" ? "Ви успішно приєдналися до команди." : lang === "ru" ? "Вы успешно присоединились к команде." : "You have successfully joined the team."}
              </p>
              <Button onClick={() => setLocation("/teams")} data-testid="button-go-to-teams">
                <Users className="w-4 h-4 mr-2" />
                {lang === "uk" ? "Перейти до команд" : lang === "ru" ? "Перейти к командам" : "Go to Teams"}
              </Button>
            </>
          )}
          {joinMutation.isError && (
            <>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-lg font-bold">
                {lang === "uk" ? "Помилка" : lang === "ru" ? "Ошибка" : "Error"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {joinMutation.error?.message || "Failed to join team"}
              </p>
              <Button variant="outline" onClick={() => setLocation("/teams")} data-testid="button-back-to-teams">
                {lang === "uk" ? "До команд" : lang === "ru" ? "К командам" : "Back to Teams"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
