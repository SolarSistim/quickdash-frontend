import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../features/dashboard/dashboard.service';

@Component({
  selector: 'app-dialog-add-link',
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
  templateUrl: './dialog-add-link.component.html',
  styleUrls: ['./dialog-add-link.component.css']
})
export class DialogAddLinkComponent {

  dashboardService = inject(DashboardService);
  dialogRef = inject(MatDialogRef<DialogAddLinkComponent>);

  newLinkName = '';
  newLinkUrl = '';
  newLinkDescription = '';
  selectedGroupId!: number;

  constructor() {
    const data = inject(MAT_DIALOG_DATA) as { groupId: number };
    this.selectedGroupId = data.groupId;
  }

  save() {
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
        this.dialogRef.close(created); // return created link
      },
      error: (err) => {
        console.error('Failed to create link', err);
        alert('Failed to create link.');
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
