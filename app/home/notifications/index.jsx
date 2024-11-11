import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Linking, Dimensions, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import images from '../../../components/data';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker
import { format, parse } from 'date-fns'; // Import date-fns for date parsing and formatting
import UserNavbar from '../../../components/UserNavbar';

const LOCAL_MACHINE_IP = 'http://192.168.239.197:8000'; 
const HOME_WIFI = 'http://192.168.10.218:8000';
const AWS_SERVER_URL = 'http://3.27.248.187:8000';
const GOOGLE_CLOUD_RUN_URL = 'https://petalscan-img-129264674726.asia-southeast1.run.app';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

export default function Notifications() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); // State for selected date
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false); // State for date picker visibility

  // Fetch events from the backend
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${GOOGLE_CLOUD_RUN_URL}/events/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      // Add a seen property to each event
      const eventsWithSeen = data.upcoming_events.map(event => ({ ...event, seen: false }));
      // Sort events by date in ascending order
      eventsWithSeen.sort((a, b) => new Date(a.date) - new Date(b.date));
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

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handler for notification click
  const handleNotificationClick = (index, link) => {
    // Mark the notification as seen
    const updatedEvents = [...events];
    updatedEvents[index].seen = true;
    setEvents(updatedEvents);

    // Update filtered events
    const updatedFilteredEvents = [...filteredEvents];
    updatedFilteredEvents[index].seen = true;
    setFilteredEvents(updatedFilteredEvents);

    // Open the link in the default browser
    Linking.openURL(link);
  };

  // Handler for search input change
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  };

  // Handler for date change
  const handleDateChange = (event, date) => {
    setIsDatePickerVisible(false); // Hide date picker after selecting a date
    if (date) {
      setSelectedDate(date);
      const filtered = events.filter(event =>
        parse(event.date, 'dd MMM yyyy', new Date()).toDateString() === date.toDateString()
      );
      setFilteredEvents(filtered);
    }
  };

  // Handler to clear the date filter
  const clearDateFilter = () => {
    setSelectedDate(new Date());
    setFilteredEvents(events);
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
              onChangeText={handleSearch}
            />
          </View>

          {/* Date Picker Button */}
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setIsDatePickerVisible(true)}>
            <Text style={styles.datePickerText}>Select Date</Text>
          </TouchableOpacity>

          {/* Date Picker Modal */}
          {isDatePickerVisible && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {/* Clear Filter Button */}
          <TouchableOpacity style={styles.clearFilterButton} onPress={clearDateFilter}>
            <Text style={styles.clearFilterText}>Clear Filter</Text>
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
                <Text style={styles.notificationDate}>{format(parse(event.date, 'dd MMM yyyy', new Date()), 'dd MMM yyyy')}</Text>
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
        <UserNavbar/>
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
    paddingHorizontal: viewportWidth * 0.05,
    paddingTop: viewportHeight * 0.03, 
    marginBottom: viewportHeight * 0.03,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 70, // Ensure content does not overlap with the Navibar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: viewportWidth * 0.75,
    height: viewportWidth * 0.75,
  },
  notificationContainer: {
    marginBottom: viewportHeight * 0.01,
    marginTop: viewportHeight * 0.02,
  },
  sectionTitle: {
    fontSize: viewportWidth * 0.06,
    fontWeight: 'bold',
    marginBottom: viewportHeight * 0.02,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F9',
    height: viewportHeight * 0.05, 
    width: viewportWidth * 0.9,
    borderRadius: 20,
    marginVertical: viewportHeight * 0.01,
    borderColor: '#cccccc',
    borderWidth: 1,
  },
  searchIcon: {
    width: viewportWidth * 0.04,
    height: viewportWidth * 0.04,
    marginLeft: viewportWidth * 0.05,
  },
  searchBar: {
    flex: 1,
    padding: viewportWidth * 0.02,
    fontSize: viewportWidth * 0.04,
  },
  datePickerButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#959595',
    borderWidth: 1,
    marginBottom: 20,
  },
  datePickerText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
  },
  clearFilterButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#959595',
    borderWidth: 1,
    marginBottom: 20,
  },
  clearFilterText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notificationItem: {
    padding: viewportWidth * 0.04,
    backgroundColor: '#f9f9f9',
    borderRadius: viewportWidth * 0.04,
    marginBottom: viewportHeight * 0.02,
    elevation: 2, // Adds shadow for Android
    shadowColor: '#000', // Adds shadow for iOS
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
    marginBottom: viewportHeight * 0.01,
  },
  smallNotification: {
    fontSize: viewportWidth * 0.03,
    color: '#888888',
    width: viewportWidth * 0.12, // Ensure enough width for the text
  },
  notificationDate: {
    fontSize: viewportWidth * 0.03,
    color: '#888888',
  },
  notificationContent: {
    marginBottom: viewportHeight * 0.01,
  },
  notificationTitle: {
    fontSize: viewportWidth * 0.045,
    fontWeight: 'bold',
    marginBottom: viewportHeight * 0.01,
  },
  notificationDescription: {
    fontSize: viewportWidth * 0.035,
    color: '#333333',
  },
  navibarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});