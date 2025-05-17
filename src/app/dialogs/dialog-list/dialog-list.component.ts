import { Component, Inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UiListEmbedComponent } from '../../ui-components/ui-list-embed/ui-list-embed.component';
import { SettingsService } from '../../settings-components/app-settings/settings.service';

@Component({
  selector: 'app-dialog-list',
  standalone: true,
  imports: [
    CommonModule,
    UiListEmbedComponent
  ],
  templateUrl: './dialog-list.component.html',
  styleUrl: './dialog-list.component.css'
})
export class DialogListComponent implements OnInit {

  @Output() listAdded = new EventEmitter<void>();
  groupBackgroundColor = '#2e3a46';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { list: any },
    private settingsService: SettingsService
  ) {}

  onListAdded() {
    this.listAdded.emit(); // ✅ Pass event up to UiLinkGroupComponent
  }

  ngOnInit(): void {
    this.settingsService.loadSettings().subscribe({
      next: (settings) => {
        this.groupBackgroundColor = settings['GROUP_BACKGROUND_COLOR'] || this.groupBackgroundColor;
      },
      error: (err) => {
        console.error('❌ Failed to load settings in DialogListComponent:', err);
      }
    });
  }
}
