"use client";
import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";

function ButterflyModel() {
  const { scene } = useGLTF("/models/butterfly/scene.gltf");
  const ref = useRef();

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;

    // Idle spin
    ref.current.rotation.y += delta * 0.3;

    // Floating animation
    const t = clock.getElapsedTime();
    ref.current.position.y = Math.sin(t) * 0.05;
  });

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={0.2}
      position={[0, 0, 0]}
    />
  );
}

export default function Butterfly() {
  return (
    <Canvas
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "500px",
        height: "500px",
        zIndex: 0,
      }}
      camera={{ position: [0, 0, 3], fov: 45 }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[2, 2, 2]} />
      <ButterflyModel />

      {/* OrbitControls for desktop + mobile */}
      <OrbitControls
        enableZoom={false} // disable zoom if you only want rotation
        enablePan={false}  // disable panning if not needed
      />
    </Canvas>
  );
}
