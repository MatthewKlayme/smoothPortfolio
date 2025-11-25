export const DialogOverlay = ({ terminal }) => {
  if (!terminal) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <div className="dialog-title">{terminal.title}</div>
        <div className="dialog-body">
          {terminal.lines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
        <div className="dialog-footer">Press SPACE to close</div>
      </div>
    </div>
  );
};
