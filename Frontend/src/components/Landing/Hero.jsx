import React, { useState, useEffect, useRef, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial, Float, MeshDistortMaterial, Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import * as random from "maath/random/dist/maath-random.esm"

// Add interactive behavior hook
const useInteractivity = (ref, intensity = 1) => {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (ref.current) {
      const scale = clicked ? 1.2 : hovered ? 1.1 : 1;
      ref.current.scale.set(scale * intensity, scale * intensity, scale * intensity);
    }
  }, [hovered, clicked, intensity]);

  return {
    hovered,
    clicked,
    interactiveProps: {
      onPointerOver: () => setHovered(true),
      onPointerOut: () => setHovered(false),
      onClick: () => setClicked(!clicked),
      style: { cursor: 'pointer' }
    }
  };
};

// Add new geometry helpers
const IcosahedronElement = ({ position = "top" }) => {
  const meshRef = useRef();
  const glowRef = useRef();
  const particleTrailRef = useRef();
  const groupRef = useRef();
  const { hovered, clicked, interactiveProps } = useInteractivity(groupRef, 0.9);

  useFrame((state) => {
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.3;
    meshRef.current.rotation.y += 0.01;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    glowRef.current.rotation.y -= 0.02;

    // Add spiraling particle trail
    if (particleTrailRef.current) {
      particleTrailRef.current.rotation.y += 0.005;
      particleTrailRef.current.children.forEach((particle, i) => {
        particle.position.y = Math.sin(state.clock.elapsedTime + i * 0.1) * 0.2;
        particle.scale.setScalar(Math.cos(state.clock.elapsedTime + i * 0.1) * 0.2 + 0.8);
      });
    }

    // Add reactive animations
    const hoverScale = hovered ? 1.1 : 1;
    const clickScale = clicked ? 1.2 : 1;
    groupRef.current.scale.set(
      0.8 * hoverScale * clickScale,
      0.8 * hoverScale * clickScale,
      0.8 * hoverScale * clickScale
    );
    
    // Add hover effect to particles
    if (particleTrailRef.current && hovered) {
      particleTrailRef.current.children.forEach((particle, i) => {
        particle.scale.setScalar(
          0.03 * (1 + Math.sin(state.clock.elapsedTime * 2 + i * 0.1) * 0.2)
        );
      });
    }
  });

  return (
    <group ref={groupRef} {...interactiveProps} scale={1.2}>
      <Float speed={2} rotationIntensity={2} floatIntensity={2}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1, 1]} />
          <MeshDistortMaterial
            color={position === "top" ? "#60a5fa" : "#818cf8"}
            emissive={position === "top" ? "#60a5fa" : "#818cf8"}
            emissiveIntensity={0.5}
            envMapIntensity={2}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.8}
            roughness={0.2}
            speed={2}
            distort={0.3}
          />
        </mesh>
        <group ref={glowRef}>
          {[...Array(3)].map((_, i) => (
            <mesh key={i} rotation={[0, (Math.PI * 2 * i) / 3, 0]}>
              <torusGeometry args={[1.2, 0.02, 8, 32]} />
              <MeshDistortMaterial
                color={position === "top" ? "#60a5fa" : "#818cf8"}
                transparent
                opacity={0.2}
                envMapIntensity={1.5}
                clearcoat={1}
                metalness={0.8}
                speed={2}
                distort={0.2}
              />
            </mesh>
          ))}
        </group>

        {/* Add spiraling particle trail */}
        <group ref={particleTrailRef}>
          {[...Array(20)].map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin((Math.PI * 2 * i) / 20) * (2 + Math.sin(i * 0.5) * 0.3),
                i * 0.08 - 0.8,
                Math.cos((Math.PI * 2 * i) / 20) * (2 + Math.sin(i * 0.5) * 0.3)
              ]}
              scale={0.05}
            >
              <dodecahedronGeometry />
              <MeshDistortMaterial
                color={position === "top" ? "#60a5fa" : "#818cf8"}
                envMapIntensity={2}
                clearcoat={1}
                metalness={0.8}
                distort={0.2}
                speed={2}
                transparent
                opacity={0.6}
              />
            </mesh>
          ))}
        </group>

        {/* Add intersecting rings */}
        {[...Array(3)].map((_, i) => (
          <mesh
            key={i}
            rotation={[Math.PI / 2 * i, Math.PI / 3 * i, 0]}
          >
            <ringGeometry args={[1.8, 1.85, 64]} />
            <MeshDistortMaterial
              color={position === "top" ? "#60a5fa" : "#818cf8"}
              transparent
              opacity={0.2}
              envMapIntensity={1.5}
              clearcoat={1}
              metalness={0.8}
              speed={2}
              distort={0.2}
            />
          </mesh>
        ))}
      </Float>
      <pointLight
        color={position === "top" ? "#60a5fa" : "#818cf8"}
        intensity={2}
        distance={3}
      />
    </group>
  );
};

