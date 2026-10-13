"use client";
import { useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import type { ChartPoint, ChartAspect } from "@/lib/astrologyTypes";
import ChartWheel from "../ui/ChartWheel";
import { SceneBoundary, useScenePreferences } from "./SceneBoundary";
type Props = {
  points: ChartPoint[];
  transits?: ChartPoint[];
  houses: ChartPoint[];
  aspects: ChartAspect[];
  selected: string;
  onSelect: (name: string) => void;
  reset: number;
};
const vector = (
  longitude: number,
  radius: number,
  asc: number,
  z = 0,
): [number, number, number] => {
  const a = ((180 - longitude + asc) * Math.PI) / 180;
  return [Math.cos(a) * radius, Math.sin(a) * radius, z];
};
export default function BirthChartScene(props: Props) {
  const { supported, motion } = useScenePreferences();
  const [lost, setLost] = useState(false);
  const fallback = <ChartWheel {...props} tilt />;
  if (!supported || lost) return fallback;
  const asc = props.houses[0]?.longitude ?? 0;
  return (
    <SceneBoundary fallback={fallback}>
      <Canvas
        key={props.reset}
        orthographic
        camera={{ position: [0, -3.5, 10], zoom: 48 }}
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{ alpha: true }}
        onCreated={({ gl }) =>
          gl.domElement.addEventListener(
            "webglcontextlost",
            () => setLost(true),
            { once: true },
          )
        }
        style={{ touchAction: "none" }}
      >
        <FitChart />
        <ambientLight intensity={0.9} />
        <directionalLight position={[0, 4, 8]} intensity={2} />
        <group rotation={[0.12, 0, 0]}>
          {[3.7, 4.3, 4.7].map((r) => (
            <mesh key={r}>
              <ringGeometry args={[r - 0.018, r + 0.018, 160]} />
              <meshBasicMaterial color="#d4a437" transparent opacity={0.75} />
            </mesh>
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <group key={i}>
              <Line
                points={[vector(i * 30, 3.7, asc), vector(i * 30, 4.7, asc)]}
                color="#d4a437"
                transparent
                opacity={0.45}
              />
              <Html
                center
                position={vector(i * 30 + 15, 4.45, asc)}
                style={{
                  pointerEvents: "none",
                  color: "#d4a437",
                  fontSize: 18,
                }}
              >
                {
                  [
                    "♈",
                    "♉",
                    "♊",
                    "♋",
                    "♌",
                    "♍",
                    "♎",
                    "♏",
                    "♐",
                    "♑",
                    "♒",
                    "♓",
                  ][i]
                }
              </Html>
            </group>
          ))}
          {props.houses.map((h) => (
            <Line
              key={h.name}
              points={[
                vector(h.longitude, 1, asc),
                vector(h.longitude, 3.7, asc),
              ]}
              color="#7feaff"
              transparent
              opacity={0.3}
            />
          ))}
          {props.aspects
            .filter(
              (a) =>
                !props.selected ||
                [a.first, a.second, a.natal, a.transit].includes(
                  props.selected,
                ),
            )
            .slice(0, 24)
            .map((a, i) => {
              const x = props.points.find(
                  (p) => p.name === (a.first ?? a.natal),
                ),
                y = (a.transit ? props.transits : props.points)?.find(
                  (p) => p.name === (a.second ?? a.transit),
                );
              return x && y ? (
                <Line
                  key={i}
                  points={[
                    vector(x.longitude, 3.1, asc, 0.1),
                    vector(y.longitude, 3.1, asc, 0.1),
                  ]}
                  color={
                    ["square", "opposition"].includes(a.aspect.toLowerCase())
                      ? "#d79772"
                      : "#69c6db"
                  }
                  transparent
                  opacity={props.selected ? 0.8 : 0.2}
                />
              ) : null;
            })}
          {props.points.map((p, i) => {
            const collisions = props.points
              .slice(0, i)
              .filter(
                (q) =>
                  Math.abs(((q.longitude - p.longitude + 540) % 360) - 180) < 8,
              ).length;
            const at = vector(
              p.longitude,
              3.1 - (collisions % 3) * 0.32,
              asc,
              0.2,
            );
            return (
              <group key={p.name} position={at}>
                <mesh
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onSelect(p.name);
                  }}
                >
                  <sphereGeometry
                    args={[props.selected === p.name ? 0.14 : 0.09, 20, 20]}
                  />
                  <meshStandardMaterial
                    color="#d4a437"
                    emissive="#d4a437"
                    emissiveIntensity={0.25}
                  />
                </mesh>
                <Html center position={[0, 0.25, 0.15]}>
                  <button
                    className="chart-body-label"
                    aria-pressed={props.selected === p.name}
                    onClick={() => props.onSelect(p.name)}
                  >
                    {p.name.replaceAll("_", " ")}
                  </button>
                </Html>
              </group>
            );
          })}
          {props.transits?.map((p) => (
            <mesh key={p.name} position={vector(p.longitude, 3.95, asc, 0.32)}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshBasicMaterial color="#7feaff" />
            </mesh>
          ))}
        </group>
        <OrbitControls
          enablePan={false}
          enableDamping={motion}
          minZoom={8}
          maxZoom={110}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI * 0.65}
        />
      </Canvas>
    </SceneBoundary>
  );
}

function FitChart() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    if ("zoom" in camera) {
      camera.zoom = Math.max(12, Math.min(size.width, size.height) / 11);
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, size.width, size.height, invalidate]);
  return null;
}
