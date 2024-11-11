import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { StyleSheet, Dimensions } from "react-native";
import { TouchableOpacity } from "react-native";
import { Image } from "react-native";
import { Button, View, Text, Linking } from "react-native";
import { useRouter } from "expo-router";
import images from "./data";

const Stack = createStackNavigator();
const { width, height } = Dimensions.get("window");

function UserNavbar() {
  const router = useRouter();

  const openMaps = () => {
    const url = "https://www.google.com/maps/@1.3138,103.8159,15z"; // Coordinates of Singapore Botanic Gardens
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred", err)
    );
  };

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => router.push("/home")}>
        <View style={styles.navItem}>
          <Image source={images.homeIcon} style={styles.icon} />
          <Text style={styles.label}>Home</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => router.push("home/notifications")}
      >
        <View style={styles.navItem}>
          <Image source={images.notifcationIcon} style={styles.icon} />
          <Text style={styles.label}>News</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => router.push("/home/camerascreen")}
      >
        <View style={styles.navItem}>
          <Image source={images.scanIcon} style={styles.icon} />
          <Text style={styles.label}>Scan</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} onPress={openMaps}>
        <View style={styles.navItem}>
          <Image source={images.mapsIcon} style={styles.icon} />
          <Text style={styles.label}>Maps</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => {
          router.push("/home/profile");
        }}
      >
        <View style={styles.navItem}>
          <Image source={images.profileIcon} style={styles.icon} />
          <Text style={styles.label}>Profile</Text>
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
    paddingVertical: height * 0.015, // Responsive vertical padding
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: width,
  },
  navItem: {
    alignItems: "center",
  },
  icon: {
    width: width * 0.06, // Responsive icon size
    height: width * 0.06,
    tintColor: "#676D75", // Grey icon color
  },
  label: {
    borderWidth: 1,
    borderColor: "#1c1c1c",
    marginTop: height * 0.005, // Responsive margin top
    fontSize: width * 0.03, // Responsive font size
    color: "#ffffff",
  },
});

export default UserNavbar;
