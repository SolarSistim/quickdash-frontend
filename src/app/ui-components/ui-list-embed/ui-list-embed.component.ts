import { Component, Input, OnInit, ChangeDetectorRef, Output, EventEmitter, viewChild, ViewChild } from '@angular/core';
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
import { ManageCategoriesComponent } from './manage-categories/manage-categories.component';
import { AddListItemComponent } from './add-list-item/add-list-item.component';
import { ListItemComponent } from './list-item/list-item.component';
import { MatMenuModule } from '@angular/material/menu';

interface ListItem {

  id: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  category: { id: number; name: string } | null;
  createdAt: string;
  pinned: boolean;

  isEditing?: boolean;
  tempTitle?: string;
  tempDescription?: string;
  tempPriority?: 'High' | 'Medium' | 'Low';
  tempCategoryId?: number | null;

  showDetails?: boolean;
  originalCategoryId?: number | null;
  categoryId?: number | null; // ✅ <-- Add this line
}


interface Category {
  id: number;
  name: string;
  isEditing?: boolean;
  tempName?: string;
}

interface TestItem {
  id: number;
  name: string;
  position: number;
  categoryName: string;
  pinned: boolean;

  // ✅ Add these:
  priority?: 'High' | 'Medium' | 'Low';
  description?: string;

  isEditing?: boolean;
  tempName?: string;
  tempPriority?: 'High' | 'Medium' | 'Low';
  tempCategoryName?: string;
  tempDescription?: string;
}
// END drag and drop testing

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
    ScrollingModule,
    ManageCategoriesComponent,
    AddListItemComponent,
    ListItemComponent,
    MatMenuModule
  ],
  templateUrl: './ui-list-embed.component.html',
  styleUrls: ['./ui-list-embed.component.css']
})
export class UiListEmbedComponent implements OnInit {

// Drag and drop testing
// Drag and drop testing
// Drag and drop testing

groupedTestItems: { [categoryName: string]: TestItem[] } = {};

testItems: TestItem[] = [];


dropTestItem(event: CdkDragDrop<TestItem[]>) {
  const prevContainer = event.previousContainer;
  const currContainer = event.container;
  const prevIndex = event.previousIndex;
  const currIndex = event.currentIndex;

  if (prevContainer === currContainer) {
    moveItemInArray(currContainer.data, prevIndex, currIndex);
  } else {
    transferArrayItem(prevContainer.data, currContainer.data, prevIndex, currIndex);
  }

  // 🔁 Rebuild flat testItems array from groupedTestItems
  const newFlat: TestItem[] = [];

for (const category of this.objectKeys(this.groupedTestItems)) {
  const items = this.groupedTestItems[category];
  items.forEach((item, index) => {
    item.position = newFlat.length;
    // ✅ Do NOT overwrite categoryName if item is pinned
    if (category === 'Pinned') {
      item.pinned = true;
    } else {
      item.pinned = false;
      item.categoryName = category;
    }
    newFlat.push(item);
  });
}

  this.testItems = newFlat;

  this.persistTestItemOrder();

  console.log('✅ Updated testItems:', this.testItems);
}

persistTestItemOrder() {
  const payload = this.testItems.map(item => {
    const matchingItem = this.items.find(i => i.id === item.id);
    const matchingCategory = this.categories.find(c => c.name === item.categoryName);

    const originalCategoryId = matchingItem?.category?.id ?? matchingItem?.categoryId ?? null;

    return {
      id: item.id,
      position: item.position,
      pinned: item.pinned, // ✅ use actual pinned status
      categoryId: item.pinned ? originalCategoryId : matchingCategory?.id ?? originalCategoryId
    };
  });

  this.listsService.reorderItems(payload).subscribe({
    next: () => console.log('✅ Persisted reordered testItems to backend'),
    error: (err) => console.error('❌ Failed to persist testItem reorder:', err),
  });
}

onPinIconClick(item: TestItem, event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  // Toggle pin status
  item.pinned = !item.pinned;

  // 🔁 Rebuild testItems array
  const newFlat: TestItem[] = [];

  for (const category of this.objectKeys(this.groupedTestItems)) {
    const items = this.groupedTestItems[category];
    this.groupedTestItems[category] = items.filter(i => i.id !== item.id); // Remove from all groups
  }

  const targetGroup = item.pinned ? 'Pinned' : item.categoryName;
  if (!this.groupedTestItems[targetGroup]) {
    this.groupedTestItems[targetGroup] = [];
  }
  this.groupedTestItems[targetGroup].push(item);

  for (const category of this.objectKeys(this.groupedTestItems)) {
    const items = this.groupedTestItems[category];
    items.forEach((itm, index) => {
      itm.position = newFlat.length;
      if (category !== 'Pinned') {
        itm.categoryName = category;
        itm.pinned = false;
      } else {
        itm.pinned = true;
      }
      newFlat.push(itm);
    });
  }

  this.testItems = newFlat;
  this.persistTestItemOrder();
  this.cdr.detectChanges();
}


onEditItem(item: TestItem, event: MouseEvent) {
  event.stopPropagation();
  event.preventDefault();

  item.isEditing = true;
  item.tempName = item.name;
  item.tempPriority = item.priority || 'Medium';
  item.tempCategoryName = item.categoryName;
  item.tempDescription = item.tempDescription || ''; // Replace if you support real desc
}

onCancelEdit(item: TestItem) {
  item.isEditing = false;
}

onSaveEdit(item: TestItem) {
  item.name = item.tempName || item.name;
  item.priority = item.tempPriority || 'Medium';
  item.categoryName = item.tempCategoryName || item.categoryName;
  item.tempDescription = item.tempDescription || '';

  // Update backend
  const matchingCategory = this.categories.find(cat => cat.name === item.categoryName);
  const matchingItem = this.items.find(i => i.id === item.id);

  const payload = {
    title: item.name,
    description: item.tempDescription,
    priority: item.priority,
    categoryId: matchingCategory?.id || matchingItem?.categoryId || null,
    pinned: item.pinned,
  };

  this.listsService.updateItem(item.id, payload).subscribe({
    next: () => {
      item.isEditing = false;
      this.loadItems(); // Refresh UI
    },
    error: (err) => {
      console.error('❌ Failed to update item:', err);
      alert('Failed to save changes');
    },
  });
}


onDeleteItem(item: TestItem, event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  console.log('❌ Delete clicked for', item);
  // Add your confirmation and delete logic here
}