const OctahedronElement = ({ position = "bottom" }) => {
  const meshRef = useRef();
  const particlesRef = useRef();
  const energyFieldRef = useRef();
  const orbitalsRef = useRef();
  const groupRef = useRef();
  const { hovered, clicked, interactiveProps } = useInteractivity(groupRef, 0.9);

  useFrame((state) => {
    meshRef.current.rotation.x += 0.01;
    meshRef.current.rotation.y += 0.015;
    particlesRef.current.rotation.y += 0.005;

    // Add energy field rotation
    if (energyFieldRef.current) {
      energyFieldRef.current.rotation.z += 0.005;
      energyFieldRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }

    // Add orbital movement
    if (orbitalsRef.current) {
      orbitalsRef.current.children.forEach((orbital, i) => {
        orbital.rotation.y += 0.01 * (i + 1);
        orbital.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.2;
      });
    }

    // Add reactive animations
    if (hovered) {
      orbitalsRef.current.children.forEach((orbital, i) => {
        orbital.rotation.y += 0.02 * (i + 1);
      });
    }
    
    // Add pulse effect when clicked
    if (clicked) {
      energyFieldRef.current.children.forEach((field, i) => {
        field.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.2);
      });
    }
  });

  return (
    <group ref={groupRef} {...interactiveProps} scale={1.2}>
      <Float speed={3} rotationIntensity={2.5} floatIntensity={2.5}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[1, 0]} />
          <MeshDistortMaterial
            color={position === "bottom" ? "#c084fc" : "#a855f7"}
            emissive={position === "bottom" ? "#c084fc" : "#a855f7"}
            emissiveIntensity={0.4}
            envMapIntensity={3}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.9}
            roughness={0.1}
            speed={3}
            distort={0.4}
            radius={1.2}
          />
        </mesh>
        <group ref={particlesRef}>
          {[...Array(12)].map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin((Math.PI * 2 * i) / 12) * 1.5,
                Math.cos((Math.PI * 2 * i) / 12) * 1.5,
                0
              ]}
              scale={0.05}
            >
              <sphereGeometry args={[1, 8, 8]} />
              <MeshDistortMaterial
                color={position === "bottom" ? "#c084fc" : "#a855f7"}
                transparent
                opacity={0.6}
                envMapIntensity={2}
                clearcoat={1}
                metalness={0.8}
                speed={2}
                distort={0.2}
              />
            </mesh>
          ))}
        </group>

        {/* Add energy field effect */}
        <group ref={energyFieldRef}>
          {[...Array(4)].map((_, i) => (
            <mesh
              key={i}
              rotation={[0, (Math.PI * i) / 2, 0]}
              scale={[2.2, 2.2, 0.05]}
            >
              <planeGeometry />
              <MeshDistortMaterial
                color={position === "bottom" ? "#c084fc" : "#a855f7"}
                transparent
                opacity={0.1}
                envMapIntensity={2}
                clearcoat={1}
                metalness={0.8}
                speed={3}
                distort={0.4}
              />
            </mesh>
          ))}
        </group>

        {/* Add orbital rings */}
        <group ref={orbitalsRef}>
          {[...Array(3)].map((_, i) => (
            <group key={i} rotation={[Math.PI / 4 * i, 0, 0]}>
              <mesh>
                <torusGeometry args={[2 + i * 0.3, 0.03, 16, 64]} />
                <MeshDistortMaterial
                  color={position === "bottom" ? "#c084fc" : "#a855f7"}
                  transparent
                  opacity={0.3}
                  envMapIntensity={2}
                  clearcoat={1}
                  metalness={0.8}
                  speed={2}
                  distort={0.2}
                />
              </mesh>
              {/* Add orbital particles */}
              {[...Array(6)].map((_, j) => (
                <mesh
                  key={j}
                  position={[
                    Math.sin((Math.PI * 2 * j) / 6) * (1.5 + i * 0.2),
                    0,
                    Math.cos((Math.PI * 2 * j) / 6) * (1.5 + i * 0.2)
                  ]}
                  scale={0.06}
                >
                  <tetrahedronGeometry />
                  <MeshDistortMaterial
                    color={position === "bottom" ? "#c084fc" : "#a855f7"}
                    envMapIntensity={2}
                    clearcoat={1}
                    metalness={0.8}
                    speed={2}
                    distort={0.2}
                  />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      </Float>
      <pointLight
        color={position === "bottom" ? "#c084fc" : "#a855f7"}
        intensity={1.5}
        distance={4}
      />
    </group>
  );
};

// Update DecorativeElement with shimmer effect
const DecorativeElement = ({ position = "left" }) => {
  const meshRef = useRef();
  const ringRef = useRef();
  const particlesRef = useRef();
  const glowIntensity = useRef(0.5);
  const coreRef = useRef();
  const energyRingsRef = useRef();
  const groupRef = useRef();
  const { hovered, clicked, interactiveProps } = useInteractivity(groupRef, 0.9);

  useFrame((state) => {
    // Main torus rotation
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    meshRef.current.rotation.y += 0.002;
    meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.2) * 0.1;

    // Ring rotation
    ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.3;
    ringRef.current.rotation.y += 0.003;
    
    // Particles rotation
    particlesRef.current.rotation.y += 0.001;
    particlesRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;

    // Pulse glow effect
    glowIntensity.current = 0.5 + Math.sin(state.clock.elapsedTime) * 0.2;
    meshRef.current.material.emissiveIntensity = glowIntensity.current;

    // Add smooth pulse effect
    const pulse = Math.sin(state.clock.elapsedTime) * 0.1 + 0.9;
    meshRef.current.scale.set(pulse, pulse, pulse);

    // Add core rotation
    if (coreRef.current) {
      coreRef.current.rotation.x += 0.01;
      coreRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.2;
    }

    // Add energy rings movement
    if (energyRingsRef.current) {
      energyRingsRef.current.children.forEach((ring, i) => {
        ring.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.3;
        ring.rotation.z = Math.cos(state.clock.elapsedTime * 0.5 + i) * 0.3;
        ring.scale.setScalar(0.8 + Math.sin(state.clock.elapsedTime + i) * 0.2);
      });
    }

    // Add reactive animations
    if (hovered) {
      energyRingsRef.current.children.forEach((ring, i) => {
        ring.rotation.z += 0.01 * (i + 1);
        ring.scale.setScalar(0.8 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.3);
      });
    }
    
    // Add special effect when clicked
    if (clicked) {
      coreRef.current.rotation.y += 0.02;
      coreRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.2);
    }
  });

  return (
    <group ref={groupRef} {...interactiveProps} scale={1.2}>
      <Float speed={2} rotationIntensity={2} floatIntensity={2}>
        {/* Main rotating torus */}
        <mesh ref={meshRef}>
          <torusGeometry args={[1, 0.2, 16, 100]} />
          <MeshDistortMaterial
            color={position === "left" ? "#4f46e5" : "#818cf8"}
            emissive={position === "left" ? "#4f46e5" : "#818cf8"}
            emissiveIntensity={0.5}
            envMapIntensity={3}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.9}
            roughness={0.1}
            speed={3}
            distort={0.4}
            radius={1.2}
          />
        </mesh>

        {/* Orbital rings */}
        <group ref={ringRef}>
          {[...Array(2)].map((_, i) => (
            <mesh
              key={i}
              rotation={[i * Math.PI / 3, i * Math.PI / 6, 0]}
            >
              <ringGeometry args={[1.2 + i * 0.1, 1.3 + i * 0.1, 50]} />
              <MeshDistortMaterial
                color={position === "left" ? "#4f46e5" : "#818cf8"}
                transparent
                opacity={0.3}
                side={2}
                envMapIntensity={2}
                clearcoat={1}
                metalness={0.8}
                speed={2}
                distort={0.2}
              />
            </mesh>
          ))}
        </group>

        {/* Floating particles */}
        <group ref={particlesRef}>
          {[...Array(20)].map((_, i) => (
            <Float
              key={i}
              speed={3}
              rotationIntensity={3}
              floatIntensity={2}
            >
              <mesh
                position={[
                  Math.sin((Math.PI * 2 * i) / 20) * 1.5,
                  Math.cos((Math.PI * 2 * i) / 20) * 1.5,
                  0
                ]}
                scale={0.03}
              >
                <sphereGeometry args={[1, 8, 8]} />
                <MeshDistortMaterial
                  color={position === "left" ? "#4f46e5" : "#818cf8"}
                  transparent
                  opacity={0.7}
                  envMapIntensity={2}
                  clearcoat={1}
                  metalness={0.8}
                  speed={2}
                  distort={0.2}
                />
              </mesh>
            </Float>
          ))}
        </group>

        {/* Add core geometry */}
        <group ref={coreRef}>
          <mesh>
            <torusKnotGeometry args={[0.8, 0.3, 128, 32, 2, 3]} />
            <MeshDistortMaterial
              color={position === "left" ? "#4f46e5" : "#818cf8"}
              emissive={position === "left" ? "#4f46e5" : "#818cf8"}
              emissiveIntensity={0.5}
              envMapIntensity={3}
              clearcoat={1}
              metalness={0.9}
              speed={3}
              distort={0.4}
            />
          </mesh>
        </group>

        {/* Add energy rings */}
        <group ref={energyRingsRef}>
          {[...Array(4)].map((_, i) => (
            <group key={i} rotation={[Math.PI / 4 * i, Math.PI / 4 * i, 0]}>
              <mesh>
                <ringGeometry args={[1.8 + i * 0.3, 1.9 + i * 0.3, 64]} />
                <MeshDistortMaterial
                  color={position === "left" ? "#4f46e5" : "#818cf8"}
                  transparent
                  opacity={0.2}
                  envMapIntensity={2}
                  clearcoat={1}
                  metalness={0.8}
                  speed={2}
                  distort={0.2}
                />
              </mesh>
            </group>
          ))}
        </group>
      </Float>
      <pointLight
        color={position === "left" ? "#4f46e5" : "#818cf8"}
        intensity={1}
        distance={6}
      />
    </group>
  );
};

// Update DecorativeCanvas with better camera settings
const DecorativeCanvas = ({ children, interactionEnabled = true }) => (
  <Canvas
    camera={{ position: [0, 0, 5], fov: 60 }}
    style={{
      width: '100%',
      height: '100%',
    }}
  >
    <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={60} />
    <ambientLight intensity={0.3} />
    <Environment preset="city" /> {/* Add environment lighting */}
    <Suspense fallback={null}>
      {children}
    </Suspense>
    {interactionEnabled && (
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.8}
        rotateSpeed={0.5}
      />
    )}
  </Canvas>
);

