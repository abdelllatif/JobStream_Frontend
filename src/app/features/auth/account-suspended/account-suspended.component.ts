import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SuspensionService } from '../../../core/services/suspension.service';

@Component({
  selector: 'app-account-suspended',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-suspended.component.html',
  styleUrls: ['./account-suspended.component.css']
})
export class AccountSuspendedComponent implements OnInit {
  private suspensionService = inject(SuspensionService);
  private router = inject(Router);

  suspensionMessage: string | null = null;
  email: string | null = null;

  ngOnInit(): void {
    this.suspensionMessage = this.suspensionService.getSuspensionMessage();
    this.email = this.suspensionService.getEmail();

    if (!this.suspensionMessage) {
      this.router.navigate(['/login']);
    }
  }

  goToLogin(): void {
    this.suspensionService.clearSuspension();
    this.router.navigate(['/login']);
  }
}
