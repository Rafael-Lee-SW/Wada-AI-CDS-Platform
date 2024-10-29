export default function ChatContent({ result, onMakeDashBoard }) {
    return (
        <div>
            채팅컴포넌트입니다.
            내 채팅 : 업로드한 파일과 분석 요청 내용
            상대 채팅 : 분석 결과 보기 -- 클릭 시 onMakeDashBoard로 result도 함께 보내줌
        </div>
    );
}