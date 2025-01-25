import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const KeyFeatures = () => {
  const features = [
    {
      title: "Organize Code Snippets",
      description: "Easily store and categorize frequently used or complex code snippets in custom directories.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      title: "Privacy Controls",
      description: "Set your snippets as public or private and foster collaboration by sharing publicly.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: "AI-Powered Code Generation",
      description: "Get AI-assisted code suggestions to create, optimize, or debug your snippets effortlessly.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Group Collaboration",
      description: "Collaborate with peers in real-time through shared snippets and group chats.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Community Blogging System",
      description: "Network and grow by sharing tutorials, tips, and experiences with the developer community.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8" />
        </svg>
      )
    }
  ];

  // Generate random clip path for each card
  const getRandomClipPath = () => {
    const points = [];
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const radius = 50 + Math.random() * 5; // Random radius between 50-55%
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      points.push(`${x}% ${y}%`);
    }
    return `polygon(${points.join(', ')})`;
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-violet-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
            Why Choose Our Platform?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 relative">
          {/* Connecting Lines */}
          <div className="absolute inset-0 z-0 hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 
                          mask-image-[linear-gradient(to_bottom,transparent_0%,white_50%,transparent_100%)]"
                 style={{
                   maskImage: 'linear-gradient(to bottom, transparent 0%, white 50%, transparent 100%)',
                   WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 50%, transparent 100%)'
                 }} />
          </div>

          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, translateY: -5 }}
              className={`group relative isolate ${
                index % 2 === 0 ? 'lg:translate-y-8' : ''
              }`}
            >
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {/* Animated Particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-16 h-16 rounded-full 
                                bg-gradient-to-br from-indigo-500/10 to-violet-500/10
                                animate-blob ${i === 1 ? 'animation-delay-2000' : i === 2 ? 'animation-delay-4000' : ''}`}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        filter: 'blur(8px)'
                      }}
                    />
                  ))}
                </div>
                
                {/* Glass Effect Border */}
                <div className="absolute inset-0 rounded-2xl border border-white/10 backdrop-blur-sm" />
              </div>

              {/* Main Card Content */}
              <div className="relative p-8 rounded-2xl transition-all duration-500 overflow-hidden
                            border border-white/[0.1] backdrop-blur-sm
                            before:absolute before:inset-0 before:bg-gradient-to-b 
                            before:from-white/[0.03] before:to-transparent before:pointer-events-none">
                {/* Rainbow Border Effect */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-violet-500/50 via-indigo-500/50 to-violet-500/50 
                              rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
                              animate-border-flow blur-sm" />

                {/* Glow Effect */}
                <div className="absolute inset-[1px] rounded-2xl bg-[#030014] z-[1]" />

                {/* Content Container */}
                <div className="relative z-[2]">
                  {/* Icon Container with Floating Effect */}
                  <div className="relative mb-6">
                    <motion.div
                      animate={{
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-16 h-16 rounded-xl relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 rounded-xl
                                    group-hover:from-indigo-500/30 group-hover:to-violet-500/30 transition-colors duration-500" />
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="text-indigo-300 group-hover:text-indigo-200 transition-colors duration-500">
                          {feature.icon}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Title with Shine Effect */}
                  <h3 className="text-2xl font-semibold mb-4 relative">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 
                                   group-hover:from-indigo-200 group-hover:to-white transition-all duration-500">
                      {feature.title}
                    </span>
                    <div className="absolute inset-0 w-full translate-x-[-100%] group-hover:translate-x-[100%]
                                  bg-gradient-to-r from-transparent via-white/10 to-transparent
                                  transition-transform duration-1000" />
                  </h3>

                  <p className="text-indigo-200/70 group-hover:text-indigo-100/90 transition-colors duration-500 
                               leading-relaxed tracking-wide relative z-10">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <Link
            to="/features"
            className="inline-flex items-center px-8 py-3 rounded-xl text-white
                     bg-gradient-to-r from-indigo-500 to-violet-500 
                     hover:from-indigo-600 hover:to-violet-600
                     transform hover:scale-105 transition-all duration-300
                     shadow-[0_0_15px_rgba(99,102,241,0.25)]
                     hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]
                     relative overflow-hidden group"
          >
            <span className="relative z-10">Discover More Features</span>
            <svg className="w-5 h-5 ml-2 relative z-10 transform group-hover:translate-x-1 transition-transform duration-300" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default KeyFeatures;
