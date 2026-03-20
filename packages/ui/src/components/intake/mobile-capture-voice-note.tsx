'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, CheckCircle, X, Play, Pause } from 'lucide-react'

interface MobileCaptureVoiceNoteProps {
  captureSessionId: string
  captureToken: string
  zone: string
  onRecorded: (voiceNoteId: string) => void
}

export function MobileCaptureVoiceNote({
  captureSessionId,
  captureToken,
  zone,
  onRecorded,
}: MobileCaptureVoiceNoteProps) {
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        await uploadVoiceNote(blob)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch {
      setError('Microphone access denied — please allow microphone and try again')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    setRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  async function uploadVoiceNote(blob: Blob) {
    setUploading(true)
    setError(null)
    try {
      // Step 1: Upload blob
      const form = new FormData()
      form.append('file', blob, 'voice-note.webm')
      form.append('captureToken', captureToken)
      form.append('zone', zone)
      form.append('type', 'voice_note')

      const uploadResp = await fetch('/api/capture/upload-file', {
        method: 'POST',
        body: form,
      })
      if (!uploadResp.ok) throw new Error('Upload failed')
      const { storageUrl, storagePath } = await uploadResp.json() as {
        storageUrl: string
        storagePath: string
      }

      // Step 2: Register voice note
      const regResp = await fetch('/api/capture/voice-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captureToken,
          captureSessionId,
          zone,
          storageUrl,
          storagePath,
          durationSeconds: duration,
        }),
      })
      if (!regResp.ok) throw new Error('Registration failed')
      const { voiceNoteId } = await regResp.json() as { voiceNoteId: string }
      setRecorded(true)
      onRecorded(voiceNoteId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function togglePlay() {
    if (!audioRef.current || !audioUrl) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (recorded) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle className="h-10 w-10 text-green-500" />
        <p className="font-semibold text-green-800">Voice note recorded</p>
        {audioUrl && (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
            <button
              onClick={togglePlay}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-green-700 shadow-sm"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? 'Pause' : 'Play back'}
            </button>
          </>
        )}
        <button
          onClick={() => {
            setRecorded(false)
            setAudioBlob(null)
            setAudioUrl(null)
          }}
          className="text-xs text-gray-400 underline"
        >
          Record another
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <p className="text-center text-sm text-gray-500">
        Record a voice note to describe what you see in this zone.
        <br />
        Useful for conditions, notes to the designer, or special details.
      </p>

      {/* Recording indicator */}
      {recording && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-600">
            Recording — {formatDuration(duration)}
          </span>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading voice note…
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 w-full">
          <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main record button */}
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={uploading}
        className={`flex h-20 w-20 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-50 ${
          recording ? 'bg-red-500 shadow-lg shadow-red-200' : ''
        }`}
        style={!recording ? { backgroundColor: '#1A2B4A' } : undefined}
      >
        {recording ? (
          <Square className="h-8 w-8 fill-white text-white" />
        ) : (
          <Mic className="h-8 w-8 text-white" />
        )}
      </button>

      <p className="text-xs text-gray-400">
        {recording ? 'Tap to stop recording' : 'Tap to start recording'}
      </p>

      {/* Preview if audio captured but not yet saved (rare edge case) */}
      {audioBlob && !recorded && !uploading && (
        <button
          onClick={() => uploadVoiceNote(audioBlob)}
          className="rounded-lg bg-orange-50 px-4 py-2 text-sm text-orange-600 border border-orange-200"
        >
          Retry upload
        </button>
      )}
    </div>
  )
}
