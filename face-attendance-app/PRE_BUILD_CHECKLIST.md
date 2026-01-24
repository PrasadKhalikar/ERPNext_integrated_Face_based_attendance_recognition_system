# Pre-Build Checklist ✅

## Configuration Files

### ✅ app.json
- [x] App name: "ATPL Attendance" (correct capitalization)
- [x] Icon: `./assets/icon.png` (set for Android)
- [x] `expo.extra.API_URL`: "https://face.infoprosys.co.in" (correctly placed)
- [x] `expo.eas.projectId`: Present and correct
- [x] Android permissions: ["INTERNET"] (required for network calls)
- [x] Android package name: Set correctly
- [x] `usesCleartextTraffic`: true (allows HTTP if needed, but API uses HTTPS)

### ✅ utils/config.js
- [x] Uses `expo-constants` (works in APK builds)
- [x] Reads from `Constants.expoConfig?.extra` (SDK 54 compatible)
- [x] Has fallback to `Constants.manifest?.extra` (backward compatibility)
- [x] Has hardcoded fallback URL (safety net)
- [x] Removes trailing slashes from API URL
- [x] Includes debug logging for troubleshooting

### ✅ package.json
- [x] `expo-constants`: "~18.0.10" (explicitly included)
- [x] `axios`: "^1.13.2" (for API calls)
- [x] All other dependencies present

### ✅ eas.json
- [x] Preview profile configured
- [x] Distribution: "internal"

## Network Configuration

### ✅ API URL
- URL: `https://face.infoprosys.co.in`
- Protocol: HTTPS (secure)
- Format: No trailing slash (handled in config.js)
- Access: Via `expo-constants` from `app.json`

### ✅ Android Network
- INTERNET permission: ✅ Added
- Cleartext traffic: ✅ Enabled (for flexibility)
- HTTPS: ✅ API uses HTTPS (secure)

## Code Usage

### ✅ API Calls
1. **RecognizeScreen.js**: 
   - Uses: `${API}/recognize`
   - Method: POST with axios
   - ✅ Correctly imported from config

2. **RegisterScreen.js**: 
   - Uses: `${API}/register_multiple`
   - Method: POST with fetch
   - ✅ Correctly imported from config

3. **LoginScreen.js**: 
   - Uses ERPNext API (different, user-provided URL)
   - ✅ Not affected by API_URL config

## Potential Issues & Solutions

### ✅ Fixed Issues
1. **Network Error in APK**: 
   - ❌ Old: Used `@env` (doesn't work in APK)
   - ✅ New: Uses `expo-constants` (works in APK)

2. **API URL Format**:
   - ✅ Trailing slash handling added
   - ✅ Debug logging added

3. **app.json Structure**:
   - ✅ `eas` section at correct level (not in `extra`)
   - ✅ `API_URL` in `extra` section

### ⚠️ Things to Monitor After Build

1. **Check Console Logs**:
   - Look for "=== API Configuration ===" in device logs
   - Verify API URL is correctly loaded
   - Check if `Constants.expoConfig?.extra` is populated

2. **Network Errors**:
   - If "Network Error" appears, check:
     - Device internet connection
     - API server is accessible
     - SSL certificate is valid
     - API URL in logs matches expected value

3. **API Endpoints**:
   - Verify `${API}/recognize` resolves correctly
   - Verify `${API}/register_multiple` resolves correctly

## Build Readiness

### ✅ Ready for Build
- All configuration files are correct
- API URL is properly configured
- Network permissions are set
- Code uses correct import method
- Debug logging is in place

### 📝 Build Command
```powershell
# Clear proxy (if needed)
$env:HTTP_PROXY = $null
$env:HTTPS_PROXY = $null

# Build
eas build --platform android --profile preview
```

## Post-Build Testing

1. Install APK on device
2. Check console logs for API configuration
3. Test login (ERPNext API - should work)
4. Test employee list (ERPNext API - should work)
5. Test face recognition (`${API}/recognize` - should work now)
6. Test registration (`${API}/register_multiple` - should work now)

## Expected Behavior

- ✅ App name: "ATPL Attendance"
- ✅ Icon: Custom icon from assets
- ✅ API calls to `https://face.infoprosys.co.in` work
- ✅ No "Network Error" for custom backend calls
- ✅ Console shows API URL in logs
