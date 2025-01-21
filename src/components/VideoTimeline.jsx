// VideoTimeline.jsx
import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";

const VideoTimeline = ({
  duration = 0,
  currentTime = 0,
  isPlaying = false,
  onTimeUpdate,
  onPlayPause,
}) => {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);

  const timeToPercent = (time) => {
    if (!duration || duration === 0) return 0;
    return (time / duration) * 100;
  };

  const getTimeFromMousePosition = (e) => {
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    return (x / rect.width) * duration;
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsDragging(true);
      updateTimeFromMouse(e);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateTimeFromMouse(e);
    }
    updateHoverTime(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setIsDragging(false);
  };

  const updateTimeFromMouse = (e) => {
    const time = getTimeFromMousePosition(e);
    onTimeUpdate(time);
  };

  const updateHoverTime = (e) => {
    const time = getTimeFromMousePosition(e);
    setHoverTime(time);
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const ms = Math.floor((timeInSeconds % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  const moveBackward = () => {
    onTimeUpdate(Math.max(0, currentTime - 1));
  };

  const moveForward = () => {
    onTimeUpdate(Math.min(duration, currentTime + 1));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={moveBackward}
            className="p-1 rounded hover:bg-gray-100"
            title="Back 1s (←)"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onPlayPause}
            className="p-1 rounded hover:bg-gray-100"
            title="Play/Pause (Space)"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={moveForward}
            className="p-1 rounded hover:bg-gray-100"
            title="Forward 1s (→)"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="text-sm text-gray-600 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative h-6 bg-gray-100 rounded cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Progress bar */}
        <div
          className="absolute h-full bg-blue-100 rounded-l transition-[width] duration-100"
          style={{ width: `${timeToPercent(currentTime)}%` }}
        />

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 transition-transform duration-100"
          style={{ left: `${timeToPercent(currentTime)}%` }}
        />

        {/* Hover time indicator */}
        {hoverTime !== null && (
          <div
            className="absolute -top-7 px-2 py-0.5 bg-black/75 text-white text-xs rounded transform -translate-x-1/2"
            style={{ left: `${timeToPercent(hoverTime)}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoTimeline;
