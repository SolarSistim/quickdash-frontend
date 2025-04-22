// ui-link-group.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ui-link-group',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule],
  templateUrl: './ui-link-group.component.html',
  styleUrl: './ui-link-group.component.css'
})
export class UiLinkGroupComponent {
  @Input() group: any;
  @Input() categoryId!: number;

  @Input() selectedLink: any;
  @Input() selectedMoveCategory: any;

  @Output() addLink = new EventEmitter<number>();
  @Output() editGroup = new EventEmitter<{ categoryId: number; groupId: number; showGroupEditor?: boolean }>();
  @Output() deleteGroup = new EventEmitter<number>();
  @Output() editLink = new EventEmitter<number>();
  @Output() deleteLink = new EventEmitter<number>();
  @Output() moveLink = new EventEmitter<{ linkId: number, groupId: number }>();
  @Output() setSelectedLink = new EventEmitter<any>();
  @Output() resetMoveCategory = new EventEmitter<void>();
  @Input() sharedMoveMenu: any;

  trackByLinkId(index: number, link: any): number {
    return link.id;
  }
}
