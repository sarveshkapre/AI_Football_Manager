import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/mock';
import { SectionHeader } from '../components/SectionHeader';
import { useClipContext } from '../context/ClipContext';
import { useStoryboards } from '../context/StoryboardContext';
import type { Clip, OverlayToggle, TimelineEvent } from '../types';

export const Analyst = () => {
  const { openClip } = useClipContext();
  const { storyboards, addStoryboard, renameStoryboard, removeStoryboard } = useStoryboards();
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [overlays, setOverlays] = useState<OverlayToggle[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selected, setSelected] = useState<Clip[]>([]);
  const [storyboardTitle, setStoryboardTitle] = useState('');

  useEffect(() => {
    const load = async () => {
      const [timelineData, overlayData, clipData] = await Promise.all([
        api.getTimeline(),
        api.getOverlays(),
        api.getClips()
      ]);
      setTimeline(timelineData);
      setOverlays(overlayData);
      setClips(clipData);
    };

    load();
  }, []);

  const availableClips = useMemo(
    () => clips.filter((clip) => !selected.some((item) => item.id === clip.id)),
    [clips, selected]
  );

  return (
    <div className="page-content">
      <SectionHeader
        title="Analyst Mode"
        subtitle="Timeline, overlays, and narrative building with evidence."
        action={<button className="btn">Create report</button>}
      />

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Tactical timeline" subtitle="Auto-tagged shifts and events." />
          <div className="timeline-list">
            {timeline.map((event) => (
              <button
                className="timeline-item"
                key={event.id}
                onClick={async () => {
                  const clip = await api.getClipById(event.clipId);
                  openClip(clip);
                }}
              >
                <div>
                  <p className="eyebrow">{event.minute}</p>
                  <h4>{event.label}</h4>
                  <div className="tag-row">
                    {event.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="pill">Confidence {event.confidence}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card surface">
          <SectionHeader title="Overlay controls" subtitle="Toggle visual layers per clip." />
          <div className="overlay-controls">
            {overlays.map((overlay) => (
              <label className="toggle" key={overlay.id}>
                <input type="checkbox" defaultChecked={overlay.enabled} />
                <span>{overlay.label}</span>
              </label>
            ))}
          </div>
          <div className="overlay-preview">
            <div className="overlay-tile"></div>
            <div className="overlay-tile"></div>
            <div className="overlay-tile"></div>
            <div className="overlay-tile"></div>
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Ask the match" subtitle="Evidence-backed answers in seconds." />
          <div className="chat">
            <div className="chat-bubble user">Where are we overloaded?</div>
            <div className="chat-bubble ai">
              We are overloaded on the right flank after switches. See clips 12s and 14s.
            </div>
            <div className="chat-input">
              <input type="text" placeholder="Ask a tactical question..." />
              <button className="btn primary">Ask</button>
            </div>
          </div>
        </div>

        <div className="card surface">
          <SectionHeader title="Storyboard builder" subtitle="Select clips to assemble a pack." />
          <div className="storyboard-builder">
            <div className="storyboard-column">
              <h4>Selected clips</h4>
              {selected.length === 0 && <p className="muted">Select clips to build a pack.</p>}
              {selected.map((clip) => (
                <div className="story-card" key={clip.id}>
                  <div>
                    <h4>{clip.title}</h4>
                    <p>{clip.duration}</p>
                  </div>
                  <button
                    className="btn ghost"
                    onClick={() =>
                      setSelected((items) => items.filter((item) => item.id !== clip.id))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="storyboard-column">
              <h4>Available clips</h4>
              {availableClips.map((clip) => (
                <button
                  className="story-card"
                  key={clip.id}
                  onClick={() => setSelected((items) => [...items, clip])}
                >
                  <div>
                    <h4>{clip.title}</h4>
                    <p>{clip.duration}</p>
                  </div>
                  <span className="pill">Add</span>
                </button>
              ))}
            </div>
          </div>
          <div className="storyboard-actions">
            <input
              type="text"
              value={storyboardTitle}
              onChange={(event) => setStoryboardTitle(event.target.value)}
              placeholder="Storyboard title"
            />
            <button
              className="btn primary"
              disabled={selected.length === 0 || storyboardTitle.trim().length === 0}
              onClick={() => {
                addStoryboard(storyboardTitle.trim(), selected);
                setSelected([]);
                setStoryboardTitle('');
              }}
            >
              Save storyboard
            </button>
          </div>
        </div>
      </div>

      <div className="card surface">
        <SectionHeader title="Storyboards" subtitle="Saved narrative packs." />
        <div className="storyboard">
          {storyboards.map((board) => (
            <div className="story-card" key={board.id}>
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
      </div>
    </div>
  );
};
