import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'vp',
  templateUrl: './vp.component.html',
  styleUrls: ['./vp.component.css'],
  imports: [CommonModule],
})
export class VPComponent {
  text = input.required<string>();
  size = input<string>('medium');
}
