package com.veelearn.api;

import com.veelearn.api.security.JwtTokenProvider;
import com.veelearn.api.service.EncryptionService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class VeeLearnCoreTests {

    @Test
    void testAesGcmEncryptionDecryption() {
        String key = "test-secret-key-that-is-long-enough-32-chars";
        EncryptionService service = new EncryptionService(key);

        String sampleToken = "1//04testRefreshToken_ABCXYZ123456";
        String encrypted = service.encrypt(sampleToken);

        assertNotNull(encrypted);
        assertTrue(encrypted.contains(":"), "Should contain IV and tag delimiters");
        String[] parts = encrypted.split(":");
        assertEquals(3, parts.length, "Should have 3 parts: iv, authTag, ciphertext");

        String decrypted = service.decrypt(encrypted);
        assertEquals(sampleToken, decrypted, "Decrypted text should match original");
    }

    @Test
    void testJwtTokenProvider() {
        String secret = "super-secret-jwt-key-must-be-at-least-256-bits-long-for-hs256!";
        JwtTokenProvider provider = new JwtTokenProvider(secret, 3600000);

        UUID userId = UUID.randomUUID();
        String email = "student@example.edu";
        String name = "Test User";

        String token = provider.generateToken(userId, email, name);
        assertNotNull(token);
        assertTrue(provider.validateToken(token));

        Claims claims = provider.getClaimsFromToken(token);
        assertEquals(userId.toString(), claims.get("id", String.class));
        assertEquals(email, claims.get("email", String.class));
        assertEquals(name, claims.get("name", String.class));
    }

    @Test
    void testBCryptPasswordHashing() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String rawPassword = "securePassword123!";
        String hash = encoder.encode(rawPassword);

        assertNotNull(hash);
        assertTrue(encoder.matches(rawPassword, hash));
        assertFalse(encoder.matches("wrongPassword", hash));
    }
}
