import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber'; // Fix: import useFrame from fiber
import { MeshDistortMaterial, Float, Environment, Cylinder, OrbitControls, Sphere, Ring, Stars } from '@react-three/drei';
import { Link } from 'react-router-dom';
import PixelCard from '../../blocks/Components/PixelCard/PixelCard';

// Add MiniPlanet component for smaller orbiting planets
const MiniPlanet = ({ radius, angle, speed, color, size = 0.3, reverse = false }) => {
  const planetRef = useRef();
  const orbitRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Rotate in specified direction
    orbitRef.current.rotation.y += reverse ? -speed : speed;
    // Self rotation
    planetRef.current.rotation.y += reverse ? -0.02 : 0.02;
    // Wobble effect
    planetRef.current.position.y = Math.sin(t * 2) * 0.1;
  });

  return (
    <group ref={orbitRef}>
      <group position={[radius, 0, 0]}>
        <mesh ref={planetRef}>
          <sphereGeometry args={[size, 32, 32]} />
          <MeshDistortMaterial
            color={color}
            envMapIntensity={2}
            clearcoat={1}
            metalness={0.8}
            roughness={0.2}
            distort={0.2}
          />
        </mesh>
        <Sphere args={[size * 1.2, 32, 32]}>
          <meshBasicMaterial color={color} transparent opacity={0.1} />
        </Sphere>
      </group>
    </group>
  );
};

