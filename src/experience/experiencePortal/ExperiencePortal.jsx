import "./experience-portal.css";

export const ExperiencePortal = ({
  portal,
  locked,
  lockReason,
  silentLock,
  keysAvailable,
}) => {
  const hintText = locked
    ? lockReason
      ? `Locked (${lockReason})`
      : silentLock
        ? ""
        : keysAvailable > 0
        ? "SPACE to use a key"
        : "Locked (need key)"
    : "SPACE";

  return (
    <div
      className={`portal portal-${portal.id} ${locked ? "portal-locked" : ""}`}
      style={{
        left: portal.x,
        top: portal.y,
        width: portal.width,
        height: portal.height,
      }}
    >
      {locked && <div className="portal-lock-pill">LOCKED</div>}
      <div className="portal-inner">
        <span className="portal-label">{portal.label}</span>
        <span className="portal-hint">{hintText}</span>
      </div>
    </div>
  );
};
