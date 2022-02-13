import {AfterContentInit, AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {DataServiceMock} from "../data-service-mock.service";
import {DataService, MeasurementData} from "../data-service.service";
import {ChartViewComponent} from "../chart-view/chart-view.component";
import { TimeFrame } from '../time-frame';

@Component({
  selector: 'app-inverter',
  templateUrl: './inverter.component.html',
  styleUrls: ['./inverter.component.css']
})
export class InverterComponent implements OnInit, AfterContentInit, AfterViewInit  {

  @ViewChild(ChartViewComponent) private chartView!: ChartViewComponent;

  constructor(private dataService: DataService) {

  }

  error?: string;
  loading: boolean = true

  savedOtherDate? = "2022-01";
  currentDate? = "2022-01-21";
  prevDate?: string;
  nextDate?: string;

  range: TimeFrame = TimeFrame.DAILY;

  ngAfterViewInit(): void {

    this.chartView.colors = ['#dada15'];

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
//    this.loading = true;

    const data = this.dataService.getInverter(this.range, date);
    data.subscribe({
      next: value => this.updateView(value),
      error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
      complete: () => this.loading = false
    });
  }

  private updateView(data?: MeasurementData) {
    if (data) {
      this.chartView.setData(data, this.range);
      this.currentDate = data.current;
      this.nextDate = data.next;
      this.prevDate = data.prev;
    }
  }
}
