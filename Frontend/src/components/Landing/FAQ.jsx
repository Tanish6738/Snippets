import React from 'react';
import { HoverImageLinks } from '../UI/HoverImageLinks';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const footerLinks = [
  {
    heading: "Documentation",
    subheading: "Learn how to use our platform effectively",
    imgSrc: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29kaW5nfGVufDB8fDB8fHww",
    href: "/docs",
  },
  {
    heading: "Features Guide",
    subheading: "Explore our powerful features and capabilities",
    imgSrc: "https://plus.unsplash.com/premium_photo-1661877737564-3dfd7282efcb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Y29kaW5nfGVufDB8fDB8fHww",
    href: "/features",
  },
  {
    heading: "Support",
    subheading: "Get help and connect with our community",
    imgSrc: "https://plus.unsplash.com/premium_photo-1720287601920-ee8c503af775?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGNvZGluZ3xlbnwwfHwwfHx8MA%3D%3D",
    href: "/support",
  },
];

const FAQ = () => {
  return (
    <section className="relative ">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
          Frequently Used Links
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Everything you need to know about our platform
        </p>
      </motion.div>

      <HoverImageLinks 
        links={footerLinks}
        className="bg-transparent p-4 md:p-8"
        containerClassName="mx-auto max-w-5xl"
      />

      {/* Add gradient overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030014]/0 via-transparent to-[#030014]" />
      </div>
    </section>
  );
};

export default FAQ;
