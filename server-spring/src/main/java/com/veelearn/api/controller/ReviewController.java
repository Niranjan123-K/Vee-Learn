package com.veelearn.api.controller;

import com.veelearn.api.dto.ReviewDtos;
import com.veelearn.api.entity.Review;
import com.veelearn.api.security.UserPrincipal;
import com.veelearn.api.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createReview(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ReviewDtos.CreateReviewRequest req
    ) {
        Review review = reviewService.createReview(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("review", review));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getReviewsForUser(
        @PathVariable UUID userId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(reviewService.getReviewsForUser(userId, page, limit));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<Map<String, Object>> getReviewsForSession(@PathVariable UUID sessionId) {
        List<Map<String, Object>> reviews = reviewService.getReviewsForSession(sessionId);
        return ResponseEntity.ok(Map.of("reviews", reviews));
    }
}
