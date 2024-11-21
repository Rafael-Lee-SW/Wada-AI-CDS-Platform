
# 말하는 Da(이터)로 : 누구나 AI 모델을 사용할 수 있는 CDS 플랫폼 서비스

<img src="/READMEfile/unmanndestore.jpeg" alt="AUTOSTORE Image" width="1000">


<br>

- 배포 URL :https://k11a104.p.ssafy.io/
- Test ID : 비로그인 방식

<br>

## 주요 요소

### 📷 LLM을 활용한 모델 추천 및 데이터 정제


### 📑 ML을 활용한 사용자 파일 분석


<br>

# 📌 말하는 Da(이터)로 프로젝트 소개

**말하는 Da(이터)로**는 도메인 전문가들이 데이터를 분석하고 시각화하여 효과적으로 의사결정을 내릴 수 있도록 지원하는 웹 플랫폼입니다.  
아래와 같은 주요 기능을 제공합니다:

*   **데이터 업로드**: CSV 파일을 간단히 업로드하여 분석을 요청할 수 있습니다.
*   **자동화 분석**: 업로드된 데이터를 자동으로 분석하고 예측 수행.
*   **프롬프트 기능**: 사용자 지정 분석 요청을 위한 인터페이스 제공.
*   **결과 시각화**: 분석 결과를 그래프와 차트로 제공하여 명확한 인사이트를 제공합니다.
*   **PDF 다운로드**: 분석 결과를 PDF로 저장하여 분석결과를 보고하기 쉽게 서비스합니다..

# 🤖 AI 기술
 
### 📈 CSV/Excel 데이터 분석 및 모델 추천
*   업로드된 데이터를 자동 분석하여 최적의 머신러닝 모델을 추천합니다.
*   GPT API와 연동하여 각 데이터에 적합한 모델을 평가하고 추천하며, 사용자는 추천된 모델 중에서 직접 선택할 수 있습니다.
*   **FastAPI**와 **Ray**를 활용하여 대규모 데이터를 빠르게 처리합니다.

### 🧠 자동화된 데이터 분석 및 예측
*   선택된 모델을 통해 데이터 분석을 수행하고, 머신러닝 결과를 사용자에게 제공합니다.
*   예측 모델은 지속적으로 학습하며 분석 정확도를 점차 향상시킵니다.
*   주요 변수와 상관관계를 시각화하여 사용자에게 명확한 결과를 전달합니다.

### 📊 데이터 시각화 및 대시보드 제공
*   분석 결과를 시각화하여 데이터를 직관적으로 이해할 수 있도록 돕습니다.
*   주요 분석 결과는 대시보드 형태로 제공되어, 사용자가 한눈에 인사이트를 확인할 수 있습니다.
*   결과는 PDF로 저장 가능하며, 필요 시 이메일로 공유 가능합니다.

### 🔍 AI 모델 학습 및 확장
* **FastAPI**, **Ray Serve**를 활용하여 머신러닝 및 딥러닝 모델을 효율적으로 통합하고 배포합니다.
* 업로드된 데이터를 기반으로 적합한 AI 모델을 학습시키고, 결과를 실시간으로 제공합니다.
* 확장 가능한 아키텍처를 통해 추가적인 분석 모델 및 데이터 처리를 지원합니다.

# 🔧 기타 주요 기능

### 📋 데이터 관리 및 처리
*   사용자 요청에 따라 데이터를 MongoDB에 저장 및 관리하며, 처리 속도를 최적화합니다.
*   분석 진행 상태를 추적하고, 사용자는 언제든지 이전 분석 결과를 확인할 수 있습니다.

### 📤 데이터 결과 공유
*   분석 완료 후, 결과를 PDF로 다운로드하여 팀원들과 공유할 수 있습니다.
*   대시보드 기능을 통해 실시간 데이터 상태와 결과를 확인 가능합니다.

