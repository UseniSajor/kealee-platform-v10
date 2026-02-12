/**
 * PM Focus Mode Service
 * Manages focus mode sessions and DND integrations
 */

import { prismaAny } from '../../utils/prisma-helper'

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
    await prismaAny.focusSession?.updateMany({
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
    const session = await prismaAny.focusSession?.create({
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
    await prismaAny.focusSession?.updateMany({
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
    const session = await prismaAny.focusSession?.findFirst({
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

    // Set notification preference to silenced during focus mode
    await prismaAny.user.update({
      where: { id: pmId },
      data: {
        notificationPreferences: enable
          ? { silenced: true, focusMode: true, integrations }
          : { silenced: false, focusMode: false },
      },
    }).catch(() => {})

    // Create a focus session activity log entry
    await prismaAny.auditLog.create({
      data: {
        entityType: 'User',
        entityId: pmId,
        action: enable ? 'FOCUS_MODE_ENABLED' : 'FOCUS_MODE_DISABLED',
        details: { integrations, action: enable ? 'SET_DND' : 'CLEAR_DND' },
        userId: pmId,
        reason: enable ? 'Focus mode session started' : 'Focus mode session ended',
      },
    }).catch(() => {})
  },
}




