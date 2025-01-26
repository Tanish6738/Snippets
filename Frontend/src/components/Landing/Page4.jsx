import React, { useRef, Suspense, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, OrbitControls, Stars } from '@react-three/drei';
import { useInView } from 'react-intersection-observer';
import { TextureLoader } from 'three';

// Update testimonial images array with more metadata
const testimonialImages = [
  {
    image: "/test.png",
    position: [-4, 0, 0],
    rotation: [0, Math.PI / 6, 0],
    hoverColor: "#4f46e5"
  },
  {
    image: "/test.png",
    position: [0, 0, 4],
    rotation: [0, -Math.PI / 2, 0],
    hoverColor: "#818cf8"
  },
  {
    image: "/test.png",
    position: [4, 0, 0],
    rotation: [0, -Math.PI / 6, 0],
    hoverColor: "#6366f1"
  }
];

// Add new floating rings component
const FloatingRings = ({ radius = 4 }) => {
  const ringsRef = useRef();

  useFrame((state) => {
    ringsRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    ringsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <group ref={ringsRef}>
      {[...Array(3)].map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, (Math.PI * 2 * i) / 3]}>
          <ringGeometry args={[radius - 0.2, radius, 64]} />
          <meshBasicMaterial
            color="#4f46e5"
            transparent
            opacity={0.1}
            side={2}
          />
        </mesh>
      ))}
    </group>
  );
};

// Enhanced TestimonialCard with hover effects
const TestimonialCard = ({ position, rotation, content, index, hoverColor }) => {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    cardRef.current.rotation.x = Math.sin(time * 0.2 + index) * 0.1;
    cardRef.current.rotation.y += 0.002;
    cardRef.current.position.y = Math.sin(time * 0.5 + index) * 0.1;
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.2}>
        <group ref={cardRef} scale={hovered ? 1.1 : 1}>
          {/* Enhanced Image Card with Glow Effect */}
          <mesh>
            <planeGeometry args={[3, 2]} />
            <meshBasicMaterial map={content} transparent />
          </mesh>

          {/* Dynamic Glow Frame */}
          <mesh ref={glowRef} position={[0, 0, -0.01]} scale={[3.2, 2.2, 0.01]}>
            <planeGeometry />
            <meshBasicMaterial
              color={hovered ? hoverColor : "#4f46e5"}
              opacity={hovered ? 0.6 : 0.4}
              transparent
            />
          </mesh>

          {/* Enhanced Particle Effects */}
          {hovered && (
            <group>
              {[...Array(12)].map((_, i) => (
                <Float key={i} speed={3} rotationIntensity={3} floatIntensity={2}>
                  <mesh
                    position={[
                      Math.sin((i / 12) * Math.PI * 2) * 2,
                      Math.cos((i / 12) * Math.PI * 2) * 1.5,
                      0.2
                    ]}
                    scale={0.05}
                  >
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshStandardMaterial
                      color={hoverColor}
                      emissive={hoverColor}
                      emissiveIntensity={0.5}
                      metalness={0.8}
                      roughness={0.2}
                    />
                  </mesh>
                </Float>
              ))}
            </group>
          )}
        </group>
      </Float>

      {/* Enhanced Lighting */}
      <spotLight
        position={[0, 2, 1]}
        angle={0.5}
        penumbra={1}
        intensity={hovered ? 1.2 : 0.8}
        color={hovered ? hoverColor : "#4f46e5"}
        castShadow
      />
    </group>
  );
};

// Enhanced Scene with better composition
const Scene = () => {
  const groupRef = useRef();
  const [textures, setTextures] = useState([]);
  const textureLoader = new TextureLoader();

  useEffect(() => {
    // Load all textures
    Promise.all(
      testimonialImages.map(item => 
        new Promise(resolve => 
          textureLoader.load(item.image, resolve)
        )
      )
    ).then(loadedTextures => {
      setTextures(loadedTextures);
    });
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <FloatingRings />
        {textures.map((texture, index) => (
          <TestimonialCard
            key={index}
            position={testimonialImages[index].position}
            rotation={testimonialImages[index].rotation}
            content={texture}
            index={index}
            hoverColor={testimonialImages[index].hoverColor}
          />
        ))}
      </group>
      
      {/* Add Stars as a separate element */}
      <Stars
        radius={50}
        depth={50}
        count={1000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
    </>
  );
};

// Wrapper component that provides Canvas context
const TestimonialScene = () => (
  <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
    <color attach="background" args={['#030014']} />
    <ambientLight intensity={0.2} />
    <Environment preset="city" />
    
    <Suspense fallback={null}>
      <Scene />
    </Suspense>
    
    <OrbitControls
      enableZoom={false}
      enablePan={false}
      minPolarAngle={Math.PI / 2.5}
      maxPolarAngle={Math.PI / 1.8}
      rotateSpeed={0.5}
    />
  </Canvas>
);

// Enhanced mobile testimonial display
const MobileTestimonials = () => (
  <div className="md:hidden grid gap-8">
    {testimonialImages.map((item, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.2 }}
        whileHover={{ scale: 1.02 }}
        className="group relative"
      >
        <div className="relative rounded-xl overflow-hidden 
                      border border-indigo-500/20 
                      transition-all duration-300
                      group-hover:border-indigo-500/40
                      group-hover:shadow-[0_0_30px_rgba(79,70,229,0.2)]">
          <img
            src={item.image}
            alt={`Testimonial ${index + 1}`}
            className="w-full h-auto"
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
            animate={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          />
        </div>
      </motion.div>
    ))}
  </div>
);

const Page4 = () => {
  const containerRef = useRef();
  const [contentRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <section ref={containerRef} className="relative min-h-screen py-20 overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030014] via-[#030014]/90 to-[#030014]" />
        <div className="absolute inset-0">
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] 
                        from-indigo-500/10 via-transparent to-transparent" />
        </div>
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1)_0%,transparent_100%)]" />
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" ref={contentRef}>
        {/* Enhanced Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r 
                           from-white via-indigo-200 to-white">
              Loved by Developers Worldwide
            </span>
            <motion.div
              className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r 
                        from-indigo-500 via-violet-500 to-indigo-500"
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </h2>
        </motion.div>

        {/* Enhanced 3D Scene Container */}
        <motion.div
          style={{ y }}
          className="h-[800px] mb-20 relative rounded-xl overflow-hidden
                    border border-indigo-500/20 backdrop-blur-sm"
        >
          <TestimonialScene />
        </motion.div>

        <MobileTestimonials />
      </div>
    </section>
  );
};

export default Page4;
