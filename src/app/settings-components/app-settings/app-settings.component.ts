import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { SettingsService } from './settings.service';
import { StatusMessageService } from '../../ui-components/ui-status/ui-status.service';
import { UiStatusComponent } from '../../ui-components/ui-status/ui-status.component';
import { Router } from '@angular/router'; // ⬅️ import this
import { MatCardModule } from '@angular/material/card';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-app-settings',
  imports: [MatButtonModule,MatInputModule,MatSelectModule,FormsModule,ReactiveFormsModule,CommonModule,UiStatusComponent,MatCardModule],
  templateUrl: './app-settings.component.html',
  styleUrl: './app-settings.component.css'
})
export class AppSettingsComponent {

  formValues: Record<string, string> = {};
  originalValues: Record<string, string> = {};
  changed = false;
  showLogo = false;
  searchFeature = false;

  @ViewChild('fileInputFavicon') fileInputFavicon!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputLogo') fileInputLogo!: ElementRef<HTMLInputElement>;

  constructor(
    private settingsService: SettingsService,
    private statusService: StatusMessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.settingsService.loadSettings().subscribe(settings => {
      this.formValues = { ...settings };
      this.originalValues = { ...settings };
    });
    this.settingsService.loadSettings().subscribe(settings => {
      this.showLogo = settings['LOGO_ENABLE'] !== 'FALSE';
      this.searchFeature = settings['SEARCH_FEATURE'] !== 'FALSE';
    });
  }

  triggerFileInput(key: 'FAVICON_IMAGE' | 'LOGO_IMAGE') {
    if (key === 'FAVICON_IMAGE') {
      this.fileInputFavicon.nativeElement.click();
    } else if (key === 'LOGO_IMAGE') {
      this.fileInputLogo.nativeElement.click();
    }
  }

  onValueChange() {
    const textChanged = Object.keys(this.formValues).some(
      key =>
        key !== 'FAVICON_IMAGE' &&
        key !== 'LOGO_IMAGE' &&
        this.formValues[key] !== this.originalValues[key]
    );
  
    const imageChanged = !!this.pendingFileUploads.FAVICON_IMAGE || !!this.pendingFileUploads.LOGO_IMAGE;
  
    this.changed = textChanged || imageChanged;
  }

  saveSettings() {
    this.statusService.show('Saving settings...', 'loading');
  
    const uploads: Promise<any>[] = [];
  
    for (const key of ['FAVICON_IMAGE', 'LOGO_IMAGE'] as const) {
      const file = this.pendingFileUploads[key];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('key', key);
        uploads.push(this.settingsService.uploadImage(formData).toPromise());
      }
    }
  
    Promise.all(uploads).then(() => {
      const updates = Object.entries(this.formValues)
      .filter(([key, val]) =>
        key !== 'FAVICON_IMAGE' && key !== 'LOGO_IMAGE' && val !== this.originalValues[key]
      );
  
      const updateCalls = updates.map(([key, value]) =>
        this.settingsService.saveSetting(key, value).toPromise()
      );
  
      return Promise.all(updateCalls);
    }).then(() => {
      this.previewUrls = {
        FAVICON_IMAGE: '/assets/branding/favicon/favicon.png?v=' + Date.now(),
        LOGO_IMAGE: '/assets/branding/logo/logo.png?v=' + Date.now()
      };
      this.changed = false;
      this.originalValues = { ...this.formValues };
      this.pendingFileUploads = {
        FAVICON_IMAGE: null,
        LOGO_IMAGE: null
      };
      this.statusService.show('Settings saved successfully!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }).catch((err) => {
      this.statusService.show('Failed to save settings.', 'error');
      console.error(err);
    });
  }

  previewUrls: Record<'FAVICON_IMAGE' | 'LOGO_IMAGE', string | null> = {
    FAVICON_IMAGE: null,
    LOGO_IMAGE: null
  };

  onFileSelected(event: any, settingKey: 'FAVICON_IMAGE' | 'LOGO_IMAGE') {
    const file = event.target.files[0];
    if (!file) return;
  
    this.pendingFileUploads[settingKey] = file;
  
    // ✅ Always use fixed filenames
    this.formValues[settingKey] =
      settingKey === 'FAVICON_IMAGE' ? 'favicon.png' : 'logo.png';
  
    this.previewUrls[settingKey] = URL.createObjectURL(file);
  
    this.onValueChange();
  }

  pendingFileUploads: Record<'FAVICON_IMAGE' | 'LOGO_IMAGE', File | null> = {
    FAVICON_IMAGE: null,
    LOGO_IMAGE: null
  };

}

