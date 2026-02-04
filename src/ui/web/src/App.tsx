import { useEffect, useMemo, useState } from 'react';
import {
  analystHighlights,
  coachHighlights,
  evidenceCards,
  liveStates,
  metrics,
  recommendations,
  roadmap
} from './data';

type Mode = 'coach' | 'analyst';

const navLinks = [
  { id: 'product', label: 'Product' },
  { id: 'modes', label: 'Modes' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'roadmap', label: 'Roadmap' }
];

const stateRefreshMs = 45000;

export default function App() {
  const [mode, setMode] = useState<Mode>('coach');
  const [stateIndex, setStateIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStateIndex((prev) => (prev + 1) % liveStates.length);
    }, stateRefreshMs);

    return () => window.clearInterval(interval);
  }, []);

  const liveState = liveStates[stateIndex];
  const signalClass = liveState.signal.toLowerCase();

  const modeCopy = useMemo(
    () =>
      mode === 'coach'
        ? {
            title: 'Coach Mode',
            summary: 'Instant context, clear options, and confidence-based guidance.',
            bullets: [
              'Now cards refresh every 30-60 seconds',
              'Do next options with tradeoffs',
              'Key moments strip for rapid replay'
            ],
            highlights: coachHighlights
          }
        : {
            title: 'Analyst Mode',
            summary: 'Build narrative fast with timelines, overlays, and evidence-linked chat.',
            bullets: analystHighlights,
            highlights: [
              { title: 'Timeline highlights shifts and phases', meta: 'Auto-tagged' },
              { title: 'Overlay grid with evidence trails', meta: 'Export-ready' }
            ]
          },
    [mode]
  );

  return (
    <div className="page">
      <header className="nav reveal" style={{ ['--delay' as const]: '0.05s' }}>
        <div className="brand">
          <div className="brand-mark" />
          <span>AI Football Manager</span>
        </div>
        <nav className="nav-links" aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.id} href={`#${link.id}`}>
              {link.label}
            </a>
          ))}
        </nav>
        <button className="btn ghost">Request Demo</button>
      </header>

      <main>
        <section className="hero" id="product">
          <div className="hero-text reveal" style={{ ['--delay' as const]: '0.1s' }}>
            <p className="kicker">Broadcast-video-first tactical copilot</p>
            <h1>Decision support that feels like a world-class analyst on the bench.</h1>
            <p className="lead">
              AI Football Manager watches broadcast video, builds a live game-state model, and
              delivers coach-ready tactical diagnosis with evidence, clips, and confidence.
            </p>
            <div className="hero-actions">
              <button className="btn primary">Request Demo</button>
              <button className="btn">View Coach Mode</button>
            </div>
            <div className="hero-badges">
              <span>Evidence-first</span>
              <span>Signal quality gating</span>
              <span>Coach-ready outputs</span>
            </div>
          </div>
          <div className="hero-surface reveal" style={{ ['--delay' as const]: '0.2s' }}>
            <div className="surface-header">
              <span>Live Match - {liveState.minute}</span>
              <span className={`badge ${signalClass}`}>Signal {liveState.signal}</span>
            </div>
            <div className="surface-body">
              <div className="card">
                <p className="card-title">Now</p>
                <ul className="card-list">
                  {liveState.insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
                <div className="card-meta">
                  <span>Confidence {liveState.confidence}</span>
                  <span>{liveState.clips} supporting clips</span>
                </div>
              </div>
              <div className="card dark">
                <p className="card-title">Do next</p>
                <p className="card-subtitle">{recommendations[0].title}</p>
                <div className="chip-row">
                  <span className="chip">Tradeoff: {recommendations[0].tradeoff}</span>
                  <span className="chip">Confidence {recommendations[0].confidence}</span>
                </div>
                <div className="clip-strip">
                  {Array.from({ length: recommendations[0].clips }).map((_, index) => (
                    <div className="clip" key={`clip-${index}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="modes">
          <div className="section-head reveal" style={{ ['--delay' as const]: '0.1s' }}>
            <h2>Two modes, one shared truth.</h2>
            <p>
              Coach Mode is built for speed. Analyst Mode is built for depth. Both are grounded in
              the same evidence and signal quality indicators.
            </p>
          </div>
          <div className="mode-toggle reveal" style={{ ['--delay' as const]: '0.15s' }}>
            <button
              className={`tab ${mode === 'coach' ? 'active' : ''}`}
              onClick={() => setMode('coach')}
            >
              Coach Mode
            </button>
            <button
              className={`tab ${mode === 'analyst' ? 'active' : ''}`}
              onClick={() => setMode('analyst')}
            >
              Analyst Mode
            </button>
          </div>
          <div className="mode-panels reveal" style={{ ['--delay' as const]: '0.2s' }}>
            <div className="panel">
              <div className="panel-text">
                <h3>{modeCopy.title}</h3>
                <p>{modeCopy.summary}</p>
                <ul>
                  {modeCopy.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
              <div className="panel-visual">
                {modeCopy.highlights.map((highlight) => (
                  <div className="mini-card" key={highlight.title}>
                    <p>{highlight.title}</p>
                    <span>{highlight.meta}</span>
                  </div>
                ))}
                {mode === 'analyst' && (
                  <div className="timeline">
                    <div className="tick"></div>
                    <div className="tick"></div>
                    <div className="tick highlight"></div>
                    <div className="tick"></div>
                  </div>
                )}
                {mode === 'analyst' && (
                  <div className="overlay-grid">
                    <div className="overlay"></div>
                    <div className="overlay"></div>
                    <div className="overlay"></div>
                    <div className="overlay"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="evidence">
          <div className="section-head reveal" style={{ ['--delay' as const]: '0.1s' }}>
            <h2>Evidence-first by design.</h2>
            <p>Every recommendation is grounded in clips and overlays with explicit confidence.</p>
          </div>
          <div className="evidence-grid">
            {evidenceCards.map((card, index) => (
              <div
                className="evidence-card reveal"
                style={{ ['--delay' as const]: `${0.1 + index * 0.08}s` }}
                key={card.title}
              >
                <h4>{card.title}</h4>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section metrics">
          {metrics.map((metric, index) => (
            <div
              className="metric reveal"
              style={{ ['--delay' as const]: `${0.1 + index * 0.08}s` }}
              key={metric.value}
            >
              <h3>{metric.value}</h3>
              <p>{metric.label}</p>
            </div>
          ))}
        </section>

        <section className="section" id="roadmap">
          <div className="section-head reveal" style={{ ['--delay' as const]: '0.1s' }}>
            <h2>Roadmap</h2>
            <p>From broadcast uploads to live tactical collaboration.</p>
          </div>
          <div className="roadmap">
            {roadmap.map((step, index) => (
              <div
                className="roadmap-step reveal"
                style={{ ['--delay' as const]: `${0.12 + index * 0.08}s` }}
                key={step.stage}
              >
                <span className="stage">{step.stage}</span>
                <p>{step.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer reveal" style={{ ['--delay' as const]: '0.1s' }}>
        <p>AI Football Manager - evidence-first tactical decision support.</p>
        <button className="btn ghost">Contact</button>
      </footer>
    </div>
  );
}
