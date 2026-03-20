import { calculateWinner } from "../games/morpion.js";

export const registerMorpionHandlers = (io, socket, games) => {

    const sendLobbies = (room) => {
        const lobbies = Object.values(games)
            .filter(g => g.mainRoom === room && g.type === 'Morpion' && g.status === 'waiting')
            .map(g => ({ id: g.id, createur: g.createur }));
        io.to(room).emit("morpion_lobbies_update", lobbies);
    };

    const syncGame = (gameId) => {
        const game = games[gameId];
        if (game) io.to(gameId).emit("morpion_sync", game);
    };

    socket.on("get_morpion_lobbies", ({ room }) => sendLobbies(room));

    socket.on("cancel_morpion_challenge", ({ room, pseudo }) => {
        const gameId = Object.keys(games).find(id =>
            games[id].mainRoom === room && games[id].type === 'Morpion' && games[id].joueurs.includes(pseudo)
        );
        if (gameId) {
            const game = games[gameId];
            if (game.status === 'playing') {
                const winnerPseudo = game.joueurs.find(p => p !== pseudo);
                game.status = 'result';
                game.result = {
                    winner: winnerPseudo,
                    message: `🛑 ${pseudo} a fui le combat !`
                };

                io.to(gameId).emit("morpion_result", { winner: winnerPseudo });

                syncGame(gameId);
                setTimeout(() => {
                    io.to(gameId).emit("morpion_finished");
                    delete games[gameId];
                    sendLobbies(room);
                }, 3000);
            } else {
                delete games[gameId];
                sendLobbies(room);
            }
        }
    });

    socket.on("create_morpion_challenge", ({ room, pseudo }) => {
        const gameId = "morpion_" + Date.now();
        games[gameId] = {
            id: gameId, mainRoom: room, type: 'Morpion', createur: pseudo,
            status: 'waiting', joueurs: [pseudo], plateau: Array(9).fill(null),
            tourDe: pseudo, symboles: { [pseudo]: 'X' }, result: null
        };
        socket.join(gameId);
        sendLobbies(room);

        io.to(socket.id).emit("morpion_update", { status: 'waiting', gameId: gameId });
        syncGame(gameId);
    });

    socket.on("accept_morpion_challenge", ({ room, pseudo, gameId }) => {
        const game = games[gameId];
        if (!game || game.status !== 'waiting' || game.joueurs.includes(pseudo)) return;

        game.joueurs.push(pseudo);
        game.symboles[pseudo] = 'O';
        game.status = 'playing';
        socket.join(gameId);
        sendLobbies(room);

        io.to(gameId).emit("morpion_update", {
            status: 'playing',
            joueurs: game.joueurs,
            gameId: gameId
        });
        syncGame(gameId);
    });

    socket.on("play_game_morpion", ({ gameId, pseudo, index }) => {
        const game = games[gameId];
        if (!game || game.status !== 'playing') return;
        if (game.tourDe !== pseudo) return;
        if (game.plateau[index] !== null) return;

        game.plateau[index] = game.symboles[pseudo];

        const gagnantSymbole = calculateWinner(game.plateau);

        if (gagnantSymbole) {
            game.status = 'result';
            game.result = { winner: pseudo, message: `${pseudo} a gagné la partie ! 🏆` };

            io.to(gameId).emit("morpion_result", { winner: pseudo });

            syncGame(gameId);
            setTimeout(() => {
                io.to(gameId).emit("morpion_finished");
                delete games[gameId];
            }, 2000);

        } else if (!game.plateau.includes(null)) {

            game.status = 'result';
            game.result = { winner: null, message: "Match nul, grille pleine ! 🤝" };

            io.to(gameId).emit("morpion_result", { winner: null });

            syncGame(gameId);
            setTimeout(() => {
                io.to(gameId).emit("morpion_finished");
                delete games[gameId];
            }, 3000);
        } else {

            game.tourDe = game.joueurs.find(p => p !== pseudo);
            syncGame(gameId);
        }
    });
};