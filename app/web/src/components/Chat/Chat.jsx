import { useEffect, useState } from "react";
import socket from "../../socket";
import Message from "../Message/Message";

export default function Chat({ session }) {
  const { pseudo, room } = session;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.connect();

    socket.emit("join_room", { pseudo, room });

    const onMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onJoin = ({ pseudo }) => {
      setMessages((prev) => [
        ...prev,
        { system: true, message: `${pseudo} a rejoint la room` }
      ]);
    };

    const onGameResult = (data) => {
      setMessages((prev) => [
        ...prev,
        {
          system: true,
          message: `🎮 JEU : ${data.joueur1} a joué ${data.coup1} | ${data.joueur2} a joué ${data.coup2} ➔ Résultat : ${data.resultat}`
        }
      ]);
    };

    socket.on("receive_message", onMessage);
    socket.on("user_joined", onJoin);
    socket.on("game_result", onGameResult); // Ajout de l'écouteur

    return () => {
      socket.off("receive_message", onMessage);
      socket.off("user_joined", onJoin);
      socket.off("game_result", onGameResult); // Nettoyage de l'écouteur
      socket.disconnect();
    };
  }, [pseudo, room]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    socket.emit("send_message", {
      pseudo,
      room,
      message: text
    });

    setText("");
  };

  const leave = () => {
    socket.disconnect();
    window.location.reload();
  };

  const playGame = (coup) => {
    socket.emit("play_game", { pseudo, room, coup });

    setMessages((prev) => [
      ...prev,
      { system: true, message: `🎮 Vous avez joué ${coup}. En attente de l'adversaire...` }
    ]);
  };

  return (
    <main className="chat">
      <header className="chat__header">
        <div className="chat__infos">
          <h2 className="chat__room">Room: {room}</h2>
          <span className="chat__pseudo">{pseudo}</span>
        </div>

        <button className="chat__leave" onClick={leave}>
          Quitter
        </button>
      </header>

      <section className="chat__messages">
        {messages.map((m, i) => (
          <Message key={i} msg={m} self={m.pseudo === pseudo} />
        ))}
      </section>

      <div className="chat__game">
        <span className="chat__game-label">Jouer :</span>
        <button onClick={() => playGame('pierre')} className="chat__game-btn">🪨 Pierre</button>
        <button onClick={() => playGame('feuille')} className="chat__game-btn">📄 Feuille</button>
        <button onClick={() => playGame('ciseaux')} className="chat__game-btn">✂️ Ciseaux</button>
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