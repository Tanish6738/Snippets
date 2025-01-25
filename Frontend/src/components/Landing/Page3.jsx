import React, { Suspense, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useInView } from 'react-intersection-observer';
import { 
  RoundedBox, Sphere, Torus, Float, MeshDistortMaterial, 
  OrbitControls, Environment, Cloud, Stars, SpotLight,
  Dodecahedron, Text3D, useGLTF, Ring, TorusKnot
} from '@react-three/drei';
import { Link } from 'react-router-dom';

// Enhanced 3D Models with better materials
const CollaborationModel = () => {
  const meshRef = useRef();

  useFrame((state) => {
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={1}>
      {/* Replace Torus with Dodecahedron */}
      <group ref={meshRef}>
        <Dodecahedron args={[1]}>
          <MeshDistortMaterial
            color="#818cf8"
            envMapIntensity={2.5}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.6}
            roughness={0.2}
            speed={4}
            distort={0.5}
            radius={1}
          />
        </Dodecahedron>
        {/* Add floating spheres around the main shape */}
        {[...Array(5)].map((_, i) => (
          <Float
            key={i}
            speed={1.5}
            rotationIntensity={1}
            floatIntensity={0.5}
            position={[
              Math.sin((i / 5) * Math.PI * 2) * 2,
              Math.cos((i / 5) * Math.PI * 2) * 2,
              Math.sin((i / 5) * Math.PI * 4) * 0.5
            ]}
          >
            <Sphere args={[0.1, 16, 16]}>
              <MeshDistortMaterial
                color="#6366f1"
                envMapIntensity={1}
                clearcoat={1}
                speed={2}
                distort={0.2}
              />
            </Sphere>
          </Float>
        ))}
      </group>
      <SpotLight
        position={[10, 10, 10]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#4f46e5"
      />
    </Float>
  );
};

const BloggingModel = () => {
  const meshRef = useRef();

  useFrame((state) => {
    meshRef.current.rotation.y += 0.01;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={1}>
      <group ref={meshRef}>
        {/* Replace Text3D with TorusKnot */}
        <TorusKnot args={[0.8, 0.35, 128, 16]}>
          <MeshDistortMaterial
            color="#a78bfa"
            envMapIntensity={2.5}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.7}
            roughness={0.2}
            speed={3}
            distort={0.4}
          />
        </TorusKnot>

        {/* Add floating rings around the main shape */}
        {[...Array(3)].map((_, i) => (
          <Float
            key={i}
            speed={1 + Math.random()}
            rotationIntensity={Math.random()}
            floatIntensity={Math.random() * 2}
            position={[
              Math.sin((i / 3) * Math.PI * 2) * 1.5,
              Math.cos((i / 3) * Math.PI * 2) * 1.5,
              0
            ]}
          >
            <Ring args={[0.3, 0.35, 32]}>
              <MeshDistortMaterial
                color="#7c3aed"
                envMapIntensity={1}
                clearcoat={1}
                speed={2}
                distort={0.2}
                transparent
                opacity={0.7}
              />
            </Ring>
          </Float>
        ))}

        {/* Add floating particles */}
        {[...Array(20)].map((_, i) => (
          <Float
            key={i}
            speed={1 + Math.random()}
            rotationIntensity={Math.random()}
            floatIntensity={Math.random()}
            position={[
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3
            ]}
          >
            <Sphere args={[0.05, 8, 8]}>
              <meshBasicMaterial color="#7c3aed" toneMapped={false} transparent opacity={0.6} />
            </Sphere>
          </Float>
        ))}
      </group>

      <SpotLight
        position={[-10, 10, 10]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#7c3aed"
      />
    </Float>
  );
};

// Enhanced Scene with better lighting and effects
const Scene = ({ type }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 2]} // Optimize performance
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      }}
    >
      <color attach="background" args={['#030014']} />
      <ambientLight intensity={0.2} />
      <Environment preset="city" />
      
      <Suspense fallback={null}>
        {type === "collaboration" ? <CollaborationModel /> : <BloggingModel />}
        
        {/* Enhanced Background Effects */}
        <Stars
          radius={50}
          depth={50}
          count={1000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        
        <Cloud
          opacity={0.5}
          speed={0.4}
          width={10}
          depth={1.5}
          segments={20}
          color={type === "collaboration" ? "#4f46e5" : "#7c3aed"}
        />
      </Suspense>
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />
    </Canvas>
  );
};

// Background Scene Component
const BackgroundScene = () => (
  <Canvas className="absolute inset-0 -z-10">
    <Suspense fallback={null}>
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
      <Cloud
        opacity={0.2}
        speed={0.2}
        width={50}
        depth={5}
        segments={20}
      />
    </Suspense>
  </Canvas>
);

const Page3 = () => {
  const [contentRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const subsections = [
    {
      title: "Group Collaboration",
      description: "Create or join groups to work on shared snippets and communicate in real-time.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Community Blogging",
      description: "Contribute to the knowledge pool by publishing blogs on tips, tutorials, or development stories.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8" />
        </svg>
      )
    }
  ];

  const [load3D, setLoad3D] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoad3D(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Load main content immediately */}
      <div className="relative z-10 backdrop-blur-sm bg-[#030014]/50">
        <div className="max-w-7xl mx-auto relative z-10" ref={contentRef}>
          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold relative inline-block">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                Collaborate. Share. Grow Together.
              </span>
              {/* Animated Underline */}
              <motion.div
                className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </h2>
          </motion.div>

          {/* Two-column Layout */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column: Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-8"
            >
              {subsections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
                  className="group relative"
                >
                  <div className="p-6 rounded-xl backdrop-blur-xl
                                border border-white/10 
                                bg-gradient-to-br from-white/[0.05] to-white/[0.02]
                                hover:border-indigo-500/50 hover:from-indigo-500/10 hover:to-violet-500/10
                                transition-all duration-500">
                    <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-indigo-200 
                                 transition-colors duration-300">
                      {section.title}
                    </h3>
                    <p className="text-indigo-200/70 group-hover:text-indigo-100/90">
                      {section.description}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Link
                  to="/community"
                  className="group relative inline-flex items-center px-8 py-3 rounded-xl text-white
                           bg-gradient-to-r from-indigo-500 to-violet-500 
                           transform hover:scale-105 transition-all duration-300
                           shadow-[0_0_15px_rgba(99,102,241,0.25)]
                           hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]
                           overflow-hidden"
                >
                  <span className="relative z-10">Join the Community</span>
                  <svg
                    className="w-5 h-5 ml-2 relative z-10 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Column: Enhanced 3D Grid */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-2 gap-8 h-[600px]"
            >
              {subsections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.2 }}
                  className="relative h-full rounded-xl overflow-hidden
                            backdrop-blur-xl border border-white/10
                            bg-gradient-to-br from-indigo-500/5 to-violet-500/5
                            hover:from-indigo-500/10 hover:to-violet-500/10
                            transition-all duration-500"
                >
                  <Scene type={index === 0 ? "collaboration" : "blog"} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Load 3D content after delay */}
      {load3D && (
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <BackgroundScene />
            <div className="absolute inset-0 bg-gradient-to-b from-[#030014]/50 via-[#030014]/80 to-[#030014]" />
          </Suspense>
        </div>
      )}
    </section>
  );
};

export default Page3;
