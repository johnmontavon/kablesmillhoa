import { useEffect, useRef } from "react";

export default function LogoMark({
  baseSrc = "/assets/hero-sign.png",
  wheelSrc = "/assets/hero-wheel.png",
  size = "w-48 md:w-72",
  className = "",
  wheelAnchor = { x: 77, y: 38 },
  wheelPivotPercent = { x: 50, y: 50 },
  wheelOffsetPx = { x: 0, y: 0 },
  wheelWidthPercent = null,
  interactive = false,
  debug = false,
  // CHANGED: this is now cumulative (can grow unbounded)
  scrollAngle = 0,
  // NEW: timestamp of last scroll update, used to temporarily ignore mouse
  scrollTs = 0,
  autoSpin = false,
  autoSpinDurationSec = 22,
  wrapperStyle,
}) {
  const wrapRef = useRef(null);
  const wheelRef = useRef(null);

  // --- animation state ---
  const rafMouseRef = useRef(0);
  const pointerAngleRef = useRef(0);   // cumulative deg from pointer motion
  const lastPosRef = useRef({ has: false, x: 0, y: 0 });

  const rafSpinRef = useRef(0);
  const autoAngleRef = useRef(0);      // slow auto-spin deg (0..360 cycling)
  const lastTsRef = useRef(0);
  const lastScrollTsRef = useRef(0);

  const MOUSE_GAIN = 0.6; // tweak feel (lower = slower, higher = faster)
  const SUPPRESS_MS = 120; // ignore pointer for a brief moment after scroll

  const applyTransform = () => {
    const el = wheelRef.current;
    if (!el) return;
    const total =
      pointerAngleRef.current + autoAngleRef.current + (Number(scrollAngle) || 0);

    const tx = `calc(-${wheelPivotPercent.x}% + ${wheelOffsetPx.x}px)`;
    const ty = `calc(-${wheelPivotPercent.y}% + ${wheelOffsetPx.y}px)`;
    el.style.transform = `translate(${tx}, ${ty}) rotate(${total}deg)`;
  };

  // Pointer-driven rotation via incremental angular change:
  // dθ ≈ (x*dy − y*dx) / (x² + y²)   (radians); convert to deg and accumulate.
  useEffect(() => {
    if (!interactive || !wrapRef.current) return;

    const onMove = (e) => {
      const now = performance.now();
      if (now - lastScrollTsRef.current < SUPPRESS_MS) return;

      const wrap = wrapRef.current;
      const rect = wrap.getBoundingClientRect();
      const hubX = rect.left + (rect.width * wheelAnchor.x) / 100;
      const hubY = rect.top + (rect.height * wheelAnchor.y) / 100;

      // Current vector from hub to pointer
      const rx = e.clientX - hubX;
      const ry = e.clientY - hubY;
      const r2 = Math.max(1, rx * rx + ry * ry);

      // Cursor delta since last event
      let dx = 0, dy = 0;
      if (lastPosRef.current.has) {
        dx = e.clientX - lastPosRef.current.x;
        dy = e.clientY - lastPosRef.current.y;
      }
      lastPosRef.current = { has: true, x: e.clientX, y: e.clientY };

      // z-component of 2D cross product gives rotation direction
      const cross = rx * dy - ry * dx; // >0 = CCW, <0 = CW in math;
      // On screens/CSS, positive degrees are clockwise, and with this formula:
      //   above+right => cross>0 => +deg => clockwise ✅ (matches your spec)
      const dThetaDeg = (cross / r2) * (180 / Math.PI) * MOUSE_GAIN;

      // Accumulate indefinitely for continuous 360s
      pointerAngleRef.current += dThetaDeg;

      if (!rafMouseRef.current) {
        rafMouseRef.current = requestAnimationFrame(() => {
          applyTransform();
          rafMouseRef.current = 0;
        });
      }
    };

    // Use pointer events (handles mouse & pen)
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (rafMouseRef.current) cancelAnimationFrame(rafMouseRef.current);
      rafMouseRef.current = 0;
      lastPosRef.current.has = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, wheelAnchor.x, wheelAnchor.y]);

  // Slow baseline auto-spin (kept)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (!autoSpin || prefersReduced) return;

    const step = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const degPerSec = 360 / Math.max(0.001, autoSpinDurationSec);
      autoAngleRef.current = (autoAngleRef.current + degPerSec * dt) % 360;

      applyTransform();
      rafSpinRef.current = requestAnimationFrame(step);
    };

    rafSpinRef.current = requestAnimationFrame(step);
    return () => {
      if (rafSpinRef.current) cancelAnimationFrame(rafSpinRef.current);
      rafSpinRef.current = 0;
      lastTsRef.current = 0;
    };
  }, [autoSpin, autoSpinDurationSec]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-apply transform when cumulative scroll angle changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    applyTransform();
  }, [scrollAngle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Note the last time scroll updated so we can temporarily ignore pointer input
  useEffect(() => {
    if (scrollTs) lastScrollTsRef.current = scrollTs;
  }, [scrollTs]);

  // Perf hints
  useEffect(() => {
    if (wheelRef.current) {
      wheelRef.current.style.willChange = "transform";
      // IMPORTANT: remove transition so we don't get “see-saw” tweening between updates
      wheelRef.current.style.transition = "transform 0s";
    }
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative ${size} ${className} z-10`}
      style={wrapperStyle}
      aria-label="Kable's Mill logo"
    >
      <img
        src={baseSrc}
        alt="Kable's Mill"
        className="block w-full h-auto select-none pointer-events-none"
        draggable="false"
      />

      {debug && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${wheelAnchor.x}%`,
            top: `${wheelAnchor.y}%`,
            transform: "translate(-50%, -50%)",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "rgba(255,0,0,0.4)",
            outline: "2px solid rgba(255,0,0,0.8)",
            zIndex: 5,
          }}
        />
      )}

      {wheelSrc && (
        <img
          ref={wheelRef}
          src={wheelSrc}
          alt="Decorative water wheel"
          className="absolute select-none pointer-events-none"
          style={{
            left: `${wheelAnchor.x}%`,
            top: `${wheelAnchor.y}%`,
            width: wheelWidthPercent ? `${wheelWidthPercent}%` : undefined,
            transformOrigin: `${wheelPivotPercent.x}% ${wheelPivotPercent.y}%`,
            transform: `translate(calc(-${wheelPivotPercent.x}% + ${wheelOffsetPx.x}px), calc(-${wheelPivotPercent.y}% + ${wheelOffsetPx.y}px)) rotate(0deg)`,
          }}
          draggable="false"
        />
      )}

      {debug && wheelSrc && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${wheelAnchor.x}%`,
            top: `${wheelAnchor.y}%`,
            transform: `translate(calc(-${wheelPivotPercent.x}% + ${wheelOffsetPx.x}px), calc(-${wheelPivotPercent.y}% + ${wheelOffsetPx.y}px))`,
            width: 0,
            height: 0,
            zIndex: 6,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "rgba(0, 128, 255, 0.5)",
              outline: "2px solid rgba(0,128,255,0.9)",
            }}
          />
        </div>
      )}
    </div>
  );
}
