import { useState } from 'react';
import { useAnnotations } from '../context/AnnotationsContext';

interface QueueAnnotationProps {
  clipId: string;
}

export const QueueAnnotation = ({ clipId }: QueueAnnotationProps) => {
  const { annotations, setAnnotation, removeAnnotation } = useAnnotations();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(annotations[clipId] ?? '');

  const save = () => {
    if (value.trim().length === 0) {
      removeAnnotation(clipId);
    } else {
      setAnnotation(clipId, value.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="annotation">
      {isEditing ? (
        <div className="annotation-edit">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Add note"
          />
          <button className="btn" onClick={save}>
            Save
          </button>
        </div>
      ) : (
        <button className="btn ghost" onClick={() => setIsEditing(true)}>
          {annotations[clipId] ? 'Edit note' : 'Add note'}
        </button>
      )}
    </div>
  );
};
