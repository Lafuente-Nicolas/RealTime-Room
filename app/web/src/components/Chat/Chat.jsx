import { useEffect, useState } from "react";
import socket from "../../socket";
import Message from "../Message/Message";

export default function Chat({ session }) {
  const { pseudo, room } = session;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const [morpionBoard, setMorpionBoard] = useState(Array(9).fill(null));
  const [gameLocked, setGameLocked] = useState(false);

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

    const onGameLaunched = (data) => {
      setMessages((prev) => [...prev, { system: true, message: data.message }]);
    };

    const onGameCancelled = (data) => {
      setMessages((prev) => [...prev, { system: true, message: data.message }]);
      setSelectedGame(null);
      setMorpionBoard(Array(9).fill(null));
      setGameLocked(false);
    };

    socket.on("receive_message", onMessage);
    socket.on("user_joined", onJoin);
    socket.on("game_result", onGameResult);
    socket.on("opponent_played", onOpponentPlayed);
    socket.on("morpion_update", onMorpionUpdate);
    socket.on("game_launched", onGameLaunched);
    socket.on("game_cancelled", onGameCancelled);

    return () => {
      socket.off("receive_message", onMessage);
      socket.off("user_joined", onJoin);
      socket.off("game_result", onGameResult);
      socket.off("opponent_played", onOpponentPlayed);
      socket.off("morpion_update", onMorpionUpdate);
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
    setMorpionBoard(Array(9).fill(null));

    const jeuFormatte = gameName === 'shifumi' ? 'Shifumi' : 'Morpion';
    socket.emit("launch_game", { pseudo, room, jeu: jeuFormatte });
  };

  const handleCancelGame = (gameName) => {
    const jeuFormatte = gameName === 'shifumi' ? 'Shifumi' : 'Morpion';
    socket.emit("cancel_game", { pseudo, room, jeu: jeuFormatte });
  };

  const playMorpion = (index) => {
    if (gameLocked) return;
    socket.emit("play_morpion", { pseudo, room, index });
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
      </section>

      <div className="chat__game">
        {!selectedGame ? (
          <>
            <span className="chat__game-label">🕹️ Lancer un jeu :</span>
            <button onClick={() => handleSelectGame('shifumi')} className="chat__game-btn">🪨📄✂️ Shifumi</button>
            <button onClick={() => handleSelectGame('morpion')} className="chat__game-btn">⭕❌ Morpion</button>
          </>
        ) : selectedGame === 'shifumi' ? (
          <>
            <span className="chat__game-label">Shifumi :</span>
            <button onClick={() => playGame('pierre')} className="chat__game-btn">🪨 Pierre</button>
            <button onClick={() => playGame('feuille')} className="chat__game-btn">📄 Feuille</button>
            <button onClick={() => playGame('ciseaux')} className="chat__game-btn">✂️ Ciseaux</button>
            <button onClick={() => handleCancelGame('shifumi')} className="chat__game-btn chat__game-btn--cancel">✖</button>
          </>
        ) : selectedGame === 'morpion' ? (
          <div className="chat__morpion-container">
            <span className="chat__game-label">Morpion :</span>
            <div className="chat__morpion-grid">
              {morpionBoard.map((cell, index) => (
                <button
                  key={index}
                  className="chat__morpion-cell"
                  onClick={() => playMorpion(index)}
                >
                  {cell}
                </button>
              ))}
            </div>

            <button onClick={() => handleCancelGame('morpion')} className="chat__game-btn chat__game-btn--cancel">✖</button>
          </div>
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