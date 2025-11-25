import "./collectible.css";

export const Collectible = ({ collectible, collected }) => {
  return (
    <div
      className={`collectible ${collected ? "collectible--got" : ""}`}
      style={{
        left: collectible.x,
        top: collectible.y,
        width: collectible.width,
        height: collectible.height,
      }}
    >
      <div className="collectible-inner">{collectible.icon || "★"}</div>
    </div>
  );
};