# 💡 말하는 Da(이터)로의 장점
*   **사용자 친화적**: 비전문가도 데이터를 쉽게 업로드하고 분석할 수 있는 환경 제공.
*   **자동화된 분석**: AI를 통해 데이터 분석 과정을 간소화하여 빠른 결과 제공.
*   **확장 가능성**: 다양한 데이터와 분석 모델을 통합할 수 있는 유연한 아키텍처.
*   **정량적 의사결정 지원**: 데이터를 기반으로 명확하고 실용적인 비즈니스 인사이트 제공.


# 💎 말하는 Da(이터)로의 가치

- **저비용**: 데이터를 분석하고 시각화하는 데 필요한 복잡한 프로세스를 자동화하여 비용을 절감합니다. 사용자는 고가의 데이터 분석 툴 없이도 효과적인 머신러닝 모델을 활용하여 데이터를 분석할 수 있습니다. 

- **안전성**: 업로드된 데이터를 기반으로 비즈니스 이상 현상을 감지하고, 모델 분석 결과를 통해 위험 요소를 사전에 예측할 수 있습니다. 데이터 보안을 강화하고 분석 결과를 안전하게 저장 및 공유할 수 있는 환경을 제공합니다.

- **예측성**: 과거 데이터를 분석하여 미래의 트렌드와 패턴을 예측합니다. AI 모델을 활용해 비즈니스 성장, 재고 관리, 또는 고객 행동 예측 등 다양한 도메인에 대한 실질적인 인사이트를 제공합니다.

- **편리성**: 비전문가도 사용 가능한 직관적인 UI를 통해 데이터 업로드와 분석 요청이 가능하며, 분석 결과는 PDF로 다운로드하거나 이메일로 공유할 수 있습니다. 또한, 웹 기반 플랫폼을 통해 사용자는 어디서든 데이터 분석 결과를 확인할 수 있습니다.

- **효율성**: FastAPI, Ray Serve를 활용한 빠르고 안정적인 AI 분석 처리로 데이터를 효율적으로 분석합니다. 각 모델은 도메인 전문가의 요구에 맞게 추천되어, 비즈니스에 가장 적합한 분석 결과를 제공합니다.

- **확장성**: 사용자의 필요에 따라 모델과 데이터를 확장할 수 있는 유연한 아키텍처로 설계되었습니다. 추가적인 데이터셋이나 새로운 분석 모델을 손쉽게 통합하여 비즈니스의 지속적인 성장과 확장을 지원합니다.

- **사용자 친화적**: 간단한 프롬프트를 통해 원하는 분석 결과를 요청할 수 있으며, 데이터 시각화를 통해 복잡한 결과를 쉽게 이해할 수 있습니다. 모든 결과는 직관적으로 표현되어 데이터 기반 의사결정에 도움을 줍니다.



<br>

# 👥 팀 소개

