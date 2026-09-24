package com.veelearn.api.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MatchingService {

    @PersistenceContext
    private final EntityManager entityManager;

    public List<Map<String, Object>> findTeachersForSkill(UUID skillId, UUID currentUserId) {
        String sql = """
            WITH teacher_stats AS (
              SELECT
                u.id,
                u.name,
                u.email,
                u.bio,
                u.avatar_url,
                u.credit_balance,
                us.proficiency,
                us.description AS skill_description,
                COALESCE(
                  (SELECT AVG(r.rating)::NUMERIC(3,2) FROM reviews r WHERE r.reviewee_id = u.id),
                  0
                ) AS avg_rating,
                (SELECT COUNT(*) FROM sessions s
                 WHERE s.teacher_id = u.id AND s.status = 'completed')::INT AS total_sessions,
                CASE WHEN u.bio IS NOT NULL AND u.bio != '' THEN 0.4 ELSE 0 END +
                CASE WHEN u.avatar_url IS NOT NULL AND u.avatar_url != '' THEN 0.3 ELSE 0 END +
                CASE WHEN (SELECT COUNT(*) FROM user_skills us2
                            WHERE us2.user_id = u.id AND us2.type = 'teach') >= 2
                     THEN 0.3 ELSE 0 END
                AS profile_completeness
              FROM users u
              JOIN user_skills us ON us.user_id = u.id
              WHERE us.skill_id = :skillId
                AND us.type = 'teach'
                AND u.id != :currentUserId
            )
            SELECT
              id, name, email, bio, avatar_url, credit_balance, proficiency, skill_description,
              avg_rating, total_sessions, profile_completeness,
              (
                (avg_rating / 5.0 * 40) +
                (LEAST(total_sessions, 50)::NUMERIC / 50.0 * 30) +
                (profile_completeness * 30)
              ) AS match_score
            FROM teacher_stats
            ORDER BY match_score DESC
            LIMIT 20
        """;

        Query nativeQuery = entityManager.createNativeQuery(sql);
        nativeQuery.setParameter("skillId", skillId);
        nativeQuery.setParameter("currentUserId", currentUserId);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = nativeQuery.getResultList();
        List<Map<String, Object>> results = new ArrayList<>();

        for (Object[] row : rows) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", row[0]);
            map.put("name", row[1]);
            map.put("email", row[2]);
            map.put("bio", row[3]);
            map.put("avatar_url", row[4]);
            map.put("credit_balance", row[5]);
            map.put("proficiency", row[6]);
            map.put("skill_description", row[7]);
            map.put("avg_rating", row[8]);
            map.put("total_sessions", row[9]);
            map.put("profile_completeness", row[10]);
            map.put("match_score", row[11]);
            results.add(map);
        }

        return results;
    }
}
