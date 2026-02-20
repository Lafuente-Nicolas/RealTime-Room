import http from "http";
import app from "./app.js";
import { initSocket } from "./socket/index.js";

const server = http.createServer(app);

initSocket(server);

server.listen(process.env.PORT || 3000, () => {
    console.log("API running");
});
