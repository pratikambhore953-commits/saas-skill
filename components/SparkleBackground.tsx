"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

type Sparkle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
  isStar: boolean;
};

type TrailParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  isStar: boolean;
  life: number;
  maxLife: number;
  opacity: number;
  source: "trail" | "burst";
};

export default function SparkleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    const colors = ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#F59E0B", "#3B82F6"];
    const particles: Sparkle[] = [];
    const interactiveParticles: TrailParticle[] = [];

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    const createParticle = (width: number, height: number): Sparkle => {
      const isStar = Math.random() < 0.2;
      return {
        x: random(0, width),
        y: random(0, height),
        vx: random(-0.3, 0.3),
        vy: random(-0.3, 0.3),
        size: isStar ? random(3, 5) : random(1, 3),
        baseAlpha: random(0.2, 1),
        twinklePhase: random(0, Math.PI * 2),
        twinkleSpeed: random(0.01, 0.03),
        color: colors[Math.floor(Math.random() * colors.length)],
        isStar,
      };
    };

    const createTrailParticle = (x: number, y: number): TrailParticle => ({
      x,
      y,
      vx: random(-2, 2),
      vy: random(-3, -0.5),
      size: random(2, 5),
      color: ["#F59E0B", "#3B82F6", "#FFFFFF"][Math.floor(Math.random() * 3)],
      isStar: Math.random() < 0.4,
      life: random(35, 55),
      maxLife: 55,
      opacity: 1,
      source: "trail",
    });

    const createBurstParticle = (x: number, y: number): TrailParticle => ({
      x,
      y,
      vx: random(-5, 5),
      vy: random(-5, 5),
      size: random(3, 7),
      color: ["#F59E0B", "#3B82F6", "#FFFFFF"][Math.floor(Math.random() * 3)],
      isStar: Math.random() < 0.5,
      life: random(18, 30),
      maxLife: 30,
      opacity: 1,
      source: "burst",
    });

    const limitTrailParticles = () => {
      let trailCount = interactiveParticles.reduce((count, item) => count + (item.source === "trail" ? 1 : 0), 0);
      if (trailCount <= 150) return;

      for (let i = 0; i < interactiveParticles.length && trailCount > 150; i += 1) {
        if (interactiveParticles[i].source === "trail") {
          interactiveParticles.splice(i, 1);
          trailCount -= 1;
          i -= 1;
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      particles.length = 0;
      for (let i = 0; i < 80; i += 1) {
        particles.push(createParticle(rect.width, rect.height));
      }
    };

    const toRgba = (hex: string, alpha: number) => {
      const value = hex.replace("#", "");
      const r = parseInt(value.slice(0, 2), 16);
      const g = parseInt(value.slice(2, 4), 16);
      const b = parseInt(value.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const drawStar = (x: number, y: number, size: number, color: string, alpha: number) => {
      ctx.strokeStyle = toRgba(color, alpha);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      ctx.stroke();
    };

    const drawDot = (x: number, y: number, size: number, color: string, alpha: number) => {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = toRgba(color, alpha);
      ctx.fill();
    };

    const handleMouseMove = (event: MouseEvent) => {
      for (let i = 0; i < 3; i += 1) {
        interactiveParticles.push(createTrailParticle(event.clientX, event.clientY));
      }
      limitTrailParticles();
    };

    const handleClick = (event: MouseEvent) => {
      for (let i = 0; i < 20; i += 1) {
        interactiveParticles.push(createBurstParticle(event.clientX, event.clientY));
      }
    };

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.twinklePhase += particle.twinkleSpeed;

        if (particle.x > width) particle.x = 0;
        if (particle.x < 0) particle.x = width;
        if (particle.y > height) particle.y = 0;
        if (particle.y < 0) particle.y = height;

        const twinkle = 0.6 + Math.sin(particle.twinklePhase) * 0.4;
        const alpha = Math.max(0.2, Math.min(1, particle.baseAlpha * twinkle));

        if (particle.isStar) {
          drawStar(particle.x, particle.y, particle.size, particle.color, alpha);
        } else {
          drawDot(particle.x, particle.y, particle.size, particle.color, alpha);
        }
      }

      for (let i = interactiveParticles.length - 1; i >= 0; i -= 1) {
        const item = interactiveParticles[i];
        item.x += item.vx;
        item.y += item.vy;
        item.vy += 0.05;
        item.life -= 1;
        item.opacity = Math.max(0, item.life / item.maxLife);

        if (item.opacity <= 0) {
          interactiveParticles.splice(i, 1);
          continue;
        }

        if (item.isStar) {
          drawStar(item.x, item.y, item.size, item.color, item.opacity);
        } else {
          drawDot(item.x, item.y, item.size, item.color, item.opacity);
        }
      }

      frameId = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    frameId = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full" />

      <motion.div
        className="absolute -left-24 -top-20 h-[300px] w-[300px] rounded-full bg-amber-500 blur-3xl"
        style={{ opacity: 0.06 }}
        animate={{ x: [0, 18, 0], y: [0, 14, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-28 -right-28 h-[400px] w-[400px] rounded-full bg-blue-500 blur-3xl"
        style={{ opacity: 0.05 }}
        animate={{ x: [0, -22, 0], y: [0, -16, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-3xl"
        style={{ opacity: 0.03 }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
