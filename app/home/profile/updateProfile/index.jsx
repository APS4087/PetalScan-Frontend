import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, Dimensions, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../../context/authContext';  
import { useRouter } from 'expo-router';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../../../firebaseConfig';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import LottieView from 'lottie-react-native';
import images from '../../../../components/data';

const { width, height } = Dimensions.get('window');

export default function UpdateProfileScreen() {
  const [username, setUsername] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false); // State to track new password visibility
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false); // State to track confirm password visibility

  const router = useRouter();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setNewUsername(user.username || '');
      setProfileImage(user.profileImageUrl ? { uri: user.profileImageUrl } : null);
    }
  }, [user]);

  const handleProfilePictureClick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage({ uri: result.assets[0].uri });
    }
  };

  const handleUpdateProfile = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      let profileImageUrl = user.profileImageUrl;
      if (profileImage && profileImage.uri !== user.profileImageUrl) {
        const storage = getStorage();
        const storageRef = ref(storage, `profileImages/${user.uid}`);
        const response = await fetch(profileImage.uri);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        profileImageUrl = await getDownloadURL(storageRef);
      }

      const userDocRef = doc(db, 'users', user.uid);
      const updatedData = {};
      if (newUsername && newUsername !== user.username) updatedData.username = newUsername;
      if (profileImage && profileImage.uri !== user.profileImageUrl) updatedData.profileImageUrl = profileImageUrl;
      if (newPassword) updatedData.password = newPassword;

      await updateDoc(userDocRef, updatedData);

      setUser({
        ...user,
        ...updatedData,
      });

      setModalContent('success');
      setIsModalVisible(true);
      setTimeout(() => {
        setIsModalVisible(false);
        router.push('/home/profile');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setModalContent('error');
      setIsModalVisible(true);
      setTimeout(() => {
        setIsModalVisible(false);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateButtonClick = () => {
    setModalContent('password');
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/home/profile')}>
          <Ionicons name="arrow-back" size={width * 0.09} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileContainer}>
        <Text style={styles.profileTitle}>Update Profile</Text>
        <TouchableOpacity onPress={handleProfilePictureClick}>
          <Image
            source={{ uri: profileImage ? profileImage.uri : (username ? `https://api.multiavatar.com/${username}.png` : 'https://api.multiavatar.com/bill.png') }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <Text style={styles.profileName}>{user?.username}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="New Username"
        value={newUsername}
        onChangeText={setNewUsername}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="New Password"
          secureTextEntry={!isNewPasswordVisible}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity
          style={styles.togglePasswordVisibility}
          onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
        >
          <Image
            source={isNewPasswordVisible ? images.eyeOpenIcon : images.eyeCloseIcon}
            style={styles.passwordVisibilityIcon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm New Password"
          secureTextEntry={!isConfirmPasswordVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          style={styles.togglePasswordVisibility}
          onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
        >
          <Image
            source={isConfirmPasswordVisible ? images.eyeOpenIcon : images.eyeCloseIcon}
            style={styles.passwordVisibilityIcon}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.updateButton} onPress={handleUpdateButtonClick} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.updateButtonText}>Update Profile</Text>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          setIsModalVisible(!isModalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {modalContent === 'password' && (
              <>
                <Text style={styles.modalTitle}>Enter Current Password</Text>
                <Text style={styles.modalDescription}>Please enter your current password to confirm the changes.</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Current Password"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity style={styles.modalButton} onPress={handleUpdateProfile} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {modalContent === 'success' && (
              <>
                <LottieView
                  source={require('../../../../assets/animations/plantSuccess.json')}
                  autoPlay
                  loop={false}
                  style={styles.animation}
                />
                <Text style={styles.successText}>Profile updated successfully!</Text>
              </>
            )}
            {modalContent === 'error' && (
              <>
                <LottieView
                  source={require('../../../../assets/animations/errorAnimation.json')}
                  autoPlay
                  loop={false}
                  style={styles.animation}
                />
                <Text style={styles.errorText}>Failed to update profile. Please try again.</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: width * 0.05,
    marginTop: height * 0.11,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: height * 0.03,
  },
  profileTitle: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    marginBottom: height * 0.015,
  },
  profileImage: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: (width * 0.2) / 2,
    marginBottom: height * 0.01,
  },
  profileName: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    justifyContent: 'center',
    marginBottom: height * 0.005,
  },
  profileEmail: {
    fontSize: width * 0.04,
    marginLeft: width * 0.23,
    justifyContent: 'center',
    width: '80%',
    color: '#6e6e6e',
  },
  input: {
    backgroundColor: '#E8ECF4',
    padding: width * 0.04,
    borderRadius: 10,
    fontSize: width * 0.04,
    marginBottom: height * 0.01,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    backgroundColor: '#F7F8F9',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
  },
  togglePasswordVisibility: {
    padding: 10,
  },
  passwordVisibilityIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  updateButton: {
    backgroundColor: '#000',
    padding: width * 0.04,
    borderRadius: 14,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6e6e6e',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#E8ECF4',
    padding: width * 0.04,
    borderRadius: 10,
    fontSize: width * 0.04,
    marginBottom: height * 0.02,
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#000',
    padding: width * 0.04,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: height * 0.01,
    width: '100%',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  animation: {
    width: 200,
    height: 200,
  },
  successText: {
    fontSize: 18,
    color: 'green',
    marginTop: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginTop: 20,
    textAlign: 'center',
  },
});