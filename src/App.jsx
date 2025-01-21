import React, { useState } from "react";
import { Upload, Download } from "lucide-react";
import VideoPlayer from "./components/VideoPlayer";
import VideoTimeline from "./components/VideoTimeline";
import GazeTimeline from "./components/GazeTimeline";
import ComparisonTimeline from "./components/ComparisonTimeline";

const App = () => {
  const [videoSrc, setVideoSrc] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [leftGazeIntervals, setLeftGazeIntervals] = useState([]);
  const [rightGazeIntervals, setRightGazeIntervals] = useState([]);
  const [isRecordingLeft, setIsRecordingLeft] = useState(false);
  const [isRecordingRight, setIsRecordingRight] = useState(false);
  const [leftRecordingStart, setLeftRecordingStart] = useState(null);
  const [rightRecordingStart, setRightRecordingStart] = useState(null);
  const [frameRate, setFrameRate] = useState(30); // Default frame rate
  const [aiAnnotations, setAiAnnotations] = useState(null);
  const [aiLeftGazeIntervals, setAiLeftGazeIntervals] = useState([]);
  const [aiRightGazeIntervals, setAiRightGazeIntervals] = useState([]);

  // Helper function to check if a time point conflicts with any interval
  const hasConflict = (intervals, startTime, endTime = null) => {
    return intervals.some((interval) => {
      if (endTime === null) {
        return startTime >= interval.start && startTime <= interval.end;
      }
      return startTime < interval.end && endTime > interval.start;
    });
  };

  // Helper function to insert interval in correct position
  const insertInterval = (intervals, newInterval) => {
    const newIntervals = [...intervals];
    const insertIndex = newIntervals.findIndex(
      (interval) => interval.start > newInterval.start,
    );
    if (insertIndex === -1) {
      newIntervals.push(newInterval);
    } else {
      newIntervals.splice(insertIndex, 0, newInterval);
    }
    return newIntervals;
  };

  const processAiAnnotations = (data) => {
    console.log("Processing AI annotations:", data);
    const leftIntervals = [];
    const rightIntervals = [];

    let human1LastState = null;
    let human2LastState = null;
    let human1Start = null;
    let human2Start = null;

    // Filter out non-gaze entries and the "total" entry
    const gazeEntries = data.filter(
      (entry) =>
        entry.change_type === "gaze" &&
        entry.timestamp !== "total" &&
        (entry.frame !== undefined || entry.timestamp !== undefined),
    );

    console.log("Filtered gaze entries:", gazeEntries);

    // Convert frame numbers to seconds
    const getTimeInSeconds = (entry) => {
      // Both frame and timestamp fields represent frame numbers
      const frameNumber =
        entry.frame !== undefined ? entry.frame : entry.timestamp;
      return frameNumber / (frameRate || 30);
    };

    gazeEntries.forEach((entry) => {
      const timeInSeconds = getTimeInSeconds(entry);
      const { human, contact } = entry.details;

      console.log(
        `Processing entry: Time=${timeInSeconds}, Human=${human}, Contact=${contact}`,
      );

      // Note: We've swapped human 1 and 2 to match the correct people
      if (human === 1) {
        if (contact !== human1LastState) {
          // End previous interval if exists
          if (human1Start !== null && human1LastState === "human") {
            rightIntervals.push({
              // Changed from leftIntervals to rightIntervals
              start: human1Start,
              end: timeInSeconds,
            });
            console.log(
              `Added right interval: ${human1Start} to ${timeInSeconds}`,
            );
          }

          // Start new interval if looking at human
          if (contact === "human") {
            human1Start = timeInSeconds;
            console.log(`Started new right interval at ${timeInSeconds}`);
          } else {
            human1Start = null;
          }
          human1LastState = contact;
        }
      } else if (human === 2) {
        if (contact !== human2LastState) {
          // End previous interval if exists
          if (human2Start !== null && human2LastState === "human") {
            leftIntervals.push({
              // Changed from rightIntervals to leftIntervals
              start: human2Start,
              end: timeInSeconds,
            });
            console.log(
              `Added left interval: ${human2Start} to ${timeInSeconds}`,
            );
          }

          // Start new interval if looking at human
          if (contact === "human") {
            human2Start = timeInSeconds;
            console.log(`Started new left interval at ${timeInSeconds}`);
          } else {
            human2Start = null;
          }
          human2LastState = contact;
        }
      }
    });

    // Close any open intervals at the end
    const lastEntry = gazeEntries[gazeEntries.length - 1];
    const lastTime = lastEntry ? getTimeInSeconds(lastEntry) : 0;

    if (human1Start !== null && human1LastState === "human") {
      leftIntervals.push({
        start: human1Start,
        end: lastTime,
      });
      console.log(`Added final left interval: ${human1Start} to ${lastTime}`);
    }
    if (human2Start !== null && human2LastState === "human") {
      rightIntervals.push({
        start: human2Start,
        end: lastTime,
      });
      console.log(`Added final right interval: ${human2Start} to ${lastTime}`);
    }

    console.log("Final processed intervals:", {
      leftIntervals,
      rightIntervals,
    });
    setAiLeftGazeIntervals(leftIntervals);
    setAiRightGazeIntervals(rightIntervals);
  };

  const handleAiAnnotationsUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          console.log("Loaded AI annotations:", data);
          setAiAnnotations(data);
          processAiAnnotations(data);
        } catch (error) {
          console.error("Error parsing AI annotations:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  };

  const handlePlaybackRateChange = (newRate) => {
    setPlaybackRate(newRate);
  };

  const handleMetadataLoaded = (videoFrameRate) => {
    setFrameRate(videoFrameRate || 30);
  };

  const handleStartLeftRecording = () => {
    if (isRecordingLeft) {
      if (leftRecordingStart !== null && leftRecordingStart < currentTime) {
        if (!hasConflict(leftGazeIntervals, leftRecordingStart, currentTime)) {
          const newInterval = { start: leftRecordingStart, end: currentTime };
          setLeftGazeIntervals((prevIntervals) =>
            insertInterval(prevIntervals, newInterval),
          );
        }
      }
      setLeftRecordingStart(null);
    } else {
      if (!hasConflict(leftGazeIntervals, currentTime)) {
        setLeftRecordingStart(currentTime);
      }
    }
    setIsRecordingLeft(!isRecordingLeft);
  };

  const handleStartRightRecording = () => {
    if (isRecordingRight) {
      if (rightRecordingStart !== null && rightRecordingStart < currentTime) {
        if (
          !hasConflict(rightGazeIntervals, rightRecordingStart, currentTime)
        ) {
          const newInterval = { start: rightRecordingStart, end: currentTime };
          setRightGazeIntervals((prevIntervals) =>
            insertInterval(prevIntervals, newInterval),
          );
        }
      }
      setRightRecordingStart(null);
    } else {
      if (!hasConflict(rightGazeIntervals, currentTime)) {
        setRightRecordingStart(currentTime);
      }
    }
    setIsRecordingRight(!isRecordingRight);
  };

  const handleClearLeft = () => {
    setLeftGazeIntervals([]);
    if (isRecordingLeft) {
      setIsRecordingLeft(false);
      setLeftRecordingStart(null);
    }
  };

  const handleClearRight = () => {
    setRightGazeIntervals([]);
    if (isRecordingRight) {
      setIsRecordingRight(false);
      setRightRecordingStart(null);
    }
  };

  const handleKeyPress = (e) => {
    if (document.activeElement.tagName === "INPUT") return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        handlePlayPause();
        break;
      case "KeyL":
        e.preventDefault();
        handleStartLeftRecording();
        break;
      case "KeyR":
        e.preventDefault();
        handleStartRightRecording();
        break;
      case "ArrowLeft":
        e.preventDefault();
        handleTimeUpdate(Math.max(0, currentTime - (e.shiftKey ? 5 : 1)));
        break;
      case "ArrowRight":
        e.preventDefault();
        handleTimeUpdate(
          Math.min(duration, currentTime + (e.shiftKey ? 5 : 1)),
        );
        break;
    }
  };

  const exportData = () => {
    const timeToFrame = (time) => Math.round(time * frameRate);

    const data = {
      videoInfo: {
        duration,
        filename: videoSrc ? videoSrc.split("/").pop() : "unknown",
        frameRate,
        totalFrames: Math.round(duration * frameRate),
      },
      manualAnnotations: {
        leftPersonGaze: leftGazeIntervals.map((interval) => ({
          startFrame: timeToFrame(interval.start),
          endFrame: timeToFrame(interval.end),
        })),
        rightPersonGaze: rightGazeIntervals.map((interval) => ({
          startFrame: timeToFrame(interval.start),
          endFrame: timeToFrame(interval.end),
        })),
      },
    };

    if (aiAnnotations) {
      data.aiAnnotations = {
        leftPersonGaze: aiLeftGazeIntervals.map((interval) => ({
          startFrame: timeToFrame(interval.start),
          endFrame: timeToFrame(interval.end),
        })),
        rightPersonGaze: aiRightGazeIntervals.map((interval) => ({
          startFrame: timeToFrame(interval.start),
          endFrame: timeToFrame(interval.end),
        })),
      };
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gaze-analysis.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Gaze Analysis Tool</h1>
            <p className="text-gray-600 mb-2">
              Analyze and track mutual gaze interactions in videos
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Space</kbd>
                <span>Play/Pause</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">L</kbd>
                <span>Left Person</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">R</kbd>
                <span>Right Person</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">←/→</kbd>
                <span>1s Jump</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Shift</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">←/→</kbd>
                <span>5s Jump</span>
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            {videoSrc && (
              <>
                <button
                  onClick={exportData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
                >
                  <Download size={16} />
                  Export Data
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
                  <Upload size={16} />
                  <span>Load AI Annotations</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleAiAnnotationsUpload}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {!videoSrc ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="mb-4">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <h2 className="text-xl font-semibold text-gray-700 mb-1">
                Upload Your Video
              </h2>
              <p className="text-sm text-gray-500">
                Support for MP4, WebM, and other common video formats
              </p>
            </div>
            <label className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              Choose Video File
            </label>
          </div>
        ) : (
          <div className="space-y-4" onKeyDown={handleKeyPress} tabIndex="0">
            <div className="bg-black rounded-lg overflow-hidden shadow-sm">
              <VideoPlayer
                videoSrc={videoSrc}
                currentTime={currentTime}
                isPlaying={isPlaying}
                volume={volume}
                playbackRate={playbackRate}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={setDuration}
                onPlayPause={handlePlayPause}
                onVolumeChange={handleVolumeChange}
                onPlaybackRateChange={handlePlaybackRateChange}
                onMetadataLoaded={handleMetadataLoaded}
              />
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <VideoTimeline
                duration={duration}
                currentTime={currentTime}
                onTimeUpdate={handleTimeUpdate}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
              />
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Manual Annotations
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-right text-sm text-gray-600">
                      Person on left
                    </div>
                    <div className="flex-1">
                      <GazeTimeline
                        duration={duration}
                        currentTime={currentTime}
                        intervals={leftGazeIntervals}
                        isRecording={isRecordingLeft}
                        recordingStartTime={leftRecordingStart}
                        onTimeUpdate={handleTimeUpdate}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleStartLeftRecording}
                        className={`w-16 px-2 py-1 text-sm rounded ${
                          isRecordingLeft
                            ? "bg-red-500 text-white"
                            : "bg-gray-100"
                        }`}
                        title="Shortcut: L"
                      >
                        {isRecordingLeft ? "stop" : "start"}
                      </button>
                      <button
                        onClick={handleClearLeft}
                        className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                        title="Clear all intervals"
                      >
                        clear
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-32 text-right text-sm text-gray-600">
                      Person on right
                    </div>
                    <div className="flex-1">
                      <GazeTimeline
                        duration={duration}
                        currentTime={currentTime}
                        intervals={rightGazeIntervals}
                        isRecording={isRecordingRight}
                        recordingStartTime={rightRecordingStart}
                        onTimeUpdate={handleTimeUpdate}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleStartRightRecording}
                        className={`w-16 px-2 py-1 text-sm rounded ${
                          isRecordingRight
                            ? "bg-red-500 text-white"
                            : "bg-gray-100"
                        }`}
                        title="Shortcut: R"
                      >
                        {isRecordingRight ? "stop" : "start"}
                      </button>
                      <button
                        onClick={handleClearRight}
                        className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                        title="Clear all intervals"
                      >
                        clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {aiAnnotations && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    AI Annotations
                  </h3>
                  <div className="space-y-4">
                    <ComparisonTimeline
                      duration={duration}
                      currentTime={currentTime}
                      intervals={aiLeftGazeIntervals}
                      label="Person on left"
                    />
                    <ComparisonTimeline
                      duration={duration}
                      currentTime={currentTime}
                      intervals={aiRightGazeIntervals}
                      label="Person on right"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
