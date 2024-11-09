package com.ssafy.wada.application.repository;

import com.ssafy.wada.application.domain.File;
import feign.Param;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FileRepository extends JpaRepository<File, String> {

    @Query("SELECT f.url FROM File f WHERE f.chatRoom.id = :chatRoomId")
    Optional<String> findUrlByChatRoomId(@Param("chatRoomId") String chatRoomId);
}
