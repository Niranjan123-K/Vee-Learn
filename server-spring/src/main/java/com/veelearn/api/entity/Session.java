package com.veelearn.api.entity;

import com.veelearn.api.entity.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.OffsetDateTime;
import java.util.UUID;

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
    private User teacher;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "learner_id")
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
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
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
}
