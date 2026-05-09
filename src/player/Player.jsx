import { useState, useEffect, useRef, useCallback } from "react";
import "./player.css";

export const Player = ({
  worldWidth,
  worldHeight,
  initialPosition,
  skin,
  blockedZones = [],
  onSpace,
  onMove,
}) => {
  const [position, setPosition] = useState({
    top: initialPosition?.y ?? 200,
    left: initialPosition?.x ?? 300,
  });
  const [keysPressed, setKeysPressed] = useState(new Set());
  const [spacePressed, setSpacePressed] = useState(false);
  const velocityRef = useRef({ top: 0, left: 0 });
  const animationFrameId = useRef(null);
  const posRef = useRef(position);
  const size = 32;

  useEffect(() => {
    if (!initialPosition) return;
    const newPos = { top: initialPosition.y, left: initialPosition.x };
    posRef.current = newPos;
    setPosition(newPos);
  }, [initialPosition?.x, initialPosition?.y]);

  const handleKeyDown = (event) => {
    setKeysPressed((prevKeys) => new Set(prevKeys).add(event.key));
  };

  const handleKeyUp = (event) => {
    setKeysPressed((prevKeys) => {
      const newKeys = new Set(prevKeys);
      newKeys.delete(event.key);

      if (event.key === " ") {
        setSpacePressed(false);
      }

      return newKeys;
    });
  };

  const collides = useCallback(
    (x, y) => {
      if (!blockedZones || blockedZones.length === 0) return false;
      return blockedZones.some((r) => {
        return (
          x + size > r.x &&
          x < r.x + r.width &&
          y + size > r.y &&
          y < r.y + r.height
        );
      });
    },
    [blockedZones]
  );

  useEffect(() => {
    const updatePosition = () => {
      const acceleration = 0.5;
      const friction = 0.92;
      const prev = posRef.current;

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

      if (keysPressed.has(" ") && !spacePressed) {
        onSpace?.();
        setSpacePressed(true);
      }

      const nextLeft = Math.max(
        0,
        Math.min(prev.left + velocityRef.current.left, worldWidth - size)
      );
      const nextTop = Math.max(
        0,
        Math.min(prev.top + velocityRef.current.top, worldHeight - size)
      );

      let finalLeft = nextLeft;
      let finalTop = nextTop;

      if (collides(nextLeft, prev.top)) {
        finalLeft = prev.left;
      }
      if (collides(finalLeft, nextTop)) {
        finalTop = prev.top;
      }
      if (collides(finalLeft, finalTop)) {
        finalLeft = prev.left;
        finalTop = prev.top;
      }

      const newPos = { top: finalTop, left: finalLeft };
      posRef.current = newPos;
      setPosition(newPos);
      onMove?.({ x: newPos.left, y: newPos.top });
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
  }, [keysPressed, spacePressed, worldWidth, worldHeight, onSpace, onMove, collides]);

  return (
    <div
      className={`player player--${skin}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    />
  );
};
