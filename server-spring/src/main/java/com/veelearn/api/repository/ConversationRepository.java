package com.veelearn.api.repository;

import com.veelearn.api.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query(value = """
        SELECT c.id, c.user1_id, c.user2_id, c.last_message_at,
          u1.name AS user1_name, u1.avatar_url AS user1_avatar,
          u2.name AS user2_name, u2.avatar_url AS user2_avatar,
          (SELECT COUNT(*)::int FROM messages m
           WHERE m.receiver_id = :userId AND m.is_read = false
             AND (m.sender_id = c.user1_id OR m.sender_id = c.user2_id)
          ) AS unread_count,
          (SELECT content FROM messages m2
           WHERE ((m2.sender_id = c.user1_id AND m2.receiver_id = c.user2_id)
               OR (m2.sender_id = c.user2_id AND m2.receiver_id = c.user1_id))
           ORDER BY m2.created_at DESC LIMIT 1
          ) AS last_message
        FROM conversations c
        JOIN users u1 ON u1.id = c.user1_id
        JOIN users u2 ON u2.id = c.user2_id
        WHERE c.user1_id = :userId OR c.user2_id = :userId
        ORDER BY c.last_message_at DESC
    """, nativeQuery = true)
    List<Object[]> findConversationsForUserRaw(@Param("userId") UUID userId);

    @Query("SELECT c FROM Conversation c WHERE c.user1.id = :u1 AND c.user2.id = :u2")
    Optional<Conversation> findByUser1IdAndUser2Id(@Param("u1") UUID u1, @Param("u2") UUID u2);
}
