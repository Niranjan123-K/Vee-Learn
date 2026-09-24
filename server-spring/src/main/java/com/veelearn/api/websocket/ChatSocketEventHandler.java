package com.veelearn.api.websocket;

import com.corundumstudio.socketio.SocketIOServer;
import com.veelearn.api.dto.MessageDtos;
import com.veelearn.api.entity.Message;
import com.veelearn.api.entity.Session;
import com.veelearn.api.entity.SessionMessage;
import com.veelearn.api.entity.User;
import com.veelearn.api.repository.SessionMessageRepository;
import com.veelearn.api.repository.SessionRepository;
import com.veelearn.api.repository.UserRepository;
import com.veelearn.api.service.MessageService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatSocketEventHandler {

    private final SocketIOServer socketIOServer;
    private final MessageService messageService;
    private final SessionRepository sessionRepository;
    private final SessionMessageRepository sessionMessageRepository;
    private final UserRepository userRepository;

    @PostConstruct
    public void registerListeners() {
        socketIOServer.addConnectListener(client -> {
            String userIdStr = client.getHandshakeData().getHttpHeaders().get("X-User-Id");
            String userName = client.getHandshakeData().getHttpHeaders().get("X-User-Name");
            if (userIdStr != null) {
                client.joinRoom("user:" + userIdStr);
                log.info("[WS] {} connected ({})", userName, userIdStr);
            }
        });

        socketIOServer.addDisconnectListener(client -> {
            String userName = client.getHandshakeData().getHttpHeaders().get("X-User-Name");
            log.info("[WS] {} disconnected", userName);
        });

        // send_message
        socketIOServer.addEventListener("send_message", Map.class, (client, data, ackSender) -> {
            try {
                String userIdStr = client.getHandshakeData().getHttpHeaders().get("X-User-Id");
                if (userIdStr == null) return;
                UUID senderId = UUID.fromString(userIdStr);

                String receiverIdStr = (String) data.get("receiverId");
                String content = (String) data.get("content");
                if (receiverIdStr == null || content == null) return;

                MessageDtos.SendMessageRequest req = new MessageDtos.SendMessageRequest();
                req.setReceiver_id(UUID.fromString(receiverIdStr));
                req.setContent(content);

                Message message = messageService.sendMessage(senderId, req);
                if (ackSender.isAckRequested()) {
                    ackSender.sendAckData(Map.of("success", true, "message", message));
                }
            } catch (Exception e) {
                log.error("[WS] send_message error: {}", e.getMessage());
                if (ackSender.isAckRequested()) {
                    ackSender.sendAckData(Map.of("error", e.getMessage()));
                }
            }
        });

        // typing
        socketIOServer.addEventListener("typing", Map.class, (client, data, ackSender) -> {
            String userIdStr = client.getHandshakeData().getHttpHeaders().get("X-User-Id");
            String userName = client.getHandshakeData().getHttpHeaders().get("X-User-Name");
            String receiverId = (String) data.get("receiverId");
            if (receiverId != null && userIdStr != null) {
                socketIOServer.getRoomOperations("user:" + receiverId).sendEvent("typing", Map.of(
                    "userId", userIdStr,
                    "name", userName != null ? userName : ""
                ));
            }
        });

        // mark_read
        socketIOServer.addEventListener("mark_read", Map.class, (client, data, ackSender) -> {
            try {
                String userIdStr = client.getHandshakeData().getHttpHeaders().get("X-User-Id");
                String senderIdStr = (String) data.get("senderId");
                if (userIdStr != null && senderIdStr != null) {
                    messageService.markAsRead(UUID.fromString(userIdStr), UUID.fromString(senderIdStr));
                    if (ackSender.isAckRequested()) {
                        ackSender.sendAckData(Map.of("success", true));
                    }
                }
            } catch (Exception e) {
                log.error("[WS] mark_read error: {}", e.getMessage());
                if (ackSender.isAckRequested()) {
                    ackSender.sendAckData(Map.of("error", e.getMessage()));
                }
            }
        });

        // join_session
        socketIOServer.addEventListener("join_session", Map.class, (client, data, ackSender) -> {
            String sessionId = (String) data.get("sessionId");
            if (sessionId != null) {
                client.joinRoom("session_" + sessionId);
                if (ackSender.isAckRequested()) {
                    ackSender.sendAckData(Map.of("success", true));
                }
            }
        });

        // send_session_message
        socketIOServer.addEventListener("send_session_message", Map.class, (client, data, ackSender) -> {
            try {
                String userIdStr = client.getHandshakeData().getHttpHeaders().get("X-User-Id");
                String userName = client.getHandshakeData().getHttpHeaders().get("X-User-Name");
                String sessionIdStr = (String) data.get("sessionId");
                String text = (String) data.get("text");

                if (userIdStr == null || sessionIdStr == null || text == null) return;

                UUID senderId = UUID.fromString(userIdStr);
                UUID sessionId = UUID.fromString(sessionIdStr);

                User sender = userRepository.getReferenceById(senderId);
                Session session = sessionRepository.getReferenceById(sessionId);

                SessionMessage msg = SessionMessage.builder()
                    .session(session)
                    .sender(sender)
                    .content(text)
                    .build();
                SessionMessage saved = sessionMessageRepository.save(msg);

                Map<String, Object> messageData = new LinkedHashMap<>();
                messageData.put("id", saved.getId());
                messageData.put("sessionId", sessionId);
                messageData.put("senderId", senderId);
                messageData.put("text", saved.getContent());
                messageData.put("timestamp", saved.getCreatedAt());
                messageData.put("senderName", userName);

                socketIOServer.getRoomOperations("session_" + sessionId).sendEvent("new_session_message", messageData);

                if (ackSender.isAckRequested()) {
                    ackSender.sendAckData(Map.of("success", true, "message", messageData));
                }
            } catch (Exception e) {
                log.error("[WS] send_session_message error: {}", e.getMessage());
                if (ackSender.isAckRequested()) {
                    ackSender.sendAckData(Map.of("error", e.getMessage()));
                }
            }
        });

        // typing_session
        socketIOServer.addEventListener("typing_session", Map.class, (client, data, ackSender) -> {
            String userIdStr = client.getHandshakeData().getHttpHeaders().get("X-User-Id");
            String sessionId = (String) data.get("sessionId");
            if (sessionId != null && userIdStr != null) {
                socketIOServer.getRoomOperations("session_" + sessionId).sendEvent("typing_session", Map.of("userId", userIdStr));
            }
        });
    }
}
