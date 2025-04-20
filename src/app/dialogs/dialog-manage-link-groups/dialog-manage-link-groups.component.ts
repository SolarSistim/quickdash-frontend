import { Component, OnInit, inject, ViewChild, ElementRef, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialogContent, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { DashboardService } from '../../features/dashboard/dashboard.service';

interface EditableGroup {
  id: number;
  name: string;
  position: number;
  isEditing?: boolean;
}

@Component({
  selector: 'app-dialog-manage-link-groups',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    DragDropModule,
    MatDialogContent,
    MatDialogActions,
  ],
  templateUrl: './dialog-manage-link-groups.component.html',
  styleUrls: ['./dialog-manage-link-groups.component.css']
})
export class DialogManageLinkGroupsComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { categoryId?: number, groupId?: number }
  ) {}

  @ViewChild('groupInput') groupInputRef!: ElementRef;
  
  private dashboardService = inject(DashboardService);
  private dialogRef = inject(MatDialogRef<DialogManageLinkGroupsComponent>);

  tooltipGroupId: number | null = null;
  tooltipMessage = '';

  newGroupName = '';
  showAddLinkGroup = false;
  newLinkGroupName = '';
  categories: any[] = [];
  originalOrder: number[] = [];
  selectedCategoryId: number | null = null;
  editableGroups: EditableGroup[] = [];

  ngOnInit() {
    this.dashboardService.getFullDashboard().subscribe((categories) => {
      this.categories = categories;
  
      const initialCategoryId = this.data?.categoryId ?? categories[0]?.id;
      if (initialCategoryId) {
        this.selectCategory(initialCategoryId);
  
        setTimeout(() => {
          const groupIdToEdit = this.data?.groupId;
          if (groupIdToEdit) {
            const groupToEdit = this.editableGroups.find(g => g.id === groupIdToEdit);
            if (groupToEdit) {
              this.enableEdit(groupToEdit);
  
              // Scroll the row into view and highlight it
              const el = document.getElementById(`group-${groupIdToEdit}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                el.classList.add('scroll-focus');
                setTimeout(() => el.classList.remove('scroll-focus'), 2000);
              }
  
              // Show tooltip under the selected group
              this.tooltipGroupId = groupIdToEdit;
              this.tooltipMessage = `Edit "${groupToEdit.name}" group here`;
              setTimeout(() => {
                this.tooltipGroupId = null;
              }, 3000);
            }
          }
        });
      }
    });
  }
  

  selectCategory(id: number) {
    this.selectedCategoryId = id;
    const selected = this.categories.find(cat => cat.id === id);
    this.editableGroups = selected?.groups.map((g: any) => ({ ...g })) || [];
    this.originalOrder = this.editableGroups.map(g => g.id);
  }

  get hasOrderChanged(): boolean {
    if (this.originalOrder.length !== this.editableGroups.length) {
      return true;
    }
  
    return !this.originalOrder.every((id, index) => id === this.editableGroups[index]?.id);
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.editableGroups, event.previousIndex, event.currentIndex);
  }

  enableEdit(group: any) {
    group.originalName = group.name;
    group.isEditing = true;
  }

  cancelEdit(group: any) {
    group.name = group.originalName;
    group.isEditing = false;
    delete group.originalName;
  }

  onCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedId = Number(select.value); // Ensure numeric match
    this.selectCategory(selectedId);
  }

  closeDialog() {
    this.dialogRef.close(); // This triggers afterClosed() in DashboardComponent
  }

  saveEdit(group: any) {
    this.dashboardService.updateLinkGroup(group.id, { name: group.name }).subscribe({
      next: () => {
        group.isEditing = false;
      },
      error: (err) => {
        console.error('Failed to update group', err);
        alert('Failed to save changes.');
      }
    });
  }

  deleteGroup(group: any) {
    if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
      this.dashboardService.deleteLinkGroup(group.id).subscribe({
        next: () => {
          this.editableGroups = this.editableGroups.filter(g => g.id !== group.id);
          this.originalOrder = this.editableGroups.map(g => g.id);
        },
        error: (err) => {
          console.error('Failed to delete group', err);
          alert('Failed to delete group.');
        }
      });
    }
  }

  addGroup() {
    const name = this.newGroupName.trim();
    if (!name || !this.selectedCategoryId) return;
  
    const position = this.editableGroups.length;
  
    this.dashboardService.createLinkGroup({
      name,
      categoryId: this.selectedCategoryId,
      position
    }).subscribe({
      next: (created: any) => {
        this.editableGroups.push(created);
        this.editableGroups.sort((a, b) => a.position - b.position);
        this.originalOrder = this.editableGroups.map(g => g.id);
        this.newGroupName = '';
    
        // ✅ Focus input again after a short delay
        setTimeout(() => {
          this.groupInputRef.nativeElement.focus();
        });
      },
      error: (err) => {
        console.error('Failed to create group', err);
        alert('Failed to create group.');
      }
    });
  }
  
  saveOrder() {
    const reordered = this.editableGroups.map((group, index) => ({
      id: group.id,
      position: index
    }));
  
    this.dashboardService.reorderLinkGroups(reordered).subscribe({
      next: () => {
        console.log('Reorder saved');
        this.originalOrder = this.editableGroups.map(g => g.id); // reset tracking
      },
      error: (err) => {
        console.error('Failed to save reorder', err);
        alert('Failed to save reorder.');
      }
    });
  }

}
