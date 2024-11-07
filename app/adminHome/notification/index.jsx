import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, Linking } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Import MaterialIcons
import images from '../../../components/data';
import AdminNavbar from '../../../components/AdminNavbar';

const LOCAL_MACHINE_IP = 'http://192.168.239.197:8000'; 
const HOME_WIFI = 'http://192.168.10.218:8000';
const AWS_SERVER_URL = 'http://3.27.248.187:8000';

export default function AdminNotificationScreen({ navigation }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Fetch events from the backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${LOCAL_MACHINE_IP}/events/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        // Add a seen property to each event
        const eventsWithSeen = data.upcoming_events.map(event => ({ ...event, seen: false }));
        setEvents(eventsWithSeen || []); // Ensure events is always an array
        setFilteredEvents(eventsWithSeen || []); // Initialize filtered events
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]); // Set events to an empty array on error
        setFilteredEvents([]); // Set filtered events to an empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Handler for notification click
  const handleNotificationClick = (index, link) => {
    // Mark the notification as seen
    const updatedEvents = [...events];
    updatedEvents[index].seen = true;
    setEvents(updatedEvents);
    setFilteredEvents(updatedEvents);

    // Open the link in the default browser
    Linking.openURL(link);
  };

  // Handler for search query change
  const handleSearchQueryChange = (query) => {
    setSearchQuery(query);
    if (query === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event =>
        event.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/animations/notiLoadingAnimation.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.notificationContainer}>
          <Text style={styles.sectionTitle}>Notification</Text>

          {/* Search Bar with Icon */}
          <View style={styles.searchContainer}>
            <Image
              source={images.searchIcon}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchBar}
              placeholder="Search"
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
            />
          </View>

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterText}>Latest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterText}>Oldest</Text>
            </TouchableOpacity>
          </View>

          {/* Add Notification Button with Material Icon */}
          <TouchableOpacity style={styles.blankContainer} onPress={() => alert('Add feature is still under development')}>
            <MaterialIcons name="add" size={30} color="black" />
            <Text style={styles.addText}>Add Notification (Under Development)</Text>
          </TouchableOpacity>

          {/* Notification Items */}
          {filteredEvents.map((event, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.notificationItem, event.seen && styles.seenNotification]}
              onPress={() => handleNotificationClick(index, event.link)}  // Navigate to the event link
            >
              <View style={styles.notificationTopContainer}>
                <Text style={styles.smallNotification}>{event.seen ? 'Seen' : 'New'}</Text>
                <Text style={styles.notificationDate}>{event.date}</Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{event.title}</Text>
                <Text style={styles.notificationDescription}>Tap for more description</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Navigation Bar at the Bottom */}
      <View style={styles.navibarContainer}>
        <AdminNavbar navigation={navigation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 30,
    marginBottom: 30,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 70, // Ensure content does not overlap with the Navibar
  },
  notificationContainer: {
    marginBottom: 10,
    marginTop: -60,
  },
  notificationBottonContainer: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: "30%",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 12,
    marginBottom: 20,
    borderColor: '#959595',
    borderWidth: 1,
  },
  searchIcon: {
    width: 15,
    height: 15,
    marginLeft: 10,
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterButton: {
    flex: 0.48,
    backgroundColor: 'white',
    paddingVertical: 8,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#959595',
    borderWidth: 1,
  },
  filterText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
  },
  blankContainer: {
    backgroundColor: '#F7F8F9',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderColor: '#8F9EBC',
    borderWidth: 1,
    flexDirection: 'row',
  },
  addText: {
    marginLeft: 5,
    fontSize: 10,
    width: 200,
    color: '#888',
  },
  notificationItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  seenNotification: {
    backgroundColor: '#e0e0e0', // Different background color for seen notifications
  },
  notificationTopContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  smallNotification: {
    fontSize: 12,
    color: '#888888',
    width: 50, // Ensure enough width for the text
  },
  notificationDate: {
    fontSize: 12,
    color: '#888888',
  },
  notificationContent: {
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#333333',
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
    width: 300,
    height: 300,
  },
});