// Add new effects helpers
const RingParticles = ({ radius, count, color }) => {
  const particles = useRef([]);
  
  useFrame((state) => {
    particles.current.forEach((particle, i) => {
      const angle = (i / count) * Math.PI * 2 + state.clock.elapsedTime * 0.2;
      particle.position.x = Math.cos(angle) * radius;
      particle.position.z = Math.sin(angle) * radius;
      particle.position.y += Math.sin(state.clock.elapsedTime + i) * 0.01;
    });
  });

  return (
    <group>
      {[...Array(count)].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (particles.current[i] = el)}
          position={[radius * Math.cos((i / count) * Math.PI * 2), 0, radius * Math.sin((i / count) * Math.PI * 2)]}
          scale={0.05}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <MeshDistortMaterial
            color={color}
            envMapIntensity={2}
            clearcoat={1}
            metalness={0.8}
            speed={2}
            distort={0.2}
            opacity={0.7}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
};

// Update PlanetarySystem with solar system mechanics
const PlanetarySystem = () => {
  const mainPlanetRef = useRef();
  const ringsRef = useRef();
  const moonGroupRef = useRef();
  const atmosphereRef = useRef();
  const outerSystemRef = useRef();
  const innerSystemRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Counter-rotating systems
    outerSystemRef.current.rotation.y += 0.001;
    innerSystemRef.current.rotation.y -= 0.002;

    // Existing animations...
    mainPlanetRef.current.rotation.y += 0.002;
    ringsRef.current.rotation.z += 0.001;
    moonGroupRef.current.rotation.y += 0.003;
    atmosphereRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.03);
  });

  return (
    <group scale={clicked ? 1.2 : 1}>
      {/* Main Planet System */}
      <group ref={mainPlanetRef}>
        <Sphere args={[1, 64, 64]}>
          <MeshDistortMaterial
            color="#4f46e5"
            envMapIntensity={2}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.9}
            roughness={0.1}
          />
        </Sphere>
        
        {/* Atmosphere */}
        <Sphere ref={atmosphereRef} args={[1.2, 64, 64]}>
          <meshBasicMaterial
            color="#818cf8"
            transparent
            opacity={0.1}
            side={2}
          />
        </Sphere>
      </group>

      {/* Planetary Rings */}
      <group ref={ringsRef} rotation={[Math.PI / 4, 0, 0]}>
        {[...Array(3)].map((_, i) => (
          <Ring key={i} args={[1.5 + i * 0.3, 1.8 + i * 0.3, 80]}>
            <MeshDistortMaterial
              color="#818cf8"
              transparent
              opacity={0.2 - i * 0.05}
              envMapIntensity={2}
              clearcoat={1}
              metalness={0.8}
            />
          </Ring>
        ))}
      </group>

      {/* Orbiting Moons */}
      <group ref={moonGroupRef}>
        {[...Array(4)].map((_, i) => (
          <group key={i} rotation={[0, (Math.PI * 2 * i) / 4, 0]}>
            <group position={[2.5, 0, 0]}>
              <Sphere args={[0.2, 32, 32]}>
                <MeshDistortMaterial
                  color="#c084fc"
                  envMapIntensity={2}
                  clearcoat={1}
                  metalness={0.8}
                />
              </Sphere>
              {/* Moon Atmosphere */}
              <Sphere args={[0.25, 32, 32]}>
                <meshBasicMaterial
                  color="#c084fc"
                  transparent
                  opacity={0.1}
                  side={2}
                />
              </Sphere>
            </group>
          </group>
        ))}
      </group>

      {/* Inner Solar System - Counter-clockwise */}
      <group ref={innerSystemRef}>
        <MiniPlanet radius={2} angle={0} speed={0.01} color="#60a5fa" size={0.4} />
        <MiniPlanet radius={3} angle={Math.PI / 3} speed={0.008} color="#818cf8" size={0.3} />
        <MiniPlanet radius={4} angle={Math.PI / 2} speed={0.006} color="#c084fc" size={0.35} />
        
        {/* Add orbital paths */}
        {[2, 3, 4].map((radius, i) => (
          <Ring key={i} args={[radius, radius + 0.02, 64]}>
            <meshBasicMaterial color="#4f46e5" transparent opacity={0.1} />
          </Ring>
        ))}
      </group>

      {/* Outer Solar System - Clockwise */}
      <group ref={outerSystemRef}>
        <MiniPlanet radius={5} angle={Math.PI / 4} speed={0.005} color="#a855f7" size={0.45} reverse />
        <MiniPlanet radius={6} angle={Math.PI / 6} speed={0.004} color="#d946ef" size={0.4} reverse />
        <MiniPlanet radius={7} angle={Math.PI} speed={0.003} color="#ec4899" size={0.5} reverse />
        
        {/* Add orbital paths */}
        {[5, 6, 7].map((radius, i) => (
          <Ring key={i} args={[radius, radius + 0.02, 64]}>
            <meshBasicMaterial color="#4f46e5" transparent opacity={0.1} />
          </Ring>
        ))}
      </group>

      {/* Add connecting energy beams */}
      {[...Array(6)].map((_, i) => (
        <group key={i} rotation={[0, (Math.PI * 2 * i) / 6, 0]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 8, 8]} />
            <meshBasicMaterial
              color="#4f46e5"
              transparent
              opacity={0.1}
            />
          </mesh>
        </group>
      ))}

      {/* Enhanced Ambient Effects */}
      <Stars
        radius={10}
        depth={20}
        count={500}
        factor={2}
        saturation={1}
        fade
        speed={1}
      />

      {/* Enhanced Lighting */}
      <pointLight color="#4f46e5" intensity={1} position={[5, 5, 5]} />
      <pointLight color="#818cf8" intensity={0.5} position={[-5, -5, -5]} />
      <pointLight color="#c084fc" intensity={0.3} position={[0, 5, -5]} />
    </group>
  );
};

