"use client";
import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

function ButterflyModel() {
  const { scene } = useGLTF("/models/butterfly/scene.gltf");
  const ref = useRef();

  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Track mouse
  useEffect(() => {
    const handleMouse = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;

    // Slow idle spin
    ref.current.rotation.y += delta * 0.3;

    // Small float
    const t = clock.getElapsedTime();
    ref.current.position.y = Math.sin(t) * 0.05;

    // Move/tilt based on cursor
    ref.current.rotation.x = mouse.y * 0.3; // tilt up/down
    ref.current.rotation.z = mouse.x * 0.3; // tilt left/right
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
        pointerEvents: "none",
        zIndex: 0,
      }}
      camera={{ position: [0, 0, 3], fov: 45 }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[2, 2, 2]} />
      <ButterflyModel />
    </Canvas>
  );
}
