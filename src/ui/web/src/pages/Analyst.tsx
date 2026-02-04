import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/mock';
import { SectionHeader } from '../components/SectionHeader';
import { StoryboardList } from '../components/StoryboardList';
import { useAudit } from '../context/AuditContext';
import { useClipContext } from '../context/ClipContext';
import { useStoryboards } from '../context/StoryboardContext';
import type { Clip, OverlayToggle, TimelineEvent } from '../types';

export const Analyst = () => {
  const { openClip } = useClipContext();
  const { addStoryboard } = useStoryboards();
  const { logEvent } = useAudit();
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [overlays, setOverlays] = useState<OverlayToggle[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selected, setSelected] = useState<Clip[]>([]);
  const [storyboardTitle, setStoryboardTitle] = useState('');
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [minConfidence, setMinConfidence] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [highlights, setHighlights] = useState<Record<string, boolean>>({});

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

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    timeline.forEach((event) => event.tags.forEach((tag) => tagSet.add(tag)));
    clips.forEach((clip) => clip.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [timeline, clips]);

  const filteredTimeline = useMemo(() => {
    return timeline.filter((event) => {
      const matchesQuery =
        event.label.toLowerCase().includes(query.toLowerCase()) ||
        event.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));
      const matchesTag = activeTag ? event.tags.includes(activeTag) : true;
      const matchesConfidence = event.confidence >= minConfidence;
      return matchesQuery && matchesTag && matchesConfidence;
    });
  }, [timeline, query, activeTag, minConfidence]);

  const availableClips = useMemo(
    () => clips.filter((clip) => !selected.some((item) => item.id === clip.id)),
    [clips, selected]
  );

  const selectedEvent = useMemo(
    () => timeline.find((event) => event.id === selectedEventId) ?? null,
    [timeline, selectedEventId]
  );

  const addTagToSelected = (tag: string) => {
    if (!selectedEventId || !tag.trim()) {
      return;
    }
    setTimeline((prev) =>
      prev.map((event) =>
        event.id === selectedEventId && !event.tags.includes(tag.trim())
          ? { ...event, tags: [...event.tags, tag.trim()] }
          : event
      )
    );
    logEvent('Timeline tag added', `${tag.trim()} (${selectedEventId})`);
  };

  const toggleHighlight = () => {
    if (!selectedEventId) {
      return;
    }
    const label = selectedEvent?.label ?? selectedEventId;
    setHighlights((prev) => {
      const next = { ...prev, [selectedEventId]: !prev[selectedEventId] };
      logEvent('Timeline highlight', `${label} (${next[selectedEventId] ? 'Marked' : 'Unmarked'})`);
      return next;
    });
  };

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
          <div className="timeline-filters">
            <input
              type="search"
              placeholder="Search timeline"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              value={minConfidence}
              onChange={(event) => setMinConfidence(Number(event.target.value))}
            >
              <option value={0}>All confidence</option>
              <option value={0.6}>Confidence 0.6+</option>
              <option value={0.7}>Confidence 0.7+</option>
              <option value={0.8}>Confidence 0.8+</option>
            </select>
          </div>
          <div className="tag-filter">
            <button
              className={`tag-chip ${activeTag === null ? 'active' : ''}`}
              onClick={() => setActiveTag(null)}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                className={`tag-chip ${activeTag === tag ? 'active' : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="timeline-list">
            {filteredTimeline.map((event) => (
              <button
                className={`timeline-item ${selectedEventId === event.id ? 'active' : ''}`}
                key={event.id}
                onClick={async () => {
                  setSelectedEventId(event.id);
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
                    {highlights[event.id] ? <span className="tag highlight-tag">highlight</span> : null}
                  </div>
                </div>
                <span className="pill">Confidence {event.confidence}</span>
              </button>
            ))}
          </div>
          <div className="tagging-panel">
            <div>
              <h4>Manual tagging</h4>
              <p className="muted">
                {selectedEvent ? `Selected: ${selectedEvent.label}` : 'Select a timeline event.'}
              </p>
            </div>
            <div className="tagging-row">
              <input
                type="text"
                placeholder="Add tag"
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
              />
              <button
                className="btn"
                onClick={() => {
                  addTagToSelected(newTag);
                  setNewTag('');
                }}
                disabled={!selectedEventId || newTag.trim().length === 0}
              >
                Add tag
              </button>
              <button className="btn ghost" onClick={toggleHighlight} disabled={!selectedEventId}>
                {selectedEventId && highlights[selectedEventId] ? 'Unmark highlight' : 'Mark highlight'}
              </button>
            </div>
            <div className="quick-tags">
              {tags.slice(0, 6).map((tag) => (
                <button
                  key={`quick-${tag}`}
                  className="tag-chip"
                  onClick={() => addTagToSelected(tag)}
                  disabled={!selectedEventId}
                >
                  {tag}
                </button>
              ))}
            </div>
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
        <StoryboardList />
      </div>
    </div>
  );
};
