package com.veelearn.api.service;

import com.veelearn.api.dto.MessageDtos;
import com.veelearn.api.entity.Conversation;
import com.veelearn.api.entity.Message;
import com.veelearn.api.entity.User;
import com.veelearn.api.exception.BadRequestException;
import com.veelearn.api.exception.ResourceNotFoundException;
import com.veelearn.api.repository.ConversationRepository;
import com.veelearn.api.repository.MessageRepository;
import com.veelearn.api.repository.UserRepository;
import com.veelearn.api.websocket.SocketIOService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SocketIOService socketIOService;

    public List<Map<String, Object>> getConversations(UUID userId) {
        List<Object[]> raw = conversationRepository.findConversationsForUserRaw(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] r : raw) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r[0]);
            m.put("user1_id", r[1]);
            m.put("user2_id", r[2]);
            m.put("last_message_at", r[3]);
            m.put("user1_name", r[4]);
            m.put("user1_avatar", r[5]);
            m.put("user2_name", r[6]);
            m.put("user2_avatar", r[7]);
            m.put("unread_count", r[8]);
            m.put("last_message", r[9]);
            result.add(m);
        }

        return result;
    }

    public Map<String, Object> getMessages(UUID myId, UUID otherUserId, int page, int limit) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.min(limit > 0 ? limit : 50, 100));
        Page<Message> messagePage = messageRepository.findConversationMessages(myId, otherUserId, pageRequest);

        List<Map<String, Object>> messages = messagePage.getContent().stream().map(m -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", m.getId());
            map.put("sender_id", m.getSender().getId());
            map.put("receiver_id", m.getReceiver().getId());
            map.put("content", m.getContent());
            map.put("is_read", m.getIsRead());
            map.put("created_at", m.getCreatedAt());
            map.put("sender_name", m.getSender().getName());
            map.put("sender_avatar", m.getSender().getAvatarUrl());
            return map;
        }).toList();

        return Map.of(
            "messages", messages,
            "pagination", Map.of(
                "page", page,
                "limit", limit,
                "total", messagePage.getTotalElements()
            )
        );
    }

    @Transactional
    public Message sendMessage(UUID senderId, MessageDtos.SendMessageRequest req) {
        UUID receiverId = req.getReceiver_id();
        if (senderId.equals(receiverId)) {
            throw new BadRequestException("You cannot message yourself.");
        }

        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new ResourceNotFoundException("Sender not found."));
        User receiver = userRepository.findById(receiverId)
            .orElseThrow(() -> new ResourceNotFoundException("Receiver not found."));

        Message message = Message.builder()
            .sender(sender)
            .receiver(receiver)
            .content(req.getContent().trim())
            .isRead(false)
            .build();
        Message saved = messageRepository.save(message);

        // Upsert conversation (order IDs for uniqueness)
        UUID u1 = senderId.compareTo(receiverId) < 0 ? senderId : receiverId;
        UUID u2 = senderId.compareTo(receiverId) < 0 ? receiverId : senderId;

        Conversation conv = conversationRepository.findByUser1IdAndUser2Id(u1, u2)
            .orElseGet(() -> Conversation.builder()
                .user1(userRepository.getReferenceById(u1))
                .user2(userRepository.getReferenceById(u2))
                .lastMessageAt(OffsetDateTime.now())
                .build());

        conv.setLastMessageAt(OffsetDateTime.now());
        conversationRepository.save(conv);

        // Emit real-time notification to receiver
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", saved.getId());
        payload.put("sender_id", saved.getSender().getId());
        payload.put("receiver_id", saved.getReceiver().getId());
        payload.put("content", saved.getContent());
        payload.put("is_read", saved.getIsRead());
        payload.put("created_at", saved.getCreatedAt());
        payload.put("sender_name", sender.getName());

        socketIOService.emitToUser(receiverId, "new_message", payload);

        return saved;
    }

    @Transactional
    public int markAsRead(UUID myId, UUID senderId) {
        int updated = messageRepository.markMessagesAsRead(senderId, myId);
        socketIOService.emitToUser(senderId, "messages_read", Map.of("readBy", myId));
        return updated;
    }
}
