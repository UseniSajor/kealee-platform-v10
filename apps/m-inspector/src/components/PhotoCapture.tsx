import React, {useState} from 'react';
import {View, StyleSheet, Image, TouchableOpacity, Text, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useCamera} from '../hooks/useCamera';
import {InspectionPhoto, GPSLocation} from '../types';
import {LocationService} from '../services/location';

interface PhotoCaptureProps {
  onPhotoCaptured: (photo: InspectionPhoto) => void;
  onCancel?: () => void;
  includeGPS?: boolean;
  compress?: boolean;
}

export function PhotoCapture({onPhotoCaptured, onCancel, includeGPS = true, compress = true}: PhotoCaptureProps) {
  const {capturePhoto, pickFromLibrary, isLoading, error} = useCamera();
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'success' | 'error'>('idle');

  const handleCapture = async () => {
    if (includeGPS) {
      setGpsStatus('getting');
      try {
        await LocationService.getCurrentLocation();
        setGpsStatus('success');
      } catch {
        setGpsStatus('error');
      }
    }

    const photo = await capturePhoto({includeGPS, compress});
    if (photo) {
      onPhotoCaptured(photo);
    }
  };

  const handlePickFromLibrary = async () => {
    const photo = await pickFromLibrary({includeGPS, compress});
    if (photo) {
      onPhotoCaptured(photo);
    }
  };

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.captureButton]}
          onPress={handleCapture}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="camera-alt" size={32} color="#fff" />
              <Text style={styles.buttonText}>Capture Photo</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.libraryButton]}
          onPress={handlePickFromLibrary}
          disabled={isLoading}>
          <Icon name="photo-library" size={32} color="#fff" />
          <Text style={styles.buttonText}>Choose from Library</Text>
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {includeGPS && gpsStatus !== 'idle' && (
        <View style={styles.gpsStatus}>
          <Icon
            name={gpsStatus === 'success' ? 'gps-fixed' : gpsStatus === 'error' ? 'gps-off' : 'gps-not-fixed'}
            size={16}
            color={gpsStatus === 'success' ? '#22c55e' : gpsStatus === 'error' ? '#ef4444' : '#f59e0b'}
          />
          <Text style={styles.gpsText}>
            {gpsStatus === 'getting' && 'Getting location...'}
            {gpsStatus === 'success' && 'GPS location captured'}
            {gpsStatus === 'error' && 'GPS unavailable'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  captureButton: {
    backgroundColor: '#0ea5e9',
  },
  libraryButton: {
    backgroundColor: '#6366f1',
  },
  cancelButton: {
    backgroundColor: '#64748b',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  gpsText: {
    fontSize: 12,
    color: '#475569',
  },
});
