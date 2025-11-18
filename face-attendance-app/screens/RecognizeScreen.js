import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import axios from "axios";
import { API } from "../utils/config";


import { getGPS } from "../utils/location";
import { captureBase64 } from "../utils/camera";
import { playPunchAudio } from "../utils/audio";
console.log("API from util =>", API);

export default function RecognizeScreen({ route }) {
  const { site_id } = route.params;
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [splash, setSplash] = useState(null);
  const [cooldown, setCooldown] = useState(false);

  // Animation for splash
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  if (!permission?.granted) {
    return (
      <View style={styles.permissionWrapper}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Universal scanning
  async function performScan() {
    if (loading || cooldown) return;

    setCooldown(true);

    const img = await captureBase64(cameraRef);
    if (!img) {
      setCooldown(false);
      return;
    }

    const loc = await getGPS();
    if (!loc) {
      Alert.alert("GPS Error", "Unable to fetch GPS location.");
      setCooldown(false);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API}/recognize`, {
        site_id,
        image: img,
        latitude: loc.latitude,
        longitude: loc.longitude,
        device_id: "OFFICE-DEVICE",
      });

      if (res.data.success) {
        playPunchAudio(res.data.log_type);

        // Store splash data including selfie
        setSplash({
          ...res.data,
          selfie: img,
        });

        // Start fade animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Hide splash after delay
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setSplash(null));
        }, 2500);
      } else {
        Alert.alert("Not Recognized", res.data.error);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }

    setLoading(false);

    // Avoid rapid auto triggers
    setTimeout(() => setCooldown(false), 2000);
  }

  return (
    <View style={styles.wrapper}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        onFacesDetected={({ faces }) => {
          if (faces.length > 0 && !loading) performScan();
        }}
        faceDetectorSettings={{
          mode: "fast",
          detectLandmarks: "none",
          runClassifications: "none",
        }}
      />

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={{ color: "#fff", marginTop: 10 }}>Processing…</Text>
        </View>
      )}

      {/* ✨ Professional Splash UI */}
      {splash && (
        <Animated.View style={[styles.splash, { opacity: fadeAnim }]}>
          <View style={styles.splashCircle}>
            <Image source={{ uri: splash.selfie }} style={styles.splashPhoto} />
          </View>

          <Text style={styles.splashTitle}>
            {splash.log_type === "IN" ? "✔ PUNCHED IN" : "✔ PUNCHED OUT"}
          </Text>

          <Text style={styles.employeeName}>{splash.employee_name}</Text>
          <Text style={styles.employeeId}>{splash.employee_id}</Text>
        </Animated.View>
      )}

      {/* Manual scan button */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.manualBtn} onPress={performScan}>
          <Text style={styles.manualBtnText}></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },

  permissionWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  permissionText: {
    fontSize: 20,
    marginBottom: 15,
    color: "#fff",
  },

  btn: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 12,
  },

  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  overlay: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    alignItems: "center",
  },

  /* --- Professional Splash UI --- */
  splash: {
    position: "absolute",
    top: "28%",
    alignSelf: "center",
    alignItems: "center",
    padding: 25,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#00ff88",
    width: "70%",
  },

  splashCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#00ff88",
    marginBottom: 15,
  },

  splashPhoto: { width: "100%", height: "100%" },

  splashTitle: {
    color: "#00ff88",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },

  employeeName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 5,
  },

  employeeId: {
    color: "#aaa",
    fontSize: 17,
    fontWeight: "600",
  },

  bottomControls: {
    position: "absolute",
    bottom: 35,
    width: "100%",
    alignItems: "center",
  },

  manualBtn: {
    backgroundColor: "#dcebf2ff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 40,
  },

  manualBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
});
