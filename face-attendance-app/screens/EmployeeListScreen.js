import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  SafeAreaView 
} from "react-native";
import axios from "axios";
import { load } from "../utils/storage";

export default function EmployeeListScreen({ navigation }) {
  const [session, setSession] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    (async () => {
      const s = await load("session");
      setSession(s);
      if (s) {
        loadEmployees(s);
      }
    })();
  }, []);

  async function loadEmployees(s) {
    try {
      const res = await axios.get(
        `${s.erpUrl}/api/resource/Employee?fields=["name","employee_name"]`,
        { headers: { Authorization: `token ${s.apiKey}:${s.apiSecret}` } }
      );
      setEmployees(res.data.data);
    } catch (err) {
      console.log("Error fetching employees:", err.message);
    }
  }

  if (!session) {
    return (
      <View style={styles.wrapper}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Employees ({employees.length})</Text>
      </View>

      {/* List */}
      <ScrollView style={{ flex: 1 }}>
        {employees.map((emp) => (
          <TouchableOpacity
            key={emp.name}
            style={styles.empRow}
            onPress={() =>
              navigation.navigate("Register", {
                employee: emp,
                site_id: session.site_id
              })
            }
          >
            <Text style={styles.empName}>{emp.employee_name}</Text>
            <Text style={styles.empID}>{emp.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recognition Button */}
      <TouchableOpacity
        style={styles.recBtn}
        onPress={() => navigation.navigate("Recognize", { site_id: session.site_id })}
      >
        <Text style={styles.recText}>Open Recognition</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 10,
    marginTop: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
  },

  empRow: {
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  empName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
  },

  empID: {
    color: "#666",
    marginTop: 3,
  },

  recBtn: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 20,
    marginBottom: 50,
  },

  recText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
});
