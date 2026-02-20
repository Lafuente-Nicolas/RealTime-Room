# Socket.IO

## 1. Introduction

Socket.IO est une bibliothèque permettant la communication temps réel
entre un client web et un serveur Node.js via WebSocket (avec fallback
HTTP long‑polling).

Elle est idéale pour : - chat en temps réel - notifications live - jeux
multijoueurs - dashboards temps réel

------------------------------------------------------------------------

## 2. Architecture du projet

Application composée de :

-   Frontend : React + Vite
-   Backend : Node.js + Express + Socket.IO
-   Reverse proxy : Nginx
-   Conteneurisation : Docker + Docker Compose

Schéma :

Client → Nginx → Front React\
Client → Socket.IO → API Node

------------------------------------------------------------------------

## 3. Installation

### Backend

``` bash
npm install express socket.io cors
```

### Frontend

``` bash
npm install socket.io-client
```

------------------------------------------------------------------------

## 4. Mise en place côté serveur

### index.js

``` js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("Utilisateur connecté :", socket.id);

  socket.on("join_room", ({ pseudo, room }) => {
    socket.join(room);
    socket.to(room).emit("user_joined", { pseudo });
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", {
      ...data,
      date: new Date()
    });
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté :", socket.id);
  });
});

server.listen(3000, () => console.log("API running on port 3000"));
```

------------------------------------------------------------------------

## 5. Mise en place côté client

### socket.js

``` js
import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL);
```

------------------------------------------------------------------------

### Utilisation dans un composant React

``` js
import { socket } from "./socket";

socket.emit("join_room", { pseudo, room });

socket.on("receive_message", (msg) => {
  console.log(msg);
});
```

------------------------------------------------------------------------

## 6. Rooms Socket.IO

Les rooms permettent d'isoler les messages par canal.

``` js
socket.join("room1");
io.to("room1").emit("message", "Hello");
```

Chaque utilisateur reçoit seulement les messages de sa room.

------------------------------------------------------------------------

## 7. Bonnes pratiques

-   Toujours supprimer les listeners dans `useEffect` cleanup
-   Envoyer des timestamps côté serveur
-   Gérer les déconnexions
-   Utiliser les rooms pour éviter les broadcasts globaux


