export const HudBar = ({ level, xp, xpPerLevel, keys }) => {
  const xpPct = Math.min(100, Math.round((xp / xpPerLevel) * 100));

  return (
    <div className="hud-bar">
      <div className="level-hud">
        <div className="level-label">Level {level}</div>
        <div className="xp-track">
          <div className="xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
        <div className="xp-caption">Read terminals to earn XP + keys</div>
      </div>
      <div className="inventory-hud">
        <div className="inventory-count">
          Keys: <strong>{keys}</strong>
        </div>
        <div className="inventory-hint">Press ENTER to open inventory</div>
      </div>
    </div>
  );
};
