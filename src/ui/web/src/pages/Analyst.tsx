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
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';
import { isAnalystTimelineFilters } from '../utils/guards';
import { bumpRecentTags } from '../utils/recentTags';
import type { Clip, MinimapSnapshot, OverlayToggle, PlayerDot, TimelineEvent } from '../types';
import type { AnalystTimelineFilters } from '../types';

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

interface BulkEditUndoSnapshot {
  createdAt: string;
  reason: string;
  timeline: TimelineEvent[];
  highlights: Record<string, boolean>;
  selectedEventIds: string[];
}

const analystFiltersKey = 'afm.analyst.timelineFilters.v1';
const recentTagsKey = 'afm.analyst.recentTags.v1';
const defaultAnalystFilters: AnalystTimelineFilters = {
  query: '',
  activeTag: null,
  minConfidence: 0
};

const isStringArrayGuard = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

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
  const [query, setQuery] = useState(() => {
    const stored = loadFromStorageWithGuard(
      analystFiltersKey,
      defaultAnalystFilters,
      isAnalystTimelineFilters
    );
    return stored.query;
  });
  const [activeTag, setActiveTag] = useState<string | null>(() => {
    const stored = loadFromStorageWithGuard(
      analystFiltersKey,
      defaultAnalystFilters,
      isAnalystTimelineFilters
    );
    return stored.activeTag;
  });
  const [minConfidence, setMinConfidence] = useState(() => {
    const stored = loadFromStorageWithGuard(
      analystFiltersKey,
      defaultAnalystFilters,
      isAnalystTimelineFilters
    );
    return stored.minConfidence;
  });
  const [primaryEventId, setPrimaryEventId] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [removeTag, setRemoveTag] = useState('');
  const [highlights, setHighlights] = useState<Record<string, boolean>>({});
  const [bulkEditUndo, setBulkEditUndo] = useState<BulkEditUndoSnapshot | null>(null);
  const [recentTags, setRecentTags] = useState<string[]>(() =>
    loadFromStorageWithGuard(recentTagsKey, [], isStringArrayGuard)
  );
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

  useEffect(() => {
    saveToStorage(analystFiltersKey, { query, activeTag, minConfidence });
  }, [activeTag, minConfidence, query]);

  useEffect(() => {
    saveToStorage(recentTagsKey, recentTags);
  }, [recentTags]);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    timeline.forEach((event) => event.tags.forEach((tag) => tagSet.add(tag)));
    clips.forEach((clip) => clip.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [timeline, clips]);

  const paletteTags = useMemo(() => {
    const next: string[] = [];
    recentTags.forEach((tag) => {
      const trimmed = tag.trim();
      if (trimmed && !next.includes(trimmed)) {
        next.push(trimmed);
      }
    });
    tags.forEach((tag) => {
      if (next.length >= 9) {
        return;
      }
      if (!next.includes(tag)) {
        next.push(tag);
      }
    });
    return next.slice(0, 9);
  }, [recentTags, tags]);

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
    () => timeline.find((event) => event.id === primaryEventId) ?? null,
    [timeline, primaryEventId]
  );

  const activeSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === activeSnapshotId) ?? null,
    [snapshots, activeSnapshotId]
  );

  const activeSnapshotIndex = useMemo(() => {
    const index = snapshots.findIndex((snapshot) => snapshot.id === activeSnapshotId);
    return index >= 0 ? index : 0;
  }, [snapshots, activeSnapshotId]);

  const signalTrendPoints = useMemo(
    () => signalHistory.map((point) => ({ label: point.minute, value: point.value })),
    [signalHistory]
  );

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

  const selectedTimelineIds = useMemo(() => {
    if (selectedEventIds.length > 0) {
      return selectedEventIds;
    }
    return primaryEventId ? [primaryEventId] : [];
  }, [primaryEventId, selectedEventIds]);

  const addTagToSelected = (tag: string) => {
    const trimmed = tag.trim();
    if (selectedTimelineIds.length === 0 || !trimmed) {
      return;
    }
    let changed = false;
    setTimeline((prev) => {
      const next = prev.map((event) => {
        if (!selectedTimelineIds.includes(event.id) || event.tags.includes(trimmed)) {
          return event;
        }
        changed = true;
        return { ...event, tags: [...event.tags, trimmed] };
      });
      if (changed && selectedTimelineIds.length > 1) {
        setBulkEditUndo({
          createdAt: new Date().toLocaleTimeString(),
          reason: `Added tag "${trimmed}" to ${selectedTimelineIds.length} events`,
          timeline: prev,
          highlights: { ...highlights },
          selectedEventIds: [...selectedTimelineIds]
        });
      }
      return next;
    });
    if (!changed) {
      return;
    }
    logEvent(
      'Timeline tag added',
      selectedTimelineIds.length === 1
        ? `${trimmed} (${selectedTimelineIds[0]})`
        : `${trimmed} (${selectedTimelineIds.length} events)`
    );

    setRecentTags((prev) => bumpRecentTags({ recent: prev, tag: trimmed, cap: 9 }));
  };

  const removeTagFromSelected = (tag: string) => {
    const trimmed = tag.trim();
    if (selectedTimelineIds.length === 0 || !trimmed) {
      return;
    }
    let changed = false;
    setTimeline((prev) => {
      const next = prev.map((event) => {
        if (!selectedTimelineIds.includes(event.id) || !event.tags.includes(trimmed)) {
          return event;
        }
        changed = true;
        return { ...event, tags: event.tags.filter((entry) => entry !== trimmed) };
      });
      if (changed && selectedTimelineIds.length > 1) {
        setBulkEditUndo({
          createdAt: new Date().toLocaleTimeString(),
          reason: `Removed tag "${trimmed}" from ${selectedTimelineIds.length} events`,
          timeline: prev,
          highlights: { ...highlights },
          selectedEventIds: [...selectedTimelineIds]
        });
      }
      return next;
    });
    if (!changed) {
      return;
    }
    logEvent(
      'Timeline tag removed',
      selectedTimelineIds.length === 1
        ? `${trimmed} (${selectedTimelineIds[0]})`
        : `${trimmed} (${selectedTimelineIds.length} events)`
    );
  };

  const toggleHighlight = () => {
    if (selectedTimelineIds.length === 0) {
      return;
    }
    let changed = false;
    setHighlights((prev) => {
      const shouldMark = selectedTimelineIds.some((id) => !prev[id]);
      const next = { ...prev };
      for (const id of selectedTimelineIds) {
        if (next[id] !== shouldMark) {
          changed = true;
        }
        next[id] = shouldMark;
      }
      if (!changed) {
        return prev;
      }
      if (selectedTimelineIds.length > 1) {
        setBulkEditUndo({
          createdAt: new Date().toLocaleTimeString(),
          reason: `${shouldMark ? 'Marked' : 'Unmarked'} highlight on ${selectedTimelineIds.length} events`,
          timeline: [...timeline],
          highlights: { ...prev },
          selectedEventIds: [...selectedTimelineIds]
        });
      }
      logEvent(
        'Timeline highlight',
        selectedTimelineIds.length === 1
          ? `${selectedEvent?.label ?? selectedTimelineIds[0]} (${shouldMark ? 'Marked' : 'Unmarked'})`
          : `${selectedTimelineIds.length} events (${shouldMark ? 'Marked' : 'Unmarked'})`
      );
      return next;
    });
  };

  const undoBulkEdit = () => {
    if (!bulkEditUndo) {
      return;
    }
    setTimeline(bulkEditUndo.timeline);
    setHighlights(bulkEditUndo.highlights);
    setSelectedEventIds(bulkEditUndo.selectedEventIds);
    setPrimaryEventId(bulkEditUndo.selectedEventIds[0] ?? null);
    logEvent('Timeline bulk edit undone', bulkEditUndo.reason);
    setBulkEditUndo(null);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (selectedTimelineIds.length === 0) {
        return;
      }
      const digit = Number(event.key);
      if (!Number.isInteger(digit) || digit <= 0) {
        return;
      }
      const tag = paletteTags[digit - 1];
      if (!tag) {
        return;
      }
      event.preventDefault();
      addTagToSelected(tag);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addTagToSelected, paletteTags, selectedTimelineIds]);

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
            {filteredTimeline.map((timelineEvent) => (
              <button
                className={`timeline-item ${primaryEventId === timelineEvent.id ? 'active' : ''} ${
                  selectedEventIds.includes(timelineEvent.id) ? 'selected' : ''
                }`}
                key={timelineEvent.id}
                onClick={async (mouseEvent) => {
                  const wantsToggle = mouseEvent.metaKey || mouseEvent.ctrlKey;
                  const wantsRange = mouseEvent.shiftKey;

                  if (wantsRange && primaryEventId) {
                    const anchorIndex = filteredTimeline.findIndex(
                      (entry) => entry.id === primaryEventId
                    );
                    const targetIndex = filteredTimeline.findIndex(
                      (entry) => entry.id === timelineEvent.id
                    );
                    if (anchorIndex >= 0 && targetIndex >= 0) {
                      const start = Math.min(anchorIndex, targetIndex);
                      const end = Math.max(anchorIndex, targetIndex);
                      const range = filteredTimeline.slice(start, end + 1).map((entry) => entry.id);
                      setSelectedEventIds(range);
                      return;
                    }
                  }

                  if (wantsToggle) {
                    setPrimaryEventId(timelineEvent.id);
                    setSelectedEventIds((prev) => {
                      const next = prev.includes(timelineEvent.id)
                        ? prev.filter((id) => id !== timelineEvent.id)
                        : [...prev, timelineEvent.id];
                      if (next.length === 0) {
                        setPrimaryEventId(null);
                      }
                      return next;
                    });
                    return;
                  }

                  setPrimaryEventId(timelineEvent.id);
                  setSelectedEventIds([timelineEvent.id]);
                  const clip = await api.getClipById(timelineEvent.clipId);
                  openClip(clip);
                }}
              >
                <div>
                  <p className="eyebrow">{timelineEvent.minute}</p>
                  <h4>{timelineEvent.label}</h4>
                  <div className="tag-row">
                    {timelineEvent.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                    {highlights[timelineEvent.id] ? (
                      <span className="tag highlight-tag">highlight</span>
                    ) : null}
                  </div>
                </div>
                <span className="pill">Confidence {timelineEvent.confidence}</span>
              </button>
            ))}
          </div>
          <div className="tagging-panel">
            <div>
              <h4>Manual tagging</h4>
              <p className="muted">
                {selectedTimelineIds.length === 0
                  ? 'Select timeline events (Cmd/Ctrl-click to multi-select, Shift-click for a range).'
                  : selectedTimelineIds.length === 1
                    ? `Selected: ${selectedEvent?.label ?? selectedTimelineIds[0]}`
                    : `Selected: ${selectedTimelineIds.length} events`}
              </p>
            </div>
            <div className="tagging-row">
              <input
                type="text"
                placeholder="Add tag"
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTagToSelected(newTag);
                    setNewTag('');
                  }
                }}
              />
              <button
                className="btn"
                onClick={() => {
                  addTagToSelected(newTag);
                  setNewTag('');
                }}
                disabled={selectedTimelineIds.length === 0 || newTag.trim().length === 0}
              >
                Add tag
              </button>
              <select value={removeTag} onChange={(event) => setRemoveTag(event.target.value)}>
                <option value="">Remove tag...</option>
                {tags.map((tag) => (
                  <option value={tag} key={`remove-${tag}`}>
                    {tag}
                  </option>
                ))}
              </select>
              <button
                className="btn ghost"
                onClick={() => {
                  removeTagFromSelected(removeTag);
                  setRemoveTag('');
                }}
                disabled={selectedTimelineIds.length === 0 || removeTag.trim().length === 0}
              >
                Remove
              </button>
              <button
                className="btn ghost"
                onClick={toggleHighlight}
                disabled={selectedTimelineIds.length === 0}
              >
                {selectedTimelineIds.length > 0 && selectedTimelineIds.every((id) => highlights[id])
                  ? 'Unmark highlight'
                  : 'Mark highlight'}
              </button>
            </div>
            <div className="quick-tags">
              {paletteTags.map((tag, idx) => (
                <button
                  key={`quick-${tag}-${idx}`}
                  className="tag-chip"
                  onClick={() => addTagToSelected(tag)}
                  disabled={selectedTimelineIds.length === 0}
                >
                  <span className="keycap" aria-hidden="true">
                    {idx + 1}
                  </span>{' '}
                  {tag}
                </button>
              ))}
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Hotkeys: <span className="keycap">Alt</span> + <span className="keycap">1</span>...<span className="keycap">9</span>
            </p>
            <div className="tagging-actions">
              <button className="btn ghost" onClick={undoBulkEdit} disabled={!bulkEditUndo}>
                Undo bulk edit
              </button>
              {bulkEditUndo ? (
                <p className="muted">Last bulk edit ({bulkEditUndo.createdAt}): {bulkEditUndo.reason}</p>
              ) : (
                <p className="muted">Undo becomes available after a multi-select bulk edit.</p>
              )}
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
          <TrendChart title="Signal stability" points={signalTrendPoints} max={100} />
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
