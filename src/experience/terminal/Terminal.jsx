import "./terminal.css";

export const Terminal = ({ terminal }) => {
  return (
    <div
      className={`terminal terminal-${terminal.id}`}
      style={{
        left: terminal.x,
        top: terminal.y,
        width: terminal.width,
        height: terminal.height,
      }}
    >
      <div className="terminal-inner">
        <span className="terminal-title">{terminal.title}</span>
        <span className="terminal-hint">SPACE</span>
      </div>
    </div>
  );
};
