import { useEffect, useState, useRef } from "react";
import socket from "../../socket";
import Message from "../Message/Message";
import Shifumi from "./Shifumi";
import Morpion from "./Morpion";
import Puissance4 from "./Puissance4";
import Uno from "./Uno";

export default function Chat({ session }) {
  const { pseudo, room } = session;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket.connect();
    socket.emit("join_room", { pseudo, room });

    const onSystemMsg = (message) => setMessages((prev) => [...prev, { system: true, message }]);

    // ✅ CORRECTION ICI : On intercepte le "Système" du UNO pour l'afficher proprement
    const onMessage = (msg) => {
      if (msg.pseudo === "Système" || msg.system) {
        onSystemMsg(msg.message);
      } else {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const onJoin = ({ pseudo }) => onSystemMsg(`${pseudo} a rejoint le salon principal`);
    const onOpponentPlayed = (data) => onSystemMsg(`⚠️ ${data.pseudo} a joué à ${data.jeu}. C'est à ton tour !`);
    const onGameLaunched = (data) => onSystemMsg(data.message);
    const onGameResult = (data) => onSystemMsg(`🎮 JEU : ${data.joueur1} a joué ${data.coup1} | ${data.joueur2} a joué ${data.coup2} ➔ Résultat : ${data.resultat}`);

    const onMorpionFinished = (data) => {
      if (data && data.winner) {
        onSystemMsg(`🏆 ${data.winner} a remporté la partie de Morpion !`);
      } else if (data && data.winner === null) {
        onSystemMsg(`🤝 La partie de Morpion s'est terminée sur un match nul !`);
      }
    };

    const onShifumiFinished = (data) => {
      if (data && data.winner) {
        onSystemMsg(`🏆 ${data.winner} a remporté le Shifumi !`);
      } else if (data && data.winner === null) {
        onSystemMsg(`🤝 Le duel de Shifumi s'est terminé sur une égalité !`);
      }
    };

    const onP4Finished = (data) => {
      if (data && data.winner) {
        onSystemMsg(`🏆 ${data.winner} a remporté la partie de Puissance 4 !`);
      } else if (data && data.winner === null) {
        onSystemMsg(`🤝 La partie de Puissance 4 s'est terminée sur un match nul !`);
      }
    };

    const onUnoFinished = (data) => {
      if (data && data.vainqueur) {
        onSystemMsg(`🏆 ${data.vainqueur} a remporté le UNO ! Félicitations !`);
      }
    };

    socket.on("receive_message", onMessage);
    socket.on("user_joined", onJoin);
    socket.on("game_result", onGameResult);
    socket.on("opponent_played", onOpponentPlayed);
    socket.on("game_launched", onGameLaunched);
    socket.on("morpion_result", onMorpionFinished);
    socket.on("shifumi_result", onShifumiFinished);
    socket.on("puissance4_result", onP4Finished);
    socket.on("uno_finished", onUnoFinished);

    return () => {
      socket.off("receive_message", onMessage);
      socket.off("user_joined", onJoin);
      socket.off("game_result", onGameResult);
      socket.off("opponent_played", onOpponentPlayed);
      socket.off("game_launched", onGameLaunched);
      socket.off("morpion_result", onMorpionFinished);
      socket.off("shifumi_result", onShifumiFinished);
      socket.off("puissance4_result", onP4Finished);
      socket.off("uno_finished", onUnoFinished);
    };
  }, [pseudo, room]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit("send_message", { targetRoom: room, pseudo, message: text });
    setText("");
  };

  const leave = () => {
    socket.disconnect();
    window.location.reload();
  };

  const handleSelectGame = (gameName) => {
    setSelectedGame(gameName);
  };

  const resetGameState = () => {
    setSelectedGame(null);
  };

  const handleCancelGame = () => {
    resetGameState();
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

      <div className={`chat__layout ${selectedGame ? 'chat__layout--split' : ''}`}>
        <div className="chat__game-zone">
          <div className="chat__game">

            {!selectedGame && (
              <>
                <span className="chat__game-label">🕹️ Lancer un jeu :</span>
                <button onClick={() => handleSelectGame('uno')} className="chat__game-btn">🃏 UNO Multijoueur</button>
                <button onClick={() => handleSelectGame('shifumi')} className="chat__game-btn">🪨📄✂️ Shifumi</button>
                <button onClick={() => handleSelectGame('morpion')} className="chat__game-btn">⭕❌ Morpion</button>
                <button onClick={() => handleSelectGame('puissance4')} className="chat__game-btn">🔴🟡 Puissance 4</button>
              </>
            )}

            {selectedGame === 'shifumi' && <Shifumi room={room} pseudo={pseudo} onCancel={handleCancelGame} onFinish={resetGameState} />}
            {selectedGame === 'morpion' && <Morpion room={room} pseudo={pseudo} onCancel={handleCancelGame} onFinish={resetGameState} />}
            {selectedGame === 'puissance4' && <Puissance4 room={room} pseudo={pseudo} onCancel={handleCancelGame} onFinish={resetGameState} />}
            {selectedGame === 'uno' && <Uno room={room} pseudo={pseudo} onCancel={handleCancelGame} />}

          </div>
        </div>

        <aside className="chat__sidebar">
          <section className="chat__messages">
            {messages.map((m, i) => (
              <Message key={i} msg={m} self={m.pseudo === pseudo} />
            ))}
            <div ref={messagesEndRef} />
          </section>
          <form className="chat__form" onSubmit={send}>
            <input
              className="chat__input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Écrire un message..."
            />
            <button className="chat__send">Envoyer</button>
          </form>
        </aside>
      </div>
    </main>
  );
}