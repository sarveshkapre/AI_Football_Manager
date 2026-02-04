import { useEffect, useState } from 'react';
import { api } from '../api/mock';
import { SignalBadge } from '../components/SignalBadge';
import { SectionHeader } from '../components/SectionHeader';
import { StatCard } from '../components/StatCard';
import { useLiveStore } from '../hooks/useLiveStore';
import type { CoachCard, Recommendation } from '../types';

export const Coach = () => {
  const { liveState, moments, updatedAt } = useLiveStore();
  const [cards, setCards] = useState<CoachCard[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    const load = async () => {
      const [cardData, recs] = await Promise.all([
        api.getCoachCards(),
        api.getRecommendations()
      ]);
      setCards(cardData);
      setRecommendations(recs);
    };

    load();
  }, []);

  const nowCards = cards.filter((card) => card.type === 'now');
  const nextCards = cards.filter((card) => card.type === 'next');

  return (
    <div className="page-content">
      <SectionHeader
        title="Coach Mode"
        subtitle="Rapid tactical guidance grounded in evidence."
        action={<button className="btn primary">Request Live Clip</button>}
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

      <div className="card surface">
        <SectionHeader title="Key moments" subtitle="Tap to replay the latest events." />
        <div className="moment-strip">
          {moments.map((moment) => (
            <div className="moment" key={moment.id}>
              <h4>{moment.label}</h4>
              <p>{moment.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
