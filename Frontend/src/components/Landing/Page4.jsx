import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import TiltedCard from '../../blocks/Components/TiltedCard/TiltedCard';
import Squares from '../../blocks/Backgrounds/Squares/Squares';

const testimonials = [
  {
    image: "/test.png",
    
  },
  {
    image: "/test.png",
    
  },
  {
    image: "/test.png",
   
  }
];

const InteractiveBackground = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Squares 
        speed={0.5} 
        squareSize={40}
        direction='diagonal'
        borderColor='rgba(255, 255, 255, 0.1)'
        hoverFillColor='rgba(99, 102, 241, 0.2)'
      />
      {/* Add gradient overlay to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030014]/80 via-transparent to-[#030014]/80 pointer-events-none" />
    </div>
  );
};

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
      {/* Interactive Background */}
      <InteractiveBackground />

      {/* Content Container with spacing for background interaction */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" ref={contentRef}>
        {/* Section title with reduced bottom margin */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-white">
              Loved by Developers Worldwide
            </span>
            <motion.div
              className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500"
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </h2>
        </motion.div>

        {/* Testimonials grid with spacing for background interaction */}
        <motion.div 
          style={{ y }} 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-32"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="backdrop-blur-sm rounded-xl"
            >
              <TiltedCard
                imageSrc={testimonial.image}
                altText={`Testimonial ${index + 1}`}
                captionText={`Testimonial ${index + 1}`}
                containerHeight="300px"
                containerWidth="100%"
                imageHeight="300px"
                imageWidth="100%"
                rotateAmplitude={12}
                scaleOnHover={1.05}
                showMobileWarning={false}
                showTooltip={true}
                displayOverlayContent={true}
                overlayContent={
                  <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/50 to-transparent rounded-[15px]">
                  </div>
                }
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Add space at the bottom for background interaction */}
        <div className="h-32 md:h-64" />
      </div>
    </section>
  );
};

export default Page4;
