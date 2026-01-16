/**
 * Kealee Inspector - Mobile Field Inspection App
 * React Native app for field inspectors
 */

import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar, StyleSheet, View, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {LoginScreen} from './src/screens/LoginScreen';
import {InspectionListScreen} from './src/screens/InspectionListScreen';
import {InspectionDetailScreen} from './src/screens/InspectionDetailScreen';
import {RouteScreen} from './src/screens/RouteScreen';
import {SyncService} from './src/services/sync';
import {StorageService} from './src/services/storage';
import {authenticateWithBiometric} from './src/utils/biometric';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function InspectionStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="InspectionList" component={InspectionListScreen} />
      <Stack.Screen name="InspectionDetail" component={InspectionDetailScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
      }}>
      <Tab.Screen
        name="Inspections"
        component={InspectionStack}
        options={{
          tabBarIcon: ({color, size}) => <Icon name="assignment" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Route"
        component={RouteScreen}
        options={{
          tabBarIcon: ({color, size}) => <Icon name="map" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check for existing auth token
      const token = await StorageService.getSecure('auth_token');
      if (token) {
        // Try biometric authentication if available
        const authenticated = await authenticateWithBiometric('Authenticate to continue');
        if (authenticated) {
          setIsAuthenticated(true);
        } else {
          // Clear token if biometric fails
          await StorageService.removeSecure('auth_token');
        }
      }
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // Start background sync
    SyncService.startBackgroundSync();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <NavigationContainer>
        {isAuthenticated ? (
          <MainTabs />
        ) : (
          <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
