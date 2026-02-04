import { SectionHeader } from '../components/SectionHeader';

export const Settings = () => (
  <div className="page-content">
    <SectionHeader title="Settings" subtitle="Roles, permissions, and system defaults." />

    <div className="grid two">
      <div className="card surface">
        <SectionHeader title="Roles" subtitle="Coach vs analyst access." />
        <div className="stack">
          <div className="row-card">
            <div>
              <h4>Coach view</h4>
              <p>Now/Do Next cards, key moments, evidence clips.</p>
            </div>
            <span className="pill">Enabled</span>
          </div>
          <div className="row-card">
            <div>
              <h4>Analyst view</h4>
              <p>Timeline, overlays, tagging, and report builder.</p>
            </div>
            <span className="pill">Enabled</span>
          </div>
        </div>
      </div>
      <div className="card surface">
        <SectionHeader title="Signal quality" subtitle="Confidence gating defaults." />
        <div className="stack">
          <div className="row-card">
            <div>
              <h4>Low-signal suppression</h4>
              <p>Reduce prescriptive guidance when signal is low.</p>
            </div>
            <span className="pill">On</span>
          </div>
          <div className="row-card">
            <div>
              <h4>Clip evidence requirement</h4>
              <p>Block recommendations without supporting clips.</p>
            </div>
            <span className="pill">On</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
