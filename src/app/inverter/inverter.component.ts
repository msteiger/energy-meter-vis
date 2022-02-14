import {AfterContentInit, AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {DataServiceMock} from "../data-service-mock.service";
import {DataService, MeasurementData} from "../data-service.service";
import {ChartViewComponent} from "../chart-view/chart-view.component";
import { TimeFrame } from '../time-frame';
import {zip} from "rxjs";

@Component({
  selector: 'app-inverter',
  templateUrl: './inverter.component.html',
  styleUrls: ['./inverter.component.css']
})
export class InverterComponent implements OnInit, AfterContentInit, AfterViewInit  {

  @ViewChild('inverterChart') private inverterChartView!: ChartViewComponent;
  @ViewChild('electricChart') private electricChartView!: ChartViewComponent;

  constructor(private dataService: DataService) {

  }

  error?: string;
  loading: boolean = true

  savedOtherDate? = "2022-02";
  currentDate? = "2022-02-13";
  prevDate?: string;
  nextDate?: string;

  range: TimeFrame = TimeFrame.DAILY;

  electricColors = ['#dada15', '#71bad5', '#6799ec', '#ee80a6'];
  inverterColors = ['#dada15'];

  ngAfterViewInit(): void {
    this.gotoDate(0, this.currentDate);
  }

  ngAfterContentInit() {
  }

  ngOnInit() {
  }

  pickRange(range: TimeFrame) {
    if (range === this.range) {
      return;
    }

    this.range = range;
    
    const tmp = this.savedOtherDate;
    this.savedOtherDate = this.currentDate;
    this.currentDate = tmp;

    this.gotoDate(0, this.currentDate);
  }

  gotoDate(delta: number, date?: string) {
    this.loadInverterData(date);
    this.loadElectricData(date);
  }

  private loadInverterData(date?: string) {
//    this.loading = true;

    const invData$ = this.dataService.getInverter(this.range, date);
    invData$.subscribe({
      next: value => this.updateView(value),
      error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
      complete: () => this.loading = false
    });
  }

  private loadElectricData(date?: string) {
    let lOut$ = this.dataService.getEmPowerOut(this.range, date);
    let l1$ = this.dataService.getEmPowerIn(this.range, date, 1);
    let l2$ = this.dataService.getEmPowerIn(this.range, date, 2);
    let l3$ = this.dataService.getEmPowerIn(this.range, date, 3);
    
    zip(lOut$, l1$, l2$, l3$).subscribe({
        next: value => this.electricChartView.setDataArray(value, this.range, ['out', 'in', 'in', 'in']),
        error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
        complete: () => this.loading = false
      });
  }

  private updateView(data?: MeasurementData) {
    if (data) {
      this.inverterChartView.setData(data, this.range);
      this.currentDate = data.current;
      this.nextDate = data.next;
      this.prevDate = data.prev;
    }
  }
}
