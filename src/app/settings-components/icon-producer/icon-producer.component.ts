import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-icon-producer',
  imports: [CommonModule,MatCardModule,MatButtonModule],
  templateUrl: './icon-producer.component.html',
  styleUrl: './icon-producer.component.css'
})
export class IconProducerComponent {

}
