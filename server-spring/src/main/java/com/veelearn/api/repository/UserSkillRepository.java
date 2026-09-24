package com.veelearn.api.repository;

import com.veelearn.api.entity.UserSkill;
import com.veelearn.api.entity.enums.SkillType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, UUID> {

    @Query("SELECT us FROM UserSkill us JOIN FETCH us.skill WHERE us.user.id = :userId ORDER BY us.type, us.skill.category, us.skill.name")
    List<UserSkill> findByUserIdWithSkill(@Param("userId") UUID userId);

    Optional<UserSkill> findByUserIdAndSkillIdAndType(UUID userId, UUID skillId, SkillType type);

    long countByUserIdAndType(UUID userId, SkillType type);

    int deleteByIdAndUserId(UUID id, UUID userId);
}
