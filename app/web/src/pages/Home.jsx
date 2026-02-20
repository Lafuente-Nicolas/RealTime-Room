import { useState } from "react";

export default function Home({ onJoin }) {
    const [pseudo, setPseudo] = useState("");
    const [room, setRoom] = useState("");

    const submit = (e) => {
        e.preventDefault();
        if (!pseudo || !room) return;
        onJoin({ pseudo, room });
    };

    return (
        <main className="home">
            <div className="home__box">
                <h1 className="home__title">Event Chat</h1>

                <form className="home__form" onSubmit={submit}>
                    <input
                        className="home__input"
                        placeholder="Pseudo"
                        value={pseudo}
                        onChange={(e) => setPseudo(e.target.value)}
                    />

                    <input
                        className="home__input"
                        placeholder="Room"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                    />

                    <button className="home__button">Rejoindre</button>
                </form>
            </div>
        </main>
    );
}
