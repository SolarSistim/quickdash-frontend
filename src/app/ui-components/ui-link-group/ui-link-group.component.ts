import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatMenuModule } from '@angular/material/menu';
import { DashboardDropService } from '../../features/dashboard-drop/dashboard-drop.service';
import { DialogAddLinkComponent } from '../../dialogs/dialog-add-link/dialog-add-link.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogManageLinksComponent } from '../../dialogs/dialog-manage-links/dialog-manage-links.component';
import { DialogConfirmComponent } from '../../dialogs/dialog-confirm/dialog-confirm.component';
import { DialogManageLinkGroupsComponent } from '../../dialogs/dialog-manage-link-groups/dialog-manage-link-groups.component';
import { DialogAddGroupComponent } from '../../dialogs/dialog-add-group/dialog-add-group.component';
import { UiLinkComponent } from '../ui-link/ui-link.component';
import { StatusMessageService } from '../ui-status/ui-status.service';

@Component({
  selector: 'app-ui-link-group',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatMenuModule,UiLinkComponent],
  templateUrl: './ui-link-group.component.html',
  styleUrls: ['./ui-link-group.component.css']
})
export class UiLinkGroupComponent {

  @Input() category: any;
  @Input() categories: any[] = [];
  @Input() isGroupDraggable = true;
  @Input() isLinkDraggable = true;

  @Input() group!: any;
  @Output() linkAdded = new EventEmitter<void>();

  @Output() moveGroup = new EventEmitter<{ group: any, newCategoryId: number }>();
  @Output() openEditLinks = new EventEmitter<{ categoryId: number, groupId: number }>();
  @Output() openManageGroups = new EventEmitter<{ categoryId: number, groupId: number }>();
  @Output() openAddGroup = new EventEmitter<number>();
  @Output() groupMoved = new EventEmitter<void>();
  @Output() refreshRequested = new EventEmitter<void>();
  @Output() refreshCategories = new EventEmitter<void>();

  showHandles = false;

  constructor(
    private dropService: DashboardDropService,
    private dialog: MatDialog,
    private statusService: StatusMessageService  // <-- add this
  ) {}

  allowGroupDrag(): void {
    this.isGroupDraggable = false;
  }
  
  preventGroupDrag(): void {
    this.isGroupDraggable = true;
  }

  trackLinkById(index: number, item: any): number {
    return item.id;
  }

  toggleHandles() {
    this.showHandles = !this.showHandles;
  
    if (this.showHandles) {
      this.statusService.show('Drag and drop enabled', 'success', true); // persistent
    } else {
      this.statusService.clearPersistent();
      this.statusService.clear();
    }
  }

  openAddGroupDialog(categoryId: number): void {
    const dialogRef = this.dialog.open(DialogAddGroupComponent, {
      width: '400px',
      data: { categoryId }
    });
  
    const instance = dialogRef.componentInstance;
  
    instance.groupAdded.subscribe(() => {
      this.refreshGroups();  // ✅ ACTUALLY refresh the data now
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshGroups(); // ✅ optional: refresh again after closing
    });
  }
  
  dropLink(event: CdkDragDrop<any[]>, group: any) {
    const prevContainer = event.previousContainer;
    const currContainer = event.container;
  
    if (prevContainer === currContainer) {
      // 🔹 Moved within the same group, just reorder
      moveItemInArray(group.links, event.previousIndex, event.currentIndex);
  
      const reorderedLinks = group.links.map((link: any, index: number) => ({
        id: link.id,
        position: index
      }));
  
      this.dropService.reorderLinks(reorderedLinks).subscribe({
        next: () => console.log('Links reordered within group'),
        error: (err) => console.error('Failed to reorder links', err)
      });
    } else {
      // 🔥 Moved to a different group
      const movedLink = prevContainer.data[event.previousIndex];
  
      // Remove from previous group
      prevContainer.data.splice(event.previousIndex, 1);
  
      // Add into the new group
      currContainer.data.splice(event.currentIndex, 0, movedLink);
  
      // 🛠 Update link's groupId
      this.dropService.updateLinkGroup(movedLink.id, group.id).subscribe({
        next: () => {
          console.log('Link moved to new group successfully');
  
          // Now optionally reorder links in the new group too
          const reorderedLinks = group.links.map((link: any, index: number) => ({
            id: link.id,
            position: index
          }));
  
          this.dropService.reorderLinks(reorderedLinks).subscribe({
            next: () => console.log('Links reordered in new group'),
            error: (err) => console.error('Failed to reorder links after moving', err)
          });
        },
        error: (err) => console.error('Failed to update link group', err)
      });
      
    }
  }