<table align="center">
  <tr>
    <tr align="center">
        <td style="min-width: 250px;">
            <a href="https://github.com/yuseok01">
              <b>김유석</b>
            </a>
        </td>
        <td style="min-width: 250px;">
            <a href="https://github.com/solmysoul1">
              <b>이한솔</b>
            </a>
        </td>
        <td style="min-width: 250px;">
            <a href="https://github.com/Rafael-Lee-SW">
              <b>이수완</b>
            </a>
        </td>
    </tr>
    <tr align="center">
        <td style="min-width: 250px;">
              <img src="/READMEfile/yuseok.jpg" width="100">
        </td>
        <td style="min-width: 250px;">
              <img src="/READMEfile/hansol.jpg" width="100">
        </td>
        <td style="min-width: 250px;">
              <img src="/READMEfile/soowan.jpg" width="100">
        </td>
    </tr>
    <tr align="center">
        <td>
        <b>Team Leader</b><b><br/>Backend<br></b>모델 추천 데이터 전송,<br/> MongoDB Control
        </td>
        <td>
        <b>Backend</b><br/> <b>Frontend</b><br/>웹 사이트 디자인 총괄<br/>User Service 구현<br/>
        </td>
        <td>
        <b>Frontend </b><br/> <b>Project Manager </b><br/>ML 모델 학습 및 배포<br/>웹앱 구축 및 UX/UI 구현 및 개선 <br/>발표 및 영상<br/>
        </td>
    </tr>
  <tr>
    <tr align="center">
        <td style="min-width: 250px;">
           <a href="https://github.com/seoyoung059">
              <b>문재성</b>
            </a>
        </td>
        <td style="min-width: 250px;">
            <a href="https://github.com/pv104">
              <b>정지환</b>
            </a>
        </td>
        <td style="min-width: 250px;">
           <a href="https://github.com/whereisawedhii">
              <b>오승진</b>
            </a>
        </td>
    </tr>
    <tr align="center">
        <td style="min-width: 250px;">
              <img src="/READMEfile/moon.jpg" width="100">
        </td>
        <td style="min-width: 250px;">
              <img src="/READMEfile/Jihwan.jpg" width="100">
        </td>
        <td style="min-width: 250px;">
               <img src="/READMEfile/Seungjin.jpg" width="100">
        </td>
    </tr>
    <tr align="center">
        <td>
        <b> Prompt Engineer <br/> ML/DL Deployment & QA </b><br/>LLM Prompt 생성 및 모델 검증,<br/> 모델 서버 배포 <br/>비즈니스 로직 구현<br/>
        </td>
        <td>
        <b>Backend</b><br/><b>Model Recommand </b><br/> Backend 환경 구축 <br/>모델 추천 서비스 구현<br/>모니터링 구축 <br/>
        </td>
        <td>
        <b>AI Leader</b><br/><b>Frontend </b><br/>CI/CD 및 배포환경 구축<br/> 방범 영상 페이지 및 알람 기능 구현<br/>
        </td>
    </tr>
</table>

# ⏱ 개발 기간

- 2024-10-14 ~ 2024-11-19 (5주)
<br>

# 📅 개선 일지
### 2024년 10월 14일  
- **백엔드 데이터 전송 최적화**  


- **파일 파싱 문제 해결 (UTF-8 한글 인코딩)**  
  - 파일 업로드 시 EUC-KR로 저장된 한글 데이터가 깨지는 문제를 해결하기 위해 UTF-8로 자동 변환하는 모듈 추가.  
  - CSV 파싱 시 특수 문자가 포함된 경우 데이터 손실이 발생하지 않도록 정규화 처리 로직 적용.  

---

### 2024년 10월 17일  
- **프론트엔드 그래프 렌더링 문제 해결**  
  - Next.js에서 데이터 시각화 시 큰 데이터셋을 처리할 때 발생하던 렌더링 지연 문제를 해결.  
  - `dynamic import`와 `lazy loading`을 활용하여 초기 렌더링 속도를 개선하고, 클라이언트 측에서 필요한 데이터만 로드하도록 수정.  
  - 그래프 라이브러리에서 발생하던 메모리 누수 문제를 해결하고 브라우저 호환성을 강화.  

---

### 2024년 10월 20일  
- **FastAPI 모델 학습 및 결과 반환 개선**  
  - **모델 학습 단계**:  
    - 데이터 전처리 과정에서 Null 값 처리 로직 추가.  
    - 학습 도중 발생하는 에러를 최소화하기 위해 파라미터 튜닝 자동화 도입.  
  - **결과 반환 단계**:  
    - 모델 결과 JSON 포맷의 표준화로 API 응답 처리 속도 20% 개선.  
    - 결과 데이터의 중복 전달 문제를 해결하기 위해 캐시 로직 적용.  
    - 대량의 결과 데이터를 반환할 때 요청 토큰 크기 초과 문제를 방지하기 위해 `batch response` 로직 도입.  

---

### 2024년 10월 23일  
- **MongoDB와 API 연동 개선**  
  - MongoDB에 다중 인덱스를 적용하여 데이터 조회 속도를 30% 향상.  
  - FastAPI와 MongoDB 간의 대량 데이터 처리 시 발생하던 연결 시간 초과 문제를 해결하기 위해 연결 풀(Connection Pool) 최적화.  

