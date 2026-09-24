package com.veelearn.api.repository;

import com.veelearn.api.entity.SessionMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SessionMessageRepository extends JpaRepository<SessionMessage, UUID> {

    @Query("""
        SELECT sm FROM SessionMessage sm
        JOIN FETCH sm.sender
        WHERE sm.session.id = :sessionId
        ORDER BY sm.createdAt ASC
    """)
    List<SessionMessage> findBySessionIdOrderByCreatedAtAsc(@Param("sessionId") UUID sessionId);
}
