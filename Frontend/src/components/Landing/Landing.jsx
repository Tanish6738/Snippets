import React, { Suspense, lazy, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Eager load critical components
import Hero from './Hero'

// Lazy load non-critical components
const KeyFeatures = lazy(() => import('./KeyFeatures'))
const Page3 = lazy(() => import('./Page3'))
const StarsCanvas = lazy(() => import('./StartBackground'))

// Enhanced loading placeholder
const LoadingPlaceholder = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="w-full h-full fixed inset-0 bg-[#030014] flex items-center justify-center"
  >
    <div className="relative">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    </div>
  </motion.div>
);

const Landing = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [componentsLoaded, setComponentsLoaded] = useState({
    stars: false,
    keyFeatures: false,
    page3: false
  });

  // Handle component loading
  useEffect(() => {
    const loadComponents = async () => {
      try {
        // Load components in parallel
        await Promise.all([
          import('./StartBackground').then(() => setComponentsLoaded(prev => ({ ...prev, stars: true }))),
          import('./KeyFeatures').then(() => setComponentsLoaded(prev => ({ ...prev, keyFeatures: true }))),
          import('./Page3').then(() => setComponentsLoaded(prev => ({ ...prev, page3: true })))
        ]);
        
        // Add a small delay to ensure smooth transition
        setTimeout(() => setIsLoading(false), 500);
      } catch (error) {
        console.error('Error loading components:', error);
        setIsLoading(false);
      }
    };

    loadComponents();
  }, []);

  return (
    <div className="bg-[#030014] text-white min-h-screen w-full relative">
      <AnimatePresence>
        {isLoading && <LoadingPlaceholder />}
      </AnimatePresence>

      {/* Stars Background with fallback */}
      <Suspense fallback={<div className="fixed inset-0 bg-[#030014]" />}>
        <motion.div 
          className="fixed inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <StarsCanvas />
        </motion.div>
      </Suspense>
      
      {/* Main content */}
      <div className="relative z-10">
        <Hero />
        {/* KeyFeatures now has its own layer context */}
        <div className="relative isolate">
          <KeyFeatures />
        </div>
        <Page3 />
      </div>
    </div>
  );
};

export default Landing;
