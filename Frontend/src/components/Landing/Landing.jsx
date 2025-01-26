import React, { Suspense, lazy, useState, useEffect } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import Page3 from './Page3'
// Eager load critical components
import Hero from './Hero'

// Lazy load non-critical components
const KeyFeatures = lazy(() => import('./KeyFeatures'))
// const Page3 = lazy(() => import('./Page3'))
const StarsCanvas = lazy(() => import('./StartBackground'))
const Page4 = lazy(() => import('./Page4'))

// Enhanced loading placeholder with progress indication
const LoadingPlaceholder = ({ progress }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="w-full h-full fixed inset-0 bg-[#030014] flex items-center justify-center"
  >
    <div className="relative flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
      <div className="mt-4 text-indigo-300 font-medium">
        Loading... {progress}%
      </div>
    </div>
  </motion.div>
);

// Section transition wrapper
const SectionWrapper = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.8,
      delay: delay,
      ease: "easeOut"
    }}
  >
    {children}
  </motion.div>
);

const Landing = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { scrollYProgress } = useScroll();
  const [componentsLoaded, setComponentsLoaded] = useState({
    stars: false,
    keyFeatures: false,
    page3: false,
    page4: false
  });

  useEffect(() => {
    let totalProgress = 0;
    const componentsToLoad = 4; // Total number of components

    const loadComponents = async () => {
      try {
        await Promise.all([
          import('./StartBackground').then(() => {
            setComponentsLoaded(prev => ({ ...prev, stars: true }));
            totalProgress += 25;
            setLoadingProgress(totalProgress);
          }),
          import('./KeyFeatures').then(() => {
            setComponentsLoaded(prev => ({ ...prev, keyFeatures: true }));
            totalProgress += 25;
            setLoadingProgress(totalProgress);
          }),
          import('./Page3').then(() => {
            setComponentsLoaded(prev => ({ ...prev, page3: true }));
            totalProgress += 25;
            setLoadingProgress(totalProgress);
          }),
          import('./Page4').then(() => {
            setComponentsLoaded(prev => ({ ...prev, page4: true }));
            totalProgress += 25;
            setLoadingProgress(totalProgress);
          })
        ]);
        
        // Smooth transition delay
        setTimeout(() => setIsLoading(false), 800);
      } catch (error) {
        console.error('Error loading components:', error);
        setIsLoading(false);
      }
    };

    loadComponents();
  }, []);

  return (
    <div className="bg-[#030014] text-white min-h-screen w-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoading && <LoadingPlaceholder progress={loadingProgress} />}
      </AnimatePresence>

      {/* Stars Background with enhanced fallback */}
      <Suspense 
        fallback={
          <div className="fixed inset-0 bg-[#030014]">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent" />
          </div>
        }
      >
        <motion.div 
          className="fixed inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <StarsCanvas />
        </motion.div>
      </Suspense>
      
      {/* Main content with section transitions */}
      <div className="relative z-10">
        <SectionWrapper>
          <Hero />
        </SectionWrapper>

        <SectionWrapper delay={0.2}>
          <div className="relative isolate">
            <KeyFeatures />
          </div>
        </SectionWrapper>

        <SectionWrapper delay={0.4}>
          <div className="relative">
            <Page3 />
          </div>
        </SectionWrapper>

        <Suspense 
          fallback={
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen flex items-center justify-center"
            >
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </motion.div>
          }
        >
          <SectionWrapper delay={0.6}>
            <Page4 />
          </SectionWrapper>
        </Suspense>
      </div>

      {/* Scroll progress indicator */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-1 bg-indigo-500/20"
        style={{
          scaleX: useTransform(scrollYProgress, [0, 1], [0, 1]),
          transformOrigin: "0%"
        }}
      />
    </div>
  );
};

export default Landing;
