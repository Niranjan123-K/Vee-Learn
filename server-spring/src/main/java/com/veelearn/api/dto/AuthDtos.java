package com.veelearn.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDtos {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Name cannot be empty.")
        private String name;

        @NotBlank(message = "Email is required.")
        @Email(message = "Invalid email address.")
        private String email;

        @NotBlank(message = "Password is required.")
        @Size(min = 6, message = "Password must be at least 6 characters.")
        private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required.")
        private String email;

        @NotBlank(message = "Password is required.")
        private String password;
    }
}
