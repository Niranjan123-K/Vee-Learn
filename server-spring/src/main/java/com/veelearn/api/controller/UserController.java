package com.veelearn.api.controller;

import com.veelearn.api.dto.UserDto;
import com.veelearn.api.entity.User;
import com.veelearn.api.security.UserPrincipal;
import com.veelearn.api.service.FileStorageService;
import com.veelearn.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FileStorageService fileStorageService;

    @GetMapping("/leaderboard")
    public ResponseEntity<Map<String, Object>> getLeaderboard(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(Map.of("leaderboard", userService.getLeaderboard(limit)));
    }

    @GetMapping("/teachers")
    public ResponseEntity<Map<String, Object>> getTeachers(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String experience_level,
        @RequestParam(required = false) Double min_rating,
        @RequestParam(required = false) String availability,
        @RequestParam(required = false) String language,
        @RequestParam(required = false) String sort,
        @RequestParam(defaultValue = "50") int limit
    ) {
        UUID userId = principal != null ? principal.getId() : null;
        List<Map<String, Object>> teachers = userService.getTeachers(
            userId, q, category, experience_level, min_rating, availability, language, sort, limit
        );
        return ResponseEntity.ok(Map.of("users", teachers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable UUID id) {
        UserDto profile = userService.getProfile(id);
        return ResponseEntity.ok(Map.of("user", profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody Map<String, Object> updates
    ) {
        User updated = userService.updateProfile(principal.getId(), updates);
        return ResponseEntity.ok(Map.of("user", updated));
    }

    @PostMapping("/upload/dp")
    public ResponseEntity<Map<String, String>> uploadDp(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam("dp") MultipartFile file
    ) {
        String url = fileStorageService.storeFile(file, "dp");
        userService.updateProfile(principal.getId(), Map.of("avatar_url", url));
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/upload/wallpaper")
    public ResponseEntity<Map<String, String>> uploadWallpaper(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam("wallpaper") MultipartFile file
    ) {
        String url = fileStorageService.storeFile(file, "wallpaper");
        userService.updateProfile(principal.getId(), Map.of("wallpaper_url", url));
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/complete-onboarding")
    public ResponseEntity<Map<String, Object>> completeOnboarding(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userService.completeOnboarding(principal.getId());
        return ResponseEntity.ok(Map.of("user", user));
    }
}
