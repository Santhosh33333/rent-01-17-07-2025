import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../lib/auth';

interface UseSocketOptions {
  autoConnect?: boolean;
  debug?: boolean;
}

let globalSocket: Socket | null = null;

/**
 * Hook for real-time Socket.io communication
 * Manages connection lifecycle and provides event handlers
 */
export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, debug = false } = options;
  const { user } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const socketRef = useRef<Socket | null>(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    if (!autoConnect || !token) return;
    if (isConnectingRef.current) return;
    if (globalSocket?.connected) {
      socketRef.current = globalSocket;
      return;
    }

    isConnectingRef.current = true;

    try {
      const socket = io((import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, ''), {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('[SOCKET] Connected:', socket.id);
        if (debug) console.log('[SOCKET DEBUG] Connection established');
      });

      socket.on('disconnect', () => {
        console.log('[SOCKET] Disconnected');
        if (debug) console.log('[SOCKET DEBUG] Disconnected');
      });

      socket.on('connect_error', (error: Error) => {
        console.error('[SOCKET] Connection error:', error);
        if (debug) console.error('[SOCKET DEBUG] Connection error:', error);
      });

      socket.on('error', (error: Error) => {
        console.error('[SOCKET] Error:', error);
        if (debug) console.error('[SOCKET DEBUG] Error:', error);
      });

      socketRef.current = socket;
      globalSocket = socket;
      isConnectingRef.current = false;
    } catch (err) {
      console.error('[SOCKET] Failed to connect:', err);
      isConnectingRef.current = false;
    }

    return () => {
      // Don't disconnect here - keep connection alive for multiple hooks
    };
  }, [token, autoConnect, debug, user]);

  const getSocket = useCallback(() => {
    return socketRef.current || globalSocket;
  }, []);

  // Emit event
  const emit = useCallback(
    (event: string, data?: any) => {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit(event, data);
      } else {
        console.warn(`[SOCKET] Cannot emit '${event}' - not connected`);
      }
    },
    [getSocket]
  );

  // Listen to event
  const on = useCallback(
    (event: string, callback: (...args: any[]) => void): (() => void) | undefined => {
      const socket = getSocket();
      if (socket) {
        socket.on(event, callback);
        return () => {
          socket.off(event, callback);
        };
      }
      return undefined;
    },
    [getSocket]
  );

  // Listen to event once
  const once = useCallback(
    (event: string, callback: (...args: any[]) => void): void => {
      const socket = getSocket();
      if (socket) {
        socket.once(event, callback);
      }
    },
    [getSocket]
  );

  // Remove event listener
  const off = useCallback(
    (event: string, callback?: (...args: any[]) => void): void => {
      const socket = getSocket();
      if (socket) {
        socket.off(event, callback);
      }
    },
    [getSocket]
  );

  // Check if connected
  const isConnected = useCallback(() => {
    return getSocket()?.connected || false;
  }, [getSocket]);

  return {
    socket: getSocket(),
    emit,
    on,
    once,
    off,
    isConnected,
  };
}

/**
 * Hook for booking live tracking
 */
export function useBookingTracking(bookingId: string) {
  const { emit, on } = useSocket({ autoConnect: true });

  const joinBooking = useCallback(() => {
    emit('join_booking', bookingId);
  }, [bookingId, emit]);

  const leaveBooking = useCallback(() => {
    emit('leave_booking', bookingId);
  }, [bookingId, emit]);

  const sendLocation = useCallback(
    (latitude: number, longitude: number, heading?: number, speed?: number) => {
      emit('location_update', {
        bookingId,
        partnerId: '', // Will be set by server
        latitude,
        longitude,
        heading,
        speed,
      });
    },
    [bookingId, emit]
  );

  const updateStatus = useCallback(
    (status: string) => {
      emit('booking_status_update', { bookingId, status });
    },
    [bookingId, emit]
  );

  const requestETA = useCallback(() => {
    emit('request_eta', bookingId);
  }, [bookingId, emit]);

  const listenToLocationUpdates = useCallback(
    (callback: (data: any) => void) => {
      return on('partner_location', callback);
    },
    [on]
  );

  const listenToStatusChanges = useCallback(
    (callback: (data: any) => void) => {
      return on('booking_status_changed', callback);
    },
    [on]
  );

  const listenToETAUpdates = useCallback(
    (callback: (data: any) => void) => {
      return on('eta_update', callback);
    },
    [on]
  );

  // Auto-join on mount
  useEffect(() => {
    if (bookingId) {
      joinBooking();
    }
    return () => {
      if (bookingId) {
        leaveBooking();
      }
    };
  }, [bookingId, joinBooking, leaveBooking]);

  return {
    joinBooking,
    leaveBooking,
    sendLocation,
    updateStatus,
    requestETA,
    listenToLocationUpdates,
    listenToStatusChanges,
    listenToETAUpdates,
  };
}

