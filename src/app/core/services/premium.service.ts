import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PremiumService {
  checkActiveSubscription(userId: string): Observable<boolean> {
    return of(false); // Default to false
  }
}
