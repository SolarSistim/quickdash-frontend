import { Component, Input, OnInit, ChangeDetectorRef, Output, EventEmitter, viewChild, ViewChild,} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem,} from '@angular/cdk/drag-drop';
import { ListsService } from '../../features/lists/lists.service';
import { SettingsService } from '../../settings-components/app-settings/settings.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogListComponent } from '../../dialogs/dialog-list/dialog-list.component';
import { Optional } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ManageCategoriesComponent } from './manage-categories/manage-categories.component';
import { AddListItemComponent } from './add-list-item/add-list-item.component';
import { MatMenuModule } from '@angular/material/menu';
import { AutoLinkPipe } from '../../pipes/pipes/auto-link.pipe';
import { FilterListComponent } from './filter-list/filter-list.component';
import { CompletedListItemsComponent } from './completed-list-items/completed-list-items.component';
import { ExportListComponent } from './export-list/export-list.component';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
  createdAt?: string;
  priority?: 'High' | 'Medium' | 'Low';
  description?: string;
  isEditing?: boolean;
  tempName?: string;
  tempPriority?: 'High' | 'Medium' | 'Low';
  tempCategoryName?: string;
  tempDescription?: string;
  showDetails?: boolean;
  highlight?: boolean;
  highlightClass?: 'highlightA' | 'highlightB';
  showPriorityPanel?: boolean;
  categoryId?: number | null;
  confirmingComplete?: boolean;
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
    MatMenuModule,
    AutoLinkPipe,
    FilterListComponent,
    CompletedListItemsComponent,
    ExportListComponent
  ],
  templateUrl: './ui-list-embed.component.html',
  styleUrls: ['./ui-list-embed.component.css'],
})
export class UiListEmbedComponent implements OnInit {

  @Input() listId!: number;
  isExportValid = false;
  filterText = '';
  filterByName = true;
  filterByDescription = true;
  filterByCategory = true;
  showPriorityPanel?: boolean;
  showCompletedItems = false;
  completedItemCount = 0;
  wasFilteringBeforeEdit: boolean = false;
  @ViewChild(FilterListComponent)
  filterListComponent!: FilterListComponent;
  public showFilterOptions = false;
  showExportPanel = false;  
  @ViewChild(ManageCategoriesComponent)
  manageCategoriesComponent!: ManageCategoriesComponent;
  @ViewChild('addListItemComponent')
  addListItemComponent!: AddListItemComponent;
  @Output() listAdded = new EventEmitter<void>();
  @Input() list: any;
  @ViewChild(CompletedListItemsComponent)
  completedListComponent!: CompletedListItemsComponent;
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
  @ViewChild(ExportListComponent)
  exportListComponent!: ExportListComponent;
  isFullscreen = false;
  @Output() toggleFullscreenRequest = new EventEmitter<boolean>();

  constructor(
    private listsService: ListsService,
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef,
    @Optional() public dialogRef: MatDialogRef<DialogListComponent>,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadList();
    this.isFullscreen = this.router.url.includes('/list-full');
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      this.isFullscreen = event.urlAfterRedirects.includes('/list-full');
      this.cdr.detectChanges(); // Trigger UI update
    });
    // Drag and drop testing
    this.testItems = this.items.map((item, index) => ({
      id: item.id,
      name: item.title || `Item ${index + 1}`,
      position: index,
      categoryName: item.category?.name || 'Uncategorized',
      pinned: item.pinned,
      createdAt: item.createdAt, // ✅ include createdAt
      priority: item.priority || 'Medium', // optional: store raw priority
      tempPriority: item.priority || 'Medium',
      tempDescription: item.description ?? '',
    }));
    // End drag and drop testing
    this.isMobile = window.innerWidth < 576; // Bootstrap "xs" breakpoint
    window.addEventListener('resize', this.onResize.bind(this));
    this.loadItems();
    this.settingsService.loadSettings().subscribe({
      next: (settings) => {
        this.styleSettings.groupBackgroundColor =
          settings['GROUP_BACKGROUND_COLOR'] || '#2e3a46';
        this.styleSettings.groupFontColor =
          settings['GROUP_FONT_COLOR'] || '#ffffff';
        this.styleSettings.linkBackgroundColor =
          settings['LINK_BACKGROUND_COLOR'] || '#3b4d59';
        this.styleSettings.linkFontColor =
          settings['LINK_FONT_COLOR'] || '#ffffff';
      },
      error: (err) => {
        console.error('❌ Failed to load settings:', err);
      },
    });
  }

  get isFilterActiveAndEmpty(): boolean {
  if (!this.filterText.trim()) return false;

  return Object.keys(this.filteredGroupedTestItems).every(
    key => !this.filteredGroupedTestItems[key]?.length
  );
}

