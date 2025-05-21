import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListsService } from '../../../features/lists/lists.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-completed-list-items',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './completed-list-items.component.html',
  styleUrls: ['./completed-list-items.component.css']
})
export class CompletedListItemsComponent implements OnInit {

  @Output() restoreAll = new EventEmitter<void>();
  @Input() listId!: number;
  @Input() styleSettings: any;
  @Output() itemRestored = new EventEmitter<any>();

  items: any[] = [];
  loading = true;

  constructor(private listsService: ListsService) {}

  ngOnInit(): void {
    if (!this.listId) return;
    this.listsService.getCompletedItems(this.listId).subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load completed items:', err);
        this.loading = false;
      }
    });
  }

restoreItem(item: any) {
  this.listsService.uncompleteItem(item.id).subscribe({
    next: (restored) => {
      this.itemRestored.emit(restored); // ✅ emit the fresh restored item
      this.items = this.items.filter(i => i.id !== item.id); // remove from view
    },
    error: (err) => {
      console.error('❌ Failed to restore item:', err);
      alert('Failed to restore item.');
    }
  });
}

restoreAllItems() {
  const itemsToRestore = [...this.items]; // clone to avoid mutation issues
  const restoreRequests = itemsToRestore.map(item =>
    this.listsService.uncompleteItem(item.id).toPromise()
  );

  Promise.all(restoreRequests)
    .then(restoredItems => {
      restoredItems.forEach(item => this.itemRestored.emit(item));
      this.items = [];
    })
    .catch(err => {
      console.error('❌ Failed to restore all items:', err);
      alert('Failed to restore all items.');
    });
}

restoreAllItemsFromChild() {
  this.restoreAll.emit();
}

}
