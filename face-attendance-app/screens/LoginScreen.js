import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from "react-native";
import axios from "axios";
import { save } from "../utils/storage";

export default function LoginScreen({ navigation }) {
  const [erpUrl, setErpUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  async function login() {
    if (!erpUrl || !apiKey || !apiSecret || !adminPin || !confirmPin) {
      return Alert.alert("Missing Fields", "Please enter all fields.");
    }

    if (adminPin !== confirmPin) {
      return Alert.alert("PIN Error", "Admin PINs do not match.");
    }

    try {
      const res = await axios.get(
        `${erpUrl}/api/method/frappe.auth.get_logged_user`,
        { headers: { Authorization: `token ${apiKey}:${apiSecret}` } }
      );

      const user = res.data.message;

      const site_id = erpUrl
        .replace("https://", "")
        .replace("http://", "")
        .replace(/\//g, "");

      await save("session", {
        erpUrl,
        apiKey,
        apiSecret,
        site_id,
        adminPin,   // 🔐 save admin PIN
        user
      });

      navigation.replace("Home", {
        erpUrl,
        apiKey,
        apiSecret,
        site_id,
        adminPin,
        user
      });

    } catch (err) {
      Alert.alert("Login Failed", err.message);
    }
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Admin Login</Text>

      <TextInput
        style={styles.input}
        placeholder="ERPNext URL"
        onChangeText={setErpUrl}
      />
      <TextInput
        style={styles.input}
        placeholder="API Key"
        onChangeText={setApiKey}
      />
      <TextInput
        style={styles.input}
        placeholder="API Secret"
        secureTextEntry
        onChangeText={setApiSecret}
      />

      {/* NEW ADMIN PIN FIELDS */}
      <TextInput
        style={styles.input}
        placeholder="Set Admin PIN"
        secureTextEntry
        keyboardType="numeric"
        onChangeText={setAdminPin}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Admin PIN"
        secureTextEntry
        keyboardType="numeric"
        onChangeText={setConfirmPin}
      />

      <TouchableOpacity style={styles.btn} onPress={login}>
        <Text style={styles.btnText}>Save & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, padding: 30, justifyContent: "center" },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 20 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15
  },

  btn: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 }
});