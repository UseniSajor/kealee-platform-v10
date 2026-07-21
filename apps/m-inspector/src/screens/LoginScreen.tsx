import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ApiService} from '../services/api';
import {authenticateWithBiometric, isBiometricAvailable} from '../utils/biometric';
import {StorageService} from '../services/storage';

interface LoginScreenProps {
  navigation: any;
  onLoginSuccess: () => void;
}

export function LoginScreen({navigation, onLoginSuccess}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  React.useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      await ApiService.login(email, password);
      onLoginSuccess();
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const authenticated = await authenticateWithBiometric('Authenticate to access the app');
    if (authenticated) {
      // Check if we have stored credentials
      const storedEmail = await StorageService.getSecure('last_email');
      if (storedEmail) {
        setIsLoading(true);
        try {
          // In a real app, you'd use a token or session
          onLoginSuccess();
        } catch (error: any) {
          Alert.alert('Error', 'Biometric authentication failed');
        } finally {
          setIsLoading(false);
        }
      } else {
        Alert.alert('Error', 'No saved credentials found');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="construction" size={64} color="#0ea5e9" />
        <Text style={styles.title}>Kealee Inspector</Text>
        <Text style={styles.subtitle}>Field Inspection App</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color="#64748b" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#64748b" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.loginButtonText}>Login</Text>
              <Icon name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {biometricAvailable && (
          <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin}>
            <Icon name="fingerprint" size={24} color="#0ea5e9" />
            <Text style={styles.biometricButtonText}>Use Biometric</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#0f172a',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
  },
  biometricButtonText: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '600',
  },
});
