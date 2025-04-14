import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import VideoRoomPatient from './components/VideoRoom/VideoRoomPatient.js'
import VideoRoomPractitioner from './components/VideoRoom/VideoRoomPractitioner.js'



function App() {
  return (
      <Routes>
        <Route path="/videocall-practitioner/:encId/:appId" element={<VideoRoomPractitioner/>}/>
        <Route path="/videocall-patient/:appId" element={<VideoRoomPatient/>}/>
      </Routes>
  );
}

export default App;
