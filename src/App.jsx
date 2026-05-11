import { useState, useRef, useEffect, useCallback } from "react";

const BODY_IMG = "data:image/jpeg;base64,/9j/4RH0RXhpZgAATU0AKgAAAAgABgESAAMAAAABAAEAAAEaAAUA";
const HAND_IMG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAQDAwMDAgQDAwMEBAQF";
const MOUTH_IMG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQU";
const EAR_IMG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGB";
const NOSE_IMG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUG";

// 72-hour exponential decay window. Acute mitochondrial response peaks 3-6h
// post-treatment and largely fades by 24-48h, gone by ~72h. Half-life ~18h
// so a session is at full intensity at t=0, ~50% at 18h, ~25% at 36h, ~6% at 72h.
const FADE_HOURS = 72;
const HALF_LIFE_HOURS = 18;

// decayFactor(timestamp) returns a value in [0, 1]. Returns 0 once we're past FADE_HOURS.
function decayFactor(ts) {
  const hours = (Date.now() - ts) / 3600000;
  if (hours >= FADE_HOURS) return 0;
  return Math.exp(-hours * Math.LN2 / HALF_LIFE_HOURS);
}

// Anatomical hand bounding boxes on the BODY display, measured from the source image.
// FRONT view: viewer faces person, mirrored — your LEFT hand on viewer's RIGHT.
// BACK view: viewer faces person's back — your LEFT hand on viewer's LEFT (same side).
const HAND_BODY_BBOX = {
  "hand-left-palm": { bodyView: "front", x1: 153, y1: 249, x2: 186, y2: 286 },
  "hand-right-palm": { bodyView: "front", x1: 24, y1: 249, x2: 51, y2: 286 },
  "hand-left-back": { bodyView: "back", x1: 157, y1: 249, x2: 186, y2: 286 },
  "hand-right-back": { bodyView: "back", x1: 23, y1: 249, x2: 51, y2: 286 },
};

// The hand image inside the hand panel: fills ~86% of width (centered), ~92% of height
// (top to bottom), with fingers at TOP and wrist at BOTTOM.
const HAND_IMG_BBOX_IN_PANEL = {
  xMin: 0.07, xMax: 0.93,
  yMin: 0.04, yMax: 0.96,
};

// Project a click position on a hand panel to the corresponding (x, y) on the body view.
// Returns { bodyView, x, y } or null if the projection fails.
function projectHandClickToBody(handView, panelX, panelY, isMirrored) {
  const bbox = HAND_BODY_BBOX[handView];
  if (!bbox) return null;
  const ib = HAND_IMG_BBOX_IN_PANEL;

  const HAND_W = 210;
  const HAND_H = 380;
  const imgPanelX = isMirrored ? (HAND_W - panelX) : panelX;
  const fracX = (imgPanelX / HAND_W - ib.xMin) / (ib.xMax - ib.xMin);
  const fracY = (panelY / HAND_H - ib.yMin) / (ib.yMax - ib.yMin);

  const bodyX = bbox.x1 + fracX * (bbox.x2 - bbox.x1);
  const bodyY = bbox.y2 - fracY * (bbox.y2 - bbox.y1);
  return { bodyView: bbox.bodyView, x: bodyX, y: bodyY };
}

const STORAGE_KEY = "celluma-v18";
const DISPLAY_H = 500;
const DISPLAY_W = 210;

// Heat map color stops sampled from reference: blue → green → yellow → orange → red
const HEAT_STOPS = [
  { t: 0.0, rgb: [29, 72, 119] }, // deep blue (low)
  { t: 0.25, rgb: [27, 138, 90] }, // green
  { t: 0.5, rgb: [251, 176, 33] }, // yellow
  { t: 0.75, rgb: [246, 136, 56] }, // orange
  { t: 1.0, rgb: [238, 62, 50] }, // red (saturated)
];

const SATURATION_JOULES = 30;

function interpColor(t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const a = HEAT_STOPS[i], b = HEAT_STOPS[i + 1];
    if (t >= a.t && t <= b.t) {
      const localT = (t - a.t) / (b.t - a.t);
      const r = Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * localT);
      const g = Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * localT);
      const blu = Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * localT);
      return [r, g, blu];
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length - 1].rgb;
}

