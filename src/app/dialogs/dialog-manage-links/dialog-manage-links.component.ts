import { Component, OnInit, inject, ViewChild, ElementRef, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogContent, MatDialogActions, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DashboardService } from '../../features/dashboard/dashboard.service';

@Component({
  selector: 'app-dialog-manage-links',
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
    MatDialogActions
  ],
  templateUrl: './dialog-manage-links.component.html',
  styleUrl: './dialog-manage-links.component.css'
})
export class DialogManageLinksComponent implements OnInit {

  @ViewChild('linkNameInput') linkNameInputRef!: ElementRef;

  private dashboardService = inject(DashboardService);
  private dialogRef = inject(MatDialogRef<DialogManageLinksComponent>);

  categories: any[] = [];
  filteredGroups: any[] = [];
  editableLinks: any[] = [];
  originalOrder: number[] = [];
  showAddForm = false;
  selectedCategoryId: number | null = null;
  selectedGroupId: number | null = null;
  newLinkDescription = '';
  newLinkName = '';
  newLinkUrl = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) @Optional() public data: { categoryId?: number, groupId?: number }
  ) {}

  ngOnInit() {
    this.dashboardService.getFullDashboard().subscribe(categories => {
      this.categories = categories;

      if (categories.length > 0) {
        this.selectedCategoryId = this.data?.categoryId ?? categories[0].id;
        this.onCategoryChange(() => {
          this.selectedGroupId = this.data?.groupId ?? this.filteredGroups[0]?.id ?? null;
          this.onGroupChange();
        });
      }
    });
  }

  onCategoryChange(callback?: () => void) {
    const selectedCat = this.categories.find(c => +c.id === +this.selectedCategoryId!);
    this.filteredGroups = selectedCat?.groups || [];
    this.editableLinks = [];

    if (this.filteredGroups.length > 0) {
      callback?.();
    }
  }

  addLink() {
    const name = this.newLinkName.trim();
    const url = this.newLinkUrl.trim();
    const description = this.newLinkDescription.trim();

    if (!name || !url || !this.selectedGroupId) return;

    const payload = {
      name,
      url,
      icon: 'default.png',
      description,
      groupId: this.selectedGroupId
    };

    this.dashboardService.createLink(payload).subscribe({
      next: (created: any) => {
        this.editableLinks.push(created);
        this.editableLinks.sort((a, b) => a.position - b.position);
        this.originalOrder = this.editableLinks.map(link => link.id);

        this.newLinkName = '';
        this.newLinkUrl = '';
        this.newLinkDescription = '';

        setTimeout(() => {
          this.linkNameInputRef.nativeElement.focus();
        });
      },
      error: (err) => {
        console.error('Failed to create link', err);
        alert('Failed to create link.');
      }
    });
  }

  cancelAddLink() {
    this.newLinkName = '';
    this.newLinkUrl = '';
    this.newLinkDescription = '';
    this.showAddForm = false;
  }

  onGroupChange() {
    this.dashboardService.getAllLinks().subscribe((links) => {
      this.editableLinks = links
        .filter(link => link.group?.id === this.selectedGroupId)
        .map(link => ({ ...link, isEditing: false }));
      this.originalOrder = this.editableLinks.map(link => link.id);
    });
  }

  get hasOrderChanged(): boolean {
    return !this.originalOrder.every((id, idx) => id === this.editableLinks[idx]?.id);
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.editableLinks, event.previousIndex, event.currentIndex);
  }

  saveOrder() {
    const reordered = this.editableLinks.map((link, idx) => ({
      id: link.id,
      position: idx
    }));

    this.dashboardService.reorderLinks(reordered).subscribe({
      next: () => {
        this.originalOrder = this.editableLinks.map(l => l.id);
      },
      error: (err) => {
        console.error('Failed to save reorder', err);
        alert('Failed to save link order.');
      }
    });
  }

  deleteLink(link: any) {
    if (confirm(`Delete link "${link.name}"?`)) {
      this.dashboardService.deleteLink(link.id).subscribe({
        next: () => {
          this.editableLinks = this.editableLinks.filter(l => l.id !== link.id);
          this.originalOrder = this.editableLinks.map(l => l.id);
        },
        error: (err) => {
          console.error('Failed to delete link', err);
          alert('Failed to delete link.');
        }
      });
    }
  }

  enableEdit(link: any) {
    link.originalName = link.name;
    link.originalUrl = link.url;
    link.originalDescription = link.description;
    link.isEditing = true;
  }

  cancelEdit(link: any) {
    link.name = link.originalName;
    link.url = link.originalUrl;
    link.description = link.originalDescription;
    link.isEditing = false;
  }

  saveEdit(link: any) {
    const updatePayload = {
      name: link.name,
      url: link.url,
      description: link.description,
    };

    this.dashboardService.updateLink(link.id, updatePayload).subscribe({
      next: () => {
        link.isEditing = false;
      },
      error: (err) => {
        console.error('Failed to update link', err);
        alert('Failed to save changes.');
      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
