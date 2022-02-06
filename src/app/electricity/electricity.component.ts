import {AfterContentInit, AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {DataServiceMock} from "../data-service-mock.service";
import {ChartViewComponent} from "../chart-view/chart-view.component";
import {zip} from "rxjs";
import { TimeFrame } from '../time-frame';

@Component({
  selector: 'app-electricity',
  templateUrl: './electricity.component.html',
  styleUrls: ['./electricity.component.css']
})
export class ElectricityComponent implements OnInit, AfterContentInit, AfterViewInit {

  @ViewChild(ChartViewComponent) private chartView!: ChartViewComponent;

  constructor(private dataService: DataServiceMock) {

  }

  error?: string;
  loading: boolean = true

  ngAfterViewInit(): void {

    this.chartView.colors = ['#71bad5', '#6799ec', '#ee80a6'];

    const day = "2021-11-07";
    let l1 = this.dataService.getDailyEmPower(day, 0);
    let l2 = this.dataService.getDailyEmPower(day, 1);
    let l3 = this.dataService.getDailyEmPower(day, 2);

    zip(l1, l2, l3).subscribe({
        next: value => this.chartView.setDataArray(value, TimeFrame.DAILY, true),
        error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
        complete: () => this.loading = false
      });
  }

  ngAfterContentInit() {
  }

  ngOnInit() {
  }

}
