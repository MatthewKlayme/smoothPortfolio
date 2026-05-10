import { useEffect, useState, useCallback, useRef, useMemo, useLayoutEffect } from "react";
import "./App.css";
import { Player } from "./player/Player";
import { Terminal } from "./experience/terminal/Terminal";
import { ExperiencePortal } from "./experience/experiencePortal/ExperiencePortal";
import { TimelineMarker } from "./experience/timeline/TimelineMarker";
import { Collectible } from "./experience/collectible/Collectible";
import { Npc } from "./experience/npc/Npc";
import { HudBar } from "./ui/HudBar";
import { InventoryPanel } from "./ui/InventoryPanel";
import { DialogOverlay } from "./ui/DialogOverlay";
import { QuizOverlay } from "./experience/quiz/QuizOverlay";

import {
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  WORLDS,
} from "./worlds/worlds";

const XP_PER_LEVEL = 100;
const XP_PER_TERMINAL = 25;
const STARTER_WORLD = ["meneses", "university"];

const simulateKey = (key, down) => {
  window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { key, bubbles: true }));
};

const mapControlKey = (key) => {
  const k = (key || "").toLowerCase();
  if (k === "arrowup"    || k === "w") return "up";
  if (k === "arrowdown"  || k === "s") return "down";
  if (k === "arrowleft"  || k === "a") return "left";
  if (k === "arrowright" || k === "d") return "right";
  if (k === " ")         return "a";
  if (k === "backspace") return "b";
  if (k === "enter")     return "start";
  return null;
};

