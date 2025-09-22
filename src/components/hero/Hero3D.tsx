"use client";
import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function FloatingOrbs() {
  const group = useRef<THREE.Group>(null!);
  const mouse = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouse.current.x = (e.clientX - cx) / cx; // -1..1
      mouse.current.y = (e.clientY - cy) / cy; // -1..1
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, dt) => {
    if (!group.current) return;
    // Subtle parallax towards mouse
    group.current.rotation.y += ((mouse.current.x * 0.3) - group.current.rotation.y) * 0.08;
    group.current.rotation.x += ((-mouse.current.y * 0.15) - group.current.rotation.x) * 0.08;
    group.current.position.y += (Math.sin(performance.now() / 1200) * 0.05 - group.current.position.y) * 0.05;
  });

  const colors = useMemo(() => [
    new THREE.Color("#00e08a"), // chart-4-ish
    new THREE.Color("#5b8cff"), // chart-3-ish
    new THREE.Color("#ffd166"), // chart-5-ish
  ], []);

  const positions = useMemo(() => [
    new THREE.Vector3(-2.2, 0.4, -2.5),
    new THREE.Vector3(0.8, -0.2, -1.8),
    new THREE.Vector3(2.4, 0.6, -2.2),
  ], []);

  return (
    <group ref={group}>
      {positions.map((p, i) => (
        <Float key={i} speed={1 + i * 0.3} rotationIntensity={0.4} floatIntensity={0.6}>
          <mesh position={p} castShadow>
            <icosahedronGeometry args={[0.7 + i * 0.25, 1]} />
            <MeshDistortMaterial color={colors[i].getStyle()} distort={0.35 - i * 0.07} speed={1.5 + i * 0.5} roughness={0.2} metalness={0.5} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export const Hero3D: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      >
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.9} />
        <directionalLight position={[-5, -2, -5]} intensity={0.4} color={"#5b8cff"} />

        {/* Background depth */}
        <Stars radius={30} depth={20} count={1200} factor={3} saturation={0} fade speed={0.6} />

        {/* Particles sparkle near center for a premium feel */}
        <Sparkles count={80} scale={[8, 4, 4]} size={3} speed={0.4} color="#a0b4ff" opacity={0.6} />

        {/* Floating orbs/geo */}
        <FloatingOrbs />
      </Canvas>
    </div>
  );
};

export default Hero3D;