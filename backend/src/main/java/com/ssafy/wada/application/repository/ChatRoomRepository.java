package com.ssafy.wada.application.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.wada.application.domain.ChatRoom;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {
	Optional<ChatRoom> findByIdAndGuestId(String chatRoomId, String guestId);
	List<ChatRoom> findByGuestId(String guestId);

}
