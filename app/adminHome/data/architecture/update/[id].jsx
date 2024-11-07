import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // For back icon
import * as ImagePicker from 'expo-image-picker'; // For image picking
import { Picker } from '@react-native-picker/picker'; // For category picker
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LottieView from 'lottie-react-native';
import { db } from '../../../../../firebaseConfig';

function UpdateDatabase({ navigation }) {
  const router = useRouter();
  const { id, collectionName } = useLocalSearchParams(); // Get the dynamic route parameters
  const [selectedImages, setSelectedImages] = useState(['', '', '']); // To store selected images
  const [name, setName] = useState(''); // To store the name
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Architecture'); // Default category set
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [animationType, setAnimationType] = useState(''); // 'success' or 'error'

  const storage = getStorage();

  // Fetch the existing data for the place
  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const placeData = docSnap.data();
          console.log('Fetched place data:', placeData); // Debugging log
          let images = placeData.imageUrl;
          if (typeof images === 'string') {
            images = [images];
          }
          images = images.concat(Array(3 - images.length).fill('')); // Ensure there are always 3 boxes
          setSelectedImages(images);
          setName(placeData.name || '');
          setDescription(placeData.description || '');
          setCategory(placeData.category || 'Architecture');
        } else {
          console.error('No such document!');
        }
      } catch (error) {
        console.error('Error fetching place:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlace();
  }, [id, collectionName]);

  // Function to pick an image from the gallery
  const pickImage = async (index) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,  
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled) {
      const newImages = [...selectedImages];
      newImages[index] = result.assets[0].uri;
      setSelectedImages(newImages); // Update selected images state
    }
  };

  // Function to remove an image
  const removeImage = (index) => {
    const newImages = [...selectedImages];
    newImages[index] = '';
    setSelectedImages(newImages); // Update selected images state
  };

  // Function to update the place in Firestore
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const filteredImages = selectedImages.filter(imageUri => imageUri !== '');
      const uploadedImages = await Promise.all(
        filteredImages.map(async (imageUri, index) => {
          if (imageUri.startsWith('http')) {
            // If the image URI is already a URL, return it
            return imageUri;
          } else {
            // Otherwise, upload the image to Firebase Storage
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const storageRef = ref(storage, `images/${id}/${index}`);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
          }
        })
      );

      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        imageUrl: uploadedImages,
        name,
        description,
        category,
      });
      console.log('Place updated successfully');
      setAnimationType('success');
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
        router.push(`/adminHome/data`);
      }, 3000);
    } catch (error) {
      console.error('Error updating place:', error);
      setAnimationType('error');
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Function to delete the place from Firestore
  const handleDelete = async () => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      console.log('Place deleted successfully');
      router.push(`/adminHome/data`);
    } catch (error) {
      console.error('Error deleting place:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>

        {/* Back Button */}
        <TouchableOpacity onPress={() => router.push(`/adminHome/data`)} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Database Information</Text>

        {/* Name Input */}
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />

        {/* Image Picker Boxes */}
        <View style={styles.imageBoxesContainer}>
          {selectedImages.map((imageUri, index) => (
            <View key={index} style={styles.imageBoxContainer}>
              <TouchableOpacity style={styles.imageBox} onPress={() => pickImage(index)}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                ) : (
                  <Text style={styles.addPictureText}>Add Picture {index + 1}</Text>
                )}
              </TouchableOpacity>
              {imageUri ? (
                <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}>
                  <MaterialIcons name="delete" size={24} color="red" />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>

        {/* Description Input */}
        <TextInput
          style={styles.input}
          placeholder="Description"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
        />

        {/* Category Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
          >
            <Picker.Item label="Architecture" value="Architecture" />
            <Picker.Item label="Flower" value="Flower" />
            <Picker.Item label="Plant" value="Plant" />
          </Picker>
        </View>

        {/* Publish Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.buttonText}>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success/Error Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <LottieView
              source={
                animationType === 'success'
                  ? require('../../../../../assets/animations/plantSuccess.json')
                  : require('../../../../../assets/animations/errorAnimation.json')
              }
              autoPlay
              loop={false}
              style={styles.lottie}
            />
            <Text style={styles.modalText}>
              {animationType === 'success' ? 'Update Successful!' : 'Update Failed!'}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  content: {
    flex: 1,
  },
  backButton: {
    marginTop: 50,
    marginLeft: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  imageBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imageBoxContainer: {
    position: 'relative',
    width: '30%',
  },
  imageBox: {
    backgroundColor: '#d3d3d3',
    height: 100,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPictureText: {
    color: '#888',
    fontSize: 18,
    textAlign: 'center',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  input: {
    backgroundColor: '#F7F8F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderColor: '#cccccc',
    borderWidth: 1,
  },
  pickerContainer: {
    backgroundColor: '#F7F8F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cccccc',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 14,
    flex: 0.48,
    alignItems: 'center',
    width: '90%',
  },
  deleteButton: {
    backgroundColor: '#B4181B',
    padding: 15,
    borderRadius: 14,
    flex: 0.48,
    alignItems: 'center',
    width: '90%',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    height: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 150,
    height: 150,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
});

export default UpdateDatabase;