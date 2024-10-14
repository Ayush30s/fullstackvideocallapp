import React, { useEffect, useCallback, useState } from "react";
import { useSocket } from "../context/socketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useNavigate } from "react-router-dom";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketID] = useState();
  const [mystream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState(null);
  const [MuteVideo, setMuteVideo] = useState(false);
  const [MuteAudio, setMuteAudio] = useState(false);
  const [onCall, setOnCall] = useState(false);

  const navigate = useNavigate();
  const handleUserJoined = useCallback(({ email, id }) => {
    setRemoteSocketID(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketID(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    setOnCall(!onCall);
    for (const track of mystream.getTracks()) {
      peer.peer.addTrack(track, mystream);
    }
  }, [mystream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      setOnCall(!onCall);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleIncomingNego = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  const handleVideoToggle = () => {
    const videoTrack = mystream
      .getTracks()
      .find((track) => track.kind === "video");

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setMuteVideo(!videoTrack.enabled);
    }
  };

  const handleEndCall = async () => {
    await peer.closeConnection(mystream);
    navigate("/");
  };

  const handleAudioToggle = () => {
    const AudioTrack = mystream
      .getTracks()
      .find((track) => track.kind === "audio");

    if (AudioTrack) {
      AudioTrack.enabled = !AudioTrack.enabled;
      setMuteAudio(!AudioTrack.enabled);
    }
  };

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      if (remoteStream[0]) setRemoteStream(remoteStream[0]);
    });
  }, [mystream]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleIncomingNego);
    socket.on("peer:nego:final", handleNegoFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleIncomingNego);
      socket.off("peer:nego:final", handleNegoFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleIncomingNego,
    handleNegoFinal,
  ]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-r from-blue-500 via-teal-500 to-purple-500 p-10 text-white">
      <h1 className="text-4xl font-extrabold m-5 animate-pulse transition-all duration-500">
        Room Page
      </h1>

      {mystream && (
        <button
          onClick={sendStreams}
          className="px-6 py-3 bg-teal-600 rounded-lg shadow-lg hover:bg-teal-700 transition-all duration-300 transform hover:scale-105"
        >
          {onCall ? "Streaming..." : "Share Screen"}
        </button>
      )}

      <h1
        className={`text-3xl font-semibold m-5 transition-all duration-300 ${
          remoteSocketId ? "text-green-500" : "text-red-600"
        }`}
      >
        {remoteSocketId ? "Connected" : "No one in room"}
      </h1>

      {remoteSocketId && (
        <button
          className="px-6 py-3 mt-4 bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
          onClick={onCall ? handleEndCall : handleCallUser}
        >
          {onCall ? "End" : "Call"}
        </button>
      )}

      <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6 my-8">
        {mystream && (
          <div className="w-full lg:w-1/2 flex flex-col items-center">
            <h1 className="text-xl text-teal-300 mb-2">My Stream</h1>
            <div className="rounded-lg overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105">
              <ReactPlayer playing height="300px" width="100%" url={mystream} />
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                onClick={handleVideoToggle}
                className="px-4 py-2 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
              >
                {MuteVideo ? "Unmute Video" : "Mute Video"}
              </button>

              <button
                onClick={handleAudioToggle}
                className="px-4 py-2 bg-red-600 rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
              >
                {MuteAudio ? "Unmute Audio" : "Mute Audio"}
              </button>
            </div>
          </div>
        )}

        {remoteStream ? (
          <div className="w-full lg:w-1/2 flex flex-col items-center">
            <h1 className="text-xl text-yellow-300 mb-2">Remote Stream</h1>
            <div className="rounded-lg overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105">
              <ReactPlayer
                playing
                height="300px"
                width="100%"
                url={remoteStream}
              />
            </div>
          </div>
        ) : (
          <div className="m-auto text-3xl font-bold">
            User is Not Connected!
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
