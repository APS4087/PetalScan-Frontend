import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Modal } from 'react-native';
import { Camera } from 'expo-camera/legacy';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useAuth } from '../../../../context/authContext';
import CustomAlert from '../../../../components/CustomAlert';

const { width, height } = Dimensions.get('window');
const GOOGLE_CLOUD_RUN_URL = 'https://petalscan-img-129264674726.asia-southeast1.run.app';
const HOME_LOCAL_SERVER_URL = 'http://192.168.10.218:8000';

export default function RealTimeDetection() {
  const router = useRouter();
  const cameraRef = useRef(null);
  const { user } = useAuth();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [resultLabel, setResultLabel] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    let intervalId;
    if (hasCameraPermission) {
      intervalId = setInterval(() => {
        captureAndProcessImage();
      }, 3000); // Capture and process image every 3 seconds
    }
    return () => clearInterval(intervalId);
  }, [hasCameraPermission]);

  const captureAndProcessImage = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
        handleImageDetection(photo.base64);
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const handleImageDetection = async (base64) => {
    console.log('Processing image...'); // Debugging log

    const formData = new FormData();
    formData.append('file', {
      uri: `data:image/jpeg;base64,${base64}`,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await fetch(`${HOME_LOCAL_SERVER_URL}/predict/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data && data.predicted_label) {
        setResultLabel(data.predicted_label);
      } else {
        setAlertMessage('Please make sure to capture an image with either a flower, plant or architecture to get a prediction.');
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Error in image detection:', error);
      setAlertMessage('There was an error processing your image. Please check your connection and try again.');
      setAlertVisible(true);
    }
  };

  if (hasCameraPermission === null) {
    return <View />;
  }
  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraWrapper}>
        <Camera
          style={[styles.camera, { height: width * (4 / 3) }]} // 4:3 aspect ratio for the camera
          ref={cameraRef}
          ratio="4:3"
        />
      </View>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Real-Time Detection</Text>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {resultLabel !== '' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Prediction Result:</Text>
          <Text style={styles.resultText}>{resultLabel}</Text>
        </View>
      )}

      <CustomAlert
        visible={alertVisible}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: width * 0.05, // Responsive border radius
    overflow: 'hidden',
    position: 'relative', // This allows children to be positioned absolutely
  },
  camera: {
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: width * 0.05, // Responsive border radius
    overflow: 'hidden', // Ensure content is clipped within rounded corners
  },
  topBar: {
    position: 'absolute',
    top: height * 0.05, // Responsive positioning
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05, // Responsive padding
    alignItems: 'center',
    zIndex: 2,
  },
  backButton: {
    padding: width * 0.02, // Responsive padding
  },
  title: {
    color: 'white',
    fontSize: width * 0.05, // Responsive font size
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: height * 0.05, // Responsive positioning
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    padding: width * 0.02, // Responsive padding
    marginHorizontal: width * 0.02, // Responsive margin
  },
  cancelButtonText: {
    color: 'white',
    fontSize: width * 0.045, // Responsive font size
    fontWeight: 'bold',
  },
  resultContainer: {
    position: 'absolute',
    bottom: height * 0.15, // Responsive positioning
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  resultText: {
    color: 'white',
    fontSize: width * 0.045, // Responsive font size
    textAlign: 'center',
  },
});