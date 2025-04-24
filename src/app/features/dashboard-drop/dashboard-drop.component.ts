import { Component, OnInit, AfterViewChecked, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatTabsModule } from '@angular/material/tabs';
import { DashboardDropService } from './dashboard-drop.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { DialogConfirmComponent } from '../../dialogs/dialog-confirm/dialog-confirm.component';
import { DialogAddCategoryComponent } from '../../dialogs/dialog-add-category/dialog-add-category.component';
import { DialogEditSingleCategoryComponent } from '../../dialogs/dialog-edit-single-category/dialog-edit-single-category.component';
import { DialogManageCategoriesComponent } from '../../dialogs/dialog-manage-categories/dialog-manage-categories.component';
import { UiLinkGroupComponent } from '../../ui-components/ui-link-group/ui-link-group.component';

@Component({
  selector: 'app-dashboard-drop',
  standalone: true,
  imports: [CommonModule, MatTabsModule,MatMenuModule,UiLinkGroupComponent],
  templateUrl: './dashboard-drop.component.html',
  styleUrls: ['./dashboard-drop.component.css']
})
export class DashboardDropComponent implements OnInit, AfterViewChecked {

  categories: any[] = [];
  isGroupDraggable: boolean = true;
  isLinkDraggable: boolean = true;
  selectedTabIndex: number = 0;

  @ViewChildren('groupNameContainer') groupNameContainers!: QueryList<ElementRef>;

  constructor(
    private dropService: DashboardDropService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.refreshCategories();
  }

  ngAfterViewChecked(): void {
    this.groupNameContainers.forEach((containerRef, index) => {
      const container = containerRef.nativeElement;
      const groupNameElement = container.querySelector('.group-name');
      if (groupNameElement) {
        this.truncateGroupName(groupNameElement, container.offsetWidth);
      }
    });
  }

  truncateGroupName(element: HTMLElement, availableWidth: number): void {
    const originalText = element.textContent ? element.textContent.trim() : '';
    const computedStyle = window.getComputedStyle(element);
    const currentWidth = element.offsetWidth;

    if (currentWidth > availableWidth) {
      let truncatedText = originalText;
      while (element.offsetWidth > availableWidth && truncatedText.length > 0) {
        truncatedText = truncatedText.slice(0, -1);
        element.textContent = truncatedText + '...';
      }
      if (element.offsetWidth <= availableWidth && truncatedText !== originalText) {
        element.textContent = truncatedText + '...';
      } else if (truncatedText.length === 0 && originalText.length > 0) {
        element.textContent = '...';
      }
    } else {
      element.textContent = originalText;
    }
  }

  getSortedLinks(group: any): any[] {
    return [...group.links].sort((a, b) => a.position - b.position);
  }

  allowGroupDrag(): void {
    this.isGroupDraggable = false;
  }

  preventGroupDrag(): void {
    this.isGroupDraggable = true;
  }

  allowLinkDrag(): void {
    this.isLinkDraggable = false;
  }

  preventLinkDrag(): void {
    this.isLinkDraggable = true;
  }

  getConnectedDropLists(category: any): string[] {
    return category.groups.map((group: any) => `group-list-${group.id}`);
  }
  

  refreshCategories(): void {
    this.dropService.fetchCategories().subscribe({
      next: (data: any[]) => {
        console.log('Fetched categories from backend:', data); // 🔍 debug this
        this.categories = [...data]; // force change detection
      },
      error: (err: any) => console.error('Error loading categories', err)
    });
  }
  
  refreshDashboard() {
    this.dropService.fetchCategories().subscribe((data) => {
      this.categories = data;
    });
  }
  
  

  openEditCategoryDialog(category: any): void {
    const dialogRef = this.dialog.open(DialogEditSingleCategoryComponent, {
      width: '500px',
      data: { categoryId: category.id }
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshCategories(); // refresh if updated
    });
  }

  openManageCategoriesDialog(): void {
    const dialogRef = this.dialog.open(DialogManageCategoriesComponent, {
      width: '600px',
      data: {
        categories: this.categories // ✅ Pass current categories
      }
    });
  
    // Handle emitted event
    const instance = dialogRef.componentInstance;
    instance.categoriesUpdated.subscribe(() => {
      this.refreshCategories(); // 🔄 Refresh when a category is added, edited, or deleted
    });
  
    // Also refresh when dialog closes
    dialogRef.afterClosed().subscribe(() => {
      this.refreshCategories(); // 🔄 Refresh on close
    });
  }

  deleteCategory(category: any): void {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete the category "${category.name}"? This will also delete all groups and links in this category.`
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dropService.deleteCategory(category.id).subscribe({
          next: () => {
            console.log('Category deleted');
            this.refreshCategories();
          },
          error: err => console.error('Failed to delete category', err)
        });
      }
    });
  }
  
  openAddCategoryDialog(): void {
    const dialogRef = this.dialog.open(DialogAddCategoryComponent, {
      width: '500px'
    });
  
    dialogRef.componentInstance.categoryAdded.subscribe(() => {
      this.refreshCategories();
    });
  }

}