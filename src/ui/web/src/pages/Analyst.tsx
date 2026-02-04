import { useEffect, useState } from 'react';
import { api } from '../api/mock';
import { SectionHeader } from '../components/SectionHeader';
import type { OverlayToggle, TimelineEvent } from '../types';

export const Analyst = () => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [overlays, setOverlays] = useState<OverlayToggle[]>([]);

  useEffect(() => {
    const load = async () => {
      const [timelineData, overlayData] = await Promise.all([
        api.getTimeline(),
        api.getOverlays()
      ]);
      setTimeline(timelineData);
      setOverlays(overlayData);
    };

    load();
  }, []);

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
              <div className="timeline-item" key={event.id}>
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
              </div>
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
          <SectionHeader title="Storyboards" subtitle="Build a clip reel fast." />
          <div className="storyboard">
            <div className="story-card">
              <h4>Press escapes</h4>
              <p>3 clips · 46s total</p>
            </div>
            <div className="story-card">
              <h4>Weak-side overloads</h4>
              <p>4 clips · 58s total</p>
            </div>
            <div className="story-card">
              <h4>Zone 14 turnovers</h4>
              <p>2 clips · 22s total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
