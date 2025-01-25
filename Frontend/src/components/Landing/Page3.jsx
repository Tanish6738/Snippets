import React, { Suspense, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useInView } from 'react-intersection-observer';
import { 
  Box, Sphere, Torus, TorusKnot, Float, MeshDistortMaterial, 
  OrbitControls, Environment, Cloud, Stars, SpotLight, Ring 
} from '@react-three/drei';
import { Link } from 'react-router-dom';

// Enhanced 3D Models with complex geometries
const CollaborationModel = () => {
  const meshRef = useRef();
  const secondaryRef = useRef();
  const orbitRef = useRef();

  useFrame((state) => {
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
    meshRef.current.rotation.y += 0.01;
    secondaryRef.current.rotation.y -= 0.02;
    secondaryRef.current.rotation.z = Math.cos(state.clock.elapsedTime) * 0.2;
    orbitRef.current.rotation.z += 0.005;
    orbitRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={2} floatIntensity={1}>
        {/* Main TorusKnot */}
        <TorusKnot ref={meshRef} args={[1, 0.3, 128, 16, 2, 3]}>
          <MeshDistortMaterial
            color="#4f46e5"
            envMapIntensity={2}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.8}
            roughness={0.2}
            speed={2}
            distort={0.3}
            radius={1}
          />
        </TorusKnot>
        
        {/* Orbiting Rings */}
        <group ref={secondaryRef}>
          <Ring args={[1.2, 1.4, 64]} rotation-x={Math.PI / 2}>
            <meshPhongMaterial color="#818cf8" opacity={0.4} transparent />
          </Ring>
          <Ring args={[1.4, 1.5, 64]} rotation-x={Math.PI / 3}>
            <meshPhongMaterial color="#4f46e5" opacity={0.2} transparent />
          </Ring>
        </group>

        {/* New Orbital Elements */}
        <group ref={orbitRef}>
          {/* Orbital Spheres */}
          {[...Array(4)].map((_, i) => (
            <Float key={i} speed={2} rotationIntensity={2} floatIntensity={1}>
              <mesh
                position={[
                  Math.sin((Math.PI * 2 * i) / 4) * 1.8,
                  Math.cos((Math.PI * 2 * i) / 4) * 1.8,
                  0
                ]}
                scale={0.15}
              >
                <sphereGeometry args={[1, 16, 16]} />
                <MeshDistortMaterial
                  color="#818cf8"
                  envMapIntensity={2}
                  clearcoat={1}
                  clearcoatRoughness={0}
                  metalness={0.8}
                  roughness={0.2}
                  speed={2}
                  distort={0.3}
                  opacity={0.8}
                  transparent
                />
              </mesh>
            </Float>
          ))}

          {/* Connecting Lines */}
          {[...Array(3)].map((_, i) => (
            <mesh key={i} rotation={[0, (Math.PI * 2 * i) / 3, 0]}>
              <torusGeometry args={[1.5, 0.02, 8, 32]} />
              <meshPhongMaterial
                color="#4f46e5"
                opacity={0.2}
                transparent
                depthWrite={false}
              />
            </mesh>
          ))}

          {/* Small Decorative Particles */}
          {[...Array(12)].map((_, i) => (
            <Float
              key={i}
              speed={3}
              rotationIntensity={3}
              floatIntensity={2}
              position={[
                Math.sin((Math.PI * 2 * i) / 12) * 2.2,
                Math.cos((Math.PI * 2 * i) / 12) * 2.2,
                (Math.sin((Math.PI * 4 * i) / 12)) * 0.5
              ]}
            >
              <mesh scale={0.05}>
                <octahedronGeometry />
                <MeshDistortMaterial
                  color="#4f46e5"
                  envMapIntensity={1.5}
                  clearcoat={1}
                  metalness={0.8}
                  speed={2}
                  distort={0.2}
                  opacity={0.7}
                  transparent
                />
              </mesh>
            </Float>
          ))}
        </group>
      </Float>
      
      {/* Enhanced lighting */}
      <SpotLight
        position={[10, 10, 10]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#4f46e5"
        castShadow
      />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#818cf8" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#4f46e5" />
    </group>
  );
};

const BloggingModel = () => {
  const meshRef = useRef();
  const spiralRef = useRef();
  const innerRef = useRef();

  useFrame((state) => {
    meshRef.current.rotation.y += 0.01;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    spiralRef.current.rotation.y -= 0.02;
    spiralRef.current.rotation.z += 0.01;
    innerRef.current.rotation.z -= 0.03;
    innerRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1}>
        <group ref={meshRef}>
          {/* Larger spiral effect */}
          <group ref={spiralRef}>
            {[...Array(5)].map((_, i) => (
              <Torus
                key={i}
                args={[1.2 + i * 0.15, 0.15, 32, 32]} // Increased radius and thickness
                rotation={[0, 0, (i * Math.PI) / 5]}
                scale={1.2 - i * 0.15} // Increased overall scale
              >
                <MeshDistortMaterial
                  color={`hsl(${280 + i * 15}, 70%, 60%)`}
                  envMapIntensity={2}
                  clearcoat={1}
                  clearcoatRoughness={0}
                  metalness={0.8}
                  roughness={0.2}
                  speed={2}
                  distort={0.3} // Increased distortion
                  opacity={0.9 - i * 0.15} // Adjusted opacity
                  transparent
                />
              </Torus>
            ))}
          </group>
          
          {/* Larger central element */}
          <group ref={innerRef}>
            {/* Larger dodecahedron */}
            <mesh scale={0.8}> {/* Increased from 0.3 to 0.8 */}
              <dodecahedronGeometry args={[1, 1]} />
              <MeshDistortMaterial
                color="#7c3aed"
                envMapIntensity={3}
                clearcoat={1}
                clearcoatRoughness={0}
                metalness={0.9}
                roughness={0.1}
                speed={3}
                distort={0.4}
                radius={1.2} // Increased radius
              />
            </mesh>

            {/* Larger geometric frame */}
            {[0, 1, 2, 3].map((i) => (
              <group key={i} rotation={[0, (Math.PI * i) / 2, 0]}>
                <mesh position={[0, 0, 0.8]} scale={0.8}> {/* Increased position and scale */}
                  <torusGeometry args={[0.6, 0.04, 16, 32]} /> {/* Increased size */}
                  <MeshDistortMaterial
                    color="#9f7aea"
                    envMapIntensity={2}
                    clearcoat={1}
                    clearcoatRoughness={0}
                    metalness={0.9}
                    roughness={0.1}
                    speed={2}
                    distort={0.2}
                    opacity={0.8}
                    transparent
                  />
                </mesh>
              </group>
            ))}

            {/* Larger floating particles */}
            {[...Array(8)].map((_, i) => (
              <Float key={i} speed={2} rotationIntensity={3} floatIntensity={2}>
                <mesh
                  position={[
                    Math.sin((Math.PI * 2 * i) / 8) * 1.2, // Increased orbit radius
                    Math.cos((Math.PI * 2 * i) / 8) * 1.2,
                    0
                  ]}
                  scale={0.1} // Increased from 0.05 to 0.1
                >
                  <octahedronGeometry args={[1, 0]} />
                  <MeshDistortMaterial
                    color={`hsl(${280 + i * 15}, 70%, 60%)`}
                    envMapIntensity={2}
                    clearcoat={1}
                    clearcoatRoughness={0}
                    metalness={0.8}
                    roughness={0.2}
                    speed={3}
                    distort={0.3}
                    opacity={0.9}
                    transparent
                  />
                </mesh>
              </Float>
            ))}
          </group>
        </group>
      </Float>

      {/* Adjusted lighting positions for larger model */}
      <SpotLight
        position={[-15, 15, 15]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#7c3aed"
        castShadow
      />
      <pointLight position={[8, 8, 8]} intensity={0.8} color="#9f7aea" />
      <pointLight position={[-8, -8, -8]} intensity={0.5} color="#7c3aed" />
    </group>
  );
};

// Enhanced Scene with better lighting and effects
const Scene = ({ type }) => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <color attach="background" args={['#030014']} />
      <ambientLight intensity={0.2} />
      <Environment preset="city" />
      
      <Suspense fallback={null}>
        {type === "collaboration" ? <CollaborationModel /> : <BloggingModel />}
        
        {/* Background Effects */}
        <Stars
          radius={50}
          depth={50}
          count={1000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        
        {/* Atmospheric Clouds */}
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

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 z-0">
        <BackgroundScene />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030014]/50 via-[#030014]/80 to-[#030014]" />
      </div>

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
    </section>
  );
};

export default Page3;
