import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

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


io.on("connection", (socket) => {
    console.log("Un utilisateur est connecté :", socket.id);
    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecté :", socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("API & Socket.io running on port", PORT);
});