loadList() {
  const id = this.listId;
  if (!id) return;

  this.listsService.getListById(id).subscribe({
    next: (list) => {
      this.list = list;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('❌ Failed to load list details:', err);
    }
  });
}

goToFullscreen(): void {
  const id = this.list?.id || this.listId;
  if (!id) {
    console.warn('⚠️ No list ID found to open fullscreen view.');
    return;
  }

  if (this.dialogRef) {
    this.dialogRef.close();
    setTimeout(() => {
      this.router.navigate(['/list-full', id]);
    }, 100);
  } else {
    this.router.navigate(['/list-full', id]);
  }
}

goBackHome(): void {
  this.router.navigate(['/']);
}

// Priority panel
togglePriorityPanel(item: TestItem, event: MouseEvent): void {
  event.stopPropagation();
  // Close all other panels
  for (const cat of Object.keys(this.groupedTestItems)) {
    for (const otherItem of this.groupedTestItems[cat]) {
      if (otherItem !== item) otherItem.showPriorityPanel = false;
    }
  }
  // Toggle this one
  item.showPriorityPanel = !item.showPriorityPanel;
}

  setPriority(item: TestItem, level: 'High' | 'Medium' | 'Low'): void {
  item.tempPriority = level;
  item.priority = level;
  item.showPriorityPanel = false;

  // Optional: persist immediately
  this.listsService.updateItem(item.id, {
    priority: level,
    title: item.name,
    description: item.tempDescription ?? '',
    categoryId: this.categories.find(cat => cat.name === item.categoryName)?.id ?? null,
    pinned: item.pinned
  }).subscribe({
    next: () => console.log(`✅ Updated priority to ${level}`),
    error: (err) => console.error('❌ Failed to update priority:', err)
  });
}

// END priority panel

get filteredGroupedTestItems(): { [categoryName: string]: TestItem[] } {
  if (!this.filterText.trim()) return this.groupedTestItems;

  const lower = this.filterText.toLowerCase();
  const filtered: { [categoryName: string]: TestItem[] } = {};

  for (const category of Object.keys(this.groupedTestItems)) {
    const categoryMatches =
      this.filterByCategory &&
      category.toLowerCase().includes(lower);

    const matches = this.groupedTestItems[category].filter(item =>
      (this.filterByName && item.name.toLowerCase().includes(lower)) ||
      (this.filterByDescription && item.tempDescription?.toLowerCase().includes(lower)) ||
      categoryMatches
    );

    if (matches.length > 0) {
      filtered[category] = matches;
    }
  }

  return filtered;
}



// END filter list items

  // Drag and drop testing
  // Drag and drop testing
  // Drag and drop testing

  groupedTestItems: { [categoryName: string]: TestItem[] } = {};

  testItems: TestItem[] = [];

  getSafeDescription(desc?: string): string {
    return desc ?? '';
  }

