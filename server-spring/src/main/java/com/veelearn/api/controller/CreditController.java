package com.veelearn.api.controller;

import com.veelearn.api.entity.CreditTransaction;
import com.veelearn.api.entity.User;
import com.veelearn.api.entity.enums.TransactionType;
import com.veelearn.api.exception.ResourceNotFoundException;
import com.veelearn.api.repository.CreditTransactionRepository;
import com.veelearn.api.repository.UserRepository;
import com.veelearn.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/credits")
@RequiredArgsConstructor
public class CreditController {

    private final UserRepository userRepository;
    private final CreditTransactionRepository transactionRepository;

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getBalance(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        return ResponseEntity.ok(Map.of("balance", user.getCreditBalance()));
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getHistory(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String type,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.min(limit > 0 ? limit : 20, 100));

        Page<CreditTransaction> txPage;
        if (type != null && !type.isBlank()) {
            TransactionType txType = TransactionType.valueOf(type.toLowerCase());
            txPage = transactionRepository.findByUserIdAndType(principal.getId(), txType, pageRequest);
        } else {
            txPage = transactionRepository.findByUserIdAll(principal.getId(), pageRequest);
        }

        return ResponseEntity.ok(Map.of(
            "transactions", txPage.getContent(),
            "pagination", Map.of(
                "page", page,
                "limit", limit,
                "total", txPage.getTotalElements()
            )
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        BigDecimal earned = transactionRepository.sumTotalEarnedForUser(principal.getId());
        BigDecimal spent = transactionRepository.sumTotalSpentForUser(principal.getId());

        return ResponseEntity.ok(Map.of(
            "balance", user.getCreditBalance(),
            "total_earned", earned,
            "total_spent", spent
        ));
    }
}
