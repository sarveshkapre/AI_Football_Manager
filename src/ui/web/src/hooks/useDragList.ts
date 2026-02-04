import { useState } from 'react';

export const useDragList = <T,>(items: T[], onChange: (items: T[]) => void) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (event: React.DragEvent) => event.preventDefault();
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  return { dragIndex, handleDragStart, handleDragOver, handleDrop };
};
