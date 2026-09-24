package com.veelearn.api.service;

import com.veelearn.api.dto.AuthDtos;
import com.veelearn.api.dto.UserDto;
import com.veelearn.api.entity.GoogleIntegration;
import com.veelearn.api.entity.User;
import com.veelearn.api.exception.BadRequestException;
import com.veelearn.api.exception.ConflictException;
import com.veelearn.api.exception.ResourceNotFoundException;
import com.veelearn.api.repository.GoogleIntegrationRepository;
import com.veelearn.api.repository.UserRepository;
import com.veelearn.api.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final GoogleIntegrationRepository googleIntegrationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final CreditLedgerService creditLedgerService;

    @Value("${app.credits.initial:3}")
    private int initialCredits;

    public void setAuthCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("token", token)
            .httpOnly(true)
            .secure(false) // Set to true behind production HTTPS
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofDays(1))
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearAuthCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("token", "")
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @Transactional
    public UserDto register(AuthDtos.RegisterRequest req, HttpServletResponse response) {
        String email = req.getEmail().toLowerCase().trim();
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ConflictException("Email already registered.");
        }

        boolean isEdu = email.endsWith(".edu");
        String courseTag = isEdu ? "Student" : "Guest Campus";

        String hash = passwordEncoder.encode(req.getPassword());

        User user = User.builder()
            .name(req.getName().trim())
            .email(email)
            .passwordHash(hash)
            .courseTag(courseTag)
            .creditBalance(BigDecimal.ZERO)
            .heldBalance(BigDecimal.ZERO)
            .build();

        User saved = userRepository.save(user);

        // Grant initial welcome credits
        creditLedgerService.grantBonusCredits(saved.getId(), BigDecimal.valueOf(initialCredits), "Welcome bonus credits");
        saved.setCreditBalance(BigDecimal.valueOf(initialCredits));

        String token = tokenProvider.generateToken(saved.getId(), saved.getEmail(), saved.getName());
        setAuthCookie(response, token);

        return toDto(saved, false);
    }

    public UserDto login(AuthDtos.LoginRequest req, HttpServletResponse response) {
        String email = req.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new BadRequestException("Invalid email or password."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password.");
        }

        boolean isGoogleConnected = googleIntegrationRepository.findByUserId(user.getId())
            .map(gi -> "CONNECTED".equals(gi.getStatus()) && gi.getRefreshToken() != null)
            .orElse(false);

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getName());
        setAuthCookie(response, token);

        return toDto(user, isGoogleConnected);
    }

    public UserDto getMe(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        boolean isGoogleConnected = googleIntegrationRepository.findByUserId(user.getId())
            .map(gi -> "CONNECTED".equals(gi.getStatus()) && gi.getRefreshToken() != null)
            .orElse(false);

        return toDto(user, isGoogleConnected);
    }

    public void logout(HttpServletResponse response) {
        clearAuthCookie(response);
    }

    private UserDto toDto(User u, boolean isGoogleConnected) {
        return UserDto.builder()
            .id(u.getId())
            .name(u.getName())
            .email(u.getEmail())
            .bio(u.getBio())
            .avatar_url(u.getAvatarUrl())
            .wallpaper_url(u.getWallpaperUrl())
            .course_tag(u.getCourseTag())
            .credit_balance(u.getCreditBalance())
            .experience_level(u.getExperienceLevel())
            .preferred_language(u.getPreferredLanguage())
            .location(u.getLocation())
            .availability(u.getAvailability())
            .profile_completed(u.getProfileCompleted())
            .created_at(u.getCreatedAt())
            .isGoogleConnected(isGoogleConnected)
            .build();
    }
}
