import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId?: string, token?: string) {
    if (this.socket && userId && this.userId === userId) {
      return this.socket;
    }

    if (this.socket && userId && this.userId !== userId) {
      this.disconnect();
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    this.socket = io(apiUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: token ? { token } : undefined,
    });

    this.userId = userId || this.userId;
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.userId = null;
  }

  getSocket() {
    return this.socket;
  }

  emit(event: string, payload?: unknown) {
    if (!this.socket) return;
    this.socket.emit(event, payload);
  }

  // 👇 Yeh do naye methods zaroor add karein listener ke liye
  on(event: string, callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }
}

export const socketService = new SocketService();
export const getSocket = (userId?: string, token?: string) => socketService.connect(userId, token);