  handleLinkMoved(event: { movedLinkId: number, newGroupId: number, oldGroupId: number }) {
    const { movedLinkId, newGroupId } = event;
  
    const reorderedLinks = this.category.groups
      .find((g: any) => g.id === newGroupId)?.links
      .map((link: any, index: number) => ({ id: link.id, position: index })) || [];
  
    this.dropService.moveAndReorderLink(movedLinkId, newGroupId, reorderedLinks).subscribe({
      next: () => {
        console.log('Move and reorder completed successfully');
        this.refreshGroup(this.category.id, event.oldGroupId);
        this.refreshGroup(this.category.id, newGroupId);
      },
      error: (err) => console.error('Failed to move and reorder link', err)
    });
  }
  
  
  refreshGroup(categoryId: number, groupId: number) {
    this.dropService.fetchCategories().subscribe({
      next: (data) => {
        const category = data.find(c => c.id === categoryId);
        if (category) {
          const updatedGroup = category.groups.find((g: any) => g.id === Number(groupId));
          const groupInView = this.category.groups.find((g: any) => g.id === Number(groupId));
          if (updatedGroup && groupInView) {
            groupInView.links = updatedGroup.links;
          }
        }
      },
      error: (err) => console.error('Failed to refresh group', err)
    });
  }

  openAddLinkDialog(groupId: number): void {
    const dialogRef = this.dialog.open(DialogAddLinkComponent, {
      width: '500px',
      data: { groupId }
    });
  
    dialogRef.componentInstance.linkAdded
    .subscribe(() => this.refreshGroups());
  
    dialogRef.afterClosed()
    .subscribe(() => this.refreshGroups());
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
      this.refreshRequested.emit();
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshRequested.emit();
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
            this.refreshRequested.emit();
          },
          error: err => console.error('Failed to delete group', err)
        });
      }
    });
  }

  dropGroup(event: CdkDragDrop<any[]>, category: any) {
    moveItemInArray(category.groups, event.previousIndex, event.currentIndex);

    const reordered = category.groups.map((group: any, index: number) => ({
      id: group.id,
      position: index
    }));

    this.dropService.reorderGroups(this.category.id, reordered).subscribe({
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
        this.groupMoved.emit(); // 🔼 notify parent
      },
      error: err => console.error('Failed to move group', err)
    });
  }

  refreshGroups() {
    this.dropService.fetchCategories().subscribe({
      next: (data) => {
        const currentCategory = data.find(c => c.id === this.category.id);
        if (currentCategory) {
          this.category.groups = currentCategory.groups;
        }
      },
      error: (err) => console.error('Error refreshing groups', err)
    });
  }

  openManageGroupsDialog(categoryId?: number, groupId?: number): void {
    const dialogRef = this.dialog.open(DialogManageLinkGroupsComponent, {
      width: '600px',
      data: {
        categoryId,
        groupId
      }
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshRequested.emit();
    });
  }

  onMoveGroup(event: { group: any; newCategoryId: number }) {
    const { group, newCategoryId } = event;
    this.dropService.updateGroup(group.id, {
      categoryId: newCategoryId,
      position: this.categories.find(c => c.id === newCategoryId)?.groups.length || 0
    }).subscribe({
      next: () => {
        console.log(`Group ${group.name} moved to category ID ${newCategoryId}`);
        this.refreshRequested.emit();
      },
      error: err => console.error('Failed to move group', err)
    });
  }


}
