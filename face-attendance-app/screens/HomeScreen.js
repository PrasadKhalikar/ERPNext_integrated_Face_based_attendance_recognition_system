import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { load } from "../utils/storage";

export default function HomeScreen({ navigation }) {
  const [session, setSession] = useState(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [enteredPIN, setEnteredPIN] = useState("");

  useEffect(() => {
    (async () => {
      const saved = await load("session");
      setSession(saved);
    })();
  }, []);

  async function openAdminPanel() {
    if (!session?.adminPin) {
      return Alert.alert("Error", "Admin PIN missing. Login again.");
    }
    setPinModalVisible(true);
  }

  async function validatePIN() {
    if (enteredPIN === session.adminPin) {
      setPinModalVisible(false);
      setEnteredPIN("");
      navigation.navigate("EmployeeList");
    } else {
      Alert.alert("Incorrect PIN", "Try again.");
    }
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Attendance</Text>

      <TouchableOpacity style={styles.adminButton} onPress={openAdminPanel}>
        <Text style={styles.btnText}>Admin Panel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.attendButton}
        onPress={() => navigation.navigate("Recognize", { site_id: session.site_id })}
      >
        <Text style={styles.btnText}>Attendance</Text>
      </TouchableOpacity>

      <Modal transparent visible={pinModalVisible} animationType="fade">
        <View style={styles.modalWrapper}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter Admin PIN</Text>

            <TextInput
              style={styles.pinInput}
              secureTextEntry
              value={enteredPIN}
              onChangeText={setEnteredPIN}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="••••••"
              placeholderTextColor="#888"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.okBtn} onPress={validatePIN}>
                <Text style={styles.okText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 40,
  },

  adminButton: {
    width: "100%",
    backgroundColor: "#1e88e5",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  attendButton: {
    width: "100%",
    backgroundColor: "#43a047",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 15,
  },

  pinInput: {
    width: "75%",
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "75%",
  },

  cancelBtn: {
    backgroundColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  okBtn: {
    backgroundColor: "#1e88e5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  cancelText: { color: "#333", fontSize: 16, fontWeight: "700" },
  okText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
