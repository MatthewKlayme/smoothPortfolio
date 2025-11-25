import "./npc.css";

export const Npc = ({ npc }) => {
  return (
    <div
      className={`npc npc-${npc.id}`}
      style={{
        left: npc.x,
        top: npc.y,
        width: npc.width,
        height: npc.height,
      }}
    >
      <div className="npc-body" />
      <div className="npc-label">{npc.title}</div>
    </div>
  );
};
