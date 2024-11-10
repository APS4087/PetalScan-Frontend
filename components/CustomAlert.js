import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

const CustomAlert = ({ visible, message, onClose }) => {
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LottieView
            source={require("../assets/animations/errorAnimation.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "#e0f7fa", // Light cyan background for a nature theme
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00796b", // Dark teal border for a nature theme
  },
  lottie: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#004d40", // Dark teal text color for a nature theme
  },
  modalButton: {
    backgroundColor: "#00796b", // Dark teal button background for a nature theme
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    width: 25,
    //borderWidth: 1,
  },
});

export default CustomAlert;
