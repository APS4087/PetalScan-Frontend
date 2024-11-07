import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import images from '../../../components/data';

const LOCAL_MACHINE_IP = 'http://192.168.239.197:8000'; 
const HOME_WIFI = 'http://192.168.10.218:8000';
const AWS_SERVER_URL = 'http://3.27.248.187:8000';
const GOOGLE_CLOUD_RUN_URL = 'https://petalscan-img-129264674726.asia-southeast1.run.app';

export default function Notifications() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  // Fetch events from the backend
  useEffect(() => {
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
        setEvents(eventsWithSeen || []); // Ensure events is always an array
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]); // Set events to an empty array on error
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

    // Open the link in the default browser
    Linking.openURL(link);
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
    <ScrollView style={styles.container}>
      {/* Back button to navigate to the previous screen */}
      <TouchableOpacity style={styles.logo} onPress={() => router.back()}>
        <Image source={images.backArrowIcon} style={styles.arrow} />
      </TouchableOpacity>

      <View style={styles.notificationContainer}>
        <Text style={styles.sectionTitle}>Latest Notifications</Text>
        {events.map((event, index) => (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 30, 
    marginBottom: 30,
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
  notificationContainer: {
    marginBottom: 10,
    marginTop: 20,
  },
  logo: {
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  arrow: {
    height: '100%',
    width: '100%',
    resizeMode: 'contain',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  notificationItem: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#333333',
  },
});