package com.veelearn.api.repository;

import com.veelearn.api.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") UUID id);

    @Query(value = """
        SELECT
          u.id AS id,
          u.name AS name,
          u.avatar_url AS avatar_url,
          COUNT(s.id)::int AS sessions_completed,
          COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM reviews r WHERE r.reviewee_id = u.id), 0) AS avg_rating
        FROM users u
        LEFT JOIN sessions s ON (s.teacher_id = u.id OR s.learner_id = u.id) AND s.status = 'completed'
        GROUP BY u.id
        HAVING COUNT(s.id) > 0
        ORDER BY sessions_completed DESC, avg_rating DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> findLeaderboardRaw(@Param("limit") int limit);
}
