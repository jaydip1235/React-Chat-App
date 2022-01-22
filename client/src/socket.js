import { io } from "socket.io-client";

const URL = "/";

const socket = io(URL, {
  path: "/socket.io",
  reconnection: false,
});

export default socket;