function exposureToColor(joules) {
  if (joules <= 0) return null;
  const t = Math.min(1, joules / SATURATION_JOULES);
  const [r, g, b] = interpColor(t);
  const alpha = Math.min(0.88, 0.3 + t * 0.55);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

const DEVICES = {
  celluma: {
    name: "Celluma PRO",
    shape: "rect",
    long: 75, short: 50,
    irradiance: 22,
    sessionMinutes: 30,
    fluencePerSession: 8,
    rotatable: true,
    description: "16″ × 8″ flexible panel · 22 mW/cm² · 30 min · 8 J/cm² per session",
  },
  pod: {
    name: "Celluma POD",
    shape: "rect",
    long: 35, short: 22,
    irradiance: 35,
    sessionMinutes: 30,
    fluencePerSession: 6,
    rotatable: true,
    description: "4.4″ × 2.75″ portable · 30 min · 6 J/cm² per session",
  },
  torch: {
    name: "Hooga Torch",
    shape: "circle",
    radius: 5,
    irradiance: 120,
    sessionMinutes: 3,
    fluencePerSession: 22,
    rotatable: false,
    description: "1.25″ precision spot · 120 mW/cm² · 3 min · 22 J/cm² per session",
  },
  theraface: {
    name: "TheraFace Glow",
    shape: "ellipse",
    rx: 20, ry: 28,
    irradiance: 87,
    sessionMinutes: 12,
    fluencePerSession: 15,
    rotatable: true,
    description: "5″ × 7″ mask · 87 mW/cm² · 12 min · ~15 J/cm² per session",
  },
};

function pointInRotatedRect(px, py, rx, ry, rw, rh, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = rx + rw / 2, cy = ry + rh / 2;
  const dx = px - cx, dy = py - cy;
  const lx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
  const ly = dx * Math.sin(-rad) + dy * Math.cos(-rad);
  return Math.abs(lx) <= rw / 2 && Math.abs(ly) <= rh / 2;
}

function pointInCircle(px, py, cx, cy, r) {
  const dx = px - cx, dy = py - cy;
  return dx*dx + dy*dy <= r*r;
}

function pointInRotatedEllipse(px, py, cx, cy, rx, ry, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = px - cx, dy = py - cy;
  const lx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
  const ly = dx * Math.sin(-rad) + dy * Math.cos(-rad);
  return (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1;
}

function sessionContains(s, px, py) {
  const dev = DEVICES[s.device];
  if (!dev) return false;
  const sView = s.view || s.side;
  const d = scaledDeviceDims(dev, sView);
  if (d.shape === "rect") return pointInRotatedRect(px, py, s.x, s.y, d.short, d.long, s.angle || 0);
  if (d.shape === "circle") return pointInCircle(px, py, s.x, s.y, d.radius);
  if (d.shape === "ellipse") return pointInRotatedEllipse(px, py, s.x, s.y, d.rx, d.ry, s.angle || 0);
  return false;
}

function renderHeatmap(sessions, view) {
  const canvas = document.createElement("canvas");
  canvas.width = DISPLAY_W; canvas.height = DISPLAY_H;
  const ctx = canvas.getContext("2d");
  const step = 3;

  const isBodyView = view === "front" || view === "back";
  const handShadows = [];
  if (isBodyView) {
    for (const s of sessions) {
      if (!s.view || !s.view.startsWith("hand-")) continue;
      const sDev = DEVICES[s.device];
      if (!sDev) continue;
      const handDev = scaledDeviceDims(sDev, s.view);
      const cx = handDev.shape === "rect" ? s.x + handDev.short / 2 : s.x;
      const cy = handDev.shape === "rect" ? s.y + handDev.long / 2 : s.y;
      const isMirrored = s.view.startsWith("hand-left-");
      const proj = projectHandClickToBody(s.view, cx, cy, isMirrored);
      if (!proj || proj.bodyView !== view) continue;
      const decay = decayFactor(s.timestamp);
      if (decay <= 0) continue;
      const sessionJoules = DEVICES[s.device]?.fluencePerSession || 0;
      handShadows.push({ x: proj.x, y: proj.y, joules: decay * sessionJoules });
    }
  }

  for (let y = 0; y < DISPLAY_H; y += step) {
    for (let x = 0; x < DISPLAY_W; x += step) {
      let totalJoules = 0;
      for (const s of sessions) {
        const sView = s.view || s.side;
        if (sView !== view) continue;
        const decay = decayFactor(s.timestamp);
        if (decay > 0 && sessionContains(s, x, y)) {
          const sessionJoules = DEVICES[s.device]?.fluencePerSession || 0;
          totalJoules += decay * sessionJoules;
        }
      }
      for (const sh of handShadows) {
        const dx = x - sh.x, dy = y - sh.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const falloff = Math.max(0, 1 - dist / 4);
        if (falloff > 0) totalJoules += sh.joules * falloff;
      }
      if (totalJoules > 0) {
        const color = exposureToColor(totalJoules);
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, step, step);
        }
      }
    }
  }
  return canvas.toDataURL();
}

