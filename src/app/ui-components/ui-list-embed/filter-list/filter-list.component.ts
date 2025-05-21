import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-filter-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './filter-list.component.html',
  styleUrls: ['./filter-list.component.css']
})
export class FilterListComponent {

  @Input() styleSettings: { groupFontColor: string } = { groupFontColor: '#ffffff' };
  @Input() filterText: string = '';
  @Output() filterTextChange = new EventEmitter<string>();

  @Input() filterByName: boolean = true;
  @Input() filterByDescription: boolean = true;
  @Input() filterByCategory: boolean = true;

  @Output() filterByNameChange = new EventEmitter<boolean>();
  @Output() filterByDescriptionChange = new EventEmitter<boolean>();
  @Output() filterByCategoryChange = new EventEmitter<boolean>();

  clear() {
    this.filterText = '';
    this.filterTextChange.emit(this.filterText);
  }

  onInputChange(value: string) {
    this.filterText = value;
    this.filterTextChange.emit(value);
  }

  get isFilterDisabled(): boolean {
    return !this.filterByName && !this.filterByDescription && !this.filterByCategory;
  }

  get filterLabel(): string {
  const filters = [];
  if (this.filterByName) filters.push('Name');
  if (this.filterByDescription) filters.push('Description');
  if (this.filterByCategory) filters.push('Category');

  if (filters.length === 0) return 'Filter';
  if (filters.length === 1) return `Filter by ${filters[0]}`;
  if (filters.length === 2) return `Filter by ${filters[0]} and ${filters[1]}`;
  return `Filter by ${filters.slice(0, -1).join(', ')}, and ${filters[filters.length - 1]}`;
}

}
