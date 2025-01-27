import { forwardRef, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";

function useAnimationFrame(callback) {
  useEffect(() => {
    let frameId;
    const loop = () => {
      callback();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [callback]);
}

const AnimatedProximityText = forwardRef((props, ref) => {
  const {
    text,
    radius = 150,
    fromWeight = 400,
    toWeight = 700,
    className = "",
    style,
    ...restProps
  } = props;

  const letterRefs = useRef([]);
  const containerRef = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (x, y) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mousePositionRef.current = { x: x - rect.left, y: y - rect.top };
      }
    };

    const handleMouseMove = (ev) => updatePosition(ev.clientX, ev.clientY);
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useAnimationFrame(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    letterRefs.current.forEach((letterRef) => {
      if (!letterRef) return;

      const rect = letterRef.getBoundingClientRect();
      const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
      const letterCenterY = rect.top + rect.height / 2 - containerRect.top;

      const distance = Math.sqrt(
        Math.pow(mousePositionRef.current.x - letterCenterX, 2) +
        Math.pow(mousePositionRef.current.y - letterCenterY, 2)
      );

      const intensity = Math.max(0, 1 - distance / radius);
      const weight = fromWeight + (toWeight - fromWeight) * (intensity * intensity);
      
      letterRef.style.fontWeight = Math.round(weight);
    });
  });

  return (
    <motion.span
      ref={(el) => {
        containerRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      style={{
        display: "inline-block",
        ...style,
      }}
      className={className}
      {...restProps}
    >
      {text.split(" ").map((word, wordIndex, words) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {word.split("").map((letter, letterIndex) => (
            <motion.span
              key={`${wordIndex}-${letterIndex}`}
              ref={el => letterRefs.current.push(el)}
              style={{
                display: "inline-block",
                transition: "font-weight 0.05s ease-out",
              }}
            >
              {letter}
            </motion.span>
          ))}
          {wordIndex < words.length - 1 && " "}
        </span>
      ))}
    </motion.span>
  );
});

AnimatedProximityText.displayName = "AnimatedProximityText";
export default AnimatedProximityText;
