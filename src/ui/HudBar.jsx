export const HudBar = ({ level, xp, xpPerLevel, keys, worldTitle }) => {
  const xpPct = Math.min(100, Math.round((xp / xpPerLevel) * 100));

  return (
    <div className="hud-bar">
      <div className="hud-top-row">
        <div className="hud-playing">
          <div className="hud-playing-label">PLAYING</div>
          <div className="hud-playing-world">{worldTitle}</div>
        </div>
        <div className="hud-keys">
          <span>KEYS</span>
          <span className="hud-keys-num">{keys}</span>
          <span className="hud-keys-hint">ENTER = inventory</span>
        </div>
      </div>
      <div className="hud-level-row">
        <span className="hud-lv">LV{level}</span>
        <div className="hud-level-bar">
          <div className="hud-level-fill" style={{ width: `${xpPct}%` }} />
        </div>
        <span className="hud-level-hint">read terminals for XP</span>
      </div>
    </div>
  );
};
