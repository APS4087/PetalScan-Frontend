import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // For back icon
import { db, auth } from '../../../../firebaseConfig';

// Edit User Screen component
export default function EditUserScreen() {
  const router = useRouter();
  const { user } = useLocalSearchParams();  // Get the user object from the route parameters

  // Parse the user object if it's a string
  const parsedUser = user ? JSON.parse(user) : {};

  // Set default values from route parameters
  const [username, setUsername] = useState(parsedUser.username || 'John Doe');
  const [email, setEmail] = useState(parsedUser.email || '');
  const [password, setPassword] = useState('');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          {/* Back button to navigate to the previous screen */}
          <TouchableOpacity onPress={() => router.push('/adminHome/users')} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={30} color="black" />
          </TouchableOpacity>

          {/* Title text */}
          <Text style={styles.title}>Edit User</Text>

          {/* Message indicating that editing is not available */}
          <Text style={styles.message}>Editing user details is not available yet.</Text>

          {/* Username input field */}
          <TextInput
            style={styles.input}
            placeholder="username"
            placeholderTextColor="#8a8a8a"
            value={username}
            onChangeText={setUsername}
            editable={false} // Disable the input field
          />

          {/* Email input field */}
          <TextInput
            style={styles.input}
            placeholder="email"
            placeholderTextColor="#8a8a8a"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            editable={false} // Disable the input field
          />

          {/* Password input field */}
          <TextInput
            style={styles.input}
            placeholder="password"
            placeholderTextColor="#8a8a8a"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={false} // Disable the input field
          />

          {/* Update button */}
          <TouchableOpacity style={[styles.updateButton, styles.disabledButton]} disabled={true}>
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

// Styles for the EditUserScreen component
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
    marginTop: '-70%',
  },
  title: {
    marginTop: '10%',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: '15%',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '90%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    marginLeft: 20,
    marginBottom: 20,
    backgroundColor: '#F7F8F9',
    color: 'black',
    height: 50,
  },
  updateButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginTop: 80,
    marginLeft: 35,
    height: 50,
  },
  disabledButton: {
    backgroundColor: '#cccccc', // Change the background color to indicate it's disabled
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});