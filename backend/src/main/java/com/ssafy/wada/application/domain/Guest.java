package com.ssafy.wada.application.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
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
public class Guest extends BaseTimeEntity implements Serializable {

	private static final long serialVersionUID = 1L;

	@Id
	private String id;

	@OneToMany(mappedBy = "guest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	private List<ChatRoom> chatRooms;

	public void addChatRoom(ChatRoom chatRoom) {
		this.chatRooms.add(chatRoom);
		chatRoom.setGuest(this);
	}

	public void removeChatRoom(ChatRoom chatRoom) {
		chatRoom.setGuest(null);
		this.chatRooms.remove(chatRoom);
	}

	public void removeAllChatRooms() {
		chatRooms.forEach(chatRoom -> chatRoom.setGuest(null));
		chatRooms.clear();
	}

	public static Guest create(String id) {
		return Guest.builder()
			.id(id != null ? id : UUID.randomUUID().toString()) // create 메서드에서 id 생성 처리
			.build();
	}
}
