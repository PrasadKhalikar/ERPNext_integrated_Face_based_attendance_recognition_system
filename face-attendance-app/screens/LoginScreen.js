import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import axios from "axios";
import { save } from "../utils/storage";

export default function LoginScreen({ navigation }) {
  const [erpUrl, setErpUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // 🔧 Auto-fix URL (add https:// if missing)
  function normalizeUrl(url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return "https://" + url; // default to https
    }
    return url;
  }

  async function login() {
    if (!erpUrl || !apiKey || !apiSecret || !adminPin || !confirmPin) {
      return Alert.alert("Missing Fields", "Please enter all fields.");
    }

    if (adminPin !== confirmPin) {
      return Alert.alert("PIN Error", "Admin PINs do not match.");
    }

    const finalUrl = normalizeUrl(erpUrl);

    try {
      const res = await axios.get(
        `${finalUrl}/api/method/frappe.auth.get_logged_user`,
        { headers: { Authorization: `token ${apiKey}:${apiSecret}` } }
      );

      const user = res.data.message;

      const site_id = finalUrl
        .replace("https://", "")
        .replace("http://", "")
        .replace(/\//g, "");

      await save("session", {
        erpUrl: finalUrl,
        apiKey,
        apiSecret,
        site_id,
        adminPin,
        user
      });

      navigation.replace("Home", {
        erpUrl: finalUrl,
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.wrapper}>
        <Text style={styles.title}>Admin Login</Text>

        <TextInput
          style={styles.input}
          placeholder="ERPNext URL (example: erp.mysite.com)"
          autoCapitalize="none"
          onChangeText={setErpUrl}
        />

        <TextInput
          style={styles.input}
          placeholder="API Key"
          autoCapitalize="none"
          onChangeText={setApiKey}
        />

        <TextInput
          style={styles.input}
          placeholder="API Secret"
          secureTextEntry
          autoCapitalize="none"
          onChangeText={setApiSecret}
        />

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

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    padding: 30,
    paddingTop: 60,
  },

  title: { 
    fontSize: 32, 
    fontWeight: "800", 
    marginBottom: 30 
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 25,
    fontSize: 15
  },

  btn: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 150
  },

  btnText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 17 
  }
});
