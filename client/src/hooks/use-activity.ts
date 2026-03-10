import { useQuery } from "@tanstack/react-query";

interface Activity {
  type: string;
  target: string;
  riskLevel: string;
  timestamp: string;
}

export function useActivity() {
  return useQuery<Activity[]>({
    queryKey: ["/api/activity"],
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

interface LeaderboardEntry {
  username: string;
  checks: number;
  streakDays: number;
}

export function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
