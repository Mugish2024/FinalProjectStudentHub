package aucasa.com.rw.controller;

import aucasa.com.rw.domain.ChatMessage;
import aucasa.com.rw.dto.chat.ChatMessageResponse;
import aucasa.com.rw.dto.chat.SendChatRequest;
import aucasa.com.rw.dto.user.UserDirectoryItem;
import aucasa.com.rw.service.ChatService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody SendChatRequest request) {
        try {
            ChatMessage message = chatService.sendMessage(
                    request.getSenderId(),
                    request.getReceiverId(),
                    request.getContent(),
                    request.isBroadcast()
            );
            return ResponseEntity.ok(toResponse(message));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/thread")
    public List<ChatMessageResponse> thread(@RequestParam Long userId, @RequestParam Long peerId) {
        return chatService.getThread(userId, peerId).stream().map(this::toResponse).toList();
    }

    @GetMapping("/broadcast")
    public List<ChatMessageResponse> broadcast() {
        return chatService.getBroadcastMessages().stream().map(this::toResponse).toList();
    }

    @GetMapping("/inbox")
    public List<UserDirectoryItem> inbox(@RequestParam Long userId) {
        return chatService.getInboxSenders(userId);
    }

    private ChatMessageResponse toResponse(ChatMessage message) {
        ChatMessageResponse response = new ChatMessageResponse();
        response.setId(message.getId());
        response.setSenderId(message.getSender() != null ? message.getSender().getId() : null);
        response.setSenderName(message.getSender() != null
                ? message.getSender().getFirstName() + " " + message.getSender().getLastName()
                : null);
        response.setReceiverId(message.getReceiver() != null ? message.getReceiver().getId() : null);
        response.setReceiverName(message.getReceiver() != null
                ? message.getReceiver().getFirstName() + " " + message.getReceiver().getLastName()
                : null);
        response.setContent(message.getContent());
        response.setBroadcast(message.isBroadcast());
        response.setSentAt(message.getSentAt());
        return response;
    }
}

