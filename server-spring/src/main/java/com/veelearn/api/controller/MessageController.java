package com.veelearn.api.controller;

import com.veelearn.api.dto.MessageDtos;
import com.veelearn.api.entity.Message;
import com.veelearn.api.security.UserPrincipal;
import com.veelearn.api.service.MessageService;
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
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/conversations")
    public ResponseEntity<Map<String, Object>> getConversations(@AuthenticationPrincipal UserPrincipal principal) {
        List<Map<String, Object>> convs = messageService.getConversations(principal.getId());
        return ResponseEntity.ok(Map.of("conversations", convs));
    }

    @GetMapping("/conversation/{userId}")
    public ResponseEntity<Map<String, Object>> getMessages(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID userId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(messageService.getMessages(principal.getId(), userId, page, limit));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> sendMessage(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody MessageDtos.SendMessageRequest req
    ) {
        Message message = messageService.sendMessage(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", message));
    }

    @PutMapping("/read/{conversationId}")
    public ResponseEntity<Map<String, Object>> markAsRead(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID conversationId
    ) {
        int updated = messageService.markAsRead(principal.getId(), conversationId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }
}
