import React, { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useInView } from 'react-intersection-observer';
import { 
  Box, Sphere, Torus, TorusKnot, Float, MeshDistortMaterial, 
  OrbitControls, Environment, Cloud, Stars, SpotLight, Ring,
  useProgress,
} from '@react-three/drei';
import { Link } from 'react-router-dom';

// Galaxy Particles component for creating spiral galaxy effect
const GalaxyParticles = ({ count = 5000, radius = 10 }) => {
  const particles = useRef([]);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    particles.current.forEach((particle, i) => {
      const angle = (i / count) * Math.PI * 20 + time * 0.1;
      const spiralRadius = (i / count) * radius;
      particle.position.x = Math.cos(angle) * spiralRadius;
      particle.position.z = Math.sin(angle) * spiralRadius;
      particle.position.y = Math.cos(angle * 2) * (spiralRadius * 0.2);
      particle.scale.setScalar(Math.random() * 0.5 + 0.5);
    });
  });

  return (
    <group>
      {[...Array(count)].map((_, i) => (
        <mesh key={i} ref={(el) => (particles.current[i] = el)}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial
            color={`hsl(${(i / count) * 360}, 50%, 50%)`}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};

// Enhanced SpaceScene with more complex elements
const SpaceScene = () => {
  const centerRef = useRef();
  const galaxyRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    // Rotate center element
    centerRef.current.rotation.y += delta * 0.2;
    centerRef.current.rotation.z = Math.sin(time * 0.5) * 0.2;
    
    // Pulse effect on hover
    const scale = hovered ? 
      1 + Math.sin(time * 2) * 0.1 : 
      1 + Math.sin(time) * 0.05;
    centerRef.current.scale.setScalar(scale);
    
    // Galaxy rotation
    galaxyRef.current.rotation.y += delta * 0.05;
  });

  return (
    <>
      {/* Enhanced background stars with depth */}
      <Stars
        radius={100}
        depth={50}
        count={8000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Central element */}
      <group ref={centerRef}>
        <Float speed={2} rotationIntensity={2} floatIntensity={1}>
          <TorusKnot
            ref={galaxyRef}
            args={[3, 0.8, 256, 32]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <MeshDistortMaterial
              color="#4400ff"
              roughness={0.1}
              metalness={1}
              distort={0.4}
              speed={2}
              transparent
              opacity={0.8}
            />
          </TorusKnot>

          {/* Energy rings */}
          {[...Array(3)].map((_, i) => (
            <Ring
              key={i}
              args={[4 + i * 0.5, 4.2 + i * 0.5, 64]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <meshBasicMaterial
                color="#4400ff"
                transparent
                opacity={0.2 - i * 0.05}
                side={2}
              />
            </Ring>
          ))}
        </Float>
      </group>

      {/* Spiral galaxy particles */}
      <GalaxyParticles count={3000} radius={15} />

      {/* Atmospheric elements */}
      <group>
        {[...Array(3)].map((_, i) => (
          <Cloud
            key={i}
            opacity={0.3}
            speed={0.4}
            width={20}
            depth={1.5}
            segments={20}
            position={[
              Math.cos((i / 3) * Math.PI * 2) * 10,
              Math.sin((i / 3) * Math.PI * 2) * 5,
              Math.sin((i / 3) * Math.PI * 2) * 10
            ]}
          />
        ))}
      </group>

      {/* Enhanced lighting */}
      <SpotLight
        position={[10, 10, 10]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#ffffff"
        castShadow
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4400ff" />
      <Environment preset="night" />
    </>
  );
};

// Create a simple 3D loading indicator
const LoaderScene = () => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4400ff" wireframe />
      </mesh>
      <pointLight position={[10, 10, 10]} />
      <ambientLight intensity={0.5} />
    </group>
  );
};

// HTML Loader for outside Canvas
const HTMLLoader = () => {
  const { progress } = useProgress();
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <div className="px-6 py-3 rounded-lg backdrop-blur-sm">
        <div className="text-2xl font-bold text-white">
          {progress.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

const Page3 = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <section className="h-screen w-full bg-black flex flex-col">
      <h2 className="text-4xl font-bold text-white text-center py-8">
        Collaborate With Others
      </h2>
      
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Section */}
        <div className="lg:w-1/2 h-full flex items-center justify-center p-8 border-r border-indigo-900/30">
          <div className="max-w-xl space-y-8 text-white">
            <div className="space-y-6">
              <h3 className="text-4xl font-semibold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent leading-tight">
                Collaborate. Share.<br />Grow Together.
              </h3>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <h4 className="text-2xl font-semibold text-indigo-300">
                    Group Collaboration
                  </h4>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Create or join groups to work on shared snippets and communicate in real-time.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-2xl font-semibold text-indigo-300">
                    Community Blogging
                  </h4>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Contribute to the knowledge pool by publishing blogs on tips, tutorials, or development stories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="lg:w-1/2 h-full relative">
          <div 
            ref={containerRef} 
            className={`${
              isFullscreen 
                ? 'fixed inset-0 z-50' 
                : 'absolute inset-0'
            } bg-black`}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 1 }}
              className="w-full h-full"
              ref={ref}
            >
              <Canvas
                camera={{ position: [0, 0, 20], fov: 60 }}
                dpr={[1, 2]}
                performance={{ min: 0.5 }}
              >
                <Suspense fallback={<LoaderScene />}>
                  <SpaceScene />
                  <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    zoomSpeed={0.5}
                    panSpeed={0.5}
                    rotateSpeed={0.5}
                    minDistance={10}
                    maxDistance={50}
                  />
                </Suspense>
              </Canvas>

              {/* Controls and overlays */}
              <Suspense fallback={<HTMLLoader />}>
                <div className="absolute inset-0 pointer-events-none" />
              </Suspense>

              <div className="absolute bottom-4 left-4 text-xs text-indigo-300/70 space-y-1 pointer-events-none bg-black/20 p-2 rounded-lg backdrop-blur-sm">
                <p>🖱️ Left Click + Drag to Rotate</p>
                <p>🖱️ Right Click + Drag to Pan</p>
                <p>🖱️ Scroll to Zoom</p>
              </div>

              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 px-4 py-2 bg-indigo-600/50 hover:bg-indigo-600/70 text-white rounded-lg backdrop-blur-sm transition-colors"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Page3;
