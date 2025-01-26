import React, { Suspense, useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import PropTypes from 'prop-types';
import { 
  Box, Sphere, TorusKnot, Float, MeshDistortMaterial, 
  OrbitControls, Environment, Cloud, Stars, SpotLight, Ring,
  useProgress, shaderMaterial, Loader,
  Instances, Instance, Preload, AdaptiveDpr, AdaptiveEvents,
  PerformanceMonitor, Effects, useGLTF
} from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// Add these new geometric elements
const ComplexSpaceElement = ({ position, scale = 1 }) => {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.5;
    meshRef.current.rotation.z = Math.cos(time * 0.3) * 0.3;
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <torusKnotGeometry args={[1, 0.3, 128, 16]} />
        <MeshDistortMaterial
          color="#4400ff"
          roughness={0.1}
          metalness={0.8}
          distort={0.4}
          speed={2}
        />
      </mesh>
    </Float>
  );
};

// Optimized particle system using instancing
const OptimizedGalaxyParticles = ({ count = 5000, radius = 10 }) => {
  const particles = useMemo(() => 
    [...Array(count)].map((_, i) => {
      const angle = (i / count) * Math.PI * 20;
      const spiralRadius = (i / count) * radius;
      const heightVar = Math.sin(angle * 3) * (radius * 0.05);
      return {
        angle,
        spiralRadius,
        heightVar,
        size: Math.random() * 0.03 + 0.02,
        speed: Math.random() * 0.2 + 0.1,
        color: new THREE.Color().setHSL((i / count) * 0.3 + 0.5, 0.8, 0.5)
      };
    }), [count, radius]);

  const instancedMesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    particles.forEach((particle, i) => {
      const { angle, spiralRadius, heightVar, speed } = particle;
      const currentAngle = angle + time * speed;
      
      dummy.position.x = Math.cos(currentAngle) * spiralRadius;
      dummy.position.z = Math.sin(currentAngle) * spiralRadius;
      dummy.position.y = heightVar + Math.sin(time * 0.5 + angle) * 0.2;
      dummy.rotation.z = time * 0.1;
      dummy.updateMatrix();
      
      instancedMesh.current.setMatrixAt(i, dummy.matrix);
    });
    instancedMesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instancedMesh}
      args={[null, null, count]}
      frustumCulled={true}
    >
      <dodecahedronGeometry args={[0.02, 1]} />
      <meshPhysicalMaterial
        color="#ffffff"
        emissive="#4400ff"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.9}
        toneMapped={false}
      />
    </instancedMesh>
  );
};

OptimizedGalaxyParticles.propTypes = {
  count: PropTypes.number,
  radius: PropTypes.number
};

// Create and extend the shader material
const NebulaShaderMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.1, 0.3, 0.6),
  },
  // vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment shader
  `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      float pattern = fract(sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 - time) * 5.0);
      gl_FragColor = vec4(color * pattern, pattern * 0.5);
    }
  `
);

// Extend Three.js with our custom shader
extend({ NebulaShaderMaterial });

