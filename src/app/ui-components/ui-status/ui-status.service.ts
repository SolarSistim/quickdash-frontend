import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type StatusType = 'loading' | 'success' | 'error';

@Injectable({
  providedIn: 'root'
})
export class StatusMessageService {
  private _message = new BehaviorSubject<string | null>(null);
  private _status = new BehaviorSubject<StatusType>('loading');

  message$ = this._message.asObservable();
  status$ = this._status.asObservable();

  private lastShownTimestamp: number | null = null;
  private clearTimeoutRef: any;

  private readonly MIN_DISPLAY_MS = 250;
  private readonly AUTO_CLEAR_MS = 3000;

  show(message: string, status: StatusType = 'loading') {
    this._message.next(message);
    this._status.next(status);
    this.lastShownTimestamp = Date.now();

    // Clear after max display timeout
    clearTimeout(this.clearTimeoutRef);
    this.clearTimeoutRef = setTimeout(() => this.clear(), this.AUTO_CLEAR_MS);
  }

  clear() {
    const elapsed = Date.now() - (this.lastShownTimestamp ?? 0);

    if (elapsed < this.MIN_DISPLAY_MS) {
      const delay = this.MIN_DISPLAY_MS - elapsed;
      setTimeout(() => this._message.next(null), delay);
    } else {
      this._message.next(null);
    }
  }

  showDebug(message: string = 'Debug status test', status: StatusType = 'loading') {
    this.show(message, status);
  }
}
