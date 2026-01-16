import { prisma } from "@kealee/database"

/**
 * PM service (MVP stub).
 *
 * The database schema in this repo currently doesn't include dedicated PM
 * task/client models yet, so these methods return safe defaults while the
 * OS-PM UI is being built out UI-first.
 */
class PMService {
  async getStatsForUser(userId: string) {
    // Ensure the user exists in local DB
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })

    return {
      name: user?.name ?? undefined,
      tasksToday: 0,
      highPriority: 0,
      totalClients: 0,
      activeProjects: 0,
      hoursThisWeek: 0,
      billablePercent: 0,
      satisfactionScore: 0,
    }
  }

  async listMyClients(_userId: string, _opts?: { active?: boolean; limit?: number }) {
    return []
  }

  async listMyTasks(_userId: string, _opts?: { priority?: string; limit?: number }) {
    return []
  }

  async getTask(_userId: string, _taskId: string) {
    return null
  }
}

export const pmService = new PMService()

