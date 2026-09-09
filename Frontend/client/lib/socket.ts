import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string) {
    if (this.socket) return this.socket;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    this.socket = io(apiUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: token ? { token } : undefined,
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket() {
    return this.socket;
  }

  emit(event: string, payload?: unknown) {
    if (!this.socket) return;
    this.socket.emit(event, payload);
  }
}

export const socketService = new SocketService();
export const getSocket = () => socketService.connect();
