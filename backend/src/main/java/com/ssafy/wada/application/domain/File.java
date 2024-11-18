package com.ssafy.wada.application.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
public class File extends BaseTimeEntity {

    @Id
    private String id; // file_id에 해당하는 필드

    private String url; // 파일의 URL

    @ManyToOne
    @JoinColumn(name = "chatRoomId", nullable = false)
    private ChatRoom chatRoom; // ChatRoom과의 N:1 관계

    // File 생성 메서드
    public static File create(String fileId, ChatRoom chatRoom, String url) {
        return File.builder()
            .id(fileId)
            .chatRoom(chatRoom)
            .url(url)
            .build();
    }
}
