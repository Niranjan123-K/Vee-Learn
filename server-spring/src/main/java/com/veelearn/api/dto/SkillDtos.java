package com.veelearn.api.dto;

import lombok.Data;

import java.util.UUID;

public class SkillDtos {

    @Data
    public static class AddUserSkillRequest {
        private UUID skill_id;
        private String skill_name;
        private String category;
        private String type; // 'teach' or 'learn'
        private String proficiency; // 'beginner', 'intermediate', 'expert'
        private String description;
    }
}
