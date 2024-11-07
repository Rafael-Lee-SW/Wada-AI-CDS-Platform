package com.ssafy.wada.application.repository;

import com.ssafy.wada.application.domain.RequestModel;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestModelRepository extends JpaRepository<RequestModel, Long> {

    List<RequestModel> findByChatRoomId(String chatRoomId);
}