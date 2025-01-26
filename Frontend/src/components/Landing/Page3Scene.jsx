import React, { Suspense, useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import PropTypes from 'prop-types';
import { 
  Box, Sphere, TorusKnot, Float, MeshDistortMaterial, 
  OrbitControls, Environment, Cloud, Stars, SpotLight,
  useProgress, shaderMaterial, Loader,
  Instances, Instance, Preload, AdaptiveDpr, AdaptiveEvents,
  PerformanceMonitor // Add this import
} from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

// Material definitions
const NebulaMaterial = shaderMaterial(
  {
    time: 0,
    color1: new THREE.Color('#ff0080'),
    color2: new THREE.Color('#4400ff'),
    fogDensity: 0.3,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader - simplified version
  `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float fogDensity;
    varying vec2 vUv;
    varying vec3 vPosition;

    float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453123);
    }

    void main() {
      vec3 pos = vPosition * 0.1;
      float n = noise(pos + time * 0.1);
      n += 0.5 * noise(pos * 2.0 + time * 0.2);
      n += 0.25 * noise(pos * 4.0 + time * 0.3);
      
      vec3 finalColor = mix(color1, color2, n);
      float alpha = smoothstep(0.2, 0.8, n) * fogDensity;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ NebulaMaterial });

// Add custom shader material for galaxy particles
const GalaxyParticleMaterial = shaderMaterial(
  {
    time: 0,
    size: 1.0, // Increased default size
  },
  // Vertex shader - Fixed attribute redefinition
  `
    uniform float time;
    uniform float size;
    varying vec3 vColor;
    varying float vDistance;
    
    void main() {
      vColor = color; // Using built-in color attribute
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      float distanceFactor = pow(abs(position.x * position.y * position.z) * 0.0015, 0.5);
      vDistance = distanceFactor;
      
      // Increased base size multiplication factor from 300 to 1500
      gl_PointSize = size * (1500.0 / -mvPosition.z) * (1.0 + distanceFactor);
    }
  `,
  // Fragment shader
  `
    varying vec3 vColor;
    varying float vDistance;
    
    void main() {
      float distanceToCenter = length(gl_PointCoord - 0.5);
      float strength = 0.05 / distanceToCenter - 0.1;
      strength = smoothstep(0.0, 1.0, strength);
      
      vec3 finalColor = mix(vColor, vec3(1.0), vDistance * 0.5);
      gl_FragColor = vec4(finalColor, strength);
    }
  `
);

extend({ GalaxyParticleMaterial });

// Move satelliteGalaxies definition here, before the GalaxyParticles component
const createSatelliteGalaxies = (count) => [
  { x: 4, y: 1, z: 4, radius: 1, particles: count * 0.15, speed: 0.001, orbitRadius: 6 },
  { x: -4, y: -1, z: 3, radius: 0.8, particles: count * 0.12, speed: 0.002, orbitRadius: 5 },
  { x: 3, y: -2, z: -3, radius: 0.6, particles: count * 0.1, speed: 0.0015, orbitRadius: 4 },
  { x: -3, y: 2, z: -4, radius: 0.7, particles: count * 0.11, speed: 0.0012, orbitRadius: 7 },
  { x: 5, y: -1, z: -2, radius: 0.5, particles: count * 0.09, speed: 0.0018, orbitRadius: 5.5 },
  { x: -2, y: 3, z: 5, radius: 0.9, particles: count * 0.13, speed: 0.0008, orbitRadius: 6.5 },
  { x: 4, y: -2, z: -5, radius: 0.4, particles: count * 0.08, speed: 0.0022, orbitRadius: 4.5 },
  { x: -5, y: 1, z: 2, radius: 0.75, particles: count * 0.14, speed: 0.0014, orbitRadius: 5.8 }
];

// Core components
const GalaxyParticles = ({ count = 180000, particleSize = 0.02 }) => {
  const points = useRef();
  const materialRef = useRef();
  const satelliteGalaxies = useMemo(() => createSatelliteGalaxies(count), [count]);
  const galaxyRefs = useRef(satelliteGalaxies.map(() => ({ angle: Math.random() * Math.PI * 2 })));

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    const mainGalaxyRadius = 3;
    let particleIndex = 0;

    // Main galaxy (70% of particles)
    const mainGalaxyParticles = Math.floor(count * 0.7);
    for (let i = 0; i < mainGalaxyParticles; i++) {
      const i3 = particleIndex * 3;
      
      const theta = Math.random() * Math.PI * 2;
      // More particles toward center using exponential distribution
      const r = Math.pow(Math.random(), 1.5) * mainGalaxyRadius;
      
      positions[i3] = r * Math.cos(theta);
      positions[i3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i3 + 2] = r * Math.sin(theta);
      
      const distanceFromCenter = Math.sqrt(
        positions[i3] * positions[i3] + 
        positions[i3 + 2] * positions[i3 + 2]
      );
      
      const color = new THREE.Color();
      color.setHSL(
        0.6,
        0.9,
        Math.max(0.5, 1 - (distanceFromCenter / mainGalaxyRadius))
      );
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      particleIndex++;
    }

    // Satellite galaxies
    satelliteGalaxies.forEach(galaxy => {
      const galaxyParticles = Math.floor(galaxy.particles);
      for (let i = 0; i < galaxyParticles; i++) {
        const i3 = particleIndex * 3;
        
        const theta = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 2) * galaxy.radius;
        
        positions[i3] = galaxy.x + r * Math.cos(theta);
        positions[i3 + 1] = galaxy.y + (Math.random() - 0.5) * 0.1;
        positions[i3 + 2] = galaxy.z + r * Math.sin(theta);
        
        const distanceFromGalaxyCenter = Math.sqrt(
          Math.pow(positions[i3] - galaxy.x, 2) + 
          Math.pow(positions[i3 + 2] - galaxy.z, 2)
        );
        
        const color = new THREE.Color();
        color.setHSL(
          0.55, // Slightly different hue for satellite galaxies
          0.9,
          Math.max(0.6, 1 - (distanceFromGalaxyCenter / galaxy.radius))
        );
        
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
        
        particleIndex++;
      }
    });
    
    return { positions, colors };
  }, [count, satelliteGalaxies]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y += 0.0003;
      
      // Update satellite galaxy positions
      const positions = points.current.geometry.attributes.position.array;
      let particleIndex = Math.floor(count * 0.7) * 3; // Start after main galaxy

      satelliteGalaxies.forEach((galaxy, index) => {
        // Update galaxy angle
        const ref = galaxyRefs.current[index];
        ref.angle += galaxy.speed;

        // Calculate new position
        const newX = Math.cos(ref.angle) * galaxy.orbitRadius;
        const newZ = Math.sin(ref.angle) * galaxy.orbitRadius;
        
        // Update particles for this galaxy
        const particleCount = Math.floor(galaxy.particles);
        for (let i = 0; i < particleCount; i++) {
          const baseIndex = particleIndex + (i * 3);
          const localX = positions[baseIndex] - galaxy.x;
          const localZ = positions[baseIndex + 2] - galaxy.z;

          positions[baseIndex] = newX + localX;
          positions[baseIndex + 2] = newZ + localZ;
        }

        // Update galaxy position for next frame
        galaxy.x = newX;
        galaxy.z = newZ;
      });

      points.current.geometry.attributes.position.needsUpdate = true;
      if (materialRef.current) {
        materialRef.current.time = state.clock.getElapsedTime();
      }
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particlesPosition.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <galaxyParticleMaterial 
        ref={materialRef}
        transparent
        depthWrite={false}
        size={particleSize}
        vertexColors
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

GalaxyParticles.propTypes = {
  count: PropTypes.number,
  particleSize: PropTypes.number
};

// Add NebulaMist component definition
const NebulaMist = () => {
  const meshRef = useRef();
  const materialRef = useRef();
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} scale={[50, 50, 50]}>
      <sphereGeometry args={[1, 32, 32]} />
      <nebulaMaterial ref={materialRef} transparent={true} depthWrite={false} />
    </mesh>
  );
};

// Add custom blinking stars component
const BlinkingStars = () => {
  const starsRef = useRef();
  const particlesCount = 5000;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    const delays = new Float32Array(particlesCount);
    
    for (let i = 0; i < particlesCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
      delays[i] = Math.random() * Math.PI * 2; // Random phase offset
    }
    
    return { positions: pos, delays };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const material = starsRef.current.material;
    
    // Create blinking effect by modulating size
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;
      const delay = positions.delays[i];
      const blink = Math.sin(time * 2 + delay) * 0.5 + 0.5;
      starsRef.current.geometry.attributes.size.array[i] = blink * 0.05 + 0.02;
    }
    starsRef.current.geometry.attributes.size.needsUpdate = true;
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particlesCount}
          array={new Float32Array(particlesCount).fill(0.03)}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
};

// Main Scene Component
const SpaceScene = () => {
  const [quality, setQuality] = useState('medium');

  const handlePerformance = useCallback((factor) => {
    setQuality(factor < 0.7 ? 'low' : factor < 0.9 ? 'medium' : 'high');
  }, []);

  return (
    <>
      <color attach="background" args={['#000000']} />
      <PerformanceMonitor onIncline={handlePerformance} onDecline={handlePerformance}>
        <Suspense fallback={null}>
          <BlinkingStars />
          <GalaxyParticles count={180000} particleSize={0.02} />
          <NebulaMist />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            minDistance={5}
            maxDistance={20}
            makeDefault
          />
        </Suspense>
      </PerformanceMonitor>
    </>
  );
};

// Create HTMLLoader component (without export)
const HTMLLoader = () => {
  const { progress } = useProgress();
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-white text-xl">
        Loading Scene... {progress.toFixed(0)}%
      </div>
    </div>
  );
};

// Update FullscreenButton component
const FullscreenButton = ({ containerRef }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <button
      onClick={toggleFullScreen}
      className="absolute top-4 right-4 z-10 bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-black/70 transition-colors"
      aria-label="Toggle fullscreen"
    >
      {isFullscreen ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4H4v5h5zm0 0v6m0-6h6m-6 6H4v5h5v-5zm0 0h6m6-6V4h-5v5h5zm0 0v6m0-6h-6m6 6h-5v5h5v-5zm0 0h-6" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0-4l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      )}
    </button>
  );
};

FullscreenButton.propTypes = {
  containerRef: PropTypes.object.isRequired
};

// Update Page3Scene component
const Page3Scene = () => {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <FullscreenButton containerRef={containerRef} />
      <Canvas
        camera={{ position: [8, 5, 8], fov: 60 }}
        dpr={[1, 2]}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true
        }}
      >
        <ErrorBoundary>
          <Suspense fallback={<HTMLLoader />}>
            <SpaceScene />
          </Suspense>
        </ErrorBoundary>
      </Canvas>
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Scene Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export { Page3Scene as default, HTMLLoader };
