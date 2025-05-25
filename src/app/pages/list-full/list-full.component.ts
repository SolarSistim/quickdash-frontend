import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common'; // ✅ import this
import { UiListEmbedComponent } from '../../ui-components/ui-list-embed/ui-list-embed.component';

@Component({
  selector: 'app-list-full',
  standalone: true,
  imports: [CommonModule, UiListEmbedComponent], // ✅ include CommonModule
  templateUrl: './list-full.component.html',
  styleUrl: './list-full.component.css'
})
export class ListFullComponent implements OnInit {
  listId!: number;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.listId = idParam ? +idParam : 0;
    });
  }
}
