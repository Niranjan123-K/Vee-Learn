package com.veelearn.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

public class MessageDtos {

    @Data
    public static class SendMessageRequest {
        @NotNull(message = "Valid receiver_id is required.")
        private UUID receiver_id;

        @NotBlank(message = "Message content is required.")
        private String content;
    }
}
