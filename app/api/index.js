import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { registerUnoHandlers, handleUnoReconnection, sendUnoLobbiesUpdate } from "./src/socket/unoHandlers.js";
import { registerMorpionHandlers } from "./src/socket/morpionHandlers.js";
import { registerPuissance4Handlers } from "./src/socket/puissance4Handlers.js";
import { registerShifumiHandlers } from "./src/socket/shifumiHandlers.js";

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Route de test pour vérifier que l'API tourne
app.get("/health", (req, res) => { res.json({ status: "ok" }); });


const games = {};
const morpionGames = {};
const p4Games = {};
const unoGames = {};


io.on("connection", (socket) => {
    console.log("🟢 Un utilisateur est connecté :", socket.id);

    // Rejoindre le salon principal
    socket.on("join_room", ({ pseudo, room }) => {
        socket.join(room);

        // On délègue la vérification de reconnexion au gestionnaire UNO
        handleUnoReconnection(io, socket, unoGames, pseudo);

        socket.to(room).emit("user_joined", { pseudo });

        // On rafraîchit la liste des tables de UNO pour le nouveau venu
        sendUnoLobbiesUpdate(io, unoGames, room);
    });

    // Envoyer un message dans le chat
    socket.on("send_message", ({ targetRoom, pseudo, message }) => {
        io.to(targetRoom).emit("receive_message", { pseudo, message, date: Date.now() });
    });

    socket.on("cancel_game", ({ room, pseudo, jeu }) => {
        if (jeu === "Morpion" && morpionGames[room]) delete morpionGames[room];
        else if (jeu === "Puissance4" && p4Games[room]) delete p4Games[room];
        else if (jeu === "Shifumi" && games[room]) delete games[room];

        io.to(room).emit("game_cancelled", { message: `🛑 ${pseudo} a annulé la partie de ${jeu}.` });
    });

    // On passe le relais aux fichiers spécialisés pour chaque jeu
    registerUnoHandlers(io, socket, unoGames);
    registerMorpionHandlers(io, socket, morpionGames);
    registerPuissance4Handlers(io, socket, p4Games);
    registerShifumiHandlers(io, socket, games);

    socket.on("disconnect", () => {
        console.log("🔴 Un utilisateur s'est déconnecté :", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 API & Socket.io running on port ${PORT}`);
});