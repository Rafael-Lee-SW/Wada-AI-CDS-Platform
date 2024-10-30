package com.ssafy.wada.application.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseTimeEntity {

	@Id
	private String id;  // ChatRoom ID

	private String mongoId;  // MongoDB의 ModelParameter ID

	@ManyToOne
	@JoinColumn(name = "guest_id")
	private Guest guest;  // N:1 관계 - Guest와 연관

	// ChatRoom.java
	public static ChatRoom create(String chatRoomId, Guest guest) {
		return ChatRoom.builder()
			.id(chatRoomId)
			.guest(guest)
			.build();
	}
}
