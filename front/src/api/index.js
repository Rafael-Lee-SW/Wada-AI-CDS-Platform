import axios from 'axios';

const instance = axios.create({
    baseURL: 'https://k11a104.p.ssafy.io/api/',
});

// 대화 기록 불러오기
function fetchChatList(sessionId) {
  return instance.get('/', {
    headers: {
      'sessionId': sessionId 
    }
  })
}

// 채팅방 조회
function fetchChatRoom(sessionId, data) {
  return instance.get('/chatrooms', data, {
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
function createAnalyze(data, sessionId) {
    return instance.post('/analyze-model', data, {
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