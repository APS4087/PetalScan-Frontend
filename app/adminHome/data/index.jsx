import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // For back icon
import { useRouter } from 'expo-router';
import images from '../../../components/data';
import AdminNavbar from '../../../components/AdminNavbar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

function Database({ navigation }) {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Architecture'); // Default category
  const [searchQuery, setSearchQuery] = useState(''); // State for search query

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const architecturesCollection = collection(db, 'architectures');
        const architecturesSnapshot = await getDocs(architecturesCollection);
        const architecturesList = architecturesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const flowersCollection = collection(db, 'flowers');
        const flowersSnapshot = await getDocs(flowersCollection);
        const flowersList = flowersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setData({
          Architecture: architecturesList,
          Flower: flowersList,
        });
      } catch (error) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler for add database click
  const addonClick = () => {
    router.push('/adminHome/data/architecture/add');
  };

  // Handler for update database click
  const updateonClick = (id, collectionName) => {
    router.push(`/adminHome/data/architecture/update/${id}?collectionName=${collectionName}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/animations/plantLoadingAnimation.json')}
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

  const places = data[selectedCategory] || [];

  // Filter places based on search query
  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>

        {/* Database Management Title */}
        <Text style={styles.mainTitle}>Database Management</Text>

        {/* Back Button */}
        <TouchableOpacity onPress={() => router.push('/adminHome')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>

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

        {/* First Card (Modified) - Add Database */}
        <TouchableOpacity style={styles.emptyCard} onPress={addonClick}>
          <MaterialIcons name="add" size={48} color="gray" />
        </TouchableOpacity>

        {/* Render data from Firestore */}
        {filteredPlaces.map(item => {
          const imageUrl = Array.isArray(item.imageUrl) ? item.imageUrl[0] : item.imageUrl;
          return (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => updateonClick(item.id, selectedCategory.toLowerCase() === 'architecture' ? 'architectures' : 'flowers')}>
              <Image source={{ uri: imageUrl }} style={styles.cardImage} />
              <Text style={styles.cardText}>{item.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {/* Navigation Bar at the Bottom */}
      <View style={styles.navibarContainer}>
        <AdminNavbar navigation={navigation} />
      </View>
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
    marginBottom: height * 0.025,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  backButton: {
    marginTop: 10,
    marginLeft: 10,
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
  emptyCard: {
    backgroundColor: '#d3d3d3', // Gray background
    height: 200,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  navibarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
});

export default Database;