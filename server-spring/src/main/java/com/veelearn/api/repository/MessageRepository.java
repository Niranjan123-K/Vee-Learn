package com.veelearn.api.repository;

import com.veelearn.api.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("""
        SELECT m FROM Message m
        JOIN FETCH m.sender s
        JOIN FETCH m.receiver r
        WHERE (m.sender.id = :u1 AND m.receiver.id = :u2)
           OR (m.sender.id = :u2 AND m.receiver.id = :u1)
        ORDER BY m.createdAt ASC
    """)
    Page<Message> findConversationMessages(@Param("u1") UUID u1, @Param("u2") UUID u2, Pageable pageable);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.isRead = false")
    int markMessagesAsRead(@Param("senderId") UUID senderId, @Param("receiverId") UUID receiverId);
}
