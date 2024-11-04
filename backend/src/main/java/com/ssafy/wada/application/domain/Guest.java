// Guest.java
package com.ssafy.wada.application.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import java.util.List;

@Entity
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Guest extends BaseTimeEntity implements Serializable {

	private static final long serialVersionUID = 1L;

	@Id
	private String id = UUID.randomUUID().toString(); // String 타입의 UUID 생성


	@OneToMany(mappedBy = "guest", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ChatRoom> chatRooms = new ArrayList<>();

	public void addChatRoom(ChatRoom chatRoom) {
		this.chatRooms.add(chatRoom);
		chatRoom.setGuest(this);
	}

	public void removeChatRoom(ChatRoom chatRoom) {
		chatRoom.setGuest(null);
		this.chatRooms.remove(chatRoom);
	}

	public void removeAllChatRooms() {
		Iterator<ChatRoom> iterator = this.chatRooms.iterator();
		while (iterator.hasNext()) {
			ChatRoom chatRoom = iterator.next();
			chatRoom.setGuest(null);
			iterator.remove();
		}
	}

	public static Guest create(String id) {
		return Guest.builder()
			.id(id)
			.build();
	}
}
