import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { TokenService } from './token.service';
import { Subject } from 'rxjs';

export interface ReadReceipt {
  conversationId: string;
  readByUserId: string;
}

export interface NotificationCountUpdate {
  notificationCount: number;
  messageCount: number;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private tokenService = inject(TokenService);

  private client: Client | null = null;
  private subscriptions = new Map<string, StompSubscription>();
  private failCount = 0;
  private maxRetries = 10;

  connected = signal<boolean>(false);

  readonly notification$ = new Subject<any>();
  readonly notificationCount$ = new Subject<NotificationCountUpdate>();
  readonly message$ = new Subject<{ conversationId: string; message: any }>();
  readonly readReceipt$ = new Subject<ReadReceipt>();

  connect() {
    if (this.client?.active) return;

    const token = this.tokenService.getAccessToken();
    if (!token) return;

    this.failCount = 0;

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        this.failCount = 0;
        this.connected.set(true);
        this.subscribeToUserChannels();
      },

      onDisconnect: () => {
        this.connected.set(false);
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'], frame.body);
        this.connected.set(false);
      },

      onWebSocketClose: (event) => {
        this.failCount++;
        this.connected.set(false);

        if (this.client && this.failCount >= this.maxRetries) {
          console.warn(`WebSocket: gave up after ${this.maxRetries} attempts. Call connect() to retry.`);
          this.client.deactivate();
        } else if (this.client) {
          this.client.reconnectDelay = Math.min(5000 * Math.pow(2, this.failCount - 1), 30000);
        }
      },
    });

    this.client.activate();
  }

  disconnect() {
    this.unsubscribeAll();
    if (this.client) {
      this.client.deactivate();
    }
    this.client = null;
    this.connected.set(false);
  }

  ngOnDestroy() {
    this.disconnect();
  }

  private subscribeToUserChannels() {
    if (!this.client?.connected) return;

    this.subscribe(`/user/queue/notifications`, (msg: IMessage) => {
      const notification = JSON.parse(msg.body);
      this.notification$.next(notification);
    });

    this.subscribe(`/user/queue/notifications/count`, (msg: IMessage) => {
      const counts: NotificationCountUpdate = JSON.parse(msg.body);
      this.notificationCount$.next(counts);
    });
  }

  subscribeToConversation(conversationId: string) {
    if (!this.client?.connected) return;

    const msgDest = `/topic/conversations/${conversationId}`;
    const readDest = `/topic/conversations/${conversationId}/read`;

    if (!this.subscriptions.has(msgDest)) {
      this.subscribe(msgDest, (msg: IMessage) => {
        const message = JSON.parse(msg.body);
        this.message$.next({ conversationId, message });
      });
    }

    if (!this.subscriptions.has(readDest)) {
      this.subscribe(readDest, (msg: IMessage) => {
        const receipt: ReadReceipt = JSON.parse(msg.body);
        this.readReceipt$.next(receipt);
      });
    }
  }

  unsubscribeFromConversation(conversationId: string) {
    const msgDest = `/topic/conversations/${conversationId}`;
    const readDest = `/topic/conversations/${conversationId}/read`;
    this.unsubscribe(msgDest);
    this.unsubscribe(readDest);
  }

  sendMessage(conversationId: string, content: string, jobId?: string) {
    if (!this.client?.connected) return;
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ conversationId, content, jobId: jobId || null }),
    });
  }

  private subscribe(destination: string, callback: (msg: IMessage) => void) {
    if (!this.client?.connected || this.subscriptions.has(destination)) return;
    const sub = this.client.subscribe(destination, callback);
    this.subscriptions.set(destination, sub);
  }

  private unsubscribe(destination: string) {
    const sub = this.subscriptions.get(destination);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  private unsubscribeAll() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
  }
}
