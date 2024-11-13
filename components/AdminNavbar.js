import React from "react";
import { View, TouchableOpacity, StyleSheet, Image, Text } from "react-native";
import { useRouter } from "expo-router";
import images from "./data";

function AdminNavbar({ navigation }) {
  const router = useRouter();
  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => router.push("/adminHome")}>
        <View style={styles.navItem}>
          <Image source={images.homeIcon} style={styles.icon} />
          <Text style={styles.label}>Home</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/adminHome/data")}>
        <View style={styles.navItem}>
          <Image source={images.mapsIcon} style={styles.icon} />
          <Text style={styles.label}>Data</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/adminHome/notification")}>
        <View style={styles.navItem}>
          <Image source={images.notificationIcon} style={styles.icon} />
          <Text style={styles.label}>News</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/adminHome/users")}>
        <View style={styles.navItem}>
          <Image source={images.profileIcon} style={styles.icon} />
          <Text style={styles.label}>User</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1c1c1c",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  navItem: {
    alignItems: "center",
  },
  icon: {
    width: 24, // Size of the icons
    height: 24,
    tintColor: "#676D75",
  },
  label: {
    marginTop: 5,
    fontSize: 12,
    color: "#ffffff",
  },
});

export default AdminNavbar;
