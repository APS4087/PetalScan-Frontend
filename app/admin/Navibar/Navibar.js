import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text } from 'react-native';

function Navibar({ navigation }) {
  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <View style={styles.navItem}>
          <Image
            source={require('../../../assets/Icons/home.png')}
            style={styles.icon}
          />
          <Text style={styles.label}>Home</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Database')}>
        <View style={styles.navItem}>
          <Image
            source={require('../../../assets/Icons/maps.png')} // Replace with actual icon
            style={styles.icon}
          />
          <Text style={styles.label}>Database</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
        <View style={styles.navItem}>
          <Image
            source={require('../../../assets/Icons/notification.png')}
            style={styles.icon}
          />
          <Text style={styles.label}>Notification</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('User')}>
        <View style={styles.navItem}>
          <Image
            source={require('../../../assets/Icons/profile.png')}
            style={styles.icon}
          />
          <Text style={styles.label}>User</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1c1c1c', // Dark background color like in the screenshot
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    alignItems: 'center',
  },
  icon: {
    width: 24, // Size of the icons
    height: 24,
    tintColor: '#676D75', // White icon color to match the screenshot
  },
  label: {
    marginTop: 5,
    fontSize: 12,
    color: '#ffffff', // White text color to match the screenshot
  },
});

export default Navibar;