import { Component, Input, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ListsService } from '../../features/lists/lists.service';
import { SettingsService } from '../../settings-components/app-settings/settings.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogListComponent } from '../../dialogs/dialog-list/dialog-list.component';
import { Optional } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

interface ListItem {

  id: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  category: { id: number; name: string } | null;
  createdAt: string;

  isEditing?: boolean;
  tempTitle?: string;
  tempDescription?: string;
  tempPriority?: 'High' | 'Medium' | 'Low';
  tempCategoryId?: number | null;

  showDetails?: boolean; // ✅ Add this
}

interface Category {
  id: number;
  name: string;
  isEditing?: boolean;
  tempName?: string;
}

@Component({
  selector: 'app-ui-list-embed',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    DragDropModule,
    ScrollingModule
  ],
  templateUrl: './ui-list-embed.component.html',
  styleUrls: ['./ui-list-embed.component.css']
})
export class UiListEmbedComponent implements OnInit {

  @Output() listAdded = new EventEmitter<void>();
  @Input() list: any;

  items: ListItem[] = [];
  loading = true;
  newTitle = '';
  newDescription = '';
  showNewItemForm = false;
  
  // New category editing mode flag and input field for new category:
  isCategoryEditMode = false;
  newCategoryName = '';
  categories: Category[] = [];

  groupBackgroundColor: string = '';
  groupFontColor: string = '';

  newPriority: 'High' | 'Medium' | 'Low' = 'Medium';
  
  styleSettings = {
    groupBackgroundColor: '',
    groupFontColor: '',
    linkBackgroundColor: '',
    linkFontColor: '',
  };

  showCategoryManager = false;
  selectedCategoryId: number | null = null;

  groupedItems: { [category: string]: ListItem[] } = {};
  objectKeys = Object.keys;

  constructor(
    private listsService: ListsService,
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef,
    @Optional() private dialogRef: MatDialogRef<DialogListComponent>
  ) {}

  ngOnInit(): void {
    this.loadItems();
    this.settingsService.loadSettings().subscribe({
      next: (settings) => {
        this.styleSettings.groupBackgroundColor = settings['GROUP_BACKGROUND_COLOR'] || '#2e3a46';
        this.styleSettings.groupFontColor = settings['GROUP_FONT_COLOR'] || '#ffffff';
        this.styleSettings.linkBackgroundColor = settings['LINK_BACKGROUND_COLOR'] || '#3b4d59';
        this.styleSettings.linkFontColor = settings['LINK_FONT_COLOR'] || '#ffffff';
      },
      error: (err) => {
        console.error('❌ Failed to load settings:', err);
      }
    });
  }

  hideDetails(item: any) {
    item.showDetails = false;
  }

  get anyCategoryEditing(): boolean {
    return this.categories.some(cat => cat.isEditing);
  }

closeDialog(): void {
  if (this.dialogRef) {
    this.dialogRef.close();
  }
}

  setShowNewItemForm(value: boolean) {
  this.showNewItemForm = value;

  // 👇 Auto-select the first category when opening the form
  if (value && this.categories.length > 0) {
    this.selectedCategoryId = this.categories[0].id;
  }
}



  loadCategories() {
    const listId = this.list?.id;
    if (!listId) return;
    this.listsService.getCategoriesForList(listId).subscribe({
      next: (categories) => {
        this.categories = categories.sort((a, b) => a.position - b.position);
        console.log('✅ Categories loaded:', categories);
      },
      error: (err) => {
        console.error('❌ Failed to load categories:', err);
      }
    });
  }

  toggleDetails(clickedItem: ListItem) {
  this.items.forEach(item => {
    item.showDetails = item === clickedItem ? !item.showDetails : false;
  });
}

