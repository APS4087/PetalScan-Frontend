import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const ArchitectureDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Get the dynamic route parameter
  const [architecture, setArchitecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArchitecture = async () => {
      try {
        const docRef = doc(db, 'architectures', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setArchitecture(docSnap.data());
        } else {
          setError('No such document!');
        }
      } catch (error) {
        setError('Failed to load architecture.');
      } finally {
        setLoading(false);
      }
    };

    fetchArchitecture();
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      {architecture && (
        <>
          <Image source={{ uri: architecture.imageUrl }} style={styles.image} />
          <Text style={styles.title}>{architecture.name}</Text>
          <Text style={styles.description}>{architecture.description}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#333333',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
  },
});

export default ArchitectureDetail;