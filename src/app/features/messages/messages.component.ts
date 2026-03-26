import { Component, signal, inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { Message, Conversation } from '../../core/models/message.model';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-80px)] max-w-7xl mx-auto p-4 flex gap-4">
      
      <!-- Master View: Conversations List -->
      <aside class="w-full md:w-80 lg:w-96 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden shrink-0"
             [class.hidden]="selectedConv() && isMobile()">
        
        <div class="p-6 border-b border-slate-100">
          <h2 class="text-2xl font-black text-slate-900 mb-4">Messagerie</h2>
          <div class="relative">
            <input type="text" placeholder="Rechercher des messages..." 
                   class="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 font-medium transition-all shadow-inner text-sm">
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          @if (loadingConvs()) {
            @for (n of [1,2,3,4,5]; track $index) {
              <div class="p-4 border-b border-slate-50 flex gap-3 animate-pulse">
                <div class="w-12 h-12 bg-slate-100 rounded-full shrink-0"></div>
                <div class="flex-1 space-y-2 py-1">
                  <div class="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div class="h-3 bg-slate-100 rounded w-3/4"></div>
                </div>
              </div>
            }
          } @else {
            @for (conv of conversations(); track conv.id) {
              <div 
                class="p-4 border-b border-slate-50 flex items-center gap-4 cursor-pointer transition-colors relative group"
                [ngClass]="{'bg-primary-50/50': selectedConv()?.id === conv.id, 'hover:bg-slate-50': selectedConv()?.id !== conv.id}"
                (click)="selectConversation(conv)"
              >
                <!-- Active Indicator -->
                <div *ngIf="selectedConv()?.id === conv.id" class="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>

                <div class="relative">
                  <img [src]="getOtherUser(conv)?.profile?.photoUrl || 'https://ui-avatars.com/api/?name=' + getOtherUser(conv)?.email" 
                       alt="Avatar" class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm">
                  <!-- Unread badge logic could go here if unreadCount > 0 -->
                  <div *ngIf="false" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-baseline mb-1">
                    <span class="font-bold text-slate-900 text-sm truncate pr-2">{{ getOtherUser(conv)?.email.split('@')[0] }}</span>
                    <span class="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider" *ngIf="conv.lastMessage">
                      {{ conv.lastMessage.createdAt | date:'shortTime' }}
                    </span>
                  </div>
                  <p class="text-xs truncate font-medium" 
                     [ngClass]="{'text-slate-500': conv.lastMessage?.read, 'text-slate-900 font-bold': !conv.lastMessage?.read}">
                    {{ conv.lastMessage?.content || 'Nouvelle conversation' }}
                  </p>
                </div>
              </div>
            } @empty {
              <div class="p-8 text-center flex flex-col items-center">
                 <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                 </div>
                 <p class="text-sm font-bold text-slate-500">Aucune conversation</p>
              </div>
            }
          }
        </div>
      </aside>

      <!-- Detail View: Active Thread -->
      <main class="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden"
            [class.hidden]="!selectedConv() && isMobile()">
        @if (selectedConv()) {
          <!-- Chat Header -->
          <header class="p-4 md:p-6 border-b border-slate-100 flex items-center gap-4 bg-white z-10">
            <button class="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50"
                    (click)="selectedConv.set(null)">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <img [src]="getOtherUser(selectedConv()!)?.profile?.photoUrl || 'https://ui-avatars.com/api/?name=' + getOtherUser(selectedConv()!)?.email" 
                 alt="Avatar" class="w-10 h-10 md:w-12 md:h-12 rounded-full border border-slate-100 object-cover">
            <div>
               <h3 class="font-bold text-slate-900">{{ getOtherUser(selectedConv()!)?.email.split('@')[0] }}</h3>
               <p class="text-xs font-medium text-slate-500">{{ getOtherUser(selectedConv()!)?.role }}</p>
            </div>
          </header>

          <!-- Messages Area -->
          <div class="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-6" #scrollMe>
            @if (loadingMsgs()) {
               <div class="flex justify-center py-4"><div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>
            }
            @for (msg of activeMessages(); track msg.id) {
              <div class="flex" [ngClass]="{'justify-end': isCurrentUser(msg.senderId), 'justify-start': !isCurrentUser(msg.senderId)}">
                <div class="max-w-[85%] md:max-w-[70%] flex flex-col" [ngClass]="{'items-end': isCurrentUser(msg.senderId), 'items-start': !isCurrentUser(msg.senderId)}">
                  <div class="px-5 py-3 rounded-2xl shadow-sm relative text-[15px] leading-relaxed"
                       [ngClass]="{
                         'bg-primary-600 text-white rounded-tr-sm': isCurrentUser(msg.senderId),
                         'bg-white text-slate-800 border border-slate-100 rounded-tl-sm': !isCurrentUser(msg.senderId)
                       }">
                    {{ msg.content }}
                  </div>
                  <span class="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider px-1">
                    {{ msg.createdAt | date:'shortTime' }}
                    <span *ngIf="isCurrentUser(msg.senderId) && msg.read" class="ml-1 text-primary-500">✓✓</span>
                    <span *ngIf="isCurrentUser(msg.senderId) && !msg.read" class="ml-1">✓</span>
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Message Input -->
          <footer class="p-4 md:p-6 border-t border-slate-100 bg-white">
            <div class="flex items-end gap-3 bg-slate-50 p-2 pl-4 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all shadow-inner">
              <textarea 
                [(ngModel)]="newMsgContent" 
                placeholder="Écrivez votre message..."
                class="flex-1 bg-transparent border-none resize-none max-h-32 min-h-[44px] py-3 text-[15px] font-medium text-slate-700 placeholder-slate-400 focus:ring-0"
                rows="1"
                (keydown.enter)="handleEnter($event)"
              ></textarea>
              <button class="w-11 h-11 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-all shrink-0 shadow-md shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed" 
                      [disabled]="!newMsgContent.trim() || sending()" 
                      (click)="sendMessage()">
                <svg *ngIf="!sending()" class="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                <div *ngIf="sending()" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </button>
            </div>
          </footer>
        } @else {
          <div class="flex-1 flex flex-col items-center justify-center bg-slate-50/30 p-8 text-center">
            <div class="w-24 h-24 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-primary-200 mb-6">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Vos messages</h3>
            <p class="text-slate-500 max-w-sm font-medium">Sélectionnez une conversation dans la liste de gauche pour lire ou envoyer un message.</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: []
})
export class MessagesComponent implements OnInit, AfterViewChecked {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  conversations = signal<Conversation[]>([]);
  selectedConv = signal<Conversation | null>(null);
  activeMessages = signal<Message[]>([]);
  
