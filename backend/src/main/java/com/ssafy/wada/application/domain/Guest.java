package com.ssafy.wada.application.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Entity
@Getter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Guest extends BaseTimeEntity {

	@Id
	private String id;  // Guest ID (Session ID 역할)

	@OneToMany(mappedBy = "guest")
	private List<ChatRoom> chatRooms;  // 1:N 관계 - ChatRoom과 연관

	public static Guest create(String id) {
		return Guest.builder()
			.id(id)
			.build();
	}
}
