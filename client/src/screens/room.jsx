import React, { useEffect, useCallback, useState } from "react";
import { useSocket } from "../context/socketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketID] = useState();
  const [mystream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [MuteVideo, setMuteVideo] = useState(false);
  const [MuteAudio, setMuteAudio] = useState(false);
  const [onCall, setOnCall] = useState(false);

  const handleUserJoined = useCallback(({ email, id }) => {
    setRemoteSocketID(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    // to call a user first on the video
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    // get the offer and send it to the next user
    const offer = await peer.getOffer();

    // send the offer to the next user
    socket.emit("user:call", { to: remoteSocketId, offer });

    // now i have strem set the stream
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    //getting the socketid and offer from of the main user
    async ({ from, offer }) => {
      setRemoteSocketID(from);

      //get my stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      //set stream to mystream to show in mystream
      setMyStream(stream);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    setOnCall(!onCall)
    for (const track of mystream.getTracks()) {
      peer.peer.addTrack(track, mystream);
    }
  }, [mystream]);

  //getting the user socket id that accepted the call and send its ans
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
    // Filter out the video track from the stream
    const videoTrack = mystream
      .getTracks()
      .find((track) => track.kind === "video");

    // Check if videoTrack exists (to avoid errors if no video track is present)
    if (videoTrack) {
      // Toggle the enabled property of the video track
      if (videoTrack.enabled) {
        videoTrack.enabled = false;
        setMuteVideo(true);
      } else {
        videoTrack.enabled = true;
        setMuteVideo(false);
      }
    } else {
      console.error("No video track found in the stream.");
    }
  };

  const handleAudioToggle = () => {
    // Filter out the video track from the stream
    const AudioTrack = mystream
      .getTracks()
      .find((track) => track.kind === "audio");

    // Check if videoTrack exists (to avoid errors if no video track is present)
    if (AudioTrack) {
      // Toggle the enabled property of the video track
      if (AudioTrack.enabled) {
        AudioTrack.enabled = false;
        setMuteAudio(true);
      } else {
        AudioTrack.enabled = true;
        setMuteAudio(false);
      }
    } else {
      console.error("No video track found in the stream.");
    }
  };

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("Got Tracks!!!");
      setRemoteStream(remoteStream[0]);
    });
  });

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
          Send Stream
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
          onClick={handleCallUser}
        >
          {onCall ? "End" : "Call"}
        </button>
      )}

      {mystream && (
        <div className="flex space-x-4 my-5">
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
      )}

      {mystream && (
        <div className="my-8">
          <h1 className="text-xl text-teal-300 mb-2">My Stream</h1>
          <div className="rounded-lg overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105">
            <ReactPlayer playing height="300px" width="300px" url={mystream} />
          </div>
        </div>
      )}

      {remoteStream ? (
        <div className="my-8">
          <h1 className="text-xl text-yellow-300 mb-2">Remote Stream</h1>
          <div className="rounded-lg overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105">
            <ReactPlayer
              playing
              height="300px"
              width="300px"
              url={remoteStream}
            />
          </div>
        </div>
      ) : (
        console.log("No remote stream")
      )}
    </div>
  );
};

export default RoomPage;
