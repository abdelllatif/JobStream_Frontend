import { Component, signal, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { NotificationService } from '../../core/services/notification.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';
import { Message, Conversation } from '../../core/models/message.model';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private notifService = inject(NotificationService);
  private wsService = inject(WebSocketService);
  private router = inject(Router);

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  conversations = signal<Conversation[]>([]);
  filteredConversations = signal<Conversation[]>([]);
  selectedConv = signal<Conversation | null>(null);
  activeMessages = signal<Message[]>([]);

  loadingConvs = signal<boolean>(true);
  loadingMsgs = signal<boolean>(false);
  sending = signal<boolean>(false);

  newMsgContent: string = '';
  searchQuery: string = '';
  private shouldScroll = false;
  private subs: Subscription[] = [];
  private currentConversationId: string | null = null;

  currentUserId = () => this.authService.currentUserValue?.id;

  ngOnInit(): void {
    this.notifService.markMessageNotificationsAsRead().subscribe({ error: () => {} });

    this.fetchConversations();

    this.subs.push(
      this.wsService.message$.subscribe(({ conversationId, message }) => {
        if (this.currentConversationId === conversationId) {
          const exists = this.activeMessages().some(m => m.id === message.id);
          if (!exists) {
            this.activeMessages.update(msgs => [...msgs, message]);
            this.shouldScroll = true;

            if (!this.isCurrentUser(message.senderId)) {
              this.messageService.markConversationAsRead(conversationId).subscribe();
              this.notifService.markMessageNotificationsAsRead().subscribe({ error: () => {} });
            }
          }
        }
        this.updateConversationPreview(conversationId, message);
      })
    );

    this.subs.push(
      this.wsService.readReceipt$.subscribe(receipt => {
        if (this.currentConversationId === receipt.conversationId && !this.isCurrentUser(receipt.readByUserId)) {
          this.activeMessages.update(msgs =>
            msgs.map(m => this.isCurrentUser(m.senderId) ? { ...m, isRead: true } : m)
          );
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.currentConversationId) {
      this.wsService.unsubscribeFromConversation(this.currentConversationId);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  fetchConversations() {
    this.loadingConvs.set(true);
    this.messageService.getMyConversations().subscribe({
      next: (data) => {
        data.sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        this.conversations.set(data);
        this.filteredConversations.set(data);
        this.loadingConvs.set(false);

        const pendingId = this.messageService.pendingConversationId();
        if (pendingId) {
          this.messageService.pendingConversationId.set(null);
          const target = data.find(c => c.id === pendingId);
          if (target) this.selectConversation(target);
        }
      },
      error: () => this.loadingConvs.set(false)
    });
  }

  selectConversation(conv: Conversation) {
    if (this.selectedConv()?.id === conv.id) return;

    if (this.currentConversationId) {
      this.wsService.unsubscribeFromConversation(this.currentConversationId);
    }

    if (conv.unreadCount && conv.unreadCount > 0) {
      this.conversations.update(convs =>
        convs.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
      );
      this.filterConversations();
    }

    this.selectedConv.set({ ...conv, unreadCount: 0 });
    this.currentConversationId = conv.id;
    this.loadingMsgs.set(true);
    this.activeMessages.set([]);

    this.wsService.subscribeToConversation(conv.id);

    this.messageService.getMessages(conv.id).subscribe({
      next: (resp) => {
        const msgs = resp.content || resp || [];
        msgs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        this.activeMessages.set(msgs);
        this.loadingMsgs.set(false);
        this.shouldScroll = true;

        const hasUnread = msgs.some((m: Message) => !m.isRead && !this.isCurrentUser(m.senderId));
        if (hasUnread) {
          this.messageService.markConversationAsRead(conv.id).subscribe();
          this.notifService.markMessageNotificationsAsRead().subscribe({ error: () => {} });
        }
      },
      error: () => this.loadingMsgs.set(false)
    });
  }

  handleEnter(event: Event) {
    event.preventDefault();
    this.sendMessage();
  }

  sendMessage() {
    if (!this.newMsgContent.trim() || !this.selectedConv() || this.sending()) return;
    this.sending.set(true);

    const convId = this.selectedConv()!.id;
    const content = this.newMsgContent.trim();

    const payload = { conversationId: convId, content };

    this.messageService.sendMessage(payload).subscribe({
      next: (msg) => {
        const exists = this.activeMessages().some(m => m.id === msg.id);
        if (!exists) {
          this.activeMessages.update(msgs => [...msgs, msg]);
        }
        this.newMsgContent = '';
        this.sending.set(false);
        this.shouldScroll = true;
        this.updateConversationPreview(convId, msg);
      },
      error: () => {
        this.sending.set(false);
      }
    });
  }

  getOtherUser(conv: Conversation | null): any {
    if (!conv || !conv.participants) return null;
    const currentId = this.currentUserId();
    const other = conv.participants.find(p => p.id !== currentId) || conv.participants[0];
    if (!other) return null;
    return {
      ...other,
      displayPhoto: other.photoUrl || other.profile?.photoUrl || null,
      displayName: other.firstName
        ? `${other.firstName} ${other.lastName || ''}`.trim()
        : other.email.split('@')[0]
    };
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserId();
  }

  goToUserProfile(conv: Conversation | null) {
    const other = this.getOtherUser(conv);
    if (other?.id) {
      this.router.navigate(['/profile', other.id]);
    }
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  filterConversations() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredConversations.set(this.conversations());
      return;
    }
    this.filteredConversations.set(
      this.conversations().filter(conv => {
        const other = this.getOtherUser(conv);
        return other?.displayName?.toLowerCase().includes(q) ||
               conv.lastMessage?.content?.toLowerCase().includes(q);
      })
    );
  }

  private updateConversationPreview(conversationId: string, message: any) {
    this.conversations.update(convs => {
      const updated = convs.map(c => {
        if (c.id === conversationId) {
          return { ...c, lastMessage: message };
        }
        return c;
      });
      updated.sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      return updated;
    });
    this.filterConversations();
  }

  private scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}
