import React, { Suspense, lazy, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sphere, Torus, Icosahedron } from '@react-three/drei'
import { useInView } from 'react-intersection-observer';

// Eager load content components
import Hero from './Hero'
import KeyFeatures from './KeyFeatures'
import Page3 from './Page3'

// Lazy load only background
const StarsCanvas = lazy(() => import('./StartBackground'))

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full bg-[#030014]/50 backdrop-blur-sm">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 blur-xl opacity-20" />
    </div>
  </div>
);

const Landing = () => {
  const [load3D, setLoad3D] = useState(false);
  // Track scroll position for optimization
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Set up intersection observers for each section
  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: false });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.1, triggerOnce: false });
  const [page3Ref, page3InView] = useInView({ threshold: 0.1, triggerOnce: false });

  // Update scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Defer 3D loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoad3D(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-[#030014] text-white min-h-screen w-full relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#030014]/10 via-[#030014]/50 to-[#030014] z-[1]" />
      
      {/* Main content */}
      <div className="relative z-[2]">
        {/* Hero Section - Immediate load */}
        <div ref={heroRef} className="relative" style={{ zIndex: 2 }}>
          <Hero />
        </div>

        {/* Features Section - Progressive load */}
        <div ref={featuresRef} className="relative grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ zIndex: 3 }}>
          <KeyFeatures />
          {load3D && featuresInView && (
            <div className="h-full min-h-[600px] relative">
              <Suspense fallback={null}>
                <Canvas
                  camera={{ position: [0, 0, 10], far: 10000 }}
                  className="!absolute inset-0"
                  dpr={[1, 2]} // Performance optimization
                >
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[5, 5, 5]} intensity={1} />
                  <Float
                    speed={1.5}
                    rotationIntensity={2}
                    floatIntensity={1}
                  >
                    <Icosahedron args={[2, 1]}>
                      <MeshDistortMaterial
                        color="#4f46e5"
                        metalness={0.9}
                        roughness={0.1}
                        distort={0.4}
                      />
                    </Icosahedron>
                  </Float>
                </Canvas>
              </Suspense>
            </div>
          )}
        </div>

        {/* Collaboration Section - Progressive load */}
        <div ref={page3Ref} className="relative grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ zIndex: 4 }}>
          {load3D && page3InView && (
            <div className="h-full min-h-[600px] relative order-2 lg:order-1">
              <Suspense fallback={null}>
                <Canvas
                  camera={{ position: [0, 0, 10], far: 10000 }}
                  className="!absolute inset-0"
                  dpr={[1, 2]}
                >
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[5, 5, 5]} intensity={1} />
                  <Float
                    speed={1.5}
                    rotationIntensity={2}
                    floatIntensity={1}
                  >
                    <Torus args={[2, 0.8, 32, 100]}>
                      <MeshDistortMaterial
                        color="#7c3aed"
                        metalness={0.9}
                        roughness={0.1}
                        distort={0.4}
                      />
                    </Torus>
                  </Float>
                </Canvas>
              </Suspense>
            </div>
          )}
          <div className="order-1 lg:order-2">
            <Page3 />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
