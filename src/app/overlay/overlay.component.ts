import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ChartViewComponent } from '../chart-view/chart-view.component';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
})
export class OverlayComponent implements OnInit, AfterViewInit {

  @Input('target')
  target!: ElementRef<ChartViewComponent>;



  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const rect = this.target;
    console.log("TARGET: " + JSON.stringify(rect));
  }

}
