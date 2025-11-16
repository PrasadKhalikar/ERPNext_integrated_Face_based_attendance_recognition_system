import { Audio } from "expo-av";

export async function playPunchAudio(type) {
  try {
    const file =
      type === "IN"
        ? require("../assets/punch_in.mp3")
        : require("../assets/punch_out.mp3");

    const sound = new Audio.Sound();

    await sound.loadAsync(file, { shouldPlay: true });

    // Auto cleanup
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });

  } catch (err) {
    console.log("Audio error:", err.message);
  }
}
