import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";

import LoginScreen from "./screens/LoginScreen";
import EmployeeListScreen from "./screens/EmployeeListScreen";
import RegisterScreen from "./screens/RegisterScreen";
import RecognizeScreen from "./screens/RecognizeScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />

        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Recognize" component={RecognizeScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
