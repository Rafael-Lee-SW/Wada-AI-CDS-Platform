package com.ssafy.wada.application.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.wada.application.domain.Guest;

public interface GuestRepository extends JpaRepository<Guest, String> {
    // 기본 조회: Lazy 로딩 적용
    Optional<Guest> findById(String sessionId);

    // chatRooms 필드를 즉시 로딩하는 메서드
    @EntityGraph(attributePaths = {"chatRooms"})
    Optional<Guest> findWithChatRoomsById(String sessionId);
}
