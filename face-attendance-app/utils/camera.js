export async function captureBase64(cameraRef) {
  try {
    const photo = await cameraRef.current.takePictureAsync({
      base64: true,
      quality: 0.7,
      isImageMirror: true,   // 🔥 Mirror selfie photo
    });

    return "data:image/jpeg;base64," + photo.base64;
  } catch (err) {
    console.log("Camera error:", err.message);
    return null;
  }
}
