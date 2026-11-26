"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

import { PitStopIllustration } from "@/components/landing/pit-stop-illustration";
import { useMounted } from "@/hooks/use-mounted";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const HeroScene = dynamic(
  () => import("@/components/landing/hero-scene").then((module) => module.HeroScene),
  { ssr: false, loading: () => <PitStopIllustration className="size-full" /> },
);

const noopSubscribe = () => () => {};

let sceneCapability: boolean | undefined;

function canRenderScene() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (sceneCapability !== undefined) return sceneCapability;

  // WebGL is a desktop enhancement. Check the cheap gates before creating a
  // canvas so phones never pay for a context probe on the critical path.
  const desktop = window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const saveData = connection?.saveData === true;

  if (!desktop || saveData || cores < 4 || memory <= 2) {
    sceneCapability = false;
    return sceneCapability;
  }

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) {
      sceneCapability = false;
      return sceneCapability;
    }
    // Release the probe context immediately; browsers cap live WebGL contexts.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    sceneCapability = false;
    return sceneCapability;
  }

  sceneCapability = connection?.saveData !== true && cores >= 4 && memory > 2;
  return sceneCapability;
}

/**
 * The single WebGL area on the site. The scene mounts only when it scrolls into
 * view, pauses offscreen or when the tab is hidden, and degrades to a static
 * illustration for reduced motion, missing WebGL and low-end devices.
 */
export function HeroVisual({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const mounted = useMounted();
  const capable = useSyncExternalStore(noopSubscribe, canRenderScene, () => false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasEntered(true);
      },
      { rootMargin: "120px 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const useScene = mounted && capable && !reduceMotion;
  const active = inView && pageVisible;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`relative overflow-hidden bg-gradient-to-b from-muted/70 to-card ${className ?? ""}`}
      style={{ touchAction: "pan-y" }}
    >
      {useScene && hasEntered ? (
        <HeroScene active={active} className="size-full" />
      ) : (
        <PitStopIllustration className="size-full" />
      )}
    </div>
  );
}
