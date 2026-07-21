/**
 * Mobile Data Sync
 * Offline-first data synchronization for mobile PM app
 */

interface PendingChange {
  id: string
  type: string
  endpoint: string
  data: any
  timestamp: Date
  retries: number
}

const STORAGE_KEY = "pm_pending_changes"
const MAX_RETRIES = 3

class MobileDataSync {
  /**
   * Get all pending changes from local storage
   */
  async getPendingChanges(): Promise<PendingChange[]> {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const changes = JSON.parse(stored) as PendingChange[]
      return changes.map((change) => ({
        ...change,
        timestamp: new Date(change.timestamp),
      }))
    } catch (error) {
      console.error("Error reading pending changes:", error)
      return []
    }
  }

  /**
   * Queue a change for offline sync
   */
  async queueChange(change: Omit<PendingChange, "id" | "timestamp" | "retries">): Promise<void> {
    const pendingChanges = await this.getPendingChanges()

    const newChange: PendingChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retries: 0,
      ...change,
    }

    pendingChanges.push(newChange)
    await this.savePendingChanges(pendingChanges)
  }

  /**
   * Save pending changes to local storage
   */
  private async savePendingChanges(changes: PendingChange[]): Promise<void> {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(changes))
    } catch (error) {
      console.error("Error saving pending changes:", error)
    }
  }

  /**
   * Mark a change as synced
   */
  async markChangeSynced(changeId: string): Promise<void> {
    const pendingChanges = await this.getPendingChanges()
    const updated = pendingChanges.filter((change) => change.id !== changeId)
    await this.savePendingChanges(updated)
  }

  /**
   * Queue a change for retry
   */
  async queueForRetry(changeId: string): Promise<void> {
    const pendingChanges = await this.getPendingChanges()
    const updated = pendingChanges.map((change) => {
      if (change.id === changeId) {
        return {
          ...change,
          retries: change.retries + 1,
        }
      }
      return change
    })

    // Remove changes that have exceeded max retries
    const filtered = updated.filter((change) => change.retries < MAX_RETRIES)
    await this.savePendingChanges(filtered)
  }

  /**
   * Sync all offline changes
   */
  async syncOfflineChanges(): Promise<{ synced: number; failed: number; pending: number }> {
    const pendingChanges = await this.getPendingChanges()
    let synced = 0
    let failed = 0

    for (const change of pendingChanges) {
      try {
        // Make API call
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${change.endpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await this.getAuthToken()}`,
            },
            body: JSON.stringify(change.data),
          }
        )

        if (response.ok) {
          await this.markChangeSynced(change.id)
          synced++
        } else {
          await this.queueForRetry(change.id)
          failed++
        }
      } catch (error) {
        console.error(`Error syncing change ${change.id}:`, error)
        await this.queueForRetry(change.id)
        failed++
      }
    }

    const remaining = await this.getPendingChanges()

    return {
      synced,
      failed,
      pending: remaining.length,
    }
  }

  /**
   * Get auth token
   */
  private async getAuthToken(): Promise<string> {
    const { supabase } = await import("@pm/lib/supabase")
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token || ""
  }

  /**
   * Clear all pending changes (use with caution)
   */
  async clearPendingChanges(): Promise<void> {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Export singleton instance
export const mobileDataSync = new MobileDataSync()




