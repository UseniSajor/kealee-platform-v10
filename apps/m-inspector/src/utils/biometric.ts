import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const {available} = await rnBiometrics.isSensorAvailable();
    return available;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometric(reason: string = 'Authenticate to access the app'): Promise<boolean> {
  try {
    const {available} = await rnBiometrics.isSensorAvailable();
    if (!available) {
      return false;
    }

    const {success} = await rnBiometrics.simplePrompt({
      promptMessage: reason,
      cancelButtonText: 'Cancel',
    });

    return success;
  } catch {
    return false;
  }
}

export async function createBiometricKey(): Promise<string | null> {
  try {
    const {available} = await rnBiometrics.isSensorAvailable();
    if (!available) {
      return null;
    }

    const {publicKey} = await rnBiometrics.createKeys();
    return publicKey;
  } catch {
    return null;
  }
}