---

### 2024년 10월 26일  
- **데이터 파싱 문제 개선**  
  - UTF-8로 저장된 한글 데이터가 파싱 과정에서 누락되는 문제를 해결하기 위해 로케일 설정 강화.  
  - 특수 문자와 공백이 포함된 열에서 발생하던 데이터 불일치 문제를 해결하여 파싱 정확도를 98%까지 향상.  

---

### 2024년 11월 1일  
- **프론트엔드 데이터 시각화 개선**  
  - 대규모 데이터 시각화를 위해 `Web Worker`를 도입하여 메인 스레드에서의 연산 부하를 줄이고 렌더링 성능을 개선.  
  - 응답 속도를 개선하기 위해 클라이언트 측에서 데이터를 비동기적으로 처리하고, 초기 로딩 속도를 35% 향상.  

---

### 2024년 11월 4일  
- **머신 러닝 5개 모델 10개 방법론 도입 완료**  
  - 5개 모델 : Random Forest, Logistic Regression, K-means clustering, Support Vector Machine, Neural Network 
  - 10가지 방법론 : Classification, Regression, Binary, Multinomial, Segmetation, Anomaly-Detection, GNN, NN... (모델 별 2개)
  - 일반화된 모델로 LLM과 융합하여 LLM을 통해 각 모델별 필수 인자를 데이터에서 추출하고 이를 분석

---

### 2024년 11월 8일  
- **모델 최적화 및 성능 개선**  
  - 데이터 파싱, 프로세싱 과정에서 누락값, 이상치 등을 최소 에러로 다루어 모델 정확도 12% 향상
  - SVM의 경우 모델 결과값에 영향을 주는 인자값(C, epsilon, gamma 등)을 조절하여 총 27개의 경우의 수를 시행하여 가장 최적 결과를 선택 -> 이를 통해 평균 모델 정확도 20% 향상
---


# 🔍 문제 발생 가능성 분석 및 대응 방안

### 1. **백엔드 데이터 전송**  
   - **문제**: MongoDB와의 연결이 대량 데이터 처리 시 병목 현상 발생 가능.  
     - 연결 시간 초과 또는 대기 시간이 증가할 수 있음.  
   - **대응 방안**:  
     - MongoDB 연결 풀 크기 조정 및 쿼리 최적화.  
     - 대량 데이터 전송 시 `Chunking` 및 `Bulk Write` 도입.  

---

### 2. **파일 파싱 (UTF-8, 한글)**  
   - **문제**: 파일 업로드 시 한글 인코딩 문제로 데이터 손실 발생 가능.  
     - CSV 또는 Excel 파일에서 EUC-KR로 저장된 한글이 깨지는 문제.  
     - 특수 문자가 포함된 경우 파싱 오류 발생 가능.  
   - **대응 방안**:  
     - 업로드 시 파일 인코딩 자동 감지 및 UTF-8로 변환 처리.  
     - 특수 문자 및 공백 처리를 위한 정규화 로직 추가.  

---

### 3. **FastAPI (모델 학습 및 결과 반환)**  
   - **문제**:  
     - 모델 학습 시 데이터 크기에 따른 메모리 초과 또는 학습 속도 저하 발생 가능.  
     - 결과 반환 시 요청 크기가 토큰 제한을 초과할 위험.  
   - **대응 방안**:  
     - 모델 학습 시 데이터 샘플링 및 배치 처리 적용.  
     - `batch response` 로직으로 결과 데이터를 단계적으로 반환.  
     - 요청 전 입력 데이터 및 출력 데이터 크기를 사전 검증.  

<br>

# 🛠️ 기술 스택