  // End drag and drop testing
    // End drag and drop testing
      // End drag and drop testing



  @ViewChild(ManageCategoriesComponent) manageCategoriesComponent!: ManageCategoriesComponent;
  @ViewChild('addListItemComponent') addListItemComponent!: AddListItemComponent;
  @Output() listAdded = new EventEmitter<void>();
  @Input() list: any;

  isMobile = false;
  items: ListItem[] = [];
  loading = true;
  newTitle = '';
  newDescription = '';
  showNewItemForm = false;
  
  originalCategoryMap: { [itemId: number]: number } = {};
  isCategoryEditMode = false;
  newCategoryName = '';
  categories: Category[] = [];
  anyCategoryEditing = false;

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

  groupedItems: { [key: string | number]: ListItem[] } = {};
  objectKeys = Object.keys;

  constructor(
    private listsService: ListsService,
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef,
    @Optional() private dialogRef: MatDialogRef<DialogListComponent>
  ) {}

  ngOnInit(): void {
    // Drag and drop testing
this.testItems = this.items.map((item, index) => ({
  id: item.id,
  name: item.title || `Item ${index + 1}`,
  position: index,
  pinned: item.pinned, // ✅ include pinned flag
  categoryName: item.pinned
    ? 'Pinned'
    : item.category?.name || 'Uncategorized'
}));
    // End drag and drop testing
    this.isMobile = window.innerWidth < 576; // Bootstrap "xs" breakpoint
    window.addEventListener('resize', this.onResize.bind(this));
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

  trackById(index: number, item: ListItem): number {
  return item.id;
}

  onItemCreated(event: { keepFormOpen: boolean }) {
    this.loadItems();

    if (!event.keepFormOpen) {
      this.showNewItemForm = false;
    }
  }

  onResize(): void {
    this.isMobile = window.innerWidth < 576;
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  hideDetails(item: any) {
    item.showDetails = false;
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

onCategoryAdded() {
  this.loadCategories(); // ✅ refresh immediately after category creation
}

loadCategories() {
  const listId = this.list?.id;
  if (!listId) return;

  this.listsService.getCategoriesForList(listId).subscribe({
    next: (categories) => {
      this.categories = categories.sort((a, b) => a.position - b.position);
    },
    error: (err) => {
      console.error('❌ Failed to load categories:', err);
    }
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

      // Now fetch items AFTER categories are known
      this.listsService.getListItems(listId).subscribe({
        next: (items) => {
          console.log('✅ List items loaded:', items);

          // ✅ Add originalCategoryId to each item
          this.items = items.map(item => ({
            ...item,
            originalCategoryId: item.originalCategoryId ?? item.category?.id ?? null
          }));

          // Drag and drop testing
          this.testItems = this.items.map((item, index) => ({
            id: item.id,
            name: item.title || `Item ${index + 1}`,
            position: index,
            categoryName: item.category?.name || 'Uncategorized',
            pinned: item.pinned // ✅ pull this from the real item
          }));

          this.groupedTestItems = {
            Pinned: [],
            ...this.categories.reduce((acc, cat) => {
              acc[cat.name] = [];
              return acc;
            }, {} as { [categoryName: string]: TestItem[] })
          };

          // Distribute items
          for (const item of this.testItems) {
            const key = item.pinned ? 'Pinned' : item.categoryName;
            if (!this.groupedTestItems[key]) {
              this.groupedTestItems[key] = [];
            }
            this.groupedTestItems[key].push(item);
          }
          // END Drag and drop testing


          this.groupItemsByCategory(this.items);
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
  this.groupedItems = { pinned: [] };

  for (const category of this.categories) {
    this.groupedItems[category.id] = [];
  }

  for (const item of items) {
    if (item.pinned) {
      this.groupedItems['pinned'].push(item);
    } else {
      const key = item.category?.id ?? 'uncategorized';
      if (!this.groupedItems[key]) this.groupedItems[key] = [];
      this.groupedItems[key].push(item);
    }
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

onCategoryAddCompleted() {
  this.isCategoryEditMode = false;
  this.loadCategories(); // 🔁 Refresh categories
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




private reorderItemsForGroup(items: ListItem[]) {
  const payload = items.map((item, index) => ({
    id: item.id,
    position: index,
    pinned: item.pinned,
    categoryId: item.category?.id ?? null, // ✅ Preserve category ID
  }));

  this.listsService.reorderItems(payload).subscribe({
    next: () => console.log('✅ Reordered'),
    error: (err) => console.error('❌ Reorder failed', err),
  });
}






onItemDrop(event: CdkDragDrop<any[]>, targetCategoryId: string | number) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }
  const prevCategoryIdRaw = event.previousContainer.id.replace('cdk-drop-', '');
  const prevCategoryId = isNaN(+prevCategoryIdRaw) ? prevCategoryIdRaw : +prevCategoryIdRaw;
  const currCategoryId = targetCategoryId;

  const prevList = this.groupedItems[prevCategoryId] || [];
  const currList = this.groupedItems[currCategoryId] || [];

  let movedItem: ListItem | undefined;

  if (event.previousContainer === event.container) {
    moveItemInArray(currList, event.previousIndex, event.currentIndex);
    movedItem = currList[event.currentIndex];
  } else {
    transferArrayItem(prevList, currList, event.previousIndex, event.currentIndex);
    movedItem = currList[event.currentIndex];
  }

  if (!movedItem) {
    console.error('❌ movedItem is undefined during drop event');
    return;
  }

  // ✅ Handle pin toggle
  const isNowPinned = currCategoryId === 'pinned';
  movedItem.pinned = isNowPinned;

  if (isNowPinned) {
    // Save original category ID
    if (movedItem.originalCategoryId == null) {
      movedItem.originalCategoryId = movedItem.category?.id ?? movedItem.categoryId ?? null;
    }

    // Remove visual category, but preserve ID
    movedItem.category = null;
    // DO NOT clear categoryId
  } else if (prevCategoryId === 'pinned' && movedItem.originalCategoryId != null) {
    // Restore category from original
    const targetCat = this.categories.find(cat => cat.id === movedItem.originalCategoryId);
    if (targetCat) {
      movedItem.category = { id: targetCat.id, name: targetCat.name };
      movedItem.categoryId = targetCat.id;
      movedItem.originalCategoryId = null;
    }
  }

  // Ensure item.categoryId is set correctly before persisting
  if (!movedItem.pinned) {
    // Update the item's categoryId and category object
    if (typeof currCategoryId === 'number') {
      const targetCategory = this.categories.find(c => c.id === currCategoryId);
      if (targetCategory) {
        movedItem.categoryId = targetCategory.id;
        movedItem.category = { id: targetCategory.id, name: targetCategory.name };
      }
    }
  }

  const allItems = Object.values(this.groupedItems).flat();

  const payload = allItems.map((item, idx) => ({
    id: item.id,
    position: idx,
    pinned: item.pinned,
    categoryId: item.categoryId ?? item.originalCategoryId ?? null, // ✅ <--- KEY FIX
  }));

  this.listsService.reorderItems(payload).subscribe({
    next: () => console.log('✅ Reordered after drop'),
    error: (err) => console.error('❌ Drop reorder failed', err),
  });

  this.cdr.detectChanges();
}



/* togglePin(item: ListItem, event: MouseEvent) {
  event.stopPropagation();
  const newPinnedState = !item.pinned;

  // ✅ Step 1: Remove from all lists
  for (const key of Object.keys(this.groupedItems)) {
    const list = this.groupedItems[key];
    const index = list.findIndex(i => i.id === item.id);
    if (index > -1) list.splice(index, 1);
  }

  // ✅ Step 2: Toggle pin state
  item.pinned = newPinnedState;

  if (newPinnedState) {
    // ✅ Save original categoryId if not already saved
    if (item.originalCategoryId == null) {
      item.originalCategoryId = item.category?.id ?? item.categoryId ?? null;
    }

    // ✅ Clear only the UI category — keep the ID for backend
    item.category = null;

    // ✅ DO NOT clear item.categoryId
    this.groupedItems['pinned'].push(item);
  } else {
    // ✅ Unpin — restore to original category
    const targetCatId = item.originalCategoryId;
    const targetCat = this.categories.find(cat => cat.id === targetCatId);

    if (!targetCat) {
      console.warn('⚠️ Unpin fallback: category not found for', targetCatId);
      item.pinned = false;
      this.loadItems();
      return;
    }

    item.category = { id: targetCat.id, name: targetCat.name };
    item.categoryId = targetCat.id;
    item.originalCategoryId = null;

    if (!this.groupedItems[targetCat.id]) {
      this.groupedItems[targetCat.id] = [];
    }

    this.groupedItems[targetCat.id].push(item);
    this.cdr.detectChanges();
  }

  // ✅ Step 3: Persist to backend — keep categoryId even when pinned
  const payload = {
    title: item.title,
    description: item.description,
    priority: item.priority,
    categoryId: item.categoryId ?? item.originalCategoryId ?? null, // ✅ Key line
    pinned: item.pinned,
  };

  this.listsService.updateItem(item.id, payload).subscribe({
    next: () => this.cdr.detectChanges(),
    error: (err) => console.error('❌ Failed to persist pin toggle', err),
  });
} */









get connectedDropListIds(): string[] {
  return ['cdk-drop-pinned', ...this.categories.map(cat => `cdk-drop-${cat.id}`)];
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

saveItemEdit(item: ListItem) {
  const listId = this.list?.id;
  if (!listId) return;

  // ✅ Determine correct category ID
  const preservedCategoryId =
    item.originalCategoryId ??
    item.tempCategoryId ??
    item.category?.id ??
    null;

  const payload = {
    title: item.tempTitle?.trim() || '',
    description: item.tempDescription?.trim() || '',
    priority: item.tempPriority || 'Medium',
    categoryId: preservedCategoryId,
    pinned: item.pinned,
  };

  this.listsService.updateItem(item.id, payload).subscribe({
    next: () => {
      item.isEditing = false;
      item.showDetails = false;

      // ✅ Persist originalCategoryId for unpinning
      if (item.pinned) {
        item.originalCategoryId = preservedCategoryId;
      }

      this.loadItems(); // reload everything
    },
    error: (err) => {
      console.error('❌ Failed to update item:', err);
      alert('Failed to update item');
    },
  });
}





}
