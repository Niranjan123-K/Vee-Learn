package com.veelearn.api.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.veelearn.api.entity.GoogleIntegration;
import com.veelearn.api.entity.User;
import com.veelearn.api.repository.GoogleIntegrationRepository;
import com.veelearn.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final GoogleIntegrationRepository googleIntegrationRepository;
    private final UserRepository userRepository;
    private final EncryptionService encryptionService;

    @Value("${app.google.client-id:}")
    private String clientId;

    @Value("${app.google.client-secret:}")
    private String clientSecret;

    @Value("${app.google.redirect-uri:http://localhost:5000/api/google/callback}")
    private String redirectUri;

    private static final List<String> SCOPES = Arrays.asList(
        "https://www.googleapis.com/auth/calendar.events",
        "openid",
        "email"
    );

    public String getAuthUrl(UUID userId) {
        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
            new NetHttpTransport(),
            GsonFactory.getDefaultInstance(),
            clientId,
            clientSecret,
            SCOPES
        ).setAccessType("offline").build();

        return flow.newAuthorizationUrl()
            .setRedirectUri(redirectUri)
            .setState(userId.toString())
            .set("prompt", "consent")
            .build();
    }

    public void handleCallbackAndStore(String code, UUID userId) throws IOException {
        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
            new NetHttpTransport(),
            GsonFactory.getDefaultInstance(),
            clientId,
            clientSecret,
            SCOPES
        ).setAccessType("offline").build();

        GoogleTokenResponse tokenResponse = flow.newTokenRequest(code)
            .setRedirectUri(redirectUri)
            .execute();

        String refreshToken = tokenResponse.getRefreshToken();
        if (refreshToken == null) {
            log.warn("No refresh token received from Google OAuth for user {}", userId);
            return;
        }

        String encrypted = encryptionService.encrypt(refreshToken);
        User user = userRepository.findById(userId).orElseThrow();

        GoogleIntegration integration = googleIntegrationRepository.findByUserId(userId)
            .orElse(GoogleIntegration.builder().user(user).build());

        integration.setRefreshToken(encrypted);
        integration.setStatus("CONNECTED");
        googleIntegrationRepository.save(integration);
    }
}
