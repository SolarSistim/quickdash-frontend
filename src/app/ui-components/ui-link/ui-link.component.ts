import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { DialogEditSingleLinkComponent } from '../../dialogs/dialog-edit-single-link/dialog-edit-single-link.component';
import { DialogManageLinksComponent } from '../../dialogs/dialog-manage-links/dialog-manage-links.component';
import { DialogAddLinkComponent } from '../../dialogs/dialog-add-link/dialog-add-link.component';
import { DialogConfirmComponent } from '../../dialogs/dialog-confirm/dialog-confirm.component';
import { DashboardDropService } from '../../features/dashboard-drop/dashboard-drop.service';
import { SettingsService } from '../../settings-components/app-settings/settings.service';

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
  @Input() refreshTrigger: any;
  @Output() linkMoved = new EventEmitter<{ movedLinkId: number, newGroupId: number, oldGroupId: number }>();

  private saveTimer: any = null;
  private lastSavedPositions: string = '';

  readonly defaultIconUrl = '../../../assets/icons/trakt.png';

  constructor(private dialog: MatDialog, private dropService: DashboardDropService, private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.settingsService.loadSettings().subscribe(settings => {
      const bgHex = settings['LINK_BACKGROUND_COLOR'] || '#000000';
      const opacity = parseFloat(settings['LINK_BACKGROUND_OPACITY'] || '0.2');
      const r = parseInt(bgHex.substring(1, 3), 16);
      const g = parseInt(bgHex.substring(3, 5), 16);
      const b = parseInt(bgHex.substring(5, 7), 16);
      this.linkStyles.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  
      this.linkStyles.fontColor = settings['LINK_FONT_COLOR'] || '#ff0000';
      this.linkStyles.fontWeight = settings['LINK_FONT_WEIGHT'] || '400';
      this.linkStyles.fontSize = parseInt(settings['LINK_FONT_SIZE'] || '13', 10);
    });
    this.loadStyles();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger']) {
      this.loadStyles(); // 👈 repeat settings fetch
    }
  }

  private loadStyles(): void {
    this.settingsService.loadSettings().subscribe(settings => {
      const bgHex = settings['LINK_BACKGROUND_COLOR'] || '#000000';
      const opacity = parseFloat(settings['LINK_BACKGROUND_OPACITY'] || '0.2');
      const r = parseInt(bgHex.substring(1, 3), 16);
      const g = parseInt(bgHex.substring(3, 5), 16);
      const b = parseInt(bgHex.substring(5, 7), 16);
      this.linkStyles.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

      this.linkStyles.fontColor = settings['LINK_FONT_COLOR'] || '#ff0000';
      this.linkStyles.fontWeight = settings['LINK_FONT_WEIGHT'] || '400';
      this.linkStyles.fontSize = parseInt(settings['LINK_FONT_SIZE'] || '13', 10);
    });
  }

  linkStyles: {
    backgroundColor: string;
    fontColor: string;
    fontWeight: string;
    fontSize: number; // ✅ fix this
  } = {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    fontColor: '#ff0000',
    fontWeight: '400',
    fontSize: 13 // ✅ and this must match (number, not '13px')
  };

  trackById(index: number, item: any): number {
    return item.id;
  }

  getSortedLinks(): any[] {
    return [...this.group.links].sort((a, b) => a.position - b.position);
  }

  getConnectedDropLists(category: any): string[] {
    return category.groups.map((group: any) => `group-list-${group.id}`);
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

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '/assets/icons/default.png';
  }

  handleAuxClick(event: MouseEvent, url: string): void {
    if (event.button === 1) { // Middle mouse button
      event.preventDefault(); // Important to prevent default middle-click behavior inside div
      
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
  
  onAnchorClick(event: MouseEvent): void {
    if (event.button === 0) {
      event.preventDefault(); // optional: prevents default left-click nav
      this.openLink((event.currentTarget as HTMLAnchorElement).href);
    }
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
    const movedLink = event.item.data;
  
    if (event.previousContainer === event.container) {
      // 🔥 Move inside same group
      moveItemInArray(this.group.links, event.previousIndex, event.currentIndex);
  
      // 🔥 Fix local positions
      this.group.links.forEach((link: any, index: number) => {
        link.position = index;
      });
  
      // 🔥 Queue save
      this.queueReorderSave();
    } else {
      // 🔥 Move across groups
      const oldGroupLinks = event.previousContainer.data as any[];
      const indexInOldGroup = oldGroupLinks.findIndex(link => link.id === movedLink.id);
      if (indexInOldGroup > -1) {
        oldGroupLinks.splice(indexInOldGroup, 1);
      }
  
      this.group.links.splice(event.currentIndex, 0, movedLink);
  
      // 🔥 🔥 🔥 IMPORTANT: Fix *both* old and new group link positions
      oldGroupLinks.forEach((link: any, index: number) => {
        link.position = index;
      });
      this.group.links.forEach((link: any, index: number) => {
        link.position = index;
      });
  
      // Now emit move
      this.linkMoved.emit({
        movedLinkId: movedLink.id,
        newGroupId: this.group.id,
        oldGroupId: Number(event.previousContainer.id.split('group-list-')[1])
      });
    }
  }
  
  
  queueReorderSave() {
    // 🔥 Clear any previous pending save
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
  
    // 🔥 Set a new timer (wait 300ms after last move)
    this.saveTimer = setTimeout(() => {
      this.commitReorder();
    }, 300); // You can tweak this value (200–500ms is typical)
  }
  
  commitReorder() {
    const reorderedLinks = this.group.links.map((link: any, index: number) => ({
      id: link.id,
      position: index
    }));
  
    const newPositions = JSON.stringify(reorderedLinks);
  
    // 🔥 Dirty check: only save if something actually changed
    if (newPositions !== this.lastSavedPositions) {
      this.lastSavedPositions = newPositions;
  
      this.dropService.reorderLinks(reorderedLinks).subscribe({
        next: () => console.log('Links saved to server successfully'),
        error: (err) => console.error('Failed to reorder links', err)
      });
    } else {
      console.log('No changes detected, skipping save.');
    }
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
