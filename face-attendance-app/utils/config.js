// utils/config.js
import Constants from "expo-constants";

// Get API_URL from expo-constants (app.json extra)
// This works in both Expo Go and standalone builds
const getApiUrl = () => {
  // For Expo SDK 54, use Constants.expoConfig.extra
  const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
  const apiUrl = extra.API_URL || "https://face.infoprosys.co.in";
  
  // Remove trailing slash if present
  return apiUrl.replace(/\/+$/, "");
};

export const API = getApiUrl();

// Debug logging (helps identify issues in APK)
console.log("=== API Configuration ===");
console.log("API URL:", API);
console.log("Constants.expoConfig?.extra:", Constants.expoConfig?.extra);
console.log("Constants.manifest?.extra:", Constants.manifest?.extra);
console.log("=========================");
