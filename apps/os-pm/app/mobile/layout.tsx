"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { SwipeableTaskList } from "@/components/mobile/SwipeableTaskList"
import { QuickAction } from "@/components/mobile/QuickAction"
import { OfflineSyncIndicator } from "@/components/mobile/OfflineSyncIndicator"
import { VoiceNoteRecorder } from "@/components/mobile/VoiceNoteRecorder"
import { BarcodeScanner } from "@/components/mobile/BarcodeScanner"
import { mobileDataSync } from "@/lib/mobile-data-sync"

export default function MobilePMLayout() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingChanges, setPendingChanges] = useState(0)

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Get today's priority tasks
  const { data: tasksData } = useQuery({
    queryKey: ["pm-tasks", "today", "priority"],
    queryFn: async () => {
      return api.getMyTasks?.({ priority: "HIGH", limit: 10 })
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const todaysPriorityTasks = tasksData?.tasks || []

  // Sync offline changes when online
  useEffect(() => {
    if (isOnline) {
      mobileDataSync.syncOfflineChanges().then((synced) => {
        setPendingChanges(synced.pending)
      })
    }
  }, [isOnline])

  // Quick action handlers
  const takeSitePhoto = async () => {
    // Open camera for site photo
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Handle photo capture
      // This would integrate with camera API
    }
  }

  const openTaskCompletion = () => {
    // Navigate to task completion
    window.location.href = "/queue"
  }

  const openDailyLog = () => {
    // Navigate to daily log
    window.location.href = "/time-tracking"
  }

  const reportIssue = () => {
    // Open issue reporting modal
    alert("Report Issue - Feature coming soon")
  }

  const saveVoiceNote = async (audioBlob: Blob) => {
    // Save voice note
    const formData = new FormData()
    formData.append("audio", audioBlob, "voice-note.webm")
    
    try {
      await api.uploadVoiceNote?.(formData)
    } catch (error) {
      // Queue for offline sync
      await mobileDataSync.queueChange({
        type: "voice_note",
        endpoint: "/pm/voice-notes",
        data: formData,
      })
    }
  }

  const scanMaterial = async (barcode: string) => {
    // Handle barcode scan
    try {
      await api.scanMaterial?.(barcode)
    } catch (error) {
      // Queue for offline sync
      await mobileDataSync.queueChange({
        type: "material_scan",
        endpoint: "/pm/materials/scan",
        data: { barcode },
      })
    }
  }

  return (
    <div className="mobile-pm-app min-h-screen bg-neutral-50 pb-20">
      {/* Today's Priority Tasks */}
      <section className="priority-tasks p-4">
        <h2 className="text-xl font-bold mb-4">Today's Focus</h2>
        <SwipeableTaskList tasks={todaysPriorityTasks} />
      </section>

      {/* Quick Actions */}
      <section className="quick-actions-grid p-4">
        <div className="grid grid-cols-2 gap-4">
          <QuickAction
            icon="📸"
            label="Site Photo"
            onClick={takeSitePhoto}
            integration="m-permits-inspections"
          />
          <QuickAction
            icon="✅"
            label="Complete Task"
            onClick={openTaskCompletion}
          />
          <QuickAction
            icon="📝"
            label="Daily Log"
            onClick={openDailyLog}
          />
          <QuickAction
            icon="🚨"
            label="Report Issue"
            onClick={reportIssue}
          />
        </div>
      </section>

      {/* Offline Mode Indicator */}
      <OfflineSyncIndicator isOnline={isOnline} pendingChanges={pendingChanges} />

      {/* Voice Notes */}
      <VoiceNoteRecorder onRecordComplete={saveVoiceNote} />

      {/* Barcode Scanner */}
      <BarcodeScanner onScan={scanMaterial} />
    </div>
  )
}
