package com.veelearn.api.service;

import com.veelearn.api.dto.SkillDtos;
import com.veelearn.api.entity.Skill;
import com.veelearn.api.entity.User;
import com.veelearn.api.entity.UserSkill;
import com.veelearn.api.entity.enums.ProficiencyLevel;
import com.veelearn.api.entity.enums.SkillType;
import com.veelearn.api.exception.BadRequestException;
import com.veelearn.api.exception.ResourceNotFoundException;
import com.veelearn.api.repository.SkillRepository;
import com.veelearn.api.repository.UserRepository;
import com.veelearn.api.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getAllSkillsGrouped() {
        List<Skill> all = skillRepository.findAllByOrderByCategoryAscNameAsc();
        Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();

        for (Skill s : all) {
            grouped.computeIfAbsent(s.getCategory(), k -> new ArrayList<>())
                .add(Map.of("id", s.getId(), "name", s.getName()));
        }

        return Map.of("skills", grouped, "all", all);
    }

    @Transactional
    public UserSkill addUserSkill(UUID userId, SkillDtos.AddUserSkillRequest req) {
        if (req.getType() == null || (req.getSkill_id() == null && req.getSkill_name() == null)) {
            throw new BadRequestException("Missing required fields: type, and either skill_id or skill_name.");
        }

        SkillType skillType;
        try {
            skillType = SkillType.valueOf(req.getType().toLowerCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("type must be 'teach' or 'learn'.");
        }

        ProficiencyLevel proficiency = ProficiencyLevel.beginner;
        if (req.getProficiency() != null && !req.getProficiency().isBlank()) {
            try {
                proficiency = ProficiencyLevel.valueOf(req.getProficiency().toLowerCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("proficiency must be 'beginner', 'intermediate', or 'expert'.");
            }
        }

        Skill skill;
        if (req.getSkill_id() != null) {
            skill = skillRepository.findById(req.getSkill_id())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found."));
        } else {
            String name = req.getSkill_name().trim();
            String category = req.getCategory() != null ? req.getCategory().trim() : "Other";
            skill = skillRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> skillRepository.save(Skill.builder().name(name).category(category).build()));
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        final ProficiencyLevel finalProficiency = proficiency;
        UserSkill userSkill = userSkillRepository.findByUserIdAndSkillIdAndType(userId, skill.getId(), skillType)
            .map(existing -> {
                existing.setProficiency(finalProficiency);
                existing.setDescription(req.getDescription() != null ? req.getDescription() : "");
                return existing;
            })
            .orElseGet(() -> UserSkill.builder()
                .user(user)
                .skill(skill)
                .type(skillType)
                .proficiency(finalProficiency)
                .description(req.getDescription() != null ? req.getDescription() : "")
                .build());

        return userSkillRepository.save(userSkill);
    }

    @Transactional
    public void removeUserSkill(UUID id, UUID userId) {
        int deleted = userSkillRepository.deleteByIdAndUserId(id, userId);
        if (deleted == 0) {
            throw new ResourceNotFoundException("User skill not found or not yours.");
        }
    }

    public List<UserSkill> getUserSkills(UUID userId) {
        return userSkillRepository.findByUserIdWithSkill(userId);
    }
}
