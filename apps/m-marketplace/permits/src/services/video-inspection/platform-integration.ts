import {ZoomMeeting, TeamsMeeting, ZoomConfig, TeamsConfig} from '@permits/src/types/video-inspection';

/**
 * Platform Integration Service
 * Integrates with Zoom, Teams, and custom WebRTC
 */
export class PlatformIntegrationService {
  /**
   * Create Zoom meeting for inspection
   */
  async createZoomMeeting(
    inspectionId: string,
    scheduledTime: Date,
    duration: number,
    config: ZoomConfig,
  ): Promise<ZoomMeeting> {
    try {
      const response = await fetch('/api/video-inspections/zoom/create-meeting', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          inspectionId,
          scheduledTime: scheduledTime.toISOString(),
          duration,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Zoom meeting');
      }

      const meeting: ZoomMeeting = await response.json();
      return meeting;
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  /**
   * Initialize Zoom SDK
   */
  async initializeZoomSDK(sdkKey: string, sdkSecret: string): Promise<void> {
    try {
      // Get Zoom SDK token from server
      const response = await fetch('/api/video-inspections/zoom/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sdkKey, sdkSecret}),
      });

      if (!response.ok) {
        throw new Error('Failed to get Zoom SDK token');
      }

      const {token} = await response.json();

      // Initialize Zoom Video SDK
      // This would use @zoom/videosdk in a real implementation
      console.log('Zoom SDK initialized with token');
    } catch (error) {
      console.error('Error initializing Zoom SDK:', error);
      throw new Error('Failed to initialize Zoom SDK');
    }
  }

  /**
   * Create Teams meeting for inspection
   */
  async createTeamsMeeting(
    inspectionId: string,
    scheduledTime: Date,
    duration: number,
    config: TeamsConfig,
  ): Promise<TeamsMeeting> {
    try {
      const response = await fetch('/api/video-inspections/teams/create-meeting', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          inspectionId,
          scheduledTime: scheduledTime.toISOString(),
          duration,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Teams meeting');
      }

      const meeting: TeamsMeeting = await response.json();
      return meeting;
    } catch (error) {
      console.error('Error creating Teams meeting:', error);
      throw new Error('Failed to create Teams meeting');
    }
  }

  /**
   * Initialize Teams SDK
   */
  async initializeTeamsSDK(config: TeamsConfig): Promise<void> {
    try {
      // Get Teams access token from server
      const response = await fetch('/api/video-inspections/teams/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to get Teams access token');
      }

      const {accessToken} = await response.json();

      // Initialize Microsoft Teams JS SDK
      // This would use @microsoft/teams-js in a real implementation
      console.log('Teams SDK initialized with access token');
    } catch (error) {
      console.error('Error initializing Teams SDK:', error);
      throw new Error('Failed to initialize Teams SDK');
    }
  }

  /**
   * Join external meeting (Zoom or Teams)
   */
  async joinExternalMeeting(
    platform: 'zoom' | 'teams',
    meetingUrl: string,
    participantInfo: {name: string; role: string},
  ): Promise<void> {
    try {
      if (platform === 'zoom') {
        // Open Zoom meeting URL
        window.open(meetingUrl, '_blank');
      } else if (platform === 'teams') {
        // Open Teams meeting URL
        window.open(meetingUrl, '_blank');
      }
    } catch (error) {
      console.error(`Error joining ${platform} meeting:`, error);
      throw new Error(`Failed to join ${platform} meeting`);
    }
  }
}

// Singleton instance
export const platformIntegrationService = new PlatformIntegrationService();
