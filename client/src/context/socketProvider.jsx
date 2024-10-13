import React, { createContext, useContext, useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

//this function will fetch the data inside the SocketContext
export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider = (props) => {
  //using usememo so that the socket don not initializes again and again
  const socket = useMemo(() => io("localhost:8000"), []);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};