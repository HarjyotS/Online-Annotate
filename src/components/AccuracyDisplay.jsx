import React, { useMemo } from 'react';

const AccuracyDisplay = ({ 
  aiAnnotations,
  manualAnnotations,
  duration,
  frameRate 
}) => {
  const metrics = useMemo(() => {
    if (!aiAnnotations || !manualAnnotations || !duration || !frameRate) return null;

    const totalFrames = Math.round(duration * frameRate);

    // Create frame arrays for comparisons
    const doctorGazeFrames = new Array(totalFrames).fill(false);
    const doctorScreenFrames = new Array(totalFrames).fill(false);
    const patientGazeFrames = new Array(totalFrames).fill(false);

    // Fill manual frames
    manualAnnotations.leftPersonGaze?.forEach(interval => {
      for (let i = interval.startFrame; i <= interval.endFrame && i < totalFrames; i++) {
        patientGazeFrames[i] = true;
      }
    });

    manualAnnotations.rightPersonScreen?.forEach(interval => {
      for (let i = interval.startFrame; i <= interval.endFrame && i < totalFrames; i++) {
        doctorScreenFrames[i] = true;
      }
    });

    manualAnnotations.rightPersonGaze?.forEach(interval => {
      for (let i = interval.startFrame; i <= interval.endFrame && i < totalFrames; i++) {
        doctorGazeFrames[i] = true;
      }
    });

    // Create AI frame arrays
    const aiDoctorGazeFrames = new Array(totalFrames).fill(false);
    const aiDoctorScreenFrames = new Array(totalFrames).fill(false);
    const aiPatientGazeFrames = new Array(totalFrames).fill(false);

    // Fill AI frames
    aiAnnotations.leftPersonGaze?.forEach(interval => {
      for (let i = interval.startFrame; i <= interval.endFrame && i < totalFrames; i++) {
        aiPatientGazeFrames[i] = true;
      }
    });

    aiAnnotations.rightPersonScreen?.forEach(interval => {
      for (let i = interval.startFrame; i <= interval.endFrame && i < totalFrames; i++) {
        aiDoctorScreenFrames[i] = true;
      }
    });

    aiAnnotations.rightPersonGaze?.forEach(interval => {
      for (let i = interval.startFrame; i <= interval.endFrame && i < totalFrames; i++) {
        aiDoctorGazeFrames[i] = true;
      }
    });

    // Calculate accuracy metrics
    const calculateMetrics = (truth, prediction) => {
      const tp = truth.reduce((acc, curr, idx) => acc + (curr && prediction[idx] ? 1 : 0), 0);
      const fp = truth.reduce((acc, curr, idx) => acc + (!curr && prediction[idx] ? 1 : 0), 0);
      const fn = truth.reduce((acc, curr, idx) => acc + (curr && !prediction[idx] ? 1 : 0), 0);
      const tn = truth.reduce((acc, curr, idx) => acc + (!curr && !prediction[idx] ? 1 : 0), 0);

      return {
        accuracy: ((tp + tn) / totalFrames) * 100,
        precision: tp / (tp + fp) * 100,
        recall: tp / (tp + fn) * 100,
        f1: tp / (tp + 0.5 * (fp + fn)) * 100
      };
    };

    const doctorGazeMetrics = calculateMetrics(doctorGazeFrames, aiDoctorGazeFrames);
    const doctorScreenMetrics = calculateMetrics(doctorScreenFrames, aiDoctorScreenFrames);
    const patientGazeMetrics = calculateMetrics(patientGazeFrames, aiPatientGazeFrames);

    return {
      doctorGaze: doctorGazeMetrics,
      doctorScreen: doctorScreenMetrics,
      patientGaze: patientGazeMetrics,
      overall: (doctorGazeMetrics.accuracy + doctorScreenMetrics.accuracy + patientGazeMetrics.accuracy) / 3
    };
  }, [aiAnnotations, manualAnnotations, duration, frameRate]);

  if (!metrics) return null;

  const MetricRow = ({ label, value }) => (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value.toFixed(1)}%</span>
    </div>
  );

  const CategoryMetrics = ({ title, metrics }) => (
    <div className="space-y-2">
      <div className="font-medium text-gray-700">{title}</div>
      <MetricRow label="Accuracy" value={metrics.accuracy} />
      <MetricRow label="Precision" value={metrics.precision} />
      <MetricRow label="Recall" value={metrics.recall} />
      <MetricRow label="F1 Score" value={metrics.f1} />
    </div>
  );

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg border border-gray-100">
      <div className="grid grid-cols-3 gap-8">
        <CategoryMetrics title="Doctor Looking at Patient" metrics={metrics.doctorGaze} />
        <CategoryMetrics title="Doctor Looking at Screen" metrics={metrics.doctorScreen} />
        <CategoryMetrics title="Patient Looking at Doctor" metrics={metrics.patientGaze} />
      </div>

      <div className="pt-4 border-t">
        <div className="text-sm font-medium text-gray-700">Overall Accuracy</div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div 
              className="bg-green-500 rounded-full h-2" 
              style={{ width: `${metrics.overall}%` }}
            />
          </div>
          <span className="text-sm font-medium w-16 text-right">
            {metrics.overall.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccuracyDisplay;