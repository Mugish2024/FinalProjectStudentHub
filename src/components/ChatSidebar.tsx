import React, { useEffect, useMemo, useState } from 'react';
import { X, Send } from 'lucide-react';
import './ChatSidebar.css';
import { findAucaAnswer } from '../data/aucaInfo';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type Recipient = {
    id: number;
    fullName: string;
    role: string;
    studentNumber?: string | null;
};

type ChatMessage = {
    id: number;
    senderId: number;
    senderName: string;
    receiverId?: number | null;
    receiverName?: string | null;
    content: string;
    broadcast: boolean;
    sentAt: string;
};

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    userRole: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'guild_president' | null;
    userAccountId: number | null;
    userName: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose, userRole, userAccountId, userName }) => {
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);

    const isGuild = userRole === 'guild_president';
    const canBroadcast = isGuild;

    const broadcastRecipient: Recipient = useMemo(() => ({
        id: 0,
        fullName: 'Announcements',
        role: 'broadcast',
    }), []);

    const aiRecipient: Recipient = useMemo(() => ({
        id: -1,
        fullName: 'AUCASA Info (AI)',
        role: 'ai',
    }), []);

    useEffect(() => {
        if (!isOpen || !userAccountId) return;

        const loadRecipients = async () => {
            setError('');
            if (userRole === 'student') {
                const response = await fetch(`${API_BASE}/api/users/recipients?role=staff`);
                const data = await response.json().catch(() => []);
                if (!response.ok) {
                    setError('Failed to load chat recipients.');
                    return;
                }
                const list = Array.isArray(data) ? data : [];
                const merged = [aiRecipient, ...(canBroadcast ? [broadcastRecipient] : []), ...list];
                setRecipients(merged);
                if (!selectedRecipient && merged.length > 0) {
                    setSelectedRecipient(merged[0]);
                }
                return;
            }

            const response = await fetch(`${API_BASE}/api/chat/inbox?userId=${userAccountId}`);
            const data = await response.json().catch(() => []);
            if (!response.ok) {
                setError('Failed to load chat recipients.');
                return;
            }
            const list = Array.isArray(data) ? data : [];
            const merged = [aiRecipient, ...(canBroadcast ? [broadcastRecipient] : []), ...list];
            setRecipients(merged);
            if (!selectedRecipient && merged.length > 0) {
                setSelectedRecipient(merged[0]);
            }
        };

        loadRecipients();
    }, [isOpen, userAccountId, userRole, canBroadcast, broadcastRecipient, selectedRecipient]);

    useEffect(() => {
        const loadMessages = async () => {
            if (!userAccountId || !selectedRecipient) return;
            setError('');
            let response: Response;
            if (selectedRecipient.id === -1) {
                setMessages([]);
                return;
            }
            if (selectedRecipient.id === 0) {
                response = await fetch(`${API_BASE}/api/chat/broadcast`);
            } else {
                response = await fetch(`${API_BASE}/api/chat/thread?userId=${userAccountId}&peerId=${selectedRecipient.id}`);
            }
            const data = await response.json().catch(() => []);
            if (!response.ok) {
                setError('Failed to load messages.');
                return;
            }
            setMessages(Array.isArray(data) ? data : []);
        };

        if (isOpen) {
            loadMessages();
        }
    }, [isOpen, userAccountId, selectedRecipient]);

    const handleSend = async () => {
        if (!userAccountId || !selectedRecipient) return;
        if (!newMessage.trim()) return;

        setIsSending(true);
        setError('');
        try {
            if (selectedRecipient.id === -1) {
                let answer = '';
                try {
                    const response = await fetch(`${API_BASE}/api/ai/auca`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question: newMessage.trim() }),
                    });
                    const data = await response.json().catch(() => ({}));
                    if (response.ok && data.answer) {
                        answer = data.answer;
                    } else {
                        answer = findAucaAnswer(newMessage);
                    }
                } catch {
                    answer = findAucaAnswer(newMessage);
                }
                const now = new Date().toISOString();
                const userMsg: ChatMessage = {
                    id: Date.now(),
                    senderId: userAccountId,
                    senderName: userName,
                    receiverId: -1,
                    receiverName: aiRecipient.fullName,
                    content: newMessage.trim(),
                    broadcast: false,
                    sentAt: now,
                };
                const aiMsg: ChatMessage = {
                    id: Date.now() + 1,
                    senderId: -1,
                    senderName: aiRecipient.fullName,
                    receiverId: userAccountId,
                    receiverName: userName,
                    content: answer,
                    broadcast: false,
                    sentAt: new Date().toISOString(),
                };
                setAiMessages((prev) => [...prev, userMsg, aiMsg]);
                setNewMessage('');
                return;
            }

            const payload = {
                senderId: userAccountId,
                receiverId: selectedRecipient.id === 0 ? null : selectedRecipient.id,
                content: newMessage.trim(),
                broadcast: selectedRecipient.id === 0,
            };

            const response = await fetch(`${API_BASE}/api/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to send message.');
            }
            setNewMessage('');
            setMessages((prev) => [...prev, data as ChatMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message.');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <aside className="chat-sidebar">
            <div className="chat-sidebar__header">
                <div>
                    <h3>Chat</h3>
                    <p>{userName}</p>
                </div>
                <button className="chat-close" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            {error && <div className="chat-error">{error}</div>}

            <div className="chat-sidebar__body">
                <div className="chat-recipients">
                    <div className="chat-recipients__title">Recipients</div>
                    {recipients.map((recipient) => (
                        <button
                            key={recipient.id}
                            className={`chat-recipient ${selectedRecipient?.id === recipient.id ? 'active' : ''}`}
                            onClick={() => setSelectedRecipient(recipient)}
                        >
                            <div className="chat-recipient__name">{recipient.fullName}</div>
                            <span className="chat-recipient__role">{recipient.role}</span>
                        </button>
                    ))}
                </div>

                <div className="chat-thread">
                    <div className="chat-thread__header">
                        <span>{selectedRecipient?.fullName ?? 'Select a recipient'}</span>
                    </div>
                    <div className="chat-thread__messages">
                        {((selectedRecipient?.id === -1 ? aiMessages : messages).length === 0) && (
                            <div className="chat-empty">No messages yet.</div>
                        )}
                        {(selectedRecipient?.id === -1 ? aiMessages : messages).map((msg) => (
                            <div
                                key={msg.id}
                                className={`chat-bubble ${msg.senderId === userAccountId ? 'chat-bubble--me' : 'chat-bubble--them'}`}
                            >
                                <div className="chat-bubble__name">{msg.senderId === userAccountId ? 'You' : msg.senderName}</div>
                                <div className="chat-bubble__text">{msg.content}</div>
                                <div className="chat-bubble__time">{new Date(msg.sentAt).toLocaleTimeString()}</div>
                            </div>
                        ))}
                    </div>
                    <div className="chat-thread__input">
                        {!canBroadcast && selectedRecipient?.id === 0 && (
                            <div className="chat-warning">Broadcast messages are only for the Guild President.</div>
                        )}
                        <textarea
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={selectedRecipient?.id === 0 && !canBroadcast}
                        />
                        <button onClick={handleSend} disabled={isSending || (selectedRecipient?.id === 0 && !canBroadcast)}>
                            <Send size={16} />
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default ChatSidebar;
