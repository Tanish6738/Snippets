import React, { Suspense, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Page3Scene, { HTMLLoader } from './Page3Scene';

const FeatureCard = ({ title, description, delay }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    className="space-y-3"
  >
    <h4 className="text-2xl font-semibold text-indigo-300">
      {title}
    </h4>
    <p className="text-lg text-gray-300 leading-relaxed">
      {description}
    </p>
  </motion.div>
);

const Page3 = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const features = [
    {
      title: "Group Collaboration",
      description: "Create or join groups to work on shared snippets and communicate in real-time.",
      delay: 0.2
    },
    {
      title: "Community Blogging",
      description: "Contribute to the knowledge pool by publishing blogs on tips, tutorials, or development stories.",
      delay: 0.4
    }
  ];

  return (
    <section ref={ref} className="h-screen w-full bg-black flex flex-col">
      <AnimatePresence>
        {inView && (
          <>
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-white text-center py-8"
            >
              Collaborate With Others
            </motion.h2>
            
            <div className="flex-1 flex flex-col lg:flex-row">
              <div className="lg:w-1/2 h-full flex items-center justify-center p-8 border-r border-indigo-900/30">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-xl space-y-8 text-white"
                >
                  <div className="space-y-6">
                    <h3 className="text-4xl font-semibold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent leading-tight">
                      Collaborate. Share.<br />Grow Together.
                    </h3>
                    
                    <div className="space-y-8">
                      {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="lg:w-1/2 h-full relative">
                <Suspense fallback={<HTMLLoader />}>
                  <Page3Scene />
                </Suspense>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Page3;
