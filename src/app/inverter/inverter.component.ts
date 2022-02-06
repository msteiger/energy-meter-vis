import {AfterContentInit, AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {DataServiceMock} from "../data-service-mock.service";
import {DataService, MeasurementData} from "../data-service.service";
import {ChartViewComponent, TimeFrame} from "../chart-view/chart-view.component";

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
  currentDate = "2021-10-11";
  prevDate: any;
  nextDate: any;

  ngAfterViewInit(): void {

    this.chartView.colors = ['#dada15'];

    this.gotoDate(0, this.currentDate);
  }

  ngAfterContentInit() {
  }

  ngOnInit() {
  }

  pickRange(range: string) {
    console.log("Range: " + range);
  }

  gotoDate(delta: number, day?: string) {
    if (!day) {
      return;
    }

//    this.loading = true;

    const data = this.dataService.getDailyInverter(day);
    data.subscribe({
      next: value => this.updateView(value),
      error: error => this.error = error.statusText + " (" + error.status + ") - " + error.error,
      complete: () => this.loading = false
    });
  }

  private updateView(data?: MeasurementData) {
    if (data) {
      this.chartView.setData(data, TimeFrame.DAILY);
      this.currentDate = data.current;
      this.nextDate = data.next;
      this.prevDate = data.prev;
    }
  }
}
