import {AfterContentInit, AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';

import 'chartjs-adapter-date-fns';
import {DataServiceMock} from "../data-service-mock.service";
import {MeasurementData} from "../data-service.service"
import {ChartViewComponent, TimeFrame} from "../chart-view/chart-view.component";

@Component({
  selector: 'app-heating',
  templateUrl: './heating.component.html',
  styleUrls: ['./heating.component.css']
})
export class HeatingComponent implements OnInit, AfterContentInit {

  @ViewChild(ChartViewComponent) private chartView!: ChartViewComponent;

  constructor(private dataService: DataServiceMock) {

  }

  ngAfterContentInit(): void {
  
  }

  error?: string;
  loading: boolean = true

  ngAfterViewInit(): void {

    this.chartView.colors = ['#712133'];

    const day = "2021-11-07";
    let l1 = this.dataService.getMonthlyTemperature("2021-11");
    
    l1.subscribe({
        next: value => this.chartView.setData(value, TimeFrame.MONTHLY),
        error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
        complete: () => this.loading = false
      });
  }

  
  ngOnInit(): void {
  }
}
