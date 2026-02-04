import { useStoryboards } from '../context/StoryboardContext';
import { useDragList } from '../hooks/useDragList';

export const StoryboardList = () => {
  const { storyboards, reorderStoryboards, renameStoryboard, removeStoryboard } = useStoryboards();
  const { handleDragStart, handleDragOver, handleDrop } = useDragList(
    storyboards,
    reorderStoryboards
  );

  return (
    <div className="storyboard">
      {storyboards.map((board, index) => (
        <div
          key={board.id}
          className="story-card draggable"
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(index)}
        >
          <div>
            <h4>{board.title}</h4>
            <p>{board.clips.length} clips · Updated {board.updated}</p>
          </div>
          <div className="story-actions">
            <button
              className="btn ghost"
              onClick={() => {
                const title = window.prompt('Rename storyboard', board.title);
                if (title && title.trim().length > 0) {
                  renameStoryboard(board.id, title.trim());
                }
              }}
            >
              Rename
            </button>
            <button className="btn ghost" onClick={() => removeStoryboard(board.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
