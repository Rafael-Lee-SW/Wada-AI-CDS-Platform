import axios from 'axios';

const instance = axios.create({
    // baseURL: 'https://i11a104.p.ssafy.io/api/',
    baseURL: 'http://localhost:8080/api/',
});

// 모델 추천 받기
function fetchModel(formData, sessionId) {
  return instance.post('/recommend', formData, {
    headers: {
      'sessionId': sessionId, 
      'Content-Type': 'multipart/form-data',
    },
  });
}

// 선택된 모델로 분석 요청
function createAnalyze(data) {
    return instance.post('/analyzeModel/', data, {
        headers: {
            'sessionId': sessionId, 
        }
    });
}

export {
    instance,
    fetchModel,
    createAnalyze
}