##### 📱 Frontend
![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![Styled-Components](https://img.shields.io/badge/styled--components-DB7093?logo=styled-components&logoColor=white)

##### 🖥️ Frontend(Kiosk)
![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white)
![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)

##### 🔗 npm 패키지

![HandsonTable](https://img.shields.io/badge/HandsonTable-FFA500?logo=handsoncode&logoColor=white)
![SheetJS](https://img.shields.io/badge/SheetJS-0072C6?logo=javascript&logoColor=white)
![MUI DataTable](https://img.shields.io/badge/MUI%20DataTable-007FFF?logo=mui&logoColor=white)
![Konva](https://img.shields.io/badge/Konva-FF6347?logo=canvas&logoColor=white)

##### 💻 Backend

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.1-brightgreen?logo=springboot)
![JDK 17](https://img.shields.io/badge/JDK-17-orange?logo=java&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)
![JPA](https://img.shields.io/badge/JPA-6DB33F?logo=hibernate&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![TorchServe](https://img.shields.io/badge/TorchServe-FB4D3D?logo=pytorch&logoColor=white)

##### 🤖 AI/ML 기술
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![ray](https://img.shields.io/badge/ray-FB4D3D?logo=ray&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)

##### 🚀 Infra

![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-FFA500?logo=jenkins&logoColor=white)
![Amazon EC2](https://img.shields.io/badge/Amazon%20EC2-FF9900?logo=amazonec2&logoColor=white)
![Amazon S3](https://img.shields.io/badge/Amazon%20S3-569A31?logo=amazon&logoColor=white)
![Amazon RDS](https://img.shields.io/badge/Amazon%20RDS-527FFF?logo=amazonrds&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-black?logo=nginx&logoColor=white)

##### ⚙️ Management Tools

![GitLab](https://img.shields.io/badge/GitLab-FCA121?logo=gitlab&logoColor=white)
![JIRA](https://img.shields.io/badge/JIRA-0052CC?logo=jira&logoColor=white)
![Discord](https://img.shields.io/badge/Discord-7289DA?logo=discord&logoColor=white)
![Notion](https://img.shields.io/badge/Notion-000000?logo=notion&logoColor=white)
![Figma](https://img.shields.io/badge/Figma-F24E1E?logo=figma&logoColor=white)
[![Code Style: Google Java Style Guide](https://img.shields.io/badge/Code%20Style-Google--Java--Style--Guide-4285F4?logo=google&logoColor=white)](https://google.github.io/styleguide/javaguide.html)

##### 🖥️ IDE

![IntelliJ IDEA](https://img.shields.io/badge/IntelliJ_IDEA-000000?logo=intellij-idea&logoColor=white)
![VS Code](https://img.shields.io/badge/VS_Code-007ACC?logo=visual-studio-code&logoColor=white)


# 🎋 브랜치 전략
<img src="/READMEfile/Branch strategy.png">

# 📜 커밋 컨벤션
#### 커밋 유형은 깃모지와 영어 대문자로 작성하기

| 이모지 | 제목       | 내용                                            |
|--------|------------|-------------------------------------------------|
| ✨     | Feat       | 새로운 기능 추가                               |
| 🐛     | Fix        | 버그 수정                                      |
| 📝     | Docs       | 문서 수정                                      |
| 💄     | Style      | 코드 formatting, 세미콜론 누락, 코드 자체의 변경이 없는 경우 |
| ♻️     | Refactor   | 코드 리팩토링                                  |
| ✅     | Test       | 테스트 코드, 리팩토링 테스트 코드 추가       |
| 🙈     | Chore      | 패키지 매니저 수정, 그 외 기타 수정 ex) .gitignore |
| 📱     | Design     | CSS 등 사용자 UI 디자인 변경                   |
| 💡     | Comment    | 필요한 주석 추가 및 변경                      |
| 🚚     | Rename     | 파일 또는 폴더 명을 수정하거나 옮기는 작업만인 경우 |
| 🔥     | Remove     | 파일을 삭제하는 작업만 수행한 경우            |
| 🚑️     | !HOTFIX    | 급하게 치명적인 버그를 고쳐야 하는 경우       |
| 🔧     | Config     | 프로젝트 공통 설정 추가                        |

<br>

# 📄 프로젝트 구조
<img src="./READMEfile/Structure.png" alt="프로젝트 구조">


<br>

# 🌐 포팅 매뉴얼

[포팅 매뉴얼 보러 가기](https://whereisawedhi.notion.site/Auto-store-6eee2d733145412788c738e4fade9307?pvs=4)
<br>

# 💻 서비스 화면

### 모델 분석

| ![Kiosk 1](./READMEfile/1.PNG)| ![Kiosk 2](./READMEfile/2.PNG)|
|------------------------------------          |------------------------------------|
| **매인화면**                                  |  **분석 파일 선택**            |
| ![Kiosk 3](./READMEfile/3.PNG)               | ![Kiosk 4](./READMEfile/4.PNG)|
| **분석 요구사항 입력**                        | **모델 추천 분석**              |
| ![Kiosk 5](./READMEfile/5.PNG)               |   ![Kiosk 6](./READMEfile/6.PNG)|
| **모델 추천 분석 설명**                       |     **유저 모델 선택**      |
| ![Kiosk 7](./READMEfile/7.PNG)               |   ![Kiosk 9](./READMEfile/9.PNG)|
| **모델 분석**                       |     **결과 확인**      |

### 모델 분석 결과
| ![Page 1](./READMEfile/result1.PNG)  | ![Page 2](./READMEfile/result2.PNG)  |
|:----------------------------------:|:----------------------------------:|
| **분석 결과**                       |   **분석 결과**                 |
| ![Page 3](./READMEfile/result3.PNG)  | ![Page 4](./READMEfile/result4.PNG)  |
|  **분석 결과**                    |  **분석 결과**                   |
| ![Page 5](./READMEfile/result5.PNG)  | ![Page 6](./READMEfile/result6.PNG)  |
|  **분석 결과**                         |  **분석 결과**                   |

| **수요 예측**                       | **수요 예측 시각화**                 |



<br>

<br>

# 📝 프로젝트 후기

### 김유석
이번 프로젝트에서 저는 ChatRoomID와 RequestID를 사용하여 MongoDB에서 데이터를 효과적으로 관리하고 유저의 요구사항을 처리하는 방법을 배웠습니다. 특히, 각 요청에 대해 ChatRoomID와 RequestID를 통해 데이터와 요청 간의 관계를 명확히 하여, 사용자 별로 상태를 추적하고 필요한 정보를 정확하게 제공하는 기능을 구현했습니다.

이 과정에서 MongoDB의 CRUD 연산을 활용한 데이터 조작, 효율적인 쿼리 작성, 그리고 대량 데이터를 다룰 때의 최적화 방법 등을 익혔습니다. 이를 통해 사용자가 요청한 분석 파일을 저장하고, 해당 데이터를 ML 서버로 전송하여 결과를 받는 전체적인 데이터 흐름을 구축했습니다.

또한, 유저의 다양한 요구사항에 따라 ChatRoomID를 활용해 지속적인 대화와 분석 히스토리를 관리하고, RequestID로 요청의 진행 상태를 추적하며, 유연하고 신속한 백엔드 시스템을 개발할 수 있었습니다. 이러한 기능을 구현하면서 데이터의 일관성을 유지하고, 사용자 경험을 향상시키는 백엔드 로직의 중요성을 다시 한번 실감할 수 있었습니다.



<br>

### 문재성
Ray Serve와 FastAPI를 결합한 방식으로 ML, DL 서비스를 성공적으로 통합 배포할 수 있었습니다. 
특히 분산처리가 가능한 Ray의 특성 덕분에 ML, DL 의 처리속도를 대폭 개선하여, LLM 응답을 제외한 부분에서 분석 대기시간을 줄여 사용자 경험을 향상시킬 수 있었습니다. 
LLM Prompt Engineer를 맡아 LLM에 대한 이해와 함께, 여러 프롬프팅 기법을 도입했습니다. 
주로 3가지에 집중했는데요, 데이터 분석을 모르는 사용자에게 더욱 적합한 User-Friendly한 답변을 줄 수 있도록 할 것, Frontend/Backend 를 고려해 정해진 Response Format을 지키도록 할 것, 그리고 사용자와의 대화를 이어가기 위해 Context를 유지하는 것에 집중했습니다. 
이를 위해 Few-shot Prompting, Role-based Prompting, Chain of Thought Prompting, Contextual Knowledge Injection, System 프롬프트 활용, Summary 기반 맥락 관리, OpenAI API의 JSON Mode 등을 활용했습니다.
실제 서비스에 LLM을 도입하는 데에 대한 인사이트를 얻을 수 있었습니다.
프로젝트 막바지에 사용자 경험을 높이기 위한 신규 기능들을 도입하면서 서비스 로직에 대한 이해와, 고객 중심의 개발에 대해서 다시금 생각해보게 되는 계기가 되었고, 여러 오류를 잡아가면서 팀원들과 더 끈끈해지는 시간을 보낼 수 있었습니다.


<br>

### 이한솔
프론트엔드 전반을 담당하며 디자인 뿐만 아니라 사용자 편의를 고려한 설계에 대해 고민할 수 있었던 프로젝트였습니다. 수 많은 수정 과정을 거치며 어떻게 하면 보여주고자 하는 내용을 더 잘 보여줄 수 있을지에 대해 배울 수 있었습니다. 또한 동기, 비동기 처리에 대해 보다 확실하게 이해할 수 있었으며 그로 인해 발생될 수 있는 문제들이나 이를 활용할 수 있는 방안까지 생각을 넓힐 수 있는 계기가 되었습니다. 
<br>

### 이수완
 ML, DL, LLM 등이 각각 어떤 상황에 적합하고, 우리 프로젝트에 ML이 어떻게 활용되어야 할지 고찰을 많이 한 프로젝트였습니다. 궁극적으로 End User가 ML과 AI를 통해 추출한 데이터를 유의미하게 받아들이게끔하는 것이 가장 어려운 부분이었습니다. 유저의 모호한 부분은 LLM으로 메우되, LLM에게 많은 권한을 주지 않는 것이 중요했고, 모델 구현에서는 많은 상황들(데이터 문제, 정확도 저조, 적은 데이터, 많은 데이터)에 대처할 수 있는 일반화된 모델을 최대한 구축하였고, Kaggle에 나와있는 무작위 데이터로 테스트해본 결과 약 70% 이상의 데이터로 성공적인 데이터 분석을 실행할 수 있었습니다. 이를 통해, 모호하고 어려운 LLM과 그리고 현실적인 ML, DL 사용법에 대해 깊이 공부하였고, 앞으로도 훌륭한 개발자이자, AI를 잘 아는 개발자가 되도록 하겠습니다.
 Frontend 차원에서는 단순한 구현을 넘어서 이제는 최소한의 DB 호출, 쿠키 서버 활용에 대한 고민, API 통신 방식 변경, Components를 더 세밀하게 분리함으로서 사용성 증가 등을 했고, 이를 통해서 UX를 신경쓰는 동시에 User를 통해 발생하는 비용적 부분 최소화를 많이 고민했고, 지난 프로젝트보다 불필요한 호출을 50% 가량 줄이는 성과를 얻었습니다.(SSR을 적절히 사용해, 많은 데이터 호출의 경우 선재적 처리, 전부다 불러오는 방식의 API 호출이 아닌 유저의 각 움직임마다 API 송신으로 데이터 호출)
 이 모든 것이 가능했던 점은 합이 잘 맞는 팀과 팀원들이 맞은 바의 역할을 잘 수행해주었기에 ,가능했던 것 같습니다. 감사합니다.

 <br>

### 정지환
 일주일 정도, 기본적인 Spring 시작을 했습니다.


<br>

### 오승진
 3일 정도, 인프라 구축에 조언 및 도움을 주었습니다.

