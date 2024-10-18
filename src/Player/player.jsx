import React, { useState, useEffect, useRef } from "react";
import "./player.css";

export const Player = ({ setPlayerSpace }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const velocityRef = useRef({ top: 0, left: 0 });
  const [keysPressed, setKeysPressed] = useState(new Set());
  const animationFrameId = useRef(null);

  const handleKeyDown = (event) => {
    setKeysPressed((prevKeys) => new Set(prevKeys).add(event.key));
  };

  const handleKeyUp = (event) => {
    setKeysPressed((prevKeys) => {
      const newKeys = new Set(prevKeys);
      newKeys.delete(event.key);
      return newKeys;
    });
  };

  useEffect(() => {
    const updatePosition = () => {
      const acceleration = 0.5;
      const friction = 0.95;

      velocityRef.current = {
        top: velocityRef.current.top * friction,
        left: velocityRef.current.left * friction,
      };

      if (keysPressed.has("ArrowUp") || keysPressed.has("w"))
        velocityRef.current.top -= acceleration;
      if (keysPressed.has("ArrowDown") || keysPressed.has("s"))
        velocityRef.current.top += acceleration;
      if (keysPressed.has("ArrowLeft") || keysPressed.has("a"))
        velocityRef.current.left -= acceleration;
      if (keysPressed.has("ArrowRight") || keysPressed.has("d"))
        velocityRef.current.left += acceleration;
      if (keysPressed.has(" ")) {
        setPlayerSpace({ x: position.left, y: position.top });
      }

      setPosition((prevPosition) => ({
        top: Math.max(
          0,
          Math.min(
            prevPosition.top + velocityRef.current.top,
            window.innerHeight - 50
          )
        ),
        left: Math.max(
          0,
          Math.min(
            prevPosition.left + velocityRef.current.left,
            window.innerWidth - 50
          )
        ),
      }));
    };

    const animate = () => {
      updatePosition();
      animationFrameId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [keysPressed]);

  return (
    <div
      className="player"
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: "50px",
        height: "50px",
        backgroundColor: "black",
      }}
    ></div>
  );
};
