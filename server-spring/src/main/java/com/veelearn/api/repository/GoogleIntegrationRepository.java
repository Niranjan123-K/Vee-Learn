package com.veelearn.api.repository;

import com.veelearn.api.entity.GoogleIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GoogleIntegrationRepository extends JpaRepository<GoogleIntegration, UUID> {
    Optional<GoogleIntegration> findByUserId(UUID userId);
}
