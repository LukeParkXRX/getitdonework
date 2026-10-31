import type { AudioCaptureOptions, RoomOptions } from "livekit-client";

export const MEETING_AUDIO_CAPTURE: AudioCaptureOptions = {
  deviceId: { ideal: "default" },
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  voiceIsolation: true,
  channelCount: { ideal: 1 },
  sampleRate: { ideal: 48_000 },
  sampleSize: { ideal: 16 },
};

export const MEETING_ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  audioCaptureDefaults: MEETING_AUDIO_CAPTURE,
  publishDefaults: {
    audioPreset: { maxBitrate: 64_000 },
    dtx: false,
    red: true,
    forceStereo: false,
    stopMicTrackOnMute: false,
  },
};
