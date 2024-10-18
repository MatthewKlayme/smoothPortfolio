import React, { useEffect, useState } from "react";
import "./App.css";
import greet from "2tmatthew";
import { Player } from "./Player/player";
import { Meneseslaw } from "./Experience/Meneseslaw";

const App = () => {
  const [playerSpace, setPlayerSpace] = useState({});
  useEffect(() => {
    console.log(playerSpace);
  }, [playerSpace]);
  return (
    <div className="main">
      <div className="content">
        <header className="title">{greet("Matthew")}</header>
        <Meneseslaw playerSpace={playerSpace} />
        <Player setPlayerSpace={setPlayerSpace} />
      </div>
    </div>
  );
};

export default App;
