import {
  motion,
  useScroll,
  useVelocity,
  useTransform,
  useSpring,
} from "framer-motion";
import React, { useRef } from "react";
import PropTypes from 'prop-types';

const VelocityText = ({ 
  text = "Your text here",
  containerHeight = "1000vh",
  backgroundColor = "neutral-50",
  textColor = "neutral-950",
  textSize = "text-5xl md:text-7xl",
  velocityRange = [-0.5, 0.5],
  skewRange = ["45deg", "-45deg"],
  xRange = [0, -4000],
  springConfig = { mass: 3, stiffness: 400, damping: 50 }
}) => {
  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const scrollVelocity = useVelocity(scrollYProgress);

  const skewXRaw = useTransform(
    scrollVelocity,
    velocityRange,
    skewRange
  );
  const skewX = useSpring(skewXRaw, springConfig);

  const xRaw = useTransform(scrollYProgress, [0, 1], xRange);
  const x = useSpring(xRaw, springConfig);

  return (
    <section
      ref={targetRef}
      className={`h-[${containerHeight}] bg-${backgroundColor} text-${textColor}`}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.p
          style={{ skewX, x }}
          className={`origin-bottom-left whitespace-nowrap ${textSize} font-black uppercase leading-[0.85]`}
        >
          {text}
        </motion.p>
      </div>
    </section>
  );
};

VelocityText.propTypes = {
  text: PropTypes.string,
  containerHeight: PropTypes.string,
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  textSize: PropTypes.string,
  velocityRange: PropTypes.arrayOf(PropTypes.number),
  skewRange: PropTypes.arrayOf(PropTypes.string),
  xRange: PropTypes.arrayOf(PropTypes.number),
  springConfig: PropTypes.shape({
    mass: PropTypes.number,
    stiffness: PropTypes.number,
    damping: PropTypes.number
  })
};

export default VelocityText;