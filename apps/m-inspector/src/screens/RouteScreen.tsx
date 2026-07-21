import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useInspectionStore} from '../store/inspectionStore';
import {format} from 'date-fns';

interface RouteScreenProps {
  navigation: any;
  route: any;
}

export function RouteScreen({navigation, route}: RouteScreenProps) {
  const {route: currentRoute, loadRoute, isLoading} = useInspectionStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadRoute(selectedDate);
  }, [selectedDate]);

  if (isLoading || !currentRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  const coordinates = currentRoute.inspections
    .map((i) => ({
      latitude: i.coordinates.latitude,
      longitude: i.coordinates.longitude,
    }))
    .filter((c) => c.latitude !== 0 && c.longitude !== 0);

  const region = coordinates.length > 0
    ? {
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.infoItem}>
          <Icon name="schedule" size={20} color="#0ea5e9" />
          <Text style={styles.infoText}>
            {Math.round(currentRoute.estimatedDuration)} min
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="straighten" size={20} color="#0ea5e9" />
          <Text style={styles.infoText}>
            {currentRoute.estimatedDistance.toFixed(1)} km
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="location-on" size={20} color="#0ea5e9" />
          <Text style={styles.infoText}>
            {currentRoute.inspections.length} stops
          </Text>
        </View>
      </View>

      {region && (
        <MapView style={styles.map} initialRegion={region}>
          {currentRoute.inspections.map((inspection, index) => (
            <Marker
              key={inspection.inspectionId}
              coordinate={{
                latitude: inspection.coordinates.latitude,
                longitude: inspection.coordinates.longitude,
              }}
              title={`Stop ${index + 1}`}
              description={inspection.address}>
              <View style={styles.markerContainer}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
          {coordinates.length > 1 && (
            <Polyline
              coordinates={coordinates}
              strokeColor="#0ea5e9"
              strokeWidth={3}
            />
          )}
        </MapView>
      )}

      <ScrollView style={styles.listContainer}>
        {currentRoute.inspections.map((inspection, index) => (
          <TouchableOpacity
            key={inspection.inspectionId}
            style={styles.routeItem}
            onPress={() => navigation.navigate('InspectionDetail', {inspectionId: inspection.inspectionId})}>
            <View style={styles.routeItemNumber}>
              <Text style={styles.routeItemNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.routeItemContent}>
              <Text style={styles.routeItemAddress}>{inspection.address}</Text>
              <Text style={styles.routeItemTime}>
                {format(new Date(inspection.scheduledTime), 'h:mm a')}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  headerRight: {
    width: 24,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  map: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeItemNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeItemNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  routeItemContent: {
    flex: 1,
  },
  routeItemAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  routeItemTime: {
    fontSize: 14,
    color: '#64748b',
  },
});
