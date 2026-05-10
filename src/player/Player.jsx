import { useState, useEffect, useRef } from "react";
import "./player.css";

const PLAYER_SIZE = 32;
const ACCELERATION = 1.1;
const FRICTION = 0.82;
const MAX_SPEED = 7;

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
    top:  initialPosition?.y ?? 200,
    left: initialPosition?.x ?? 300,
  });

  const posRef          = useRef({ top: initialPosition?.y ?? 200, left: initialPosition?.x ?? 300 });
  const velocityRef     = useRef({ top: 0, left: 0 });
  const keysRef         = useRef(new Set());
  const spacePressedRef = useRef(false);
  const animFrameRef    = useRef(null);

  // Keep mutable prop refs so the animation loop always sees latest values
  // without needing to restart when props change
  const onSpaceRef      = useRef(onSpace);
  const onMoveRef       = useRef(onMove);
  const blockedRef      = useRef(blockedZones);
  const worldSizeRef    = useRef({ width: worldWidth, height: worldHeight });

  useEffect(() => { onSpaceRef.current  = onSpace;                             }, [onSpace]);
  useEffect(() => { onMoveRef.current   = onMove;                              }, [onMove]);
  useEffect(() => { blockedRef.current  = blockedZones;                        }, [blockedZones]);
  useEffect(() => { worldSizeRef.current = { width: worldWidth, height: worldHeight }; }, [worldWidth, worldHeight]);

  // Reset position and velocity when spawn changes (world transition)
  useEffect(() => {
    if (!initialPosition) return;
    const newPos = { top: initialPosition.y, left: initialPosition.x };
    posRef.current = newPos;
    velocityRef.current = { top: 0, left: 0 };
    setPosition(newPos);
  }, [initialPosition?.x, initialPosition?.y]);

  // Key listeners — write to ref only, zero re-renders
  useEffect(() => {
    const onDown = (e) => {
      keysRef.current.add(e.key);
      if (e.key === " " && !spacePressedRef.current) {
        spacePressedRef.current = true;
        onSpaceRef.current?.();
      }
    };
    const onUp = (e) => {
      keysRef.current.delete(e.key);
      if (e.key === " ") spacePressedRef.current = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup",   onUp);
    };
  }, []); // runs once, never restarts

  // Animation loop — runs once, never restarts
  useEffect(() => {
    const collides = (x, y) => {
      const zones = blockedRef.current;
      if (!zones || zones.length === 0) return false;
      return zones.some(
        (r) =>
          x + PLAYER_SIZE > r.x &&
          x < r.x + r.width &&
          y + PLAYER_SIZE > r.y &&
          y < r.y + r.height
      );
    };

    const tick = () => {
      const keys = keysRef.current;
      const { width: ww, height: wh } = worldSizeRef.current;
      const vel = velocityRef.current;

      // Friction first
      vel.top  *= FRICTION;
      vel.left *= FRICTION;

      // Input acceleration
      if (keys.has("ArrowUp")    || keys.has("w")) vel.top  -= ACCELERATION;
      if (keys.has("ArrowDown")  || keys.has("s")) vel.top  += ACCELERATION;
      if (keys.has("ArrowLeft")  || keys.has("a")) vel.left -= ACCELERATION;
      if (keys.has("ArrowRight") || keys.has("d")) vel.left += ACCELERATION;

      // Clamp to max speed
      vel.top  = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vel.top));
      vel.left = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vel.left));

      const prev = posRef.current;

      const nextLeft = Math.max(0, Math.min(prev.left + vel.left, ww - PLAYER_SIZE));
      const nextTop  = Math.max(0, Math.min(prev.top  + vel.top,  wh - PLAYER_SIZE));

      let finalLeft = nextLeft;
      let finalTop  = nextTop;

      if (collides(nextLeft, prev.top)) {
        finalLeft = prev.left;
        vel.left  = 0;
      }
      if (collides(finalLeft, nextTop)) {
        finalTop = prev.top;
        vel.top  = 0;
      }
      if (collides(finalLeft, finalTop)) {
        finalLeft = prev.left;
        finalTop  = prev.top;
        vel.left  = 0;
        vel.top   = 0;
      }

      const newPos = { top: finalTop, left: finalLeft };
      posRef.current = newPos;
      setPosition(newPos);
      onMoveRef.current?.({ x: newPos.left, y: newPos.top });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []); // runs once, never restarts

  return (
    <div
      className={`player player--${skin}`}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    />
  );
};
