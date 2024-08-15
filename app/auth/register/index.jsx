import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!! Register to get started</Text>
      <TextInput
        style={styles.input}
        placeholder="username"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="password"
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="confirm password"
        secureTextEntry
      />
      <TouchableOpacity style={styles.registerButton}>
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'left', 
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: {
    marginTop: '30%',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 32,
    marginLeft: 20,
  },
  input: {
    width: '90%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    alignItems: 'center', 
    justifyContent: 'center',
    marginLeft: 20,
    marginBottom: 10,
    marginTop: 20,
    backgroundColor: '#F7F8F9',
  },
  registerButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginTop: 60,
    marginLeft: 35,
    height: 50,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});