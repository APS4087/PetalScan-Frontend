import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, Image, Linking, Modal } from 'react-native';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../../../components/CustomAlert';

const { width, height } = Dimensions.get('window');
const GOOGLE_CLOUD_RUN_URL = 'https://petalscan-img-129264674726.asia-southeast1.run.app';
const HOME_LOCAL_SERVER_URL = 'http://192.168.10.218:8000';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef(null);
  const { user } = useAuth();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [freeSnaps, setFreeSnaps] = useState(3);
  const [purchasedSnaps, setPurchasedSnaps] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resultLabel, setResultLabel] = useState('');
  const [zoom, setZoom] = useState(0);
  const [scale, setScale] = useState(1); // State for pinch scale
  const [subscription, setSubscription] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

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
          setPurchasedSnaps(userData.snaps || 0); // Default to 0 if no snaps field
        }
      }
    };
  
    fetchSubscription();
    fetchSnapCount();
  }, [user]);
  
  useEffect(() => {
    const checkAndResetFreeSnaps = async () => {
      const lastResetTime = await AsyncStorage.getItem('lastResetTime');
      const currentTime = new Date().getTime();
  
      if (!lastResetTime || currentTime - parseInt(lastResetTime) > 24 * 60 * 60 * 1000) {
        // More than 24 hours have passed since the last reset
        setFreeSnaps(3);
        await AsyncStorage.setItem('lastResetTime', currentTime.toString());
        await AsyncStorage.setItem('freeSnaps', '3');
      } else {
        const storedFreeSnaps = await AsyncStorage.getItem('freeSnaps');
        if (storedFreeSnaps !== null) {
          setFreeSnaps(parseInt(storedFreeSnaps));
        }
      }
    };
  
    checkAndResetFreeSnaps();
  }, []);

  const takePicture = async () => {
    if (subscription && subscription.plan === 'Monthly' && subscription.status === 'active') {
      // Allow unlimited snaps for premium users
      await captureAndProcessImage();
    } else if (freeSnaps > 0) {
      // Use free snaps first
      await captureAndProcessImage();
      setFreeSnaps(freeSnaps - 1);
      await AsyncStorage.setItem('freeSnaps', (freeSnaps - 1).toString());
    } else if (purchasedSnaps > 0) {
      // Use purchased snaps if no free snaps left
      await captureAndProcessImage();
      const newPurchasedSnaps = purchasedSnaps - 1;
      setPurchasedSnaps(newPurchasedSnaps);
      updateSnapCount(newPurchasedSnaps);
    } else {
      setAlertMessage('You have reached your daily limit. Purchase a snaps bundle for more!');
      setAlertVisible(true);
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
  
    let snapReduced = false;
    let data = null;
  
    try {
      const response = await fetch(`${GOOGLE_CLOUD_RUN_URL}/predict/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      data = await response.json();
      if (data && data.predicted_label) {
        setResultLabel(data.predicted_label);
        // Update snap count only if the detection is successful
        if (!(subscription && subscription.plan === 'Monthly' && subscription.status === 'active')) {
          if (freeSnaps > 0) {
            const newFreeSnaps = freeSnaps - 1;
            setFreeSnaps(newFreeSnaps);
            await AsyncStorage.setItem('freeSnaps', newFreeSnaps.toString());
            snapReduced = true;
          } else if (purchasedSnaps > 0) {
            const newPurchasedSnaps = purchasedSnaps - 1;
            setPurchasedSnaps(newPurchasedSnaps);
            updateSnapCount(newPurchasedSnaps);
            snapReduced = true;
          }
        }
      } else {
        setAlertMessage('Please make sure to capture an image with either a flower, plant or architecture to get a prediction.');
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Error in image detection:', error);
      setAlertMessage('There was an error processing your image. Please check your connection and try again.');
      setAlertVisible(true);
    } finally {
      if (!data || !data.predicted_label) {
        // Redeem back the snaps if there was an error or no prediction
        if (snapReduced) {
          if (freeSnaps < 3) {
            const newFreeSnaps = freeSnaps + 1;
            setFreeSnaps(newFreeSnaps);
            await AsyncStorage.setItem('freeSnaps', newFreeSnaps.toString());
          } else if (purchasedSnaps < 20) {
            const newPurchasedSnaps = purchasedSnaps + 1;
            setPurchasedSnaps(newPurchasedSnaps);
            updateSnapCount(newPurchasedSnaps);
          }
        }
      }
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

  // Function to search on Google
  const searchOnGoogle = () => {
    const query = encodeURIComponent(resultLabel);
    const url = `https://www.google.com/search?q=${query}`;
    Linking.openURL(url);
  };

  const totalSnaps = freeSnaps + purchasedSnaps;

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
            !loading && (
              <TouchableOpacity onPress={navigateToPayment} style={styles.snapsButton}>
                <Text style={styles.snapsText}>
                  Snaps Left: {totalSnaps}
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
                <TouchableOpacity onPress={searchOnGoogle} style={styles.iconButton}>
                  <Icon name="search" size={25} color="white" />
                  <Text style={styles.optionText}>Search</Text>
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
            {/* <Text style={styles.optionText}>Gallery</Text> */}
          </TouchableOpacity>
        </View>
  
        {selectedImage && !loading && (
          <TouchableOpacity 
            style={styles.previewContainer}
            onPress={() => router.push({ pathname: '/home/camerascreen/imageDetail', params: { name: resultLabel} })}
          >
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.overlayTextContainer}>
              <Text style={styles.overlayText}>Tap to ask questions</Text>
            </View>
            {resultLabel !== '' && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultText}>Prediction Result:</Text>
                <Text style={styles.resultText}>{resultLabel}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </SafeAreaView>
      <CustomAlert
        visible={alertVisible}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
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
    width: width * 0.115, // Responsive width
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
      overlayTextContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        //backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderTopLeftRadius: width * 0.05,
        borderTopRightRadius: width * 0.05,
        alignItems: 'center',
      },
      overlayText: {
        color: 'white',
        fontSize: width * 0.04, // Responsive font size
        textAlign: 'center',
        width: '100%',
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