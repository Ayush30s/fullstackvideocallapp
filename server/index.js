const { Server } = require("socket.io");
const io = new Server(8000, {
  cors: true,
});

const emailtoSocketMap = new Map();
const sockettoEmailMap = new Map();

io.on("connection", (socket) => {
  console.log("new connection", socket.id);

  socket.on("join:room", (data) => {
    const { email, room } = data;

    emailtoSocketMap.set(email, socket.id);
    sockettoEmailMap.set(socket.id, email);

    //if there already exists a user in the room send a message "user:joined" event with data of new user
    io.to(room).emit("user:joined", { email, id: socket.id });

    //make the new user join that room
    socket.join(room);

    io.to(socket.id).emit("join:room", data);
  });

  //on getting the offer from the main user , send the offer to the next user with the socket id of the main user
  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});
