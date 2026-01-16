// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevice: jest.fn(() => ({id: 'back'})),
  useCodeScanner: jest.fn(() => ({})),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => <View {...props} ref={ref} />),
    Marker: (props) => <View {...props} />,
    Polyline: (props) => <View {...props} />,
  };
});

// Mock @react-native-community/geolocation
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn((success) =>
    success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      },
    }),
  ),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({isConnected: true, isInternetReachable: true})),
  addEventListener: jest.fn(() => () => {}),
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn((options, callback) => {
    callback({
      didCancel: false,
      errorCode: undefined,
      assets: [{uri: 'file://test.jpg'}],
    });
  }),
  launchImageLibrary: jest.fn((options, callback) => {
    callback({
      didCancel: false,
      errorCode: undefined,
      assets: [{uri: 'file://test.jpg'}],
    });
  }),
}));

// Mock @react-native-voice/voice
jest.mock('@react-native-voice/voice', () => ({
  default: {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    cancel: jest.fn(() => Promise.resolve()),
    isAvailable: jest.fn(() => Promise.resolve(true)),
    onSpeechStart: null,
    onSpeechEnd: null,
    onSpeechResults: null,
    onSpeechError: null,
  },
}));

// Mock react-native-biometrics
jest.mock('react-native-biometrics', () => ({
  default: jest.fn(() => ({
    isSensorAvailable: jest.fn(() => Promise.resolve({available: true})),
    simplePrompt: jest.fn(() => Promise.resolve({success: true})),
    createKeys: jest.fn(() => Promise.resolve({publicKey: 'test-key'})),
  })),
}));

// Mock react-native-encrypted-storage
jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));
