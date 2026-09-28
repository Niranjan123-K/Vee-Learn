package com.veelearn.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

public class SessionDtos {

    @Data
    public static class CreateSessionRequest {
        @NotNull(message = "teacher_id is required.")
        private UUID teacher_id;

        @NotNull(message = "skill_id is required.")
        private UUID skill_id;

        @NotNull(message = "scheduled_at is required.")
        private OffsetDateTime scheduled_at;

        private Integer duration_minutes;
        private String notes;
    }

    @Data
    public static class UpdateMeetingLinkRequest {
        @NotNull(message = "meeting_link is required.")
        private String meeting_link;
    }
}
