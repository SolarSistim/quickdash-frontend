import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { DashboardDropService } from '../../features/dashboard-drop/dashboard-drop.service';
import { SettingsService } from '../../settings-components/app-settings/settings.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, AfterViewInit {

  @ViewChild('searchInput', { static: true }) searchInputRef!: ElementRef<HTMLInputElement>;

  searchControl = new FormControl('');
  allLinks: any[] = [];
  filteredLinks: any[] = [];
  searchProviderName = '';
  searchProviderUrl = '';
  rawSearchQuery = '';

  searchBackgroundColor = '#000000';
  searchBackgroundOpacity = 0.4;

  constructor(
    private dashboardService: DashboardDropService,
    private settingsService: SettingsService
  ) {}

  get cardBackgroundRgba(): string {
    const hex = this.searchBackgroundColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${this.searchBackgroundOpacity})`;
  }

  ngOnInit(): void {
    // Load links
    this.dashboardService.getAllLinks().subscribe(links => this.allLinks = links);
  
    // Load settings
    this.settingsService.loadSettings().subscribe(settings => {
      this.searchProviderName = settings['SEARCH_FEATURE_PROVIDER_NAME'] || 'Google';
      this.searchProviderUrl = settings['SEARCH_FEATURE_QUERY_URL'] || 'https://www.google.com/search?q=';
    
      // ✅ NEW: Load and log background color + opacity
      this.searchBackgroundColor = settings['SEARCH_FEATURE_BACKGROUND_COLOR'] || '#000000';
      this.searchBackgroundOpacity = parseFloat(settings['SEARCH_FEATURE_BACKGROUND_OPACITY'] || '1.0');
    
      console.log('🎨 SEARCH_FEATURE_BACKGROUND_COLOR:', this.searchBackgroundColor);
      console.log('🟡 SEARCH_FEATURE_BACKGROUND_OPACITY:', this.searchBackgroundOpacity);
    });    
  
    // Filter links on input
    this.searchControl.valueChanges
      .pipe(
        debounceTime(150),
        startWith(''),
        map(value => {
          if (typeof value === 'string') {
            this.rawSearchQuery = value;
            return value.toLowerCase();
          }
          return '';
        })
      )
      .subscribe(query => {
        const seen = new Set<string>();
        this.filteredLinks = this.allLinks
          .filter(link => link.name.toLowerCase().includes(query))
          .filter(link => {
            const lowerName = link.name.toLowerCase();
            if (seen.has(lowerName)) return false;
            seen.add(lowerName);
            return true;
          });
      });
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInputRef.nativeElement.focus();
    });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.rawSearchQuery = '';
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedValue = event.option.value;
  
    if (selectedValue === 'SEARCH_EXTERNAL') {
      this.searchExternal();
    } else if (selectedValue?.url) {
      this.openLink(selectedValue);
    }
  
    // ✅ Always reset after handling selection
    this.searchControl.setValue('');
    this.rawSearchQuery = '';
  }

  handleEnter(): void {
    const query = this.searchControl.value?.trim();
    if (query) this.searchExternal();
  }

  searchExternal(): void {
    const query = this.rawSearchQuery.trim();
    if (!query) return;
  
    let base = this.searchProviderUrl;
  
    if (!base.includes('?')) {
      base += '?q=';
    } else if (!base.includes('q=')) {
      base += base.endsWith('&') ? '' : '&';
      base += 'q=';
    }
  
    const url = base + encodeURIComponent(query);
    console.log('Opening search URL:', url);
    window.open(url, '_blank');
  }

  openLink(link: any): void {
    if (link.url) {
      window.open(link.url, '_blank');
    }
  }

  getIconUrl(iconFilename: string): string {
    return `/assets/icons/${iconFilename}`;
  }

  onFocus(): void {
    const currentValue = this.searchControl.value || '';
    this.searchControl.setValue(currentValue);
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.getIconUrl('default.png');
  }

  onSearchSelected(): void {
  console.log('Option selected — opening tab...');
    setTimeout(() => {
      this.searchExternal();
    }, 0);
  }

}
