import { useState } from 'react';
import { useLabels } from '../context/LabelsContext';

interface QueueLabelsProps {
  clipId: string;
}

export const QueueLabels = ({ clipId }: QueueLabelsProps) => {
  const { labels, addLabel, removeLabel } = useLabels();
  const [value, setValue] = useState('');
  const clipLabels = labels[clipId] ?? [];

  const handleAdd = () => {
    if (value.trim().length === 0) {
      return;
    }
    addLabel(clipId, value.trim());
    setValue('');
  };

  return (
    <div className="labels">
      <div className="label-list">
        {clipLabels.map((label) => (
          <button
            key={label}
            className="label-chip"
            onClick={() => removeLabel(clipId, label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="label-input">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Add label"
        />
        <button className="btn" onClick={handleAdd}>
          Add
        </button>
      </div>
    </div>
  );
};
