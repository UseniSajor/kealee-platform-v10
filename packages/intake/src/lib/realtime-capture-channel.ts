export const CAPTURE_EVENTS = {
  SESSION_STARTED: "capture.session.started",
  ZONE_STARTED: "capture.zone.started",
  ASSET_UPLOADED: "capture.asset.uploaded",
  VOICE_NOTE_UPLOADED: "capture.voice_note.uploaded",
  ZONE_COMPLETED: "capture.zone.completed",
  SESSION_PROGRESS: "capture.session.progress",
  SESSION_COMPLETED: "capture.session.completed",
} as const;

export type CaptureEventType = (typeof CAPTURE_EVENTS)[keyof typeof CAPTURE_EVENTS];

export interface CaptureRealtimeEvent {
  event: CaptureEventType;
  captureSessionId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface CaptureProgressPayload {
  captureSessionId: string;
  currentZone?: string;
  completedZones: string[];
  requiredZones: string[];
  progressPercent: number;
  uploadedAssetsCount: number;
  voiceNotesCount: number;
  walkthroughVideoUploaded: boolean;
  status: string;
}

export function buildChannelName(captureSessionId: string): string {
  return `capture:${captureSessionId}`;
}

export function buildProgressPayload(args: CaptureProgressPayload): CaptureRealtimeEvent {
  return {
    event: CAPTURE_EVENTS.SESSION_PROGRESS,
    captureSessionId: args.captureSessionId,
    payload: { ...args },
    timestamp: new Date().toISOString(),
  };
}

export interface RealtimeClient {
  channel: (name: string) => {
    on: (
      type: string,
      filter: Record<string, unknown>,
      callback: (payload: { payload: unknown }) => void,
    ) => { subscribe: () => { unsubscribe: () => void } };
  };
}

export function subscribeToCaptureChannel(
  supabaseClient: RealtimeClient,
  options: {
    captureSessionId: string;
    onProgress: (payload: CaptureProgressPayload) => void;
    onCompleted: () => void;
  },
): () => void {
  const channelName = buildChannelName(options.captureSessionId);
  const channel = supabaseClient
    .channel(channelName)
    .on("broadcast", { event: CAPTURE_EVENTS.SESSION_PROGRESS }, (msg) => {
      options.onProgress(msg.payload as CaptureProgressPayload);
    })
    .on("broadcast", { event: CAPTURE_EVENTS.SESSION_COMPLETED }, () => {
      options.onCompleted();
    })
    .subscribe();

  return () => channel.unsubscribe();
}
