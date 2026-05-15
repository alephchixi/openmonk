"use client";

import { useRef, useEffect, useCallback } from "react";
import type { OpenMonkMode } from "@/lib/openmonk/types";

type Props = {
  mode: OpenMonkMode;
  active: boolean;
  elapsed?: number;
  duration?: number;
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  baseX: number;
  baseY: number;
  angle: number;
  speed: number;
  radius: number;
}

function getComputedColor(prop: string): string {
  if (typeof window === "undefined") return "#e0e0e0";
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || "#e0e0e0";
}

function createParticle(cx: number, cy: number, mode: OpenMonkMode): Particle {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 40 + 10;

  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
    vx: 0,
    vy: 0,
    life: Math.random() * 200 + 100,
    maxLife: 300,
    size: mode === "ear" ? Math.random() * 1.2 + 0.3 : Math.random() * 0.8 + 0.4,
    baseX: cx,
    baseY: cy,
    angle,
    speed: Math.random() * 0.003 + 0.001,
    radius,
  };
}

function getParticleCount(mode: OpenMonkMode): number {
  switch (mode) {
    case "zen": return 1; // Single circle, not particles
    case "om": return 3;  // Orbital dots
    case "air": return 60;
    case "ear": return 80;
    default: return 1;
  }
}

export function ParticleGlyph({ mode, active, elapsed = 0, duration = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const modeRef = useRef(mode);
  const activeRef = useRef(active);

  const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0;

  useEffect(() => {
    modeRef.current = mode;
    activeRef.current = active;
  }, [mode, active]);

  const drawZen = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, isActive: boolean, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.6;

    // Main circle — breathing radius
    const breathAmount = isActive ? 8 : 4;
    const breathSpeed = isActive ? 0.0008 : 0.0015;
    const r = 30 + Math.sin(t * breathSpeed) * breathAmount;

    ctx.globalAlpha = isActive ? 0.3 + Math.sin(t * 0.001) * 0.15 : 0.45;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    if (isActive) {
      // Dissolve: scatter dots away from circle, then reform
      const phase = (t * 0.0003) % (Math.PI * 2);
      const dissolve = Math.sin(phase) * 0.5 + 0.5; // 0..1

      const dotCount = 32;
      for (let i = 0; i < dotCount; i++) {
        const a = (i / dotCount) * Math.PI * 2;
        const baseR = r;
        const scatterR = baseR + dissolve * 35;
        const px = cx + Math.cos(a + t * 0.0002) * scatterR;
        const py = cy + Math.sin(a + t * 0.0002) * scatterR;

        ctx.globalAlpha = 0.15 + (1 - dissolve) * 0.35;
        ctx.beginPath();
        ctx.arc(px, py, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const drawOm = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, isActive: boolean, color: string) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    // Concentric orbital rings
    const rings = [22, 36, 50];
    const pulseScale = isActive ? 1 + Math.sin(t * 0.001) * 0.06 : 1;

    rings.forEach((r, i) => {
      ctx.lineWidth = i === 0 ? 0.5 : 0.3;
      ctx.globalAlpha = 0.15 + (1 - i / rings.length) * 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r * pulseScale, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Orbiting dots
    const dots = [
      { ring: 0, speed: 0.0012, offset: 0 },
      { ring: 1, speed: -0.0008, offset: Math.PI * 0.7 },
      { ring: 2, speed: 0.0005, offset: Math.PI * 1.3 },
    ];

    dots.forEach((dot) => {
      const r = rings[dot.ring] * pulseScale;
      const a = t * dot.speed + dot.offset;
      const dx = cx + Math.cos(a) * r;
      const dy = cy + Math.sin(a) * r;

      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Center dot
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawAir = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, isActive: boolean, color: string, particles: Particle[]) => {
    ctx.fillStyle = color;

    particles.forEach((p) => {
      if (isActive) {
        // Drift upward in sine-wave streams
        p.vy = -0.15 - Math.random() * 0.05;
        p.vx = Math.sin(t * 0.001 + p.angle * 3) * 0.3;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        // Reset when expired or out of bounds
        if (p.life <= 0 || p.y < cy - 65) {
          p.x = cx + (Math.random() - 0.5) * 60;
          p.y = cy + (Math.random() - 0.5) * 60;
          p.life = Math.random() * 120 + 60;
          p.vy = 0;
        }
      } else {
        // Idle: gentle floating cloud / stippled sphere
        const targetX = p.baseX + Math.cos(p.angle + t * 0.0004) * p.radius;
        const targetY = p.baseY + Math.sin(p.angle + t * 0.0004) * p.radius;
        p.x += (targetX - p.x) * 0.02;
        p.y += (targetY - p.y) * 0.02;
        p.angle += p.speed;
      }

      const alpha = isActive
        ? (p.life / p.maxLife) * 0.5
        : 0.2 + Math.sin(t * 0.002 + p.angle) * 0.1;

      ctx.globalAlpha = Math.max(0, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  const drawEar = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, isActive: boolean, color: string, particles: Particle[]) => {
    ctx.fillStyle = color;

    particles.forEach((p) => {
      if (isActive) {
        // Scatter randomly, reform in new patterns
        const flicker = Math.random() < 0.03;
        if (flicker) {
          p.x = cx + (Math.random() - 0.5) * 80;
          p.y = cy + (Math.random() - 0.5) * 80;
        }
        p.x += (Math.random() - 0.5) * 0.8;
        p.y += (Math.random() - 0.5) * 0.8;
      } else {
        // Tight cluster with subtle flicker
        const targetX = p.baseX + Math.cos(p.angle + t * 0.001) * (p.radius * 0.6);
        const targetY = p.baseY + Math.sin(p.angle + t * 0.001) * (p.radius * 0.6);
        p.x += (targetX - p.x) * 0.03;
        p.y += (targetY - p.y) * 0.03;
        p.angle += p.speed * 0.5;
      }

      const alpha = isActive
        ? 0.15 + Math.random() * 0.35
        : 0.15 + Math.sin(t * 0.003 + p.angle * 5) * 0.12;

      ctx.globalAlpha = Math.max(0, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const wrapper = canvas.parentElement;
    const size = wrapper ? Math.min(wrapper.clientWidth, wrapper.clientHeight) : 160;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;

    // Initialize particles for particle-based modes
    const count = getParticleCount(mode);
    if (mode === "air" || mode === "ear") {
      particlesRef.current = Array.from({ length: count }, () => createParticle(cx, cy, mode));
    }

    timeRef.current = performance.now();

    let running = true;

    function draw() {
      if (!running || !ctx) return;

      const now = performance.now();
      timeRef.current = now;
      const currentMode = modeRef.current;
      const isActive = activeRef.current;
      const textColor = getComputedColor("--text");

      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = textColor;

      switch (currentMode) {
        case "zen":
          drawZen(ctx, cx, cy, now, isActive, textColor);
          break;
        case "om":
          drawOm(ctx, cx, cy, now, isActive, textColor);
          break;
        case "air":
          drawAir(ctx, cx, cy, now, isActive, textColor, particlesRef.current);
          break;
        case "ear":
          drawEar(ctx, cx, cy, now, isActive, textColor, particlesRef.current);
          break;
        default:
          drawZen(ctx, cx, cy, now, isActive, textColor);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    // Pause on hidden tab
    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animRef.current);
      } else if (running) {
        animRef.current = requestAnimationFrame(draw);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    animRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [mode, drawZen, drawOm, drawAir, drawEar]);

  // Progress ring calculations
  const ringSize = 160;
  const ringR = (ringSize - 4) / 2;
  const circumference = 2 * Math.PI * ringR;
  const showRing = duration > 0 && active;

  return (
    <div className="particle-canvas-wrapper">
      <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />

      {/* Decorative / progress ring */}
      <svg
        className="progress-ring"
        viewBox={`0 0 ${ringSize} ${ringSize}`}
        aria-hidden="true"
      >
        {/* Background ring — always visible as faint decoration */}
        <circle
          className="progress-ring__circle-bg"
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={ringR}
        />

        {/* Progress fill — only during active session */}
        {showRing && (
          <circle
            className="progress-ring__circle"
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringR}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        )}
      </svg>
    </div>
  );
}
