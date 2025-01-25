import React, { useState, useEffect, useRef, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as random from "maath/random/dist/maath-random.esm"

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
      {/* Headline Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto space-y-8 mb-12"
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
      <div className="flex gap-4 mb-8">
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
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/10 aspect-video
                      hover:shadow-indigo-500/20 transition-all duration-500 group">
          {/* Update Particle Canvas usage */}
          {isTransitioning && (
            <div className="absolute inset-0 z-20">
              <ParticleCanvas>
                <ParticleTransition isTransitioning={true} />
              </ParticleCanvas>
            </div>
          )}

          {/* Update hover effect Canvas */}
          <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <ParticleCanvas>
              <ParticleTransition isTransitioning={false} />
            </ParticleCanvas>
          </div>

          {/* Image Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent z-10" />
          
          {/* Image Stack */}
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
              {/* Image Hover Gradient */}
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
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-[#030014]"
              animate={{ 
                opacity: [0.5, 1],
                scale: [0.98, 1.02]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
            >
              <Canvas>
                <Suspense fallback={null}>
                  <ParticleTransition isTransitioning={true} />
                </Suspense>
              </Canvas>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default Hero
