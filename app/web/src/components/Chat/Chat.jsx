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

  const [unoLobbies, setUnoLobbies] = useState([]);
  const [currentUnoGameId, setCurrentUnoGameId] = useState(null);
  const [isWaitingInLobby, setIsWaitingInLobby] = useState(false);
  const [nbJoueursUno, setNbJoueursUno] = useState(4);
  const [varianteUno, setVarianteUno] = useState('officielle');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket.connect();
    socket.emit("join_room", { pseudo, room });

    const onMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const onSystemMsg = (message) => setMessages((prev) => [...prev, { system: true, message }]);

    const onJoin = ({ pseudo }) => onSystemMsg(`${pseudo} a rejoint le salon principal`);
    const onOpponentPlayed = (data) => onSystemMsg(`⚠️ ${data.pseudo} a joué à ${data.jeu}. C'est à ton tour !`);
    const onGameLaunched = (data) => onSystemMsg(data.message);
    const onGameResult = (data) => onSystemMsg(`🎮 JEU : ${data.joueur1} a joué ${data.coup1} | ${data.joueur2} a joué ${data.coup2} ➔ Résultat : ${data.resultat}`);
    const onGameCancelled = (data) => {
      onSystemMsg(data.message);
    };

    const onLobbiesUpdate = (lobbies) => setUnoLobbies(lobbies);
    const onUnoLobbyJoined = (data) => {
      setCurrentUnoGameId(data.gameId);
      setIsWaitingInLobby(true);
      setSelectedGame('uno_play');
      onSystemMsg(`💬 Tu as rejoint le chat privé de la table. ${data.message}`);
    };

    const onUnoUpdate = (data) => {
      if (isWaitingInLobby) setIsWaitingInLobby(false);
      setCurrentUnoGameId(data.gameId);
      if (data.message) onSystemMsg(`🃏 UNO : ${data.message}`);
    };

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

    socket.on("receive_message", onMessage);
    socket.on("user_joined", onJoin);
    socket.on("game_result", onGameResult);
    socket.on("opponent_played", onOpponentPlayed);
    socket.on("game_launched", onGameLaunched);
    socket.on("game_cancelled", onGameCancelled);
    socket.on("lobbies_update", onLobbiesUpdate);
    socket.on("uno_lobby_joined", onUnoLobbyJoined);
    socket.on("uno_update", onUnoUpdate);
    socket.on("morpion_result", onMorpionFinished);
    socket.on("shifumi_result", onShifumiFinished);

    return () => {
      socket.off("receive_message", onMessage);
      socket.off("user_joined", onJoin);
      socket.off("game_result", onGameResult);
      socket.off("opponent_played", onOpponentPlayed);
      socket.off("game_launched", onGameLaunched);
      socket.off("game_cancelled", onGameCancelled);
      socket.off("lobbies_update", onLobbiesUpdate);
      socket.off("uno_lobby_joined", onUnoLobbyJoined);
      socket.off("uno_update", onUnoUpdate);
      socket.off("morpion_result", onMorpionFinished);
      socket.off("shifumi_result", onShifumiFinished);
    };
  }, [pseudo, room]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const targetRoom = currentUnoGameId || room;
    socket.emit("send_message", { targetRoom, pseudo, message: text });
    setText("");
  };

  const leave = () => {
    socket.disconnect();
    window.location.reload();
  };

  const handleSelectGame = (gameName) => {
    setSelectedGame(gameName);

    if (gameName === 'puissance4') socket.emit("launch_game", { pseudo, room, jeu: 'Puissance4' });
  };

  const resetGameState = () => {
    setSelectedGame(null);
    setCurrentUnoGameId(null);
    setIsWaitingInLobby(false);
  };

  const handleCancelGame = (gameName) => {
    if (gameName === 'uno_play' || gameName === 'uno_lobby') {
      if (currentUnoGameId) {
        socket.emit("leave_uno_game", { gameId: currentUnoGameId, pseudo, room });
      }
    } else if (gameName === 'puissance4') {
      socket.emit("cancel_game", { pseudo, room, jeu: 'Puissance4' });
    }

    resetGameState();
  };

  const handleFinishGame = () => {
    resetGameState();
  };

  const handleCreateUno = () => {
    socket.emit("create_uno_game", { room, pseudo, nbJoueurs: nbJoueursUno, variante: varianteUno });
  };

  const handleJoinUno = (gameId) => {
    socket.emit("join_uno_game", { room, pseudo, gameId });
  };

  const isPlayingGame = selectedGame === 'uno_play' || selectedGame === 'puissance4' || selectedGame === 'morpion' || selectedGame === 'shifumi';

  return (
    <main className="chat">
      <header className="chat__header">
        <div className="chat__infos">
          <h2 className="chat__room">
            {currentUnoGameId ? `🃏 Table Privée` : `Room: ${room}`}
          </h2>
          <span className="chat__pseudo">{pseudo}</span>
        </div>
        <button className="chat__leave" onClick={leave}>Quitter</button>
      </header>

      <div className={`chat__layout ${isPlayingGame ? 'chat__layout--split' : ''}`}>
        <div className="chat__game-zone">
          <div className="chat__game">

            {!selectedGame && (
              <>
                <span className="chat__game-label">🕹️ Lancer un jeu :</span>
                <button onClick={() => handleSelectGame('uno_lobby')} className="chat__game-btn">🃏 UNO Multijoueur</button>
                <button onClick={() => handleSelectGame('shifumi')} className="chat__game-btn">🪨📄✂️ Shifumi</button>
                <button onClick={() => handleSelectGame('morpion')} className="chat__game-btn">⭕❌ Morpion</button>
                <button onClick={() => handleSelectGame('puissance4')} className="chat__game-btn">🔴🟡 Puissance 4</button>
              </>
            )}

            {selectedGame === 'shifumi' && <Shifumi room={room} pseudo={pseudo} onCancel={() => handleCancelGame('shifumi')} onFinish={handleFinishGame} />}
            {selectedGame === 'morpion' && <Morpion room={room} pseudo={pseudo} onCancel={() => handleCancelGame('morpion')} onFinish={handleFinishGame} />}
            {selectedGame === 'puissance4' && <Puissance4 room={room} pseudo={pseudo} onCancel={() => handleCancelGame('puissance4')} />}

            {selectedGame === 'uno_lobby' && (
              <div className="chat__uno-lobby">
                <span className="chat__game-label chat__uno-title">⚙️ Créer une table de UNO</span>
                <div className="chat__uno-option">
                  <label>Joueurs max :</label>
                  <select value={nbJoueursUno} onChange={(e) => setNbJoueursUno(Number(e.target.value))} className="chat__input chat__uno-select--small">
                    {[2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num}</option>)}
                  </select>
                </div>
                <div className="chat__uno-option">
                  <label>Règles :</label>
                  <select value={varianteUno} onChange={(e) => setVarianteUno(e.target.value)} className="chat__input chat__uno-select--large">
                    <option value="officielle">🏆 Officielles</option>
                    <option value="baston">⚔️ Baston (+2/+4)</option>
                  </select>
                </div>
                <div className="chat__uno-actions">
                  <button onClick={handleCreateUno} className="chat__game-btn">Créer la table</button>
                  <button onClick={() => handleCancelGame('uno_lobby')} className="chat__game-btn chat__game-btn--cancel">Retour</button>
                </div>

                {unoLobbies.length > 0 && (
                  <div className="chat__uno-list">
                    <span className="chat__game-label chat__uno-list-title">🟢 Tables en attente :</span>
                    {unoLobbies.map(lobby => (
                      <div key={lobby.id} className="chat__uno-item">
                        <div className="chat__uno-item-text">
                          <strong>Table de {lobby.createur}</strong><br />
                          <small className="chat__uno-item-details">{lobby.nbJoueursActuel}/{lobby.maxJoueurs} joueurs - {lobby.variante}</small>
                        </div>
                        <button onClick={() => handleJoinUno(lobby.id)} className="chat__game-btn chat__game-btn--small">Rejoindre</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedGame === 'uno_play' && (
              isWaitingInLobby ? (
                <div className="chat__uno-waiting">
                  <span className="chat__game-label chat__uno-waiting-title">⏳ En attente des autres joueurs...</span>
                  <p className="chat__uno-waiting-text">Tu es dans le chat privé de la table.</p>
                  <button onClick={() => handleCancelGame('uno_play')} className="chat__game-btn chat__game-btn--cancel">Quitter la table</button>
                </div>
              ) : (
                <Uno gameId={currentUnoGameId} pseudo={pseudo} room={room} onCancel={() => handleCancelGame('uno_play')} />
              )
            )}

          </div>
        </div>

        {(!selectedGame || isPlayingGame || selectedGame === 'uno_lobby') && (
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
        )}
      </div>
    </main>
  );
}