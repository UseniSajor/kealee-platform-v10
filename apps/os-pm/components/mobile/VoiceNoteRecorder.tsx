"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { Mic, Square, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface VoiceNoteRecorderProps {
  onRecordComplete: (audioBlob: Blob) => void
}

export function VoiceNoteRecorder({ onRecordComplete }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        onRecordComplete(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Microphone access denied. Please enable microphone permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
    }
  }

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {!isRecording && !audioUrl && (
            <Button
              onClick={startRecording}
              variant="default"
              size="sm"
              className="rounded-full"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}

          {isRecording && (
            <>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="sm"
                className="rounded-full"
              >
                <Square className="h-4 w-4" />
              </Button>
              <span className="text-xs text-red-600 animate-pulse">Recording...</span>
            </>
          )}

          {audioUrl && !isRecording && (
            <>
              <Button
                onClick={playRecording}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

