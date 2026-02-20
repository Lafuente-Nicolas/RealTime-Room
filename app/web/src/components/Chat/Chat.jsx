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

    socket.on("receive_message", onMessage);
    socket.on("user_joined", onJoin);

    return () => {
      socket.off("receive_message", onMessage);
      socket.off("user_joined", onJoin);
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
