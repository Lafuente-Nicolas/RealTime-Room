import { createDeck, distribuerCartes, peutJouerCarte } from "../games/uno.js";


// Met à jour la liste des tables d'attente pour tout le monde dans le salon
export const sendUnoLobbiesUpdate = (io, unoGames, room) => {
    const lobbies = Object.values(unoGames)
        .filter(g => g.mainRoom === room && g.status === 'waiting')
        .map(g => ({
            id: g.id,
            createur: g.createur,
            nbJoueursActuel: g.joueurs.length,
            maxJoueurs: g.maxJoueurs,
            variante: g.variante
        }));
    io.to(room).emit("lobbies_update", lobbies);
};

// Gère la reconnexion si un joueur actualise la page en pleine partie
export const handleUnoReconnection = (io, socket, unoGames, pseudo) => {
    for (const gameId in unoGames) {
        const game = unoGames[gameId];
        const indexJoueur = game.joueurs.indexOf(pseudo);

        if (indexJoueur !== -1) {
            game.sockets[indexJoueur] = socket.id;
            socket.join(gameId); // Rejoint le chat privé

            if (game.status === 'playing') {
                const opponentsInfo = game.joueurs
                    .filter(autre => pseudo !== autre)
                    .map(autre => ({ pseudo: autre, cartesRestantes: game.mains[autre].length }));

                io.to(socket.id).emit("uno_update", {
                    gameId: game.id, main: game.mains[pseudo], opponentsInfo,
                    carteAuMilieu: game.carteAuMilieu, couleurActive: game.couleurActive,
                    tourDe: game.tourDe, message: `🔄 Tu t'es reconnecté à la partie !`
                });
            }
        }
    }
};


