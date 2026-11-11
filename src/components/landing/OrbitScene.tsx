"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdditiveBlending, DoubleSide, Group, Mesh } from "three";
import { planetTexture } from "@/components/scene/planetTexture";
import {
  SceneBoundary,
  useScenePreferences,
} from "@/components/scene/SceneBoundary";

const worlds = [
  { id: "mercury", color: "#d7c6b9", radius: 2.1, size: 0.1, phase: 2.2 },
  { id: "venus", color: "#f3d699", radius: 2.9, size: 0.19, phase: 4.9 },
  { id: "earth", color: "#68c7f0", radius: 3.8, size: 0.24, phase: 0.6 },
  { id: "mars", color: "#f27a4f", radius: 4.7, size: 0.16, phase: 3.7 },
  { id: "saturn", color: "#ead6a2", radius: 5.9, size: 0.46, phase: 5.8 },
];

function World({
  world,
  moving,
}: {
  world: (typeof worlds)[number];
  moving: boolean;
}) {
  const orbit = useRef<Group>(null);
  const sphere = useRef<Mesh>(null);
  const texture = useMemo(
    () => planetTexture(world.id, world.color),
    [world.id, world.color],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame((_, delta) => {
    if (!moving) return;
    if (orbit.current)
      orbit.current.rotation.z +=
        (Math.min(delta, 0.05) * 0.035) / world.radius;
    if (sphere.current)
      sphere.current.rotation.y += Math.min(delta, 0.05) * 0.14;
  });
  return (
    <group ref={orbit} rotation={[0, 0, world.phase]}>
      <group position={[world.radius, 0, 0]}>
        <mesh ref={sphere} rotation={[0.4, 0, 0.5]}>
          <sphereGeometry args={[world.size, 40, 24]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.8}
            emissive={world.color}
            emissiveIntensity={0.05}
          />
        </mesh>
        {world.id === "saturn" && (
          <mesh rotation={[0.7, 0.1, 0.3]}>
            <ringGeometry args={[0.62, 0.94, 96]} />
            <meshStandardMaterial
              color="#d7c39b"
              side={DoubleSide}
              transparent
              opacity={0.65}
              roughness={1}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

function Orrery({ moving }: { moving: boolean }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (moving && group.current)
      group.current.rotation.z += Math.min(delta, 0.05) * 0.012;
  });
  return (
    <group rotation={[-0.72, 0.22, -0.32]}>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[0.8, 48, 32]} />
          <meshBasicMaterial color="#f4c66a" />
        </mesh>
        {[1.04, 1.3, 1.65].map((size, index) => (
          <mesh key={size} scale={size}>
            <sphereGeometry args={[0.8, 32, 24]} />
            <meshBasicMaterial
              color="#e9ac39"
              transparent
              opacity={0.11 / (index + 1)}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
        <pointLight color="#ffdc9f" intensity={24} distance={18} decay={1.2} />
        {worlds.map((world, index) => (
          <group key={world.id}>
            <mesh>
              <ringGeometry
                args={[world.radius - 0.007, world.radius + 0.007, 160]}
              />
              <meshBasicMaterial
                color={index === 2 ? "#7feaff" : "#d4a437"}
                transparent
                opacity={index === 2 ? 0.44 : 0.28}
                side={DoubleSide}
              />
            </mesh>
            <World world={world} moving={moving} />
          </group>
        ))}
        <mesh>
          <ringGeometry args={[6.65, 6.66, 180]} />
          <meshBasicMaterial
            color="#d4a437"
            transparent
            opacity={0.25}
            side={DoubleSide}
          />
        </mesh>
        {Array.from({ length: 72 }, (_, i) => {
          const angle = (i / 72) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 6.65, Math.sin(angle) * 6.65, 0]}
              rotation={[0, 0, angle]}
            >
              <planeGeometry args={[i % 6 === 0 ? 0.2 : 0.07, 0.012]} />
              <meshBasicMaterial
                color="#d4a437"
                transparent
                opacity={i % 6 === 0 ? 0.65 : 0.3}
                side={DoubleSide}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export default function OrbitScene({
  paused,
  light,
}: {
  paused: boolean;
  light: boolean;
}) {
  const preferences = useScenePreferences();
  const host = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [preferences.supported, lost]);
  const moving = preferences.motion && preferences.visible && inView && !paused;
  if (!preferences.supported || lost) return null;
  return (
    <SceneBoundary fallback={null}>
      <div
        ref={host}
        className={`landing-webgl ${ready ? "is-ready" : ""}`}
        aria-hidden="true"
      >
        <Canvas
          camera={{ position: [0, 0, 16], fov: 52 }}
          dpr={[1, 1.5]}
          frameloop={moving ? "always" : "demand"}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              "webglcontextlost",
              () => setLost(true),
              { once: true },
            );
            setReady(true);
          }}
          style={{ pointerEvents: "none" }}
        >
          <ambientLight intensity={light ? 1.4 : 0.45} />
          <directionalLight
            position={[1, 4, 8]}
            intensity={1.6}
            color="#d7eeff"
          />
          <Orrery moving={moving} />
        </Canvas>
      </div>
    </SceneBoundary>
  );
}
