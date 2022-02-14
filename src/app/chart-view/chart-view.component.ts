import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {BaseChartDirective } from "ng2-charts";
import {Chart, ChartConfiguration, ChartData, ChartType, Color, TimeScaleOptions, TimeUnit, Tooltip, TooltipItem} from "chart.js";
import {MeasurementData} from "../data-service.service";
import {LineHoverPlugin} from "./lineHoverPlugin";
import { TimeFrame } from '../time-frame';

@Component({
  selector: 'app-chart-view',
  templateUrl: './chart-view.component.html',
  styleUrls: ['./chart-view.component.css']
})
export class ChartViewComponent implements OnInit {

  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  public readonly chartOptions: ChartConfiguration['options'] | any = {
//    animation: false,
    animations: {
      x: {
        duration: 500,
        easing: "linear"
      },
      y: {
        duration: 0
      }
    },
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            day: 'd',
            hour: 'H:mm'
          },
          tooltipFormat:'HH:mm',
          unit: 'hour',
          stepSize: 1
        },
        stacked: false
      },
      y: {
        stacked: false
      }
    },
    interaction: {
      mode: 'x',
      intersect: false
    },
    plugins: {
      legend: {
        display: false,
      }
    }
  };

  chartPlugins = [];
  chartType: ChartType = 'line';
  chartData?: ChartData<'line'>;

  @Input('colors') colors = ['#20e020', '#f0e020', '#f04040'];

  private toleratedGapWidth = 0;

  private primaryAlpha: string = 'ff';
  private secondaryAlpha: string = 'b0';
  private borderColor: Color = '#A0A0A0'

  constructor() {
    // TODO: register only for this.chart
    Chart.register(new LineHoverPlugin());
  }

  ngOnInit(): void {
  }

  public setData(measurementData: MeasurementData, frame: TimeFrame) {
    this.setDataArray([measurementData], frame);
  }

  public setDataArray(measurementData: MeasurementData[], frame: TimeFrame, stacked?: boolean) {

    this.setTimeframe(frame);

    const minX = Math.min(...measurementData.map(obj => obj.start));
    const maxX = Math.max(...measurementData.map(obj => obj.end));

    const minY = Math.min(0, ...measurementData.map(obj => obj.desc.min));
    const maxY = Math.max(0, ...measurementData.map(obj => obj.desc.max));
    const sumY = measurementData.map(obj => obj.desc.max).reduce((a, b) => a + b, 0);

    const yScale = this.chartOptions!.scales!.y!;  // TODO: check why compiler complains
    const xScale = this.chartOptions!.scales!.x!;  // TODO: check why compiler complains

    // @ts-ignore
    yScale.stacked = stacked;  // TODO: check why needs to be forced
    yScale.min = minY;
    yScale.max = (stacked) ? sumY : maxY;

    xScale.min = minX;
    xScale.max = maxX;

    this.chartData = {
      datasets: []
    }

    for (const [idx, item] of measurementData.entries()) {
      this.chartData.datasets.push(
      {
          fill: (idx == 0) ? 'origin' : '-1',
          label: item.desc.name,
          data: item.data,
          spanGaps: this.toleratedGapWidth,
          borderWidth: 2,
          pointBorderWidth: 1,
          pointBorderColor: this.borderColor,
          pointBackgroundColor: this.colors[idx] + this.primaryAlpha,
          hoverBorderColor: this.borderColor,
          borderColor: this.colors[idx] + this.primaryAlpha,
          backgroundColor: this.colors[idx] + this.secondaryAlpha,
          hoverBackgroundColor: this.colors[idx] + this.primaryAlpha,
          tension: 0.5
      });
    }
  }

  public setTimeframe(frame: TimeFrame) {
    let unit;
    let tooltipFormat;

    switch (frame) {
      case TimeFrame.DAILY:
        unit = "hour"
        tooltipFormat = 'HH:mm'
        this.toleratedGapWidth = 900000;
        break;
      case TimeFrame.MONTHLY:
        unit = "day"
        tooltipFormat = 'yyyy-MM-dd'
        this.toleratedGapWidth = 24 * 60 * 60 * 1000;
        break;
    }

    const xScale = this.chartOptions?.scales?.x;

    xScale.time.unit = unit;
    xScale.time.tooltipFormat = tooltipFormat;
  }
}
