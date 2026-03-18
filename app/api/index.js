import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { playRound } from "./src/games/rockPaperScissors.js";
import { playMove, calculateWinner } from "./src/games/morpion.js";
import { playMove as playP4Move, calculateWinner as calculateP4Winner } from "./src/games/puissance4.js";

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const games = {};
const morpionGames = {};
const p4Games = {};

io.on("connection", (socket) => {
    console.log("Un utilisateur est connecté :", socket.id);

    socket.on("join_room", (data) => {
        const { pseudo, room } = data;
        socket.join(room);
        socket.to(room).emit("user_joined", { pseudo });
    });

    socket.on("send_message", (data) => {
        const { room, pseudo, message } = data;
        io.to(room).emit("receive_message", {
            pseudo,
            message,
            date: Date.now(),
        });
    });

    socket.on("launch_game", (data) => {
        const { room, pseudo, jeu } = data;

        if (jeu === "Morpion") {
            if (!morpionGames[room]) {
                morpionGames[room] = {
                    plateau: Array(9).fill(null),
                    joueurX: pseudo,
                    joueurO: null,
                    tourDe: 'X'
                };
                io.to(room).emit("game_launched", { message: `📢 ${pseudo} a lancé un Morpion ! C'est à ${pseudo} (❌) de commencer.` });
            } else if (morpionGames[room].joueurX !== pseudo && !morpionGames[room].joueurO) {
                morpionGames[room].joueurO = pseudo;
                io.to(room).emit("game_launched", { message: `🤝 ${pseudo} a rejoint le Morpion ! Il jouera les (⭕).` });
            }
            io.to(room).emit("morpion_update", { plateau: morpionGames[room].plateau, message: null });
        }

        else if (jeu === "Puissance4") {
            if (!p4Games[room]) {
                p4Games[room] = {
                    plateau: Array(6).fill(null).map(() => Array(7).fill(null)),
                    joueurR: pseudo, // Rouge (R) commence
                    joueurJ: null,   // Jaune (J)
                    tourDe: 'R'
                };
                io.to(room).emit("game_launched", { message: `📢 ${pseudo} a lancé un Puissance 4 ! C'est à ${pseudo} (🔴) de commencer.` });
            } else if (p4Games[room].joueurR !== pseudo && !p4Games[room].joueurJ) {
                p4Games[room].joueurJ = pseudo;
                io.to(room).emit("game_launched", { message: `🤝 ${pseudo} a rejoint le Puissance 4 ! Il jouera les (🟡).` });
            }
            io.to(room).emit("p4_update", { plateau: p4Games[room].plateau, message: null });
        }

        else if (jeu === "Shifumi") {
            io.to(room).emit("game_launched", { message: `📢 ${pseudo} veut faire un Shifumi !` });
        }
    });

    socket.on("cancel_game", (data) => {
        const { room, pseudo, jeu } = data;

        if (jeu === "Morpion" && morpionGames[room]) {
            delete morpionGames[room];
            io.to(room).emit("game_cancelled", { message: `🛑 ${pseudo} a annulé la partie de Morpion.` });
        } else if (jeu === "Puissance4" && p4Games[room]) {
            delete p4Games[room];
            io.to(room).emit("game_cancelled", { message: `🛑 ${pseudo} a annulé la partie de Puissance 4.` });
        } else if (jeu === "Shifumi" && games[room]) {
            delete games[room];
            io.to(room).emit("game_cancelled", { message: `🛑 ${pseudo} a annulé la partie de Shifumi.` });
        }
    });

    socket.on("play_game", (data) => {
        const { room, pseudo, coup } = data;
        if (!games[room]) games[room] = {};
        const game = games[room];

        if (!game.joueur1) {
            game.joueur1 = pseudo;
            game.coup1 = coup;
            socket.to(room).emit("opponent_played", { pseudo: pseudo, jeu: "Shifumi" });
        } else if (game.joueur1 !== pseudo && !game.joueur2) {
            game.joueur2 = pseudo;
            game.coup2 = coup;

            const resultatJeu = playRound(game.coup1, game.coup2);
            let texteResultat = "Égalité ! 🤝";
            if (resultatJeu === 'Joueur 1 gagne') texteResultat = `${game.joueur1} a gagné ! 🏆`;
            else if (resultatJeu === 'Joueur 2 gagne') texteResultat = `${game.joueur2} a gagné ! 🏆`;

            io.to(room).emit("game_result", {
                joueur1: game.joueur1, coup1: game.coup1,
                joueur2: game.joueur2, coup2: game.coup2,
                resultat: texteResultat
            });
            delete games[room];
        }
    });

    socket.on("play_morpion", (data) => {
        const { room, pseudo, index } = data;
        if (!morpionGames[room]) return;

        const game = morpionGames[room];
        if (!game.joueurO && game.joueurX !== pseudo) game.joueurO = pseudo;

        let symboleActuel = null;
        if (game.joueurX === pseudo) symboleActuel = 'X';
        else if (game.joueurO === pseudo) symboleActuel = 'O';

        if (!symboleActuel || game.tourDe !== symboleActuel || game.plateau[index] !== null) return;

        game.plateau = playMove(game.plateau, index, symboleActuel);
        game.tourDe = game.tourDe === 'X' ? 'O' : 'X';

        const gagnant = calculateWinner(game.plateau);
        let messageFin = null;

        if (gagnant) {
            const pseudoGagnant = gagnant === 'X' ? game.joueurX : game.joueurO;
            messageFin = `${pseudoGagnant} a gagné la partie ! 🏆`;
        } else if (!game.plateau.includes(null)) {
            messageFin = "Match nul, la grille est pleine ! 🤝";
        }

        io.to(room).emit("morpion_update", { plateau: game.plateau, message: messageFin });
        if (messageFin) delete morpionGames[room];
    });

    socket.on("play_puissance4", (data) => {
        const { room, pseudo, index } = data;
        if (!p4Games[room]) return;

        const game = p4Games[room];

        // Assigner le joueur Jaune s'il n'est pas encore défini
        if (!game.joueurJ && game.joueurR !== pseudo) {
            game.joueurJ = pseudo;
        }

        // Déterminer le symbole ('R' ou 'J')
        let symboleActuel = null;
        if (game.joueurR === pseudo) symboleActuel = 'R';
        else if (game.joueurJ === pseudo) symboleActuel = 'J';

        // Sécurité des tours
        if (!symboleActuel || game.tourDe !== symboleActuel) return;

        // On sauvegarde l'ancienne grille pour voir si le coup est valide
        const ancienneGrille = game.plateau;
        game.plateau = playP4Move(game.plateau, index, symboleActuel);

        // Si la grille n'a pas changé (colonne pleine), on annule le coup
        if (ancienneGrille === game.plateau) return;

        // On change de tour
        game.tourDe = game.tourDe === 'R' ? 'J' : 'R';

        // On vérifie la victoire
        const gagnant = calculateP4Winner(game.plateau);
        let messageFin = null;

        if (gagnant) {
            const pseudoGagnant = gagnant === 'R' ? game.joueurR : game.joueurJ;
            messageFin = `${pseudoGagnant} a gagné la partie ! 🏆`;
        } else {
            // Vérifier s'il y a match nul 
            const grillePleine = game.plateau[0].every(caseHaut => caseHaut !== null);
            if (grillePleine) {
                messageFin = "Match nul, la grille est pleine ! 🤝";
            }
        }

        // On envoie la grille mise à jour
        io.to(room).emit("p4_update", { plateau: game.plateau, message: messageFin });

        // On nettoie si c'est fini
        if (messageFin) delete p4Games[room];
    });

    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecté :", socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("API & Socket.io running on port", PORT);
});