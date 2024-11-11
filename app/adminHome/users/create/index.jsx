import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard, TouchableWithoutFeedback, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // For back icon
import { auth, db } from '../../../../firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getCustomErrorMessage } from '../../../../utils/authUtils';

// Create User Screen component
export default function CreateUserScreen() {
  // State variables to store user input
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const router = useRouter();

  // Function to handle user creation
  const handleCreateUser = async () => {
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match!');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      //console.log('Creating user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      //console.log('Sending email verification...');
      await sendEmailVerification(user);
  
      //console.log('Setting user document...');
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        userType: 'normal', 
        status: 'active',
        createdAt: new Date().toISOString()
      });
  
      //console.log('Setting normalUsers document...');
      await setDoc(doc(db, 'normalUsers', user.uid), {
        uid: user.uid,  
        createdAt: new Date().toISOString()
      });
  
      //console.log('User created successfully:', user);
      setLoading(false);
      setIsSuccessModalVisible(true); // Show success modal
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorMessage(getCustomErrorMessage(error));
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
    router.push('/adminHome/users');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          {/* Back button to navigate to the previous screen */}
          <TouchableOpacity onPress={() => router.push('/adminHome/users')} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={30} color="black" />
          </TouchableOpacity>

          {/* Title text */}
          <Text style={styles.title}>Create User</Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
          ) : (
            <>
              {/* Username input field */}
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#8a8a8a"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              {/* Email input field */}
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#8a8a8a"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />

              {/* Password input field */}
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#8a8a8a"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {/* Confirm Password input field */}
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#8a8a8a"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              {/* Create button */}
              <TouchableOpacity style={styles.createButton} onPress={handleCreateUser} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.createButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Success Modal */}
          <Modal
            transparent={true}
            visible={isSuccessModalVisible}
            animationType="fade"
            onRequestClose={closeSuccessModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>User Created Successfully!</Text>
                <Text style={styles.modalMessage}>Please ask {username} to verify their email ({email})</Text>
                <TouchableOpacity style={styles.modalButton} onPress={closeSuccessModal}>
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

// Styles for the CreateUserScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  backButton: {
    marginLeft: 10,
    marginTop: 10,
  },
  title: {
    marginTop: 20,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#F7F8F9',
    color: 'black',
  },
  createButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginVertical: 30,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
});