import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import EmployeeListScreen from "./screens/EmployeeListScreen";
import RegisterScreen from "./screens/RegisterScreen";
import RecognizeScreen from "./screens/RecognizeScreen";
import { load } from "./utils/storage";

const Stack = createNativeStackNavigator();
console.log("API_URL from env =>", process.env.API_URL);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Login");

  useEffect(() => {
    // Check for existing session on app startup
    (async () => {
      try {
        const session = await load("session");
        if (session && session.erpUrl && session.apiKey && session.apiSecret) {
          // Session exists, navigate to Home
          setInitialRoute("Home");
        } else {
          // No session, show Login
          setInitialRoute("Login");
        }
      } catch (error) {
        console.log("Error loading session:", error);
        setInitialRoute("Login");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    // Show loading screen while checking session
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Recognize" component={RecognizeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