toggleDetails(item: TestItem) {
  if (item.isEditing) return;
  for (const category of Object.keys(this.groupedTestItems)) {
    for (const t of this.groupedTestItems[category]) {
      if (t !== item) t.showDetails = false;
    }
  }
  item.showDetails = !item.showDetails;
}

  dropTestItem(event: CdkDragDrop<TestItem[]>) {
    const prevContainer = event.previousContainer;
    const currContainer = event.container;
    const prevIndex = event.previousIndex;
    const currIndex = event.currentIndex;

    let movedItem: TestItem | undefined;

    if (prevContainer === currContainer) {
      moveItemInArray(currContainer.data, prevIndex, currIndex);
      movedItem = currContainer.data[currIndex];
    } else {
      transferArrayItem(
        prevContainer.data,
        currContainer.data,
        prevIndex,
        currIndex
      );
      movedItem = currContainer.data[currIndex];
    }

    // ✅ Apply highlight animation
    if (movedItem) {
      // ✅ Force animation restart by toggling highlightClass
      movedItem.highlightClass = movedItem.highlightClass === 'highlightA' ? 'highlightB' : 'highlightA';
      this.cdr.detectChanges();

      setTimeout(() => {
        movedItem.highlightClass = undefined;
        this.cdr.detectChanges();
      }, 1000);
    }

    // 🔁 Rebuild flat testItems array from groupedTestItems
    const newFlat: TestItem[] = [];

    for (const category of this.objectKeys(this.groupedTestItems)) {
      const items = this.groupedTestItems[category];
      items.forEach((item, index) => {
        item.position = newFlat.length;
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
    const payload = this.testItems.map((item) => {
      const matchingItem = this.items.find((i) => i.id === item.id);
      const matchingCategory = this.categories.find(
        (c) => c.name === item.categoryName
      );

      const originalCategoryId =
        matchingItem?.category?.id ?? matchingItem?.categoryId ?? null;

      return {
        id: item.id,
        position: item.position,
        pinned: item.pinned, // ✅ use actual pinned status
        categoryId: item.pinned
          ? originalCategoryId
          : matchingCategory?.id ?? originalCategoryId,
      };
    });

    this.listsService.reorderItems(payload).subscribe({
      next: () => console.log('✅ Persisted reordered testItems to backend'),
      error: (err) =>
        console.error('❌ Failed to persist testItem reorder:', err),
    });
  }

  onCategoryDeleted() {
    this.manageCategoriesComponent?.loadCategories();
    this.loadItems();
  }

  onPinIconClick(item: TestItem, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Toggle pin status
    item.pinned = !item.pinned;

    // Remove from all groups
    for (const category of this.objectKeys(this.groupedTestItems)) {
      this.groupedTestItems[category] = this.groupedTestItems[category].filter(
        (i) => i.id !== item.id
      );
    }

    // Move to target group
    const targetGroup = item.pinned ? 'Pinned' : item.categoryName;
    if (!this.groupedTestItems[targetGroup]) {
      this.groupedTestItems[targetGroup] = [];
    }
    this.groupedTestItems[targetGroup].push(item);

    // ✅ Use alternating highlight class to force animation restart
    item.highlightClass =
      item.highlightClass === 'highlightA' ? 'highlightB' : 'highlightA';
    this.cdr.detectChanges(); // Ensure Angular applies the new class

    // Remove class after animation completes
    setTimeout(() => {
      item.highlightClass = undefined;
      this.cdr.detectChanges();
    }, 1000); // Match animation duration

    // Slight delay before rebuilding flat list
    requestAnimationFrame(() => {
      const newFlat: TestItem[] = [];

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
    });
  }

  onEditItem(item: TestItem, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    // Save whether we were filtering when entering edit mode
    this.wasFilteringBeforeEdit = !!this.filterText.trim();

    item.isEditing = true;
    item.tempName = item.name;
    item.tempPriority = item.priority || 'Medium';
    item.tempCategoryName = item.categoryName;
    item.tempDescription = item.tempDescription || '';
  }

onCancelEdit(item: TestItem) {
  item.isEditing = false;
  item.showDetails = false;
  console.log('cancel clicked')
}

  onSaveEdit(item: TestItem) {
  item.name = item.tempName || item.name;
  item.priority = item.tempPriority || 'Medium';
  item.categoryName = item.tempCategoryName || item.categoryName;
  item.tempDescription = item.tempDescription || '';

  const matchingCategory = this.categories.find(
    (cat) => cat.name === item.categoryName
  );
  const matchingItem = this.items.find((i) => i.id === item.id);

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
      this.loadItems();

      // ✅ Restore filter panel if we were filtering before edit
      if (this.wasFilteringBeforeEdit) {
        setTimeout(() => {
          if (this.filterListComponent) {
            this.filterListComponent.showFilterPanel();
          }
          this.wasFilteringBeforeEdit = false; // reset flag
        });
      }
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

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"?`
    );
    if (!confirmed) return;

    this.listsService.deleteItem(item.id).subscribe({
      next: () => {
        console.log('🗑️ Deleted item', item.id);

        // ✅ Refresh list after deletion
        this.loadItems();
      },
      error: (err) => {
        console.error('❌ Failed to delete item:', err);
        alert('Failed to delete item.');
      },
    });
  }

  getPriorityColor(priority: string): string {
    switch ((priority || '').toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'gold';
      case 'low':
        return 'limegreen';
      default:
        return 'gray';
    }
  }

  // End drag and drop testing
  // End drag and drop testing
  // End drag and drop testing

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
  // ✅ Call child method to reload categories
  this.manageCategoriesComponent?.loadCategories();

  // ✅ Also re-map groupedTestItems after short delay
  setTimeout(() => {
    this.groupedTestItems = {
      Pinned: [],
      ...this.categories.reduce((acc, cat) => {
        acc[cat.name] = [];
        return acc;
      }, {} as { [categoryName: string]: TestItem[] }),
    };

    for (const item of this.testItems) {
      const key = item.pinned ? 'Pinned' : item.categoryName;
      if (!this.groupedTestItems[key]) {
        this.groupedTestItems[key] = [];
      }
      this.groupedTestItems[key].push(item);
    }

    this.cdr.detectChanges();
  }, 100);
}

onCategoriesChanged(updatedCategories: Category[]) {
  console.log('📬 Parent received updated categories:', updatedCategories);

  // 1. Build a quick lookup map of old category names by ID
  const oldCategoryMap = new Map(this.categories.map(cat => [cat.id, cat.name]));

  // 2. Update internal categories reference
  this.categories = updatedCategories;

  // 3. Update categoryName in each testItem if its category name changed
  this.testItems.forEach(item => {
    const matchingCategory = this.categories.find(cat => cat.id === item.categoryId);
    const oldName = item.categoryName;
    const newName = matchingCategory?.name;

    if (matchingCategory && newName && newName !== oldName) {
      item.categoryName = newName;
    }
  });

  // 4. Rebuild groupedTestItems using updated category names
  this.groupedTestItems = {
    Pinned: [],
    ...this.categories.reduce((acc, cat) => {
      acc[cat.name] = [];
      return acc;
    }, {} as { [categoryName: string]: TestItem[] }),
  };

  for (const item of this.testItems) {
    const key = item.pinned ? 'Pinned' : item.categoryName;
    if (!this.groupedTestItems[key]) {
      this.groupedTestItems[key] = [];
    }
    this.groupedTestItems[key].push(item);
  }

  this.cdr.detectChanges();
}




  loadItems() {
  const listId = this.listId || this.list?.id;
  if (!listId) {
    console.warn('⚠️ No list ID provided. Cannot load items.');
    return;
  }

  this.loading = true;

  this.listsService.getCategoriesForList(listId).subscribe({
    next: (categories) => {
      this.categories = categories.sort((a, b) => a.position - b.position);
      console.log('✅ Categories loaded:', categories);

      // Fetch items AFTER categories are known
      this.listsService.getListItems(listId).subscribe({
        next: (items) => {
          console.log('✅ List items loaded:', items);

          this.items = items.map((item) => ({
            ...item,
            originalCategoryId:
              item.originalCategoryId ?? item.category?.id ?? null,
          }));

          // Drag and drop transformation
          this.testItems = this.items.map((item, index) => ({
            id: item.id,
            name: item.title || `Item ${index + 1}`,
            position: index,
            categoryName: item.category?.name || 'Uncategorized',
            pinned: item.pinned,
            createdAt: item.createdAt,
            priority: item.priority || 'Medium',
            tempPriority: item.priority || 'Medium',
            tempDescription: item.description ?? '',
          }));

          this.groupedTestItems = {
            Pinned: [],
            ...this.categories.reduce((acc, cat) => {
              acc[cat.name] = [];
              return acc;
            }, {} as { [categoryName: string]: TestItem[] }),
          };

          for (const item of this.testItems) {
            const key = item.pinned ? 'Pinned' : item.categoryName;
            if (!this.groupedTestItems[key]) {
              this.groupedTestItems[key] = [];
            }
            this.groupedTestItems[key].push(item);
          }

          this.groupItemsByCategory(this.items);
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Failed to load items:', err);
          this.loading = false;
        },
      });
    },
    error: (err) => {
      console.error('❌ Failed to load categories:', err);
      this.loading = false;
    },
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
    const found = this.categories.find((c) => c.id === +id);
    return found?.name || 'Uncategorized';
  }

  get anyItemEditing(): boolean {
    return this.items.some((item) => item.isEditing);
  }

  get anyItemDetailsVisible(): boolean {
    return this.items.some((item) => item.showDetails);
  }

  toggleCategoryManager() {
    this.showCategoryManager = !this.showCategoryManager;
  }

toggleCategoryEditMode() {
  console.log('toggleCategoryEditMode triggered');
  this.isCategoryEditMode = !this.isCategoryEditMode;

  if (!this.isCategoryEditMode) {
    this.newCategoryName = '';
    this.loadItems();
    console.log('Categories refreshed');
  }
}

  onCategoryAddCompleted() {
    this.isCategoryEditMode = false;
    this.manageCategoriesComponent?.loadCategories();
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
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    const prevCategoryIdRaw = event.previousContainer.id.replace(
      'cdk-drop-',
      ''
    );
    const prevCategoryId = isNaN(+prevCategoryIdRaw)
      ? prevCategoryIdRaw
      : +prevCategoryIdRaw;
    const currCategoryId = targetCategoryId;

    const prevList = this.groupedItems[prevCategoryId] || [];
    const currList = this.groupedItems[currCategoryId] || [];

    let movedItem: ListItem | undefined;

    if (event.previousContainer === event.container) {
      moveItemInArray(currList, event.previousIndex, event.currentIndex);
      movedItem = currList[event.currentIndex];
    } else {
      transferArrayItem(
        prevList,
        currList,
        event.previousIndex,
        event.currentIndex
      );
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
        movedItem.originalCategoryId =
          movedItem.category?.id ?? movedItem.categoryId ?? null;
      }

      // Remove visual category, but preserve ID
      movedItem.category = null;
      // DO NOT clear categoryId
    } else if (
      prevCategoryId === 'pinned' &&
      movedItem.originalCategoryId != null
    ) {
      // Restore category from original
      const targetCat = this.categories.find(
        (cat) => cat.id === movedItem.originalCategoryId
      );
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
        const targetCategory = this.categories.find(
          (c) => c.id === currCategoryId
        );
        if (targetCategory) {
          movedItem.categoryId = targetCategory.id;
          movedItem.category = {
            id: targetCategory.id,
            name: targetCategory.name,
          };
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
      position: index,
    }));

    this.listsService
      .reorderCategoriesForList(this.list.id, payload)
      .subscribe({
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

confirmComplete(item: TestItem, event: Event) {
  event.stopPropagation();
  item.confirmingComplete = true;

  // Automatically revert if no action is taken within 2 seconds
  setTimeout(() => {
    item.confirmingComplete = false;
  }, 5000);
}

cancelConfirmComplete(item: TestItem) {
  item.confirmingComplete = false;
}

onCompleteItem(item: TestItem, event: Event) {
  event.stopPropagation();

  item.confirmingComplete = false; // reset state

  this.listsService.completeItem(item.id).subscribe({
    next: () => {
      this.loadItems(); // refresh after confirmed completion
    },
    error: (err) => {
      console.error('❌ Failed to complete item:', err);
      alert('Failed to mark item as complete');
    }
  });
}

setShowNewItemFormWithCategory(categoryName: string) {
  this.showNewItemForm = true;

  const category = this.categories.find(c => c.name === categoryName);
  if (category) {
    this.selectedCategoryId = category.id;

    // If the component is already loaded, set it directly
    setTimeout(() => {
      if (this.addListItemComponent) {
        this.addListItemComponent.selectedCategoryId = category.id;
      }
    });
  }
}


onItemRestored(item: any) {
  this.items.push(item);

  const categoryName = item.category?.name || 'Uncategorized';

  const testItem = {
    id: item.id,
    name: item.title,
    position: this.testItems.length,
    categoryName,
    pinned: false,
    createdAt: item.createdAt,
    priority: item.priority || 'Medium',
    tempPriority: item.priority || 'Medium',
    tempDescription: item.description ?? ''
  };

  if (!this.groupedTestItems[categoryName]) {
    this.groupedTestItems[categoryName] = [];
  }

  this.groupedTestItems[categoryName].push(testItem);
  this.testItems.push(testItem);

  this.cdr.detectChanges();
}

onRestoreAllItems() {
  if (!this.completedListComponent?.items?.length) return;

  const itemsToRestore = [...this.completedListComponent.items];

  const requests = itemsToRestore.map(item =>
    this.listsService.uncompleteItem(item.id).toPromise()
  );

  Promise.all(requests)
    .then(restored => {
      restored.forEach(item => this.onItemRestored(item));
      this.completedListComponent.items = [];
    })
    .catch(err => {
      console.error('❌ Failed to restore all items:', err);
      alert('Failed to restore all items.');
    });
}

onExportClicked() {
    this.showExportPanel = true;
  }

  onCloseExport() {
    this.showExportPanel = false;
  }

onConfirmExport() {
  this.exportListComponent?.exportToTxt();
  this.showExportPanel = false;
}

  onExportOptionsValidChange(valid: boolean) {
  this.isExportValid = valid;
}

get isFiltering(): boolean {
  return !!this.filterText.trim();
}

}
