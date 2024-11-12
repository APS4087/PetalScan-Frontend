import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import { auth, db } from '../../firebaseConfig'; // Adjust the path to your Firebase configuration
import { doc, setDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();

  // ----testing google login --TODO stil need to fix
  // const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  //   clientId: '782464801098-p0bp2lfiuu8gl5lvu7tc54htsk8aar90.apps.googleusercontent.com',
  //   redirectUri: 'https://auth.expo.io/@aungps001/PentalScan',
  // });

  // React.useEffect(() => {
  //   if (response?.type === 'success') {
  //     const { id_token } = response.params;
  //     const credential = GoogleAuthProvider.credential(id_token);
  //     handleSignInWithGoogle(credential);
  //   }
  // }, [response]);

  // const handleSignInWithGoogle = async (credential) => {
  //   try {
  //     const userCredential = await signInWithCredential(auth, credential);
  //     const user = userCredential.user;

  //     // Check if the user is new
  //     if (userCredential.additionalUserInfo?.isNewUser) {
  //       // Save user data to Firestore
  //       await setDoc(doc(db, 'users', user.uid), {
  //         username: user.displayName,
  //         email: user.email,
  //         createdAt: new Date().toISOString(),
  //       });
  //     }

  //     Alert.alert('Success', 'You are logged in with Google!');
  //     router.push('/home'); // Navigate to home or other authenticated screen
  //   } catch (error) {
  //     console.error('Error signing in with Google:', error);
  //     Alert.alert('Error', 'There was an issue signing in with Google.');
  //   }
  // };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
      <Text style={styles.text}>Recognize, Appreciate, Enjoy!</Text>
      <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth/login')}>
        <Text style={[styles.loginButtonText, styles.fontBold]}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/auth/register')}>
        <Text style={[styles.registerButtonText, styles.fontRegular]}>Register</Text>
      </TouchableOpacity>
      {/* 
      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={[styles.separatorText, styles.fontItalic]}>or</Text>
        <View style={styles.separatorLine} />
      </View> */}
      {/* <TouchableOpacity
        style={styles.googleButton}
        // onPress={() => promptAsync()}
        // disabled={!request}
      >
        <Image source={require('../../assets/images/googleLogo.png')} style={styles.googleLogo} />
        <Text style={[styles.googleButtonText, styles.fontRegular]}>Continue with Google</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: '20%', // Adjusted margin top
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
   
    width: width * 0.8, // Responsive width
    height: height * 0.2, // Responsive height
    resizeMode: 'contain', // Ensure the image scales correctly
    marginTop: 150, // Adjusted margin top
    marginBottom: 40, // Add some space below the logo
  },
  text: {
    //borderWidth: 1,
    width: width * 0.8, // Responsive width
    position: 'absolute',
    top: height * 0.3125, // Position below the logo
    right: - width * 0.2, // Position to the right side of the logo
    fontSize: 14,
    color: '#00000',
  },
  
  loginButton: {
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 10,
    marginTop: 20, // Adjusted margin top
    marginBottom: 15,
    width: '80%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    width: '80%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#000000',
    fontSize: 16,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  separatorText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: '#666',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    height: 50,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 10,
    borderRadius: 15,
    justifyContent: 'center',
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 16,
  },
  fontBold: {
    fontWeight: 'bold',
  },
  fontRegular: {
    fontWeight: 'normal',
  },
  fontItalic: {
    fontStyle: 'italic',
  },
});