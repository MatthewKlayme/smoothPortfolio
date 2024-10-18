import { useEffect, useState, useRef } from "react";
import "./Meneseslaw.css";

export const Meneseslaw = ({ playerSpace }) => {
  const [playerInteraction, setPlayerInteraction] = useState(false);
  const menesesRef = useRef(null);
  useEffect(() => {
    console.log(
      "playerx - ",
      playerSpace.x,
      "playerwidth - ",
      playerSpace.x + 50
    );
    console.log(
      "playery - ",
      playerSpace.y,
      "playerwidth - ",
      playerSpace.y + 50
    );
    if (
      playerSpace.x >= menesesRef.current.getBoundingClientRect().x &&
      playerSpace.y >= menesesRef.current.getBoundingClientRect().y
    ) {
      const rect = menesesRef.current.getBoundingClientRect();
      setPlayerInteraction(!playerInteraction);
      console.log(rect);
    }
  }, [playerSpace]);
  return (
    <div className="meneses-law" ref={menesesRef}>
      <header className="meneses-title">
        Hi
        {playerInteraction && (
          <div className="meneses-popup">
            Hello my goofy goober /// and welcome to the place of place
          </div>
        )}
      </header>
    </div>
  );
};
