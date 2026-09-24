package com.veelearn.api.service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.ConferenceData;
import com.google.api.services.calendar.model.CreateConferenceRequest;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.veelearn.api.entity.GoogleIntegration;
import com.veelearn.api.repository.GoogleIntegrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final GoogleIntegrationRepository googleIntegrationRepository;
    private final EncryptionService encryptionService;

    @Value("${app.google.client-id:}")
    private String clientId;

    @Value("${app.google.client-secret:}")
    private String clientSecret;

    public String createCalendarEventWithMeet(UUID teacherId, String skillName, String teacherName, String learnerName, OffsetDateTime scheduledAt, int durationMinutes) {
        GoogleIntegration integration = googleIntegrationRepository.findByUserId(teacherId).orElse(null);
        if (integration == null || !"CONNECTED".equals(integration.getStatus()) || integration.getRefreshToken() == null) {
            return null;
        }

        try {
            String refreshToken = encryptionService.decrypt(integration.getRefreshToken());
            Credential credential = new GoogleCredential.Builder()
                .setTransport(new NetHttpTransport())
                .setJsonFactory(GsonFactory.getDefaultInstance())
                .setClientSecrets(clientId, clientSecret)
                .build()
                .setRefreshToken(refreshToken);

            Calendar service = new Calendar.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance(), credential)
                .setApplicationName("VeeLearn")
                .build();

            Event event = new Event()
                .setSummary("Vee Learn Session: " + skillName)
                .setDescription("Teacher: " + teacherName + "\nLearner: " + learnerName);

            Date start = Date.from(scheduledAt.toInstant());
            Date end = Date.from(scheduledAt.plusMinutes(durationMinutes).toInstant());

            event.setStart(new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(start)));
            event.setEnd(new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(end)));

            ConferenceData conferenceData = new ConferenceData()
                .setCreateRequest(new CreateConferenceRequest().setRequestId(UUID.randomUUID().toString()));
            event.setConferenceData(conferenceData);

            Event createdEvent = service.events().insert("primary", event)
                .setConferenceDataVersion(1)
                .execute();

            return createdEvent.getHangoutLink();
        } catch (Exception e) {
            log.warn("Failed to create Google Calendar event: {}", e.getMessage());
            return null;
        }
    }
}
