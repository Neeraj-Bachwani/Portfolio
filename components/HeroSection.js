import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Float, Text3D, Center } from '@react-three/drei';

// Butterfly Component (reusing your existing one)
function FloatingButterfly({ position }) {
  const { scene } = useGLTF('/models/butterfly/scene.gltf');
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    
    // Figure-8 flight pattern
    ref.current.position.x = position[0] + Math.sin(t * 0.5) * 2;
    ref.current.position.y = position[1] + Math.sin(t * 0.7) * 1.5;
    ref.current.position.z = position[2] + Math.cos(t * 0.5) * 2;
    
    // Natural rotation
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.5;
  });

  return <primitive ref={ref} object={scene.clone()} scale={0.15} />;
}

// Typewriter Model Placeholder (you'll replace with actual model)
function Typewriter() {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  return (
    <group ref={ref}>
      {/* Typewriter body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 0.3, 1.5]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Typewriter paper */}
      <mesh position={[0, 0.5, -0.3]}>
        <planeGeometry args={[1.5, 1.2]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      
      {/* Flowers */}
      {[...Array(5)].map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 1.2;
        return (
          <Float key={i} speed={2 + i * 0.2} rotationIntensity={0.5}>
            <mesh position={[
              Math.cos(angle) * radius,
              0.8,
              Math.sin(angle) * radius
            ]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#b6a9c7" : "#ff4102"} emissive={i % 2 === 0 ? "#b6a9c7" : "#ff4102"} emissiveIntensity={0.3} />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

// Scene Component
function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#b6a9c7" />
      
      <Typewriter />
      
      {/* Multiple butterflies */}
      <FloatingButterfly position={[-2, 1, 0]} />
      <FloatingButterfly position={[2, 2, 1]} />
      <FloatingButterfly position={[0, 3, -1]} />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

// Scratch Canvas Component
function ScratchCanvas() {
  const canvasRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw scratch layer (purple)
    ctx.fillStyle = '#b6a9c7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add texture
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        2,
        2
      );
    }
  }, []);

  const scratch = (e) => {
    if (!isScratching) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 cursor-pointer z-10"
      onMouseDown={() => setIsScratching(true)}
      onMouseUp={() => setIsScratching(false)}
      onMouseLeave={() => setIsScratching(false)}
      onMouseMove={scratch}
      onTouchStart={() => setIsScratching(true)}
      onTouchEnd={() => setIsScratching(false)}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        scratch({ clientX: touch.clientX, clientY: touch.clientY });
      }}
    />
  );
}

// Main Component
export default function HeroSection() {
  const [showScratch, setShowScratch] = useState(false);

  return (
    <div className="relative w-full h-screen bg-[#121415] overflow-hidden">
      {/* Hidden message under scratch layer */}
      <div className="absolute inset-0 flex items-center justify-center text-white text-6xl font-bold opacity-20 z-0 select-none">
        <div className="text-center">
          <p className="text-[#bdfe00]">SCRATCH</p>
          <p className="text-[#ff4102] mt-4">TO</p>
          <p className="text-[#b6a9c7] mt-4">REVEAL</p>
        </div>
      </div>

      {/* Scratch layer */}
      {showScratch && <ScratchCanvas />}

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-8 flex justify-between items-center">
        {/* Logo/Name - Left */}
        <div className="text-white">
          <h1 className="text-5xl font-bold tracking-wider" style={{
            fontFamily: 'NK57, monospace',
            textShadow: '0 0 20px rgba(182, 169, 199, 0.5)',
            letterSpacing: '0.1em'
          }}>
            NEERAJ
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-12 h-0.5 bg-[#ff4102]"></div>
            <span className="text-sm text-gray-400 tracking-widest">CREATIVE DEVELOPER</span>
          </div>
        </div>

        {/* Navigation - Right */}
        <nav className="flex gap-8 items-center">
          {['ABOUT', 'PROJECTS', 'CONTACT'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-white text-sm tracking-wider hover:text-[#b6a9c7] transition-colors relative group"
            >
              {item}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#bdfe00] group-hover:w-full transition-all duration-300"></span>
            </a>
          ))}
          
          {/* Fun/Scratch Toggle */}
          <button
            onClick={() => setShowScratch(!showScratch)}
            className="px-4 py-2 border-2 border-[#ff4102] text-[#ff4102] hover:bg-[#ff4102] hover:text-white transition-all duration-300 tracking-wider text-sm"
          >
            {showScratch ? 'HIDE' : 'FUN'}
          </button>
        </nav>
      </header>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 2, 5], fov: 50 }}
        className="absolute inset-0 z-0"
      >
        <Scene />
      </Canvas>

      {/* Bottom text */}
      <div className="absolute bottom-12 left-8 z-20 text-white">
        <p className="text-sm tracking-widest text-gray-400 mb-2">[ SCROLL TO EXPLORE ]</p>
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-12 bg-[#b6a9c7] animate-pulse"></div>
          <span className="text-xs text-gray-500">[ 001 ]</span>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/2 right-12 z-20 opacity-30">
        <div className="text-[#b6a9c7] text-xs tracking-widest rotate-90 transform origin-center">
          PORTFOLIO 2025
        </div>
      </div>
    </div>
  );
}