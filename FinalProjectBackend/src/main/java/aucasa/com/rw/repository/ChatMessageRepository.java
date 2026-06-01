package aucasa.com.rw.repository;

import aucasa.com.rw.domain.ChatMessage;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
            select m from ChatMessage m
            where (m.sender.id = :userId and m.receiver.id = :peerId)
               or (m.sender.id = :peerId and m.receiver.id = :userId)
            order by m.sentAt asc
            """)
    List<ChatMessage> findThread(@Param("userId") Long userId, @Param("peerId") Long peerId);

    @Query("""
            select m from ChatMessage m
            where m.broadcast = true
            order by m.sentAt asc
            """)
    List<ChatMessage> findBroadcast();

    @Query("""
            select m.sender.id, m.sender.firstName, m.sender.lastName, m.sender.role.name, min(m.sentAt)
            from ChatMessage m
            where m.receiver.id = :userId and m.broadcast = false
            group by m.sender.id, m.sender.firstName, m.sender.lastName, m.sender.role.name
            order by min(m.sentAt) asc
            """)
    List<Object[]> findInboxSenders(@Param("userId") Long userId);

    long countByReceiverIdAndBroadcastFalseAndReadAtIsNull(Long receiverId);

    @Modifying
    @Query("""
            update ChatMessage m
            set m.readAt = :readAt
            where m.receiver.id = :userId
              and m.sender.id = :peerId
              and m.broadcast = false
              and m.readAt is null
            """)
    int markThreadRead(@Param("userId") Long userId,
                       @Param("peerId") Long peerId,
                       @Param("readAt") LocalDateTime readAt);
}
