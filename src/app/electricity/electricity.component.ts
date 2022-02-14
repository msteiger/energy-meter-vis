import {AfterContentInit, AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../data-service.service";
import {ChartViewComponent} from "../chart-view/chart-view.component";
import {zip} from "rxjs";
import { TimeFrame } from '../time-frame';

@Component({
  selector: 'app-electricity',
  templateUrl: './electricity.component.html',
  styleUrls: ['./electricity.component.css']
})
export class ElectricityComponent implements OnInit, AfterContentInit, AfterViewInit {

  @ViewChild('electricChart') private chartView!: ChartViewComponent;

  constructor(private dataService: DataService) {

  }

  error?: string;
  loading: boolean = true
  electricColors = ['#dada15', '#71bad5', '#6799ec', '#ee80a6'];

  ngAfterViewInit(): void {

    const day = "2022-02-07";
    let lOut = this.dataService.getEmPowerOut(TimeFrame.DAILY, day);
    let lIn = this.dataService.getEmPowerIn(TimeFrame.DAILY, day);

    zip(lOut, lIn).subscribe({
        next: value => this.chartView.setDataArray(value, TimeFrame.DAILY, false),
        error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
        complete: () => this.loading = false
      });
  }

  ngAfterContentInit() {
  }

  ngOnInit() {
  }

}
