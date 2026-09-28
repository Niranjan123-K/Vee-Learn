package com.veelearn.api.service;

import com.veelearn.api.dto.SessionDtos;
import com.veelearn.api.entity.Session;
import com.veelearn.api.entity.SessionMessage;
import com.veelearn.api.entity.Skill;
import com.veelearn.api.entity.User;
import com.veelearn.api.entity.enums.SessionStatus;
import com.veelearn.api.exception.BadRequestException;
import com.veelearn.api.exception.ForbiddenException;
import com.veelearn.api.exception.ResourceNotFoundException;
import com.veelearn.api.repository.SessionMessageRepository;
import com.veelearn.api.repository.SessionRepository;
import com.veelearn.api.repository.SkillRepository;
import com.veelearn.api.repository.UserRepository;
import com.veelearn.api.websocket.SocketIOService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final SessionMessageRepository sessionMessageRepository;
    private final CreditLedgerService creditLedgerService;
    private final GoogleCalendarService googleCalendarService;
    private final SocketIOService socketIOService;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Session createSession(UUID learnerId, SessionDtos.CreateSessionRequest req) {
        UUID teacherId = req.getTeacher_id();
        if (learnerId.equals(teacherId)) {
            throw new BadRequestException("You cannot book a session with yourself.");
        }

        int duration = req.getDuration_minutes() != null && req.getDuration_minutes() > 0 ? req.getDuration_minutes() : 60;
        BigDecimal creditsNeeded = BigDecimal.valueOf((int) Math.ceil(duration / 60.0));

        OffsetDateTime scheduledAt = req.getScheduled_at();
        if (scheduledAt.isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("Cannot book a session in the past.");
        }

        OffsetDateTime endAt = scheduledAt.plusMinutes(duration);
        List<UUID> overlaps = sessionRepository.findOverlappingSessions(teacherId, learnerId, scheduledAt, endAt);
        if (!overlaps.isEmpty()) {
            throw new BadRequestException("There is a scheduling conflict with an existing session.");
        }

        // Atomic credit escrow
        creditLedgerService.escrowCredits(learnerId, creditsNeeded);

        User teacher = userRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found."));
        User learner = userRepository.findById(learnerId)
            .orElseThrow(() -> new ResourceNotFoundException("Learner not found."));
        Skill skill = skillRepository.findById(req.getSkill_id())
            .orElseThrow(() -> new ResourceNotFoundException("Skill not found."));

        Session session = Session.builder()
            .teacher(teacher)
            .learner(learner)
            .skill(skill)
            .scheduledAt(scheduledAt)
            .durationMinutes(duration)
            .notes(req.getNotes() != null ? req.getNotes() : "")
            .status(SessionStatus.pending)
            .build();

        Session saved = sessionRepository.save(session);

        // Notify teacher and learner via socket
        socketIOService.emitToUser(teacherId, "session_new", Map.of(
            "session", saved,
            "message", learner.getName() + " booked a session with you"
        ));
        socketIOService.emitToUser(learnerId, "session_new", Map.of(
            "session", saved,
            "message", "Session booked successfully"
        ));

        return saved;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Session confirmSession(UUID sessionId, UUID teacherId) {
        Session session = sessionRepository.findByIdForUpdate(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found."));

        if (!session.getTeacher().getId().equals(teacherId)) {
            throw new BadRequestException("Only the teacher can confirm a session.");
        }
        if (session.getStatus() != SessionStatus.pending) {
            throw new BadRequestException("Cannot confirm a session with status '" + session.getStatus() + "'.");
        }

        // Try Google Calendar, fallback to Jitsi Meet
        String googleMeetLink = googleCalendarService.createCalendarEventWithMeet(
            teacherId, session.getSkill().getName(), session.getTeacher().getName(),
            session.getLearner().getName(), session.getScheduledAt(), session.getDurationMinutes()
        );

        String meetingLink;
        String provider;
        if (googleMeetLink != null) {
            meetingLink = googleMeetLink;
            provider = "google_meet";
        } else {
            meetingLink = "https://meet.jit.si/veelearn-session-" + sessionId;
            provider = "JITSI";
        }

        session.setStatus(SessionStatus.confirmed);
        session.setMeetingLink(meetingLink);
        session.setMeetingProvider(provider);
        session.setMeetingStatus("CREATED");
        session.setMeetingCreatedAt(OffsetDateTime.now());

        Session saved = sessionRepository.save(session);

        socketIOService.emitToUser(session.getLearner().getId(), "session_updated", Map.of(
            "session", saved,
            "message", "Your session has been confirmed. A meeting room is ready.",
            "action", "confirmed"
        ));
        socketIOService.emitToUser(session.getTeacher().getId(), "session_updated", Map.of(
            "session", saved,
            "message", "Session confirmed and meeting link saved.",
            "action", "confirmed"
        ));

        return saved;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Session updateMeetingLink(UUID sessionId, UUID teacherId, String newMeetingLink) {
        Session session = sessionRepository.findByIdForUpdate(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found."));

        if (!session.getTeacher().getId().equals(teacherId)) {
            throw new ForbiddenException("Only the teacher can update the meeting link.");
        }

        if (newMeetingLink == null || newMeetingLink.isBlank()) {
            throw new BadRequestException("Meeting link cannot be empty.");
        }
        if (!newMeetingLink.startsWith("http://") && !newMeetingLink.startsWith("https://")) {
            throw new BadRequestException("Meeting link must be a valid URL starting with http:// or https://");
        }

        String provider = "CUSTOM";
        if (newMeetingLink.contains("meet.jit.si")) {
            provider = "JITSI";
        } else if (newMeetingLink.contains("meet.google.com")) {
            provider = "google_meet";
        } else if (newMeetingLink.contains("zoom.us")) {
            provider = "zoom";
        }

        session.setMeetingLink(newMeetingLink);
        session.setMeetingProvider(provider);
        // keep status unchanged
        
        Session saved = sessionRepository.save(session);

        socketIOService.emitToUser(session.getLearner().getId(), "session_updated", Map.of(
            "session", saved,
            "message", session.getTeacher().getName() + " updated the meeting link.",
            "action", "link_updated"
        ));

        return saved;
    }

    public String joinSession(UUID sessionId, UUID userId) {
        Session session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found."));

        if (!session.getTeacher().getId().equals(userId) && !session.getLearner().getId().equals(userId)) {
            throw new ForbiddenException("You are not a participant of this session.");
        }
        if (session.getStatus() != SessionStatus.confirmed) {
            throw new BadRequestException("Cannot join a session with status '" + session.getStatus() + "'.");
        }

        OffsetDateTime joinWindowStart = session.getScheduledAt().minusMinutes(15);
        if (OffsetDateTime.now().isBefore(joinWindowStart)) {
            throw new ForbiddenException("You can only join the session 15 minutes before it starts.");
        }

        return session.getMeetingLink();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Session rejectSession(UUID sessionId, UUID teacherId) {
        Session session = sessionRepository.findByIdForUpdate(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found."));

        if (!session.getTeacher().getId().equals(teacherId)) {
            throw new BadRequestException("Only the teacher can reject a session.");
        }
        if (session.getStatus() != SessionStatus.pending) {
            throw new BadRequestException("Cannot reject a session with status '" + session.getStatus() + "'.");
        }

        BigDecimal creditsToRefund = BigDecimal.valueOf((int) Math.ceil(session.getDurationMinutes() / 60.0));
        creditLedgerService.refundEscrow(session.getLearner().getId(), creditsToRefund);

        session.setStatus(SessionStatus.rejected);
        Session saved = sessionRepository.save(session);

        socketIOService.emitToUser(session.getLearner().getId(), "session_updated", Map.of(
            "session", saved,
            "message", session.getTeacher().getName() + " declined your session request",
            "action", "rejected"
        ));
        socketIOService.emitToUser(teacherId, "session_updated", Map.of(
            "session", saved,
            "message", "Session rejected",
            "action", "rejected"
        ));

        return saved;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Session completeSession(UUID sessionId, UUID userId) {
        Session session = sessionRepository.findByIdForUpdate(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found."));

        boolean isTeacher = session.getTeacher().getId().equals(userId);
        boolean isLearner = session.getLearner().getId().equals(userId);

        if (!isTeacher && !isLearner) {
            throw new ForbiddenException("Unauthorized to complete this session.");
        }
        if (session.getStatus() != SessionStatus.confirmed) {
            throw new BadRequestException("Cannot complete a session with status '" + session.getStatus() + "'.");
        }

        if (isTeacher && Boolean.TRUE.equals(session.getTeacherCompletionConfirmed())) {
            throw new BadRequestException("Already confirmed.");
        }
        if (isLearner && Boolean.TRUE.equals(session.getLearnerCompletionConfirmed())) {
            throw new BadRequestException("Already confirmed.");
        }

        if (isTeacher) {
            session.setTeacherCompletionConfirmed(true);
            session.setTeacherCompletedAt(OffsetDateTime.now());
        } else {
            session.setLearnerCompletionConfirmed(true);
            session.setLearnerCompletedAt(OffsetDateTime.now());
        }

        boolean bothConfirmed = Boolean.TRUE.equals(session.getTeacherCompletionConfirmed()) &&
                                Boolean.TRUE.equals(session.getLearnerCompletionConfirmed());

        if (bothConfirmed) {
            BigDecimal creditsToTransfer = BigDecimal.valueOf((int) Math.ceil(session.getDurationMinutes() / 60.0));
            creditLedgerService.finalizeEscrowTransfer(session.getLearner().getId(), session.getTeacher().getId(), session, creditsToTransfer);
            session.setStatus(SessionStatus.completed);
            session.setCreditsTransferred(true);
        }

        Session saved = sessionRepository.save(session);

        UUID otherUserId = isTeacher ? session.getLearner().getId() : session.getTeacher().getId();
        User currentUser = isTeacher ? session.getTeacher() : session.getLearner();

        if (bothConfirmed) {
            socketIOService.emitToUser(otherUserId, "session_updated", Map.of(
                "session", saved,
                "message", currentUser.getName() + " confirmed completion. Session completed!",
                "action", "completed"
            ));
            socketIOService.emitToUser(userId, "session_updated", Map.of(
                "session", saved,
                "message", "Session completed! Credits transferred.",
                "action", "completed"
            ));
        } else {
            socketIOService.emitToUser(otherUserId, "session_updated", Map.of(
                "session", saved,
                "message", currentUser.getName() + " marked the session as completed. Please confirm.",
                "action", "completion_requested"
            ));
            socketIOService.emitToUser(userId, "session_updated", Map.of(
                "session", saved,
                "message", "Waiting for the other user to confirm.",
                "action", "completion_requested"
            ));
        }

        return saved;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Session cancelSession(UUID sessionId, UUID userId) {
        Session session = sessionRepository.findByIdForUpdate(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found."));

        if (!session.getTeacher().getId().equals(userId) && !session.getLearner().getId().equals(userId)) {
            throw new ForbiddenException("You are not a participant of this session.");
        }
        if (session.getStatus() == SessionStatus.completed || session.getStatus() == SessionStatus.cancelled) {
            throw new BadRequestException("Cannot cancel a session with status '" + session.getStatus() + "'.");
        }

        BigDecimal creditsToRefund = BigDecimal.valueOf((int) Math.ceil(session.getDurationMinutes() / 60.0));
        creditLedgerService.refundEscrow(session.getLearner().getId(), creditsToRefund);

        session.setStatus(SessionStatus.cancelled);
        session.setMeetingStatus("CANCELLED");
        Session saved = sessionRepository.save(session);

        UUID otherUserId = session.getTeacher().getId().equals(userId) ? session.getLearner().getId() : session.getTeacher().getId();
        socketIOService.emitToUser(otherUserId, "session_updated", Map.of(
            "session", saved,
            "message", "Your session has been cancelled.",
            "action", "cancelled"
        ));
        socketIOService.emitToUser(userId, "session_updated", Map.of(
            "session", saved,
            "message", "Session cancelled",
            "action", "cancelled"
        ));

        return saved;
    }

    public Map<String, Object> getUserSessions(UUID userId, String statusStr, String period, int page, int limit) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.min(limit > 0 ? limit : 20, 100));

        SessionStatus status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                status = SessionStatus.valueOf(statusStr.toLowerCase());
            } catch (IllegalArgumentException ignored) {}
        }

        Page<Session> sessionPage;
        if ("upcoming".equalsIgnoreCase(period)) {
            sessionPage = sessionRepository.findUserSessionsUpcoming(userId, status, OffsetDateTime.now(), pageRequest);
        } else if ("past".equalsIgnoreCase(period)) {
            sessionPage = sessionRepository.findUserSessionsPast(userId, status, OffsetDateTime.now(), pageRequest);
        } else if (status != null) {
            sessionPage = sessionRepository.findUserSessionsByStatus(userId, status, pageRequest);
        } else {
            sessionPage = sessionRepository.findUserSessionsAll(userId, pageRequest);
        }

        return Map.of(
            "sessions", sessionPage.getContent(),
            "pagination", Map.of(
                "page", page,
                "limit", limit,
                "total", sessionPage.getTotalElements()
            )
        );
    }

    public Session getSessionById(UUID sessionId) {
        return sessionRepository.findByIdEnriched(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found."));
    }

    public List<Map<String, Object>> getSessionMessages(UUID sessionId, UUID userId) {
        Session session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found."));

        if (!session.getTeacher().getId().equals(userId) && !session.getLearner().getId().equals(userId)) {
            throw new ForbiddenException("Not authorized to view these messages");
        }

        List<SessionMessage> messages = sessionMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        return messages.stream().map(m -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", m.getId());
            map.put("sessionId", m.getSession().getId());
            map.put("senderId", m.getSender().getId());
            map.put("senderName", m.getSender().getName());
            map.put("text", m.getContent());
            map.put("timestamp", m.getCreatedAt());
            return map;
        }).toList();
    }
}
