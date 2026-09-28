package com.veelearn.api.entity;

import com.veelearn.api.entity.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.OffsetDateTime;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "teacher_id")
    @JsonIgnoreProperties({"skills", "googleIntegration"})
    private User teacher;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "learner_id")
    @JsonIgnoreProperties({"skills", "googleIntegration"})
    private User learner;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Column(name = "scheduled_at", nullable = false)
    private OffsetDateTime scheduledAt;

    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private Integer durationMinutes = 60;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "session_status")
    @Builder.Default
    private SessionStatus status = SessionStatus.pending;

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String notes = "";

    @Column(name = "meeting_link", length = 512)
    private String meetingLink;

    @Column(name = "calendar_event_id", length = 255)
    private String calendarEventId;

    @Column(name = "meeting_provider", length = 50)
    @Builder.Default
    private String meetingProvider = "JITSI";

    @Column(name = "meeting_status", length = 50)
    @Builder.Default
    private String meetingStatus = "NOT_CREATED";

    @Column(name = "meeting_created_at")
    private OffsetDateTime meetingCreatedAt;

    @Column(name = "teacher_completion_confirmed")
    @Builder.Default
    private Boolean teacherCompletionConfirmed = false;

    @Column(name = "learner_completion_confirmed")
    @Builder.Default
    private Boolean learnerCompletionConfirmed = false;

    @Column(name = "teacher_completed_at")
    private OffsetDateTime teacherCompletedAt;

    @Column(name = "learner_completed_at")
    private OffsetDateTime learnerCompletedAt;

    @Column(name = "credits_transferred")
    @Builder.Default
    private Boolean creditsTransferred = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @JsonProperty("teacher_id")
    public UUID getTeacherId() {
        return teacher != null ? teacher.getId() : null;
    }

    @JsonProperty("learner_id")
    public UUID getLearnerId() {
        return learner != null ? learner.getId() : null;
    }

    @JsonProperty("teacher_name")
    public String getTeacherName() {
        return teacher != null ? teacher.getName() : null;
    }

    @JsonProperty("learner_name")
    public String getLearnerName() {
        return learner != null ? learner.getName() : null;
    }
}
