package com.veelearn.api.controller;

import com.veelearn.api.security.UserPrincipal;
import com.veelearn.api.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(analyticsService.getDashboardStats(principal.getId()));
    }

    @GetMapping("/activity")
    public ResponseEntity<Map<String, Object>> getActivity(@AuthenticationPrincipal UserPrincipal principal) {
        List<Map<String, Object>> activity = analyticsService.getActivityData(principal.getId());
        return ResponseEntity.ok(Map.of("activity", activity));
    }
}
