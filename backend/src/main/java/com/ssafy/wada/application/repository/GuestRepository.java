package com.ssafy.wada.application.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.wada.application.domain.Guest;

public interface GuestRepository extends JpaRepository<Guest, String> {
}
