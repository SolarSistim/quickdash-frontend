import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardDropService } from '../../features/dashboard-drop/dashboard-drop.service';

@Component({
  selector: 'app-dialog-add-group',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogContent,
    MatDialogActions
  ],
  templateUrl: './dialog-add-group.component.html',
  styleUrls: ['./dialog-add-group.component.css']
})
export class DialogAddGroupComponent {

  @Output() groupAdded = new EventEmitter<void>();

  dashboardDropService = inject(DashboardDropService);
  dialogRef = inject(MatDialogRef<DialogAddGroupComponent>);

  newGroupName = '';
  selectedCategoryId!: number;

  constructor() {
    const data = inject(MAT_DIALOG_DATA) as { categoryId: number };
    this.selectedCategoryId = data.categoryId;
  }

  save() {
    const name = this.newGroupName.trim();
  
    if (!name || !this.selectedCategoryId) return;
  
    this.dashboardDropService.fetchCategories().subscribe(categories => {
      const category = categories.find(c => c.id === this.selectedCategoryId);
      const currentGroupCount = category?.groups?.length || 0;
  
      const payload = {
        name,
        categoryId: this.selectedCategoryId,
        position: currentGroupCount
      };
  
      this.dashboardDropService.createLinkGroup(payload).subscribe({
        next: () => {
          console.log('Group added.');
          this.groupAdded.emit();       // ⬅️ tell parent to refresh
          this.newGroupName = '';       // ⬅️ reset form field
        },
        error: (err) => {
          console.error('Failed to create group', err);
          alert('Failed to create group.');
        }
      });
    });
  }
  

  cancel() {
    this.dialogRef.close();
  }
}
