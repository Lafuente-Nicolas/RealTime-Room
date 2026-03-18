import { useEffect, useState, useRef } from "react";
import socket from "../../socket";
import Message from "../Message/Message";
import Shifumi from "./Shifumi";
import Morpion from "./Morpion";
import Puissance4 from "./Puissance4";

export default function Chat({ session }) {
  const { pseudo, room } = session;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);

  const [morpionBoard, setMorpionBoard] = useState(Array(9).fill(null));
  const [p4Board, setP4Board] = useState(Array(6).fill(null).map(() => Array(7).fill(null)));

  const [gameLocked, setGameLocked] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket.connect();
    socket.emit("join_room", { pseudo, room });

    const onMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const onJoin = ({ pseudo }) => setMessages((prev) => [...prev, { system: true, message: `${pseudo} a rejoint la room` }]);

    const onGameResult = (data) => {
      setMessages((prev) => [...prev, { system: true, message: `🎮 JEU : ${data.joueur1} a joué ${data.coup1} | ${data.joueur2} a joué ${data.coup2} ➔ Résultat : ${data.resultat}` }]);
      setSelectedGame(null);
    };

    const onOpponentPlayed = (data) => setMessages((prev) => [...prev, { system: true, message: `⚠️ ${data.pseudo} a joué à ${data.jeu}. C'est à ton tour !` }]);

    const onMorpionUpdate = (data) => {
      setMorpionBoard(data.plateau);
      if (data.message) {
        setGameLocked(true);
        setMessages((prev) => [...prev, { system: true, message: `⭕❌ MORPION : ${data.message}` }]);
        setTimeout(() => {
          setSelectedGame(null);
          setMorpionBoard(Array(9).fill(null));
          setGameLocked(false);
        }, 3000);
      }
    };

    const onP4Update = (data) => {
      setP4Board(data.plateau);
      if (data.message) {
        setGameLocked(true);
        setMessages((prev) => [...prev, { system: true, message: `🔴🟡 PUISSANCE 4 : ${data.message}` }]);
        setTimeout(() => {
          setSelectedGame(null);
          setP4Board(Array(6).fill(null).map(() => Array(7).fill(null)));
          setGameLocked(false);
        }, 3000);
      }
    };

    const onGameLaunched = (data) => {
      setMessages((prev) => [...prev, { system: true, message: data.message }]);
    };

    const onGameCancelled = (data) => {
      setMessages((prev) => [...prev, { system: true, message: data.message }]);
      setSelectedGame(null);
      setMorpionBoard(Array(9).fill(null));
      setP4Board(Array(6).fill(null).map(() => Array(7).fill(null)));
      setGameLocked(false);
    };

    socket.on("receive_message", onMessage);
    socket.on("user_joined", onJoin);
    socket.on("game_result", onGameResult);
    socket.on("opponent_played", onOpponentPlayed);
    socket.on("morpion_update", onMorpionUpdate);
    socket.on("p4_update", onP4Update);
    socket.on("game_launched", onGameLaunched);
    socket.on("game_cancelled", onGameCancelled);

    return () => {
      socket.off("receive_message", onMessage);
      socket.off("user_joined", onJoin);
      socket.off("game_result", onGameResult);
      socket.off("opponent_played", onOpponentPlayed);
      socket.off("morpion_update", onMorpionUpdate);
      socket.off("p4_update", onP4Update);
      socket.off("game_launched", onGameLaunched);
      socket.off("game_cancelled", onGameCancelled);
      socket.disconnect();
    };
  }, [pseudo, room]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit("send_message", { pseudo, room, message: text });
    setText("");
  };

  const leave = () => {
    socket.disconnect();
    window.location.reload();
  };

  const playGame = (coup) => {
    socket.emit("play_game", { pseudo, room, coup });
    setMessages((prev) => [...prev, { system: true, message: `🎮 Vous avez joué ${coup}. En attente de l'adversaire...` }]);
  };

  const handleSelectGame = (gameName) => {
    setSelectedGame(gameName);
    setGameLocked(false);

    if (gameName === 'morpion') setMorpionBoard(Array(9).fill(null));
    if (gameName === 'puissance4') setP4Board(Array(6).fill(null).map(() => Array(7).fill(null)));

    let jeuFormatte = 'Shifumi';
    if (gameName === 'morpion') jeuFormatte = 'Morpion';
    if (gameName === 'puissance4') jeuFormatte = 'Puissance4';

    socket.emit("launch_game", { pseudo, room, jeu: jeuFormatte });
  };

  const handleCancelGame = (gameName) => {
    let jeuFormatte = 'Shifumi';
    if (gameName === 'morpion') jeuFormatte = 'Morpion';
    if (gameName === 'puissance4') jeuFormatte = 'Puissance4';
    socket.emit("cancel_game", { pseudo, room, jeu: jeuFormatte });
  };

  const playMorpion = (index) => {
    if (gameLocked) return;
    socket.emit("play_morpion", { pseudo, room, index });
  };

  const playPuissance4 = (colIndex) => {
    if (gameLocked) return;
    socket.emit("play_puissance4", { pseudo, room, index: colIndex });
  };

  return (
    <main className="chat">
      <header className="chat__header">
        <div className="chat__infos">
          <h2 className="chat__room">Room: {room}</h2>
          <span className="chat__pseudo">{pseudo}</span>
        </div>
        <button className="chat__leave" onClick={leave}>Quitter</button>
      </header>

      <section className="chat__messages">
        {messages.map((m, i) => (
          <Message key={i} msg={m} self={m.pseudo === pseudo} />
        ))}

        <div ref={messagesEndRef} />
      </section>

      <div className="chat__game">
        {!selectedGame ? (
          <>
            <span className="chat__game-label">🕹️ Lancer un jeu :</span>
            <button onClick={() => handleSelectGame('shifumi')} className="chat__game-btn">🪨📄✂️ Shifumi</button>
            <button onClick={() => handleSelectGame('morpion')} className="chat__game-btn">⭕❌ Morpion</button>
            <button onClick={() => handleSelectGame('puissance4')} className="chat__game-btn">🔴🟡 Puissance 4</button>
          </>
        ) : selectedGame === 'shifumi' ? (
          <Shifumi
            playGame={playGame}
            handleCancelGame={handleCancelGame}
          />
        ) : selectedGame === 'morpion' ? (
          <Morpion
            board={morpionBoard}
            playMorpion={playMorpion}
            handleCancelGame={handleCancelGame}
          />
        ) : selectedGame === 'puissance4' ? (
          <Puissance4
            board={p4Board}
            playPuissance4={playPuissance4}
            handleCancelGame={handleCancelGame}
          />
        ) : null}
      </div>

      <form className="chat__form" onSubmit={send}>
        <input
          className="chat__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message..."
        />
        <button className="chat__send">Envoyer</button>
      </form>
    </main>
  );
}