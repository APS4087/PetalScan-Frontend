import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, Image, Modal } from 'react-native';
import { Camera } from 'expo-camera/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView, PinchGestureHandler } from 'react-native-gesture-handler';
import LottieView from 'lottie-react-native';
import { db } from '../../../firebaseConfig';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/authContext';

const { width, height } = Dimensions.get('window');
const AWS_SERVER_URL = 'http://3.27.248.187:8000';
const LOCAL_MACHINE_IP = 'http://192.168.239.197:8000'; 

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef(null);
  const { user } = useAuth();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [pictureCount, setPictureCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [resultLabel, setResultLabel] = useState('');
  const [zoom, setZoom] = useState(0);
  const [scale, setScale] = useState(1); // State for pinch scale
  const [modalVisible, setModalVisible] = useState(false); // State for modal visibility
  const [subscription, setSubscription] = useState(null);

  // Set the camera height to maintain the aspect ratio
  const cameraHeight = width * (4 / 3); // 4:3 aspect ratio for the camera

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
      const { status: galleryStatus } = await MediaLibrary.requestPermissionsAsync();
      setHasGalleryPermission(galleryStatus === 'granted');
    })();

    // Fetch the user's subscription details
    const fetchSubscription = async () => {
      if (user) {
        const subscriptionRef = doc(collection(db, 'subscriptions'), user.uid);
        const subscriptionDoc = await getDoc(subscriptionRef);
        if (subscriptionDoc.exists()) {
          setSubscription(subscriptionDoc.data());
        }
        console.log(subscriptionDoc.data());
      }
    };

    // Fetch the user's snap count
    const fetchSnapCount = async () => {
      if (user) {
        const userRef = doc(collection(db, 'users'), user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setPictureCount(userData.snaps || 3); // Default to 3 if no snaps field
        }
      }
    };

    fetchSubscription();
    fetchSnapCount();
  }, [user]);

  useEffect(() => {
    // Reset the picture count every 24 hours
    const resetPictureCount = () => {
      setPictureCount(3);
    };

    const interval = setInterval(resetPictureCount, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    return () => clearInterval(interval);
  }, []);

  const takePicture = async () => {
    if (subscription && subscription.plan === 'Monthly' && subscription.status === 'active') {
      // Allow unlimited snaps for premium users
      await captureAndProcessImage();
    } else if (pictureCount > 0) {
      // Allow limited snaps for non-premium users
      await captureAndProcessImage();
      setPictureCount(pictureCount - 1);
      updateSnapCount(pictureCount - 1);
    } else {
      Alert.alert('Limit Reached', 'You have reached your daily limit. Purchase a snaps bundle for more!');
    }
  };

  const captureAndProcessImage = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
        setSelectedImage(photo.uri); // Set the captured image URI
        handleImageDetection(photo.uri); // Call for image processing
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const savePictureToGallery = async (uri) => {
    if (hasGalleryPermission) {
      try {
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('Camera', asset, false);
        console.log('Picture saved to gallery:', asset);
      } catch (error) {
        console.error('Error saving picture to gallery:', error);
      }
    } else {
      console.warn('Gallery permission not granted');
    }
  };

  const handleImageDetection = async (uri) => {
    setLoading(true); // Start loading only for processing
    console.log('Loading started'); // Debugging log
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });
  
    try {
      const response = await fetch(`${LOCAL_MACHINE_IP}/predict/`, {
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
        Alert.alert('Error', 'No valid prediction returned from the server.');
      }
    } catch (error) {
      console.error('Error in image detection:', error);
      Alert.alert('Error', 'There was an error processing your image.');
    } finally {
      setLoading(false); // End loading
      console.log('Loading ended'); // Debugging log
    }
  };

  const updateSnapCount = async (newCount) => {
    if (user) {
      const userRef = doc(collection(db, 'users'), user.uid);
      await updateDoc(userRef, { snaps: newCount });
    }
  };

  const onPinchEvent = (event) => {
    const { scale: newScale } = event.nativeEvent;
    if (newScale > 1) {
      setScale(newScale);
      setZoom(Math.min(newScale - 1, 1)); // Limit zoom to max of 1
    } else {
      setScale(1);
      setZoom(0); // Reset zoom when pinch is released
    }
  };

  const resetPrediction = () => {
    setSelectedImage(null); // Clear the selected image
    setResultLabel(''); // Clear the prediction result
    setPictureCount(3); // Reset the picture count if needed
  };

  const openImageModal = () => {
    setModalVisible(true); // Open modal
  };

  const closeModal = () => {
    setModalVisible(false); // Close modal
  };

  const shareImage = async () => {
    if (selectedImage) {
      await Sharing.shareAsync(selectedImage);
    }
  };

  const navigateToPayment = () => {
    router.push('/payment'); // Adjust the route as needed
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      handleImageDetection(result.assets[0].uri);
    }
  };

  if (hasCameraPermission === null || hasGalleryPermission === null) {
    return <View />;
  }
  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <LottieView
              source={require('../../../assets/animations/plantLoadingAnimation.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
        
        {/* Camera View */}
        <View style={styles.cameraWrapper}>
          {subscription && subscription.plan === 'Monthly' && subscription.status === 'active' ? (
            <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Real-time detection is currently in development.')} style={styles.realTimeButton}>
              <Text style={styles.realTimeButtonText}>Real-Time Detection (In Dev)</Text>
            </TouchableOpacity>
          ) : (
            !loading && resultLabel !== '' && (
              <TouchableOpacity onPress={navigateToPayment} style={styles.snapsButton}>
                <Text style={styles.snapsText}>
                  Snaps Left: {pictureCount}
                </Text>
              </TouchableOpacity>
            )
          )}
  
          <PinchGestureHandler onGestureEvent={onPinchEvent}>
            <Camera
              style={[styles.camera, { height: cameraHeight }]}
              ref={cameraRef}
              ratio="4:3"
              zoom={zoom}
            />
          </PinchGestureHandler>
        </View>
  
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-back" size={30} color="white" />
          </TouchableOpacity>
  
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {selectedImage && (
              <>
                <TouchableOpacity onPress={() => savePictureToGallery(selectedImage)} style={styles.iconButton}>
                  <Icon name="save-alt" size={25} color="white" />
                  <Text style={styles.optionText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={shareImage} style={styles.iconButton}>
                  <Icon name="share" size={25} color="white" />
                  <Text style={styles.optionText}>Share</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
  
        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.iconButton} onPress={resetPrediction}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
            <View style={styles.innerCaptureButton} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={pickImageFromGallery}>
            <Icon name="photo-library" size={40} color="white" />
            <Text style={styles.optionText}>Gallery</Text>
          </TouchableOpacity>
        </View>
  
        {selectedImage && !loading && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            {resultLabel !== '' && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultText}>Prediction Result: {resultLabel}</Text>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
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
  snapsButton: {
    position: 'absolute',
    top: height * 0.2, // Responsive positioning
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 9,
    borderRadius: 10,
    zIndex: 1,
  },
  snapsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: width * 0.04, // Responsive font size
  },
  realTimeButton: {
    position: 'absolute',
    top: height * 0.2, // Responsive positioning
    alignSelf: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 9,
    borderRadius: 10,
  },
  realTimeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: width * 0.04, // Responsive font size
  },
  camera: {
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: width * 0.05, // Responsive border radius
    overflow: 'hidden', // Ensure content is clipped within rounded corners
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
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
  iconButton: {
    alignItems: 'center',
    padding: width * 0.02, // Responsive padding
    marginHorizontal: width * 0.02, // Responsive margin
  },
  optionText: {
    color: 'white',
    fontSize: width * 0.03, // Responsive font size
    textAlign: 'center',
    paddingHorizontal: width * 0.01, // Responsive padding
    width: width * 0.1, // Responsive width
  },
  bottomBar: {
    position: 'absolute',
    bottom: height * 0.05, // Responsive positioning
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  captureButton: {
    width: width * 0.18, // Responsive size
    height: width * 0.18, // Responsive size
    borderRadius: width * 0.09, // Responsive border radius
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCaptureButton: {
    width: width * 0.15, // Responsive size
    height: width * 0.15, // Responsive size
    borderRadius: width * 0.075, // Responsive border radius
    backgroundColor: 'red',
  },
  previewContainer: {
    position: 'absolute',
    bottom: width * 0.4,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    aspectRatio: 1,
    resizeMode: 'contain',
    borderRadius: width * 0.05, // Responsive border radius
  },
  resultContainer: {
    marginTop: height * 0.01, // Responsive margin
    padding: height * 0.02, // Responsive padding
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: width * 0.05, // Responsive border radius
    width: '90%',
    alignSelf: 'center',
  },
  resultText: {
    color: 'white',
    fontSize: width * 0.045, // Responsive font size
    textAlign: 'center',
    flexWrap: 'wrap',
    lineHeight: width * 0.06, // Responsive line height
    flexShrink: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 3, // Ensure it is above other elements
  },
  lottie: {
    width: 150,
    height: 150,
  },
  loadingText: {
    color: 'white',
    marginTop: height * 0.01, // Responsive margin
    fontSize: width * 0.045, // Responsive font size
    textAlign: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: width * 0.045, // Responsive font size
    fontWeight: 'bold',
  },
});