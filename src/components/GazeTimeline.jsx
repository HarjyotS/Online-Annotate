// GazeTimeline.jsx
import React, { useRef, useState, useEffect } from "react";

const GazeTimeline = ({
  duration = 0,
  currentTime = 0,
  intervals = [],
  isRecording = false,
  recordingStartTime = null,
  onTimeUpdate,
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
    const time = getTimeFromMousePosition(e);
    setHoverTime(time);
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

  return (
    <div
      ref={timelineRef}
      className="relative h-8 bg-gray-50 rounded cursor-pointer select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Completed intervals */}
      {intervals.map((interval, index) => (
        <React.Fragment key={index}>
          {/* Interval line */}
          <div
            className="absolute top-1/2 h-0.5 bg-black transition-[width] duration-100"
            style={{
              left: `${timeToPercent(interval.start)}%`,
              width: `${timeToPercent(interval.end - interval.start)}%`,
              transform: "translateY(-50%)",
            }}
          />
          {/* End markers */}
          <div
            className="absolute top-1/2 w-1.5 h-1.5 bg-red-500 rounded-full"
            style={{
              left: `${timeToPercent(interval.end)}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </React.Fragment>
      ))}

      {/* Active recording interval */}
      {isRecording && recordingStartTime !== null && (
        <React.Fragment>
          <div
            className="absolute top-1/2 h-0.5 bg-black transition-[width] duration-100"
            style={{
              left: `${timeToPercent(recordingStartTime)}%`,
              width: `${timeToPercent(currentTime - recordingStartTime)}%`,
              transform: "translateY(-50%)",
            }}
          />
          <div
            className="absolute top-1/2 w-1.5 h-1.5 bg-red-500 rounded-full"
            style={{
              left: `${timeToPercent(currentTime)}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </React.Fragment>
      )}

      {/* Current time marker (only shown when not recording) */}
      {!isRecording && duration > 0 && (
        <div
          className="absolute h-full w-0.5 bg-red-500 transition-transform duration-100"
          style={{
            left: `${timeToPercent(currentTime)}%`,
            transform: "translateX(-50%)",
          }}
        />
      )}

      {/* Hover time */}
      {hoverTime !== null && (
        <div
          className="absolute -top-7 px-2 py-0.5 bg-black/75 text-white text-xs rounded transform -translate-x-1/2"
          style={{ left: `${timeToPercent(hoverTime)}%` }}
        >
          {hoverTime.toFixed(2)}s
        </div>
      )}
    </div>
  );
};

export default GazeTimeline;
