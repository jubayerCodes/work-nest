import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@worknest/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,     // sends access_token cookie
      transports: ['websocket', 'polling'],
      autoConnect: false,        // connect manually after auth
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function joinWorkspace(workspaceId: string): void {
  getSocket().emit('workspace:join', workspaceId);
}

export function leaveWorkspace(workspaceId: string): void {
  getSocket().emit('workspace:leave', workspaceId);
}
