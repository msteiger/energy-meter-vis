import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OverlayComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Input('text')
  text: string = '';
}