// Add this after the existing NebulaShaderMaterial
const NebulaMaterial = shaderMaterial(
  {
    time: 0,
    color1: new THREE.Color('#ff0080'),
    color2: new THREE.Color('#4400ff'),
    fogDensity: 0.3,
  },
  // vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment shader
  `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float fogDensity;
    varying vec2 vUv;
    varying vec3 vPosition;

    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float n = i.x + i.y * 157.0 + 113.0 * i.z;
      return mix(
        mix(
          mix(fract(sin(n + 0.0) * 43758.5453123), fract(sin(n + 1.0) * 43758.5453123), f.x),
          mix(fract(sin(n + 157.0) * 43758.5453123), fract(sin(n + 158.0) * 43758.5453123), f.x),
          f.y
        ),
        mix(
          mix(fract(sin(n + 113.0) * 43758.5453123), fract(sin(n + 114.0) * 43758.5453123), f.x),
          mix(fract(sin(n + 270.0) * 43758.5453123), fract(sin(n + 271.0) * 43758.5453123), f.x),
          f.y
        ),
        f.z
      );
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

// Add this new component for the central light
const CentralLight = () => {
  const lightRef = useRef();
  const sphereRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    lightRef.current.intensity = 2 + Math.sin(time) * 0.5;
    sphereRef.current.scale.setScalar(1 + Math.sin(time * 0.5) * 0.2);
  });

  return (
    <group>
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        intensity={2}
        distance={100}
        color="#ffffff"
        decay={2}
      >
        <mesh ref={sphereRef}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
      </pointLight>
    </group>
  );
};

// Update NebulaMist for combined colors
const NebulaMist = () => {
  const materialRefs = useRef([]);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    materialRefs.current.forEach(material => {
      if (material) {
        material.time = time;
        // Combine red and blue with pulsing effect
        const pulseIntensity = Math.sin(time * 0.5) * 0.5 + 0.5;
        material.color1 = new THREE.Color(0.8, 0.2, pulseIntensity);
        material.color2 = new THREE.Color(pulseIntensity * 0.5, 0.2, 0.8);
      }
    });
  });

  return (
    <group>
      {[...Array(3)].map((_, i) => (
        <mesh 
          key={i} 
          scale={[200, 200, 200]} 
          position={[
            Math.sin(i * Math.PI * 0.67) * 30,
            i * 20 - 20,
            Math.cos(i * Math.PI * 0.67) * 30
          ]}
        >
          <sphereGeometry args={[1, 64, 64]} />
          <nebulaMaterial
            ref={ref => {
              if (ref) materialRefs.current[i] = ref;
            }}
            transparent
            depthWrite={false}
            fogDensity={0.7}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

const FogLayers = () => {
  return (
    <group>
      {[...Array(5)].map((_, i) => (
        <Cloud
          key={i}
          opacity={0.4}
          speed={0.3}
          width={200}
          depth={50}
          segments={40}
          position={[0, -10 + i * 15, 0]}
          color={i % 2 === 0 ? "#ff4444" : "#4444ff"}
        />
      ))}
      {/* Additional white central fog */}
      <Cloud
        opacity={0.5}
        speed={0.2}
        width={150}
        depth={60}
        segments={50}
        position={[0, 0, 0]}
        color="#ffffff"
      />
    </group>
  );
};

const MilkyWayCore = () => {
  const coreRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    coreRef.current.rotation.z = time * 0.05;
  });

  return (
    <group ref={coreRef}>
      <mesh>
        <sphereGeometry args={[3, 32, 32]} />
        <meshPhysicalMaterial
          color="#fff"  // Golden yellow core
          emissive="#fff"  // Dark orange glow
          emissiveIntensity={2.5}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
};

// Add this new component after MilkyWayCore component

const SatelliteGalaxy = ({ position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] }) => {
  const groupRef = useRef();
  
  const particles = useMemo(() => {
    const temp = [];
    const numParticles = 500;
    
    for(let i = 0; i < numParticles; i++) {
      const t = i / numParticles;
      const angle = 8 * Math.PI * t;
      const radius = (1 + t * 3) * scale;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      const y = (Math.random() - 0.5) * scale;
      const size = Math.random() * 0.05 + 0.02;
      
      // Indigo color palette
      const color = new THREE.Color().setHSL(
        0.75, // Indigo hue
        0.8,
        0.4 + Math.random() * 0.3
      );
      
      temp.push({ position: [x, y, z], size, color });
    }
    return temp;
  }, [scale]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    groupRef.current.rotation.y = time * 0.1;
  });

  return (
    <group position={position} rotation={rotation} ref={groupRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.size, 6, 6]} />
          <meshBasicMaterial
            color={particle.color}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

const SpiralArm = ({ rotation = 0, armIndex }) => {
  const particles = useMemo(() => {
    const temp = [];
    const numParticles = 2000;
    
    for(let i = 0; i < numParticles; i++) {
      const t = i / numParticles;
      const angle = 4 * Math.PI * t + rotation;
      const radius = 3 + t * 20;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      const y = (Math.random() - 0.5) * 2;
      const size = Math.random() * 0.1 + 0.05;
      const color = new THREE.Color();
      
      // More realistic Milky Way colors
      if (armIndex % 2 === 0) {
        // Mixture of young blue stars and yellow-white stars
        color.setHSL(
          0.6 + Math.random() * 0.1,  // Blue to cyan
          0.7,
          0.7 + Math.random() * 0.3
        );
      } else {
        // Mixture of older yellow and orange stars
        color.setHSL(
          0.12 + Math.random() * 0.05,  // Yellow-orange range
          0.8,
          0.7 + Math.random() * 0.2
        );
      }
      
      temp.push({ position: [x, y, z], size, color });
    }
    return temp;
  }, [rotation, armIndex]);

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshBasicMaterial
            color={particle.color}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

const DustLanes = () => {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {[...Array(3)].map((_, i) => (
        <Cloud
          key={i}
          opacity={0.3}
          speed={0.1}
          width={25}
          depth={5}
          segments={20}
          position={[0, 0, i * 2]}
          color="#2a1a0f"  // Darker reddish-brown for dust lanes
        />
      ))}
    </group>
  );
};

// Add this new component for volumetric lights
const VolumetricLights = () => {
  return (
    <group>
      <SpotLight
        distance={40}
        angle={0.5}
        attenuation={5}
        anglePower={5}
        intensity={2}
        color="#ff3366"
        position={[20, 20, 20]}
      />
      <SpotLight
        distance={40}
        angle={0.5}
        attenuation={5}
        anglePower={5}
        intensity={2}
        color="#3366ff"
        position={[-20, -20, -20]}
      />
      <SpotLight
        distance={40}
        angle={0.5}
        attenuation={5}
        anglePower={5}
        intensity={2}
        color="#ffffff"
        position={[0, 30, 0]}
      />
    </group>
  );
};

// Add this new component for progressive loading
const ProgressiveLoad = ({ children, priority = 0 }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const { gl } = useThree();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, priority * 100);
    return () => clearTimeout(timer);
  }, [priority]);

  return shouldRender ? children : null;
};

// Optimized SpaceScene with performance monitoring
const SpaceScene = () => {
  const [dpr, setDpr] = useState(1.5);
  const [hasError, setHasError] = useState(false);
  const [quality, setQuality] = useState('low');
  const sceneRef = useRef();

  // Performance monitoring callback
  const handlePerformance = useCallback((factor) => {
    if (factor < 0.7) {
      setQuality('low');
      setDpr(1);
    } else if (factor < 0.9) {
      setQuality('medium');
      setDpr(1.5);
    } else {
      setQuality('high');
      setDpr(2);
    }
  }, []);

  const particleCount = useMemo(() => ({
    low: 2000,
    medium: 3000,
    high: 5000
  }), []);

  useEffect(() => {
    // Reset error state when component mounts
    setHasError(false);
  }, []);

  if (hasError) {
    return (
      <group>
        <LoaderScene />
      </group>
    );
  }

  return (
    <ErrorBoundary onError={() => setHasError(true)}>
      <PerformanceMonitor onIncline={handlePerformance} onDecline={handlePerformance}>
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        <Suspense fallback={<LoaderScene />}>
          {/* High priority elements */}
          <ProgressiveLoad priority={0}>
            <Stars
              radius={100}
              depth={50}
              count={particleCount[quality]}
              factor={4}
              saturation={0.5}
              fade
              speed={0.5}
            />
            <CentralLight />
            <ambientLight intensity={0.3} />
          </ProgressiveLoad>

          {/* Medium priority elements */}
          <ProgressiveLoad priority={1}>
            <VolumetricLights />
            <NebulaMist />
            <MilkyWayCore />
          </ProgressiveLoad>

          {/* Lower priority elements */}
          <ProgressiveLoad priority={2}>
            <FogLayers />
            <OptimizedGalaxyParticles 
              count={particleCount[quality]} 
              radius={15} 
            />
          </ProgressiveLoad>

          {/* Lowest priority elements */}
          <ProgressiveLoad priority={3}>
            <Instances limit={quality === 'low' ? 4000 : 8000}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshBasicMaterial toneMapped={false} />
              {[...Array(4)].map((_, i) => (
                <SpiralArm key={i} rotation={(Math.PI * 2 * i) / 4} armIndex={i} />
              ))}
            </Instances>
            <DustLanes />
          </ProgressiveLoad>
        </Suspense>

        <EffectComposer>
          <Bloom
            intensity={quality === 'low' ? 1 : 2}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            height={quality === 'low' ? 200 : 300}
          />
        </EffectComposer>

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={20}
          maxDistance={150}
          autoRotate
          autoRotateSpeed={0.5}
          makeDefault
          dampingFactor={0.05}
          rotateSpeed={0.5}
        />

        <Preload all />
      </PerformanceMonitor>
    </ErrorBoundary>
  );
};

// Create a simple 3D loading indicator
const LoaderScene = () => {
  const meshRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = time * 0.5;
    meshRef.current.rotation.y = time * 0.7;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color="#4400ff"
          wireframe
          distort={0.4}
          speed={2}
        />
      </mesh>
      <pointLight position={[10, 10, 10]} />
      <ambientLight intensity={0.5} />
    </group>
  );
};

// HTML Loader for outside Canvas
export const HTMLLoader = () => {
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

const Page3Scene = () => {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);

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
    <div ref={containerRef} className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 30, 30], fov: 60 }}
        dpr={window.devicePixelRatio}
        performance={{ min: 0.5 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
          precision: "lowp"
        }}
        style={{ 
          opacity: isSceneReady ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }}
        onCreated={({ gl, scene }) => {
          // Initialize renderer settings
          gl.setPixelRatio(window.devicePixelRatio);
          gl.setClearColor(0x000000, 1);
          
          // Mark scene as ready after a short delay
          requestAnimationFrame(() => {
            setIsSceneReady(true);
          });
        }}
      >
        <Suspense fallback={<LoaderScene />}>
          <SpaceScene />
        </Suspense>
      </Canvas>

      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 px-4 py-2 bg-indigo-600/50 hover:bg-indigo-600/70 text-white rounded-lg backdrop-blur-sm transition-colors"
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
    </div>
  );
};

// Add ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Scene Error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default Page3Scene;
