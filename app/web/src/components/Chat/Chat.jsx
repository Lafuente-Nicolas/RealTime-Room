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

      <div style={{ display: "flex", gap: "10px", padding: "10px 16px", background: "#f9fafb", borderTop: "1px solid #e5e7eb", justifyContent: "center" }}>
        <span style={{ fontWeight: 600, alignSelf: "center", fontSize: "14px", color: "#6b7280" }}>Jouer :</span>
        <button onClick={() => playGame('pierre')} style={btnStyle}>🪨 Pierre</button>
        <button onClick={() => playGame('feuille')} style={btnStyle}>📄 Feuille</button>
        <button onClick={() => playGame('ciseaux')} style={btnStyle}>✂️ Ciseaux</button>
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