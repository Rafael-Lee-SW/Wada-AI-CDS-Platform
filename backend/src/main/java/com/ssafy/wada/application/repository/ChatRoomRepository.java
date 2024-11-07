package com.ssafy.wada.application.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.wada.application.domain.ChatRoom;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {
	Optional<ChatRoom> findByIdAndGuestId(String chatRoomId, String guestId);
	List<ChatRoom> findByGuestId(String guestId);
	// chatRoomId로 requestId를 찾는 쿼리

	@Query("SELECT c.requestId FROM ChatRoom c WHERE c.id = :chatRoomId")
	Optional<String> findRequestIdByChatRoomId(@Param("chatRoomId") String chatRoomId);

	ChatRoom findByRequestId(String requestId);

	@Query("SELECT c.fileUrl FROM ChatRoom c WHERE c.id = :chatRoomId")
	Optional<String> findFileUrlByChatRoomId(@Param("chatRoomId") String chatRoomId);
}
