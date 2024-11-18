package com.ssafy.wada.application.domain;

import static org.springframework.data.jpa.domain.AbstractAuditable_.createdDate;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseTimeEntity {

	@Id
	private String id; // UUID 생성을 메서드에서 제어

	@ManyToOne
	@JoinColumn(name = "guest_id", nullable = false)
	private Guest guest;  // N:1 관계 - Guest와 연관

	@Override
	public boolean equals(Object obj) {
		if (obj == null) {
			return false;
		}
		if (this == obj) {
			return true;
		}
		if (getClass() != obj.getClass()) {
			return false;
		}
		return id != null && id.equals(((ChatRoom) obj).id);
	}

	@Override
	public int hashCode() {
		return id != null ? id.hashCode() : 0;
	}

	// ChatRoom 생성 메서드
	public static ChatRoom create(String chatRoomId, Guest guest) {
		return ChatRoom.builder()
			.id(chatRoomId != null ? chatRoomId : UUID.randomUUID().toString()) // ID가 null일 때만 UUID 생성
			.guest(guest)
			.build();
	}

}
