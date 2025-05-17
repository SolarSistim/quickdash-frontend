import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { ListsService } from '../../features/lists/lists.service';
import { DialogEditListComponent } from '../../dialogs/dialog-edit-list/dialog-edit-list.component';

@Component({
  selector: 'app-ui-list',
  standalone: true,
  imports: [CommonModule, MatMenuModule],
  templateUrl: './ui-list.component.html',
  styleUrl: './ui-list.component.css',
})
export class UiListComponent {

  listItems: any[] = [];
  loading = true;

  @Input() showHandles = false;
  @Input() list!: any;
  @Output() openList = new EventEmitter<void>();
  @Output() listDeleted = new EventEmitter<void>();

  private listsService = inject(ListsService);
  private dialog = inject(MatDialog);

  open() {
    this.openList.emit();
  }

  openEditDialog() {
    const dialogRef = this.dialog.open(DialogEditListComponent, {
      width: '400px',
      data: { list: this.list }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.updatedName) {
        this.list.name = result.updatedName; // ✅ reflect new name immediately
      }
    });
  }

  confirmDelete() {
    if (confirm(`Are you sure you want to delete the list "${this.list.name}"?`)) {
      this.listsService.deleteList(this.list.id).subscribe({
        next: () => {
          this.listDeleted.emit();
          console.log('List delete emitted');
        },
        error: err => {
          console.error('❌ Failed to delete list:', err);
          alert('Something went wrong while deleting the list.');
        }
      });
    }
  }
}
