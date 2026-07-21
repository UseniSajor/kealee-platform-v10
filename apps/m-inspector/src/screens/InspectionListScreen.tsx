import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useInspectionStore} from '../store/inspectionStore';
import {Inspection} from '../types';
import {useOffline} from '../hooks/useOffline';
import {format} from 'date-fns';

interface InspectionListScreenProps {
  navigation: any;
  route: any;
}

export function InspectionListScreen({navigation, route}: InspectionListScreenProps) {
  const {inspections, loadInspections, sync, isSyncing, isLoading} = useInspectionStore();
  const {isOnline} = useOffline();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInspections(selectedDate);
  }, [selectedDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isOnline) {
      await sync();
    }
    await loadInspections(selectedDate);
    setRefreshing(false);
  };

  const handleInspectionPress = (inspection: Inspection) => {
    navigation.navigate('InspectionDetail', {inspectionId: inspection.id});
  };

  const getStatusColor = (status: Inspection['status']) => {
    switch (status) {
      case 'passed':
        return '#22c55e';
      case 'failed':
        return '#ef4444';
      case 'in-progress':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const renderInspectionItem = ({item}: {item: Inspection}) => (
    <TouchableOpacity
      style={styles.inspectionItem}
      onPress={() => handleInspectionPress(item)}
      activeOpacity={0.7}>
      <View style={styles.inspectionHeader}>
        <View style={styles.inspectionInfo}>
          <Text style={styles.permitNumber}>{item.permitNumber}</Text>
          <Text style={styles.address}>{item.address}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.inspectionMeta}>
        <View style={styles.metaItem}>
          <Icon name="category" size={16} color="#64748b" />
          <Text style={styles.metaText}>{item.inspectionType}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="schedule" size={16} color="#64748b" />
          <Text style={styles.metaText}>
            {format(new Date(item.scheduledDate), 'h:mm a')}
          </Text>
        </View>
        {!item.synced && (
          <View style={styles.metaItem}>
            <Icon name="cloud-off" size={16} color="#f59e0b" />
            <Text style={styles.metaText}>Pending sync</Text>
          </View>
        )}
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${
                (item.checklist.filter((c) => c.status !== 'pending').length /
                  item.checklist.length) *
                100
              }%`,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inspections</Text>
        <View style={styles.headerActions}>
          {isOnline && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={sync}
              disabled={isSyncing}>
              {isSyncing ? (
                <ActivityIndicator size="small" color="#0ea5e9" />
              ) : (
                <Icon name="sync" size={24} color="#0ea5e9" />
              )}
            </TouchableOpacity>
          )}
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Icon name="cloud-off" size={16} color="#f59e0b" />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>
      </View>

      {isLoading && inspections.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <FlatList
          data={inspections}
          renderItem={renderInspectionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No inspections scheduled</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncButton: {
    padding: 8,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 16,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  inspectionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  inspectionInfo: {
    flex: 1,
  },
  permitNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  inspectionMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
  },
});
