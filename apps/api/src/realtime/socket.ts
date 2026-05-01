import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { ServerToClientEvents, ClientToServerEvents } from '@worknest/types';

// In-memory presence: workspaceId → Set<userId>
const presence = new Map<string, Set<string>>();

let io: Server<ClientToServerEvents, ServerToClientEvents>;

export function getIO(): Server<ClientToServerEvents, ServerToClientEvents> {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitToWorkspace<K extends keyof ServerToClientEvents>(
  workspaceId: string,
  event: K,
  data: Parameters<ServerToClientEvents[K]>[0]
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (io as any).to(`workspace:${workspaceId}`).emit(event, data);
}

export function initSocket(server: HttpServer): void {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware on socket connection
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.cookie
        ?.split(';')
        .find((c: string) => c.trim().startsWith('access_token='))
        ?.split('=')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
        id: string;
        email: string;
        name: string;
      };
      (socket as typeof socket & { userId: string }).userId = payload.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as typeof socket & { userId: string }).userId;
    console.log(`[Socket] Connected: ${userId} (${socket.id})`);

    // Join personal room for targeted notifications (mentions, DMs, etc.)
    socket.join(`user:${userId}`);

    // Join a workspace room
    socket.on('workspace:join', (workspaceId: string) => {
      const room = `workspace:${workspaceId}`;
      socket.join(room);

      // Update presence
      if (!presence.has(workspaceId)) {
        presence.set(workspaceId, new Set());
      }
      presence.get(workspaceId)!.add(userId);

      // Broadcast updated presence list to room
      const onlineIds = Array.from(presence.get(workspaceId)!);
      io.to(room).emit('presence:online', { userIds: onlineIds });
      socket.to(room).emit('presence:join', { userId });

      console.log(`[Socket] ${userId} joined workspace:${workspaceId}`);
    });

    // Leave a workspace room
    socket.on('workspace:leave', (workspaceId: string) => {
      const room = `workspace:${workspaceId}`;
      socket.leave(room);
      presence.get(workspaceId)?.delete(userId);

      const onlineIds = Array.from(presence.get(workspaceId) ?? []);
      io.to(room).emit('presence:online', { userIds: onlineIds });
      socket.to(room).emit('presence:leave', { userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove from all workspace presence maps
      presence.forEach((userIds, wsId) => {
        if (userIds.has(userId)) {
          userIds.delete(userId);
          const room = `workspace:${wsId}`;
          io.to(room).emit('presence:leave', { userId });
          io.to(room).emit('presence:online', { userIds: Array.from(userIds) });
        }
      });
      console.log(`[Socket] Disconnected: ${userId}`);
    });
  });
}