export const registerUnoHandlers = (io, socket, unoGames) => {

    // Fonction interne sécurisée pour piocher
    const piocherCarteSecurise = (game) => {
        if (game.pioche.length === 0) {
            game.pioche = createDeck(); // En urgence si pioche vide
            console.log("⚠️ Pioche vide recréée pour la game", game.id);
        }
        return game.pioche.shift();
    };

    socket.on("get_uno_lobbies", ({ room }) => sendUnoLobbiesUpdate(io, unoGames, room));
    socket.on("create_uno_game", ({ room, pseudo, nbJoueurs, variante }) => {
        const gameId = "uno_" + Date.now();
        unoGames[gameId] = {
            id: gameId, mainRoom: room, createur: pseudo, status: 'waiting',
            joueurs: [pseudo], sockets: [socket.id], maxJoueurs: nbJoueurs || 4, variante: variante || 'officielle'
        };
        socket.join(gameId);

        io.to(room).emit("game_launched", { message: `📢 ${pseudo} a ouvert une table de UNO (${variante}) !` });
        sendUnoLobbiesUpdate(io, unoGames, room);
        io.to(socket.id).emit("uno_lobby_joined", { gameId, message: `⏳ En attente d'adversaires (1/${nbJoueurs})...` });
    });

    socket.on("join_uno_game", ({ room, pseudo, gameId }) => {
        const game = unoGames[gameId];
        if (!game || game.status !== 'waiting' || game.joueurs.includes(pseudo)) return;

        game.joueurs.push(pseudo);
        game.sockets.push(socket.id);
        socket.join(gameId);

        const nbActuel = game.joueurs.length;
        const max = game.maxJoueurs;

        io.to(gameId).emit("receive_message", { pseudo: "Système", message: `${pseudo} a rejoint la table ! (${nbActuel}/${max})`, date: Date.now() });
        sendUnoLobbiesUpdate(io, unoGames, room);

        if (nbActuel < max) {
            io.to(socket.id).emit("uno_lobby_joined", { gameId, message: `⏳ Tu as rejoint la table. En attente... (${nbActuel}/${max})` });
        } else {
            // La table est pleine, on lance la partie 
            game.status = 'playing';
            sendUnoLobbiesUpdate(io, unoGames, room);
            io.to(gameId).emit("game_launched", { message: `🚀 La table est complète ! Le UNO commence !` });

            const deck = createDeck();
            const donne = distribuerCartes(deck, game.joueurs);

            game.pioche = donne.pioche;
            game.mains = donne.mains;
            game.tourDe = game.joueurs[0];
            game.direction = 1;
            game.accumulationPlus = 0;

            let premiereCarte = piocherCarteSecurise(game);
            while (premiereCarte.couleur === 'noir') {
                game.pioche.push(premiereCarte);
                premiereCarte = piocherCarteSecurise(game);
            }
            game.carteAuMilieu = premiereCarte;
            game.couleurActive = premiereCarte.couleur;

            game.joueurs.forEach((joueurPseudo, index) => {
                const opponentsInfo = game.joueurs.filter(a => joueurPseudo !== a).map(a => ({ pseudo: a, cartesRestantes: game.mains[a].length }));
                io.to(game.sockets[index]).emit("uno_update", {
                    gameId: game.id, main: game.mains[joueurPseudo], opponentsInfo,
                    carteAuMilieu: game.carteAuMilieu, couleurActive: game.couleurActive,
                    tourDe: game.tourDe, message: `C'est à ${game.tourDe} de jouer !`
                });
            });
        }
    });

    socket.on("play_uno_card", ({ gameId, pseudo, index, couleurChoisie }) => {
        const game = unoGames[gameId];
        if (!game || game.tourDe !== pseudo) return;

        const mainDuJoueur = game.mains[pseudo];
        const carteJouee = mainDuJoueur[index];

        if (game.accumulationPlus > 0) {
            if (carteJouee.valeur !== '+2' && carteJouee.valeur !== '+4') return;
        } else if (!peutJouerCarte(carteJouee, game.carteAuMilieu, game.couleurActive)) {
            return;
        }

        mainDuJoueur.splice(index, 1);
        game.carteAuMilieu = carteJouee;
        game.couleurActive = carteJouee.couleur === 'noir' ? (couleurChoisie || 'rouge') : carteJouee.couleur;

        let skipNextPlayer = false;
        const nbJoueurs = game.joueurs.length;
        const getIndexCible = () => (game.joueurs.indexOf(pseudo) + game.direction + nbJoueurs) % nbJoueurs;

        if (carteJouee.valeur === 'inversion') {
            if (nbJoueurs === 2) skipNextPlayer = true;
            else game.direction *= -1;
        } else if (carteJouee.valeur === 'passer') {
            skipNextPlayer = true;
        } else if (carteJouee.valeur === '+2') {
            if (game.variante === 'baston') game.accumulationPlus = (game.accumulationPlus || 0) + 2;
            else {
                skipNextPlayer = true;
                const pseudoCible = game.joueurs[getIndexCible()];
                for (let i = 0; i < 2; i++) game.mains[pseudoCible].push(piocherCarteSecurise(game));
            }
        } else if (carteJouee.valeur === '+4') {
            if (game.variante === 'baston') game.accumulationPlus = (game.accumulationPlus || 0) + 4;
            else {
                skipNextPlayer = true;
                const pseudoCible = game.joueurs[getIndexCible()];
                for (let i = 0; i < 4; i++) game.mains[pseudoCible].push(piocherCarteSecurise(game));
            }
        }

        let steps = skipNextPlayer ? 2 : 1;
        game.tourDe = game.joueurs[(game.joueurs.indexOf(pseudo) + (game.direction * steps) + nbJoueurs * 2) % nbJoueurs];

        if (mainDuJoueur.length === 0) game.vainqueur = pseudo;

        let customMessage = `${pseudo} a joué un ${carteJouee.valeur} ! C'est à ${game.tourDe}.`;
        if (game.accumulationPlus > 0 && game.variante === 'baston') {
            customMessage = `⚔️ AÏE ! ${game.accumulationPlus} cartes accumulées ! À ${game.tourDe} de riposter ou piocher !`;
        }

        game.joueurs.forEach((joueurPseudo, i) => {
            const opponentsInfo = game.joueurs.filter(a => joueurPseudo !== a).map(a => ({ pseudo: a, cartesRestantes: game.mains[a].length }));
            io.to(game.sockets[i]).emit("uno_update", {
                gameId: game.id, main: game.mains[joueurPseudo], opponentsInfo,
                carteAuMilieu: game.carteAuMilieu, couleurActive: game.couleurActive,
                tourDe: game.tourDe, vainqueur: game.vainqueur,
                message: game.vainqueur ? `🏆 VICTOIRE de ${game.vainqueur} !` : customMessage
            });
        });
    });

    socket.on("draw_uno_card", ({ gameId, pseudo }) => {
        const game = unoGames[gameId];
        if (!game || game.tourDe !== pseudo) return;

        let nbCartesAPiocher = game.accumulationPlus > 0 ? game.accumulationPlus : 1;
        let messageAction = game.accumulationPlus > 0 ? `💥 BAM ! ${pseudo} a ramassé ${nbCartesAPiocher} cartes !` : `${pseudo} a pioché.`;

        game.accumulationPlus = 0;

        for (let i = 0; i < nbCartesAPiocher; i++) {
            game.mains[pseudo].push(piocherCarteSecurise(game));
        }

        game.tourDe = game.joueurs[(game.joueurs.indexOf(pseudo) + game.direction + game.joueurs.length) % game.joueurs.length];

        game.joueurs.forEach((joueurPseudo, i) => {
            const opponentsInfo = game.joueurs.filter(a => joueurPseudo !== a).map(a => ({ pseudo: a, cartesRestantes: game.mains[a].length }));
            io.to(game.sockets[i]).emit("uno_update", {
                gameId: game.id, main: game.mains[joueurPseudo], opponentsInfo,
                carteAuMilieu: game.carteAuMilieu, couleurActive: game.couleurActive,
                tourDe: game.tourDe, message: `${messageAction} C'est à ${game.tourDe}.`
            });
        });
    });

    socket.on("leave_uno_game", ({ gameId, pseudo, room }) => {
        const game = unoGames[gameId];
        if (!game) return;

        socket.leave(gameId);

        if (game.status === 'waiting') {
            const index = game.joueurs.indexOf(pseudo);
            if (index > -1) {
                game.joueurs.splice(index, 1);
                game.sockets.splice(index, 1);
            }
            if (game.createur === pseudo || game.joueurs.length === 0) {
                delete unoGames[gameId];
                io.to(room).emit("receive_message", { pseudo: "Système", message: `La table de ${pseudo} a été annulée.`, date: Date.now() });
            } else {
                io.to(gameId).emit("receive_message", { pseudo: "Système", message: `${pseudo} a quitté la table d'attente.`, date: Date.now() });
            }
            sendUnoLobbiesUpdate(io, unoGames, room);
        } else if (game.vainqueur) {
            delete unoGames[gameId];
            sendUnoLobbiesUpdate(io, unoGames, room);
        }
    });
};