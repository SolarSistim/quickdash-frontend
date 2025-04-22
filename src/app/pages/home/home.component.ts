import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from '../../features/dashboard/dashboard.component';
import { SearchComponent } from '../../features/search/search.component';
import { SettingsService } from '../../features/settings/settings.service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent, SearchComponent,CommonModule,MatMenuModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  @ViewChild(DashboardComponent) dashboardComponent!: DashboardComponent;

  private settingsService = inject(SettingsService);

  backgroundColor = '#ffffff';

  ngOnInit() {
    this.settingsService.fetchAllSettings().subscribe((settings) => {
      const match = settings.find(s => s.key === 'GLOBAL_BG_COLOR');
      if (match) {
        console.log('Setting background color to:', match.value);
        document.body.style.backgroundColor = match.value;
      }
    });
  }

  openCategoryDialog() {
    this.dashboardComponent.openCategoryDialog();
  }

  openLinkGroupDialog() {
    this.dashboardComponent.openLinkGroupDialog();
  }

  openLinkDialog() {
    this.dashboardComponent.openLinkDialog();
  }
  
}
