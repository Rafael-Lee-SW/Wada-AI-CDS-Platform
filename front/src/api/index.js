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

// 새로운 요청사항
function fetchNewModel(data, sessionId) {
  return instance.post('/recommend/alternative', data, {
    headers: {
      'sessionId': sessionId
    },
  });
}

// 선택된 모델로 분석 요청
function createAnalyze(data, sessionId) {
    return instance.post('/analyzeModel', data, {
        headers: {
            'sessionId': sessionId, 
        }
    });
}

// 선택하지 않은 모델 불러오기
function fetchOtherModel(data, sessionId) {
    return instance.post('/recommend/again', data, {
      headers: {
        'sessionId': sessionId,
        'Content-Type': 'application/json',
      },
  });
}

// 보고서 기반 채팅
function createConversation(data, sessionId) {
  return instance.post('/analyzeModel/conversation', data, {
    headers: {
      'sessionId': sessionId
    }
  });
}

export {
    instance,
    fetchChatList,
    fetchChatRoom,
    fetchModel,
    fetchNewModel,
    createAnalyze,
    fetchOtherModel,
    createConversation
}