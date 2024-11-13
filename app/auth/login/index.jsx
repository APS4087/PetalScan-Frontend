import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { auth } from '../../../firebaseConfig';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getCustomErrorMessage } from '../../../utils/authUtils';
import { getDoc, doc, query, where, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../../context/authContext';
import images from '../../../components/data'; // Import images

export default function LoginScreen() {
  // Initialize the router
  const router = useRouter();
  const { setUser } = useAuth(); // Consume the context

  // Initialize the state variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [resetEmail, setResetEmail] = useState(''); // State for reset email
  const [isResetModalVisible, setIsResetModalVisible] = useState(false); // State for reset modal visibility
  const [resetMessage, setResetMessage] = useState(''); // State for reset message
  const [isSuccess, setIsSuccess] = useState(false); // State to track success or error
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // State to track keyboard visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State to track password visibility

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

  const handleLogin = async () => {
    setIsLoading(true); // Start loading
    setErrorMessage(''); // Clear previous error message
    try {
      // Authenticate the user with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user data from Firestore using email
      const userData = await getUserDataByEmail(email);

      if (!userData) {
        setErrorMessage('No such user found.');
        await signOut(auth); // Sign out the user
        setIsLoading(false);
        return;
      }

      if (userData.status === 'inactive') {
        setErrorMessage('Your account is suspended or deactivated. Please contact support.');
        await signOut(auth); // Sign out the user
        setIsLoading(false);
        return;
      }

      if (user.emailVerified) {
        setUser(userData); // Set the user in context
        if (userData.userType === 'normal' || userData.userType === 'premium') {
          router.push('/home');
        } else if (userData.userType === 'admin') {
          router.push('/adminHome');
        }
      } else {
        setErrorMessage('Please verify your email address.');
        await signOut(auth); // Sign out the user
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setErrorMessage(getCustomErrorMessage(error));
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const getUserDataByEmail = async (email) => {
    try {
      console.log(`Querying Firestore for email: ${email}`);
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      console.log(`Query snapshot size: ${querySnapshot.size}`);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        console.log("Fetched user data from Firestore: ", userData); // Log fetched data
        return {
          ...userData,
          uid: userDoc.id,
        };
      } else {
        console.error('No such document!');
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    return null;
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setResetMessage('Please enter your email address.');
      setIsSuccess(false);
      return;
    }

    // Check if the email exists in the database
    const userData = await getUserDataByEmail(resetEmail);
    if (!userData) {
      setResetMessage('No such user found.');
      setIsSuccess(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Password reset email sent. Please check your inbox.');
      setIsSuccess(true);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setResetMessage(getCustomErrorMessage(error));
      setIsSuccess(false);
    }
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
          <Text style={styles.title}>Sign in to your Account</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
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
          <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => setIsResetModalVisible(true)}>
            <Text style={styles.forgotPasswordButtonText}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.registerLinkButton} onPress={() => router.push('/auth/register')}>
            <Text style={styles.dontHaveAccountText}>Don't have an account?
              <Text style={styles.registerLinkButtonText}> Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Password Reset Modal */}
      {isResetModalVisible && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={resetEmail}
              onChangeText={setResetEmail}
            />
            {resetMessage ? <Text style={[styles.resetMessageText, isSuccess ? styles.successText : styles.errorText]}>{resetMessage}</Text> : null}
            <TouchableOpacity style={styles.resetButton} onPress={handlePasswordReset}>
              <Text style={styles.resetButtonText}>Send Reset Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => {
              setIsResetModalVisible(false);
              setResetMessage('');
            }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 80,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordButtonText: {
    color: '#0000EE',
    fontSize: 12,
  },
  loginButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dontHaveAccountText: {
    fontSize: 12,
    textAlign: 'center',
  },
  registerLinkButton: {
    alignSelf: 'center',
  },
  registerLinkButtonText: {
    color: '#0000EE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginVertical: 30,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resetMessageText: {
    marginBottom: 10,
  },
  successText: {
    color: 'green',
  },
  errorText: {
    color: 'red',
  },
  resetButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#cccccc',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  cancelButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});