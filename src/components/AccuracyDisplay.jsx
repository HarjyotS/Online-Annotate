import { useMemo } from 'react';

const AccuracyDisplay = ({ 
  aiAnnotations,
  manualAnnotations,
  duration,
  frameRate 
}) => {
  const accuracies = useMemo(() => {
    if (!aiAnnotations || !manualAnnotations || !duration || !frameRate) return null;

    const totalFrames = Math.round(duration * frameRate);
    
    // Create frame arrays for manual annotations
    const manualLeftFrames = new Array(totalFrames).fill(false);
    const manualRightFrames = new Array(totalFrames).fill(false);
    
    // Fill manual frames
    manualAnnotations.leftPersonGaze.forEach(interval => {
      const startFrame = interval.startFrame;
      const endFrame = interval.endFrame;
      for (let i = startFrame; i <= endFrame && i < totalFrames; i++) {
        manualLeftFrames[i] = true;
      }
    });
    
    manualAnnotations.rightPersonGaze.forEach(interval => {
      const startFrame = interval.startFrame;
      const endFrame = interval.endFrame;
      for (let i = startFrame; i <= endFrame && i < totalFrames; i++) {
        manualRightFrames[i] = true;
      }
    });
    
    // Create frame arrays for AI annotations
    const aiLeftFrames = new Array(totalFrames).fill(false);
    const aiRightFrames = new Array(totalFrames).fill(false);
    
    // Fill AI frames
    aiAnnotations.leftPersonGaze.forEach(interval => {
      const startFrame = interval.startFrame;
      const endFrame = interval.endFrame;
      for (let i = startFrame; i <= endFrame && i < totalFrames; i++) {
        aiLeftFrames[i] = true;
      }
    });
    
    aiAnnotations.rightPersonGaze.forEach(interval => {
      const startFrame = interval.startFrame;
      const endFrame = interval.endFrame;
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

    // Calculate additional metrics
    const leftTP = manualLeftFrames.reduce((acc, curr, idx) => 
      acc + (curr && aiLeftFrames[idx] ? 1 : 0), 0);
    const leftFP = manualLeftFrames.reduce((acc, curr, idx) => 
      acc + (!curr && aiLeftFrames[idx] ? 1 : 0), 0);
    const leftFN = manualLeftFrames.reduce((acc, curr, idx) => 
      acc + (curr && !aiLeftFrames[idx] ? 1 : 0), 0);
    
    const rightTP = manualRightFrames.reduce((acc, curr, idx) => 
      acc + (curr && aiRightFrames[idx] ? 1 : 0), 0);
    const rightFP = manualRightFrames.reduce((acc, curr, idx) => 
      acc + (!curr && aiRightFrames[idx] ? 1 : 0), 0);
    const rightFN = manualRightFrames.reduce((acc, curr, idx) => 
      acc + (curr && !aiRightFrames[idx] ? 1 : 0), 0);
    
    return {
      leftPersonGaze: {
        accuracy: leftAccuracy,
        truePositives: leftTP,
        falsePositives: leftFP,
        falseNegatives: leftFN,
        precision: leftTP / (leftTP + leftFP) * 100,
        recall: leftTP / (leftTP + leftFN) * 100
      },
      rightPersonGaze: {
        accuracy: rightAccuracy,
        truePositives: rightTP,
        falsePositives: rightFP,
        falseNegatives: rightFN,
        precision: rightTP / (rightTP + rightFP) * 100,
        recall: rightTP / (rightTP + rightFN) * 100
      },
      overall: (leftAccuracy + rightAccuracy) / 2
    };
  }, [aiAnnotations, manualAnnotations, duration, frameRate]);

  if (!accuracies) return null;

  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Annotation Metrics</h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Person on left</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Accuracy</div>
              <div className="text-sm font-medium">{accuracies.leftPersonGaze.accuracy.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Precision</div>
              <div className="text-sm font-medium">{accuracies.leftPersonGaze.precision.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Recall</div>
              <div className="text-sm font-medium">{accuracies.leftPersonGaze.recall.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Person on right</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Accuracy</div>
              <div className="text-sm font-medium">{accuracies.rightPersonGaze.accuracy.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Precision</div>
              <div className="text-sm font-medium">{accuracies.rightPersonGaze.precision.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Recall</div>
              <div className="text-sm font-medium">{accuracies.rightPersonGaze.recall.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-sm font-medium text-gray-600">Overall Accuracy</div>
          <div className="mt-1 flex items-center gap-2">
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
    </div>
  );
};

export default AccuracyDisplay;