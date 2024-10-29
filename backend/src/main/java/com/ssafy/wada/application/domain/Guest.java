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
public class Guest extends BaseTimeEntity {
	@Id
	private String id;

	public static Guest create(String id) {
		return Guest.builder()
			.id(id)
			.build();
	}
}
