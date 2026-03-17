import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { playRound } from "../game-logic/game.js";

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

io.on("connection", (socket) => {
    console.log("Un utilisateur est connecté :", socket.id);

    socket.on("join_room", (data) => {
        const { pseudo, room } = data;
        socket.join(room);
        console.log(`${pseudo} a rejoint la room: ${room}`);
        socket.to(room).emit("user_joined", { pseudo });
    });

    socket.on("send_message", (data) => {
        const { room, pseudo, message } = data;
        const messageData = {
            pseudo,
            message,
            date: Date.now(),
        };

        io.to(room).emit("receive_message", messageData);
    });

    socket.on("play_game", (data) => {
        const { room, pseudo, coup } = data;

        if (!games[room]) {
            games[room] = {};
        }

        const game = games[room];

        if (!game.joueur1) {
            game.joueur1 = pseudo;
            game.coup1 = coup;
        }

        else if (game.joueur1 !== pseudo && !game.joueur2) {
            game.joueur2 = pseudo;
            game.coup2 = coup;

            const resultatJeu = playRound(game.coup1, game.coup2);

            let texteResultat = "Égalité ! 🤝";
            if (resultatJeu === 'Joueur 1 gagne') {
                texteResultat = `${game.joueur1} a gagné ! 🏆`;
            } else if (resultatJeu === 'Joueur 2 gagne') {
                texteResultat = `${game.joueur2} a gagné ! 🏆`;
            }

            io.to(room).emit("game_result", {
                joueur1: game.joueur1,
                coup1: game.coup1,
                joueur2: game.joueur2,
                coup2: game.coup2,
                resultat: texteResultat
            });

            delete games[room];
        }
    });

    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecté :", socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("API & Socket.io running on port", PORT);
});