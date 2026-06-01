package aucasa.com.rw.service;

import aucasa.com.rw.domain.ChatMessage;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.dto.user.UserDirectoryItem;
import aucasa.com.rw.repository.ChatMessageRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final UserAccountRepository userAccountRepository;

    public ChatService(ChatMessageRepository chatMessageRepository,
                       UserAccountRepository userAccountRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public ChatMessage sendMessage(Long senderId, Long receiverId, String content, boolean broadcast) {
        if (senderId == null) {
            throw new IllegalArgumentException("senderId is required.");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("content is required.");
        }

        UserAccount sender = userAccountRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found."));

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setContent(content.trim());
        message.setSentAt(LocalDateTime.now());
        message.setBroadcast(broadcast);

        if (!broadcast) {
            if (receiverId == null) {
                throw new IllegalArgumentException("receiverId is required for direct messages.");
            }
            UserAccount receiver = userAccountRepository.findById(receiverId)
                    .orElseThrow(() -> new IllegalArgumentException("Receiver not found."));
            message.setReceiver(receiver);
        }

        return chatMessageRepository.save(message);
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getThread(Long userId, Long peerId) {
        return chatMessageRepository.findThread(userId, peerId);
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getBroadcastMessages() {
        return chatMessageRepository.findBroadcast();
    }

    @Transactional(readOnly = true)
    public List<UserDirectoryItem> getInboxSenders(Long userId) {
        List<Object[]> rows = chatMessageRepository.findInboxSenders(userId);
        List<UserDirectoryItem> items = new ArrayList<>();
        for (Object[] row : rows) {
            Long senderId = (Long) row[0];
            String firstName = (String) row[1];
            String lastName = (String) row[2];
            String role = row[3] != null ? row[3].toString().toLowerCase() : "";
            items.add(new UserDirectoryItem(senderId, firstName + " " + lastName, role, null));
        }
        return items;
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        if (userId == null) {
            return 0;
        }
        return chatMessageRepository.countByReceiverIdAndBroadcastFalseAndReadAtIsNull(userId);
    }

    @Transactional
    public long markThreadRead(Long userId, Long peerId) {
        if (userId == null || peerId == null) {
            return getUnreadCount(userId);
        }
        chatMessageRepository.markThreadRead(userId, peerId, LocalDateTime.now());
        return getUnreadCount(userId);
    }
}
