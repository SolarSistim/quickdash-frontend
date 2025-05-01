import { Component, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { DialogManageCategoriesComponent } from '../../dialogs/dialog-manage-categories/dialog-manage-categories.component';
import { DialogManageLinkGroupsComponent } from '../../dialogs/dialog-manage-link-groups/dialog-manage-link-groups.component';
import { DialogManageLinksComponent } from '../../dialogs/dialog-manage-links/dialog-manage-links.component';
import { DialogManageSettingsComponent } from '../../dialogs/dialog-manage-settings/dialog-manage-settings.component';
import { DialogManageIconsComponent } from '../../dialogs/dialog-manage-icons/dialog-manage-icons.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings-button',
  imports: [MatButtonModule,MatMenuModule,RouterModule],
  templateUrl: './settings-button.component.html',
  styleUrls: ['./settings-button.component.css']
})
export class SettingsButtonComponent {
  
  @Output() refreshRequested = new EventEmitter<void>();

    constructor(
      private dialog: MatDialog
    ) {}


  DialogManageIconsComponent(): void {
    const dialogRef = this.dialog.open(DialogManageIconsComponent, {
      width: '650px',
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshRequested.emit();
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

  openManageCategoryDialog(categoryId?: number, groupId?: number): void {
    const dialogRef = this.dialog.open(DialogManageCategoriesComponent, {
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

  openManageLinksDialog(categoryId?: number, groupId?: number): void {
    const dialogRef = this.dialog.open(DialogManageLinksComponent, {
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

  openSettingsDialog(categoryId?: number, groupId?: number): void {
    const dialogRef = this.dialog.open(DialogManageSettingsComponent, {
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

}
