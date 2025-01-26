import React, { useRef, useEffect, useState } from 'react';

const DualGazeTimeline = ({
  duration = 0,
  currentTime = 0,
  doctorIntervals = [],
  patientIntervals = [],
  onTimeUpdate,
  onDoctorGazeChange,
  onPatientGazeChange,
  currentDoctorGaze,
  currentPatientGaze,
  doctorGazeStartTime,
  patientGazeStartTime,
  setDoctorGazeIntervals,
  setCurrentDoctorGaze,
  setDoctorGazeStartTime,
  setPatientGazeIntervals,
  setCurrentPatientGaze,
  setPatientGazeStartTime,
}) => {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);

  const gazeColors = {
    1: '#4ade80', // Green for patient gaze
    2: '#ea4335', // Red for screen gaze
    3: '#94a3b8'  // Gray for neither
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (document.activeElement.tagName === 'INPUT') return;
      
      if (['1', '2', '3'].includes(e.key)) {
        onDoctorGazeChange(parseInt(e.key), currentTime);
      }
      if (e.key === '4') {
        onPatientGazeChange(1, currentTime);
      } else if (e.key === '5') {
        onPatientGazeChange(3, currentTime);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, onDoctorGazeChange, onPatientGazeChange]);

  const timeToPercent = (time) => {
    if (!duration) return 0;
    return (time / duration) * 100;
  };

  const getTimeFromMousePosition = (e) => {
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    return (x / rect.width) * duration;
  };

  const TimelineBar = ({ intervals, currentGaze, gazeStartTime, label }) => (
    <div className="flex items-center gap-4">
      <div className="w-32 text-right text-sm text-gray-600">{label}</div>
      <div className="relative h-8 bg-gray-50 rounded flex-1">
        {intervals.map((interval, index) => (
          <div
            key={index}
            className="absolute top-0 h-full"
            style={{
              left: `${timeToPercent(interval.start)}%`,
              width: `${timeToPercent(interval.end - interval.start)}%`,
              backgroundColor: gazeColors[interval.gazeType],
              transition: 'width 100ms'
            }}
          />
        ))}
        {currentGaze && gazeStartTime !== null && (
          <div
            className="absolute top-0 h-full"
            style={{
              left: `${timeToPercent(gazeStartTime)}%`,
              width: `${timeToPercent(currentTime - gazeStartTime)}%`,
              backgroundColor: gazeColors[currentGaze],
              transition: 'width 100ms'
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">Doctor Controls</h4>
            <button 
              onClick={() => {
                setDoctorGazeIntervals([]);
                setCurrentDoctorGaze(null);
                setDoctorGazeStartTime(null);
              }}
              className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">1</kbd>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gazeColors[1] }}></div>
                Patient
              </span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">2</kbd>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gazeColors[2] }}></div>
                Screen
              </span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">3</kbd>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gazeColors[3] }}></div>
                Neither
              </span>
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">Patient Controls</h4>
            <button 
              onClick={() => {
                setPatientGazeIntervals([]);
                setCurrentPatientGaze(null);
                setPatientGazeStartTime(null);
              }}
              className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">4</kbd>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gazeColors[1] }}></div>
                Doctor
              </span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">5</kbd>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gazeColors[3] }}></div>
                Neither
              </span>
            </span>
          </div>
        </div>
      </div>

      <div 
        ref={timelineRef}
        className="space-y-4"
        onMouseDown={(e) => {
          if (e.button === 0) {
            setIsDragging(true);
            onTimeUpdate(getTimeFromMousePosition(e));
          }
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            onTimeUpdate(getTimeFromMousePosition(e));
          }
          setHoverTime(getTimeFromMousePosition(e));
        }}
        onMouseLeave={() => {
          setHoverTime(null);
          setIsDragging(false);
        }}
      >
        <TimelineBar 
          intervals={doctorIntervals}
          currentGaze={currentDoctorGaze}
          gazeStartTime={doctorGazeStartTime}
          label="Doctor"
        />
        <TimelineBar 
          intervals={patientIntervals}
          currentGaze={currentPatientGaze}
          gazeStartTime={patientGazeStartTime}
          label="Patient"
        />

        {hoverTime !== null && (
          <div
            className="absolute -top-7 px-2 py-0.5 bg-black/75 text-white text-xs rounded transform -translate-x-1/2"
            style={{ left: `${timeToPercent(hoverTime)}%` }}
          >
            {hoverTime.toFixed(2)}s
          </div>
        )}
      </div>
    </div>
  );
};

export default DualGazeTimeline;