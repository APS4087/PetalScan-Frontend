import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // For back icon
import * as ImagePicker from 'expo-image-picker'; // For image picking
import { Picker } from '@react-native-picker/picker'; // For category picker
import { useRouter } from 'expo-router';
import { collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LottieView from 'lottie-react-native';
import { db } from '../../../../../firebaseConfig';

function AddDatabase({ navigation }) {
  const router = useRouter();
  const [selectedImages, setSelectedImages] = useState(['', '', '']); // To store selected images
  const [name, setName] = useState(''); // To store the name
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Architecture'); // Default category set
  const [modalVisible, setModalVisible] = useState(false);
  const [animationType, setAnimationType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(false); // Loading state

  const storage = getStorage();

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

  // Function to add a new place to Firestore
  const handleAdd = async () => {
    setLoading(true); // Start loading
    try {
      const filteredImages = selectedImages.filter(imageUri => imageUri !== '');
      const uploadedImages = await Promise.all(
        filteredImages.map(async (imageUri, index) => {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const storageRef = ref(storage, `images/${name}/${index}`);
          await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(storageRef);
          return downloadURL;
        })
      );

      const collectionName = category === 'Architecture' ? 'architectures' : 'flowers';

      await addDoc(collection(db, collectionName), {
        imageUrl: uploadedImages,
        name,
        description,
        category,
      });
      console.log('Place added successfully');
      setAnimationType('success');
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
        router.push(`/adminHome/data`);
      }, 3000);
    } catch (error) {
      console.error('Error adding place:', error);
      setAnimationType('error');
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
      }, 3000);
    } finally {
      setLoading(false); // Stop loading
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
        <Text style={styles.title}>Add Database</Text>

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
        <TouchableOpacity style={styles.publishButton} onPress={handleAdd}>
          <Text style={styles.publishText}>Publish</Text>
        </TouchableOpacity>
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
              {animationType === 'success' ? 'Addition Successful!' : 'Addition Failed!'}
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
  publishButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  publishText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddDatabase;