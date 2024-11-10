// ErrorComponent.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

const ErrorComponent = ({ errorMessage }) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../assets/animations/errorAnimation.json")}
        autoPlay
        loop={false}
        style={styles.lottie}
      />
      <Text style={styles.errorText}>{errorMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: 100,
    height: 100,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginTop: 10,
  },
});

export default ErrorComponent;