  loadingConvs = signal<boolean>(true);
  loadingMsgs = signal<boolean>(false);
  sending = signal<boolean>(false);
  
  newMsgContent: string = '';
  private shouldScroll = false;

  currentUserId = () => this.authService.currentUserValue?.id;

  ngOnInit(): void {
    this.fetchConversations();
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
        // Sort conversations by most recent message, if available
        data.sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        
        this.conversations.set(data);
        this.loadingConvs.set(false);
      },
      error: () => this.loadingConvs.set(false)
    });
  }

  selectConversation(conv: Conversation) {
    if (this.selectedConv()?.id === conv.id) return;
    
    this.selectedConv.set(conv);
    this.loadingMsgs.set(true);
    this.activeMessages.set([]);

    // Get messages for this conversation
    this.messageService.getMessages(conv.id).subscribe({
      next: (resp) => {
        // Assume backend returns PageResponse, so use resp.content, otherwise resp
        const msgs = resp.content || resp || [];
        // Sort messages chronologically (oldest first for chat view)
        msgs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        this.activeMessages.set(msgs);
        this.loadingMsgs.set(false);
        this.shouldScroll = true;
        
        // Mark as read if not sent by me
        const unreadMsgsContent = msgs.some((m: Message) => !m.read && !this.isCurrentUser(m.senderId));
        if (unreadMsgsContent) {
           this.messageService.markConversationAsRead(conv.id).subscribe(() => this.fetchConversations());
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
    const recipientId = this.getOtherUser(this.selectedConv()!)?.id;
    
    if (!recipientId) { this.sending.set(false); return; }

    const payload = {
      recipientId: recipientId,
      content: this.newMsgContent.trim()
    };

    this.messageService.sendMessage(payload).subscribe({
      next: (msg) => {
        this.activeMessages.update(msgs => [...msgs, msg]);
        this.newMsgContent = '';
        this.sending.set(false);
        this.shouldScroll = true;
        this.fetchConversations(); // refresh list to update last message
      },
      error: () => {
        this.sending.set(false);
      }
    });
  }

  getOtherUser(conv: Conversation | null): any {
    if (!conv) return null;
    const currentId = this.currentUserId();
    return conv.user1.id === currentId ? conv.user2 : conv.user1;
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserId();
  }

  isMobile(): boolean {
    return window.innerWidth < 768; // Tailwind md breakpoint
  }

  private scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}