function BodyPanel({ side, sessions, onLog, onMoveSession, onDeleteSession, panelAngle, draggingId, onDragStart, onDragEnd, activeDevice }) {
  const containerRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [heatmapUrl, setHeatmapUrl] = useState(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    setHeatmapUrl(renderHeatmap(sessions, side));
  }, [sessions, side]);

  const dev = DEVICES[activeDevice];

  const getCoords = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const startDragForSession = (sessionId, clientX, clientY) => {
    const s = sessions.find(x => x.id === sessionId);
    if (!s) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    dragOffset.current = { dx: x - s.x, dy: y - s.y };
    onDragStart(sessionId);
  };

  const handleClick = (e) => {
    if (draggingId) return;
    const { x, y } = getCoords(e);
    const session = {
      id: Date.now(), device: activeDevice,
      angle: dev.rotatable ? panelAngle : 0,
      view: side, side, timestamp: Date.now(),
    };
    if (dev.shape === "rect") { session.x = x - dev.short / 2; session.y = y - dev.long / 2; }
    else if (dev.shape === "circle") { session.x = x; session.y = y; }
    else if (dev.shape === "ellipse") { session.x = x; session.y = y; }
    onLog(session);
  };

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      onMoveSession(draggingId, cx - rect.left - dragOffset.current.dx, cy - rect.top - dragOffset.current.dy);
    };
    const onUp = () => onDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [draggingId, onMoveSession, onDragEnd]);

  const mySessions = sessions.filter(s => (s.view || s.side) === side);
  const outlineColor = "rgba(255,255,255,0.8)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 10, letterSpacing: 3, color: "#6aaccc", fontFamily: "monospace" }}>
        {side === "front" ? "ANTERIOR" : "POSTERIOR"}
      </div>
      <div
        ref={containerRef}
        onClick={handleClick}
        onMouseMove={(e) => { if (!draggingId) setHover(getCoords(e)); }}
        onMouseLeave={() => setHover(null)}
        style={{
          position: "relative", width: DISPLAY_W, height: DISPLAY_H,
          cursor: draggingId ? "grabbing" : "crosshair",
          overflow: "hidden", borderRadius: 8, flexShrink: 0, userSelect: "none",
        }}
      >
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: DISPLAY_W, height: DISPLAY_H,
          backgroundImage: `url(${BODY_IMG})`,
          backgroundSize: `${DISPLAY_W * 2}px ${DISPLAY_H}px`,
          backgroundPosition: side === "front" ? "-18px 0px" : `-${DISPLAY_W - 5}px 0px`,
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
          userSelect: "none",
        }} />
        {heatmapUrl && (
          <img src={heatmapUrl} alt="" style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            mixBlendMode: "multiply", pointerEvents: "none", opacity: 0.95,
          }} />
        )}
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {mySessions.slice(-50).map((s) => {
            const sDev = DEVICES[s.device];
            const decay = decayFactor(s.timestamp);
            const isActive = s.id === draggingId;
            const stroke = isActive ? "rgba(255,255,255,1)" : `rgba(255,255,255,${(decay * 0.5).toFixed(2)})`;
            const sw = isActive ? 2 : 1;

            if (sDev.shape === "rect") {
              const cx = s.x + sDev.short / 2, cy = s.y + sDev.long / 2;
              return (
                <rect key={s.id} x={s.x} y={s.y} width={sDev.short} height={sDev.long}
                  fill="none" stroke={stroke} strokeWidth={sw}
                  strokeDasharray={isActive ? "none" : "4,2"} rx={2}
                  transform={`rotate(${s.angle || 0},${cx},${cy})`}
                />
              );
            } else if (sDev.shape === "circle") {
              return (
                <circle key={s.id} cx={s.x} cy={s.y} r={sDev.radius}
                  fill="none" stroke={stroke} strokeWidth={sw}
                  strokeDasharray={isActive ? "none" : "2,1.5"}
                />
              );
            } else if (sDev.shape === "ellipse") {
              return (
                <ellipse key={s.id} cx={s.x} cy={s.y} rx={sDev.rx} ry={sDev.ry}
                  fill="none" stroke={stroke} strokeWidth={sw}
                  strokeDasharray={isActive ? "none" : "4,2"}
                  transform={`rotate(${s.angle || 0},${s.x},${s.y})`}
                />
              );
            }
            return null;
          })}
          {hover && !draggingId && (() => {
            const ghost = "rgba(255,255,255,0.9)";
            const ghostFill = "rgba(255,255,255,0.15)";
            if (dev.shape === "rect") {
              return (
                <rect x={hover.x - dev.short / 2} y={hover.y - dev.long / 2}
                  width={dev.short} height={dev.long}
                  fill={ghostFill} stroke={ghost} strokeWidth="1.5"
                  strokeDasharray="5,3" rx={2}
                  transform={`rotate(${panelAngle},${hover.x},${hover.y})`} />
              );
            } else if (dev.shape === "circle") {
              return (
                <circle cx={hover.x} cy={hover.y} r={dev.radius}
                  fill={ghostFill} stroke={ghost} strokeWidth="1.5" strokeDasharray="2,1.5" />
              );
            } else if (dev.shape === "ellipse") {
              return (
                <ellipse cx={hover.x} cy={hover.y} rx={dev.rx} ry={dev.ry}
                  fill={ghostFill} stroke={ghost} strokeWidth="1.5" strokeDasharray="5,3"
                  transform={`rotate(${panelAngle},${hover.x},${hover.y})`} />
              );
            }
            return null;
          })()}
        </svg>
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {mySessions.slice(-50).map((s) => {
            const sDev = DEVICES[s.device];
            const cx = sDev.shape === "rect" ? s.x + sDev.short / 2 : s.x;
            const cy = sDev.shape === "rect" ? s.y + sDev.long / 2 : s.y;
            const decay = decayFactor(s.timestamp);
            if (decay <= 0) return null;
            const isActive = s.id === draggingId;
            const baseR = 2.5;
            const r = isActive ? baseR + 1.5 : baseR;
            const sw = isActive ? 1.8 : 1.2;
            return (
              <g key={"h-" + s.id} style={{ pointerEvents: "all", cursor: "grab" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  startDragForSession(s.id, e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  const t = e.touches[0];
                  startDragForSession(s.id, t.clientX, t.clientY);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteSession) onDeleteSession(s.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onDeleteSession) onDeleteSession(s.id);
                }}
              >
                <circle cx={cx} cy={cy} r={Math.max(r + 4, 8)} fill="rgba(0,0,0,0.001)" />
                <circle cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.85)"}
                  strokeWidth={sw}
                />
                <circle cx={cx} cy={cy} r={0.8}
                  fill="rgba(255,255,255,0.85)"
                />
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ fontSize: 9, color: "#2a5a70", letterSpacing: 1, fontFamily: "monospace" }}>
        click anywhere to place · drag dot to adjust · double-click dot to remove
      </div>
    </div>
  );
}

