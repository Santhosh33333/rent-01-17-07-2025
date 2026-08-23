import { useEffect, useRef, useState, useCallback } from 'react';
import { useChat } from '../hooks/useSocket';
import { Send, Loader2 } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface ChatMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  status: 'SENT' | 'READ';
}

interface RealtimeChatProps {
  conversationId: string;
  currentUserId: string;
  otherUserName: string;
  onMessageSent?: (content: string) => void;
}

export function RealtimeChat({
  conversationId,
  currentUserId,
  otherUserName,
  onMessageSent,
}: RealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    sendMessage,
    markAsRead,
    setTyping,
    listenToMessages,
    listenToUserTyping,
    listenToUserStoppedTyping,
    listenToMessagesRead,
  } = useChat(conversationId);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Listen to new messages
  useEffect(() => {
    const unsubscribe = listenToMessages((data) => {
      const newMessage: ChatMessage = {
        messageId: data.messageId,
        senderId: data.senderId,
        senderName: data.senderId === currentUserId ? 'You' : otherUserName,
        content: data.content,
        timestamp: data.timestamp,
        status: 'SENT',
      };

      setMessages((prev) => [...prev, newMessage]);

      // Mark message as read if from other user
      if (data.senderId !== currentUserId) {
        markAsRead([data.messageId]);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.messageId === data.messageId ? { ...msg, status: 'READ' } : msg
          )
        );
      }
    });

    return unsubscribe;
  }, [listenToMessages, currentUserId, otherUserName, markAsRead]);

  // Listen to typing indicators
  useEffect(() => {
    const unsubscribe1 = listenToUserTyping((data) => {
      if (data.userId !== currentUserId) {
        setOtherUserTyping(true);
      }
    });

    const unsubscribe2 = listenToUserStoppedTyping((data) => {
      if (data.userId !== currentUserId) {
        setOtherUserTyping(false);
      }
    });

    return () => {
      unsubscribe1?.();
      unsubscribe2?.();
    };
  }, [listenToUserTyping, listenToUserStoppedTyping, currentUserId]);

  // Listen to read receipts
  useEffect(() => {
    const unsubscribe = listenToMessagesRead((data) => {
      if (data.readBy !== currentUserId) {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg.messageId) ? { ...msg, status: 'READ' } : msg
          )
        );
      }
    });

    return unsubscribe;
  }, [listenToMessagesRead, currentUserId]);

  // Handle sending message
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;

    setIsLoading(true);
    try {
      sendMessage(inputValue);

      // Add optimistic message
      const optimisticMessage: ChatMessage = {
        messageId: `temp_${Date.now()}`,
        senderId: currentUserId,
        senderName: 'You',
        content: inputValue,
        timestamp: Date.now(),
        status: 'SENT',
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      setInputValue('');
      setIsTyping(false);
      setTyping(false);

      onMessageSent?.(inputValue);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, sendMessage, currentUserId, setTyping, onMessageSent]);

  // Handle typing
  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      setTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        setTyping(false);
      }
    }, 1000);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 p-4">
        <h3 className="font-semibold text-surface-900 dark:text-white">{otherUserName}</h3>
        {otherUserTyping && (
          <p className="text-xs text-surface-500">typing...</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-surface-500 text-sm">No messages yet</p>
              <p className="text-surface-400 text-xs mt-1">Start the conversation</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.messageId}
              className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <GlassCard
                variant="default"
                padding="sm"
                className={`max-w-xs lg:max-w-md ${
                  message.senderId === currentUserId
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-white'
                }`}
              >
                <p className="text-sm break-words">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.senderId === currentUserId
                      ? 'text-emerald-100'
                      : 'text-surface-500'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {message.status === 'READ' && ' ✓'}
                </p>
              </GlassCard>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            className="input flex-1 text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn-primary py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