// Update BackgroundScene for better camera position
const BackgroundScene = () => {
  const orbitControlsRef = useRef();

  useEffect(() => {
    if (orbitControlsRef.current) {
      // Adjusted camera controls for better view of the solar system
      orbitControlsRef.current.enableDamping = true;
      orbitControlsRef.current.dampingFactor = 0.05;
      orbitControlsRef.current.enableZoom = true;
      orbitControlsRef.current.minDistance = 8;
      orbitControlsRef.current.maxDistance = 20;
      orbitControlsRef.current.rotateSpeed = 0.5;
      orbitControlsRef.current.zoomSpeed = 0.5;
    }
  }, []);

  return (
    <div className="w-full h-full cursor-move relative"> {/* Changed from h-[80vh] to h-full */}
      <Canvas
        camera={{ position: [0, 5, 15], fov: 45 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <color attach="background" args={['#030014']} />
        <ambientLight intensity={0.2} />
        <Environment preset="city" />
        
        {/* Add background stars */}
        <Stars
          radius={50}
          depth={50}
          count={1000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <PlanetarySystem />
        
        <OrbitControls
          ref={orbitControlsRef}
          enablePan={true}
          panSpeed={0.5}
          makeDefault
        />
      </Canvas>

      {/* Interaction Guide */}
      <div className="absolute bottom-4 left-4 text-xs text-indigo-300/70 space-y-1 pointer-events-none bg-black/20 p-2 rounded-lg backdrop-blur-sm">
        <p>🖱️ Left Click + Drag to Rotate</p>
        <p>🖱️ Right Click + Drag to Pan</p>
        <p>🖱️ Scroll to Zoom</p>
      </div>
    </div>
  );
};

const KeyFeatures = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax effect for background elements
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const features = [
    {
      title: "Organize Code Snippets",
      description: "Easily store and categorize frequently used or complex code snippets in custom directories.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      title: "Privacy Controls",
      description: "Set your snippets as public or private and foster collaboration by sharing publicly.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H8m4-6V7a4 4 0 00-8 0v4H4v6a2 2 0 002 2h12a2 2 0 002-2v-6h-4z" />
        </svg>
      )
    },
    {
      title: "AI-Powered Code Generation",
      description: "Get AI-assisted code suggestions to create, optimize, or debug your snippets effortlessly.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      title: "Group Collaboration",
      description: "Collaborate with peers in real-time through shared snippets and group chats.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];


  return (
    <section ref={containerRef} className="relative min-h-screen py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
          Why Choose Our Platform?
        </h2>
      </motion.div>

      <div className="max-w-8xl mx-auto grid lg:grid-cols-2 gap-12 items-stretch relative"> {/* Changed from items-start to items-stretch */}
        {/* Features Grid - Left Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <PixelCard
                variant="pink"
                gap={6}
                speed={40}
                colors="#4f46e5,#6366f1,#818cf8"
                className="w-full h-full min-h-[320px]"
              >
                {/* Card Content with absolute positioning */}
                <div className="absolute inset-0 p-8 z-10">
                  {/* Icon Container */}
                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative mb-6"
                  >
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-white/5">
                      <div className="text-indigo-300">
                        {feature.icon}
                      </div>
                    </div>
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-2xl font-semibold mb-4">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                      {feature.title}
                    </span>
                  </h3>

                  {/* Description */}
                  <p className="text-indigo-200/70 leading-relaxed tracking-wide">
                    {feature.description}
                  </p>
                </div>
              </PixelCard>
            </motion.div>
          ))}
        </div>

        {/* 3D Cylinder - Right Side with matched height */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="lg:sticky lg:top-20 h-full rounded-xl overflow-hidden
                    border border-indigo-500/10 backdrop-blur-sm
                    hover:border-indigo-500/20 transition-all duration-300"
        >
          <BackgroundScene />
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-16 text-center"
      >
        <Link
          to="/features"
          className="inline-flex items-center px-8 py-3 rounded-xl text-white
                     bg-gradient-to-r from-indigo-500 to-violet-500 
                     hover:from-indigo-600 hover:to-violet-600
                     transform hover:scale-105 transition-all duration-300
                     shadow-[0_0_15px_rgba(99,102,241,0.25)]
                     hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]
                     relative overflow-hidden group"
        >
          <span className="relative z-10">Discover More Features</span>
          <svg className="w-5 h-5 ml-2 relative z-10 transform group-hover:translate-x-1 transition-transform duration-300" 
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                        translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </Link>
      </motion.div>
    </section>
  );
};

export default KeyFeatures;
