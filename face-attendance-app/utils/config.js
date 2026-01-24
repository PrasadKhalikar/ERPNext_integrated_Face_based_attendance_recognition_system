// utils/config.js
import Constants from "expo-constants";
import { API_URL as ENV_API_URL } from "@env"; // may be undefined in production

// Try (1) the @env value, (2) expo extra (runtime), (3) fallback to a hard-coded default
const expoExtra =
  (Constants.expoConfig && Constants.expoConfig.extra) ||
  (Constants.manifest && Constants.manifest.extra) ||
  {};

export const API = ENV_API_URL || expoExtra.API_URL || "https://face.infoprosys.co.in";

console.log("API from util =>", API);