function DeviceSelector({ active, onChange }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6,
      padding: "10px 12px",
      background: "rgba(0,40,70,0.35)",
      border: "1px solid rgba(0,140,190,0.2)",
      borderRadius: 10, width: "100%", maxWidth: 520, marginBottom: 8,
    }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: "#5a9abf", fontFamily: "monospace" }}>
        DEVICE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {Object.entries(DEVICES).map(([key, dev]) => {
          const isActive = active === key;
          return (
            <button key={key} onClick={() => onChange(key)} style={{
              padding: "8px 10px",
              background: isActive ? "rgba(0,200,255,0.18)" : "rgba(0,30,50,0.4)",
              border: `1.5px solid ${isActive ? "#00c8ff" : "rgba(0,80,120,0.3)"}`,
              borderRadius: 6, cursor: "pointer",
              color: isActive ? "#00c8ff" : "#7aa0bb",
              fontFamily: "monospace", textAlign: "left",
              boxShadow: isActive ? "0 0 10px rgba(0,200,255,0.25)" : "none",
              transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 12, fontWeight: "bold", letterSpacing: 0.5 }}>
                {dev.name}
              </div>
              <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>
                {dev.fluencePerSession} J/cm² · {dev.sessionMinutes} min
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RotationControl({ angle, onChange, disabled }) {
  const options = [
    { a: 0, sym: "↕", label: "Vertical" },
    { a: 90, sym: "↔", label: "Horizontal" },
    { a: 45, sym: "↗", label: "Diagonal" },
    { a: 135, sym: "↘", label: "Diagonal" },
  ];
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 6,
      padding: "8px 12px",
      background: "rgba(0,50,80,0.25)",
      border: "1px solid rgba(0,140,190,0.18)",
      borderRadius: 10,
      width: "100%", maxWidth: 520,
      marginBottom: 16,
      opacity: disabled ? 0.4 : 1,
    }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: "#5a9abf", fontFamily: "monospace" }}>
        ORIENTATION
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, width: "100%" }}>
        {options.map(({ a, sym, label }) => (
          <button key={a} disabled={disabled} onClick={() => onChange(a)} style={{
            flex: "1 1 0", padding: "8px 4px",
            background: angle === a ? "rgba(0,150,200,0.3)" : "transparent",
            border: `1px solid ${angle === a ? "rgba(0,200,255,0.6)" : "rgba(0,100,150,0.25)"}`,
            color: angle === a ? "#00c8ff" : "#5a8aaa",
            borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
            fontFamily: "monospace",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{sym}</span>
            <span style={{ fontSize: 8, letterSpacing: 0.5 }}>{a}°</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const HAND_W = 210;
const HAND_H = 380;
const HAND_VIEW_SCALE = 3.0;

function scaledDeviceDims(dev, view) {
  const k = view && view.startsWith("hand-") ? HAND_VIEW_SCALE : 1;
  if (dev.shape === "rect") return { ...dev, long: dev.long * k, short: dev.short * k };
  if (dev.shape === "circle") return { ...dev, radius: dev.radius * k };
  if (dev.shape === "ellipse") return { ...dev, rx: dev.rx * k, ry: dev.ry * k };
  return dev;
}

function HandPanel({ handSide, sessions, onLog, onMoveSession, onDeleteSession, panelAngle, draggingId, onDragStart, onDragEnd, activeDevice }) {
  const view = `hand-${handSide}-palm`;
  const containerRef = useRef(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const [hover, setHover] = useState(null);
  const [heatmapUrl, setHeatmapUrl] = useState(null);
  const dev = DEVICES[activeDevice];

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = HAND_W; canvas.height = HAND_H;
    const ctx = canvas.getContext("2d");
    const step = 3;
    for (let y = 0; y < HAND_H; y += step) {
      for (let x = 0; x < HAND_W; x += step) {
        let totalJoules = 0;
        for (const s of sessions) {
          if ((s.view || s.side) !== view) continue;
          const decay = decayFactor(s.timestamp);
          if (decay > 0 && sessionContains(s, x, y)) {
            const sj = DEVICES[s.device]?.fluencePerSession || 0;
            totalJoules += decay * sj;
          }
        }
        if (totalJoules > 0) {
          const c = exposureToColor(totalJoules);
          if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, step, step); }
        }
      }
    }
    setHeatmapUrl(canvas.toDataURL());
  }, [sessions, view]);

  const getCoords = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * HAND_W,
      y: ((cy - rect.top) / rect.height) * HAND_H,
    };
  };

  const handleClick = (e) => {
    if (draggingId) return;
    const { x, y } = getCoords(e);
    const sd = scaledDeviceDims(dev, view);
    const session = {
      id: Date.now(), device: activeDevice,
      angle: dev.rotatable ? panelAngle : 0,
      view, side: view,
      timestamp: Date.now(),
    };
    if (sd.shape === "rect") { session.x = x - sd.short / 2; session.y = y - sd.long / 2; }
    else if (sd.shape === "circle") { session.x = x; session.y = y; }
    else if (sd.shape === "ellipse") { session.x = x; session.y = y; }
    onLog(session);
  };

  const startDragForSession = (sessionId, clientX, clientY) => {
    const s = sessions.find(x => x.id === sessionId);
    if (!s) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * HAND_W;
    const y = ((clientY - rect.top) / rect.height) * HAND_H;
    dragOffset.current = { dx: x - s.x, dy: y - s.y };
    onDragStart(sessionId);
  };

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const x = ((cx - rect.left) / rect.width) * HAND_W;
      const y = ((cy - rect.top) / rect.height) * HAND_H;
      onMoveSession(draggingId, x - dragOffset.current.dx, y - dragOffset.current.dy);
    };
    const onUp = () => onDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [draggingId, onMoveSession, onDragEnd]);

  const mySessions = sessions.filter(s => (s.view || s.side) === view);
  const imgTransform = handSide === "left" ? "scaleX(-1)" : "none";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 10, letterSpacing: 3, color: "#6aaccc", fontFamily: "monospace" }}>
        {handSide.toUpperCase()} HAND · PALM
      </div>
      <div
        ref={containerRef}
        onClick={handleClick}
        onMouseMove={(e) => { if (!draggingId) setHover(getCoords(e)); }}
        onMouseLeave={() => setHover(null)}
        style={{
          position: "relative", width: HAND_W, height: HAND_H,
          cursor: draggingId ? "grabbing" : "crosshair",
          background: "#ffffff", borderRadius: 8,
          overflow: "hidden", flexShrink: 0, userSelect: "none",
        }}
      >
        <img src={HAND_IMG} alt="" draggable={false}
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            objectFit: "contain",
            transform: imgTransform,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
        {heatmapUrl && (
          <img src={heatmapUrl} alt="" style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            mixBlendMode: "screen", pointerEvents: "none", opacity: 0.92,
          }} />
        )}
        <svg viewBox={`0 0 ${HAND_W} ${HAND_H}`} width="100%" height="100%"
          preserveAspectRatio="none"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
          {mySessions.slice(-50).map(s => {
            const sDev = scaledDeviceDims(DEVICES[s.device], view);
            const decay = decayFactor(s.timestamp);
            const isActive = s.id === draggingId;
            const stroke = isActive ? "rgba(255,255,255,1)" : `rgba(255,255,255,${(decay*0.5).toFixed(2)})`;
            const sw = isActive ? 1.5 : 0.9;
            if (sDev.shape === "rect") {
              const cx = s.x + sDev.short/2, cy = s.y + sDev.long/2;
              return <rect key={s.id} x={s.x} y={s.y} width={sDev.short} height={sDev.long}
                fill="none" stroke={stroke} strokeWidth={sw}
                strokeDasharray={isActive?"none":"3,2"} rx={2}
                transform={`rotate(${s.angle||0},${cx},${cy})`} />;
            } else if (sDev.shape === "circle") {
              return <circle key={s.id} cx={s.x} cy={s.y} r={sDev.radius}
                fill="none" stroke={stroke} strokeWidth={sw}
                strokeDasharray={isActive?"none":"2,1.5"} />;
            } else if (sDev.shape === "ellipse") {
              return <ellipse key={s.id} cx={s.x} cy={s.y} rx={sDev.rx} ry={sDev.ry}
                fill="none" stroke={stroke} strokeWidth={sw}
                strokeDasharray={isActive?"none":"3,2"}
                transform={`rotate(${s.angle||0},${s.x},${s.y})`} />;
            }
            return null;
          })}
          {hover && !draggingId && (() => {
            const ghost = "rgba(255,255,255,0.85)";
            const ghostFill = "rgba(255,255,255,0.13)";
            const sd = scaledDeviceDims(dev, view);
            if (sd.shape === "rect") {
              return <rect x={hover.x - sd.short/2} y={hover.y - sd.long/2}
                width={sd.short} height={sd.long}
                fill={ghostFill} stroke={ghost} strokeWidth="1" strokeDasharray="4,2" rx={2}
                transform={`rotate(${panelAngle},${hover.x},${hover.y})`} />;
            } else if (sd.shape === "circle") {
              return <circle cx={hover.x} cy={hover.y} r={sd.radius}
                fill={ghostFill} stroke={ghost} strokeWidth="1" strokeDasharray="2,1.5" />;
            } else if (sd.shape === "ellipse") {
              return <ellipse cx={hover.x} cy={hover.y} rx={sd.rx} ry={sd.ry}
                fill={ghostFill} stroke={ghost} strokeWidth="1" strokeDasharray="4,2"
                transform={`rotate(${panelAngle},${hover.x},${hover.y})`} />;
            }
            return null;
          })()}
        </svg>
        <svg viewBox={`0 0 ${HAND_W} ${HAND_H}`} width="100%" height="100%"
          preserveAspectRatio="none"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
          {mySessions.slice(-50).map(s => {
            const sDev = scaledDeviceDims(DEVICES[s.device], view);
            const cx = sDev.shape === "rect" ? s.x + sDev.short/2 : s.x;
            const cy = sDev.shape === "rect" ? s.y + sDev.long/2 : s.y;
            const decay = decayFactor(s.timestamp);
            if (decay <= 0) return null;
            const isActive = s.id === draggingId;
            const baseR = 2.5;
            const r = isActive ? baseR + 1.5 : baseR;
            const sw = isActive ? 1.8 : 1.2;
            return (
              <g key={"h-"+s.id} style={{ pointerEvents: "all", cursor: "grab" }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); startDragForSession(s.id, e.clientX, e.clientY); }}
                onTouchStart={(e) => { e.stopPropagation(); const t=e.touches[0]; startDragForSession(s.id, t.clientX, t.clientY); }}
                onDoubleClick={(e) => { e.stopPropagation(); if (onDeleteSession) onDeleteSession(s.id); }}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (onDeleteSession) onDeleteSession(s.id); }}
              >
                <circle cx={cx} cy={cy} r={Math.max(r+4,8)} fill="rgba(0,0,0,0.001)" />
                <circle cx={cx} cy={cy} r={r} fill="none"
                  stroke={isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.85)"} strokeWidth={sw} />
                <circle cx={cx} cy={cy} r={0.8} fill="rgba(255,255,255,0.85)" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function FacePartPanel({ imgSrc, viewKey, label, mirror, aspectW, aspectH, sessions, onLog, onMoveSession, onDeleteSession, panelAngle, draggingId, onDragStart, onDragEnd, activeDevice }) {
  const containerRef = useRef(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const [hover, setHover] = useState(null);
  const [heatmapUrl, setHeatmapUrl] = useState(null);
  const dev = DEVICES[activeDevice];
  const W = aspectW;
  const H = aspectH;

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const step = 3;
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        let totalJoules = 0;
        for (const s of sessions) {
          if ((s.view || s.side) !== viewKey) continue;
          const decay = decayFactor(s.timestamp);
          if (decay > 0 && sessionContains(s, x, y)) {
            const sj = DEVICES[s.device]?.fluencePerSession || 0;
            totalJoules += decay * sj;
          }
        }
        if (totalJoules > 0) {
          const c = exposureToColor(totalJoules);
          if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, step, step); }
        }
      }
    }
    setHeatmapUrl(canvas.toDataURL());
  }, [sessions, viewKey, W, H]);

  const getCoords = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * W,
      y: ((cy - rect.top) / rect.height) * H,
    };
  };

  const handleClick = (e) => {
    if (draggingId) return;
    const { x, y } = getCoords(e);
    const sd = scaledDeviceDims(dev, "hand-fake");
    const session = {
      id: Date.now(), device: activeDevice,
      angle: dev.rotatable ? panelAngle : 0,
      view: viewKey, side: viewKey,
      timestamp: Date.now(),
    };
    if (sd.shape === "rect") { session.x = x - sd.short / 2; session.y = y - sd.long / 2; }
    else if (sd.shape === "circle") { session.x = x; session.y = y; }
    else if (sd.shape === "ellipse") { session.x = x; session.y = y; }
    onLog(session);
  };

  const startDragForSession = (sessionId, clientX, clientY) => {
    const s = sessions.find(x => x.id === sessionId);
    if (!s) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    dragOffset.current = { dx: x - s.x, dy: y - s.y };
    onDragStart(sessionId);
  };

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const x = ((cx - rect.left) / rect.width) * W;
      const y = ((cy - rect.top) / rect.height) * H;
      onMoveSession(draggingId, x - dragOffset.current.dx, y - dragOffset.current.dy);
    };
    const onUp = () => onDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [draggingId, onMoveSession, onDragEnd]);

  const mySessions = sessions.filter(s => (s.view || s.side) === viewKey);
  const imgTransform = mirror ? "scaleX(-1)" : "none";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 10, letterSpacing: 3, color: "#6aaccc", fontFamily: "monospace" }}>
        {label}
      </div>
      <div
        ref={containerRef}
        onClick={handleClick}
        onMouseMove={(e) => { if (!draggingId) setHover(getCoords(e)); }}
        onMouseLeave={() => setHover(null)}
        style={{
          position: "relative", width: W, height: H,
          cursor: draggingId ? "grabbing" : "crosshair",
          background: "#ffffff", borderRadius: 8,
          overflow: "hidden", flexShrink: 0, userSelect: "none",
        }}
      >
        <img src={imgSrc} alt="" draggable={false}
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            objectFit: "contain",
            transform: imgTransform,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
        {heatmapUrl && (
          <img src={heatmapUrl} alt="" style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            mixBlendMode: "multiply", pointerEvents: "none", opacity: 0.85,
          }} />
        )}
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%"
          preserveAspectRatio="none"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
          {mySessions.slice(-50).map(s => {
            const sDev = scaledDeviceDims(DEVICES[s.device], "hand-fake");
            const decay = decayFactor(s.timestamp);
            const isActive = s.id === draggingId;
            const stroke = isActive ? "rgba(0,0,0,1)" : `rgba(0,0,0,${(decay*0.6).toFixed(2)})`;
            const sw = isActive ? 1.5 : 0.9;
            if (sDev.shape === "rect") {
              const cx = s.x + sDev.short/2, cy = s.y + sDev.long/2;
              return <rect key={s.id} x={s.x} y={s.y} width={sDev.short} height={sDev.long}
                fill="none" stroke={stroke} strokeWidth={sw}
                strokeDasharray={isActive?"none":"3,2"} rx={2}
                transform={`rotate(${s.angle||0},${cx},${cy})`} />;
            } else if (sDev.shape === "circle") {
              return <circle key={s.id} cx={s.x} cy={s.y} r={sDev.radius}
                fill="none" stroke={stroke} strokeWidth={sw}
                strokeDasharray={isActive?"none":"2,1.5"} />;
            } else if (sDev.shape === "ellipse") {
              return <ellipse key={s.id} cx={s.x} cy={s.y} rx={sDev.rx} ry={sDev.ry}
                fill="none" stroke={stroke} strokeWidth={sw}
                strokeDasharray={isActive?"none":"3,2"}
                transform={`rotate(${s.angle||0},${s.x},${s.y})`} />;
            }
            return null;
          })}
          {hover && !draggingId && (() => {
            const ghost = "rgba(0,0,0,0.7)";
            const ghostFill = "rgba(0,0,0,0.1)";
            const sd = scaledDeviceDims(dev, "hand-fake");
            if (sd.shape === "rect") {
              return <rect x={hover.x - sd.short/2} y={hover.y - sd.long/2}
                width={sd.short} height={sd.long}
                fill={ghostFill} stroke={ghost} strokeWidth="1" strokeDasharray="4,2" rx={2}
                transform={`rotate(${panelAngle},${hover.x},${hover.y})`} />;
            } else if (sd.shape === "circle") {
              return <circle cx={hover.x} cy={hover.y} r={sd.radius}
                fill={ghostFill} stroke={ghost} strokeWidth="1" strokeDasharray="2,1.5" />;
            } else if (sd.shape === "ellipse") {
              return <ellipse cx={hover.x} cy={hover.y} rx={sd.rx} ry={sd.ry}
                fill={ghostFill} stroke={ghost} strokeWidth="1" strokeDasharray="4,2"
                transform={`rotate(${panelAngle},${hover.x},${hover.y})`} />;
            }
            return null;
          })()}
        </svg>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%"
          preserveAspectRatio="none"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
          {mySessions.slice(-50).map(s => {
            const sDev = scaledDeviceDims(DEVICES[s.device], "hand-fake");
            const cx = sDev.shape === "rect" ? s.x + sDev.short/2 : s.x;
            const cy = sDev.shape === "rect" ? s.y + sDev.long/2 : s.y;
            const decay = decayFactor(s.timestamp);
            if (decay <= 0) return null;
            const isActive = s.id === draggingId;
            const baseR = 2.5;
            const r = isActive ? baseR + 1.5 : baseR;
            const sw = isActive ? 1.8 : 1.2;
            return (
              <g key={"h-"+s.id} style={{ pointerEvents: "all", cursor: "grab" }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); startDragForSession(s.id, e.clientX, e.clientY); }}
                onTouchStart={(e) => { e.stopPropagation(); const t=e.touches[0]; startDragForSession(s.id, t.clientX, t.clientY); }}
                onDoubleClick={(e) => { e.stopPropagation(); if (onDeleteSession) onDeleteSession(s.id); }}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (onDeleteSession) onDeleteSession(s.id); }}
              >
                <circle cx={cx} cy={cy} r={Math.max(r+4,8)} fill="rgba(0,0,0,0.001)" />
                <circle cx={cx} cy={cy} r={r} fill="none"
                  stroke={isActive ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.85)"} strokeWidth={sw} />
                <circle cx={cx} cy={cy} r={0.8} fill="rgba(0,0,0,0.85)" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function HeatLegend() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      marginBottom: 14,
    }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: "#5a9abf", fontFamily: "monospace" }}>
        CUMULATIVE DOSE (J/cm²)
      </div>
      <div style={{ position: "relative", width: 280 }}>
        <div style={{
          width: "100%", height: 14, borderRadius: 3,
          background: `linear-gradient(to right,
            rgb(${HEAT_STOPS[0].rgb.join(",")}),
            rgb(${HEAT_STOPS[1].rgb.join(",")}),
            rgb(${HEAT_STOPS[2].rgb.join(",")}),
            rgb(${HEAT_STOPS[3].rgb.join(",")}),
            rgb(${HEAT_STOPS[4].rgb.join(",")}))`,
          border: "1px solid rgba(0,80,120,0.4)",
        }} />
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: 8, color: "#2a6080", letterSpacing: 1,
          marginTop: 2,
        }}>
          <span>0</span>
          <span>~7</span>
          <span>~15</span>
          <span>~22</span>
          <span>30+</span>
        </div>
      </div>
      <div style={{ fontSize: 8, color: "#2a6080", letterSpacing: 1, marginTop: 2 }}>
        green = therapeutic sweet spot · red = over-stimulated
      </div>
    </div>
  );
}

