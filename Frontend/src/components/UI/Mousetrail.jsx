import { useAnimate } from "framer-motion";
import React, { useRef } from "react";
import { FiMousePointer } from "react-icons/fi";

export const Example = () => {
    return (
        <MouseImageTrail
            renderImageBuffer={50}
            rotationRange={25}
            images={[
                "https://images.playground.com/edd09325-bd68-40d2-af98-f7fb64cd1990.jpeg",
                "https://cdn.leonardo.ai/users/1a04a6a9-dd55-4ec5-8990-98f593f6477b/generations/0f88982b-652d-4293-880b-077a2eab56fb/Absolute_Reality_v16_Include_elements_such_as_space_black_hol_0.jpg?w=512",
                "https://cdn.leonardo.ai/users/1a04a6a9-dd55-4ec5-8990-98f593f6477b/generations/0f88982b-652d-4293-880b-077a2eab56fb/Absolute_Reality_v16_Include_elements_such_as_space_black_hol_1.jpg",
                "https://cdn.leonardo.ai/users/1a04a6a9-dd55-4ec5-8990-98f593f6477b/generations/6b21e029-072e-4bdc-9bed-c0e837e091e1/variations/Default_Design_a_captivating_time_travellandescape_as_seen_fro_0_6b21e029-072e-4bdc-9bed-c0e837e091e1_0.jpg"


            ]}
        >
            <section className="grid h-screen w-full place-content-center bg-white">
                <p className="flex items-center gap-2 text-3xl font-bold uppercase text-black">
                    <FiMousePointer />
                    <span>Hover me</span>
                </p>
            </section>
        </MouseImageTrail>
    );
};

export const MouseImageTrail = ({
    children,
    // List of image sources
    images,
    // Will render a new image every X pixels between mouse moves
    renderImageBuffer,
    // images will be rotated at a random number between zero and rotationRange,
    // alternating between a positive and negative rotation
    rotationRange,
}) => {
    const [scope, animate] = useAnimate();

    const lastRenderPosition = useRef({ x: 0, y: 0 });
    const imageRenderCount = useRef(0);

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;

        const distance = calculateDistance(
            clientX,
            clientY,
            lastRenderPosition.current.x,
            lastRenderPosition.current.y
        );

        if (distance >= renderImageBuffer) {
            lastRenderPosition.current.x = clientX;
            lastRenderPosition.current.y = clientY;

            renderNextImage();
        }
    };

    const calculateDistance = (x1, y1, x2, y2) => {
        const deltaX = x2 - x1;
        const deltaY = y2 - y1;

        // Using the Pythagorean theorem to calculate the distance
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        return distance;
    };

    const renderNextImage = () => {
        const imageIndex = imageRenderCount.current % images.length;
        const selector = `[data-mouse-move-index="${imageIndex}"]`;

        const el = document.querySelector(selector);

        el.style.top = `${lastRenderPosition.current.y}px`;
        el.style.left = `${lastRenderPosition.current.x}px`;
        el.style.zIndex = imageRenderCount.current.toString();

        const rotation = Math.random() * rotationRange;

        animate(
            selector,
            {
                opacity: [0, 1],
                transform: [
                    `translate(-50%, -25%) scale(0.5) ${imageIndex % 2
                        ? `rotate(${rotation}deg)`
                        : `rotate(-${rotation}deg)`
                    }`,
                    `translate(-50%, -50%) scale(1) ${imageIndex % 2
                        ? `rotate(-${rotation}deg)`
                        : `rotate(${rotation}deg)`
                    }`,
                ],
            },
            { type: "spring", damping: 15, stiffness: 200 }
        );

        animate(
            selector,
            {
                opacity: [1, 0],
            },
            { ease: "linear", duration: 0.5, delay: 5 }
        );

        imageRenderCount.current = imageRenderCount.current + 1;
    };

    return (
        <div
            ref={scope}
            className="relative overflow-hidden"
            onMouseMove={handleMouseMove}
        >
            {children}

            {images.map((img, index) => (
                <img
                    className="pointer-events-none absolute left-0 top-0 h-48 w-auto rounded-xl border-2 border-black bg-neutral-900 object-cover opacity-0"
                    src={img}
                    alt={`Mouse move image ${index}`}
                    key={index}
                    data-mouse-move-index={index}
                />
            ))}
        </div>
    );
};