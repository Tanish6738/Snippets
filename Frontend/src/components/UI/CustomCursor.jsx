import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Add a styled container component at the top
const CursorContainer = ({ children, isVisible }) => {
  return (
    <div 
      className={isVisible ? 'custom-cursor-wrapper' : ''}
      style={{
        cursor: isVisible ? 'none' : 'auto',
      }}
    >
      {children}
    </div>
  );
};

export const CursorOne = ({ 
  isVisible = true, 
  text = "", 
  cursorSize = 48,
  trackingElement = typeof window !== 'undefined' ? document : null,
  children 
}) => {
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const element = trackingElement || document;
    const mouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    element.addEventListener('mousemove', mouseMove);
    return () => element.removeEventListener('mousemove', mouseMove);
  }, [trackingElement]);

  return (
    <CursorContainer isVisible={isVisible}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed top-0 left-0 pointer-events-none z-50"
            style={{
              left: position.x,
              top: position.y,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 256 256"
                width={cursorSize}
                height={cursorSize}
                className="text-slate-900"
              >
                <defs>
                  <linearGradient x1="34.618" y1="11.573" x2="17.284" y2="28.908" gradientUnits="userSpaceOnUse" id="color-1">
                    <stop offset="0" stopColor="#60feeb"></stop>
                    <stop offset="1" stopColor="#ffffff"></stop>
                  </linearGradient>
                </defs>
                <g fill="none" fillRule="nonzero" stroke="none" strokeWidth="none" strokeLinecap="none" strokeLinejoin="none" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0" fontFamily="none" fontWeight="none" fontSize="none" textAnchor="none" style={{ mixBlendMode: 'normal' }}>
                  <g transform="scale(5.33333,5.33333)">
                    <path d="M34.625,18.575l-22.462,-10.864c-0.734,-0.355 -1.562,0.271 -1.42,1.074l4.338,24.572c0.152,0.86 1.256,1.126 1.783,0.429l4.444,-5.879l9.384,12.086c0.333,0.44 0.96,0.528 1.401,0.194l4.785,-3.619c0.44,-0.333 0.528,-0.96 0.194,-1.401l-9.384,-12.086l6.866,-2.675c0.813,-0.316 0.858,-1.451 0.071,-1.831z" fill="url(#color-1)" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter"></path>
                    <path d="M30.696,27.048l-2.556,-3.291l6.866,-2.675c0.814,-0.317 0.859,-1.452 0.072,-1.832l-22.462,-10.864c-0.734,-0.355 -1.562,0.271 -1.42,1.074l1.464,8.562" fill="none" stroke="#22b3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M13.572,22.919l1.962,11.112c0.152,0.86 1.256,1.126 1.783,0.429l4.444,-5.879l9.384,12.086c0.333,0.44 0.96,0.528 1.401,0.194l4.785,-3.619c0.44,-0.333 0.528,-0.96 0.194,-1.401l-3.258,-4.196" fill="none" stroke="#22b3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                  </g>
                </g>
              </svg>
              {text && (
                <div className="absolute bottom-[-30px] right-[-50px] bg-slate-900 text-teal-300 text-xs py-1 px-2 rounded">
                  {text}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CursorContainer>
  );
};

export const CursorTwo = ({ 
  isVisible = true,
  cursorSize = 36,
  blurSize = 100,
  blurColor = "rgba(64, 224, 208, 0.5)",
  trackingElement = typeof window !== 'undefined' ? document : null,
  children
}) => {
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const element = trackingElement || document;
    const mouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    element.addEventListener('mousemove', mouseMove);
    return () => element.removeEventListener('mousemove', mouseMove);
  }, [trackingElement]);

  return (
    <CursorContainer isVisible={isVisible}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed top-0 left-0 pointer-events-none z-50"
            style={{
              left: position.x,
              top: position.y,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width={cursorSize}
                height={cursorSize}
                viewBox="0 0 24 24"
                className="text-slate-900"
              >
                <defs>
                  <linearGradient id="a" x1="11.992" x2="11.992" y1="22.192" y2="1.803" gradientUnits="userSpaceOnUse">
                    <stop stopOpacity="1" stopColor="#2bdada" offset="0"></stop>
                    <stop stopOpacity="1" stopColor="#008080" offset="1"></stop>
                  </linearGradient>
                </defs>
                <g>
                  <path
                    fill="url(#a)"
                    d="m21.606 10.789-7.437 3.38-3.38 7.437a1 1 0 0 1-1.844-.055L1.875 3.166a1.007 1.007 0 0 1 1.292-1.291l18.385 7.07a1.006 1.006 0 0 1 .054 1.844z"
                    opacity="1"
                  ></path>
                </g>
              </svg>
              <div
                className="pointer-events-none absolute rounded-full"
                style={{
                  width: `${blurSize}px`,
                  height: `${blurSize}px`,
                  background: blurColor,
                  filter: 'blur(50px)',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CursorContainer>
  );
};