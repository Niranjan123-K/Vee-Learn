package com.veelearn.api.websocket;

import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SocketIOService {

    private final SocketIOServer socketIOServer;

    public void emitToUser(UUID userId, String eventName, Object data) {
        String room = "user:" + userId;
        socketIOServer.getRoomOperations(room).sendEvent(eventName, data);
    }

    public void emitToSession(UUID sessionId, String eventName, Object data) {
        String room = "session_" + sessionId;
        socketIOServer.getRoomOperations(room).sendEvent(eventName, data);
    }
}
