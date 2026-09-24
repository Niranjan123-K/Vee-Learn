package com.veelearn.api.repository;

import com.veelearn.api.entity.CreditTransaction;
import com.veelearn.api.entity.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, UUID> {

    @Query("""
        SELECT ct FROM CreditTransaction ct
        LEFT JOIN FETCH ct.fromUser fu
        JOIN FETCH ct.toUser tu
        WHERE ct.fromUser.id = :userId OR ct.toUser.id = :userId
        ORDER BY ct.createdAt DESC
    """)
    Page<CreditTransaction> findByUserIdAll(@Param("userId") UUID userId, Pageable pageable);

    @Query("""
        SELECT ct FROM CreditTransaction ct
        LEFT JOIN FETCH ct.fromUser fu
        JOIN FETCH ct.toUser tu
        WHERE (ct.fromUser.id = :userId OR ct.toUser.id = :userId) AND ct.type = :type
        ORDER BY ct.createdAt DESC
    """)
    Page<CreditTransaction> findByUserIdAndType(@Param("userId") UUID userId, @Param("type") TransactionType type, Pageable pageable);

    @Query("""
        SELECT COALESCE(SUM(ct.amount), 0) FROM CreditTransaction ct
        WHERE ct.toUser.id = :userId AND ct.type IN (
            com.veelearn.api.entity.enums.TransactionType.earn,
            com.veelearn.api.entity.enums.TransactionType.bonus,
            com.veelearn.api.entity.enums.TransactionType.refund
        )
    """)
    BigDecimal sumTotalEarnedForUser(@Param("userId") UUID userId);

    @Query("""
        SELECT COALESCE(SUM(ct.amount), 0) FROM CreditTransaction ct
        WHERE ct.fromUser.id = :userId AND ct.type = com.veelearn.api.entity.enums.TransactionType.spend
    """)
    BigDecimal sumTotalSpentForUser(@Param("userId") UUID userId);

    @Query("""
        SELECT ct FROM CreditTransaction ct
        LEFT JOIN FETCH ct.fromUser
        JOIN FETCH ct.toUser
        WHERE ct.fromUser.id = :userId OR ct.toUser.id = :userId
        ORDER BY ct.createdAt DESC
        LIMIT 5
    """)
    List<CreditTransaction> findRecentTransactionsForUser(@Param("userId") UUID userId);
}
