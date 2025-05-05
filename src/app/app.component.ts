import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsService } from './settings-components/app-settings/settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  constructor(private settingsService: SettingsService) {}

  ngOnInit() {
    this.settingsService.loadSettings().subscribe(settings => {
      if (settings['PAGE_TITLE']) {
        document.title = settings['PAGE_TITLE'];
      }
    });
  }
  
}
