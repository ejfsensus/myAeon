"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import Starfield from "./Starfield";
import Nebula from "./Nebula";
import SolarSystem from "./SolarSystem";
import { SceneBoundary, useScenePreferences } from "./SceneBoundary";
import { PLANETS, type CosmicSnapshot, type PlanetVisual } from "@/lib/zodiac";
import type { ThemeMode } from "@/components/ui/types";
type Props = {
  snapshot: CosmicSnapshot;
  onPlanetHover: (p: PlanetVisual | null) => void;
  onPlanetClick: (p: PlanetVisual) => void;
  flat?: boolean;
  selectedPlanetId?: PlanetVisual["id"] | null;
  theme: ThemeMode;
  onReady?: () => void;
  enabled?: boolean;
  reset?: number;
};
export default function SceneCanvas(props: Props) {
  const prefs = useScenePreferences();
  const [dpr, setDpr] = useState(1.25);
  const [lost, setLost] = useState(false);
  const fallback = (
    <div className="sky-fallback" aria-label="Two-dimensional solar overview">
      <svg
        viewBox="-40 -40 80 80"
        role="img"
        aria-label="Heliocentric planetary overview"
      >
        <circle r="2" fill="#e8b852" />
        {props.snapshot.planets.map((point) => {
          const p = PLANETS.find((p) => p.id === point.id)!;
          return (
            <g key={p.id}>
              <circle
                r={p.orbitRadius}
                fill="none"
                stroke="#7feaff"
                strokeOpacity=".16"
                strokeWidth=".12"
              />
              <circle
                cx={Math.cos(point.angleRad) * p.orbitRadius}
                cy={Math.sin(point.angleRad) * p.orbitRadius}
                r={Math.max(0.6, p.size)}
                fill={p.color}
              />
            </g>
          );
        })}
      </svg>
      <p>Planetary overview · select a planet below</p>
    </div>
  );
  if (!prefs.supported || lost) return fallback;
  return (
    <SceneBoundary fallback={fallback}>
      <div className="scene-canvas">
        <Canvas
          camera={{ position: [0, 18, 38], fov: 55 }}
          dpr={dpr}
          frameloop={prefs.visible && prefs.motion ? "always" : "demand"}
          gl={{ antialias: dpr > 1, alpha: true }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              "webglcontextlost",
              () => setLost(true),
              { once: true },
            );
            props.onReady?.();
          }}
          style={{ touchAction: props.enabled ? "none" : "pan-y" }}
        >
          <ambientLight intensity={props.theme === "light" ? 0.7 : 0.3} />
          <hemisphereLight args={["#bfdfff", "#171126", 0.5]} />
          <directionalLight
            position={[12, 16, 20]}
            intensity={1.3}
            color="#fff4df"
          />
          <PerformanceMonitor
            onDecline={() => setDpr(1)}
            onIncline={() => setDpr(Math.min(devicePixelRatio, 1.5))}
          />
          <Suspense fallback={null}>
            <Starfield theme={props.theme} />
            <Nebula theme={props.theme} />
            <SolarSystem {...props} flat={props.flat || !prefs.motion} />
          </Suspense>
          <CameraRig {...props} motion={prefs.motion} />
        </Canvas>
      </div>
    </SceneBoundary>
  );
}
function CameraRig({
  snapshot,
  selectedPlanetId,
  flat,
  enabled,
  reset,
  motion,
}: Props & { motion: boolean }) {
  const controls = useRef<Controls>(null),
    destination = useRef(new Vector3(0, 18, 38)),
    target = useRef(new Vector3()),
    moving = useRef(true);
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const planet = PLANETS.find((p) => p.id === selectedPlanetId),
      point = snapshot.planets.find((p) => p.id === selectedPlanetId);
    target.current.set(0, 0, 0);
    destination.current.set(0, flat ? 44 : 18, flat ? 0.01 : 38);
    if (planet && point) {
      target.current.set(
        Math.cos(point.angleRad) * planet.orbitRadius,
        0,
        Math.sin(point.angleRad) * planet.orbitRadius,
      );
      destination.current
        .copy(target.current)
        .add(new Vector3(0, flat ? 8 : 3.5, flat ? 0.01 : 7));
    }
    moving.current = true;
    invalidate();
  }, [snapshot, selectedPlanetId, flat, reset, invalidate]);
  useFrame((_, delta) => {
    if (!moving.current || !controls.current) return;
    const step = motion ? 1 - Math.exp(-5 * delta) : 1;
    camera.position.lerp(destination.current, step);
    controls.current.target.lerp(target.current, step);
    controls.current.update();
    if (camera.position.distanceTo(destination.current) < 0.02)
      moving.current = false;
    else invalidate();
  });
  return (
    <OrbitControls
      ref={controls}
      enabled={enabled}
      enableRotate={!flat}
      enablePan={false}
      minDistance={2.5}
      maxDistance={85}
      enableDamping={motion}
      dampingFactor={0.08}
      onStart={() => {
        moving.current = false;
      }}
    />
  );
}
