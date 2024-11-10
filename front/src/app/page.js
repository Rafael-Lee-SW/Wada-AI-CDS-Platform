"use client"

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
        // 기존 세션 ID가 있으면 그대로 사용
        setSessionId(preSessionId);
        console.log('기존 세션 ID:', preSessionId);
      } else {
        // 세션 ID가 없으면 새로 UUID 생성
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
        Cookies.set('sessionId', newSessionId, { expires: 1, path: '/' });
        console.log('새 세션 ID가 생성되었습니다:', newSessionId);
      }
    };

    initSessionId();
  }, []);

  return (
    <div>
      <ChatWindow sessionId={sessionId}/> 
    </div>
  );
}
