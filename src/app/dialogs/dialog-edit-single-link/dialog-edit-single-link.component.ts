import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogRef,
  MatDialogContent,
  MatDialogActions,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { DashboardService } from '../../features/dashboard/dashboard.service';

@Component({
  selector: 'app-dialog-edit-single-link',
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
  templateUrl: './dialog-edit-single-link.component.html',
  styleUrls: ['./dialog-edit-single-link.component.css']
})
export class DialogEditSingleLinkComponent implements OnInit {

  linkWasUpdated = false;
  link: any = { id: null, name: '', url: '', description: '' };
  original: any = {};
  loading = true;

  constructor(
    private dialogRef: MatDialogRef<DialogEditSingleLinkComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { linkId: number },
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.dashboardService.getFullDashboard().subscribe((categories) => {
      for (const cat of categories) {
        for (const group of cat.groups) {
          const match = group.links.find((l: any) => l.id === this.data.linkId);
          if (match) {
            this.link = { ...match };
            this.original = { ...match };
            break;
          }
        }
      }
      this.loading = false;
    });
  }

  save() {
    const { name, url, description } = this.link;
    this.dashboardService.updateLink(this.link.id, { name, url, description }).subscribe({
      next: () => {
        console.log('Link updated successfully');
        this.original = { ...this.link };
        this.linkWasUpdated = true; // ✅ mark that a change occurred
      },
      error: (err) => {
        console.error('Failed to update link', err);
        alert('Failed to update link.');
      }
    });
  }
  

  delete() {
    if (confirm(`Are you sure you want to delete "${this.link.name}"?`)) {
      this.dashboardService.deleteLink(this.link.id).subscribe({
        next: () => {
          this.dialogRef.close(true); // ✅ signal deletion occurred
        },
        error: (err) => {
          console.error('Failed to delete link', err);
          alert('Failed to delete link.');
        }
      });
    }
  }

  cancel() {
    this.dialogRef.close(this.linkWasUpdated); // ✅ pass true if updated
  }

  get isUnchanged(): boolean {
    return (
      this.link.name === this.original.name &&
      this.link.url === this.original.url &&
      this.link.description === this.original.description
    );
  }

  saveAndClose() {
    const { name, url, description } = this.link;
  
    if (!name.trim() || !url.trim() || this.isUnchanged) {
      this.dialogRef.close(false); // Nothing to save, just close
      return;
    }
  
    this.dashboardService.updateLink(this.link.id, { name, url, description }).subscribe({
      next: () => {
        this.linkWasUpdated = true;
        this.dialogRef.close(true); // Close and signal update occurred
      },
      error: (err) => {
        console.error('Failed to update link', err);
        alert('Failed to update link.');
      }
    });
  }
  

}
