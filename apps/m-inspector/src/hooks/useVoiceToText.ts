import {useState, useCallback} from 'react';
import Voice from '@react-native-voice/voice';

export function useVoiceToText() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      await Voice.start('en-US');
      setIsRecording(true);
    } catch (e: any) {
      setError(e.message);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (e: any) {
      setError(e.message);
      setIsRecording(false);
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    try {
      await Voice.cancel();
      setIsRecording(false);
      setTranscript('');
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  // Set up voice recognition handlers
  Voice.onSpeechStart = () => {
    setIsRecording(true);
  };

  Voice.onSpeechEnd = () => {
    setIsRecording(false);
  };

  Voice.onSpeechResults = (e: any) => {
    if (e.value && e.value.length > 0) {
      setTranscript(e.value[0]);
    }
  };

  Voice.onSpeechError = (e: any) => {
    setError(e.error?.message || 'Speech recognition error');
    setIsRecording(false);
  };

  return {
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
