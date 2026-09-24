package com.veelearn.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String bio = "";

    @Column(name = "avatar_url", length = 512)
    @Builder.Default
    private String avatarUrl = "";

    @Column(name = "wallpaper_url", length = 512)
    @Builder.Default
    private String wallpaperUrl = "";

    @Column(name = "course_tag", length = 50)
    @Builder.Default
    private String courseTag = "";

    @Column(name = "credit_balance", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal creditBalance = BigDecimal.ZERO;

    @Column(name = "held_balance", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal heldBalance = BigDecimal.ZERO;

    @Column(name = "experience_level", length = 50)
    @Builder.Default
    private String experienceLevel = "";

    @Column(name = "preferred_language", length = 50)
    @Builder.Default
    private String preferredLanguage = "";

    @Column(length = 150)
    @Builder.Default
    private String location = "";

    @Column(length = 100)
    @Builder.Default
    private String availability = "";

    @Column(length = 255)
    @Builder.Default
    private String title = "";

    @Column(length = 255)
    @Builder.Default
    private String department = "";

    @Column(length = 255)
    @Builder.Default
    private String education = "";

    @Column(name = "hourly_rate", length = 50)
    @Builder.Default
    private String hourlyRate = "";

    @Column(length = 255)
    @Builder.Default
    private String languages = "";

    @Column(name = "custom_availability", columnDefinition = "TEXT")
    @Builder.Default
    private String customAvailability = "";

    @Column(name = "profile_completed")
    @Builder.Default
    private Boolean profileCompleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserSkill> skills = new ArrayList<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private GoogleIntegration googleIntegration;
}