// Particle transition effect component
const ParticleTransition = ({ isTransitioning }) => {
  const ref = useRef();
  const [positions] = useState(() => {
    // Create a typed array with known good values
    const coords = new Float32Array(6000); // 2000 points * 3 coordinates
    for (let i = 0; i < coords.length; i += 3) {
      coords[i] = (Math.random() - 0.5) * 3; // x
      coords[i + 1] = (Math.random() - 0.5) * 3; // y
      coords[i + 2] = (Math.random() - 0.5) * 3; // z
    }
    return coords;
  });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta * 0.2;
      ref.current.rotation.y -= delta * 0.15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points
        ref={ref}
        positions={positions}
        stride={3}
        frustumCulled={false}
        scale={isTransitioning ? 1 : 0}
      >
        <PointMaterial
          transparent
          color="#ffffff"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

// Modify the Canvas usage in the Hero component
const ParticleCanvas = ({ children }) => (
  <Canvas
    camera={{ position: [0, 0, 1] }}
    gl={{
      preserveDrawingBuffer: true,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    }}
    dpr={[1, 2]}
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
  >
    <Suspense fallback={null}>
      {children}
    </Suspense>
  </Canvas>
);

const Hero = () => {
  const [activeImage, setActiveImage] = useState('home')
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [hoveredButton, setHoveredButton] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeElement, setActiveElement] = useState(null);

  const images = {
    home: '/home.png',
    group: '/group.png',
    blog: '/blog.png'
  };

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      const promises = Object.values(images).map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      await Promise.all(promises);
      setImagesLoaded(true);
    };

    preloadImages();
  }, []);

  const handleImageChange = (newImage) => {
    setIsTransitioning(true)
    setActiveImage(newImage)
    setTimeout(() => setIsTransitioning(false), 800)
  }

  const buttons = [
    { 
      id: 'home', 
      label: 'Home',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      id: 'group', 
      label: 'Snippet',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    { 
      id: 'blog', 
      label: 'Blog',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 py-20">
      {/* Decorative elements with interaction */}
      <div className="fixed left-[-5%] top-[15%] w-96 h-96 opacity-70 
                    hover:opacity-90 transition-opacity duration-300
                    cursor-pointer z-0"
           onClick={() => setActiveElement('left')}
      >
        <DecorativeCanvas interactionEnabled={activeElement === 'left'}>
          <DecorativeElement position="left" />
        </DecorativeCanvas>
      </div>
      
      {/* Update other decorative elements similarly */}
      <div className="fixed right-[-5%] bottom-[15%] w-96 h-96 opacity-70
                    hover:opacity-90 transition-opacity duration-300
                    cursor-pointer z-0"
           onClick={() => setActiveElement('right')}
      >
        <DecorativeCanvas interactionEnabled={activeElement === 'right'}>
          <DecorativeElement position="right" />
        </DecorativeCanvas>
      </div>

      <div className="fixed left-[10%] top-[20%] w-80 h-80 opacity-70
                    hover:opacity-90 transition-opacity duration-300
                    cursor-pointer z-0"
           onClick={() => setActiveElement('top')}
      >
        <DecorativeCanvas interactionEnabled={activeElement === 'top'}>
          <IcosahedronElement position="top" />
        </DecorativeCanvas>
      </div>

      <div className="fixed right-[10%] bottom-[20%] w-80 h-80 opacity-70
                    hover:opacity-90 transition-opacity duration-300
                    cursor-pointer z-0"
           onClick={() => setActiveElement('bottom')}
      >
        <DecorativeCanvas interactionEnabled={activeElement === 'bottom'}>
          <OctahedronElement position="bottom" />
        </DecorativeCanvas>
      </div>

      {/* Add click-away listener to reset active element */}
      <div 
        className="fixed inset-0 z-[-1]"
        onClick={() => setActiveElement(null)}
      />

      {/* Content wrapper with higher z-index */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-7xl mx-auto">
        {/* Headline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-8 mb-12 relative"
        >
          {/* Headline with shimmer effect on hover */}
          <motion.h1 
            whileHover={{ scale: 1.02 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-indigo-200 cursor-default
                     hover:bg-gradient-to-r hover:from-indigo-200 hover:via-white hover:to-white transition-all duration-300"
          >
            Redefining Code Sharing and Collaboration for Developers
          </motion.h1>
          
          <p className="text-lg sm:text-xl text-indigo-200/80 max-w-3xl mx-auto leading-relaxed">
            Store, organize, and share code snippets with ease. Leverage AI to generate smarter code, 
            collaborate in real-time, and engage with a thriving developer community.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link 
              to="/register" 
              className="group relative px-8 py-3 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 
                       hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 
                       shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]
                       transform hover:scale-105 hover:-translate-y-0.5
                       before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r 
                       before:from-indigo-500/0 before:via-white/25 before:to-indigo-500/0
                       before:animate-shimmer before:bg-[length:200%_100%]"
            >
              <span className="relative z-10">Get Started for Free</span>
            </Link>
            <Link 
              to="/features" 
              className="group relative px-8 py-3 rounded-xl text-indigo-300 
                       hover:text-white transition-all duration-300
                       transform hover:scale-105 hover:-translate-y-0.5
                       before:absolute before:inset-0 before:rounded-xl
                       before:border before:border-indigo-500/30 before:opacity-100
                       after:absolute after:inset-0 after:rounded-xl
                       after:border after:border-indigo-500/80 after:opacity-0
                       hover:before:opacity-0 hover:after:opacity-100
                       before:transition-opacity after:transition-opacity
                       hover:bg-indigo-500/10"
            >
              <span className="relative z-10">Explore Features</span>
            </Link>
          </div>
        </motion.div>

        {/* Image Switcher Buttons */}
        <div className="flex gap-4 mb-8 relative">
          {buttons.map((button) => (
            <motion.button
              key={button.id}
              onClick={() => handleImageChange(button.id)}
              onHoverStart={() => setHoveredButton(button.id)}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative px-6 py-2 rounded-lg transition-all duration-300 flex items-center gap-2
                overflow-hidden
                ${activeImage === button.id
                  ? 'bg-indigo-500/20 text-white border-indigo-500'
                  : 'text-indigo-300 hover:text-white hover:bg-indigo-500/10'
                } border border-indigo-500/30
                before:absolute before:inset-0 before:rounded-lg
                before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent
                before:translate-x-[-200%] hover:before:translate-x-[200%]
                before:transition-transform before:duration-[700ms]`}
            >
              <motion.span
                animate={{ 
                  rotate: hoveredButton === button.id ? 360 : 0,
                  scale: activeImage === button.id ? 1.1 : 1
                }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                {button.icon}
              </motion.span>
              <span className="relative z-10">{button.label}</span>
              
              {/* Active indicator dot */}
              {activeImage === button.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="w-1.5 h-1.5 rounded-full bg-indigo-500 relative z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Platform Mockup with 3D Effects */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative"
        >
          <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/10 aspect-video
                        hover:shadow-indigo-500/20 transition-all duration-500 group">
            
            {/* Transition Effect */}
            {isTransitioning && (
              <div className="absolute inset-0 z-20">
                <ParticleCanvas>
                  <ParticleTransition isTransitioning={true} />
                </ParticleCanvas>
              </div>
            )}

            {/* Hover Effect */}
            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <ParticleCanvas>
                <ParticleTransition isTransitioning={false} />
              </ParticleCanvas>
            </div>

            {/* Base Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent z-[5]" />
            
            {/* Images */}
            {imagesLoaded && Object.entries(images).map(([key, src]) => (
              <motion.div
                key={key}
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: activeImage === key ? 1 : 0,
                  scale: activeImage === key ? 1 : 1.1
                }}
                transition={{ 
                  duration: 0.5,
                  ease: "easeInOut"
                }}
                style={{
                  backgroundImage: `url(${src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-indigo-500/0
                           group-hover:from-indigo-500/10 group-hover:to-indigo-500/0"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
            
            {/* Loading State */}
            {!imagesLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#030014]">
                <ParticleCanvas>
                  <ParticleTransition isTransitioning={true} />
                </ParticleCanvas>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add gradient overlay for better text readability */}
      <div className="fixed inset-0 bg-gradient-radial from-transparent via-[#030014]/70 to-[#030014] pointer-events-none z-[1]" />
    </div>
  )
}

export default Hero
