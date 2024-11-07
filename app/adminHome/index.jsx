import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AdminNavbar from '../../components/AdminNavbar';
import { MaterialIcons } from '@expo/vector-icons'; // For icons (increase/decrease arrows)
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import LottieView from 'lottie-react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

const LOCAL_MACHINE_IP = 'http://192.168.239.197:8000';
const HOME_WIFI = 'http://192.168.10.218:8000';

function Admin({ navigation }) {
  const router = useRouter();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalRecommendations, setTotalRecommendations] = useState(0); // Number of architecture + flowers
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [revenue, setRevenue] = useState(0); // Example revenue
  const [loading, setLoading] = useState(true); // Loading state
  
  // Sample change indicators
  const userChange = 10; // Positive for increase, negative for decrease
  const recommendationsChange = -15;
  const notificationChange = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        setTotalUsers(usersSnapshot.size);

        // Fetch total recommendations (architecture + flowers)
        const architecturesSnapshot = await getDocs(collection(db, 'architectures'));
        const flowersSnapshot = await getDocs(collection(db, 'flowers'));
        setTotalRecommendations(architecturesSnapshot.size + flowersSnapshot.size);

        // Fetch total notifications
        const response = await fetch(`${LOCAL_MACHINE_IP}/events/`);
        const data = await response.json();
        setTotalNotifications(data.upcoming_events.length);

        // Fetch revenue (example: sum of all payments)
        const paymentsSnapshot = await getDocs(collection(db, 'payments'));
        let totalRevenue = 0;
        paymentsSnapshot.forEach(doc => {
          totalRevenue += doc.data().amount;
        });
        setRevenue(totalRevenue);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // Set loading to false when data is fetched
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, Admin</Text>
        </View>

        {/* Cards Section */}
        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={()=> router.push('/adminHome/users')}>
            <Text style={styles.cardTitle}>Total Users</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardNumber}>{totalUsers}</Text>
              <View style={styles.changeIndicator}>
                <MaterialIcons
                  name={userChange >= 0 ? 'arrow-upward' : 'arrow-downward'}
                  size={20}
                  color={userChange >= 0 ? 'green' : 'red'}
                />
                <Text style={{ color: userChange >= 0 ? 'green' : 'red' }}>
                  {Math.abs(userChange)} {userChange >= 0 ? 'added' : 'lost'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={()=> router.push('/adminHome/data')}>
            <Text style={styles.cardTitle}>Total Recommendations</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardNumber}>{totalRecommendations}</Text>
              <View style={styles.changeIndicator}>
                <MaterialIcons
                  name={recommendationsChange >= 0 ? 'arrow-upward' : 'arrow-downward'}
                  size={20}
                  color={recommendationsChange >= 0 ? 'green' : 'red'}
                />
                <Text style={{ color: recommendationsChange >= 0 ? 'green' : 'red' }}>
                  {Math.abs(recommendationsChange)} {recommendationsChange >= 0 ? 'added' : 'lost'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Total Notifications</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardNumber}>{totalNotifications}</Text>
              <View style={styles.changeIndicator}>
                <MaterialIcons
                  name={notificationChange >= 0 ? 'arrow-upward' : 'arrow-downward'}
                  size={20}
                  color={notificationChange >= 0 ? 'green' : 'red'}
                />
                <Text style={{ color: notificationChange >= 0 ? 'green' : 'red' }}>
                  {Math.abs(notificationChange)} {notificationChange >= 0 ? 'added' : 'lost'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Total Revenue</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardNumber}>${revenue}</Text>
            </View>
          </TouchableOpacity> */}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Navigation Bar at the Bottom */}
      <AdminNavbar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 10,
    borderBottomColor: '#FFFFFF',
    marginTop: 50,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
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
  logoutButton: {
    backgroundColor: '#FF0000',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Admin;