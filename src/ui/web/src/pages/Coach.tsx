import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/mock';
import { DensityToggle } from '../components/DensityToggle';
import { LiveEventFeed } from '../components/LiveEventFeed';
import { SignalBadge } from '../components/SignalBadge';
import { SignalHistory } from '../components/SignalHistory';
import { SectionHeader } from '../components/SectionHeader';
import { StatCard } from '../components/StatCard';
import { TrendChart } from '../components/TrendChart';
import { useAudit } from '../context/AuditContext';
import { useClipContext } from '../context/ClipContext';
import { useReportContext } from '../context/ReportContext';
import { useLiveStore } from '../hooks/useLiveStore';
import type { CoachCard, Clip, OverlayToggle, Recommendation } from '../types';
import { durationToSeconds, formatDuration } from '../utils/time';

const signalTrend = [
  { label: '60', value: 70 },
  { label: '62', value: 78 },
  { label: '64', value: 64 },
  { label: '66', value: 82 },
  { label: '68', value: 74 }
];

const pressureTrend = [
  { label: '60', value: 55 },
  { label: '62', value: 61 },
  { label: '64', value: 58 },
  { label: '66', value: 72 },
  { label: '68', value: 67 }
];

export const Coach = () => {
  const { liveState, moments, updatedAt } = useLiveStore();
  const { openClip } = useClipContext();
  const { addClip } = useReportContext();
  const { logEvent } = useAudit();
  const [cards, setCards] = useState<CoachCard[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [overlays, setOverlays] = useState<OverlayToggle[]>([]);
  const [customIn, setCustomIn] = useState('63:20');
  const [customOut, setCustomOut] = useState('63:35');
  const [lastCapture, setLastCapture] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [cardData, recs, overlayData] = await Promise.all([
        api.getCoachCards(),
        api.getRecommendations(),
        api.getOverlays()
      ]);
      setCards(cardData);
      setRecommendations(recs);
      setOverlays(overlayData);
    };

    load();
  }, []);

  const nowCards = cards.filter((card) => card.type === 'now');
  const nextCards = cards.filter((card) => card.type === 'next');

  const overlayDefaults = useMemo(
    () => overlays.map((overlay) => ({ ...overlay })),
    [overlays]
  );

  const captureClip = (label: string, durationSeconds: number, tags: string[]) => {
    const clip: Clip = {
      id: `live-${Date.now()}`,
      title: label,
      duration: formatDuration(Math.max(durationSeconds, 1)),
      tags,
      overlays: overlayDefaults
    };
    addClip(clip);
    logEvent('Live clip captured', clip.title);
    setLastCapture(`${clip.title} (${clip.duration})`);
  };

  const handleQuickCapture = (seconds: number) => {
    captureClip(`Live clip · last ${seconds}s`, seconds, ['live', 'quick']);
  };

  const handleCustomCapture = () => {
    const start = durationToSeconds(customIn);
    const end = durationToSeconds(customOut);
    const duration = end > start ? end - start : 10;
    captureClip(`Custom clip ${customIn}–${customOut}`, duration, ['live', 'custom']);
  };

  return (
    <div className="page-content">
      <SectionHeader
        title="Coach Mode"
        subtitle="Rapid tactical guidance grounded in evidence."
        action={
          <div className="header-actions">
            <DensityToggle />
            <button className="btn primary">Request Live Clip</button>
          </div>
        }
      />

      <div className="grid two">
        <div className="card surface">
          <div className="card-header">
            <div>
              <p className="eyebrow">Live Match</p>
              <h3>{liveState ? `Minute ${liveState.minute}` : 'Loading...'}</h3>
            </div>
            {liveState ? <SignalBadge signal={liveState.signal} /> : null}
          </div>
          <div className="insights">
            {liveState?.insights.map((insight) => (
              <div key={insight} className="insight">
                <span className="dot"></span>
                <p>{insight}</p>
              </div>
            ))}
          </div>
          <div className="card-meta">
            <span>Confidence {liveState?.confidence ?? '--'}</span>
            <span>{liveState?.clips ?? '--'} supporting clips</span>
          </div>
        </div>

        <div className="card surface dark">
          <div className="card-header">
            <div>
              <p className="eyebrow">Do Next</p>
              <h3>{recommendations[0]?.title ?? 'Loading...'}</h3>
            </div>
            <span className="pill">Confidence {recommendations[0]?.confidence ?? '--'}</span>
          </div>
          <p className="muted">Tradeoff: {recommendations[0]?.tradeoff ?? '--'}</p>
          <div className="clip-row">
            {Array.from({ length: recommendations[0]?.clips ?? 3 }).map((_, index) => (
              <div className="clip" key={`coach-clip-${index}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid three">
        <StatCard label="Evidence clips" value="12" meta="Last 15 minutes" />
        <StatCard label="Now refresh" value="45s" meta={`Last ${updatedAt ? 'sync' : 'update'} `} />
        <StatCard label="Signals" value={liveState?.signal ?? '--'} meta="Tracking stable" />
      </div>

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Now cards" subtitle="Current tactical state." />
          <div className="stack">
            {nowCards.map((card) => (
              <div className="row-card" key={card.id}>
                <div>
                  <h4>{card.title}</h4>
                  <p>{card.detail}</p>
                </div>
                <div className="row-meta">
                  <span>Confidence {card.confidence}</span>
                  <span>{card.clips} clips</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card surface">
          <SectionHeader title="Do next" subtitle="Adjustment options and tradeoffs." />
          <div className="stack">
            {nextCards.map((card) => (
              <div className="row-card" key={card.id}>
                <div>
                  <h4>{card.title}</h4>
                  <p>{card.detail}</p>
                </div>
                <div className="row-meta">
                  <span>Confidence {card.confidence}</span>
                  <span>{card.clips} clips</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid three">
        <div className="card surface">
          <SectionHeader title="Live event feed" subtitle="Latest tactical events and triggers." />
          <LiveEventFeed />
        </div>
        <div className="card surface">
          <SectionHeader title="Signal trend" subtitle="Confidence and pressure proxy." />
          <div className="trend-grid">
            <TrendChart title="Signal quality" points={signalTrend} max={100} />
            <TrendChart title="Press intensity" points={pressureTrend} max={100} />
          </div>
        </div>
        <div className="card surface">
          <SectionHeader title="Signal history" subtitle="Select a time window." />
          <SignalHistory />
        </div>
      </div>

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Fast clipping" subtitle="One-tap capture for key moments." />
          <div className="clip-console">
            <div className="clip-presets">
              {[10, 20, 45].map((seconds) => (
                <button
                  key={seconds}
                  className="btn"
                  onClick={() => handleQuickCapture(seconds)}
                >
                  Last {seconds}s
                </button>
              ))}
            </div>
            <div className="clip-custom">
              <label className="field">
                <span>In</span>
                <input value={customIn} onChange={(event) => setCustomIn(event.target.value)} />
              </label>
              <label className="field">
                <span>Out</span>
                <input value={customOut} onChange={(event) => setCustomOut(event.target.value)} />
              </label>
              <button className="btn primary" onClick={handleCustomCapture}>
                Capture clip
              </button>
            </div>
            {lastCapture ? <p className="muted">Last captured: {lastCapture}</p> : null}
          </div>
        </div>

        <div className="card surface">
          <SectionHeader title="Key moments" subtitle="Tap to replay the latest events." />
          <div className="moment-strip">
            {moments.map((moment) => (
              <button
                className="moment"
                key={moment.id}
                onClick={async () => {
                  const clip = await api.getClipById(moment.clipId);
                  openClip(clip);
                }}
              >
                <h4>{moment.label}</h4>
                <p>{moment.detail}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
