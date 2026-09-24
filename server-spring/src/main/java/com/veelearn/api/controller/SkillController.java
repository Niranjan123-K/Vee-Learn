package com.veelearn.api.controller;

import com.veelearn.api.dto.SkillDtos;
import com.veelearn.api.entity.UserSkill;
import com.veelearn.api.security.UserPrincipal;
import com.veelearn.api.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkillsGrouped());
    }

    @PostMapping("/user-skills")
    public ResponseEntity<Map<String, Object>> addUserSkill(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody SkillDtos.AddUserSkillRequest req
    ) {
        UserSkill userSkill = skillService.addUserSkill(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("userSkill", userSkill));
    }

    @DeleteMapping("/user-skills/{id}")
    public ResponseEntity<Map<String, String>> removeUserSkill(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id
    ) {
        skillService.removeUserSkill(id, principal.getId());
        return ResponseEntity.ok(Map.of("message", "Skill removed."));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserSkills(@PathVariable UUID userId) {
        List<UserSkill> skills = skillService.getUserSkills(userId);
        return ResponseEntity.ok(Map.of("skills", skills));
    }
}
