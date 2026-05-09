export const InventoryPanel = ({
  open,
  keys,
  worldBadges,
  worldsMap,
  leftKey,
  rightKey,
}) => {
  if (!open) return null;

  const hasItems = keys > 0 || leftKey || rightKey;

  return (
    <div className="inventory-panel">
      <div className="inventory-title">Inventory</div>
      <div className="inventory-items">
        {!hasItems && <div className="inventory-empty">No items yet.</div>}
        {keys > 0 && (
          <div className="inventory-item">
            <span className="item-name">Warp Key</span>
            <span className="item-count">x{keys}</span>
          </div>
        )}
        {leftKey && (
          <div className="inventory-item">
            <span className="item-name">Master Key — Left Half</span>
            <span className="badge-pill">✦</span>
          </div>
        )}
        {rightKey && (
          <div className="inventory-item">
            <span className="item-name">Master Key — Right Half</span>
            <span className="badge-pill">✦</span>
          </div>
        )}
      </div>
      <div className="inventory-subtitle">Badges</div>
      <div className="inventory-items">
        {worldBadges.size > 0 ? (
          Array.from(worldBadges).map((id) => (
            <div className="inventory-item" key={id}>
              <span className="item-name">{worldsMap[id].title}</span>
              <span className="badge-pill">100%</span>
            </div>
          ))
        ) : (
          <div className="inventory-empty">
            Complete a world to earn its badge.
          </div>
        )}
      </div>
      <div className="inventory-footer">
        Use keys on portals in the Nexus to unlock new worlds.
      </div>
    </div>
  );
};
