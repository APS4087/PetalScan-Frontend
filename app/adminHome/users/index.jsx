import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { useRouter } from 'expo-router';
import AdminNavbar from '../../../components/AdminNavbar.js';
import images from '../../../components/data.js';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

function UserPage({ navigation }) {
  const router = useRouter();
  
  // Handler for add user click
  const addOnClick = () => {
    router.push('/adminHome/users/create');
  };

  // Handler for update user click
  const updateUseronClick = (user) => {
    router.push({
      pathname: `/adminHome/users/update/${user.id}`,
      params: { user: JSON.stringify(user) },
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false); // Set loading to false when data is fetched
      }
    };

    fetchUsers();
  }, []);

  const toggleStatus = async (id) => {
    try {
      const userRef = doc(db, 'users', id);
      const user = users.find(user => user.id === id);
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await updateDoc(userRef, { status: newStatus });
      setUsers(users.map(user =>
        user.id === id ? { ...user, status: newStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>User Management</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Image source={images.searchIcon} style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Add New User */}
        <TouchableOpacity style={styles.addUserContainer} onPress={addOnClick}>
          <MaterialIcons name="add" size={30} color="white" />
          <Text style={styles.addUserText}>Add New User</Text>
        </TouchableOpacity>

        {/* User List */}
        {users.filter(user => user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
          <View key={user.id} style={styles.userContainer}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.username}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  user.status === 'active' ? styles.active : styles.inactive
                ]}
                onPress={() => toggleStatus(user.id)}
              >
                <Text style={styles.statusText}>{user.status === 'active' ? 'Suspend' : 'Activate'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateUseronClick(user)}>
                <MaterialIcons name="edit" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
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
    padding: width * 0.05,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
    marginTop: height * 0.05,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#333',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F9',
    borderRadius: 15,
    marginVertical: height * 0.02,
    marginHorizontal: width * 0.05,
    borderColor: '#cccccc',
    borderWidth: 1,
  },
  searchIcon: {
    width: width * 0.05,
    height: width * 0.05,
    marginLeft: width * 0.04,
  },
  searchBar: {
    flex: 1,
    padding: width * 0.03,
    fontSize: width * 0.04,
  },
  addUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#109CF1',
    height: height * 0.07,
    borderRadius: 8,
    justifyContent: 'center',
    marginHorizontal: width * 0.05,
    marginBottom: height * 0.02,
  },
  addUserText: {
    color: 'white',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    marginLeft: width * 0.02,
  },
  userContainer: {
    backgroundColor: '#ffffff',
    padding: width * 0.04,
    marginHorizontal: width * 0.05,
    marginBottom: height * 0.01,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginRight: width * 0.03,
  },
  userName: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: width * 0.025,
    color: '#666',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    padding: width * 0.03,
    borderRadius: 8,
    marginRight: width * 0.03,
    width: width * 0.25,
    alignItems: 'center',
  },
  active: {
    backgroundColor: '#FF3B47',
  },
  inactive: {
    backgroundColor: '#109CF1',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.035,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: width * 0.4,
    height: width * 0.4,
  },
});

export default UserPage;