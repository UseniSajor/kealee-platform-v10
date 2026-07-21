import React, {useRef} from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {InspectionSignature} from '../types';

interface SignatureCaptureProps {
  onSave: (signature: InspectionSignature) => void;
  onCancel?: () => void;
  signerName: string;
  signerRole: string;
}

export function SignatureCapture({onSave, onCancel, signerName, signerRole}: SignatureCaptureProps) {
  const signatureRef = useRef<any>(null);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleSave = () => {
    signatureRef.current?.readSignature((data: string) => {
      const signature: InspectionSignature = {
        id: `signature-${Date.now()}`,
        signerName,
        signerRole,
        signatureData: data,
        timestamp: new Date().toISOString(),
        synced: false,
      };
      onSave(signature);
    });
  };

  const style = `
    .m-signature-pad {
      position: absolute;
      font-size: 10px;
      width: 100%;
      height: 100%;
      border: 1px solid #e2e8f0;
      background-color: #fff;
    }
    .m-signature-pad--body {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    }
    .m-signature-pad--body canvas {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Digital Signature</Text>
        <Text style={styles.subtitle}>
          {signerName} - {signerRole}
        </Text>
      </View>

      <View style={styles.canvasContainer}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleSave}
          descriptionText="Sign above"
          clearText="Clear"
          confirmText="Save"
          webStyle={style}
          autoClear={false}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
          <Icon name="clear" size={20} color="#ef4444" />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          {onCancel && (
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.buttonText}>Save Signature</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  canvasContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  controls: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#fee2e2',
    marginBottom: 12,
  },
  clearButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#64748b',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0ea5e9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
