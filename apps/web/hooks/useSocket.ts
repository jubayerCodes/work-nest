'use client';
import { useEffect, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket, joinWorkspace, leaveWorkspace } from '@/lib/socket';
import { useNotificationStore } from '@/store/notification.store';
import { usePresenceStore } from '@/store/presence.store';

export function useSocket(workspaceId?: string) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { setOnlineUsers, addOnlineUser, removeOnlineUser } = usePresenceStore();
  const prevWorkspaceId = useRef<string | undefined>();

  useEffect(() => {
    const socket = getSocket();
    connectSocket();

    socket.on('notification:new', addNotification);
    socket.on('presence:online', ({ userIds }) => setOnlineUsers(userIds));
    socket.on('presence:join', ({ userId }) => addOnlineUser(userId));
    socket.on('presence:leave', ({ userId }) => removeOnlineUser(userId));

    return () => {
      socket.off('notification:new', addNotification);
      socket.off('presence:online');
      socket.off('presence:join');
      socket.off('presence:leave');
    };
  }, [addNotification, setOnlineUsers, addOnlineUser, removeOnlineUser]);

  // Join/leave workspace room when workspaceId changes
  useEffect(() => {
    if (!workspaceId) return;
    if (prevWorkspaceId.current && prevWorkspaceId.current !== workspaceId) {
      leaveWorkspace(prevWorkspaceId.current);
    }
    joinWorkspace(workspaceId);
    prevWorkspaceId.current = workspaceId;

    return () => {
      leaveWorkspace(workspaceId);
    };
  }, [workspaceId]);

  return getSocket();
}
