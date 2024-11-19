"use client"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChatWindow from './chat/components/ChatWindow'; 
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

export default function Home() {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const initSessionId = () => {
      const preSessionId = Cookies.get('sessionId');

      if (preSessionId) {
        setSessionId(preSessionId);
      } else {
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
        Cookies.set('sessionId', newSessionId, { expires: 1, path: '/' });
      }
    };

    initSessionId();
  }, []);

  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/" element={<ChatWindow sessionId={sessionId}/>} />
      </Routes>
    </Router>
  );
}
