import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TextInput } from 'react-native';
import { ScrollView } from 'react-native';
import { Image } from 'react-native';
import LottieView from 'lottie-react-native';
import UserNavbar from '../../components/UserNavbar';
import { useRouter } from 'expo-router';
import images from '../../components/data';
import { useAuth } from '../../context/authContext';
import { getDocs, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const { width, height } = Dimensions.get('window');

function HomeScreen() {
  const router = useRouter();

  // Get the user from the AuthContext
  const { user } = useAuth();
  const [architectures, setArchitectures] = useState([]);
  const [flowers, setFlowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Architecture'); // Default category
  const [isPremium, setIsPremium] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // State for search query

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const architecturesCollection = collection(db, 'architectures');
        const architecturesSnapshot = await getDocs(architecturesCollection);
        const architecturesList = architecturesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setArchitectures(architecturesList);

        const flowersCollection = collection(db, 'flowers');
        const flowersSnapshot = await getDocs(flowersCollection);
        const flowersList = flowersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFlowers(flowersList);
      } catch (error) {
        setError('Failed to load places.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserType = async () => {
      if (user) {
        const userRef = doc(collection(db, 'users'), user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsPremium(userData.userType === 'premium');
        }
      }
    };

    fetchPlaces();
    fetchUserType();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/animations/plantLoadingAnimation.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  const places = selectedCategory === 'Architecture' ? architectures : flowers;

  // Filter places based on search query
  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user ? user.username : 'Guest'}
            {isPremium && <Image source={images.crownIcon} style={styles.crownIcon} />}
          </Text>
        </View>

        {/* Recommended Section */}
        <View style={styles.recommended}>
          <Text style={styles.recommendedTitle}>Recommended</Text>
        </View>

        {/* Search Bar with Icon */}
        <View style={styles.searchBarContainer}>
          <Image source={images.searchIcon} style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery} // Update search query state
          />
        </View>

        {/* Categories */}
        <View style={styles.categories}>
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === 'Architecture' && styles.selectedCategoryButton]}
            onPress={() => setSelectedCategory('Architecture')}
          >
            <Text style={styles.categoryText}>Architecture</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === 'Flower' && styles.selectedCategoryButton]}
            onPress={() => setSelectedCategory('Flower')}
          >
            <Text style={styles.categoryText}>Flower</Text>
          </TouchableOpacity>
        </View>

        {/* Image Cards */}
        {filteredPlaces.map(place => {
          const imageUrl = Array.isArray(place.imageUrl) ? place.imageUrl[0] : place.imageUrl;
          return (
            <TouchableOpacity
              key={place.id}
              style={styles.card}
              onPress={() => router.push(`/home/${selectedCategory.toLowerCase()}/${place.id}`)}
            >
              <Image source={{ uri: imageUrl }} style={styles.cardImage} />
              <Text style={styles.cardText}>{place.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {/* Navigation Bar at the Bottom */}
      <UserNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#ffffff',
    padding: width * 0.04,
    paddingTop: height * 0.05, // Add padding to the top
    paddingBottom: height * 0.08, // Add padding to the bottom
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: height * 0.02,
    marginLeft: width * 0.02,
  },
  greeting: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  crownIcon: {
    width: width * 0.05,
    height: width * 0.05,
    marginLeft: width * 0.04, 
  },
  icon: {
    width: width * 0.07,
    height: width * 0.07,
  },
  recommended: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: width * 0.015,
    marginBottom: height * 0.02,
  },
  recommendedTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
  },
  seeAll: {
    fontSize: width * 0.035,
    marginRight: width * 0.02,
    width: width * 0.2,
    textAlign: 'right',
    color: 'blue',
  },
  categories: {
    flexDirection: 'row',
    marginBottom: height * 0.02,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: height * 0.013,
    paddingHorizontal: width * 0.04,
    borderRadius: 20,
    marginRight: width * 0.02,
    flex: 1,
    alignItems: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: '#d0d0d0',
  },
  categoryText: {
    fontSize: width * 0.035,
    textAlign: 'center',
    width: width * 0.4,
  },
  card: {
    marginBottom: height * 0.02,
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
  },
  cardImage: {
    width: '100%',
    height: width * 0.5, // 50% of screen width
    borderRadius: 10,
  },
  cardText: {
    position: 'absolute',
    bottom: height * 0.01,
    left: width * 0.03,
    color: 'white',
    fontWeight: 'bold',
    fontSize: width * 0.045,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 150,
    height: 150,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: width * 0.04,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F9',
    height: height * 0.05, 
    width: width * 0.9,
    borderRadius: 20,
    marginVertical: height * 0.01,
    borderColor: '#cccccc',
    borderWidth: 1,
  },
  searchIcon: {
    width: width * 0.04,
    height: width * 0.04,
    marginLeft: width * 0.05,
  },
  searchBar: {
    flex: 1,
    padding: width * 0.02,
    fontSize: width * 0.04,
  },
});

export default HomeScreen;