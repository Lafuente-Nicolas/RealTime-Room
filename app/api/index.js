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

    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecté :", socket.id);
    });
});