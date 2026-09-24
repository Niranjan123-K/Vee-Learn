package com.veelearn.api.service;

import com.veelearn.api.entity.CreditTransaction;
import com.veelearn.api.entity.Session;
import com.veelearn.api.entity.User;
import com.veelearn.api.entity.enums.SkillType;
import com.veelearn.api.exception.ResourceNotFoundException;
import com.veelearn.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final CreditTransactionRepository transactionRepository;
    private final SessionRepository sessionRepository;
    private final ReviewRepository reviewRepository;
    private final UserSkillRepository userSkillRepository;

    public Map<String, Object> getDashboardStats(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        BigDecimal earned = transactionRepository.sumTotalEarnedForUser(userId);
        BigDecimal spent = transactionRepository.sumTotalSpentForUser(userId);

        int completedCount = sessionRepository.countCompletedSessionsForUser(userId);
        int upcomingCount = sessionRepository.countUpcomingSessionsForUser(userId, OffsetDateTime.now());

        Double avgRating = reviewRepository.getAverageRatingForUser(userId);

        long teachingCount = userSkillRepository.countByUserIdAndType(userId, SkillType.teach);
        long learningCount = userSkillRepository.countByUserIdAndType(userId, SkillType.learn);

        List<CreditTransaction> recentTxs = transactionRepository.findRecentTransactionsForUser(userId);
        List<Session> recentSessions = sessionRepository.findRecentSessionsForUser(userId);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("credit_balance", user.getCreditBalance());
        stats.put("total_earned", earned);
        stats.put("total_spent", spent);
        stats.put("sessions_completed", completedCount);
        stats.put("sessions_upcoming", upcomingCount);
        stats.put("avg_rating", Math.round(avgRating * 100.0) / 100.0);
        stats.put("skills_teaching_count", (int) teachingCount);
        stats.put("skills_learning_count", (int) learningCount);
        stats.put("recent_transactions", recentTxs);
        stats.put("recent_sessions", recentSessions);

        return stats;
    }

    public List<Map<String, Object>> getActivityData(UUID userId) {
        List<Object[]> raw = sessionRepository.findActivityByMonthRaw(userId);
        List<Map<String, Object>> list = new ArrayList<>();

        for (Object[] r : raw) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", r[0]);
            m.put("session_count", r[1]);
            m.put("completed_count", r[2]);
            list.add(m);
        }

        return list;
    }
}
