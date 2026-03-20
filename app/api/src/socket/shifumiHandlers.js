import { playRound } from "../games/rockPaperScissors.js";

export const registerShifumiHandlers = (io, socket, games) => {

    const sendLobbies = (room) => {
        const lobbies = Object.values(games)
            .filter(g => g.mainRoom === room && g.type === 'Shifumi' && g.status === 'waiting')
            .map(g => ({ id: g.id, createur: g.createur }));
        io.to(room).emit("shifumi_lobbies_update", lobbies);
    };

    const syncGame = (gameId) => {
        const game = games[gameId];
        if (game) io.to(gameId).emit("shifumi_sync", game);
    };

    socket.on("get_shifumi_lobbies", ({ room }) => sendLobbies(room));

    socket.on("cancel_shifumi_challenge", ({ room, pseudo }) => {
        const gameId = Object.keys(games).find(id =>
            games[id].mainRoom === room && games[id].type === 'Shifumi' && games[id].joueurs.includes(pseudo)
        );

        if (gameId) {
            const game = games[gameId];
            if (game.status === 'playing') {
                const winnerPseudo = game.joueurs.find(p => p !== pseudo);
                game.status = 'result';
                game.result = {
                    p1_pseudo: game.joueurs[0], p1_coup: 'abandon',
                    p2_pseudo: game.joueurs[1] || 'Personne', p2_coup: 'abandon',
                    winner: winnerPseudo,
                    message: `${pseudo} a fui le combat !` 
                };

                io.to(gameId).emit("shifumi_result", { winner: winnerPseudo });

                syncGame(gameId);
                setTimeout(() => {
                    io.to(gameId).emit("shifumi_finished");
                    delete games[gameId];
                    sendLobbies(room);
                }, 3000);
            } else {
                delete games[gameId];
                sendLobbies(room);
            }
        }
    });

    socket.on("create_shifumi_challenge", ({ room, pseudo }) => {
        const gameId = "shifumi_" + Date.now();
        games[gameId] = {
            id: gameId, mainRoom: room, type: 'Shifumi', createur: pseudo,
            status: 'waiting', joueurs: [pseudo], sockets: [socket.id], coups: {}, result: null
        };
        socket.join(gameId);
        sendLobbies(room);

        io.to(socket.id).emit("shifumi_update", { status: 'waiting', gameId: gameId });
        syncGame(gameId);
    });

    socket.on("accept_shifumi_challenge", ({ room, pseudo, gameId }) => {
        const game = games[gameId];
        if (!game || game.status !== 'waiting' || game.joueurs.includes(pseudo)) return;

        game.joueurs.push(pseudo);
        game.sockets.push(socket.id);
        socket.join(gameId);
        game.status = 'playing';

        sendLobbies(room);

        io.to(gameId).emit("shifumi_update", { status: 'playing', gameId: gameId });
        syncGame(gameId);
    });

    socket.on("play_game_shifumi", ({ gameId, pseudo, coup }) => {
        const game = games[gameId];
        if (!game || game.status !== 'playing') return;

        game.coups[pseudo] = coup;
        syncGame(gameId);

        if (Object.keys(game.coups).length === 2) {
            const p1 = game.joueurs[0];
            const p2 = game.joueurs[1];
            const res = playRound(game.coups[p1], game.coups[p2]);

            let winner = null;
            if (res === 'Joueur 1 gagne') winner = p1;
            else if (res === 'Joueur 2 gagne') winner = p2;

            game.result = {
                p1_pseudo: p1, p1_coup: game.coups[p1],
                p2_pseudo: p2, p2_coup: game.coups[p2],
                winner: winner,
                message: res === 'Egalité' ? "Match nul" : `${winner} gagne la manche`
            };

            io.to(gameId).emit("shifumi_result", { winner: winner });

            setTimeout(() => {
                game.status = 'result';
                syncGame(gameId);
            }, 1000);

            setTimeout(() => {
                io.to(gameId).emit("shifumi_finished");
                delete games[gameId];
            }, 2000);
        }
    });
};