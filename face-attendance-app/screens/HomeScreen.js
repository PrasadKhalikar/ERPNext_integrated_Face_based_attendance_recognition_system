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
import { load, remove } from "../utils/storage";

export default function HomeScreen({ navigation }) {
  const [session, setSession] = useState(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [enteredPIN, setEnteredPIN] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

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

  async function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await remove("session");
              setMenuVisible(false);
              navigation.replace("Login");
            } catch (error) {
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
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
      {/* Header with menu button */}
      <View style={styles.header}>
        <Text style={styles.title}>Face Attendance</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.adminButton} onPress={openAdminPanel}>
        <Text style={styles.btnText}>Admin Panel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.attendButton}
        onPress={() => navigation.navigate("Recognize", { site_id: session.site_id })}
      >
        <Text style={styles.btnText}>Attendance</Text>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={styles.modalWrapper}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer} onStartShouldSetResponder={() => true}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
            >
              <Text style={styles.menuItemText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PIN Modal */}
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

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 50,
    paddingBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 40,
  },

  menuButton: {
    padding: 10,
    marginTop: -20,
  },

  menuIcon: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },

  menuContainer: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  menuItemText: {
    fontSize: 16,
    color: "#d32f2f",
    fontWeight: "600",
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
