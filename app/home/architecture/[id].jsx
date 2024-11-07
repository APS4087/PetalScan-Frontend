import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import images from '../../../components/data';
import Swiper from 'react-native-swiper';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

const ArchitectureDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
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
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
        <Image source={images.backArrowIcon} style={styles.arrow} />
      </TouchableOpacity>
      {architecture && (
        <>
          <View style={styles.carouselContainer}>
            <Swiper
              style={styles.wrapper}
              showsButtons={false}
              autoplay={true}
              autoplayTimeout={3}
              loop={true}
              renderPagination={(index, total, context) => (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity onPress={() => context.scrollBy(-1)} style={styles.arrowButton}>
                    <Text style={styles.buttonText}>‹</Text>
                  </TouchableOpacity>
                  <View style={styles.dotsContainer}>
                    {Array.from({ length: total }).map((_, i) => (
                      <View key={i} style={i === index ? styles.activeDot : styles.dot} />
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => context.scrollBy(1)} style={styles.arrowButton}>
                    <Text style={styles.buttonText}>›</Text>
                  </TouchableOpacity>
                </View>
              )}
            >
              {architecture.imageUrl.map((url, index) => (
                <View key={index} style={styles.slide}>
                  <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
                </View>
              ))}
            </Swiper>
          </View>
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
    padding: '4%',
  },
  backButton: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    zIndex: 1,
  },
  arrow: {
    width: 25,
    height: 25,
  },
  carouselContainer: {
    height: '30%', 
    marginTop: '20%',
    marginBottom: '5%',
    borderRadius: 20,
  },
  wrapper: {
    height: '100%',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20, // Rounded edges
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  arrowButton: {
    paddingHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: 'rgba(0,0,0,.2)',
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 3,
  },
  activeDot: {
    backgroundColor: '#000',
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 3,
  },
  buttonText: {
    color: '#000',
    fontSize: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
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