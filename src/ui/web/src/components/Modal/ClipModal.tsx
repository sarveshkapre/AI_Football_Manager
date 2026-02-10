import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../api/mock';
import { useAnnotations } from '../../context/AnnotationsContext';
import { useAudit } from '../../context/AuditContext';
import { useClipContext } from '../../context/ClipContext';
import { useLabels } from '../../context/LabelsContext';
import { useReportContext } from '../../context/ReportContext';
import { useTelestration } from '../../context/TelestrationContext';
import type { Clip, OverlayToggle } from '../../types';
import { downloadFile } from '../../utils/export';
import { Modal, useModalTitleId } from './Modal';

const colors = ['#ff3b3b', '#ffd166', '#00c2ff', '#38b000', '#ffffff'] as const;

const generateStrokeId = () => `stroke-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toNormalized = (event: React.PointerEvent, rect: DOMRect) => {
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
};

export const ClipModal = () => {
  const { clip, closeClip } = useClipContext();
  const { addClip } = useReportContext();
  const { logEvent } = useAudit();
  const { labels, addLabel, removeLabel } = useLabels();
  const { annotations, setAnnotation } = useAnnotations();
  const { strokesByClip, addStroke, undoStroke, clearStrokes } = useTelestration();

  const [detail, setDetail] = useState<Clip | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [localOverlays, setLocalOverlays] = useState<OverlayToggle[]>([]);

  const [tool, setTool] = useState<'freehand' | 'arrow'>('freehand');
  const [strokeColor, setStrokeColor] = useState<(typeof colors)[number]>('#ff3b3b');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [activeStroke, setActiveStroke] = useState<{
    id: string;
    tool: 'freehand' | 'arrow';
    color: string;
    width: number;
    points: Array<{ x: number; y: number }>;
  } | null>(null);

  const titleId = useModalTitleId();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    if (!clip) {
      setDetail(null);
      return;
    }
    api.getClipById(clip.id).then(setDetail);
  }, [clip]);

  useEffect(() => {
    if (!clip) {
      setLocalOverlays([]);
      setActiveStroke(null);
      return;
    }
    const clipDetail = detail ?? clip;
    setLocalOverlays(clipDetail.overlays);
    setActiveStroke(null);
  }, [clip, detail]);

  const clipDetail = clip ? (detail ?? clip) : null;
  const clipId = clipDetail?.id ?? null;
  const clipLabels = clipDetail ? (labels[clipDetail.id] ?? []) : [];
  const clipAnnotation = clipDetail ? (annotations[clipDetail.id] ?? '') : '';
  const strokes = clipDetail ? (strokesByClip[clipDetail.id] ?? []) : [];

  const clipWithOverlays = useMemo(() => {
    if (!clipDetail) {
      return null;
    }
    return {
      ...clipDetail,
      overlays: localOverlays
    };
  }, [clipDetail, localOverlays]);

  useEffect(() => {
    if (!clipDetail) {
      return;
    }
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) {
      return;
    }

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      setStageSize({ width: rect.width, height: rect.height, dpr });
    };

    resize();
    window.addEventListener('resize', resize);

    if (typeof ResizeObserver !== 'function') {
      return () => {
        window.removeEventListener('resize', resize);
      };
    }

    const observer = new ResizeObserver(() => resize());
    observer.observe(stage);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [clipId, clipDetail]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stageSize.width === 0 || stageSize.height === 0) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const drawStroke = (
      stroke: {
        color: string;
        width: number;
        tool: 'freehand' | 'arrow';
        points: Array<{ x: number; y: number }>;
      },
      alpha: number
    ) => {
      if (stroke.points.length < 2) {
        return;
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const toPx = (p: { x: number; y: number }) => ({
        x: p.x * stageSize.width,
        y: p.y * stageSize.height
      });

      const first = toPx(stroke.points[0]);
      ctx.moveTo(first.x, first.y);
      for (const point of stroke.points.slice(1)) {
        const px = toPx(point);
        ctx.lineTo(px.x, px.y);
      }
      ctx.stroke();

      if (stroke.tool === 'arrow') {
        const start = toPx(stroke.points[0]);
        const end = toPx(stroke.points[stroke.points.length - 1]);
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLength = 14 + stroke.width;
        const left = {
          x: end.x - headLength * Math.cos(angle - Math.PI / 6),
          y: end.y - headLength * Math.sin(angle - Math.PI / 6)
        };
        const right = {
          x: end.x - headLength * Math.cos(angle + Math.PI / 6),
          y: end.y - headLength * Math.sin(angle + Math.PI / 6)
        };
        ctx.beginPath();
        ctx.moveTo(left.x, left.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(right.x, right.y);
        ctx.stroke();
      }

      ctx.restore();
    };

    ctx.setTransform(stageSize.dpr, 0, 0, stageSize.dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      drawStroke(stroke, 0.95);
    }
    if (activeStroke) {
      drawStroke(activeStroke, 0.7);
    }
  }, [activeStroke, stageSize.dpr, stageSize.height, stageSize.width, strokes]);

  if (!clip || !clipWithOverlays) {
    return null;
  }

  const handleAdd = () => {
    addClip(clipWithOverlays);
    logEvent('Clip queued', clipWithOverlays.title);
  };

  const handleExport = () => {
    const payload = {
      id: clipWithOverlays.id,
      title: clipWithOverlays.title,
      duration: clipWithOverlays.duration,
      tags: clipWithOverlays.tags,
      overlays: clipWithOverlays.overlays,
      telestration: strokesByClip[clipWithOverlays.id] ?? []
    };
    downloadFile(
      `clip-${clipWithOverlays.id}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );
    logEvent('Clip exported', clipWithOverlays.title);
  };

  const handleAddLabel = () => {
    const label = newLabel.trim();
    if (!label) {
      return;
    }
    addLabel(clipWithOverlays.id, label);
    setNewLabel('');
    logEvent('Label added', `${clipWithOverlays.title} · ${label}`);
  };

  return (
    <Modal open={Boolean(clip)} onClose={closeClip} labelledBy={titleId} initialFocusRef={closeRef}>
      <header className="modal-header">
        <div>
          <p className="eyebrow">Evidence Clip</p>
          <h3 id={titleId}>{clipWithOverlays.title}</h3>
        </div>
        <button className="btn ghost" onClick={closeClip} ref={closeRef}>
          Close
        </button>
      </header>

      <div className="modal-body">
        <div className="video-preview">
          <div className="telestration-toolbar">
            <div className="segment">
              <button
                className={`segment-btn ${tool === 'freehand' ? 'active' : ''}`}
                onClick={() => setTool('freehand')}
              >
                Freehand
              </button>
              <button
                className={`segment-btn ${tool === 'arrow' ? 'active' : ''}`}
                onClick={() => setTool('arrow')}
              >
                Arrow
              </button>
            </div>

            <label className="telestration-control">
              <span className="muted">Color</span>
              <select
                value={strokeColor}
                onChange={(event) => {
                  const next =
                    colors.find((color) => color === event.target.value) ?? colors[0];
                  setStrokeColor(next);
                }}
              >
                {colors.map((value) => (
                  <option key={value} value={value}>
                    {value.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="telestration-control">
              <span className="muted">Width</span>
              <input
                type="range"
                min={2}
                max={10}
                value={strokeWidth}
                onChange={(event) => setStrokeWidth(Number(event.target.value))}
              />
            </label>

            <div className="telestration-actions">
              <button
                className="btn ghost"
                onClick={() => {
                  undoStroke(clipWithOverlays.id);
                  logEvent('Telestration undo', clipWithOverlays.title);
                }}
                disabled={strokes.length === 0}
              >
                Undo
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  clearStrokes(clipWithOverlays.id);
                  logEvent('Telestration cleared', clipWithOverlays.title);
                }}
                disabled={strokes.length === 0}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="video-stage" ref={stageRef}>
            <div className="video-frame"></div>
            <canvas
              ref={canvasRef}
              className="telestration-canvas"
              onPointerDown={(event) => {
                const stage = stageRef.current;
                const canvas = canvasRef.current;
                if (!stage || !canvas) {
                  return;
                }
                const rect = stage.getBoundingClientRect();
                const point = toNormalized(event, rect);
                const next = {
                  id: generateStrokeId(),
                  tool,
                  color: strokeColor,
                  width: strokeWidth,
                  points: tool === 'arrow' ? [point, point] : [point]
                };
                canvas.setPointerCapture(event.pointerId);
                setActiveStroke(next);
              }}
              onPointerMove={(event) => {
                if (!activeStroke) {
                  return;
                }
                const stage = stageRef.current;
                if (!stage) {
                  return;
                }
                const rect = stage.getBoundingClientRect();
                const point = toNormalized(event, rect);
                setActiveStroke((prev) => {
                  if (!prev) {
                    return prev;
                  }
                  if (prev.tool === 'arrow') {
                    return { ...prev, points: [prev.points[0], point] };
                  }
                  const last = prev.points[prev.points.length - 1];
                  const dx = Math.abs(point.x - last.x);
                  const dy = Math.abs(point.y - last.y);
                  if (dx + dy < 0.002) {
                    return prev;
                  }
                  return { ...prev, points: [...prev.points, point].slice(-200) };
                });
              }}
              onPointerUp={(event) => {
                const canvas = canvasRef.current;
                canvas?.releasePointerCapture(event.pointerId);
                if (!activeStroke) {
                  return;
                }
                const enough =
                  activeStroke.tool === 'arrow'
                    ? activeStroke.points.length >= 2 &&
                      Math.abs(activeStroke.points[0].x - activeStroke.points[1].x) +
                        Math.abs(activeStroke.points[0].y - activeStroke.points[1].y) >
                        0.01
                    : activeStroke.points.length >= 2;
                if (enough) {
                  addStroke(clipWithOverlays.id, activeStroke);
                  logEvent('Telestration added', `${clipWithOverlays.title} · ${activeStroke.tool}`);
                }
                setActiveStroke(null);
              }}
              onPointerCancel={(event) => {
                const canvas = canvasRef.current;
                canvas?.releasePointerCapture(event.pointerId);
                setActiveStroke(null);
              }}
            />
          </div>

          <div className="video-meta">
            <span>{clipWithOverlays.duration}</span>
            <span>
              {clipWithOverlays.tags.join(' · ')}
              {strokes.length > 0 ? ` · ${strokes.length} telestration` : ''}
            </span>
          </div>
        </div>

        <div className="overlay-panel">
          <h4>Overlays</h4>
          <div className="overlay-controls">
            {localOverlays.map((overlay) => (
              <label className="toggle" key={overlay.id}>
                <input
                  type="checkbox"
                  checked={overlay.enabled}
                  onChange={(event) =>
                    setLocalOverlays((prev) =>
                      prev.map((item) =>
                        item.id === overlay.id ? { ...item, enabled: event.target.checked } : item
                      )
                    )
                  }
                />
                <span>{overlay.label}</span>
              </label>
            ))}
          </div>

          <div className="clip-notes">
            <h4>Annotations</h4>
            <textarea
              rows={4}
              value={clipAnnotation}
              onChange={(event) => setAnnotation(clipWithOverlays.id, event.target.value)}
              placeholder="Add a coaching note tied to this clip."
            />
          </div>

          <div className="clip-labels">
            <h4>Labels</h4>
            <div className="chip-row">
              {clipLabels.length === 0 ? (
                <span className="muted">No labels yet.</span>
              ) : (
                clipLabels.map((label) => (
                  <button
                    key={label}
                    className="tag-chip"
                    onClick={() => removeLabel(clipWithOverlays.id, label)}
                  >
                    {label}
                  </button>
                ))
              )}
            </div>

            <div className="label-form">
              <input
                type="text"
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                placeholder="Add label"
              />
              <button className="btn" onClick={handleAddLabel} disabled={!newLabel.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="modal-footer">
        <button className="btn" onClick={handleAdd}>
          Add to report
        </button>
        <button className="btn primary" onClick={handleExport}>
          Export clip
        </button>
      </footer>
    </Modal>
  );
};