const App = () => {
  const [currentWorldId, setCurrentWorldId] = useState("nexus");
  const [playerSpawn, setPlayerSpawn] = useState(WORLDS.nexus.spawn);
  const [playerPos, setPlayerPos] = useState({ x: 300, y: 200 });
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [activeTerminal, setActiveTerminal] = useState(null);
  const [returnPos, setReturnPos] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [keys, setKeys] = useState(0);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [readTerminals, setReadTerminals] = useState(new Set());
  const [unlockedWorlds, setUnlockedWorlds] = useState(new Set(STARTER_WORLD));
  const [collected, setCollected] = useState(new Set());
  const [worldBadges, setWorldBadges] = useState(new Set());
  const [leftKey, setLeftKey] = useState(false);
  const [rightKey, setRightKey] = useState(false);
  const [hudMessage, setHudMessage] = useState("");
  const hudTimeoutRef = useRef(null);

  // Refs for decorative control elements — toggled via classList, not state
  const ctrlRefs = useRef({});
  const setCtrl = (key, el) => { ctrlRefs.current[key] = el; };
  const audioCtxRef = useRef(null);
  const handheldRef = useRef(null);

  useLayoutEffect(() => {
    const fit = () => {
      const el = handheldRef.current;
      if (!el) return;
      el.style.transform = "";
      const s = Math.min(
        (window.innerWidth * 0.97) / el.offsetWidth,
        (window.innerHeight * 0.97) / el.offsetHeight,
        1
      );
      el.style.transform = `scale(${s})`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const press = (key, on) => {
      ctrlRefs.current[key]?.classList.toggle("is-pressed", on);
    };
    const onDown = (e) => {
      const k = mapControlKey(e.key);
      if (!k || e.repeat) return;
      press(k, true);
    };
    const onUp = (e) => {
      const k = mapControlKey(e.key);
      if (k) press(k, false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const world = WORLDS[currentWorldId];
  const worldWidth = world.width ?? WORLD_WIDTH;
  const worldHeight = world.height ?? WORLD_HEIGHT;

  useEffect(() => {
    return () => {
      if (hudTimeoutRef.current) {
        clearTimeout(hudTimeoutRef.current);
      }
    };
  }, []);

  const totalBadgeWorlds = useMemo(() => {
    return Object.values(WORLDS).filter(
      (w) => w.id !== "nexus" && w.collectibles && w.collectibles.length > 0
    ).length;
  }, []);

  const playBeep = useCallback((frequency = 520, duration = 0.08) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext || null;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.08;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // ignore audio failures
    }
  }, []);

  // CAMERA LOGIC: follow but clamp to world
  useEffect(() => {
    const camX = Math.max(
      0,
      Math.min(playerPos.x - VIEWPORT_WIDTH / 2, worldWidth - VIEWPORT_WIDTH)
    );

    const camY = Math.max(
      0,
      Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, worldHeight - VIEWPORT_HEIGHT)
    );

    setCamera({ x: camX, y: camY });
  }, [playerPos.x, playerPos.y, worldWidth, worldHeight]);

  const fadeTransition = (callback) => {
    setIsFading(true);

    // Fade out (300ms)
    setTimeout(() => {
      callback();

      // Fade in
      setTimeout(() => {
        setIsFading(false);
      }, 300); // match CSS timing
    }, 300);
  };

  const pushHudMessage = useCallback((message) => {
    if (hudTimeoutRef.current) {
      clearTimeout(hudTimeoutRef.current);
    }
    setHudMessage(message);
    hudTimeoutRef.current = setTimeout(() => setHudMessage(""), 2400);
  }, []);

  const handleTerminalRead = useCallback(
    (terminal) => {
      const readKey = `${terminal.id}-${terminal.x}-${terminal.y}`;
      if (readTerminals.has(readKey)) return;

      setReadTerminals((prev) => {
        const next = new Set(prev);
        next.add(readKey);
        return next;
      });

      setXp((prevXp) => {
        let total = prevXp + XP_PER_TERMINAL;
        let gained = 0;

        while (total >= XP_PER_LEVEL) {
          total -= XP_PER_LEVEL;
          gained += 1;
        }

        if (gained > 0) {
          setLevel(level + 1);
          setKeys(keys + 1);
          pushHudMessage(`Level up! +${gained} key${gained > 1 ? "s" : ""}`);
          playBeep(740, 0.16);
        } else {
          pushHudMessage("+XP from a new terminal");
          playBeep(540, 0.08);
        }

        return total;
      });
    },
    [playBeep, pushHudMessage, readTerminals]
  );

  useEffect(() => {
    const handleInventoryToggle = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        setInventoryOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", handleInventoryToggle);
    return () => window.removeEventListener("keydown", handleInventoryToggle);
  }, []);

  // Collectible collision detection
  useEffect(() => {
    if (!world.collectibles || world.collectibles.length === 0) return;
    const playerSize = 32;
    const hit = world.collectibles.find((c) => {
      const key = `${currentWorldId}-${c.id}`;
      if (collected.has(key)) return false;
      return (
        playerPos.x + playerSize > c.x &&
        playerPos.x < c.x + c.width &&
        playerPos.y + playerSize > c.y &&
        playerPos.y < c.y + c.height
      );
    });

    if (hit) {
      const hitKey = `${currentWorldId}-${hit.id}`;
      setCollected((prev) => {
        const next = new Set(prev);
        next.add(hitKey);
        return next;
      });
      playBeep(820, 0.12);
      pushHudMessage(`Collected ${hit.label}`);
    }
  }, [
    collected,
    currentWorldId,
    playBeep,
    playerPos.x,
    playerPos.y,
    pushHudMessage,
    world.collectibles,
  ]);

  // Badge completion when all collectibles grabbed in a world
  useEffect(() => {
    if (!world.collectibles || world.collectibles.length === 0) return;
    const allCollected = world.collectibles.every((c) =>
      collected.has(`${currentWorldId}-${c.id}`)
    );
    if (allCollected && !worldBadges.has(currentWorldId)) {
      setWorldBadges((prev) => {
        const next = new Set(prev);
        next.add(currentWorldId);
        return next;
      });
      pushHudMessage(`${world.title} 100%! Badge added.`);
      playBeep(900, 0.14);
    }
  }, [
    collected,
    currentWorldId,
    playBeep,
    pushHudMessage,
    world.collectibles,
    world.title,
    worldBadges,
  ]);

  const portalRequirementMet = useCallback(
    (portal) => {
      if (portal.requiresBothKeys) return leftKey && rightKey;

      const hasRequirement = portal.requiresLevel || portal.requiresAllBadges;
      if (!hasRequirement) return false;

      const levelMet = portal.requiresLevel
        ? level >= portal.requiresLevel
        : true;
      const badgesMet = portal.requiresAllBadges
        ? worldBadges.size >= totalBadgeWorlds
        : true;

      return levelMet && badgesMet;
    },
    [level, totalBadgeWorlds, worldBadges, leftKey, rightKey]
  );

  const portalLockReason = useCallback(
    (portal) => {
      if (portal.requiresBothKeys) {
        const parts = [];
        if (!leftKey) parts.push("left key half");
        if (!rightKey) parts.push("right key half");
        return parts.length ? parts.join(" + ") : null;
      }

      const needsLevel =
        portal.requiresLevel && level < portal.requiresLevel
          ? `Lv${portal.requiresLevel}`
          : null;
      const needsBadges =
        portal.requiresAllBadges && worldBadges.size < totalBadgeWorlds
          ? "all badges"
          : null;

      if (needsLevel && needsBadges) return `${needsLevel} + ${needsBadges}`;
      if (needsLevel) return needsLevel;
      if (needsBadges) return needsBadges;
      return null;
    },
    [level, totalBadgeWorlds, worldBadges, leftKey, rightKey]
  );

  const handleSpace = () => {
    const playerSize = 32;

    // If a dialog is already open, SPACE closes it
    if (activeTerminal) {
      setActiveTerminal(null);
      return;
    }

    // NPC interaction (any world)
    const hitNpc = world.npcs?.find((n) => {
      return (
        playerPos.x + playerSize > n.x &&
        playerPos.x < n.x + n.width &&
        playerPos.y + playerSize > n.y &&
        playerPos.y < n.y + n.height
      );
    });

    if (hitNpc) {
      setActiveTerminal(hitNpc);
      playBeep(600, 0.1);
      return;
    }

    // HUB: interact with portals
    if (currentWorldId === "nexus") {
      const hitPortal = world.portals?.find((p) => {
        return (
          playerPos.x + playerSize > p.x &&
          playerPos.x < p.x + p.width &&
          playerPos.y + playerSize > p.y &&
          playerPos.y < p.y + p.height
        );
      });

      if (hitPortal && WORLDS[hitPortal.id]) {
        const alreadyUnlocked = unlockedWorlds.has(hitPortal.id);
        const conditionUnlocked = portalRequirementMet(hitPortal);

        if (!alreadyUnlocked && conditionUnlocked) {
          setUnlockedWorlds((prev) => {
            const next = new Set(prev);
            next.add(hitPortal.id);
            return next;
          });
          pushHudMessage(`Unlocked ${hitPortal.label}!`);
          playBeep(680, 0.1);
        } else if (!alreadyUnlocked && !conditionUnlocked) {
          if (hitPortal.requiresLevel || hitPortal.requiresAllBadges || hitPortal.requiresBothKeys) {
            if (!hitPortal.hideRequirementHint) {
              const reason = portalLockReason(hitPortal);
              pushHudMessage(
                reason
                  ? `Locked: ${reason}`
                  : "Portal locked. Requirement missing."
              );
            }
            return;
          }

          if (keys <= 0) {
            pushHudMessage("Portal locked. Level up to earn keys.");
            return;
          }

          setKeys((prev) => Math.max(0, prev - 1));
          setUnlockedWorlds((prev) => {
            const next = new Set(prev);
            next.add(hitPortal.id);
            return next;
          });
          pushHudMessage(`Unlocked ${hitPortal.label} with a key!`);
          playBeep(680, 0.1);
        }

        const nextWorld = WORLDS[hitPortal.id];

        setReturnPos({ x: playerPos.x, y: playerPos.y });

        fadeTransition(() => {
          setCurrentWorldId(nextWorld.id);
          setPlayerSpawn(nextWorld.spawn);
          setPlayerPos(nextWorld.spawn);
          setActiveTerminal(null);
        });
      }

      return;
    }

    // NON-HUB: interact with terminals in current world
    const hitTerminal = world.terminals?.find((t) => {
      return (
        playerPos.x + playerSize > t.x &&
        playerPos.x < t.x + t.width &&
        playerPos.y + playerSize > t.y &&
        playerPos.y < t.y + t.height
      );
    });

    if (hitTerminal) {
      setActiveTerminal(hitTerminal);
      handleTerminalRead(hitTerminal);
      if (hitTerminal.awardRightKey && !rightKey) {
        setRightKey(true);
        pushHudMessage("Right Half of the Master Key obtained!");
        playBeep(900, 0.2);
      }
    }
  };

  const handleBackToHub = useCallback(() => {
    fadeTransition(() => {
      setCurrentWorldId("nexus");

      const hubReturn = returnPos ?? WORLDS.nexus.spawn;

      setPlayerSpawn(hubReturn);
      setPlayerPos(hubReturn);

      setCamera({
        x: Math.max(
          0,
          Math.min(
            hubReturn.x - VIEWPORT_WIDTH / 2,
            (WORLDS.nexus.width ?? WORLD_WIDTH) - VIEWPORT_WIDTH
          )
        ),
        y: Math.max(
          0,
          Math.min(
            hubReturn.y - VIEWPORT_HEIGHT / 2,
            (WORLDS.nexus.height ?? WORLD_HEIGHT) - VIEWPORT_HEIGHT
          )
        ),
      });

      setActiveTerminal(null);
    });
  }, [returnPos]);

  const handleQuizSuccess = useCallback(() => {
    setLeftKey(true);
    pushHudMessage("Left Half of the Master Key obtained!");
    playBeep(900, 0.2);
    handleBackToHub();
  }, [handleBackToHub, pushHudMessage, playBeep]);

  const handleQuizFail = useCallback(() => {
    pushHudMessage("Trial failed.");
    playBeep(180, 0.3);
    handleBackToHub();
  }, [handleBackToHub, pushHudMessage, playBeep]);

  // Listen for keyboard Backspace to return to nexus
  useEffect(() => {
    const handleKeyBack = (e) => {
      if (e.key === "Backspace") {
        e.preventDefault(); // prevent navigating browser history accidentally
        handleBackToHub();
      }
    };

    window.addEventListener("keydown", handleKeyBack);
    return () => window.removeEventListener("keydown", handleKeyBack);
  }, [handleBackToHub]);

  return (
    <div className="app-root">
      <div className="handheld" ref={handheldRef}>
        {/* Shoulder buttons */}
        <div className="shoulder shoulder-l"><span>L</span></div>
        <div className="shoulder shoulder-r"><span>R</span></div>

        {/* Brand strip above screen */}
        <div className="brand-area">
          <div className="power">
            <div className="power-led" />
            <div className="power-label">POWER</div>
          </div>
          <div className="brand-top">PORTABLE PORTFOLIO</div>
          <div className="brand-spacer" />
        </div>

        {/* Screen recess: HUD + viewport + footer hint */}
        <div className="screen-recess">
          <HudBar level={level} xp={xp} xpPerLevel={XP_PER_LEVEL} keys={keys} worldTitle={world.title} />

          <div
            className="viewport"
            style={{
              width: VIEWPORT_WIDTH,
              height: VIEWPORT_HEIGHT,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              className="world-container"
              style={{
                width: worldWidth,
                height: worldHeight,
                position: "absolute",
                transform: `translate(${-camera.x}px, ${-camera.y}px)`,
              }}
            >
              {currentWorldId === "nexus" && <div className="timeline-line" />}
              <div className={`game-world ${world.backgroundClass}`}>
                {currentWorldId === "nexus" &&
                  world.timeline?.map((t, i) => (
                    <TimelineMarker key={i} year={t.year} x={t.x} />
                  ))}

                {world.blockedZones &&
                  world.blockedZones.map((zone, idx) => (
                    <div
                      key={`${currentWorldId}-blocked-${idx}`}
                      className="blocked-zone"
                      style={{
                        left: zone.x,
                        top: zone.y,
                        width: zone.width,
                        height: zone.height,
                      }}
                    />
                  ))}

                {currentWorldId === "nexus" &&
                  world.portals?.map((portal) => (
                    <ExperiencePortal
                      key={portal.id}
                      portal={portal}
                      locked={
                        !unlockedWorlds.has(portal.id) &&
                        !portalRequirementMet(portal)
                      }
                      lockReason={
                        portal.hideRequirementHint ? null : portalLockReason(portal)
                      }
                      silentLock={portal.hideRequirementHint}
                      keysAvailable={keys}
                    />
                  ))}

                {world.npcs &&
                  world.npcs.map((npc) => (
                    <Npc key={`${npc.id}-${npc.x}-${npc.y}`} npc={npc} />
                  ))}

                {world.terminals &&
                  world.terminals.map((terminal) => (
                    <Terminal
                      key={`${terminal.id}-${terminal.x}-${terminal.y}`}
                      terminal={terminal}
                    />
                  ))}

                {world.collectibles &&
                  world.collectibles.map((col) => (
                    <Collectible
                      key={`${currentWorldId}-${col.id}-${col.x}-${col.y}`}
                      collectible={col}
                      collected={collected.has(`${currentWorldId}-${col.id}`)}
                    />
                  ))}

                <Player
                  worldWidth={worldWidth}
                  worldHeight={worldHeight}
                  blockedZones={world.blockedZones}
                  initialPosition={playerSpawn}
                  skin={world.playerSkin}
                  onSpace={handleSpace}
                  onMove={setPlayerPos}
                />
              </div>
            </div>
            <div className="crt-overlay" aria-hidden="true" />
            <div className="glare" aria-hidden="true" />
            <QuizOverlay
              active={currentWorldId === "trial10"}
              alreadyComplete={leftKey}
              onSuccess={handleQuizSuccess}
              onFail={handleQuizFail}
            />
            <DialogOverlay terminal={activeTerminal} />
            <InventoryPanel
              open={inventoryOpen}
              keys={keys}
              worldBadges={worldBadges}
              worldsMap={WORLDS}
              leftKey={leftKey}
              rightKey={rightKey}
            />
            {hudMessage && <div className="hud-message">{hudMessage}</div>}
            {isFading && <div className="fade-overlay"></div>}
          </div>

          <div className="hud-foot">
            <span className="footer-hint">WASD / Arrows · SPACE interact · ENTER inventory</span>
            {currentWorldId !== "nexus" && (
              <button className="footer-button" onClick={handleBackToHub}>← Back</button>
            )}
          </div>
        </div>

        {/* Interactive controls */}
        <div className="controls-bottom">
          <div className="dpad">
            {[
              { cls: "dpad-up",    key: "ArrowUp",    ctrl: "up"    },
              { cls: "dpad-down",  key: "ArrowDown",  ctrl: "down"  },
              { cls: "dpad-left",  key: "ArrowLeft",  ctrl: "left"  },
              { cls: "dpad-right", key: "ArrowRight", ctrl: "right" },
            ].map(({ cls, key, ctrl }) => (
              <div
                key={ctrl}
                className={`dpad-arm ${cls}`}
                ref={(el) => setCtrl(ctrl, el)}
                onPointerDown={() => simulateKey(key, true)}
                onPointerUp={() => simulateKey(key, false)}
                onPointerLeave={() => simulateKey(key, false)}
                onPointerCancel={() => simulateKey(key, false)}
              />
            ))}
            <div className="dpad-center" />
          </div>

          <div className="ss">
            <div className="ss-pair">
              <div className="ss-pill" />
              <div className="ss-label">SELECT</div>
            </div>
            <div className="ss-pair">
              <div
                className="ss-pill"
                ref={(el) => setCtrl("start", el)}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); simulateKey("Enter", true); }}
                onPointerUp={() => simulateKey("Enter", false)}
                onPointerCancel={() => simulateKey("Enter", false)}
              />
              <div className="ss-label">START</div>
            </div>
          </div>

          <div className="ab-area">
            <div className="ab">
              <div
                className="ab-btn ab-b"
                ref={(el) => setCtrl("b", el)}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); simulateKey("Backspace", true); }}
                onPointerUp={() => simulateKey("Backspace", false)}
                onPointerCancel={() => simulateKey("Backspace", false)}
              >
                <span>B</span>
              </div>
              <div
                className="ab-btn ab-a"
                ref={(el) => setCtrl("a", el)}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); simulateKey(" ", true); }}
                onPointerUp={() => simulateKey(" ", false)}
                onPointerCancel={() => simulateKey(" ", false)}
              >
                <span>A</span>
              </div>
            </div>
          </div>

          <div className="speaker">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="spk-dot" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
