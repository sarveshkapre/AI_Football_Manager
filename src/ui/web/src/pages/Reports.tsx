import { useEffect, useState } from 'react';
import { api } from '../api/mock';
import { SectionHeader } from '../components/SectionHeader';
import type { ReportItem } from '../types';

export const Reports = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    api.getReports().then(setReports);
  }, []);

  return (
    <div className="page-content">
      <SectionHeader
        title="Reports"
        subtitle="Evidence-backed packs ready for staff review."
        action={<button className="btn primary">New report</button>}
      />

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Recent reports" />
          <div className="report-list">
            {reports.map((report) => (
              <div className="report-row" key={report.id}>
                <div>
                  <h4>{report.title}</h4>
                  <p>{report.updated}</p>
                </div>
                <span className={`pill ${report.status === 'Ready' ? 'pill-ready' : ''}`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="card surface">
          <SectionHeader title="Export formats" subtitle="Presentation packs and data files." />
          <div className="export-grid">
            <div className="export-card">
              <h4>Coach pack</h4>
              <p>Clips + overlays + summary PDF.</p>
              <button className="btn">Generate</button>
            </div>
            <div className="export-card">
              <h4>Analyst data</h4>
              <p>Tags, clips, JSON/CSV export.</p>
              <button className="btn">Download</button>
            </div>
            <div className="export-card">
              <h4>Broadcast pack</h4>
              <p>Studio-ready sequence with graphics.</p>
              <button className="btn">Render</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