  loadItems() {
    const listId = this.list?.id;
    if (!listId) return;
    this.loading = true;
    this.listsService.getCategoriesForList(listId).subscribe({
  next: (categories) => {
    this.categories = categories.sort((a, b) => a.position - b.position);
    console.log('✅ Categories loaded:', categories);

    // ✅ Now fetch items AFTER categories are known
    this.listsService.getListItems(listId).subscribe({
      next: (items) => {
        console.log('✅ List items loaded:', items);
        this.items = items;
        this.groupItemsByCategory(items); // ✅ now categories are available
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load items:', err);
        this.loading = false;
      }
    });
  },
  error: (err) => {
    console.error('❌ Failed to load categories:', err);
    this.loading = false;
  }
});

  }

  private groupItemsByCategory(items: ListItem[]) {
  this.groupedItems = {};

  // Initialize empty arrays for all categories first
  for (const category of this.categories) {
    this.groupedItems[category.id] = [];
  }

  // Now populate groupedItems based on actual items
  for (const item of items) {
    const category = item.category;
    const key = category?.id || 0; // or 'uncategorized' if that's your convention

    if (!this.groupedItems[key]) {
      this.groupedItems[key] = [];
    }

    this.groupedItems[key].push(item);
  }
}


    getCategoryNameById(id: string | number): string {
      const found = this.categories.find(c => c.id === +id);
      return found?.name || 'Uncategorized';
    }

  // --- Existing addItem method for adding a new list item ---
addItem(keepFormOpen = false) {
    const listId = this.list?.id;
    if (!listId || !this.newTitle.trim()) return;

    // ✅ Use the selectedCategoryId from the dropdown
    if (!this.selectedCategoryId) {
      alert('Please select a category for the new item.');
      return;
    }

    this.listsService.addItemToList({
      listId,
      categoryId: this.selectedCategoryId,
      title: this.newTitle.trim(),
      description: this.newDescription.trim(),
      priority: this.newPriority, // ✅ include this
    }).subscribe({
      next: () => {
        this.loadItems();
        this.listAdded.emit();
        this.newTitle = '';
        this.newDescription = '';
        this.newPriority = 'Medium'; // reset
        this.selectedCategoryId = this.categories.length > 0 ? this.categories[0].id : null;
        if (!keepFormOpen) this.showNewItemForm = false;
      },
      error: (err) => {
        console.error('❌ Failed to add item:', err);
        alert('Failed to add item');
      }
    });
  }

  get anyItemEditing(): boolean {
    return this.items.some(item => item.isEditing);
  }

  get anyItemDetailsVisible(): boolean {
    return this.items.some(item => item.showDetails);
  }

  toggleCategoryManager() {
    this.showCategoryManager = !this.showCategoryManager;
  }
  
  toggleCategoryEditMode() {
    this.isCategoryEditMode = !this.isCategoryEditMode;
  }

  addCategory(keepFormOpen = false) {
  const name = this.newCategoryName.trim();
  const listId = this.list?.id;
  if (!name || !listId) return;

  this.listsService.addCategoryForList(listId, name).subscribe({
    next: () => {
      this.newCategoryName = '';
      this.loadItems();
      if (!keepFormOpen) {
        this.isCategoryEditMode = false;
      }
    },
    error: (err) => {
      console.error('❌ Failed to add category:', err);
      alert(err?.error?.message || 'Failed to add category');
    }
  });
}

deleteCategory(category: any) {
  const listId = this.list?.id;
  if (!listId) return;

  const catId = category.id;
  const hasItems = (this.groupedItems[catId] ?? []).length > 0;

  if (hasItems) {
    alert('This category has at least one list item in it. Move or delete that list item before deleting this category.');
    return;
  }

  const confirmed = window.confirm(`Are you sure you want to delete category "${category.name}"?`);
  if (!confirmed) return;

  this.listsService.deleteCategoryForList(listId, catId).subscribe({
    next: () => {
      this.categories = this.categories.filter(cat => cat.id !== catId);
      delete this.groupedItems[catId];
      console.log(`✅ Deleted category with ID ${catId}`);
    },
    error: (err) => {
      console.error('❌ Failed to delete category:', err);
      alert(err?.error?.message || 'Failed to delete category');
    }
  });
}


