import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/mock';
import { Minimap } from '../components/Minimap';
import { SectionHeader } from '../components/SectionHeader';
import { StoryboardList } from '../components/StoryboardList';
import { TrendChart } from '../components/TrendChart';
import { useAudit } from '../context/AuditContext';
import { useClipContext } from '../context/ClipContext';
import { useStoryboards } from '../context/StoryboardContext';
import { useReportContext } from '../context/ReportContext';
import type { Clip, MinimapSnapshot, OverlayToggle, PlayerDot, TimelineEvent } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  confidence?: number;
  reason?: string;
  evidence?: Clip[];
}

interface InsightPack {
  id: string;
  question: string;
  answer: string;
  confidence?: number;
  evidence: Clip[];
  createdAt: string;
}

export const Analyst = () => {
  const { openClip } = useClipContext();
  const { addStoryboard } = useStoryboards();
  const { enqueueClips } = useReportContext();
  const { logEvent } = useAudit();
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [overlays, setOverlays] = useState<OverlayToggle[]>([]);
  const [snapshots, setSnapshots] = useState<MinimapSnapshot[]>([]);
  const [signalHistory, setSignalHistory] = useState<Array<{ minute: string; value: number }>>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selected, setSelected] = useState<Clip[]>([]);
  const [storyboardTitle, setStoryboardTitle] = useState('');
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [minConfidence, setMinConfidence] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [highlights, setHighlights] = useState<Record<string, boolean>>({});
  const [activeSnapshotId, setActiveSnapshotId] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDot | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'ai-intro',
      role: 'ai',
      text: 'Ask about press breaks, overloads, switches, or turnovers to get evidence clips.'
    }
  ]);
  const [insightPacks, setInsightPacks] = useState<InsightPack[]>([]);

  useEffect(() => {
    const load = async () => {
      const [timelineData, overlayData, clipData, minimapData, signalData] = await Promise.all([
        api.getTimeline(),
        api.getOverlays(),
        api.getClips(),
        api.getMinimapSnapshots(),
        api.getSignalHistory()
      ]);
      setTimeline(timelineData);
      setOverlays(overlayData);
      setClips(clipData);
      setSnapshots(minimapData);
      setSignalHistory(signalData);
      if (minimapData.length > 0) {
        setActiveSnapshotId(minimapData[0].id);
      }
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

  const activeSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === activeSnapshotId) ?? null,
    [snapshots, activeSnapshotId]
  );

  const activeSnapshotIndex = useMemo(() => {
    const index = snapshots.findIndex((snapshot) => snapshot.id === activeSnapshotId);
    return index >= 0 ? index : 0;
  }, [snapshots, activeSnapshotId]);

  useEffect(() => {
    if (!activeSnapshotId || snapshots.every((snapshot) => snapshot.id !== activeSnapshotId)) {
      setActiveSnapshotId(snapshots[0]?.id ?? '');
    }
  }, [activeSnapshotId, snapshots]);

  useEffect(() => {
    if (!isPlaying || snapshots.length < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSnapshotId((prev) => {
        const currentIndex = snapshots.findIndex((snapshot) => snapshot.id === prev);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % snapshots.length : 0;
        return snapshots[nextIndex]?.id ?? prev;
      });
    }, 1800);
    return () => window.clearInterval(timer);
  }, [isPlaying, snapshots]);

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

  const quickQuestions = [
    'Where are we overloaded?',
    'Show the last 3 press breaks.',
    'Why can’t we progress centrally?',
    'Where are turnovers happening?'
  ];

  const buildAnswer = (question: string) => {
    const normalized = question.toLowerCase();
    const tagTargets: string[] = [];
    const pushIf = (tokens: string[], tag: string) => {
      if (tokens.some((token) => normalized.includes(token))) {
        tagTargets.push(tag);
      }
    };

    pushIf(['press'], 'press');
    pushIf(['overload'], 'overload');
    pushIf(['switch'], 'switch');
    pushIf(['turnover', 'giveaway'], 'turnover');
    pushIf(['zone 14', 'zone-14', 'central', 'centre', 'centrally'], 'zone-14');
    pushIf(['set piece', 'set-piece', 'corner', 'free kick'], 'set-piece');
    pushIf(['weak side', 'weak-side'], 'weak-side');
    pushIf(['left'], 'left');
    pushIf(['right'], 'right');
    pushIf(['entry'], 'entry');

    const matches =
      tagTargets.length > 0
        ? timeline.filter((event) => event.tags.some((tag) => tagTargets.includes(tag)))
        : timeline;

    const sorted = [...matches].sort((a, b) => b.confidence - a.confidence);
    const evidenceEvents = sorted.slice(0, 3);
    const evidenceClips = Array.from(
      new Map(
        evidenceEvents
          .map((event) => clips.find((clip) => clip.id === event.clipId))
          .filter((clip): clip is Clip => Boolean(clip))
          .map((clip) => [clip.id, clip])
      ).values()
    );

    if (evidenceEvents.length === 0) {
      return {
        text: 'Signal quality is low or off-camera; no evidence clips found for that request.',
        confidence: 0.4,
        reason: 'Low tracking coverage'
      };
    }

    const averageConfidence =
      Math.round(
        (evidenceEvents.reduce((sum, event) => sum + event.confidence, 0) /
          evidenceEvents.length) *
          100
      ) / 100;

    const minutes = evidenceEvents.map((event) => event.minute);
    const side =
      evidenceEvents.some((event) => event.tags.includes('left')) &&
      evidenceEvents.some((event) => event.tags.includes('right'))
        ? 'both flanks'
        : evidenceEvents.some((event) => event.tags.includes('left'))
        ? 'left side'
        : evidenceEvents.some((event) => event.tags.includes('right'))
        ? 'right side'
        : 'central lanes';

    const highlight = evidenceEvents[0]?.label;
    const text = `Found ${evidenceEvents.length} relevant events, mostly on the ${side}. Primary pattern: ${highlight}. Evidence from ${minutes[0]}–${minutes[minutes.length - 1]}.`;

    return {
      text,
      confidence: averageConfidence,
      reason:
        averageConfidence < 0.65
          ? 'Moderate signal; some occlusion in broadcast angle'
          : 'Stable tracking across the segment',
      evidence: evidenceClips
    };
  };

  const askQuestion = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed
    };
    const answer = buildAnswer(trimmed);
    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      text: answer.text,
      confidence: answer.confidence,
      reason: answer.reason,
      evidence: answer.evidence
    };
    setChatMessages((prev) => [...prev, userMessage, aiMessage]);
    setChatInput('');
    logEvent('Ask the match', trimmed);
  };

  const saveInsightPack = (question: string, answer: ChatMessage) => {
    const pack: InsightPack = {
      id: `pack-${Date.now()}`,
      question,
      answer: answer.text,
      confidence: answer.confidence,
      evidence: answer.evidence ?? [],
      createdAt: new Date().toLocaleString()
    };
    setInsightPacks((prev) => [pack, ...prev]);
    logEvent('Insight pack saved', question);
  };

  const addPackToQueue = (pack: InsightPack) => {
    if (pack.evidence.length === 0) {
      return;
    }
    enqueueClips(pack.evidence);
    logEvent('Insight pack queued', pack.question);
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
          <SectionHeader title="Minimap + overlays" subtitle="Broadcast-derived game state preview." />
          <div className="minimap-toolbar">
            <label className="field">
              <span>Snapshot</span>
              <select
                value={activeSnapshotId}
                onChange={(event) => setActiveSnapshotId(event.target.value)}
                disabled={snapshots.length === 0}
              >
                {snapshots.length === 0 ? (
                  <option value="">No snapshots</option>
                ) : (
                  snapshots.map((snapshot) => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {snapshot.label} · {snapshot.minute}
                    </option>
                  ))
                )}
              </select>
            </label>
            <div className="minimap-meta">
              <span className="pill">{activeSnapshot?.phase ?? 'Phase'}</span>
              <span className="pill">{activeSnapshot?.teamShape ?? '--'}</span>
            </div>
          </div>
          <Minimap snapshot={activeSnapshot} onSelectPlayer={(player) => setSelectedPlayer(player)} />
          <div className="minimap-scrub">
            <button className="btn" onClick={() => setIsPlaying((prev) => !prev)}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(0, snapshots.length - 1)}
              value={activeSnapshotIndex}
              onChange={(event) => {
                const index = Number(event.target.value);
                const snapshot = snapshots[index];
                if (snapshot) {
                  setActiveSnapshotId(snapshot.id);
                }
              }}
            />
            <span className="pill">{activeSnapshot?.minute ?? '--'}</span>
          </div>
          <div className="minimap-footer">
            <div>
              <p className="eyebrow">Possession</p>
              <h4>{activeSnapshot?.inPossession ?? '--'}</h4>
            </div>
            <div>
              <p className="eyebrow">Minute</p>
              <h4>{activeSnapshot?.minute ?? '--'}</h4>
            </div>
            <div>
              <p className="eyebrow">Selected</p>
              <h4>
                {selectedPlayer
                  ? `${selectedPlayer.team.toUpperCase()} · ${selectedPlayer.id}`
                  : 'None'}
              </h4>
            </div>
          </div>
          <div className="overlay-controls">
            {overlays.map((overlay) => (
              <label className="toggle" key={overlay.id}>
                <input type="checkbox" defaultChecked={overlay.enabled} />
                <span>{overlay.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card surface">
          <SectionHeader
            title="Signal quality"
            subtitle="Confidence trend over the last 6 minutes."
          />
          <TrendChart title="Signal stability" points={signalHistory} max={100} />
        </div>
        <div className="card surface">
          <SectionHeader
            title="Snapshot cues"
            subtitle="Minimap selection tied to tactical phase."
          />
          <div className="stack">
            {snapshots.map((snapshot) => (
              <button
                key={snapshot.id}
                className={`row-card ${snapshot.id === activeSnapshotId ? 'active' : ''}`}
                onClick={() => {
                  setActiveSnapshotId(snapshot.id);
                  setIsPlaying(false);
                }}
              >
                <div>
                  <h4>{snapshot.label}</h4>
                  <p>{snapshot.phase}</p>
                </div>
                <span className="pill">{snapshot.minute}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Ask the match" subtitle="Evidence-backed answers in seconds." />
          <div className="chat">
            <div className="chat-quick">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  className="tag-chip"
                  onClick={() => askQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
            {chatMessages.map((message, index) => (
              <div key={message.id} className={`chat-bubble ${message.role}`}>
                <p>{message.text}</p>
                {message.confidence !== undefined ? (
                  <div className="chat-meta">
                    <span className="pill">Confidence {message.confidence}</span>
                    {message.reason ? <span className="muted">{message.reason}</span> : null}
                  </div>
                ) : null}
                {message.evidence && message.evidence.length > 0 ? (
                  <div className="chat-evidence">
                    {message.evidence.map((clip) => (
                      <button
                        key={clip.id}
                        className="chat-chip"
                        onClick={() => openClip(clip)}
                      >
                        <span>{clip.title}</span>
                        <span className="pill">{clip.duration}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {message.role === 'ai' && message.evidence ? (
                  <button
                    className="btn ghost"
                    onClick={() => {
                      const prevMessage = chatMessages[index - 1];
                      if (prevMessage?.role === 'user') {
                        saveInsightPack(prevMessage.text, message);
                      }
                    }}
                  >
                    Save insight pack
                  </button>
                ) : null}
              </div>
            ))}
            <div className="chat-input">
              <input
                type="text"
                placeholder="Ask a tactical question..."
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    askQuestion(chatInput);
                  }
                }}
              />
              <button className="btn primary" onClick={() => askQuestion(chatInput)}>
                Ask
              </button>
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

      <div className="card surface">
        <SectionHeader title="Insight packs" subtitle="Saved answers with evidence." />
        {insightPacks.length === 0 ? (
          <p className="muted">Save answers from Ask the match to build packs.</p>
        ) : (
          <div className="pack-list">
            {insightPacks.map((pack) => (
              <div className="pack-item" key={pack.id}>
                <div>
                  <p className="eyebrow">{pack.createdAt}</p>
                  <h4>{pack.question}</h4>
                  <p className="muted">{pack.answer}</p>
                  <div className="pack-clips">
                    {pack.evidence.map((clip) => (
                      <button
                        key={clip.id}
                        className="tag-chip"
                        onClick={() => openClip(clip)}
                      >
                        {clip.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pack-actions">
                  {pack.confidence !== undefined ? (
                    <span className="pill">Confidence {pack.confidence}</span>
                  ) : null}
                  <button className="btn" onClick={() => addPackToQueue(pack)}>
                    Add to report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
