import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Volume,
  Settings,
  RotateCcw,
  RotateCw,
} from "lucide-react";

const VideoPlayer = ({
  videoSrc,
  currentTime,
  isPlaying,
  volume = 1,
  playbackRate = 1,
  onTimeUpdate,
  onDurationChange,
  onPlayPause,
  onVolumeChange,
  onPlaybackRateChange,
  onMetadataLoaded,
}) => {
  const videoRef = useRef(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaybackRates, setShowPlaybackRates] = useState(false);
  const timeUpdateRef = useRef(null);
  const lastUpdateTime = useRef(0);

  const updateTime = useCallback(() => {
    if (!videoRef.current) return;

    const now = performance.now();
    // Only update if more than 16ms (60fps) has passed
    if (now - lastUpdateTime.current >= 16) {
      onTimeUpdate(videoRef.current.currentTime);
      lastUpdateTime.current = now;
    }

    if (isPlaying) {
      timeUpdateRef.current = requestAnimationFrame(updateTime);
    }
  }, [isPlaying, onTimeUpdate]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }

    if (isPlaying) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
      timeUpdateRef.current = requestAnimationFrame(updateTime);
    } else {
      videoRef.current.pause();
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
    }

    return () => {
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
    };
  }, [currentTime, isPlaying, updateTime]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    onDurationChange(videoRef.current.duration);

    // Try to detect frame rate from video
    const videoTrack = videoRef.current.captureStream().getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      if (settings.frameRate) {
        onMetadataLoaded(settings.frameRate);
      }
    }
  };

  const VolumeIcon = () => {
    if (volume === 0) return <VolumeX size={16} />;
    if (volume < 0.3) return <Volume size={16} />;
    if (volume < 0.7) return <Volume1 size={16} />;
    return <Volume2 size={16} />;
  };

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const handleJumpBackward = () => {
    const newTime = Math.max(0, currentTime - 5);
    onTimeUpdate(newTime);
  };

  const handleJumpForward = () => {
    const newTime = Math.min(videoRef.current?.duration || 0, currentTime + 5);
    onTimeUpdate(newTime);
  };

  return (
    <div className="relative w-full h-full group">
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-contain bg-black"
        onLoadedMetadata={handleLoadedMetadata}
        playsInline
      />

      {/* Video controls overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div className="flex items-center gap-4 text-white">
          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Jump backward */}
          <button
            onClick={handleJumpBackward}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Jump back 5s"
          >
            <RotateCcw size={16} />
          </button>

          {/* Jump forward */}
          <button
            onClick={handleJumpForward}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Jump forward 5s"
          >
            <RotateCw size={16} />
          </button>

          {/* Volume control */}
          <div className="relative flex items-center group">
            <button
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              title="Volume"
            >
              <VolumeIcon />
            </button>
            {showVolumeSlider && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-black/75 rounded shadow-lg">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-24 h-1 accent-white"
                />
              </div>
            )}
          </div>

          {/* Playback rate control */}
          <div className="relative">
            <button
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              onClick={() => setShowPlaybackRates(!showPlaybackRates)}
              title="Playback speed"
            >
              <Settings size={16} />
            </button>
            {showPlaybackRates && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-black/75 rounded shadow-lg">
                <div className="flex flex-col gap-1 min-w-[100px]">
                  {playbackRates.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onPlaybackRateChange(rate);
                        setShowPlaybackRates(false);
                      }}
                      className={`px-3 py-1 text-sm rounded hover:bg-white/20 text-left ${
                        playbackRate === rate ? "bg-white/20" : ""
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click to play/pause */}
      <div className="absolute inset-0 cursor-pointer" onClick={onPlayPause} />
    </div>
  );
};

export default VideoPlayer;
