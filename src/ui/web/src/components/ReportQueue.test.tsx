/* @vitest-environment happy-dom */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReportQueue } from './ReportQueue';

const clearQueue = vi.fn();
const removeClip = vi.fn();
const setQueue = vi.fn();

vi.mock('../context/ReportContext', () => ({
  useReportContext: () => ({
    queue: [
      {
        id: 'clip-1',
        title: 'Press beaten',
        duration: '0:12',
        tags: ['press'],
        overlays: [{ id: 'o1', label: 'Spacing box', enabled: true }]
      }
    ],
    removeClip,
    clearQueue,
    setQueue
  })
}));

vi.mock('../hooks/useDragList', () => ({
  useDragList: () => ({
    handleDragStart: () => undefined,
    handleDragOver: () => undefined,
    handleDrop: () => undefined
  })
}));

vi.mock('./QueueAnnotation', () => ({
  QueueAnnotation: () => null
}));

vi.mock('./QueueLabels', () => ({
  QueueLabels: () => null
}));

describe('ReportQueue', () => {
  it('confirms before clearing the queue', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValueOnce(false);

    render(<ReportQueue />);
    fireEvent.click(screen.getByRole('button', { name: /clear queue/i }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(clearQueue).not.toHaveBeenCalled();

    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: /clear queue/i }));

    expect(confirmSpy).toHaveBeenCalledTimes(2);
    expect(clearQueue).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });
});
