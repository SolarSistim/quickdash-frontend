import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environment/environment';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ManageIconsService } from './manage-icons.service';

@Component({
  selector: 'app-dialog-manage-icons',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogContent,
    MatDialogActions,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './dialog-manage-icons.component.html',
  styleUrl: './dialog-manage-icons.component.css'
})
export class DialogManageIconsComponent {

  private dialogRef = inject(MatDialogRef<DialogManageIconsComponent>);
  private readonly base = environment.apiUrl;
  private http = inject(HttpClient);
  private iconService = inject(ManageIconsService);

  icons: any[] = [];
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploading = false;
  title: string = '';
  description: string = '';
  filenameExists = false;
  blinking = false;
  editingIconId: number | null = null;
  editedTitle: string = '';
  editedDescription: string = '';
  filterText: string = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    setTimeout(() => {
      this.fetchIcons();
    });
  }

  get filteredIcons() {
    if (!this.filterText.trim()) {
      return this.icons;
    }
  
    const text = this.filterText.trim().toLowerCase();
    return this.icons.filter(icon =>
      (icon.filename?.toLowerCase().includes(text) || '') ||
      (icon.title?.toLowerCase().includes(text) || '') ||
      (icon.description?.toLowerCase().includes(text) || '')
    );
  }

  fetchIcons() {
    this.iconService.fetchIcons().subscribe((data) => {
      this.icons = data;
      this.cdr.detectChanges();
    });
  }

  openFileExplorer() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.png';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.previewUrl = URL.createObjectURL(file);
        this.title = file.name.replace(/\.[^/.]+$/, '');
  
        this.filenameExists = this.icons.some(icon => icon.filename.toLowerCase() === file.name.toLowerCase());
  
        if (this.filenameExists) {
          this.startBlinking();
        }
      }
    };
    input.click();
  }

  confirmDelete(icon: any) {
    if (!icon) return;
  
    const confirmDelete = window.confirm(`Are you sure you want to delete "${icon.title}"?`);
  
    if (confirmDelete) {
      this.iconService.deleteIcon(icon.id).subscribe({
        next: (res: any) => {
          console.log(res.message);
          this.fetchIcons();
        },
        error: (err) => {
          console.error('Failed to delete icon:', err);
        }
      });
    }
  }
  
  
  startBlinking() {
    this.blinking = true;
    setTimeout(() => {
      this.blinking = false;
    }, 1800); // 3 blinks × 600ms (each blink cycle is 600ms)
  }
  
  resetUpload() {
    this.selectedFile = null;
    this.previewUrl = null;
    this.title = '';
    this.description = '';
    this.filenameExists = false;
  }

  uploadIcon() {
    if (!this.selectedFile) return;
  
    this.uploading = true;
    this.iconService.uploadIcon(
      this.selectedFile,
      this.title || this.selectedFile.name.replace('.png', ''),
      this.description || ''
    ).subscribe({
      next: () => {
        this.uploading = false;
        this.resetUpload();
        this.fetchIcons();
      },
      error: (err) => {
        console.error(err);
        this.uploading = false;
      }
    });
  }
  

  closeDialog() {
    this.dialogRef.close();
  }

  startEditingIcon(icon: any) {
    this.editingIconId = icon.id;
    this.editedTitle = icon.title;
    this.editedDescription = icon.description;
  }
  
  cancelEditing() {
    this.editingIconId = null;
    this.editedTitle = '';
    this.editedDescription = '';
  }

  getEditingIcon() {
    return this.icons.find(icon => icon.id === this.editingIconId) || null;
  }
  
  saveEditedIcon(icon: any) {
    if (!this.editedTitle.trim()) return;
  
    this.iconService.updateIcon(icon.id, this.editedTitle.trim(), this.editedDescription.trim())
      .subscribe({
        next: () => {
          this.cancelEditing();
          this.fetchIcons();
        },
        error: (err) => {
          console.error('Failed to update icon:', err);
        }
      });
  }
  
  
 
  hasChanges(): boolean {
    const editingIcon = this.getEditingIcon();
    if (!editingIcon) return false;
  
    return (
      editingIcon.title !== this.editedTitle.trim() ||
      editingIcon.description !== this.editedDescription.trim()
    );
  }

  confirmDeleteDuringEdit(icon: any) {
    if (!icon) {
      console.error('No icon selected for deletion.');
      return;
    }
  
    const confirmDelete = window.confirm(`Are you sure you want to delete "${icon.title}"?`);
    if (confirmDelete) {
      this.http.delete(`${this.base}/icons/${icon.id}`).subscribe({
        next: () => {
          console.log(`Icon "${icon.title}" deleted.`);
          this.cancelEditing();   // Hide edit panel
          this.fetchIcons();      // Refresh icon list
        },
        error: (err) => {
          console.error('Failed to delete icon:', err);
        }
      });
    }
  }

}
