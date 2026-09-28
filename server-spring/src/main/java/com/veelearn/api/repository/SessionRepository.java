package com.veelearn.api.repository;

import com.veelearn.api.entity.Session;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Session s WHERE s.id = :id")
    Optional<Session> findByIdForUpdate(@Param("id") UUID id);

    @Query(value = """
        SELECT id FROM sessions
        WHERE (teacher_id = :u1 OR learner_id = :u1 OR teacher_id = :u2 OR learner_id = :u2)
          AND status IN ('pending', 'confirmed')
          AND scheduled_at < :endAt
          AND scheduled_at + (INTERVAL '1 minute' * duration_minutes) > :startAt
    """, nativeQuery = true)
    List<UUID> findOverlappingSessions(
        @Param("u1") UUID u1,
        @Param("u2") UUID u2,
        @Param("startAt") OffsetDateTime startAt,
        @Param("endAt") OffsetDateTime endAt
    );

    @Query("""
        SELECT s FROM Session s
        JOIN FETCH s.teacher t
        JOIN FETCH s.learner l
        JOIN FETCH s.skill sk
        WHERE (s.teacher.id = :userId OR s.learner.id = :userId)
        ORDER BY s.scheduledAt DESC
    """)
    Page<Session> findUserSessionsAll(@Param("userId") UUID userId, Pageable pageable);

    @Query("""
        SELECT s FROM Session s
        JOIN FETCH s.teacher t
        JOIN FETCH s.learner l
        JOIN FETCH s.skill sk
        WHERE (s.teacher.id = :userId OR s.learner.id = :userId)
          AND s.status = :status
        ORDER BY s.scheduledAt DESC
    """)
    Page<Session> findUserSessionsByStatus(@Param("userId") UUID userId, @Param("status") com.veelearn.api.entity.enums.SessionStatus status, Pageable pageable);

    @Query("""
        SELECT s FROM Session s
        JOIN FETCH s.teacher t
        JOIN FETCH s.learner l
        JOIN FETCH s.skill sk
        WHERE (s.teacher.id = :userId OR s.learner.id = :userId)
          AND s.scheduledAt > :now
          AND (:status IS NULL OR s.status = :status)
        ORDER BY s.scheduledAt DESC
    """)
    Page<Session> findUserSessionsUpcoming(@Param("userId") UUID userId, @Param("status") com.veelearn.api.entity.enums.SessionStatus status, @Param("now") OffsetDateTime now, Pageable pageable);

    @Query("""
        SELECT s FROM Session s
        JOIN FETCH s.teacher t
        JOIN FETCH s.learner l
        JOIN FETCH s.skill sk
        WHERE (s.teacher.id = :userId OR s.learner.id = :userId)
          AND s.scheduledAt <= :now
          AND (:status IS NULL OR s.status = :status)
        ORDER BY s.scheduledAt DESC
    """)
    Page<Session> findUserSessionsPast(@Param("userId") UUID userId, @Param("status") com.veelearn.api.entity.enums.SessionStatus status, @Param("now") OffsetDateTime now, Pageable pageable);

    @Query("""
        SELECT s FROM Session s
        JOIN FETCH s.teacher t
        JOIN FETCH s.learner l
        JOIN FETCH s.skill sk
        WHERE s.id = :id
    """)
    Optional<Session> findByIdEnriched(@Param("id") UUID id);

    @Query(value = """
        SELECT COUNT(id) FROM sessions
        WHERE (teacher_id = :userId OR learner_id = :userId)
          AND status = 'completed'
    """, nativeQuery = true)
    int countCompletedSessionsForUser(@Param("userId") UUID userId);

    @Query(value = """
        SELECT COUNT(id) FROM sessions
        WHERE (teacher_id = :userId OR learner_id = :userId)
          AND status IN ('pending', 'confirmed')
          AND scheduled_at > :now
    """, nativeQuery = true)
    int countUpcomingSessionsForUser(@Param("userId") UUID userId, @Param("now") OffsetDateTime now);

    @Query("""
        SELECT s FROM Session s
        JOIN FETCH s.teacher
        JOIN FETCH s.learner
        JOIN FETCH s.skill
        WHERE s.teacher.id = :userId OR s.learner.id = :userId
        ORDER BY s.createdAt DESC
        LIMIT 5
    """)
    List<Session> findRecentSessionsForUser(@Param("userId") UUID userId);

    @Query(value = """
        SELECT
          TO_CHAR(DATE_TRUNC('month', scheduled_at), 'YYYY-MM') AS month,
          COUNT(*)::INT AS session_count,
          COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed_count
        FROM sessions
        WHERE (teacher_id = :userId OR learner_id = :userId)
          AND scheduled_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
        GROUP BY DATE_TRUNC('month', scheduled_at)
        ORDER BY month
    """, nativeQuery = true)
    List<Object[]> findActivityByMonthRaw(@Param("userId") UUID userId);
}
