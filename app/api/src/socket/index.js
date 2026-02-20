import { Server } from "socket.io";

function isValidString(str, min, max) {
    return typeof str === "string" && str.length >= min && str.length <= max;
}

export function initSocket(server) {
    const io = new Server(server, {
        cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
        console.log("Client connecté :", socket.id);

        socket.on("join_room", ({ room, pseudo }) => {
            if (!isValidString(pseudo, 2, 20)) return;
            if (!isValidString(room, 1, 20)) return;

            socket.join(room);
            socket.to(room).emit("user_joined", { pseudo });
        });

        socket.on("send_message", ({ room, pseudo, message }) => {
            if (!isValidString(pseudo, 2, 20)) return;
            if (!isValidString(room, 1, 20)) return;
            if (!isValidString(message, 1, 300)) return;

            io.to(room).emit("receive_message", {
                pseudo,
                message,
                date: new Date().toISOString()
            });
        });

        socket.on("disconnect", () => {
            console.log("Client déconnecté :", socket.id);
        });
    });
}
