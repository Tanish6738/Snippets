/*
	jsrepo 1.28.4
	Installed from https://reactbits.dev/tailwind/
	26-1-2025
*/

// InfiniteScroll.jsx

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(Observer);

export default function InfiniteScroll({
  // ----- Layout / Style Props -----
  width = "30rem",             // Width of the outer wrapper
  maxHeight = "100%",          // Max-height of the outer wrapper
  negativeMargin = "-0.5em",   // Negative margin to reduce spacing between items
  // ----- Items Prop -----
  items = [],                  // Array of items with { content: ... }
  itemMinHeight = 150,         // Fixed height for each item
  // ----- Tilt Props -----
  isTilted = false,            // Whether the container is in "skewed" perspective
  tiltDirection = "left",      // tiltDirection: "left" or "right"
  // ----- Autoplay Props -----
  autoplay = false,            // Whether it should automatically scroll
  autoplaySpeed = 0.5,          // Speed (pixels/frame approx.)
  autoplayDirection = "down",  // "down" or "up"
  pauseOnHover = false,        // Pause autoplay on hover
  // ----- New Props -----
  perspective = "1000px",    // Added perspective control
  containerWidth = "100%",   // Added container width control
  alignment = "center",      // Added alignment control: 'left', 'center', 'right'
  spacing = "2rem",         // Added spacing control
  itemWidth = "90%",        // Added item width control
}) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);

  const getTiltTransform = () => {
    if (!isTilted) return "none";
    const angle = 12; // Reduced angle for better readability
    return tiltDirection === "left"
      ? `perspective(${perspective}) rotateY(-${angle}deg)`
      : `perspective(${perspective}) rotateY(${angle}deg)`;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (items.length === 0) return;

    const divItems = gsap.utils.toArray(container.children);
    if (!divItems.length) return;

    const firstItem = divItems[0];
    const itemStyle = getComputedStyle(firstItem);
    const itemHeight = firstItem.offsetHeight;
    const itemMarginTop = parseFloat(itemStyle.marginTop) || 0;
    const totalItemHeight = itemHeight + itemMarginTop;
    const totalHeight =
      itemHeight * items.length + itemMarginTop * (items.length - 1);

    const wrapFn = gsap.utils.wrap(-totalHeight, totalHeight);

    divItems.forEach((child, i) => {
      const y = i * totalItemHeight;
      gsap.set(child, { y });
    });

    const observer = Observer.create({
      target: container,
      type: "wheel,touch,pointer",
      preventDefault: true,
      onPress: ({ target }) => {
        target.style.cursor = "grabbing";
      },
      onRelease: ({ target }) => {
        target.style.cursor = "grab";
      },
      onChange: ({ deltaY, isDragging, event }) => {
        const d = event.type === "wheel" ? -deltaY : deltaY;
        const distance = isDragging ? d * 5 : d * 10;
        divItems.forEach((child) => {
          gsap.to(child, {
            duration: 0.5,
            ease: "expo.out",
            y: `+=${distance}`,
            modifiers: {
              y: gsap.utils.unitize(wrapFn),
            },
          });
        });
      },
    });

    let rafId;
    if (autoplay) {
      const directionFactor = autoplayDirection === "down" ? 1 : -1;
      const speedPerFrame = autoplaySpeed * directionFactor;

      const tick = () => {
        divItems.forEach((child) => {
          gsap.set(child, {
            y: `+=${speedPerFrame}`,
            modifiers: {
              y: gsap.utils.unitize(wrapFn),
            },
          });
        });
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);

      if (pauseOnHover) {
        const stopTicker = () => rafId && cancelAnimationFrame(rafId);
        const startTicker = () => (rafId = requestAnimationFrame(tick));

        container.addEventListener("mouseenter", stopTicker);
        container.addEventListener("mouseleave", startTicker);

        return () => {
          observer.kill();
          stopTicker();
          container.removeEventListener("mouseenter", stopTicker);
          container.removeEventListener("mouseleave", startTicker);
        };
      } else {
        return () => {
          observer.kill();
          rafId && cancelAnimationFrame(rafId);
        };
      }
    }

    return () => {
      observer.kill();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    items,
    autoplay,
    autoplaySpeed,
    autoplayDirection,
    pauseOnHover,
    isTilted,
    tiltDirection,
    negativeMargin,
  ]);

  return (
    <div
      className="relative w-full overflow-hidden overscroll-none"
      ref={wrapperRef}
      style={{ 
        maxHeight,
        perspective,
        perspectiveOrigin: "center"
      }}
    >
      {/* Enhanced Gradient Overlays */}
      <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-[#030014] via-[#030014]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[150px] bg-gradient-to-t from-[#030014] via-[#030014]/80 to-transparent z-10 pointer-events-none" />

      {/* Container */}
      <div
        className="flex flex-col overscroll-contain cursor-grab"
        ref={containerRef}
        style={{
          width: containerWidth,
          maxWidth: "1400px",
          margin: "0 auto",
          transform: getTiltTransform(),
          transformStyle: "preserve-3d",
          padding: `${spacing} 0`,
        }}
      >
        {items.map((item, i) => (
          <div
            className="flex items-center justify-center select-none box-border"
            key={i}
            style={{
              width: itemWidth,
              minHeight: `${itemMinHeight}px`,
              marginTop: negativeMargin,
              marginLeft: alignment === 'center' ? 'auto' : 
                         alignment === 'right' ? 'auto' : '0',
              marginRight: alignment === 'center' ? 'auto' : 
                          alignment === 'left' ? 'auto' : '0',
              transform: `translateZ(0)`,
            }}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
