import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { DialogEditSingleLinkComponent } from '../../dialogs/dialog-edit-single-link/dialog-edit-single-link.component';
import { DialogManageLinksComponent } from '../../dialogs/dialog-manage-links/dialog-manage-links.component';
import { DialogAddLinkComponent } from '../../dialogs/dialog-add-link/dialog-add-link.component';
import { DialogConfirmComponent } from '../../dialogs/dialog-confirm/dialog-confirm.component';
import { DashboardDropService } from '../../features/dashboard-drop/dashboard-drop.service';

@Component({
  selector: 'app-ui-link',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatMenuModule],
  templateUrl: './ui-link.component.html',
  styleUrls: ['./ui-link.component.css']
})
export class UiLinkComponent {

  @Input() group: any;
  @Input() category: any;
  @Input() isLinkDraggable = true;
  @Input() showHandles = false;

  readonly defaultIconUrl = '../../../assets/icons/trakt.png';

  constructor(private dialog: MatDialog, private dropService: DashboardDropService) {}

  trackById(index: number, item: any): number {
    return item.id;
  }

  getSortedLinks(): any[] {
    return [...this.group.links].sort((a, b) => a.position - b.position);
  }

  getConnectedDropLists(): string[] {
    return this.category.groups.map((group: any) => `group-list-${group.id}`);
  }

  allowLinkDrag(): void {
    this.isLinkDraggable = false;
  }

  preventLinkDrag(): void {
    this.isLinkDraggable = true;
  }

  openLink(url: string): void {
    if (url) window.open(url, '_blank');
  }

  editLink(link: any): void {
    const dialogRef = this.dialog.open(DialogEditSingleLinkComponent, {
      width: '600px',
      data: { linkId: link.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refreshLinks();
      }
    });
  }

  openManageLinksDialog(): void {
    const dialogRef = this.dialog.open(DialogManageLinksComponent, {
      width: '700px',
      data: { categoryId: this.category.id, groupId: this.group.id, showGroupEditor: true }
    });

    dialogRef.afterClosed().subscribe(() => this.refreshLinks());
  }

  openAddLinkDialog(): void {
    const dialogRef = this.dialog.open(DialogAddLinkComponent, {
      width: '500px',
      data: { groupId: this.group.id }
    });

    dialogRef.afterClosed().subscribe(() => this.refreshLinks());
  }

  deleteLink(link: any): void {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Delete Link',
        message: `Are you sure you want to delete the link "${link.name}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dropService.deleteLink(link.id).subscribe({
          next: () => this.refreshLinks(),
          error: err => console.error('Failed to delete link', err)
        });
      }
    });
  }

  dropLink(event: CdkDragDrop<any[]>) {
    const sortedLinks = [...this.group.links].sort((a, b) => a.position - b.position);

    if (event.previousContainer === event.container) {
      moveItemInArray(sortedLinks, event.previousIndex, event.currentIndex);
    } else {
      const prevLinks = event.previousContainer.data as any[];
      prevLinks.splice(event.previousIndex, 1);
      sortedLinks.splice(event.currentIndex, 0, event.item.data);
    }

    sortedLinks.forEach((link, i) => link.position = i);
    this.group.links = sortedLinks;

    this.dropService.reorderLinks(sortedLinks.map(l => ({ id: l.id, position: l.position })))
      .subscribe({
        next: () => console.log('Link reorder saved'),
        error: err => console.error('Error saving link reorder', err)
      });
  }

  refreshLinks() {
    this.dropService.fetchCategories().subscribe({
      next: (data) => {
        const currentCategory = data.find(c => c.id === this.category.id);
        const currentGroup = currentCategory?.groups.find((g: { id: any; }) => g.id === this.group.id);
        if (currentGroup) {
          this.group.links = currentGroup.links;
        }
      },
      error: err => console.error('Failed to refresh links', err)
    });
  }
}
