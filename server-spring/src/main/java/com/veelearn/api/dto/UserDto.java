package com.veelearn.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String name;
    private String email;
    private String bio;
    private String avatar_url;
    private String wallpaper_url;
    private String course_tag;
    private BigDecimal credit_balance;
    private BigDecimal held_balance;
    private String experience_level;
    private String preferred_language;
    private String location;
    private String availability;
    private String title;
    private String department;
    private String education;
    private String hourly_rate;
    private String languages;
    private String custom_availability;
    private Boolean profile_completed;
    private OffsetDateTime created_at;
    private Boolean isGoogleConnected;
    private Object skills;
    private Double avg_rating;
    private Integer review_count;
    private Integer total_sessions;
}
