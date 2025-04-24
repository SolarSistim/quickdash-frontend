import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SearchComponent } from '../../features/search/search.component';
import { SettingsService } from '../../features/settings/settings.service';
import { MatMenuModule } from '@angular/material/menu';
import { DashboardDropComponent } from '../../features/dashboard-drop/dashboard-drop.component';
import { UiStatusComponent } from '../../ui-components/ui-status/ui-status.component';
import { StatusMessageService } from '../../ui-components/ui-status/ui-status.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SearchComponent,CommonModule,MatMenuModule,DashboardDropComponent,UiStatusComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  private settingsService = inject(SettingsService);

  backgroundColor = '#212529';
  
  constructor(
    private statusService: StatusMessageService
  ) {}

  ngOnInit() {
    this.settingsService.fetchAllSettings().pipe(
      catchError((error) => {
        console.error('Failed to fetch settings, using default background color.', error);
        document.body.style.backgroundColor = this.backgroundColor;
        return of([]); // fallback to empty array
      })
    ).subscribe((settings) => {
      const match = settings.find(s => s.key === 'GLOBAL_BG_COLOR');
      if (match) {
        console.log('Setting background color to:', match.value);
        document.body.style.backgroundColor = match.value;
      } else {
        // Optional fallback if setting is not found
        document.body.style.backgroundColor = this.backgroundColor;
      }
    });
  }

  testStatus(type: 'loading' | 'success' | 'error') {
    this.statusService.show(`Test: ${type}`, type);
  }

  
}
