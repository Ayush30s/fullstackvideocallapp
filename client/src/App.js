import LobbyScreen from './screens/loby';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import RoomPage from './screens/room';

function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={ <LobbyScreen></LobbyScreen> }/>
        <Route path='/room/:roomId' element={ <RoomPage></RoomPage> }/>
      </Routes>
    </div>
  );
}

export default App;
