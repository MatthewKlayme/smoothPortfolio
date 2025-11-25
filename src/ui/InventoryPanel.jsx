export const InventoryPanel = ({
  open,
  keys,
  worldBadges,
  worldsMap,
}) => {
  if (!open) return null;

  return (
    <div className="inventory-panel">
      <div className="inventory-title">Inventory</div>
      <div className="inventory-items">
        {keys > 0 ? (
          <div className="inventory-item">
            <span className="item-name">Warp Key</span>
            <span className="item-count">x{keys}</span>
          </div>
        ) : (
          <div className="inventory-empty">No items yet.</div>
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
