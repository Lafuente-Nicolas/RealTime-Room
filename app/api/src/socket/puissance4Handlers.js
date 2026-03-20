import { playMove, calculateWinner } from "../games/puissance4.js";

export const registerPuissance4Handlers = (io, socket, games) => {

    const sendLobbies = (room) => {
        const lobbies = Object.values(games)
            .filter(g => g.mainRoom === room && g.type === 'Puissance4' && g.status === 'waiting')
            .map(g => ({ id: g.id, createur: g.createur }));
        io.to(room).emit("puissance4_lobbies_update", lobbies);
    };

    const syncGame = (gameId) => {
        const game = games[gameId];
        if (game) io.to(gameId).emit("puissance4_sync", game);
    };

    socket.on("get_puissance4_lobbies", ({ room }) => sendLobbies(room));

    socket.on("cancel_puissance4_challenge", ({ room, pseudo }) => {
        const gameId = Object.keys(games).find(id =>
            games[id].mainRoom === room && games[id].type === 'Puissance4' && games[id].joueurs.includes(pseudo)
        );
        if (gameId) {
            const game = games[gameId];
            if (game.status === 'playing') {
                // On vérifie s'il y a bien un adversaire
                const winnerPseudo = game.joueurs.find(p => p !== pseudo) || 'Personne';
                game.status = 'result';
                game.result = {
                    winner: winnerPseudo,
                    message: `🛑 ${pseudo} a fui le combat !`
                };

                // Annonce de l'abandon dans le chat
                io.to(gameId).emit("puissance4_result", { winner: winnerPseudo });

                syncGame(gameId);
                setTimeout(() => {
                    io.to(gameId).emit("puissance4_finished");
                    delete games[gameId];
                    sendLobbies(room);
                }, 3000);
            } else {
                delete games[gameId];
                sendLobbies(room);
            }
        }
    });

    socket.on("create_puissance4_challenge", ({ room, pseudo }) => {
        const gameId = "p4_" + Date.now();
        const initialPlateau = Array(6).fill(null).map(() => Array(7).fill(null));
        games[gameId] = {
            id: gameId, mainRoom: room, type: 'Puissance4', createur: pseudo,
            status: 'waiting', joueurs: [pseudo], plateau: initialPlateau,
            tourDe: pseudo, symboles: { [pseudo]: 'R' }, result: null // R = Rouge
        };
        socket.join(gameId);
        sendLobbies(room);

        io.to(socket.id).emit("puissance4_update", { status: 'waiting', gameId: gameId });
        syncGame(gameId);
    });

    socket.on("accept_puissance4_challenge", ({ room, pseudo, gameId }) => {
        const game = games[gameId];
        if (!game || game.status !== 'waiting' || game.joueurs.includes(pseudo)) return;

        game.joueurs.push(pseudo);
        game.symboles[pseudo] = 'J'; // J = Jaune
        game.status = 'playing';
        socket.join(gameId);
        sendLobbies(room);

        io.to(gameId).emit("puissance4_update", {
            status: 'playing',
            joueurs: game.joueurs,
            gameId: gameId
        });
        syncGame(gameId);
    });

    socket.on("play_game_puissance4", ({ gameId, pseudo, colonneIndex }) => {
        const game = games[gameId];
        if (!game || game.status !== 'playing') return;

        if (game.tourDe !== pseudo) return;

        const symboleActuel = game.symboles[pseudo];
        const ancienneGrilleJSON = JSON.stringify(game.plateau);

        game.plateau = playMove(game.plateau, colonneIndex, symboleActuel);

        if (ancienneGrilleJSON === JSON.stringify(game.plateau)) return;

        const gagnantSymbole = calculateWinner(game.plateau);

        const estPlein = game.plateau[0].every(cell => cell !== null);

        if (gagnantSymbole) {
            game.status = 'result';
            game.result = { winner: pseudo, message: `${pseudo} a aligné 4 jetons !` };

            io.to(gameId).emit("puissance4_result", { winner: pseudo });

            syncGame(gameId);
            setTimeout(() => {
                io.to(gameId).emit("puissance4_finished");
                delete games[gameId];
            }, 3000);

        } else if (estPlein) {
            game.status = 'result';
            game.result = { winner: null, message: "Match nul, grille pleine !" };

            io.to(gameId).emit("puissance4_result", { winner: null });

            syncGame(gameId);
            setTimeout(() => {
                io.to(gameId).emit("puissance4_finished");
                delete games[gameId];
            }, 3000);

        } else {
            game.tourDe = game.joueurs.find(p => p !== pseudo);
            syncGame(gameId);
        }
    });
};