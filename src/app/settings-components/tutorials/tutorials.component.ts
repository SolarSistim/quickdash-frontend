import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { TutorialsService } from './tutorials.service';
import { UiStatusComponent } from '../../ui-components/ui-status/ui-status.component';
import { StatusMessageService } from '../../ui-components/ui-status/ui-status.service';

@Component({
  selector: 'app-tutorials',
  imports: [MatButtonModule,UiStatusComponent],
  templateUrl: './tutorials.component.html',
  styleUrl: './tutorials.component.css'
})
export class TutorialsComponent {

  constructor(
    private tutorialsService: TutorialsService,
    private statusService: StatusMessageService
  ) {}

  disableAll() {
  this.statusService.show('Disabling tutorials...', 'loading', false, 1000); // 1 second loading

  this.tutorialsService.toggleAllTutorials(false).subscribe({
    next: () => {
      setTimeout(() => {
        this.statusService.show('All tutorials disabled', 'success', false, 3000);
      }, 1000); // delay to let loading finish
    },
    error: () => {
      setTimeout(() => {
        this.statusService.show('Failed to disable tutorials', 'error', false, 3000);
      }, 1000);
    }
  });
}

enableAll() {
  this.statusService.show('Enabling tutorials...', 'loading', false, 1000);

  this.tutorialsService.toggleAllTutorials(true).subscribe({
    next: () => {
      setTimeout(() => {
        this.statusService.show('All tutorials enabled', 'success', false, 3000);
      }, 1000);
    },
    error: () => {
      setTimeout(() => {
        this.statusService.show('Failed to enable tutorials', 'error', false, 3000);
      }, 1000);
    }
  });
}


}
