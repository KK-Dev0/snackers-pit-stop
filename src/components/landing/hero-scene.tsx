"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTheme } from "next-themes";
import { CanvasTexture, DoubleSide, SRGBColorSpace, type Group, type Mesh } from "three";

type SceneColors = {
  body: string;
  bodyDark: string;
  accent: string;
  screen: string;
  ground: string;
  neutral: string;
};

const LIGHT: SceneColors = {
  body: "#1f4d3a",
  bodyDark: "#163a2b",
  accent: "#b45309",
  screen: "#faf4e8",
  ground: "#e7dcc7",
  neutral: "#1b2a22",
};

const DARK: SceneColors = {
  body: "#7fb79a",
  bodyDark: "#4f8a70",
  accent: "#f0a83c",
  screen: "#1a211c",
  ground: "#2f3a32",
  neutral: "#ede6d6",
};

function useFlagTexture(colors: SceneColors) {
  const texture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (context) {
      const squares = 4;
      const cell = size / squares;
      for (let row = 0; row < squares; row += 1) {
        for (let column = 0; column < squares; column += 1) {
          context.fillStyle = (row + column) % 2 === 0 ? colors.neutral : colors.screen;
          context.fillRect(column * cell, row * cell, cell, cell);
        }
      }
    }
    const next = new CanvasTexture(canvas);
    next.colorSpace = SRGBColorSpace;
    return next;
  }, [colors.neutral, colors.screen]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}

/** Low-poly fuel pump, flag and snack crate. About ten simple meshes. */
function PitStopModel({ colors }: { colors: SceneColors }) {
  const group = useRef<Group>(null);
  const flag = useRef<Mesh>(null);
  const flagTexture = useFlagTexture(colors);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = Math.sin(time * 0.24) * 0.16;
      group.current.position.y = Math.sin(time * 0.5) * 0.03;
    }
    if (flag.current) {
      flag.current.rotation.z = Math.sin(time * 1.2) * 0.08;
    }
  });

  return (
    <group ref={group} position={[0, -0.35, 0]}>
      {/* Ground disc */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 0.06, 40]} />
        <meshStandardMaterial color={colors.ground} roughness={0.9} />
      </mesh>

      {/* Pump base and body */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[1.15, 0.12, 0.72]} />
        <meshStandardMaterial color={colors.bodyDark} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.82, 1.05, 0.5]} />
        <meshStandardMaterial color={colors.body} roughness={0.65} />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[0.9, 0.1, 0.56]} />
        <meshStandardMaterial color={colors.accent} roughness={0.6} />
      </mesh>

      {/* Screen and dial */}
      <mesh position={[0, 1.02, 0.256]}>
        <planeGeometry args={[0.5, 0.26]} />
        <meshStandardMaterial color={colors.screen} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.66, 0.256]}>
        <circleGeometry args={[0.13, 24]} />
        <meshStandardMaterial color={colors.screen} roughness={0.4} />
      </mesh>

      {/* Hose and nozzle */}
      <mesh position={[0.52, 0.62, 0.05]} rotation={[Math.PI / 2, 0.2, 0]}>
        <torusGeometry args={[0.26, 0.032, 8, 24, Math.PI * 1.25]} />
        <meshStandardMaterial color={colors.neutral} roughness={0.8} />
      </mesh>
      <mesh position={[0.56, 0.98, 0.12]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.038, 0.05, 0.3, 10]} />
        <meshStandardMaterial color={colors.accent} roughness={0.6} />
      </mesh>

      {/* Flag pole and flag */}
      <mesh position={[-0.98, 0.95, -0.1]}>
        <cylinderGeometry args={[0.012, 0.012, 1.7, 8]} />
        <meshStandardMaterial color={colors.neutral} roughness={0.8} />
      </mesh>
      <mesh ref={flag} position={[-0.76, 1.62, -0.1]}>
        <planeGeometry args={[0.42, 0.3]} />
        <meshStandardMaterial map={flagTexture} side={DoubleSide} roughness={0.8} />
      </mesh>

      {/* Snack crate */}
      <mesh position={[0.55, 0.2, 0.42]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.3, 0.2, 0.24]} />
        <meshStandardMaterial color={colors.accent} roughness={0.7} />
      </mesh>
      <mesh position={[0.24, 0.17, 0.5]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.2, 0.14, 0.2]} />
        <meshStandardMaterial color={colors.body} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function HeroScene({ active, className }: { active: boolean; className?: string }) {
  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === "dark" ? DARK : LIGHT;

  return (
    <Canvas
      className={className}
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [2.0, 1.55, 2.7], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.55, 0)}
      style={{ touchAction: "pan-y" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 4]} intensity={1.7} />
      <directionalLight position={[-3, 2, -2]} intensity={0.45} color={colors.accent} />
      <PitStopModel colors={colors} />
    </Canvas>
  );
}
