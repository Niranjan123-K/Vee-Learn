package com.veelearn.api.websocket;

import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import com.veelearn.api.security.JwtTokenProvider;
import com.veelearn.api.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SocketIOConfig {

    private final JwtTokenProvider tokenProvider;

    @Value("${socketio.host:0.0.0.0}")
    private String host;

    @Value("${socketio.port:5001}")
    private int port;

    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String allowedOrigin;

    private SocketIOServer server;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setOrigin(allowedOrigin);

        config.setAuthorizationListener(data -> {
            try {
                String cookieHeader = data.getHttpHeaders().get("Cookie");
                String token = null;
                if (cookieHeader != null) {
                    for (String c : cookieHeader.split(";")) {
                        String[] pair = c.trim().split("=", 2);
                        if (pair.length == 2 && "token".equals(pair[0].trim())) {
                            token = pair[1].trim();
                            break;
                        }
                    }
                }

                if (token != null && tokenProvider.validateToken(token)) {
                    Claims claims = tokenProvider.getClaimsFromToken(token);
                    UUID userId = UUID.fromString(claims.get("id", String.class));
                    String email = claims.get("email", String.class);
                    String name = claims.get("name", String.class);
                    data.getHttpHeaders().set("X-User-Id", userId.toString());
                    data.getHttpHeaders().set("X-User-Name", name);
                    data.getHttpHeaders().set("X-User-Email", email);
                    return AuthorizationResult.SUCCESSFUL_AUTHORIZATION;
                }
            } catch (Exception e) {
                log.warn("Socket auth failed: {}", e.getMessage());
            }
            return AuthorizationResult.FAILED_AUTHORIZATION;
        });

        this.server = new SocketIOServer(config);
        this.server.start();
        log.info("📡 Netty-SocketIO server started on {}:{}", host, port);
        return this.server;
    }

    @PreDestroy
    public void stopSocketIOServer() {
        if (this.server != null) {
            this.server.stop();
            log.info("Netty-SocketIO server stopped.");
        }
    }
}
