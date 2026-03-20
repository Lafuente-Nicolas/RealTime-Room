import { useState, useEffect } from "react";
import socket from "../../socket";

export default function Morpion({ room, pseudo, onCancel, onFinish }) {
    const [game, setGame] = useState(null);
    const [lobbies, setLobbies] = useState([]);

    useEffect(() => {
        socket.emit("get_morpion_lobbies", { room });

        const onSync = (syncData) => {
            console.log("🔵 [MORPION] Synchronisation :", syncData);
            setGame(syncData);
        };

        socket.on("morpion_lobbies_update", setLobbies);
        socket.on("morpion_sync", onSync);
        socket.on("morpion_finished", onFinish);

        return () => {
            socket.off("morpion_lobbies_update");
            socket.off("morpion_sync");
            socket.off("morpion_finished");
        };
    }, [room, onFinish]);

    const createChallenge = () => socket.emit("create_morpion_challenge", { room, pseudo });
    const acceptChallenge = (id) => socket.emit("accept_morpion_challenge", { room, pseudo, gameId: id });

    const makePlay = (index) => {
        if (game?.tourDe === pseudo && game.plateau[index] === null) {
            socket.emit("play_game_morpion", { gameId: game.id, pseudo, index });
        }
    };

    const handleClose = () => {
        socket.emit("cancel_morpion_challenge", { room, pseudo });
        onCancel();
    };

    const isMenu = !game;
    const isWaiting = game?.status === 'waiting';
    const isPlaying = game?.status === 'playing';
    const isResult = game?.status === 'result';

    const isMyTurn = game?.tourDe === pseudo;
    const mySymbol = game?.symboles?.[pseudo];
    const opponentPseudo = game?.joueurs?.find(p => p !== pseudo);

    return (
        <div className="morpion-container">
            <header className="morpion-header">
                <h3>⭕ Morpion ❌</h3>
                <button onClick={handleClose} className="morpion-cancel">✖</button>
            </header>

            <div className="morpion-body">
                {isMenu && (
                    <div className="morpion-menu">
                        <p>Défiez un joueur ou acceptez un défi existant :</p>
                        <button onClick={createChallenge} className="morpion-main-btn">Créer un défi</button>

                        {lobbies.filter(c => c.createur !== pseudo).length > 0 && (
                            <div className="morpion-lobbies">
                                <h4>Défis ouverts :</h4>
                                {lobbies.filter(c => c.createur !== pseudo).map(challenge => (
                                    <div key={challenge.id} className="morpion-challenge-card">
                                        <span>Défi de <b>{challenge.createur}</b></span>
                                        <button onClick={() => acceptChallenge(challenge.id)} className="morpion-btn">Accepter</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {isWaiting && (
                    <div className="morpion-waiting">
                        <div className="morpion-loader"></div>
                        <p>En attente qu'un adversaire accepte le défi...</p>
                    </div>
                )}

                {isPlaying && (
                    <div className="morpion-play">
                        <div className="morpion-status-bar">
                            <span className={`status-tag ${isMyTurn ? 'done' : 'waiting'}`}>
                                {isMyTurn ? `C'est à vous (${mySymbol}) ! ✅` : `⏳ Attente de l'adversaire`}
                            </span>
                        </div>

                        <div className="morpion-grid">
                            {game.plateau.map((cell, index) => (
                                <button
                                    key={index}
                                    className={`morpion-cell ${cell === 'X' ? 'cell-x' : cell === 'O' ? 'cell-o' : ''}`}
                                    onClick={() => makePlay(index)}
                                    disabled={!isMyTurn || cell !== null}
                                >
                                    {cell}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isResult && game.result && (
                    <div className="morpion-result">
                        <div className="result-status-banner">
                            {game.result.winner === pseudo ? (
                                <h2 className="win-text">🎉 VICTOIRE ! 🎉</h2>
                            ) : game.result.winner === null ? (
                                <h2 className="draw-text">🤝 ÉGALITÉ 🤝</h2>
                            ) : (
                                <h2 className="lose-text">💀 DÉFAITE... 💀</h2>
                            )}
                        </div>

                        <div className="morpion-grid result-grid">
                            {game.plateau.map((cell, index) => (
                                <button
                                    key={index}
                                    className={`morpion-cell ${cell === 'X' ? 'cell-x' : cell === 'O' ? 'cell-o' : ''}`}
                                    disabled
                                >
                                    {cell}
                                </button>
                            ))}
                        </div>

                        <p className="result-summary">{game.result.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}