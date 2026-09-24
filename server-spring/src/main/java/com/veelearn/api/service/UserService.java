package com.veelearn.api.service;

import com.veelearn.api.dto.UserDto;
import com.veelearn.api.entity.User;
import com.veelearn.api.entity.UserSkill;
import com.veelearn.api.exception.ResourceNotFoundException;
import com.veelearn.api.repository.ReviewRepository;
import com.veelearn.api.repository.SessionRepository;
import com.veelearn.api.repository.UserRepository;
import com.veelearn.api.repository.UserSkillRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final ReviewRepository reviewRepository;
    private final SessionRepository sessionRepository;

    @PersistenceContext
    private final EntityManager entityManager;

    public UserDto getProfile(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        List<UserSkill> skills = userSkillRepository.findByUserIdWithSkill(id);
        Double avgRating = reviewRepository.getAverageRatingForUser(id);
        long reviewCount = reviewRepository.countByRevieweeId(id);
        int totalSessions = sessionRepository.countCompletedSessionsForUser(id);

        List<Map<String, Object>> skillMaps = skills.stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("type", s.getType().name());
            m.put("proficiency", s.getProficiency().name());
            m.put("description", s.getDescription());
            m.put("skill_id", s.getSkill().getId());
            m.put("skill_name", s.getSkill().getName());
            m.put("category", s.getSkill().getCategory());
            return m;
        }).toList();

        return UserDto.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .bio(user.getBio())
            .avatar_url(user.getAvatarUrl())
            .wallpaper_url(user.getWallpaperUrl())
            .course_tag(user.getCourseTag())
            .credit_balance(user.getCreditBalance())
            .experience_level(user.getExperienceLevel())
            .preferred_language(user.getPreferredLanguage())
            .location(user.getLocation())
            .availability(user.getAvailability())
            .title(user.getTitle())
            .department(user.getDepartment())
            .education(user.getEducation())
            .hourly_rate(user.getHourlyRate())
            .languages(user.getLanguages())
            .custom_availability(user.getCustomAvailability())
            .profile_completed(user.getProfileCompleted())
            .created_at(user.getCreatedAt())
            .skills(skillMaps)
            .avg_rating(Math.round(avgRating * 100.0) / 100.0)
            .review_count((int) reviewCount)
            .total_sessions(totalSessions)
            .build();
    }

    @Transactional
    public User updateProfile(UUID userId, Map<String, Object> updates) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (updates.containsKey("name") && updates.get("name") != null) user.setName((String) updates.get("name"));
        if (updates.containsKey("bio")) user.setBio((String) updates.get("bio"));
        if (updates.containsKey("avatar_url")) user.setAvatarUrl((String) updates.get("avatar_url"));
        if (updates.containsKey("wallpaper_url")) user.setWallpaperUrl((String) updates.get("wallpaper_url"));
        if (updates.containsKey("experience_level")) user.setExperienceLevel((String) updates.get("experience_level"));
        if (updates.containsKey("preferred_language")) user.setPreferredLanguage((String) updates.get("preferred_language"));
        if (updates.containsKey("location")) user.setLocation((String) updates.get("location"));
        if (updates.containsKey("availability")) user.setAvailability((String) updates.get("availability"));
        if (updates.containsKey("title")) user.setTitle((String) updates.get("title"));
        if (updates.containsKey("department")) user.setDepartment((String) updates.get("department"));
        if (updates.containsKey("education")) user.setEducation((String) updates.get("education"));
        if (updates.containsKey("hourly_rate")) user.setHourlyRate(String.valueOf(updates.get("hourly_rate")));
        if (updates.containsKey("languages")) user.setLanguages((String) updates.get("languages"));
        if (updates.containsKey("custom_availability")) user.setCustomAvailability((String) updates.get("custom_availability"));

        return userRepository.save(user);
    }

    @Transactional
    public User completeOnboarding(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        user.setProfileCompleted(true);
        return userRepository.save(user);
    }

    public List<Map<String, Object>> getLeaderboard(int limit) {
        List<Object[]> raw = userRepository.findLeaderboardRaw(Math.min(limit > 0 ? limit : 20, 50));
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : raw) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r[0]);
            m.put("name", r[1]);
            m.put("avatar_url", r[2]);
            m.put("sessions_completed", r[3]);
            m.put("avg_rating", r[4]);
            result.add(m);
        }
        return result;
    }

    public List<Map<String, Object>> getTeachers(
        UUID currentUserId, String q, String category, String experienceLevel,
        Double minRating, String availability, String language, String sort, int limit
    ) {
        StringBuilder sql = new StringBuilder("""
            SELECT
              u.id AS _id, u.id, u.name, u.avatar_url, u.bio, u.experience_level, u.credit_balance, u.created_at, u.availability, u.preferred_language,
              COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE reviewee_id = u.id), 0) AS averageRating,
              (SELECT COUNT(*)::INT FROM sessions WHERE teacher_id = u.id AND status = 'completed') AS sessionsCompleted,
              (
                SELECT COALESCE(json_agg(json_build_object('name', sk.name, 'category', sk.category)), '[]'::json)
                FROM user_skills usk
                JOIN skills sk ON sk.id = usk.skill_id
                WHERE usk.user_id = u.id AND usk.type = 'teach'
              )::TEXT AS skills_offered
            FROM users u
            WHERE u.profile_completed = true
              AND EXISTS (SELECT 1 FROM user_skills usk WHERE usk.user_id = u.id AND usk.type = 'teach')
        """);

        Map<String, Object> params = new HashMap<>();

        if (currentUserId != null) {
            sql.append(" AND u.id != :currentUserId ");
            params.put("currentUserId", currentUserId);
        }

        if (q != null && !q.isBlank()) {
            sql.append("""
              AND (u.name ILIKE :q OR EXISTS (
                SELECT 1 FROM user_skills usq JOIN skills sq ON sq.id = usq.skill_id 
                WHERE usq.user_id = u.id AND usq.type = 'teach' AND (sq.name ILIKE :q OR sq.category ILIKE :q)
              ))
            """);
            params.put("q", "%" + q + "%");
        }

        if (category != null && !category.equalsIgnoreCase("All")) {
            sql.append("""
              AND EXISTS (
                SELECT 1 FROM user_skills usc JOIN skills sc ON sc.id = usc.skill_id 
                WHERE usc.user_id = u.id AND usc.type = 'teach' AND sc.category = :category
              )
            """);
            params.put("category", category);
        }

        if (experienceLevel != null && !experienceLevel.equalsIgnoreCase("all")) {
            sql.append(" AND u.experience_level = :experienceLevel ");
            params.put("experienceLevel", experienceLevel);
        }

        if (availability != null && !availability.equalsIgnoreCase("all")) {
            sql.append(" AND u.availability = :availability ");
            params.put("availability", availability);
        }

        if (language != null && !language.equalsIgnoreCase("all")) {
            sql.append(" AND u.preferred_language = :language ");
            params.put("language", language);
        }

        String finalSql = sql.toString();
        if (minRating != null) {
            finalSql = "SELECT * FROM (" + finalSql + ") AS t WHERE t.averageRating >= :minRating ";
            params.put("minRating", minRating);
        }

        // Sorting
        if ("rating_desc".equals(sort)) {
            finalSql += " ORDER BY averageRating DESC ";
        } else if ("sessions_desc".equals(sort)) {
            finalSql += " ORDER BY sessionsCompleted DESC ";
        } else if ("newest".equals(sort)) {
            finalSql += " ORDER BY created_at DESC ";
        } else if ("alpha_asc".equals(sort)) {
            finalSql += " ORDER BY name ASC ";
        } else {
            finalSql += " ORDER BY averageRating DESC ";
        }

        finalSql += " LIMIT :limit ";
        params.put("limit", Math.min(limit > 0 ? limit : 50, 100));

        Query query = entityManager.createNativeQuery(finalSql);
        params.forEach(query::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("_id", row[0]);
            m.put("id", row[1]);
            m.put("name", row[2]);
            m.put("avatar_url", row[3]);
            m.put("bio", row[4]);
            m.put("experience_level", row[5]);
            m.put("credit_balance", row[6]);
            m.put("created_at", row[7]);
            m.put("availability", row[8]);
            m.put("preferred_language", row[9]);
            m.put("averageRating", row[10]);
            m.put("sessionsCompleted", row[11]);
            m.put("skills_offered", row[12]);
            result.add(m);
        }

        return result;
    }
}
