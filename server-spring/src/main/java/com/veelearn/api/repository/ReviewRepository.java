package com.veelearn.api.repository;

import com.veelearn.api.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    @Query("""
        SELECT r FROM Review r
        JOIN FETCH r.reviewer u
        JOIN FETCH r.session s
        JOIN FETCH s.skill sk
        WHERE r.reviewee.id = :revieweeId
        ORDER BY r.createdAt DESC
    """)
    Page<Review> findByRevieweeIdWithDetails(@Param("revieweeId") UUID revieweeId, Pageable pageable);

    @Query("""
        SELECT r FROM Review r
        JOIN FETCH r.reviewer u
        WHERE r.session.id = :sessionId
    """)
    List<Review> findBySessionIdWithReviewer(@Param("sessionId") UUID sessionId);

    Optional<Review> findBySessionIdAndReviewerId(UUID sessionId, UUID reviewerId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.reviewee.id = :userId")
    Double getAverageRatingForUser(@Param("userId") UUID userId);

    long countByRevieweeId(UUID revieweeId);
}
