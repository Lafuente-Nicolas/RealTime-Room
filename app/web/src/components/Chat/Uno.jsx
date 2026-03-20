import { useState, useEffect } from "react";
import socket from "../../socket";

export default function Uno({ room, pseudo, onCancel }) {
    const [lobbies, setLobbies] = useState([]);
    const [gameId, setGameId] = useState(null);
    const [isWaiting, setIsWaiting] = useState(false);
    const [gameState, setGameState] = useState(null);

    const [nbJoueursUno, setNbJoueursUno] = useState(4);
    const [varianteUno, setVarianteUno] = useState('officielle');
    const [pendingCardIndex, setPendingCardIndex] = useState(null);

    useEffect(() => {
        socket.emit("get_uno_lobbies", { room });

        const onLobbies = (data) => setLobbies(data);

        const onLobbyJoined = (data) => {
            setGameId(data.gameId);
            setIsWaiting(true);
        };

        const onUpdate = (data) => {
            setIsWaiting(false);
            setGameId(data.gameId);
            setGameState(data);
        };

        socket.on("lobbies_update", onLobbies);
        socket.on("uno_lobby_joined", onLobbyJoined);
        socket.on("uno_update", onUpdate);

        return () => {
            socket.off("lobbies_update", onLobbies);
            socket.off("uno_lobby_joined", onLobbyJoined);
            socket.off("uno_update", onUpdate);
        };
    }, [room]);

    const createChallenge = () => socket.emit("create_uno_game", { room, pseudo, nbJoueurs: nbJoueursUno, variante: varianteUno });
    const acceptChallenge = (id) => socket.emit("join_uno_game", { room, pseudo, gameId: id });

    const handleClose = () => {
        if (gameId) socket.emit("leave_uno_game", { gameId, pseudo, room });
        onCancel();
    };

    const playCard = (index, couleurChoisie = null) => {
        if (gameState?.vainqueur || !gameId) return;
        socket.emit("play_uno_card", { gameId, pseudo, index, couleurChoisie });
    };

    const drawCard = () => {
        if (gameState?.vainqueur || !gameId) return;
        socket.emit("draw_uno_card", { gameId, pseudo });
    };

    const getSymboleCarte = (valeur) => {
        if (valeur === 'inversion') return '🔄';
        if (valeur === 'passer') return '🚫';
        if (valeur === 'joker') return '🌈';
        if (valeur === '+4') return '🃏+4';
        return valeur;
    };

    const isSpecial = (valeur) => valeur === 'inversion' || valeur === 'passer';
    const monTour = (gameState?.tourDe === pseudo) && !gameState?.vainqueur;

    const handleCardClick = (index) => {
        if (!monTour) return;
        const carte = gameState.main[index];
        if (carte.couleur === 'noir') setPendingCardIndex(index);
        else playCard(index);
    };

    const handleColorPick = (couleur) => {
        playCard(pendingCardIndex, couleur);
        setPendingCardIndex(null);
    };

    const isMenu = !gameId && !gameState;
    const isLobby = gameId && isWaiting;
    const isGame = gameId && gameState;

    return (
        <div className="uno-container">
            <header className="uno-header">
                <h3>🔴 UNO Multijoueur 🟡</h3>
                <button onClick={handleClose} className="uno-cancel">✖</button>
            </header>

            <div className="uno-body">

                {isMenu && (
                    <div className="uno-menu">
                        <div className="uno-creation-box">
                            <h4>⚙️ Créer une table</h4>
                            <div className="uno-options">
                                <div className="uno-option-group">
                                    <label>Joueurs max :</label>
                                    <select value={nbJoueursUno} onChange={(e) => setNbJoueursUno(Number(e.target.value))}>
                                        {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Joueurs</option>)}
                                    </select>
                                </div>
                                <div className="uno-option-group">
                                    <label>Mode de jeu :</label>
                                    <select value={varianteUno} onChange={(e) => setVarianteUno(e.target.value)}>
                                        <option value="officielle">🏆 Officiel</option>
                                        <option value="baston">⚔️ Baston (+2/+4)</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={createChallenge} className="uno-main-btn">Créer la table</button>
                        </div>

                        {lobbies.length > 0 && (
                            <div className="uno-lobbies">
                                <h4>🟢 Tables en attente :</h4>
                                {lobbies.map(lobby => (
                                    <div key={lobby.id} className="uno-challenge-card">
                                        <div className="uno-challenge-info">
                                            <strong>Table de {lobby.createur}</strong>
                                            <span>{lobby.nbJoueursActuel}/{lobby.maxJoueurs} joueurs • {lobby.variante === 'baston' ? '⚔️ Baston' : '🏆 Officiel'}</span>
                                        </div>
                                        <button onClick={() => acceptChallenge(lobby.id)} className="uno-btn">Rejoindre</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {isLobby && (
                    <div className="uno-waiting">
                        <div className="uno-loader"></div>
                        <div className="status-tag waiting">⏳ En attente d'adversaires...</div>
                        <p>La partie se lancera automatiquement quand la table sera pleine.</p>
                    </div>
                )}

                {isGame && (
                    <div className="uno-game-zone">

                        {gameState.vainqueur && (
                            <div className="uno-result-banner">
                                {gameState.vainqueur === pseudo ? (
                                    <h2 className="win-text">🏆 VICTOIRE !</h2>
                                ) : (
                                    <h2 className="lose-text">💀 DÉFAITE...</h2>
                                )}
                                <p>{gameState.vainqueur === pseudo ? "Tu as gagné la partie !" : `${gameState.vainqueur} a gagné la partie.`}</p>
                                <button onClick={handleClose} className="uno-main-btn">Retour au salon</button>
                            </div>
                        )}

                        {pendingCardIndex !== null && (
                            <div className="uno-color-picker">
                                <h3>🎨 Choisis la couleur :</h3>
                                <div className="uno-color-options">
                                    <button className="uno-color-btn red" onClick={() => handleColorPick('rouge')}></button>
                                    <button className="uno-color-btn blue" onClick={() => handleColorPick('bleu')}></button>
                                    <button className="uno-color-btn green" onClick={() => handleColorPick('vert')}></button>
                                    <button className="uno-color-btn yellow" onClick={() => handleColorPick('jaune')}></button>
                                </div>
                                <button onClick={() => setPendingCardIndex(null)} className="uno-cancel-btn">Annuler</button>
                            </div>
                        )}

                        <div className="uno-opponents">
                            {gameState.opponentsInfo?.map((opp, i) => (
                                <div key={i} className="uno-opponent-card">
                                    <span className="opp-name">{opp.pseudo}</span>
                                    <span className="opp-cards">{opp.cartesRestantes} 🃏</span>
                                </div>
                            ))}
                        </div>

                        <div className="uno-status-bar">
                            <span className={`status-tag ${monTour ? 'done' : 'waiting'}`}>
                                {monTour ? "👉 C'est à TON tour ! 🎯" : `⏳ Attente de ${gameState.tourDe}...`}
                            </span>
                        </div>

                        <div className="uno-center-table">
                            <div className="uno-pile">
                                <span className="pile-label">Pioche</span>
                                <button
                                    className={`uno-card deck ${!monTour ? 'inactive' : ''}`}
                                    onClick={() => monTour && drawCard()}
                                >
                                    +
                                </button>
                            </div>
                            <div className="uno-pile">
                                <span className="pile-label">Carte en jeu</span>
                                {gameState.carteAuMilieu ? (
                                    <div className="uno-card active-card" data-color={gameState.carteAuMilieu.couleur === 'noir' ? gameState.couleurActive : gameState.carteAuMilieu.couleur}>
                                        <span className={isSpecial(gameState.carteAuMilieu.valeur) ? 'symbol' : ''}>
                                            {getSymboleCarte(gameState.carteAuMilieu.valeur)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="uno-card empty">...</div>
                                )}
                            </div>
                        </div>

                        <div className="uno-hand">
                            <span className="hand-label">Ta main ({gameState.main.length} cartes)</span>
                            <div className="hand-cards">
                                {gameState.main.map((carte, i) => (
                                    <button
                                        key={i}
                                        className={`uno-card ${!monTour ? 'inactive' : ''}`}
                                        data-color={carte.couleur}
                                        onClick={() => handleCardClick(i)}
                                    >
                                        <span className={isSpecial(carte.valeur) ? 'symbol' : ''}>
                                            {getSymboleCarte(carte.valeur)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}