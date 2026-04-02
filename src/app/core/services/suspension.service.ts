import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SuspensionService {
  suspensionMessage = signal<string | null>(null);
  email = signal<string | null>(null);

  setSuspension(message: string, email: string): void {
    this.suspensionMessage.set(message);
    this.email.set(email);
  }

  getSuspensionMessage(): string | null {
    return this.suspensionMessage();
  }

  getEmail(): string | null {
    return this.email();
  }

  clearSuspension(): void {
    this.suspensionMessage.set(null);
    this.email.set(null);
  }
}
