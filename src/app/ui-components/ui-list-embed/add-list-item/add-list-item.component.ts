// add-list-item.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ListsService } from '../../../features/lists/lists.service';

@Component({
  selector: 'app-add-list-item',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './add-list-item.component.html',
  styleUrls: ['./add-list-item.component.css']
})
export class AddListItemComponent implements OnChanges {

  @Input() listId!: number;
  @Input() categories: any[] = [];
  @Input() styleSettings: any;
  
  @Output() itemCreated = new EventEmitter<{ keepFormOpen: boolean }>();

  newTitle = '';
  newDescription = '';
  newPriority: 'High' | 'Medium' | 'Low' = 'Medium';
  selectedCategoryId: number | null = null;

  constructor(private listsService: ListsService) {}

  ngOnChanges(changes: SimpleChanges) {
    // 👇 Auto-select the first category if not already selected
    if (changes['categories'] && this.categories?.length > 0 && !this.selectedCategoryId) {
      this.selectedCategoryId = this.categories[0].id;
    }
  }

submit(keepFormOpen: boolean) {
  if (!this.newTitle.trim() || !this.selectedCategoryId || !this.listId) return;

  this.listsService.addItemToList({
    listId: this.listId,
    categoryId: this.selectedCategoryId,
    title: this.newTitle.trim(),
    description: this.newDescription.trim(),
    priority: this.newPriority,
  }).subscribe({
    next: () => {
      this.itemCreated.emit({ keepFormOpen });

      // ✅ Always reset the form after successful submit
      this.resetForm();

      // ✅ But only close the form if it's NOT keepFormOpen
      if (!keepFormOpen) {
        // (Optionally do nothing here if form auto-hides from parent)
      }
    },
    error: (err) => {
      console.error('❌ Failed to add item:', err);
      alert('Failed to add item');
    }
  });
}


  resetForm() {
    this.newTitle = '';
    this.newDescription = '';
    this.newPriority = 'Medium';
    this.selectedCategoryId = this.categories.length > 0 ? this.categories[0].id : null;
  }
}