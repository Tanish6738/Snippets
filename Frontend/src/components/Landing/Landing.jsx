import React, { Suspense, lazy } from 'react'

// Eager load content components
import Hero from './Hero'
import KeyFeatures from './KeyFeatures'
import Page3 from './Page3'

// Fix the import path
const StarsCanvas = lazy(() => import('./StartBackground'))

// Loading placeholder for Suspense
const LoadingPlaceholder = () => (
  <div className="w-full h-full fixed inset-0 bg-[#030014]" />
);

const Landing = () => {
  return (
    <div className="bg-[#030014] text-white min-h-screen w-full relative">
      {/* Stars Background - Fixed positioning and correct z-index */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <div className="fixed inset-0 z-0">
          <StarsCanvas />
        </div>
      </Suspense>
      
      {/* Main content with higher z-index */}
      <div className="relative z-10">
        <Hero />
        <KeyFeatures />
        <Page3 />
      </div>
    </div>
  );
};

export default Landing;
