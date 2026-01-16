'use client';

import React, {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Video, VideoOff, Mic, MicOff, Monitor, X, Users} from 'lucide-react';
import {webrtcService} from '@/services/video-inspection/webrtc-service';
import {recordingService} from '@/services/video-inspection/recording-service';
import {VideoInspection, VideoInspectionParticipant} from '@/types/video-inspection';

interface VideoConferenceProps {
  inspection: VideoInspection;
  currentUserId: string;
  onEndCall: () => void;
  onParticipantUpdate: (participants: VideoInspectionParticipant[]) => void;
}

export function VideoConference({
  inspection,
  currentUserId,
  onEndCall,
  onParticipantUpdate,
}: VideoConferenceProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<VideoInspectionParticipant[]>(
    inspection.participants,
  );

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Initialize WebRTC connection
      const connection = await webrtcService.initializeConnection(inspection.id);

      // Get local media stream
      const stream = await webrtcService.getLocalStream();
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Start recording if inspector
      const currentParticipant = participants.find((p) => p.userId === currentUserId);
      if (currentParticipant?.role === 'inspector') {
        await recordingService.startRecording(stream);
        setIsRecording(true);
      }

      // Connect to other participants
      await connectToParticipants();
    } catch (error) {
      console.error('Error initializing call:', error);
    }
  };

  const connectToParticipants = async () => {
    // Implement peer connection logic
    // This would typically involve signaling server communication
    for (const participant of participants) {
      if (participant.userId !== currentUserId && participant.isConnected) {
        // Create peer connection and handle remote stream
        const peerConnection = webrtcService.createPeerConnection(
          inspection.id,
          participant.id,
          [
            {urls: 'stun:stun.l.google.com:19302'},
            {urls: 'stun:stun1.l.google.com:19302'},
          ],
        );

        // Handle remote stream when received
        peerConnection.ontrack = (event) => {
          const [remoteStream] = event.streams;
          setRemoteStreams((prev) => {
            const updated = new Map(prev);
            updated.set(participant.id, remoteStream);
            return updated;
          });
        };
      }
    }
  };

  const toggleVideo = async () => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsVideoEnabled(!isVideoEnabled);
    updateParticipantStatus('videoEnabled', !isVideoEnabled);
  };

  const toggleAudio = async () => {
    if (!localStream) return;

    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsAudioEnabled(!isAudioEnabled);
    updateParticipantStatus('audioEnabled', !isAudioEnabled);
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen share
        const screenStream = await webrtcService.getScreenShareStream();
        screenStream.getTracks().forEach((track) => track.stop());
        setIsScreenSharing(false);
      } else {
        // Start screen share
        const screenStream = await webrtcService.getScreenShareStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const endCall = async () => {
    // Stop recording
    if (isRecording) {
      const blob = await recordingService.stopRecording();
      // Upload recording
      await recordingService.uploadRecording(blob, inspection.id, {
        encrypt: true,
        generateThumbnail: true,
        generateTranscript: true,
      });
    }

    // Cleanup
    await cleanup();
    onEndCall();
  };

  const cleanup = async () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    await webrtcService.cleanup(inspection.id);
    recordingService.cleanup();
  };

  const updateParticipantStatus = (field: string, value: boolean) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === currentUserId ? {...p, [field]: value} : p)),
    );
    onParticipantUpdate(participants);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* Local Video */}
        <Card className="relative bg-black overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            You {isVideoEnabled ? '' : '(Video Off)'}
          </div>
        </Card>

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([participantId, stream]) => {
          const participant = participants.find((p) => p.id === participantId);
          return (
            <Card key={participantId} className="relative bg-black overflow-hidden">
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideoRefs.current.set(participantId, el);
                    el.srcObject = stream;
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {participant?.name || 'Participant'}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-center gap-4">
        <Button
          variant={isVideoEnabled ? 'default' : 'destructive'}
          size="lg"
          onClick={toggleVideo}>
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        <Button
          variant={isAudioEnabled ? 'default' : 'destructive'}
          size="lg"
          onClick={toggleAudio}>
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          variant={isScreenSharing ? 'default' : 'outline'}
          size="lg"
          onClick={toggleScreenShare}>
          <Monitor className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5" />
          <span>{participants.length} participants</span>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span>Recording</span>
          </div>
        )}

        <Button variant="destructive" size="lg" onClick={endCall}>
          <X className="w-5 h-5" />
          End Call
        </Button>
      </div>
    </div>
  );
}
