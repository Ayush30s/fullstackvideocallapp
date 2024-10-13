import React, { useCallback, useState, useEffect } from "react";
import { useSocket } from "../context/socketProvider";
import { useNavigate } from "react-router-dom";

const LobbyScreen = () => {
  const [email, setEmail] = useState("test@gmail.com");
  const [room, setRoom] = useState("1");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (event) => {
      event.preventDefault();
      socket.emit("join:room", {
        email,
        room,
      });
    },
    [email, room, socket]
  );
  
  //room join response from backend
  const handleJoinRoom = useCallback((data) => {
    const { email, room } = data;
    navigate(`/room/${room}`);
  }, []);

  useEffect(() => {
    //room join response from backend
    socket.on("join:room", handleJoinRoom);
    return () => {
      socket.off("join:room", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-r from-blue-500 via-teal-500 to-purple-500 p-10 text-white">
      <h1 className="text-5xl font-extrabold p-4 m-5 animate-pulse">
        Welcome to Lobby
      </h1>

      <form
        className="flex flex-col justify-center items-center bg-white p-8 rounded-lg shadow-xl transform transition-all duration-500 hover:scale-105"
        onSubmit={handleSubmitForm}
      >
        <label className="text-xl font-semibold text-gray-800">Email ID</label>
        <input
          className="border-2 border-gray-400 rounded-lg outline-none m-3 p-2 text-gray-800 focus:border-teal-400 transition-all duration-300"
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="text-xl font-semibold text-gray-800">
          Room Number
        </label>
        <input
          className="border-2 border-gray-400 rounded-lg outline-none m-3 p-2 text-gray-800 focus:border-teal-400 transition-all duration-300"
          type="number"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          required
        />

        <button
          type="submit"
          className="mt-5 px-6 py-3 bg-indigo-600 rounded-lg shadow-lg text-white font-semibold hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
        >
          Join
        </button>
      </form>
    </div>
  );
};

export default LobbyScreen;
