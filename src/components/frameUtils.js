// frameUtils.js

// Standard frame rate for video playback
export const DEFAULT_FPS = 30;

export const timeToFrame = (timeInSeconds, fps = DEFAULT_FPS) => {
  return Math.floor(timeInSeconds * fps);
};

export const frameToTime = (frame, fps = DEFAULT_FPS) => {
  return frame / fps;
};

export const formatFrame = (frame) => {
  return frame.toString().padStart(5, "0");
};

// Helper to ensure frame is within valid range
export const clampFrame = (frame, totalFrames) => {
  return Math.max(0, Math.min(frame, totalFrames - 1));
};

// Convert duration to total frames
export const durationToTotalFrames = (durationInSeconds, fps = DEFAULT_FPS) => {
  return Math.floor(durationInSeconds * fps);
};
