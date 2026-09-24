package com.veelearn.api.service;

import com.veelearn.api.entity.CreditTransaction;
import com.veelearn.api.entity.Session;
import com.veelearn.api.entity.User;
import com.veelearn.api.entity.enums.TransactionType;
import com.veelearn.api.exception.BadRequestException;
import com.veelearn.api.exception.ResourceNotFoundException;
import com.veelearn.api.repository.CreditTransactionRepository;
import com.veelearn.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreditLedgerService {

    private final UserRepository userRepository;
    private final CreditTransactionRepository transactionRepository;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CreditTransaction grantBonusCredits(UUID userId, BigDecimal amount, String description) {
        User user = userRepository.findByIdForUpdate(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setCreditBalance(user.getCreditBalance().add(amount));
        userRepository.save(user);

        CreditTransaction tx = CreditTransaction.builder()
            .fromUser(null)
            .toUser(user)
            .amount(amount)
            .type(TransactionType.bonus)
            .description(description != null ? description : "Bonus credits")
            .build();

        return transactionRepository.save(tx);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void escrowCredits(UUID learnerId, BigDecimal amount) {
        User learner = userRepository.findByIdForUpdate(learnerId)
            .orElseThrow(() -> new ResourceNotFoundException("Learner user not found"));

        if (learner.getCreditBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient credits.");
        }

        learner.setCreditBalance(learner.getCreditBalance().subtract(amount));
        learner.setHeldBalance(learner.getHeldBalance().add(amount));
        userRepository.save(learner);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void refundEscrow(UUID learnerId, BigDecimal amount) {
        User learner = userRepository.findByIdForUpdate(learnerId)
            .orElseThrow(() -> new ResourceNotFoundException("Learner user not found"));

        learner.setHeldBalance(learner.getHeldBalance().subtract(amount));
        learner.setCreditBalance(learner.getCreditBalance().add(amount));
        userRepository.save(learner);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void finalizeEscrowTransfer(UUID learnerId, UUID teacherId, Session session, BigDecimal amount) {
        User learner = userRepository.findByIdForUpdate(learnerId)
            .orElseThrow(() -> new ResourceNotFoundException("Learner user not found"));
        User teacher = userRepository.findByIdForUpdate(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher user not found"));

        if (learner.getHeldBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Learner has insufficient credits to complete transaction.");
        }

        learner.setHeldBalance(learner.getHeldBalance().subtract(amount));
        teacher.setCreditBalance(teacher.getCreditBalance().add(amount));

        userRepository.save(learner);
        userRepository.save(teacher);

        CreditTransaction spendTx = CreditTransaction.builder()
            .fromUser(learner)
            .toUser(teacher)
            .session(session)
            .amount(amount)
            .type(TransactionType.spend)
            .description("Session payment")
            .build();
        transactionRepository.save(spendTx);

        CreditTransaction earnTx = CreditTransaction.builder()
            .fromUser(learner)
            .toUser(teacher)
            .session(session)
            .amount(amount)
            .type(TransactionType.earn)
            .description("Session earning")
            .build();
        transactionRepository.save(earnTx);
    }
}
