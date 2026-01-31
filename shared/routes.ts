import { z } from 'zod';
import { insertUserSchema, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    get: {
      method: 'GET' as const,
      path: '/api/users/:tgId',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          totalUsers: z.number(),
          activeWatches: z.number(),
          totalReports: z.number(),
          checksToday: z.number(),
          threatsBlocked: z.number(),
          uptime: z.number(),
        }),
      },
    }
  },
  activity: {
    get: {
      method: 'GET' as const,
      path: '/api/activity',
      responses: {
        200: z.array(z.object({
          type: z.string(),
          target: z.string(),
          riskLevel: z.string(),
          timestamp: z.string(),
        })),
      },
    }
  },
  leaderboard: {
    get: {
      method: 'GET' as const,
      path: '/api/leaderboard',
      responses: {
        200: z.array(z.object({
          username: z.string(),
          checks: z.number(),
          streakDays: z.number(),
        })),
      },
    }
  },
  check: {
    perform: {
      method: 'POST' as const,
      path: '/api/check',
      input: z.object({
        type: z.enum(['ip', 'wallet', 'email', 'phone', 'domain', 'url', 'bot', 'cve', 'hash', 'username']),
        value: z.string().min(1),
      }),
      responses: {
        200: z.object({
          type: z.string(),
          target: z.string(),
          riskScore: z.number(),
          riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
          summary: z.string(),
          details: z.record(z.any()),
          findings: z.array(z.string()),
          sources: z.array(z.string()),
          timestamp: z.string(),
        }),
        400: z.object({
          error: z.string(),
        }),
      },
    }
  },
  reports: {
    list: {
      method: 'GET' as const,
      path: '/api/reports',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          type: z.string(),
          target: z.string(),
          riskLevel: z.string(),
          riskScore: z.number(),
          createdAt: z.string(),
        })),
      },
    },
    download: {
      method: 'GET' as const,
      path: '/api/reports/:id/pdf',
      responses: {
        200: z.any(),
        404: z.object({ error: z.string() }),
      },
    }
  },
  watches: {
    list: {
      method: 'GET' as const,
      path: '/api/watches',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          objectType: z.string(),
          value: z.string(),
          status: z.string(),
          lastCheck: z.string().nullable(),
          createdAt: z.string(),
        })),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/watches',
      input: z.object({
        type: z.string(),
        value: z.string(),
        threshold: z.number().optional(),
      }),
      responses: {
        201: z.object({ id: z.number(), message: z.string() }),
        400: z.object({ error: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/watches/:id',
      responses: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string() }),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
