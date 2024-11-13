import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal, Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { auth, db } from '../../../firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getCustomErrorMessage } from '../../../utils/authUtils';
import images from '../../../components/data'; // Import images

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // State to track keyboard visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State to track password visibility
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false); // State to track confirm password visibility

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        userType: 'normal',
        createdAt: new Date().toISOString()
      });

      await setDoc(doc(db, 'normalUsers', user.uid), {
        uid: user.uid,  
        createdAt: new Date().toISOString()
      });

      setLoading(false);
      setIsSuccessModalVisible(true); // Show success modal
    } catch (error) {
      setErrorMessage(getCustomErrorMessage(error));
      setLoading(false);
      console.log(error)
    }
  };

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
    router.push('/auth/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.innerContainer}>
          {!isKeyboardVisible && (
            <TouchableOpacity style={styles.logo} onPress={() => router.push('/auth')}>
              <Image source={images.backArrowIcon} style={styles.arrow} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.title2}>Join us and start scanning</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#8a8a8a"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8a8a8a"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#8a8a8a"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.togglePasswordVisibility}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Image
                source={isPasswordVisible ? images.eyeOpenIcon : images.eyeCloseIcon}
                style={styles.passwordVisibilityIcon}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm password"
              placeholderTextColor="#8a8a8a"
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
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginLinkButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.alreadyHaveAccountText}>Already have an account?
              <Text style={styles.loginLinkButtonText}>   Login Now</Text>
            </Text>
          </TouchableOpacity>

          {/* Success Modal */}
          <Modal
            transparent={true}
            visible={isSuccessModalVisible}
            animationType="fade"
            onRequestClose={closeSuccessModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Registration Successful!</Text>
                <Text style={styles.modalMessage}>Please check your email to verify your account.</Text>
                <TouchableOpacity style={styles.modalButton} onPress={closeSuccessModal}>
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  arrow: {
    height: 30,
    width: 30,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  title2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 70,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#F7F8F9',
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
  registerButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alreadyHaveAccountText: {
    fontSize: 12,
    textAlign: 'center',
  },
  loginLinkButton: {
    alignSelf: 'center',
  },
  loginLinkButtonText: {
    color: '#0000EE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
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