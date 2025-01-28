import React from "react";
import { motion } from "framer-motion";
import PropTypes from 'prop-types';

const DURATION = 0.25;
const STAGGER = 0.025;

const FlipLink = ({ children, href, className = "" }) => {
  return (
    <motion.a
      initial="initial"
      whileHover="hovered"
      href={href}
      className={`relative block overflow-hidden whitespace-nowrap text-4xl font-black uppercase sm:text-7xl md:text-8xl lg:text-9xl ${className}`}
      style={{
        lineHeight: 0.75,
      }}
    >
      <div>
        {children.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: { y: 0 },
              hovered: { y: "-100%" },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={`top-${i}`}
          >
            {l}
          </motion.span>
        ))}
      </div>
      <div className="absolute inset-0">
        {children.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: { y: "100%" },
              hovered: { y: 0 },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={`bottom-${i}`}
          >
            {l}
          </motion.span>
        ))}
      </div>
    </motion.a>
  );
};

const RevealLinks = ({ 
  links = [],
  className = "bg-green-300",
  containerClassName = "grid place-content-center gap-2 px-8 py-24 text-black"
}) => {
  return (
    <section className={`${containerClassName} ${className}`}>
      {links.map((link, index) => (
        <FlipLink 
          key={index} 
          href={link.url}
          className={link.className}
        >
          {link.text}
        </FlipLink>
      ))}
    </section>
  );
};

RevealLinks.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      className: PropTypes.string
    })
  ),
  className: PropTypes.string,
  containerClassName: PropTypes.string
};

FlipLink.propTypes = {
  children: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default RevealLinks;