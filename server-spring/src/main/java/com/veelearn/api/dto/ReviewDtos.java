package com.veelearn.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

public class ReviewDtos {

    @Data
    public static class CreateReviewRequest {
        @NotNull(message = "session_id is required.")
        private UUID session_id;

        @NotNull(message = "rating is required.")
        @Min(value = 1, message = "Rating must be between 1 and 5.")
        @Max(value = 5, message = "Rating must be between 1 and 5.")
        private Integer rating;

        private String comment;
    }
}
