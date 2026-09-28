package com.veelearn.api.controller;

import com.veelearn.api.dto.SessionDtos;
import com.veelearn.api.entity.Session;
import com.veelearn.api.security.UserPrincipal;
import com.veelearn.api.service.SessionService;
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
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSession(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody SessionDtos.CreateSessionRequest req
    ) {
        Session session = sessionService.createSession(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("session", session));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserSessions(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String period,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        Map<String, Object> response = sessionService.getUserSessions(principal.getId(), status, period, page, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSessionById(@PathVariable UUID id) {
        Session session = sessionService.getSessionById(id);
        return ResponseEntity.ok(Map.of("session", session));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<Map<String, Object>> confirmSession(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id
    ) {
        Session session = sessionService.confirmSession(id, principal.getId());
        return ResponseEntity.ok(Map.of("session", session));
    }

    @PutMapping("/{id}/meeting-link")
    public ResponseEntity<Map<String, Object>> updateMeetingLink(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id,
        @Valid @RequestBody SessionDtos.UpdateMeetingLinkRequest req
    ) {
        Session session = sessionService.updateMeetingLink(id, principal.getId(), req.getMeeting_link());
        return ResponseEntity.ok(Map.of("session", session));
    }

    @GetMapping("/{id}/join")
    public ResponseEntity<Map<String, String>> joinSession(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id
    ) {
        String joinUrl = sessionService.joinSession(id, principal.getId());
        return ResponseEntity.ok(Map.of("joinUrl", joinUrl));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectSession(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id
    ) {
        Session session = sessionService.rejectSession(id, principal.getId());
        return ResponseEntity.ok(Map.of("session", session));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeSession(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id
    ) {
        Session session = sessionService.completeSession(id, principal.getId());
        return ResponseEntity.ok(Map.of("session", session));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelSession(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id
    ) {
        Session session = sessionService.cancelSession(id, principal.getId());
        return ResponseEntity.ok(Map.of("session", session));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<Map<String, Object>> getSessionMessages(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id
    ) {
        List<Map<String, Object>> messages = sessionService.getSessionMessages(id, principal.getId());
        return ResponseEntity.ok(Map.of("messages", messages));
    }
}
