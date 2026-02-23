import {WebRTCConnection, VideoInspectionParticipant} from '@permits/src/types/video-inspection';

/**
 * WebRTC Service for video inspection calls
 */
export class WebRTCService {
  private connections: Map<string, WebRTCConnection> = new Map();

  /**
   * Initialize WebRTC connection for inspection
   */
  async initializeConnection(
    inspectionId: string,
    iceServers: RTCIceServer[] = [
      {urls: 'stun:stun.l.google.com:19302'},
      {urls: 'stun:stun1.l.google.com:19302'},
    ],
  ): Promise<WebRTCConnection> {
    const connection: WebRTCConnection = {
      id: `connection-${inspectionId}-${Date.now()}`,
      inspectionId,
      remoteStreams: new Map(),
      peerConnections: new Map(),
      iceServers,
    };

    this.connections.set(inspectionId, connection);
    return connection;
  }

  /**
   * Get local media stream (camera + microphone)
   */
  async getLocalStream(
    constraints: MediaStreamConstraints = {
      video: {width: 1280, height: 720, facingMode: 'user'},
      audio: true,
    },
  ): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone');
    }
  }

  /**
   * Get screen share stream
   */
  async getScreenShareStream(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {cursor: 'always', displaySurface: 'monitor'},
        audio: true,
      });
      return stream;
    } catch (error) {
      console.error('Error accessing screen share:', error);
      throw new Error('Failed to access screen share');
    }
  }

  /**
   * Create peer connection
   */
  createPeerConnection(
    inspectionId: string,
    participantId: string,
    iceServers: RTCIceServer[],
  ): RTCPeerConnection {
    const connection = this.connections.get(inspectionId);
    if (!connection) {
      throw new Error('Connection not initialized');
    }

    const peerConnection = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10,
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to signaling server
        this.sendIceCandidate(inspectionId, participantId, event.candidate);
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      connection.remoteStreams.set(participantId, remoteStream);
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed') {
        peerConnection.restartIce();
      }
    };

    connection.peerConnections.set(participantId, peerConnection);
    return peerConnection;
  }

  /**
   * Create offer for peer connection
   */
  async createOffer(
    inspectionId: string,
    participantId: string,
    localStream: MediaStream,
  ): Promise<RTCSessionDescriptionInit> {
    const connection = this.connections.get(inspectionId);
    if (!connection) {
      throw new Error('Connection not initialized');
    }

    const peerConnection = connection.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    // Add local stream tracks
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(
    inspectionId: string,
    participantId: string,
    offer: RTCSessionDescriptionInit,
    localStream: MediaStream,
  ): Promise<RTCSessionDescriptionInit> {
    const connection = this.connections.get(inspectionId);
    if (!connection) {
      throw new Error('Connection not initialized');
    }

    let peerConnection = connection.peerConnections.get(participantId);
    if (!peerConnection) {
      peerConnection = this.createPeerConnection(
        inspectionId,
        participantId,
        connection.iceServers,
      );
    }

    // Add local stream tracks
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    return answer;
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(
    inspectionId: string,
    participantId: string,
    answer: RTCSessionDescriptionInit,
  ): Promise<void> {
    const connection = this.connections.get(inspectionId);
    if (!connection) {
      throw new Error('Connection not initialized');
    }

    const peerConnection = connection.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Handle ICE candidate
   */
  async handleIceCandidate(
    inspectionId: string,
    participantId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const connection = this.connections.get(inspectionId);
    if (!connection) {
      throw new Error('Connection not initialized');
    }

    const peerConnection = connection.peerConnections.get(participantId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * Send ICE candidate to signaling server (implement based on your signaling server)
   */
  private async sendIceCandidate(
    inspectionId: string,
    participantId: string,
    candidate: RTCIceCandidate | null,
  ): Promise<void> {
    if (!candidate) return;

    // Implement signaling server communication
    // This would typically use WebSocket or HTTP
    try {
      await fetch(`/api/video-inspections/${inspectionId}/signaling/ice-candidate`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          participantId,
          candidate: candidate.toJSON(),
        }),
      });
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
    }
  }

  /**
   * Stop all connections and cleanup
   */
  async cleanup(inspectionId: string): Promise<void> {
    const connection = this.connections.get(inspectionId);
    if (!connection) return;

    // Stop local stream
    if (connection.localStream) {
      connection.localStream.getTracks().forEach((track) => track.stop());
    }

    // Close peer connections
    connection.peerConnections.forEach((pc) => {
      pc.close();
    });

    // Stop remote streams
    connection.remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });

    this.connections.delete(inspectionId);
  }

  /**
   * Get connection by inspection ID
   */
  getConnection(inspectionId: string): WebRTCConnection | undefined {
    return this.connections.get(inspectionId);
  }
}

// Singleton instance
export const webrtcService = new WebRTCService();
