import React from "react";

const ComparisonTimeline = ({
  duration = 0,
  currentTime = 0,
  intervals = [],
  label = "",
  className = "",
}) => {
  const timeToPercent = (time) => {
    if (!duration || duration === 0) return 0;
    return (time / duration) * 100;
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-32 text-right text-sm text-gray-600">{label}</div>
      <div className={`relative h-8 bg-gray-50 rounded flex-1 ${className}`}>
        {intervals.map((interval, index) => (
          <React.Fragment key={index}>
            <div
              className="absolute top-1/2 h-0.5 bg-black/50 transition-[width] duration-100"
              style={{
                left: `${timeToPercent(interval.start)}%`,
                width: `${timeToPercent(interval.end - interval.start)}%`,
                transform: "translateY(-50%)",
              }}
            />
          </React.Fragment>
        ))}
        {duration > 0 && (
          <div
            className="absolute h-full w-0.5 bg-red-500 transition-transform duration-100"
            style={{
              left: `${timeToPercent(currentTime)}%`,
              transform: "translateX(-50%)",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ComparisonTimeline;
