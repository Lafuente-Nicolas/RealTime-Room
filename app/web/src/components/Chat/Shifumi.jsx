import { useState, useEffect } from "react";
import socket from "../../socket";

const RockIcon = () => (
    <svg viewBox="0 0 100 100" className="shifumi-icon">
        <path d="M50 15 L85 45 L70 85 L30 85 L15 45 Z" fill="#94a3b8" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
        <path d="M50 15 L50 55 L85 45" fill="none" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
        <path d="M50 15 L25 45 L50 55 L30 85" fill="none" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
        <path d="M50 55 L70 85" fill="none" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
    </svg>
);
const PaperIcon = () => (
    <svg viewBox="0 0 100 100" className="shifumi-icon">
        <path d="M25 10 h35 l20 20 v60 h-55 z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="4" strokeLinejoin="round" />
        <path d="M60 10 v20 h20" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="4" strokeLinejoin="round" />
        <line x1="35" y1="45" x2="65" y2="45" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <line x1="35" y1="60" x2="65" y2="60" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <line x1="35" y1="75" x2="50" y2="75" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
    </svg>
);
const ScissorsIcon = () => (
    <svg viewBox="0 0 100 100" className="shifumi-icon">
        <path d="M40 50 L85 20" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
        <path d="M40 50 L85 80" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
        <circle cx="25" cy="25" r="14" fill="none" stroke="#ef4444" strokeWidth="8" />
        <circle cx="25" cy="75" r="14" fill="none" stroke="#ef4444" strokeWidth="8" />
        <circle cx="45" cy="50" r="5" fill="#64748b" />
    </svg>
);

const choices = [
    { id: 'pierre', name: 'Pierre', icon: <RockIcon /> },
    { id: 'feuille', name: 'Feuille', icon: <PaperIcon /> },
    { id: 'ciseaux', name: 'Ciseaux', icon: <ScissorsIcon /> },
];

export default function Shifumi({ room, pseudo, onCancel }) {
    const [lobbies, setLobbies] = useState([]);
    const [game, setGame] = useState(null);

    useEffect(() => {
        socket.emit("get_shifumi_lobbies", { room });

        socket.on("shifumi_lobbies_update", setLobbies);
        socket.on("shifumi_sync", setGame); // Met à jour tout l'affichage d'un coup
        socket.on("shifumi_finished", onCancel);

        return () => {
            socket.off("shifumi_lobbies_update");
            socket.off("shifumi_sync");
            socket.off("shifumi_finished");
        };
    }, [room, onCancel]);

    const createChallenge = () => socket.emit("create_shifumi_challenge", { room, pseudo });
    const acceptChallenge = (id) => socket.emit("accept_shifumi_challenge", { room, pseudo, gameId: id });
    const makePlay = (id) => socket.emit("play_game_shifumi", { gameId: game.id, pseudo, coup: id });
    const handleClose = () => {
        socket.emit("cancel_shifumi_challenge", { room, pseudo });
        onCancel();
    };

    const isMenu = !game;
    const isWaiting = game?.status === 'waiting';
    const isPlaying = game?.status === 'playing';
    const isResult = game?.status === 'result';
    const myChoice = game?.coups?.[pseudo];
    const opponentPseudo = game?.joueurs?.find(p => p !== pseudo);
    const opponentPlayed = opponentPseudo && game?.coups?.[opponentPseudo] !== undefined;

    return (
        <div className="shifumi-container">
            <header className="shifumi-header">
                <h3>🪨📄✂️ Shifumi Arena</h3>
                <button onClick={handleClose} className="shifumi-cancel">✖</button>
            </header>

            <div className="shifumi-body">
                {isMenu && (
                    <div className="shifumi-menu">
                        <p>Défiez un joueur ou acceptez un défi existant :</p>
                        <button onClick={createChallenge} className="shifumi-main-btn">Défier quelqu'un</button>

                        {lobbies.filter(c => c.createur !== pseudo).length > 0 && (
                            <div className="shifumi-lobbies">
                                <h4>Défis ouverts :</h4>
                                {lobbies.filter(c => c.createur !== pseudo).map(challenge => (
                                    <div key={challenge.id} className="shifumi-challenge-card">
                                        <span>Défi de <b>{challenge.createur}</b></span>
                                        <button onClick={() => acceptChallenge(challenge.id)} className="shifumi-btn">Accepter</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {isWaiting && (
                    <div className="shifumi-waiting">
                        <div className="shifumi-loader"></div>
                        <p>⏳ En attente qu'un adversaire accepte le défi...</p>
                    </div>
                )}

                {isPlaying && (
                    <div className="shifumi-play">
                        <div className="shifumi-status-bar">
                            <span className={`status-tag ${myChoice ? 'done' : 'waiting'}`}>
                                {myChoice ? `Vous avez joué ✅` : `Choisissez votre coup🎯`}
                            </span>
                            <span className={`status-tag ${opponentPlayed ? 'done' : 'waiting'}`}>
                                {opponentPlayed ? `L'adversaire a joué ✅` : `⏳ Attente de l'adversaire`}
                            </span>
                        </div>

                        <div className="shifumi-choices">
                            {choices.map(choice => (
                                <button
                                    key={choice.id}
                                    className={`shifumi-choice-btn ${myChoice === choice.id ? 'selected' : ''}`}
                                    onClick={() => makePlay(choice.id)}
                                    disabled={!!myChoice}
                                >
                                    {choice.icon}
                                    <span className="choice-name">{choice.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isResult && game.result && (
                    <div className="shifumi-result">
                        <div className="result-status-banner">
                            {game.result.winner === pseudo ? (
                                <h2 className="win-text">🎉 VICTOIRE ! 🎉</h2>
                            ) : game.result.winner === null ? (
                                <h2 className="draw-text">🤝 ÉGALITÉ 🤝</h2>
                            ) : (
                                <h2 className="lose-text">💀 DÉFAITE... 💀</h2>
                            )}
                        </div>

                        <div className="result-versus">
                            <div className="result-player">
                                <span className="player-pseudo">{game.result.p1_pseudo}</span>
                                {choices.find(c => c.id === game.result.p1_coup)?.icon || "🏳️"}
                            </div>

                            <span className="vs-sign">VS</span>

                            <div className="result-player">
                                <span className="player-pseudo">{game.result.p2_pseudo}</span>
                                {choices.find(c => c.id === game.result.p2_coup)?.icon || "🏳️"}
                            </div>
                        </div>

                        <p className="result-summary">{game.result.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}