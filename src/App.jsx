import React, { useState } from "react";
import { Upload, Download } from "lucide-react";
import VideoPlayer from "./components/VideoPlayer";
import VideoTimeline from "./components/VideoTimeline";
import DualGazeTimeline from "./components/DualGazeTimeline";
import ComparisonTimeline from "./components/ComparisonTimeline";
import AccuracyDisplay from './components/AccuracyDisplay';

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

  const [gazeIntervals, setGazeIntervals] = useState([]);
  const [currentGazeType, setCurrentGazeType] = useState(null);
  const [gazeStartTime, setGazeStartTime] = useState(null);

  const [doctorGazeIntervals, setDoctorGazeIntervals] = useState([]);
  const [patientGazeIntervals, setPatientGazeIntervals] = useState([]);
  const [currentDoctorGaze, setCurrentDoctorGaze] = useState(null);
  const [currentPatientGaze, setCurrentPatientGaze] = useState(null);
  const [doctorGazeStartTime, setDoctorGazeStartTime] = useState(null);
  const [patientGazeStartTime, setPatientGazeStartTime] = useState(null);

  const handleDoctorGazeChange = (gazeType, time) => {
    if (currentDoctorGaze === gazeType) return;
    
    setDoctorGazeIntervals(intervals => {
      const newIntervals = [...intervals];
      if (doctorGazeStartTime !== null && currentDoctorGaze !== null) {
        newIntervals.push({
          start: doctorGazeStartTime,
          end: time,
          gazeType: currentDoctorGaze
        });
      }
      return newIntervals;
    });
    
    setCurrentDoctorGaze(gazeType);
    setDoctorGazeStartTime(time);
  };

  const handlePatientGazeChange = (gazeType, time) => {
    if (currentPatientGaze === gazeType) return;
    
    setPatientGazeIntervals(intervals => {
      const newIntervals = [...intervals];
      if (patientGazeStartTime !== null && currentPatientGaze !== null) {
        newIntervals.push({
          start: patientGazeStartTime,
          end: time,
          gazeType: currentPatientGaze
        });
      }
      return newIntervals;
    });
    
    setCurrentPatientGaze(gazeType);
    setPatientGazeStartTime(time);
  };

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
    const annotationEntry = data[1];  // Second object contains the annotations
    
    if (!annotationEntry.manualAnnotations) {
      console.error("No annotation data found");
      return;
    }
   
    console.log("Found annotations:", annotationEntry.manualAnnotations);
    
    // Convert AI annotations to time-based intervals
    setAiAnnotations({
      rightPersonScreen: annotationEntry.manualAnnotations.rightPersonScreen || [],
      rightPersonGaze: annotationEntry.manualAnnotations.rightPersonGaze || [],
      leftPersonGaze: annotationEntry.manualAnnotations.leftPersonGaze || []
    });
   };

  const fillNeitherIntervals = ({ duration, gazeIntervals }) => {
    if (!gazeIntervals.length) return [{ start: 0, end: duration }];
    
    const sortedIntervals = [...gazeIntervals].sort((a, b) => a.start - b.start);
    const neitherIntervals = [];
    
    let lastEnd = 0;
    sortedIntervals.forEach(interval => {
      if (interval.start > lastEnd) {
        neitherIntervals.push({
          start: lastEnd,
          end: interval.start
        });
      }
      lastEnd = Math.max(lastEnd, interval.end);
    });
    
    if (lastEnd < duration) {
      neitherIntervals.push({
        start: lastEnd,
        end: duration
      });
    }
    
    return neitherIntervals;
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
                onClick={() => {
                  console.log("Exporting data...");
                  const data = {
                    videoInfo: {
                      duration,
                      filename: videoSrc ? videoSrc.split('/').pop() : 'unknown',
                      frameRate,
                      totalFrames: Math.round(duration * frameRate)
                    },
                    manualAnnotations: {
                      rightPersonScreen: doctorGazeIntervals
                        .filter(i => i.gazeType === 2)
                        .map(interval => ({
                          startFrame: Math.round(interval.start * frameRate),
                          endFrame: Math.round(interval.end * frameRate)
                        })),
                      rightPersonGaze: doctorGazeIntervals
                        .filter(i => i.gazeType === 1)
                        .map(interval => ({
                          startFrame: Math.round(interval.start * frameRate),
                          endFrame: Math.round(interval.end * frameRate)
                        })),
                      leftPersonGaze: patientGazeIntervals
                        .filter(i => i.gazeType === 1)
                        .map(interval => ({
                          startFrame: Math.round(interval.start * frameRate),
                          endFrame: Math.round(interval.end * frameRate)
                        }))
                    }
                  };

                  const blob = new Blob([JSON.stringify(data, null, 2)]);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'gaze-analysis.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
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
                <DualGazeTimeline
                  duration={duration}
                  currentTime={currentTime}
                  doctorIntervals={doctorGazeIntervals}
                  patientIntervals={patientGazeIntervals}
                  onTimeUpdate={handleTimeUpdate}
                  onDoctorGazeChange={handleDoctorGazeChange}
                  onPatientGazeChange={handlePatientGazeChange}
                  currentDoctorGaze={currentDoctorGaze}
                  currentPatientGaze={currentPatientGaze}
                  doctorGazeStartTime={doctorGazeStartTime}
                  patientGazeStartTime={patientGazeStartTime}
                  setDoctorGazeIntervals={setDoctorGazeIntervals}
                  setCurrentDoctorGaze={setCurrentDoctorGaze}
                  setDoctorGazeStartTime={setDoctorGazeStartTime}
                  setPatientGazeIntervals={setPatientGazeIntervals}
                  setCurrentPatientGaze={setCurrentPatientGaze}
                  setPatientGazeStartTime={setPatientGazeStartTime}
                />
              </div>
              {aiAnnotations && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  AI Predictions
                </h3>
                <div className="space-y-4">
                  <ComparisonTimeline 
                    duration={duration}
                    currentTime={currentTime}
                    gaze={aiAnnotations.rightPersonGaze?.map(interval => ({
                      start: interval.startFrame / frameRate,
                      end: interval.endFrame / frameRate  
                    })) || []}
                    screen={aiAnnotations.rightPersonScreen?.map(interval => ({
                      start: interval.startFrame / frameRate,
                      end: interval.endFrame / frameRate
                    })) || []}
                    neither={fillNeitherIntervals({
                      duration,
                      gazeIntervals: [
                        ...(aiAnnotations.rightPersonGaze || []),
                        ...(aiAnnotations.rightPersonScreen || [])
                      ].map(interval => ({
                        start: interval.startFrame / frameRate,
                        end: interval.endFrame / frameRate
                      }))
                    })}
                    label="Doctor"
                  />
                  <ComparisonTimeline
                    duration={duration}
                    currentTime={currentTime}
                    gaze={aiAnnotations.leftPersonGaze?.map(interval => ({
                      start: interval.startFrame / frameRate,
                      end: interval.endFrame / frameRate
                    })) || []}
                    neither={fillNeitherIntervals({
                      duration,
                      gazeIntervals: (aiAnnotations.leftPersonGaze || [])
                        .map(interval => ({
                          start: interval.startFrame / frameRate,
                          end: interval.endFrame / frameRate
                        }))
                    })}
                    label="Patient"
                  />
                  <AccuracyDisplay
                    aiAnnotations={aiAnnotations}
                    manualAnnotations={{
                      leftPersonGaze: patientGazeIntervals
                        .filter(i => i.gazeType === 1)
                        .map(interval => ({
                          startFrame: Math.round(interval.start * frameRate),
                          endFrame: Math.round(interval.end * frameRate)
                        })),
                      rightPersonGaze: doctorGazeIntervals
                        .filter(i => i.gazeType === 1)
                        .map(interval => ({
                          startFrame: Math.round(interval.start * frameRate),
                          endFrame: Math.round(interval.end * frameRate)
                        })),
                      rightPersonScreen: doctorGazeIntervals
                        .filter(i => i.gazeType === 2)
                        .map(interval => ({
                          startFrame: Math.round(interval.start * frameRate),
                          endFrame: Math.round(interval.end * frameRate)
                        }))
                    }}
                    duration={duration}
                    frameRate={frameRate}
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
