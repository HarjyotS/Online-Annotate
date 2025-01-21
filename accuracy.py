import json
from typing import Dict, List, Any

def convert_timestamp_to_frame(timestamp: int, frame_rate: float) -> int:
    """Convert millisecond timestamp to frame number."""
    return int((timestamp / 1000.0) * frame_rate)

def create_frame_labels(annotations: List[Dict[str, int]], total_frames: int) -> List[bool]:
    """Create a list of boolean values indicating presence of action for each frame."""
    frame_labels = [False] * total_frames
    for annotation in annotations:
        start_frame = annotation['startFrame']
        end_frame = annotation['endFrame']
        for frame in range(start_frame, end_frame + 1):
            if frame < total_frames:
                frame_labels[frame] = True
    return frame_labels

def create_model_frame_labels(model_annotations: List[Dict[str, Any]], 
                            total_frames: int, 
                            frame_rate: float,
                            human_number: int) -> List[bool]:
    """Create frame labels from model annotations for a specific human."""
    frame_labels = [False] * total_frames
    current_state = False  # Track the current state (True if looking at human)
    
    # Filter annotations for the specific human and sort by timestamp
    relevant_annotations = [
        ann for ann in model_annotations 
        if isinstance(ann['timestamp'], (int, float)) and  # Exclude 'total' entry
        ann['change_type'] == 'gaze' and 
        ann['details']['human'] == human_number
    ]
    relevant_annotations.sort(key=lambda x: x['timestamp'])
    
    # Process each annotation
    for annotation in relevant_annotations:
        frame = convert_timestamp_to_frame(annotation['timestamp'], frame_rate)
        if frame >= total_frames:
            continue
            
        # Update the current state based on the annotation
        current_state = annotation['details']['contact'] == 'human'
        
        # Update all frames from this point until the next annotation
        frame_labels[frame] = current_state
        
        # Fill in frames until the next annotation or end
        next_annotations = [a for a in relevant_annotations if a['timestamp'] > annotation['timestamp']]
        if next_annotations:
            next_frame = convert_timestamp_to_frame(next_annotations[0]['timestamp'], frame_rate)
        else:
            next_frame = total_frames
            
        for f in range(frame, min(next_frame, total_frames)):
            frame_labels[f] = current_state
            
    return frame_labels

def calculate_accuracy(manual_labels: List[bool], model_labels: List[bool]) -> float:
    """Calculate the percentage of frames where manual and model labels match."""
    if len(manual_labels) != len(model_labels):
        raise ValueError("Label lists must be of equal length")
        
    matching_frames = sum(1 for m, p in zip(manual_labels, model_labels) if m == p)
    return (matching_frames / len(manual_labels)) * 100

def analyze_annotations(manual_data: Dict, model_data: List[Dict]) -> Dict[str, float]:
    """Analyze accuracy for each action type."""
    video_info = manual_data['videoInfo']
    manual_annotations = manual_data['manualAnnotations']
    total_frames = video_info['totalFrames']
    frame_rate = video_info['frameRate']
    
    results = {}
    
    # Analyze left person gaze (human 1)
    if 'leftPersonGaze' in manual_annotations:
        manual_left = create_frame_labels(manual_annotations['leftPersonGaze'], total_frames)
        model_left = create_model_frame_labels(model_data, total_frames, frame_rate, 1)
        results['leftPersonGaze'] = calculate_accuracy(manual_left, model_left)
    
    # Analyze right person gaze (human 2)
    if 'rightPersonGaze' in manual_annotations:
        manual_right = create_frame_labels(manual_annotations['rightPersonGaze'], total_frames)
        model_right = create_model_frame_labels(model_data, total_frames, frame_rate, 2)
        results['rightPersonGaze'] = calculate_accuracy(manual_right, model_right)
    
    return results

if __name__ == "__main__":
    # Load JSON files
    try:
        with open('gaze-analysis.json', 'r') as f:
            manual_data = json.load(f)
        
        with open('changes.json', 'r') as f:
            model_data = json.load(f)
        
        # Calculate accuracies
        results = analyze_annotations(manual_data, model_data)
        
        # Print results
        print("\nAccuracy Results:")
        for action, accuracy in results.items():
            print(f"{action}: {accuracy:.2f}%")
            
    except FileNotFoundError as e:
        print(f"Error: Could not find one of the input files: {e}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format in one of the input files: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")