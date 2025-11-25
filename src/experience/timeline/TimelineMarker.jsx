// src/experience/timeline/TimelineMarker.jsx

import "./timeline.css";

export const TimelineMarker = ({ year, x }) => {
  return (
    <div
      className="timeline-marker"
      style={{
        left: x,
        top: 920,
        position: "absolute",
      }}
    >
      <div className="timeline-stick" />
      <div className="timeline-year">{year}</div>
    </div>
  );
};