export default function CellumaTracker() {
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [panelAngle, setPanelAngle] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const [activeDevice, setActiveDevice] = useState("celluma");

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch {}
  }, [sessions]);

  const logSession = useCallback((s) => setSessions(p => [...p, s]), []);
  const moveSession = useCallback((id, newX, newY) => {
    setSessions(p => p.map(s => s.id === id ? { ...s, x: newX, y: newY } : s));
  }, []);
  const deleteSession = useCallback((id) => {
    setSessions(p => p.filter(s => s.id !== id));
  }, []);
  const onDragStart = useCallback((id) => setDraggingId(id), []);
  const onDragEnd = useCallback(() => setDraggingId(null), []);

  const total = sessions.length;
  const weekly = sessions.filter(s => Date.now() - s.timestamp < 7 * 86400000).length;
  const dev = DEVICES[activeDevice];
  const sharedBodyProps = { sessions, onLog: logSession, onMoveSession: moveSession, onDeleteSession: deleteSession, panelAngle, draggingId, onDragStart, onDragEnd, activeDevice };

  return (
    <div style={{
      minHeight: "100vh", background: "#09111e",
      color: "#cce0f0", fontFamily: "'Courier New', monospace",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 16px 48px",
    }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: 5, color: "#2a6080", marginBottom: 4 }}>GLOW</div>
        <div style={{
          fontSize: 20, fontWeight: "bold", letterSpacing: 3,
          background: "linear-gradient(90deg, #1d4877, #1b8a5a, #fbb021, #f68838, #ee3e32)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>LED THERAPY MAP</div>
        <div style={{ fontSize: 9, color: "#2a6080", marginTop: 3, letterSpacing: 2 }}>MULTI-DEVICE TRACKER</div>
      </div>

      <div style={{
        display: "flex", gap: 18, marginBottom: 12,
        padding: "8px 18px",
        background: "rgba(0,60,100,0.2)", borderRadius: 8, border: "1px solid rgba(0,100,160,0.3)",
      }}>
        {[["TOTAL", total], ["THIS WEEK", weekly], ["FADE", FADE_HOURS + "h"]].map(([l, v], i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ color: "#fbb021", fontSize: 16, fontWeight: "bold" }}>{v}</div>
            <div style={{ color: "#2a6080", fontSize: 9, letterSpacing: 1 }}>{l}</div>
          </div>
        ))}
      </div>

      <DeviceSelector active={activeDevice} onChange={setActiveDevice} />
      <RotationControl angle={panelAngle} onChange={setPanelAngle} disabled={!dev.rotatable} />

      <div style={{
        display: "flex", gap: 24, alignItems: "flex-start",
        flexWrap: "wrap", justifyContent: "center", marginBottom: 18,
      }}>
        <BodyPanel side="front" {...sharedBodyProps} />
        <BodyPanel side="back" {...sharedBodyProps} />
      </div>

      <div style={{
        fontSize: 9, letterSpacing: 3, color: "#5a9abf", fontFamily: "monospace",
        marginBottom: 8,
      }}>
        HANDS · PALM VIEW
      </div>
      <div style={{
        display: "flex", gap: 16, alignItems: "flex-start",
        flexWrap: "wrap", justifyContent: "center", marginBottom: 18,
      }}>
        <HandPanel handSide="left" {...sharedBodyProps} />
        <HandPanel handSide="right" {...sharedBodyProps} />
      </div>

      <div style={{
        fontSize: 9, letterSpacing: 3, color: "#5a9abf", fontFamily: "monospace",
        marginBottom: 8,
      }}>
        FACE · EARS · NOSE · MOUTH
      </div>
      <div style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        flexWrap: "wrap", justifyContent: "center", marginBottom: 18,
      }}>
        <FacePartPanel
          imgSrc={EAR_IMG} viewKey="face-ear-left" label="LEFT EAR"
          mirror={true} aspectW={120} aspectH={170}
          {...sharedBodyProps}
        />
        <FacePartPanel
          imgSrc={EAR_IMG} viewKey="face-ear-right" label="RIGHT EAR"
          mirror={false} aspectW={120} aspectH={170}
          {...sharedBodyProps}
        />
        <FacePartPanel
          imgSrc={NOSE_IMG} viewKey="face-nose" label="NOSE"
          mirror={false} aspectW={140} aspectH={190}
          {...sharedBodyProps}
        />
        <FacePartPanel
          imgSrc={MOUTH_IMG} viewKey="face-mouth" label="MOUTH"
          mirror={false} aspectW={210} aspectH={240}
          {...sharedBodyProps}
        />
      </div>

      <HeatLegend />

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <button onClick={() => setSessions(p => p.filter(s => Date.now() - s.timestamp < FADE_HOURS * 3600000))}
          style={{ padding: "7px 14px", background: "transparent", border: "1px solid rgba(0,100,150,0.5)", borderRadius: 6, color: "#7aa0bb", cursor: "pointer", fontFamily: "monospace" }}>
          CLEAR FADED
        </button>
        <button onClick={() => { if (confirm("Clear all?")) setSessions([]); }}
          style={{ padding: "7px 14px", background: "transparent", border: "1px solid rgba(160,60,60,0.4)", borderRadius: 6, color: "#ff8080", cursor: "pointer", fontFamily: "monospace" }}>
          CLEAR ALL
        </button>
      </div>

      {sessions.length > 0 && (
        <div style={{ width: "100%", maxWidth: 420, fontSize: 9, color: "#2a6080", letterSpacing: 1, fontFamily: "monospace" }}>
          <div style={{ marginBottom: 6, borderBottom: "1px solid rgba(0,80,120,0.2)", paddingBottom: 6 }}>
            <span>RECENT SESSIONS</span>
            <span style={{ color: "#3a6a8a", textTransform: "none", letterSpacing: 0 }}> tap × to remove</span>
          </div>
          {[...sessions].reverse().slice(0, 10).map((s) => {
            const hrs = (Date.now() - s.timestamp) / 3600000;
            const age = hrs < 1 ? "just now" : hrs < 24 ? `${Math.floor(hrs)}h ago` : `${Math.floor(hrs / 24)}d ago`;
            const sDev = DEVICES[s.device];
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "3px 0" }}>
                <span style={{ color: "#cce0f0", flex: 1, fontWeight: "bold" }}>{sDev.name}</span>
                <span style={{ width: 110, fontSize: 8 }}>{((s.view || s.side) || "").toUpperCase().replace("-", " ")}</span>
                <span style={{ color: "#4a8aaa", width: 60, textAlign: "right" }}>{age}</span>
                <button
                  onClick={() => deleteSession(s.id)}
                  aria-label="Remove session"
                  style={{
                    background: "rgba(160,40,40,0.15)",
                    border: "1px solid rgba(180,60,60,0.4)",
                    color: "#ff8080",
                    borderRadius: 4,
                    width: 22, height: 22,
                    cursor: "pointer",
                    fontSize: 12, lineHeight: "1",
                    fontFamily: "monospace",
                    padding: 0,
                  }}
                >×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
