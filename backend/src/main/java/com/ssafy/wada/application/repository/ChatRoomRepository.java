package com.ssafy.wada.application.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.wada.application.domain.ChatRoom;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {
	Optional<ChatRoom> findByIdAndGuestId(String chatRoomId, String guestId);



}