/**
 * Hook for real-time chat
 */
export function useChat(conversationId: string) {
  const { emit, on } = useSocket({ autoConnect: true });

  const joinChat = useCallback(() => {
    emit('join_chat', conversationId);
  }, [conversationId, emit]);

  const leaveChat = useCallback(() => {
    emit('leave_chat', conversationId);
  }, [conversationId, emit]);

  const sendMessage = useCallback(
    (content: string) => {
      emit('send_message', { conversationId, content });
    },
    [conversationId, emit]
  );

  const markAsRead = useCallback(
    (messageIds: string[]) => {
      emit('mark_read', { conversationId, messageIds });
    },
    [conversationId, emit]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (isTyping) {
        emit('typing', conversationId);
      } else {
        emit('stop_typing', conversationId);
      }
    },
    [conversationId, emit]
  );

  const listenToMessages = useCallback(
    (callback: (data: any) => void) => {
      return on('new_message', callback);
    },
    [on]
  );

  const listenToUserTyping = useCallback(
    (callback: (data: any) => void) => {
      return on('user_typing', callback);
    },
    [on]
  );

  const listenToUserStoppedTyping = useCallback(
    (callback: (data: any) => void) => {
      return on('user_stopped_typing', callback);
    },
    [on]
  );

  const listenToMessagesRead = useCallback(
    (callback: (data: any) => void) => {
      return on('messages_read', callback);
    },
    [on]
  );

  const listenToUserActive = useCallback(
    (callback: (data: any) => void) => {
      return on('user_active', callback);
    },
    [on]
  );

  const listenToUserInactive = useCallback(
    (callback: (data: any) => void) => {
      return on('user_inactive', callback);
    },
    [on]
  );

  // Auto-join on mount
  useEffect(() => {
    if (conversationId) {
      joinChat();
    }
    return () => {
      if (conversationId) {
        leaveChat();
      }
    };
  }, [conversationId, joinChat, leaveChat]);

  return {
    joinChat,
    leaveChat,
    sendMessage,
    markAsRead,
    setTyping,
    listenToMessages,
    listenToUserTyping,
    listenToUserStoppedTyping,
    listenToMessagesRead,
    listenToUserActive,
    listenToUserInactive,
  };
}

/**
 * Hook for real-time notifications
 */
export function useNotifications() {
  const { emit, on } = useSocket({ autoConnect: true });

  const subscribe = useCallback(() => {
    emit('subscribe_notifications');
  }, [emit]);

  const unsubscribe = useCallback(() => {
    emit('unsubscribe_notifications');
  }, [emit]);

  const listenToNotifications = useCallback(
    (callback: (data: any) => void) => {
      return on('notification', callback);
    },
    [on]
  );

  // Auto-subscribe on mount
  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    subscribe,
    unsubscribe,
    listenToNotifications,
  };
}

/**
 * Hook for voice/video calls
 */
export function useCalls() {
  const { emit, on } = useSocket({ autoConnect: true });

  const initiateCall = useCallback(
    (recipientId: string, callType: 'VOICE' | 'VIDEO') => {
      emit('initiate_call', { recipientId, callType });
    },
    [emit]
  );

  const acceptCall = useCallback(
    (callerId: string) => {
      emit('accept_call', { callerId });
    },
    [emit]
  );

  const rejectCall = useCallback(
    (callerId: string, reason?: string) => {
      emit('reject_call', { callerId, reason });
    },
    [emit]
  );

  const endCall = useCallback(
    (otherUserId: string, duration: number) => {
      emit('end_call', { otherUserId, duration });
    },
    [emit]
  );

  const listenToIncomingCall = useCallback(
    (callback: (data: any) => void) => {
      return on('incoming_call', callback);
    },
    [on]
  );

  const listenToCallAccepted = useCallback(
    (callback: (data: any) => void) => {
      return on('call_accepted', callback);
    },
    [on]
  );

  const listenToCallRejected = useCallback(
    (callback: (data: any) => void) => {
      return on('call_rejected', callback);
    },
    [on]
  );

  const listenToCallEnded = useCallback(
    (callback: (data: any) => void) => {
      return on('call_ended', callback);
    },
    [on]
  );

  return {
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    listenToIncomingCall,
    listenToCallAccepted,
    listenToCallRejected,
    listenToCallEnded,
  };
}
