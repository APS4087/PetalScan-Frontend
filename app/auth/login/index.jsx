import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { auth } from '../../../firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getCustomErrorMessage } from '../../../utils/authUtils';
import { getDoc, doc, query, where, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../../context/authContext';

export default function LoginScreen() {
  // Initialize the router
  const router = useRouter();
  const { setUser } = useAuth(); // Consume the context

  // Initialize the state variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state

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
      if (error.code === 'auth/network-request-failed') {
        setErrorMessage('Network error. Please check your internet connection and try again.');
      } else {
        setErrorMessage(getCustomErrorMessage(error));
      }
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.innerContainer}>
          <TouchableOpacity style={styles.logo} onPress={() => router.push('/auth')}>
            <Image source={require('../../../assets/Icons/backArrow.png')} style={styles.arrow} />
          </TouchableOpacity>
          <Text style={styles.title}>Sign in to your Account</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          
          {/* Show loading spinner if isLoading is true */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordButtonText}>Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity style={styles.registerLinkButton} onPress={() => router.push('/auth/register')}>
            <Text style={styles.dontHaveAccountText}>Don't have an account?
              <Text style={styles.registerLinkButtonText}> Register</Text>
            </Text>
          </TouchableOpacity>
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
});