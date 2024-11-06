package com.ssafy.wada.application.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseTimeEntity {

	@Id
	private String id = UUID.randomUUID().toString();


	private String requestId;

	private String fileUrl;

	@ManyToOne
	@JoinColumn(name = "guest_id" , nullable = false)
	private Guest guest;  // N:1 관계 - Guest와 연관

	@Override
	public boolean equals(Object obj) {
		if(obj == null){
			return false;
		}
		if(this==obj){
			return true;
		}
		if(getClass()!=obj.getClass()){
			return false;
		}
		return id != null && id.equals(((ChatRoom)obj).id);
	}

	@Override
	public int hashCode() {
		return id != null ? id.hashCode() : 0;
	}

	// ChatRoom.java
	public static ChatRoom create(String chatRoomId, Guest guest) {
		return ChatRoom.builder()
			.id(chatRoomId)
			.guest(guest)
			.build();
	}
}
