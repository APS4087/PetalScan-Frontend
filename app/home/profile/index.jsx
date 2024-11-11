import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Alert } from "react-native";
import images from "../../../components/data";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/authContext";
import { auth, db } from "../../../firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import { updateDoc, doc } from 'firebase/firestore';
import UserNavbar from '../../../components/UserNavbar'; // Import UserNavbar

const { width, height } = Dimensions.get('window');

const ProfilePage = ({ navigation }) => {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    if (user && user.username) {
      setUsername(user.username);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut(auth);
      setUser(null);
      router.push('/auth');
    } catch (error) {
      console.log('Error at handleLogout', error);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { status: 'inactive' });
      Alert.alert('Account Deactivated', 'Your account has been deactivated.');
      handleLogout();
    } catch (error) {
      console.log('Error at handleDeactivateAccount', error);
      Alert.alert('Error', 'Failed to deactivate account. Please try again.');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        {/* Profile Picture */}
        <Image
          source={{ uri: user?.profileImageUrl || (username ? `https://api.multiavatar.com/${username}.png` : 'https://api.multiavatar.com/bill.png') }}
          style={styles.profileImage}
        />

        {/* Username and Email */}
        <Text style={styles.username}>{username || 'Loading...'}</Text>
        <Text style={styles.email}>{user?.email || 'Loading...'}</Text>

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.option} onPress={() => router.push('/home/profile/updateProfile')}>
            <View style={styles.optionContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={24} color="#0601B4" />
              </View>
              <Text style={styles.optionText}>Your profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6e6e6e" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option} onPress={handleLogout}>
            <View style={styles.optionContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="log-out-outline" size={24} color="#0601B4" />
              </View>
              <Text style={styles.optionText}>Log out</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6e6e6e" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.premiumButton} onPress={() => router.push('/payment')}>
          <Text style={styles.premiumText}>Upgrade to premium</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeactivateAccount}>
          <Text style={styles.deleteText}>Deactivate Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Navigation Bar at the Bottom */}
      <View style={styles.navibarContainer}>
        <UserNavbar/>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: height * 0.05,
    paddingHorizontal: width * 0.05,
  },
  profileImage: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: (width * 0.3) / 2,
    marginTop: height * 0.02,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: height * 0.09,
  },
  username: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    marginTop: height * 0.01,
    textAlign: 'center',
  },
  email: {
    fontSize: width * 0.04,
    color: 'gray',
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: height * 0.03,
  },
  option: {
    backgroundColor: '#f9f9f9',
    padding: width * 0.04,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: height * 0.01,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    justifyContent: 'flex-start',
  },
  iconCircle: {
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: (width * 0.09) / 2,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.03,
  },
  optionText: {
    fontSize: width * 0.04,
    width: '80%',
    color: '#000',
  },
  deleteButton: {
    width: '90%',
    padding: height * 0.015,
    borderRadius: 10,
    backgroundColor: '#8B0000',
    marginTop: height * 0.01,
    alignSelf: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: width * 0.043,
    width: '54%',
    color: '#fff',
  },
  premiumButton: {
    width: '90%',
    padding: height * 0.015,
    borderRadius: 10,
    backgroundColor: 'rgba(191, 191, 36, 0.6)', // 60% opacity
    marginTop: height * 0.02,
    alignSelf: 'center',
    alignItems: 'center',
  },
  premiumText: {
    fontSize: width * 0.043,
    width: '54%',
    color: '#fff',
  },
  navibarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default ProfilePage;