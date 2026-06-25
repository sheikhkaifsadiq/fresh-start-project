/**
 * @file src/app/(auth)/layout.tsx
 * @description Auth pages layout — centered glassmorphic card design,
 * animated particle background, and Aegis Route branding.
 *
 * Wraps /login, /signup and any other routes in the (auth) group.
 */

"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Particle canvas background
// ---------------------------------------------------------------------------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  opacityDir: number;
}

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PARTICLE_COUNT = 60;
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialise particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        opacityDir: Math.random() > 0.5 ? 0.003 : -0.003,
      });
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Pulse opacity
        p.opacity += p.opacityDir;
        if (p.opacity > 0.6 || p.opacity < 0.05) p.opacityDir *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#070711]">
      {/* Multi-layer gradient backdrop */}
      <div
        className="fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(120,80,220,0.25) 0%, transparent 70%)," +
            "radial-gradient(ellipse 60% 40% at 80% 80%, rgba(59,130,246,0.12) 0%, transparent 60%)," +
            "radial-gradient(ellipse 40% 30% at 10% 90%, rgba(139,92,246,0.10) 0%, transparent 50%)",
        }}
      />

      {/* Animated floating particles */}
      <ParticleBackground />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Branding header */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-2">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Shield logo mark */}
          <div className="relative flex items-center justify-center w-10 h-10">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 drop-shadow-[0_0_12px_rgba(139,92,246,0.8)]"
            >
              <path
                d="M20 3L6 9v12c0 8.627 5.836 16.7 14 19 8.164-2.3 14-10.373 14-19V9L20 3z"
                fill="url(#shieldGrad)"
                stroke="rgba(139,92,246,0.6)"
                strokeWidth="1"
              />
              <path
                d="M15 20l4 4 7-7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="shieldGrad"
                  x1="6"
                  y1="3"
                  x2="34"
                  y2="40"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#7c3aed" />
                  <stop offset="1" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-purple-300 transition-colors">
            Aegis Route
          </span>
        </Link>
        <p className="text-xs text-white/40 tracking-widest uppercase">
          Compliance-Shielded Link Routing
        </p>
      </div>

      {/* Page content (login / signup card) */}
      <main className="relative z-10 w-full max-w-md px-4">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 mt-8 text-center text-xs text-white/25 space-x-4">
        <Link href="/privacy" className="hover:text-white/50 transition-colors">
          Privacy Policy
        </Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-white/50 transition-colors">
          Terms of Service
        </Link>
        <span>·</span>
        <span>© {new Date().getFullYear()} Aegis Route</span>
      </footer>
    </div>
  );
}
