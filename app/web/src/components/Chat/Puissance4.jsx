import { useState, useEffect } from "react";
import socket from "../../socket";

export default function Puissance4({ room, pseudo, onCancel, onFinish }) {
    const [game, setGame] = useState(null);
    const [lobbies, setLobbies] = useState([]);

    useEffect(() => {
        socket.emit("get_puissance4_lobbies", { room });

        const onSync = (syncData) => {
            setGame(syncData);
        };

        const handleAutoClose = () => {
            onFinish();
        };

        socket.on("puissance4_lobbies_update", setLobbies);
        socket.on("puissance4_sync", onSync);
        socket.on("puissance4_finished", handleAutoClose);

        return () => {
            socket.off("puissance4_lobbies_update");
            socket.off("puissance4_sync");
            socket.off("puissance4_finished", handleAutoClose);
        };
    }, [room, onFinish]);

    const createChallenge = () => socket.emit("create_puissance4_challenge", { room, pseudo });
    const acceptChallenge = (id) => socket.emit("accept_puissance4_challenge", { room, pseudo, gameId: id });

    const makePlay = (colIndex) => {
        if (game?.tourDe === pseudo && game.plateau[0][colIndex] === null && game.status === 'playing') {
            socket.emit("play_game_puissance4", { gameId: game.id, pseudo, colonneIndex: colIndex });
        }
    };

    const handleClose = () => {
        socket.emit("cancel_puissance4_challenge", { room, pseudo });
        onCancel();
    };

    const isMenu = !game;
    const isWaiting = game?.status === 'waiting';
    const isPlaying = game?.status === 'playing';
    const isResult = game?.status === 'result';

    const isMyTurn = game?.tourDe === pseudo;
    const mySymbol = game?.symboles?.[pseudo];
    const colorName = mySymbol === 'R' ? 'Rouge' : 'Jaune';

    return (
        <div className="p4-container">
            <header className="p4-header">
                <h3>🔴 Puissance 4 🟡</h3>
                <button onClick={handleClose} className="p4-cancel">✖</button>
            </header>

            <div className="p4-body">
                {isMenu && (
                    <div className="p4-menu">
                        <p>Défiez un joueur ou acceptez un défi existant :</p>
                        <button onClick={createChallenge} className="p4-main-btn">Créer un défi</button>

                        {lobbies.filter(c => c.createur !== pseudo).length > 0 && (
                            <div className="p4-lobbies">
                                <h4>Défis ouverts :</h4>
                                {lobbies.filter(c => c.createur !== pseudo).map(challenge => (
                                    <div key={challenge.id} className="p4-challenge-card">
                                        <span>Défi de <b>{challenge.createur}</b></span>
                                        <button onClick={() => acceptChallenge(challenge.id)} className="p4-btn">Accepter</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {isWaiting && (
                    <div className="p4-waiting">
                        <div className="p4-loader"></div>
                        <p>⏳ En attente d'un adversaire...</p>
                    </div>
                )}

                {(isPlaying || isResult) && (
                    <div className="p4-game-zone">

                        {isResult && game.result ? (
                            <div className="p4-result-banner">
                                {game.result.winner === pseudo ? (
                                    <h2 className="win-text">🎉 VICTOIRE ! 🎉</h2>
                                ) : game.result.winner === null ? (
                                    <h2 className="draw-text">🤝 ÉGALITÉ 🤝</h2>
                                ) : (
                                    <h2 className="lose-text">💀 DÉFAITE... 💀</h2>
                                )}
                                <p className="result-summary">{game.result.message}</p>
                            </div>
                        ) : (
                            <div className="p4-status-bar">
                                <span className={`status-tag ${isMyTurn ? 'done' : 'waiting'}`}>
                                    {isMyTurn ? `C'est à vous (${colorName}) ! ✅` : `⏳ Attente de l'adversaire`}
                                </span>
                            </div>
                        )}

                        <div className={`p4-board-stand ${isResult ? 'game-over' : ''}`}>
                            <div className="p4-board">
                                <div className="p4-grid">
                                    {game.plateau.map((row, rowIndex) => (
                                        row.map((cell, colIndex) => {
                                            const isColumnPlayable = !isResult && isMyTurn && game.plateau[0][colIndex] === null;
                                            return (
                                                <div
                                                    key={`${rowIndex}-${colIndex}`}
                                                    className={`p4-cell-bg ${isColumnPlayable ? 'clickable' : ''}`}
                                                    onClick={() => isColumnPlayable && makePlay(colIndex)}
                                                >
                                                    <div className={`p4-token ${cell === 'R' ? 'token-red' : cell === 'J' ? 'token-yellow' : ''}`}></div>
                                                </div>
                                            );
                                        })
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}