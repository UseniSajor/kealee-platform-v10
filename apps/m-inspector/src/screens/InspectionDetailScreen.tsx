import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useInspectionStore} from '../store/inspectionStore';
import {Inspection, InspectionPhoto, InspectionSketch, InspectionNote, InspectionSignature} from '../types';
import {PhotoCapture} from '../components/PhotoCapture';
import {SketchCanvas} from '../components/SketchCanvas';
import {SignatureCapture} from '../components/SignatureCapture';
import {BarcodeScanner} from '../components/BarcodeScanner';
import {useVoiceToText} from '../hooks/useVoiceToText';
import {useCamera} from '../hooks/useCamera';
import {ApiService} from '../services/api';
import {StorageService} from '../services/storage';

interface InspectionDetailScreenProps {
  navigation: any;
  route: {params: {inspectionId: string}};
}

export function InspectionDetailScreen({navigation, route}: InspectionDetailScreenProps) {
  const {inspectionId} = route.params;
  const {currentInspection, loadInspections, updateInspection} = useInspectionStore();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showSketchModal, setShowSketchModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'photos' | 'notes' | 'signatures'>('checklist');
  
  const {isRecording, transcript, startRecording, stopRecording} = useVoiceToText();

  useEffect(() => {
    loadInspection();
  }, [inspectionId]);

  const loadInspection = async () => {
    const loaded = await StorageService.getInspection(inspectionId);
    if (loaded) {
      setInspection(loaded);
    }
  };

  const handlePhotoCaptured = async (photo: InspectionPhoto) => {
    if (!inspection) return;

    // Analyze photo for compliance if online
    try {
      const analysis = await ApiService.analyzePhotoCompliance(photo.uri, inspection.inspectionType);
      photo.codeComplianceAnalysis = analysis;
    } catch (error) {
      console.warn('Photo analysis failed:', error);
    }

    const updated = {
      ...inspection,
      photos: [...inspection.photos, photo],
      synced: false,
    };
    setInspection(updated);
    await updateInspection(updated);
    setShowPhotoModal(false);
  };

  const handleSketchSaved = async (sketch: InspectionSketch) => {
    if (!inspection) return;

    const updated = {
      ...inspection,
      sketches: [...inspection.sketches, sketch],
      synced: false,
    };
    setInspection(updated);
    await updateInspection(updated);
    setShowSketchModal(false);
  };

  const handleSignatureSaved = async (signature: InspectionSignature) => {
    if (!inspection) return;

    const updated = {
      ...inspection,
      signatures: [...inspection.signatures, signature],
      synced: false,
    };
    setInspection(updated);
    await updateInspection(updated);
    setShowSignatureModal(false);
  };

  const handleBarcodeScanned = (code: string, type: string) => {
    // Verify permit number
    if (inspection && code === inspection.permitNumber) {
      alert('Permit verified!');
    } else {
      alert(`Scanned: ${code} (${type})\nPermit number mismatch.`);
    }
    setShowScannerModal(false);
  };

  const handleChecklistItemToggle = async (itemId: string, status: 'pass' | 'fail' | 'na') => {
    if (!inspection) return;

    const updated = {
      ...inspection,
      checklist: inspection.checklist.map((item) =>
        item.id === itemId ? {...item, status, timestamp: new Date().toISOString()} : item,
      ),
      synced: false,
    };
    setInspection(updated);
    await updateInspection(updated);
  };

  const handleAddNote = async () => {
    if (!inspection || !transcript.trim()) return;

    const note: InspectionNote = {
      id: `note-${Date.now()}`,
      text: transcript,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    const updated = {
      ...inspection,
      notes: [...inspection.notes, note],
      synced: false,
    };
    setInspection(updated);
    await updateInspection(updated);
  };

  if (!inspection) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inspection Details</Text>
          <TouchableOpacity onPress={() => setShowScannerModal(true)}>
            <Icon name="qr-code-scanner" size={24} color="#0ea5e9" />
          </TouchableOpacity>
        </View>

        {/* Inspection Info */}
        <View style={styles.infoCard}>
          <Text style={styles.permitNumber}>{inspection.permitNumber}</Text>
          <Text style={styles.address}>{inspection.address}</Text>
          <Text style={styles.inspectionType}>{inspection.inspectionType.toUpperCase()}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['checklist', 'photos', 'notes', 'signatures'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Checklist Tab */}
        {activeTab === 'checklist' && (
          <View style={styles.tabContent}>
            {inspection.checklist.map((item) => (
              <View key={item.id} style={styles.checklistItem}>
                <View style={styles.checklistItemContent}>
                  <Text style={styles.checklistItemText}>{item.description}</Text>
                  <Text style={styles.checklistItemCategory}>{item.category}</Text>
                </View>
                <View style={styles.checklistItemActions}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      item.status === 'pass' && styles.statusButtonActive,
                      item.status === 'pass' && {backgroundColor: '#22c55e'},
                    ]}
                    onPress={() => handleChecklistItemToggle(item.id, 'pass')}>
                    <Icon name="check" size={20} color={item.status === 'pass' ? '#fff' : '#64748b'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      item.status === 'fail' && styles.statusButtonActive,
                      item.status === 'fail' && {backgroundColor: '#ef4444'},
                    ]}
                    onPress={() => handleChecklistItemToggle(item.id, 'fail')}>
                    <Icon name="close" size={20} color={item.status === 'fail' ? '#fff' : '#64748b'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      item.status === 'na' && styles.statusButtonActive,
                    ]}
                    onPress={() => handleChecklistItemToggle(item.id, 'na')}>
                    <Text style={styles.naText}>N/A</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowPhotoModal(true)}>
              <Icon name="add-a-photo" size={24} color="#0ea5e9" />
              <Text style={styles.addButtonText}>Add Photo</Text>
            </TouchableOpacity>
            {inspection.photos.map((photo) => (
              <View key={photo.id} style={styles.photoItem}>
                <Text style={styles.photoTimestamp}>
                  {new Date(photo.timestamp).toLocaleString()}
                </Text>
                {photo.codeComplianceAnalysis && (
                  <View
                    style={[
                      styles.complianceBadge,
                      photo.codeComplianceAnalysis.compliant
                        ? styles.complianceBadgePass
                        : styles.complianceBadgeFail,
                    ]}>
                    <Text style={styles.complianceText}>
                      {photo.codeComplianceAnalysis.compliant ? 'Compliant' : 'Non-Compliant'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <View style={styles.tabContent}>
            <View style={styles.voiceNoteContainer}>
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
                onPress={isRecording ? stopRecording : startRecording}>
                <Icon name="mic" size={24} color={isRecording ? '#ef4444' : '#0ea5e9'} />
                <Text style={styles.voiceButtonText}>
                  {isRecording ? 'Stop Recording' : 'Start Voice Note'}
                </Text>
              </TouchableOpacity>
              {transcript && (
                <View style={styles.transcriptContainer}>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                  <TouchableOpacity style={styles.saveNoteButton} onPress={handleAddNote}>
                    <Text style={styles.saveNoteButtonText}>Save Note</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {inspection.notes.map((note) => (
              <View key={note.id} style={styles.noteItem}>
                <Text style={styles.noteText}>{note.text}</Text>
                <Text style={styles.noteTimestamp}>
                  {new Date(note.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Signatures Tab */}
        {activeTab === 'signatures' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowSignatureModal(true)}>
              <Icon name="edit" size={24} color="#0ea5e9" />
              <Text style={styles.addButtonText}>Collect Signature</Text>
            </TouchableOpacity>
            {inspection.signatures.map((signature) => (
              <View key={signature.id} style={styles.signatureItem}>
                <Text style={styles.signatureName}>{signature.signerName}</Text>
                <Text style={styles.signatureRole}>{signature.signerRole}</Text>
                <Text style={styles.signatureTimestamp}>
                  {new Date(signature.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.sketchButton]}
            onPress={() => setShowSketchModal(true)}>
            <Icon name="draw" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Sketch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={async () => {
              if (!inspection) return;
              const updated = {
                ...inspection,
                status: 'passed' as const,
                completedAt: new Date().toISOString(),
                synced: false,
              };
              setInspection(updated);
              await updateInspection(updated);
              navigation.goBack();
            }}>
            <Icon name="check-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <Modal visible={showPhotoModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <PhotoCapture
            onPhotoCaptured={handlePhotoCaptured}
            onCancel={() => setShowPhotoModal(false)}
          />
        </View>
      </Modal>

      <Modal visible={showSketchModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <SketchCanvas
            onSave={handleSketchSaved}
            onCancel={() => setShowSketchModal(false)}
          />
        </View>
      </Modal>

      <Modal visible={showSignatureModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <SignatureCapture
            onSave={handleSignatureSaved}
            onCancel={() => setShowSignatureModal(false)}
            signerName="Inspector"
            signerRole="Field Inspector"
          />
        </View>
      </Modal>

      <Modal visible={showScannerModal} animationType="slide">
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onCancel={() => setShowScannerModal(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permitNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  inspectionType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#0ea5e9',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  checklistItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistItemContent: {
    flex: 1,
  },
  checklistItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  checklistItemCategory: {
    fontSize: 12,
    color: '#64748b',
  },
  checklistItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonActive: {
    borderColor: 'transparent',
  },
  naText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  photoItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  photoTimestamp: {
    fontSize: 12,
    color: '#64748b',
  },
  complianceBadge: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  complianceBadgePass: {
    backgroundColor: '#dcfce7',
  },
  complianceBadgeFail: {
    backgroundColor: '#fee2e2',
  },
  complianceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  voiceNoteContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  voiceButtonRecording: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  transcriptContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  transcriptText: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
  },
  saveNoteButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
  },
  saveNoteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noteItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
  },
  noteTimestamp: {
    fontSize: 12,
    color: '#64748b',
  },
  signatureItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  signatureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  signatureRole: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  signatureTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  sketchButton: {
    backgroundColor: '#6366f1',
  },
  completeButton: {
    backgroundColor: '#22c55e',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
