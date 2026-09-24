package com.veelearn.api.repository;

import com.veelearn.api.entity.Bounty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BountyRepository extends JpaRepository<Bounty, UUID> {
}
