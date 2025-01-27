/*
	jsrepo 1.28.4
	Installed from https://reactbits.dev/tailwind/
	26-1-2025
*/

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

function useMousePositionRef(containerRef) {
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (x, y) => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        positionRef.current = { x: x - rect.left, y: y - rect.top };
      } else {
        positionRef.current = { x, y };
      }
    };

    const handleMouseMove = (ev) => updatePosition(ev.clientX, ev.clientY);
    const handleTouchMove = (ev) => {
      ev.preventDefault();
      const touch = ev.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [containerRef]);

  return positionRef;
}

const VariableProximity = forwardRef((props, ref) => {
  const {
    label,
    fromFontVariationSettings = "'wght' 400",
    toFontVariationSettings = "'wght' 1000",
    containerRef,
    radius = 100,
    falloff = "exponential",
    className = "",
    onClick,
    style,
    ...restProps
  } = props;

  const letterRefs = useRef([]);
  const interpolatedSettingsRef = useRef([]);
  const mousePositionRef = useMousePositionRef(containerRef);

  const parsedSettings = useMemo(() => {
    const parseSettings = (settingsStr) =>
      new Map(
        settingsStr.split(",")
          .map(s => s.trim())
          .map(s => {
            const [name, value] = s.split(" ");
            return [name.replace(/['"]/g, ""), parseFloat(value)];
          })
      );

    const fromSettings = parseSettings(fromFontVariationSettings);
    const toSettings = parseSettings(toFontVariationSettings);

    return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
      axis,
      fromValue,
      toValue: toSettings.get(axis) ?? fromValue,
    }));
  }, [fromFontVariationSettings, toFontVariationSettings]);

  useEffect(() => {
    letterRefs.current.forEach((letterRef) => {
      if (letterRef) {
        letterRef.style.fontVariationSettings = fromFontVariationSettings;
      }
    });
  }, [fromFontVariationSettings]);

  useAnimationFrame(() => {
    if (!containerRef?.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    letterRefs.current.forEach((letterRef, index) => {
      if (!letterRef) return;

      const rect = letterRef.getBoundingClientRect();
      const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
      const letterCenterY = rect.top + rect.height / 2 - containerRect.top;

      const distance = Math.sqrt(
        Math.pow(mousePositionRef.current.x - letterCenterX, 2) +
        Math.pow(mousePositionRef.current.y - letterCenterY, 2)
      );

      let intensity = Math.max(0, 1 - distance / radius);
      
      if (falloff === "exponential") {
        intensity = intensity * intensity;
      } else if (falloff === "gaussian") {
        intensity = Math.exp(-Math.pow(distance / (radius / 2), 2) / 2);
      }

      const settings = parsedSettings
        .map(({ axis, fromValue, toValue }) => {
          const value = fromValue + (toValue - fromValue) * intensity;
          return `'${axis}' ${Math.round(value)}`;
        })
        .join(", ");

      letterRef.style.fontVariationSettings = settings;
      interpolatedSettingsRef.current[index] = settings;
    });
  });

  return (
    <motion.span
      ref={ref}
      onClick={onClick}
      style={{
        display: "inline-block",
        fontFamily: '"Roboto Flex", sans-serif',
        lineHeight: 1.2,
        ...style,
      }}
      className={className}
      {...restProps}
    >
      {label.split(" ").map((word, wordIndex, words) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {word.split("").map((letter, letterIndex) => (
            <motion.span
              key={`${wordIndex}-${letterIndex}`}
              ref={el => letterRefs.current.push(el)}
              style={{
                display: "inline-block",
                fontVariationSettings: fromFontVariationSettings,
                transition: "font-variation-settings 0.05s ease-out",
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

VariableProximity.displayName = "VariableProximity";
export default VariableProximity;
