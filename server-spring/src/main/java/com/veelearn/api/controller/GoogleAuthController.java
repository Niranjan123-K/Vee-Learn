package com.veelearn.api.controller;

import com.veelearn.api.security.UserPrincipal;
import com.veelearn.api.service.GoogleAuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/google")
@RequiredArgsConstructor
public class GoogleAuthController {

    private final GoogleAuthService googleAuthService;

    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String clientUrl;

    @GetMapping("/auth-url")
    public ResponseEntity<Map<String, String>> getAuthUrl(@AuthenticationPrincipal UserPrincipal principal) {
        String url = googleAuthService.getAuthUrl(principal.getId());
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/callback")
    public void handleCallback(
        @RequestParam(required = false) String code,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String error,
        HttpServletResponse response
    ) throws IOException {
        if (error != null) {
            log.error("[GoogleAuth] OAuth Error: {}", error);
            response.sendRedirect(clientUrl + "/dashboard?google_auth=error");
            return;
        }

        if (code == null || state == null) {
            response.sendRedirect(clientUrl + "/dashboard?google_auth=error");
            return;
        }

        try {
            UUID userId = UUID.fromString(state);
            googleAuthService.handleCallbackAndStore(code, userId);
            response.sendRedirect(clientUrl + "/dashboard?google_auth=success");
        } catch (Exception e) {
            log.error("[GoogleAuth] Callback error: {}", e.getMessage());
            response.sendRedirect(clientUrl + "/dashboard?google_auth=error");
        }
    }
}
