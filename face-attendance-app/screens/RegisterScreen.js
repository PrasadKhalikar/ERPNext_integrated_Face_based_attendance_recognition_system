import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import { CameraView } from "expo-camera";
import axios from "axios";
import { API } from "../utils/config";

import { captureBase64 } from "../utils/camera";

export default function RegisterScreen({ route, navigation }) {
  const { employee, site_id } = route.params;
  const cameraRef = useRef(null);

  const MAX = 5;
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

 async function takePhoto() {
  const base64 = await captureBase64(cameraRef);
  if (!base64) return;

  const newImages = [...images, base64];
  setImages(newImages);
  setIndex(newImages.length);  // counter is always correct

  // Auto-submit when max reached
  if (newImages.length === MAX) {
    submit();
  }
}


  async function submit() {
    setLoading(true);

    try {
      const payload = {
        site_id,
        employee_id: employee.name,
        employee_name: employee.employee_name,
        images,
      };

      const res = await axios.post(`${API}/register_multiple`, payload);

      if (res.data.success) {
        Alert.alert("Success", "Employee registered!");
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Top header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Register {employee.employee_name}</Text>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>{index}/{MAX}</Text>
        </View>
      </View>

      {/* Camera */}
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />

      {/* Thumbnails */}
      <ScrollView
        horizontal
        style={styles.thumbScroll}
        contentContainerStyle={{ paddingHorizontal: 15 }}
      >
        {images.map((img, i) => (
          <Image key={i} source={{ uri: img }} style={styles.thumb} />
        ))}
      </ScrollView>

      {/* Capture area */}
      <View style={styles.captureArea}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto} />
        )}
      </View>

      {/* Finish button if all 5 clicked */}
      {images.length === MAX && (
        <TouchableOpacity style={styles.finishBtn} onPress={submit}>
          <Text style={styles.finishText}>Finish Registration</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#150404ff",
    marginTop:10,
  },

  backBtn: { paddingRight: 10 },
  backTxt: { color: "#fff", fontSize: 28 },

  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },

  counterBadge: {
    backgroundColor: "#ffffff55",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },

  counterText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Camera
  camera: { flex: 1 },

  // Thumbnails
  thumbScroll: {
    position: "absolute",
    bottom: 170,
  },

  thumb: {
    width: 65,
    height: 65,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },

  // Capture circle button
  captureArea: {
    position: "absolute",
    bottom: 70,
    width: "100%",
    alignItems: "center",
  },

  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    borderWidth: 5,
    borderColor: "#e0e0e0",
  },

  // Finish button
  finishBtn: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom:30,
  },

  finishText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});