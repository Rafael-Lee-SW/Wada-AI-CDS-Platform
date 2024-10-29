package com.ssafy.wada.application.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
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
public class ChatRoom {

	@Id
	private String id;

	private String guestId;

	public static ChatRoom create(String id, String guestId) {
		return ChatRoom.builder()
			.id(id)
			.guestId(guestId)
			.build();
	}
}
