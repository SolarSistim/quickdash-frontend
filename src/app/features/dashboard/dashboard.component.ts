import { Component, OnInit, inject  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService } from './dashboard.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { SettingsService } from '../settings/settings.service';
import { MatMenuModule } from '@angular/material/menu';
import { DialogManageCategoriesComponent } from '../../dialogs/dialog-manage-categories/dialog-manage-categories.component';
import { DialogManageLinkGroupsComponent } from '../../dialogs/dialog-manage-link-groups/dialog-manage-link-groups.component';
import { DialogManageLinksComponent } from '../../dialogs/dialog-manage-links/dialog-manage-links.component';
import { DialogEditSingleGroupComponent } from '../../dialogs/dialog-edit-single-group/dialog-edit-single-group.component';
import { DialogEditSingleLinkComponent } from '../../dialogs/dialog-edit-single-link/dialog-edit-single-link.component';
import { DialogAddLinkComponent } from '../../dialogs/dialog-add-link/dialog-add-link.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatCardModule,MatGridListModule,MatMenuModule,MatDividerModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  categories: any[] = [];
  tabFontColor = '#ffffff';
  hoveredCategory: number | null = null;
  
  
  selectedLink: any = null;
  selectedMoveCategory: any = null;

  private dashboardService = inject(DashboardService);
  private settingsService = inject(SettingsService);
  private dialog = inject(MatDialog);

  ngOnInit() {
    this.refreshDashboard();
  
    this.settingsService.fetchAllSettings().subscribe(settings => {
      this.settingsService.setSettings(settings);
      this.settingsService.applyCssVariablesFromSettings(settings);
    });
  }


  trackByGroupId(index: number, group: any): number {
    return group.id;
  }
  
  trackByLinkId(index: number, link: any): number {
    return link.id;
  }

  openCategoryDialog() {
    const dialogRef = this.dialog.open(DialogManageCategoriesComponent, {
      width: '500px',           // ✅ Keep width fixed
      maxHeight: '90vh',        // ✅ Allow it to grow naturally up to a cap
      autoFocus: false,         // Optional: prevents focus jumping
      data: {
        categories: this.categories
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      this.refreshDashboard(); // Trigger your refresh logic here
    });
  }

  openLinkGroupDialog(categoryId?: number, groupId?: number) {
    const dialogRef = this.dialog.open(DialogManageLinkGroupsComponent, {
      width: '500px',
      maxHeight: '70vh',
      data: { categoryId, groupId } // 🔥 passing groupId too
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshDashboard();
    });
  }
  
  openLinkDialog(categoryId?: number, groupId?: number) {
    const dialogRef = this.dialog.open(DialogManageLinksComponent, {
      width: '500px',
      maxHeight: '70vh',
      data: { categoryId, groupId } // may be undefined
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.refreshDashboard();
    });
  }  

  refreshDashboard() {
    this.dashboardService.getFullDashboard().subscribe(categories => {
      this.categories = categories.map(cat => ({
        ...cat,
        groups: [...cat.groups]
          .sort((a, b) => a.position - b.position)
          .map(group => ({
            ...group,
            links: [...group.links].sort((a, b) => a.position - b.position)
          }))
      }));
    });
  }

  openEditGroupDialog(groupId: number) {
    this.dialog.open(DialogEditSingleGroupComponent, {
      data: { groupId },
      width: '400px'
    }).afterClosed().subscribe((updated) => {
      if (updated) {
        this.refreshDashboard();
      }
    });
  }

  openEditLinkDialog(linkId: number) {
    this.dialog.open(DialogEditSingleLinkComponent, {
      data: { linkId },
      width: '400px'
    }).afterClosed().subscribe((updated) => {
      if (updated) {
        this.refreshDashboard();
      }
    });
  }

  confirmDeleteLink(linkId: number) {
    const confirmed = confirm('Are you sure you want to delete this link?');
  
    if (confirmed) {
      this.dashboardService.deleteLink(linkId).subscribe({
        next: () => {
          this.refreshDashboard();
        },
        error: (err) => {
          console.error('Failed to delete link', err);
          alert('Failed to delete link.');
        }
      });
    }
  }

  moveLinkToGroup(linkId: number, groupId: number) {
    this.dashboardService.updateLink(linkId, { groupId }).subscribe({
      next: () => this.refreshDashboard(),
      error: (err) => {
        console.error('Failed to move link', err);
        alert('Failed to move link.');
      }
    });
  }

  openAddLinkDialog(groupId: number) {
    const dialogRef = this.dialog.open(DialogAddLinkComponent, {
      width: '500px',
      maxHeight: '70vh',
      data: { groupId }
    });
  
    dialogRef.afterClosed().subscribe((newLink) => {
      if (newLink) {
        this.refreshDashboard();
      }
    });
  }

}
