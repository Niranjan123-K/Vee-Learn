package com.veelearn.api.service;

import com.veelearn.api.dto.ReviewDtos;
import com.veelearn.api.entity.Review;
import com.veelearn.api.entity.Session;
import com.veelearn.api.entity.User;
import com.veelearn.api.entity.enums.SessionStatus;
import com.veelearn.api.exception.BadRequestException;
import com.veelearn.api.exception.ConflictException;
import com.veelearn.api.exception.ForbiddenException;
import com.veelearn.api.exception.ResourceNotFoundException;
import com.veelearn.api.repository.ReviewRepository;
import com.veelearn.api.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final SessionRepository sessionRepository;

    @Transactional
    public Review createReview(UUID reviewerId, ReviewDtos.CreateReviewRequest req) {
        Session session = sessionRepository.findById(req.getSession_id())
            .orElseThrow(() -> new ResourceNotFoundException("Session not found."));

        if (session.getStatus() != SessionStatus.completed) {
            throw new BadRequestException("Can only review completed sessions.");
        }

        boolean isTeacher = session.getTeacher().getId().equals(reviewerId);
        boolean isLearner = session.getLearner().getId().equals(reviewerId);

        if (!isTeacher && !isLearner) {
            throw new ForbiddenException("You are not a participant of this session.");
        }

        User reviewee = isTeacher ? session.getLearner() : session.getTeacher();
        User reviewer = isTeacher ? session.getTeacher() : session.getLearner();

        if (reviewRepository.findBySessionIdAndReviewerId(req.getSession_id(), reviewerId).isPresent()) {
            throw new ConflictException("You have already reviewed this session.");
        }

        Review review = Review.builder()
            .session(session)
            .reviewer(reviewer)
            .reviewee(reviewee)
            .rating(req.getRating())
            .comment(req.getComment() != null ? req.getComment() : "")
            .build();

        return reviewRepository.save(review);
    }

    public Map<String, Object> getReviewsForUser(UUID userId, int page, int limit) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.min(limit > 0 ? limit : 20, 100));
        Page<Review> reviewPage = reviewRepository.findByRevieweeIdWithDetails(userId, pageRequest);

        List<Map<String, Object>> reviews = reviewPage.getContent().stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("rating", r.getRating());
            m.put("comment", r.getComment());
            m.put("created_at", r.getCreatedAt());
            m.put("reviewer_name", r.getReviewer().getName());
            m.put("reviewer_avatar", r.getReviewer().getAvatarUrl());
            m.put("scheduled_at", r.getSession().getScheduledAt());
            m.put("skill_name", r.getSession().getSkill().getName());
            return m;
        }).toList();

        return Map.of(
            "reviews", reviews,
            "pagination", Map.of(
                "page", page,
                "limit", limit,
                "total", reviewPage.getTotalElements()
            )
        );
    }

    public List<Map<String, Object>> getReviewsForSession(UUID sessionId) {
        List<Review> list = reviewRepository.findBySessionIdWithReviewer(sessionId);
        return list.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("rating", r.getRating());
            m.put("comment", r.getComment());
            m.put("created_at", r.getCreatedAt());
            m.put("reviewer_name", r.getReviewer().getName());
            m.put("reviewer_avatar", r.getReviewer().getAvatarUrl());
            return m;
        }).toList();
    }
}
