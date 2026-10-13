"use client";
import { Component, useEffect, useState, type ReactNode } from "react";
export class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function useScenePreferences() {
  const [supported, setSupported] = useState(false);
  const [motion, setMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    try {
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setSupported(Boolean(gl));
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setSupported(false);
    }
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!query.matches);
    const visibility = () => setVisible(!document.hidden);
    update();
    query.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      query.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return { supported, motion, visible };
}