  deleteItem(item: ListItem) {
  const confirmed = window.confirm(`Are you sure you want to delete "${item.title}"?`);
  if (!confirmed) return;

  this.listsService.deleteItem(item.id).subscribe({
    next: () => {
      this.loadItems(); // ✅ refresh the grouped items
    },
    error: (err) => {
      console.error('❌ Failed to delete item:', err);
      alert('Failed to delete item');
    }
  });
}

onItemDrop(event: CdkDragDrop<ListItem[]>, targetCategoryId: number) {
  const prevCategoryId = Number(event.previousContainer.id.replace('cdk-drop-', ''));
  const currCategoryId = targetCategoryId;

  const prevList = this.groupedItems[prevCategoryId];
  const currList = this.groupedItems[currCategoryId];

  const movedItem = event.item.data;

if (event.previousContainer === event.container) {
  moveItemInArray(this.groupedItems[currCategoryId], event.previousIndex, event.currentIndex);
} else {
  transferArrayItem(
    this.groupedItems[prevCategoryId],
    this.groupedItems[currCategoryId],
    event.previousIndex,
    event.currentIndex
  );
}

  const payload = Object.entries(this.groupedItems).flatMap(([catId, items]) =>
    items.map((item, idx) => ({
      id: Number(item.id),
      position: idx,
      categoryId: Number(catId),
    }))
  );

  this.listsService.reorderItems(payload).subscribe({
    next: () => console.log('✅ Reordered'),
    error: (err) => console.error('❌ Reorder failed', err),
  });

  this.cdr.detectChanges();
  console.log('Drag and drop payload: ', payload);
}


get connectedDropListIds(): string[] {
  return this.categories.map(cat => `cdk-drop-${cat.id}`);
}

getTimeSince(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

onCategoryDrop(event: CdkDragDrop<Category[]>) {
  moveItemInArray(this.categories, event.previousIndex, event.currentIndex);

  const payload = this.categories.map((cat, index) => ({
    id: cat.id,
    position: index
  }));

  this.listsService.reorderCategoriesForList(this.list.id, payload).subscribe({
    next: () => console.log('✅ Categories reordered'),
    error: (err) => console.error('❌ Failed to reorder categories', err),
  });
}

editCategory(cat: Category) {
  cat.isEditing = true;
  cat.tempName = cat.name;
}

cancelCategoryEdit(cat: Category) {
  cat.isEditing = false;
  cat.tempName = '';
}

saveCategoryEdit(cat: Category) {
  const trimmedName = (cat.tempName || '').trim();
  if (!trimmedName) {
    alert('Category name cannot be empty.');
    return;
  }

  this.listsService.updateCategoryName(this.list.id, cat.id, trimmedName).subscribe({
    next: () => {
      cat.name = trimmedName;
      cat.isEditing = false;
      cat.tempName = '';
    },
    error: (err) => {
      console.error('❌ Failed to update category name:', err);
      alert(err?.error?.message || 'Failed to update category');
    }
  });
}

editItem(item: ListItem) {
  item.isEditing = true;
  item.tempTitle = item.title;
  item.tempDescription = item.description;
  item.tempPriority = item.priority;
  item.tempCategoryId = item.category?.id ?? null;
}

cancelItemEdit(item: ListItem) {
  item.isEditing = false;
  item.tempTitle = '';
  item.tempDescription = '';
  item.tempPriority = 'Medium';
  item.tempCategoryId = null;
}

saveItemEdit(item: ListItem) {
  const listId = this.list?.id;
  if (!listId) return;

  this.listsService.updateItem(item.id, {
    title: item.tempTitle?.trim() || '',
    description: item.tempDescription || '',
    priority: item.tempPriority || 'Medium',
    categoryId: item.tempCategoryId ?? null
  }).subscribe({
    next: () => {
      this.loadItems(); // refresh
    },
    error: err => {
      console.error('❌ Failed to update item:', err);
      alert('Failed to update item');
    }
  });
}



}
