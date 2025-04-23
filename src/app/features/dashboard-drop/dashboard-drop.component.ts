import { Component, OnInit, AfterViewChecked, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatTabsModule } from '@angular/material/tabs';
import { DashboardDropService } from './dashboard-drop.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { DialogConfirmComponent } from '../../dialogs/dialog-confirm/dialog-confirm.component';
import { DialogManageLinksComponent } from '../../dialogs/dialog-manage-links/dialog-manage-links.component';
import { DialogEditSingleLinkComponent } from '../../dialogs/dialog-edit-single-link/dialog-edit-single-link.component';
import { DialogAddGroupComponent } from '../../dialogs/dialog-add-group/dialog-add-group.component';
import { DialogAddLinkComponent } from '../../dialogs/dialog-add-link/dialog-add-link.component';

@Component({
  selector: 'app-dashboard-drop',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, MatTabsModule,MatMenuModule],
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

  dropLink(event: CdkDragDrop<any[]>, targetGroup: any, category: any) {
  const prevGroup = category.groups.find((g: any) => g.links.includes(event.item.data));
  const movedLink = event.item.data;

  // If moved within same group
  if (event.previousContainer === event.container) {
    moveItemInArray(targetGroup.links, event.previousIndex, event.currentIndex);
  } else {
    // Remove from previous group
    const prevLinks = event.previousContainer.data as any[];
    prevLinks.splice(event.previousIndex, 1);

    // Add to new group
    targetGroup.links.splice(event.currentIndex, 0, movedLink);

    // Update the groupId
    movedLink.group = targetGroup;
  }

  // Recompute positions in both groups
  const reordered = targetGroup.links.map((link: any, index: number) => ({
    id: link.id,
    position: index
  }));

  this.dropService.reorderLinks(reordered).subscribe({
    next: () => console.log('Link reorder saved'),
    error: err => console.error('Error saving link reorder', err)
  });

  // Optional: Update group for moved link in backend
  if (event.previousContainer !== event.container) {
    this.dropService.updateLinkGroup(movedLink.id, targetGroup.id).subscribe({
      next: () => console.log('Link group updated'),
      error: err => console.error('Failed to update link group', err)
    });
  }
}


  dropGroup(event: CdkDragDrop<any[]>, category: any) {
    moveItemInArray(category.groups, event.previousIndex, event.currentIndex);

    const reordered = category.groups.map((group: any, index: number) => ({
      id: group.id,
      position: index
    }));

    this.dropService.reorderGroups(category.id, reordered).subscribe({
      next: () => console.log('Group reorder saved'),
      error: err => console.error('Error saving group reorder', err)
    });
  }

  moveGroupToCategory(group: any, newCategoryId: number): void {
    const targetCategory = this.categories.find(c => c.id === newCategoryId);
    const nextPosition = targetCategory?.groups?.length || 0;
  
    this.dropService.updateGroup(group.id, {
      categoryId: newCategoryId,
      position: nextPosition
    }).subscribe({
      next: () => {
        console.log('Group moved to new category at end');
        this.refreshCategories();
      },
      error: err => console.error('Failed to move group', err)
    });
  }
  

  refreshCategories(): void {
    this.dropService.fetchCategories().subscribe({
      next: (data: any[]) => {
        data.forEach(category => {
          category.groups.forEach((group: any) => {
            group.links.sort((a: any, b: any) => a.position - b.position);
          });
        });
        this.categories = data;
      },
      error: (err: any) => console.error('Error loading categories', err)
    });
  }

  deleteLink(link: any): void {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Delete Link',
        message: `Are you sure you want to delete the link "${link.name}"?`
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dropService.deleteLink(link.id).subscribe({
          next: () => {
            console.log('Link deleted');
            this.refreshCategories();
          },
          error: err => console.error('Failed to delete link', err)
        });
      }
    });
  }

  openEditLinksDialog(categoryId: number, groupId: number): void {
    const dialogRef = this.dialog.open(DialogManageLinksComponent, {
      width: '700px',
      data: {
        categoryId,
        groupId,
        showGroupEditor: true
      }
    });
  
    const instance = dialogRef.componentInstance;
    instance.groupNameUpdated.subscribe(() => {
      this.refreshCategories(); // 👈 refresh on group rename
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshCategories(); // 👈 refresh on dialog close too
    });
  }
  
  deleteGroup(group: any): void {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Delete Group',
        message: `Are you sure you want to delete the group "${group.name}"? This will also delete all links in the group.`
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dropService.deleteGroup(group.id).subscribe({
          next: () => {
            console.log('Group deleted');
            this.refreshCategories();
          },
          error: err => console.error('Failed to delete group', err)
        });
      }
    });
  }

  editLink(link: any): void {
    const dialogRef = this.dialog.open(DialogEditSingleLinkComponent, {
      width: '600px',
      data: { linkId: link.id } // ✅ pass just the link ID
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refreshCategories(); // refresh if link was updated or deleted
      }
    });
  }

  openAddGroupDialog(categoryId: number): void {
    const dialogRef = this.dialog.open(DialogAddGroupComponent, {
      width: '400px',
      data: { categoryId }
    });
  
    dialogRef.componentInstance.groupAdded.subscribe(() => {
      this.refreshCategories(); // ⬅️ refresh dashboard without closing dialog
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshCategories();
    });
  }
  
  refreshDashboard() {
    this.dropService.fetchCategories().subscribe((data) => {
      this.categories = data;
    });
  }

  openAddLinkDialog(groupId: number): void {
    const dialogRef = this.dialog.open(DialogAddLinkComponent, {
      width: '500px',
      data: { groupId }
    });
  
    dialogRef.componentInstance.linkAdded.subscribe(() => {
      this.refreshCategories(); // ⬅️ Refresh after adding
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshCategories();
    });
  }
  
}