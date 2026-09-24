package com.veelearn.api.controller;

import com.veelearn.api.dto.AuthDtos;
import com.veelearn.api.dto.UserDto;
import com.veelearn.api.security.UserPrincipal;
import com.veelearn.api.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
        @Valid @RequestBody AuthDtos.RegisterRequest req,
        HttpServletResponse response
    ) {
        UserDto user = authService.register(req, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("user", user));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
        @Valid @RequestBody AuthDtos.LoginRequest req,
        HttpServletResponse response
    ) {
        UserDto user = authService.login(req, response);
        return ResponseEntity.ok(Map.of("user", user));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto user = authService.getMe(principal.getId());
        return ResponseEntity.ok(Map.of("user", user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }
}
