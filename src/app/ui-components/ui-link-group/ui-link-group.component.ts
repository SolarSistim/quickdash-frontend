import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(private dropService: DashboardDropService, private dialog: MatDialog) {}

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
  }

  openAddGroupDialog(categoryId: number): void {
    const dialogRef = this.dialog.open(DialogAddGroupComponent, {
      width: '400px',
      data: { categoryId }
    });
  
    dialogRef.componentInstance.groupAdded.subscribe(() => {
      this.refreshRequested.emit();
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshRequested.emit();
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
