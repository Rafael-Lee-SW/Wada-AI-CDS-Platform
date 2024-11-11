import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://k11a104.p.ssafy.io/api/',
    // baseURL: 'http://localhost:8080/api/',
});

// 대화 기록 불러오기
function fetchChatList(sessionId) {
  return instance.get('/history/all', {
    headers: {
      'sessionId': sessionId 
    }
  })
}

// 채팅방 조회
function fetchChatRoom(chatRoomId, sessionId) {
  return instance.get(`/history?chatRoomId=${chatRoomId}`, {
    headers: {
      'sessionId': sessionId,
    }
  })
}

// 모델 추천 받기
function fetchModel(formData, sessionId) {
  return instance.post('/recommend', formData, {
    headers: {
      'sessionId': sessionId, 
    },
  });
}

// 선택된 모델로 분석 요청
function createAnalyze(jsonData, sessionId) {
    return instance.post('/analyzeModel', jsonData, {
        headers: {
            'sessionId': sessionId, 
        }
    });
}

export {
    instance,
    fetchChatList,
    fetchChatRoom,
    fetchModel,
    createAnalyze
}