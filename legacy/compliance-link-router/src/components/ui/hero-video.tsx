"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId: number;
    let isFadingOut = false;

    // Fade durations
    const fadeDuration = 0.5; // 500ms
    const resetDelay = 100; // 100ms pause on ended

    const handlePlay = () => {
      isFadingOut = false;
      const startTime = performance.now();
      
      const animateFadeIn = (currentTime: number) => {
        const elapsed = (currentTime - startTime) / 1000;
        if (elapsed < fadeDuration && !isFadingOut) {
          setOpacity(Math.min(elapsed / fadeDuration, 1));
          animationFrameId = requestAnimationFrame(animateFadeIn);
        } else if (!isFadingOut) {
          setOpacity(1);
          // Start monitoring for fade-out
          animationFrameId = requestAnimationFrame(monitorProgress);
        }
      };
      
      animationFrameId = requestAnimationFrame(animateFadeIn);
    };

    const monitorProgress = () => {
      if (!video) return;
      
      const timeLeft = video.duration - video.currentTime;
      if (timeLeft <= fadeDuration && !isFadingOut) {
        isFadingOut = true;
        const fadeOutStartTime = performance.now();
        
        const animateFadeOut = (currentTime: number) => {
          const elapsed = (currentTime - fadeOutStartTime) / 1000;
          if (elapsed < fadeDuration) {
            setOpacity(Math.max(1 - (elapsed / fadeDuration), 0));
            animationFrameId = requestAnimationFrame(animateFadeOut);
          } else {
            setOpacity(0);
          }
        };
        animationFrameId = requestAnimationFrame(animateFadeOut);
      } else if (!isFadingOut) {
        animationFrameId = requestAnimationFrame(monitorProgress);
      }
    };

    const handleEnded = () => {
      setOpacity(0);
      isFadingOut = false;
      setTimeout(() => {
        if (video) {
          video.currentTime = 0;
          video.play().catch(console.error);
        }
      }, resetDelay);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("ended", handleEnded);

    // Initial play
    video.play().catch(console.error);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("ended", handleEnded);
      cancelAnimationFrame(animationFrameId);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-75 pointer-events-none"
      style={{ opacity }}
      muted
      playsInline
      preload="auto"
    />
  );
}
