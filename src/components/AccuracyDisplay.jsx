import { useMemo } from 'react';

const AccuracyDisplay = ({ 
  duration,
  frameRate,
  leftGazeIntervals,
  rightGazeIntervals,
  aiLeftGazeIntervals,
  aiRightGazeIntervals 
}) => {
  const accuracies = useMemo(() => {
    if (!duration || !frameRate) return null;

    // Convert time-based intervals to frame-based arrays
    const totalFrames = Math.round(duration * frameRate);
    
    // Create frame arrays for manual annotations
    const manualLeftFrames = new Array(totalFrames).fill(false);
    const manualRightFrames = new Array(totalFrames).fill(false);
    
    // Fill manual frames
    leftGazeIntervals.forEach(interval => {
      const startFrame = Math.round(interval.start * frameRate);
      const endFrame = Math.round(interval.end * frameRate);
      for (let i = startFrame; i <= endFrame && i < totalFrames; i++) {
        manualLeftFrames[i] = true;
      }
    });
    
    rightGazeIntervals.forEach(interval => {
      const startFrame = Math.round(interval.start * frameRate);
      const endFrame = Math.round(interval.end * frameRate);
      for (let i = startFrame; i <= endFrame && i < totalFrames; i++) {
        manualRightFrames[i] = true;
      }
    });
    
    // Create frame arrays for AI annotations
    const aiLeftFrames = new Array(totalFrames).fill(false);
    const aiRightFrames = new Array(totalFrames).fill(false);
    
    // Fill AI frames
    aiLeftGazeIntervals.forEach(interval => {
      const startFrame = Math.round(interval.start * frameRate);
      const endFrame = Math.round(interval.end * frameRate);
      for (let i = startFrame; i <= endFrame && i < totalFrames; i++) {
        aiLeftFrames[i] = true;
      }
    });
    
    aiRightGazeIntervals.forEach(interval => {
      const startFrame = Math.round(interval.start * frameRate);
      const endFrame = Math.round(interval.end * frameRate);
      for (let i = startFrame; i <= endFrame && i < totalFrames; i++) {
        aiRightFrames[i] = true;
      }
    });
    
    // Calculate accuracies
    const leftAccuracy = manualLeftFrames.reduce((acc, curr, idx) => {
      return acc + (curr === aiLeftFrames[idx] ? 1 : 0);
    }, 0) / totalFrames * 100;
    
    const rightAccuracy = manualRightFrames.reduce((acc, curr, idx) => {
      return acc + (curr === aiRightFrames[idx] ? 1 : 0);
    }, 0) / totalFrames * 100;
    
    return {
      leftPersonGaze: leftAccuracy,
      rightPersonGaze: rightAccuracy,
      overall: (leftAccuracy + rightAccuracy) / 2
    };
  }, [duration, frameRate, leftGazeIntervals, rightGazeIntervals, aiLeftGazeIntervals, aiRightGazeIntervals]);

  if (!accuracies) return null;

  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Annotation Accuracy</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-32">Person on left:</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div 
              className="bg-blue-500 rounded-full h-2" 
              style={{ width: `${accuracies.leftPersonGaze}%` }}
            />
          </div>
          <span className="text-sm font-medium w-16 text-right">
            {accuracies.leftPersonGaze.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-32">Person on right:</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div 
              className="bg-blue-500 rounded-full h-2" 
              style={{ width: `${accuracies.rightPersonGaze}%` }}
            />
          </div>
          <span className="text-sm font-medium w-16 text-right">
            {accuracies.rightPersonGaze.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-32">Overall:</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div 
              className="bg-green-500 rounded-full h-2" 
              style={{ width: `${accuracies.overall}%` }}
            />
          </div>
          <span className="text-sm font-medium w-16 text-right">
            {accuracies.overall.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccuracyDisplay;