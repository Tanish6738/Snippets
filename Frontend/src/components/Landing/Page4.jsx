import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import TiltedCard from '../../blocks/Components/TiltedCard/TiltedCard';

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
      {/* Background gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030014] via-[#030014]/90 to-[#030014]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" ref={contentRef}>
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
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

        {/* Testimonials grid */}
        <motion.div style={{ y }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <TiltedCard
                imageSrc={testimonial.image}
                altText={`${testimonial.name} testimonial`}
                captionText={testimonial.name}
                containerHeight="400px"
                containerWidth="100%"
                imageHeight="400px"
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
      </div>
    </section>
  );
};

export default Page4;
