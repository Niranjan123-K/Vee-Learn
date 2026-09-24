package com.veelearn.api.controller;

import com.veelearn.api.security.UserPrincipal;
import com.veelearn.api.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/match")
@RequiredArgsConstructor
public class MatchController {

    private final MatchingService matchingService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> findMatches(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam UUID skill_id
    ) {
        List<Map<String, Object>> matches = matchingService.findTeachersForSkill(skill_id, principal.getId());
        return ResponseEntity.ok(Map.of("matches", matches));
    }
}
