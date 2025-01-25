import React from 'react';

const ComparisonTimeline = ({
  duration = 0,
  currentTime = 0,
  gaze = [],
  screen = [],
  neither = [],
  label = ""
}) => {
  const gazeColors = {
    1: '#4ade80', // Green for patient/doctor gaze
    2: '#60a5fa', // Blue for screen gaze
    3: '#94a3b8'  // Gray for neither
  };

  const timeToPercent = (time) => {
    if (!duration) return 0;
    return (time / duration) * 100;
  };

  const TimelineBar = ({ intervals, color }) => (
    intervals.map((interval, index) => (
      <div
        key={index}
        className="absolute top-0 h-full"
        style={{
          left: `${timeToPercent(interval.start)}%`,
          width: `${timeToPercent(interval.end - interval.start)}%`,
          backgroundColor: color,
          transition: 'width 100ms'
        }}
      />
    ))
  );

  return (
    <div className="flex items-center gap-4">
      <div className="w-32 text-right text-sm text-gray-600">{label}</div>
      <div className="relative h-8 bg-gray-50 rounded flex-1">
        <TimelineBar intervals={neither} color={gazeColors[3]} />
        <TimelineBar intervals={gaze} color={gazeColors[1]} />
        <TimelineBar intervals={screen} color={gazeColors[2]} />
      </div>
    </div>
  );
};

export default ComparisonTimeline;