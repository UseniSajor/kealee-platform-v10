/**
 * PM Focus Mode Service
 * Manages focus mode sessions and DND integrations
 */

import { prisma } from '@kealee/database'

export interface FocusModeSession {
  id: string
  pmId: string
  taskId: string
  startTime: Date
  endTime?: Date
  duration: number // minutes
  integrations: string[] // ['slack', 'teams', 'email']
  status: 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED'
}

export const pmFocusModeService = {
  /**
   * Enable focus mode for a PM
   */
  async enableFocusMode(
    pmId: string,
    taskId: string,
    duration: number,
    integrations: string[]
  ): Promise<FocusModeSession> {
    // End any existing focus sessions
    await prisma.focusSession?.updateMany({
      where: {
        pmId,
        status: 'ACTIVE',
      },
      data: {
        status: 'INTERRUPTED',
        endTime: new Date(),
      },
    }).catch(() => {})

    // Create new focus session
    const session = await prisma.focusSession?.create({
      data: {
        pmId,
        taskId,
        startTime: new Date(),
        duration,
        integrations: integrations || [],
        status: 'ACTIVE',
      },
    }).catch(() => null)

    if (!session) {
      // Fallback if model doesn't exist
      return {
        id: `focus-${Date.now()}`,
        pmId,
        taskId,
        startTime: new Date(),
        duration,
        integrations,
        status: 'ACTIVE',
      }
    }

    // Trigger integrations (Slack, Teams, Email)
    await this.triggerIntegrations(pmId, integrations, true)

    return {
      id: session.id,
      pmId: session.pmId,
      taskId: session.taskId,
      startTime: session.startTime,
      duration: session.duration,
      integrations: (session.integrations as string[]) || [],
      status: session.status as 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED',
    }
  },

  /**
   * Disable focus mode
   */
  async disableFocusMode(pmId: string): Promise<void> {
    // End active focus session
    await prisma.focusSession?.updateMany({
      where: {
        pmId,
        status: 'ACTIVE',
      },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
      },
    }).catch(() => {})

    // Trigger integrations to restore notifications
    await this.triggerIntegrations(pmId, ['slack', 'teams', 'email'], false)
  },

  /**
   * Get active focus session
   */
  async getActiveFocusSession(pmId: string): Promise<FocusModeSession | null> {
    const session = await prisma.focusSession?.findFirst({
      where: {
        pmId,
        status: 'ACTIVE',
      },
    }).catch(() => null)

    if (!session) return null

    return {
      id: session.id,
      pmId: session.pmId,
      taskId: session.taskId,
      startTime: session.startTime,
      endTime: session.endTime || undefined,
      duration: session.duration,
      integrations: (session.integrations as string[]) || [],
      status: session.status as 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED',
    }
  },

  /**
   * Trigger integrations (Slack, Teams, Email)
   */
  async triggerIntegrations(pmId: string, integrations: string[], enable: boolean): Promise<void> {
    // This would integrate with actual Slack/Teams APIs
    // For now, we'll log the action
    console.log(`Focus mode ${enable ? 'enabled' : 'disabled'} for PM ${pmId}`, {
      integrations,
      action: enable ? 'SET_DND' : 'CLEAR_DND',
    })

    // TODO: Implement actual integrations
    // - Slack API: Set user's DND status
    // - Teams API: Set user's presence to "Do Not Disturb"
    // - Email: Pause email notifications
  },
}
