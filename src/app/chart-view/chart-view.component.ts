import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {BaseChartDirective } from "ng2-charts";
import {Chart, ChartConfiguration, ChartData, ChartDataset, ChartType, Color, ScriptableContext, Tick, TimeScaleOptions, TimeUnit, TooltipItem} from "chart.js";
import {Measurement, MeasurementData} from "../data-service.service";
import {LineHoverPlugin} from "./lineHoverPlugin";
import { TimeFrame } from '../time-frame';

@Component({
  selector: 'app-chart-view',
  templateUrl: './chart-view.component.html',
  styleUrls: ['./chart-view.component.scss']
})
export class ChartViewComponent implements OnInit {

  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  slidePosFunc = (ctx: ScriptableContext<'line'> | any) => {
    if (ctx.type === 'data') {
      return (ctx.element.x) + (ctx.chart.chartArea.width + 10) * this.slideDirection;  // add 10px to ensure the last point is also outside
    }
    return undefined;
  };

  public readonly chartOptions: ChartConfiguration['options'] = {
    animations: {
      y: {
        duration: 0
      },
      colors: false
    },
    transitions: {
      'hide': {
        animations: {
          x: {
            duration: 750,
            easing: "easeInQuart",
            to: this.slidePosFunc
          }
        }
      },
      'default': {
        animations: {
          x: {
            duration: 750,
            easing: "easeOutQuart",
            from: this.slidePosFunc
          }
        }
      },

    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            day: 'd',
            hour: 'H:mm',
            minute: 'H:mm'
          },
          tooltipFormat:'HH:mm',
          unit: 'hour',
          stepSize: 1
        },
        stacked: false
      },
      y: {
        ticks: {
          callback: function(tickValue: string | number, index: number, ticks: Tick[]): string {
              return '' + tickValue;  // no formatting
          }
        },
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
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem: TooltipItem<'line'>) : string {
            // override default rendering of float numbers
            return tooltipItem.dataset.label + ": " + Math.abs(tooltipItem.parsed.y).toFixed(1);
          }
        }
      }
    }
  };

  chartPlugins = [];
  chartType: ChartType = 'line';
  chartData: ChartData<'line'> = { datasets: [] };
  overlayData?: ChartDataset<'line'>;

  @Input('colors') colors = ['#20e020', '#f0e020', '#f04040'];

  private slideDirection = 0;

  private primaryAlpha: string = 'ff';
  private secondaryAlpha: string = 'b0';
  private borderColor: Color = '#A0A0A0'

  constructor() {
    // TODO: register only for this.chart
    Chart.register(new LineHoverPlugin());
  }

  ngOnInit(): void {
  }

  public clearData(delta: number) {
    this.slideDirection = Math.sign(delta);
    this.chart.update('hide');
  }

  public setDataArray(measurementData: MeasurementData[], frame: TimeFrame, delta: number, stack?: string[]) {

    this.setTimeframeScale(frame);
    this.slideDirection = delta;

    const minX = Math.min(...measurementData.map(obj => obj.start));
    const maxX = Math.max(...measurementData.map(obj => obj.end));

    const minY = Math.min(0, ...measurementData.map(obj => obj.desc.min));
    const maxY = Math.max(0, ...measurementData.map(obj => obj.desc.max));

    const yScale = this.chartOptions!.scales!.y!;  // TODO: check why compiler complains
    const xScale = this.chartOptions!.scales!.x!;  // TODO: check why compiler complains

    if (maxY < 1000) {
      // TODO: fix this properly by measuring the text width of the y-axis tick labels
      yScale.ticks = { padding: 10 };
    }

    for (const set of measurementData.values()) {
      if (set.data.length > 0 && set.data[0].x > minX) {
        // insert a fake measurement to make the chart start at the left border
        const fake: Measurement = {
          x: minX,
          y: set.data[0].y,
          measurements: 0
        };
        set.data.splice(0, 0, fake);
      }
    }

    // @ts-ignore
    yScale.stacked = stack;  // TODO: check why needs to be forced
    yScale.min = minY;
    yScale.max = (stack) ? this.computeMaxY(measurementData, stack) : maxY;

    xScale.min = minX;
    xScale.max = maxX;

    const datasets =  [];

    for (const [idx, item] of measurementData.entries()) {
      let sameStack;
      if (stack) {
        sameStack = idx > 0 ? stack[idx - 1] === stack[idx] : false;
      } else {
        sameStack = idx > 0;
      }
      datasets.push(
      {
          fill: sameStack ? '-1' : 'origin',
          stack: stack ? stack[idx] : undefined,
          label: item.desc.name,
          data: item.data,
          spanGaps: item.maxGapWidth ? item.maxGapWidth : this.getGapWidth(frame),
          pointRadius: 2,
          borderWidth: 2,
          pointBorderWidth: 1,
          pointBorderColor: this.borderColor,
          pointBackgroundColor: this.colors[idx] + this.primaryAlpha,
          hoverBorderColor: this.borderColor,
          borderColor: this.colors[idx] + this.primaryAlpha,
          backgroundColor: this.colors[idx] + this.secondaryAlpha,
          hoverBackgroundColor: this.colors[idx] + this.primaryAlpha,
          tension: 0.2
      });
    }

    this.overlayData = undefined;

    this.chartData = {
      datasets: datasets
    }
  }

  public getGapWidth(frame: TimeFrame): number {
    switch (frame) {
      case TimeFrame.HOURLY:
        return 3 * 60 * 1000;  // max two missing frames are tolerated
      case TimeFrame.DAILY:
        return 15 * 60 * 1000;
      case TimeFrame.MONTHLY:
        return 24 * 60 * 60 * 1000;
    }
  }

  public setTimeframeScale(frame: TimeFrame) {
    let unit: TimeUnit;
    let tooltipFormat;

    switch (frame) {
      case TimeFrame.HOURLY:
        unit = "minute"
        tooltipFormat = 'HH:mm'
        break;
      case TimeFrame.DAILY:
        unit = "hour"
        tooltipFormat = 'HH:mm'
        break;
      case TimeFrame.MONTHLY:
        unit = "day"
        tooltipFormat = 'yyyy-MM-dd'
        break;
    }

    const xScale: TimeScaleOptions = this.chartOptions!.scales!.x as TimeScaleOptions;

    xScale.time.unit = unit;
    xScale.time.tooltipFormat = tooltipFormat;
  }

  public setOverlayData(data: Measurement[], label: string) {
    this.overlayData = {
      fill: false,
      stack: 'overlays',
      label: label,
      data: data,
      borderWidth: 1,
      pointRadius: 0,
      borderColor: "black",
      tension: 0.2
    }

    this.chartData.datasets.splice(0, 0, this.overlayData);
    this.chart.update('silent');
  }

  private computeMaxY(measurementData: MeasurementData[], stack: string[]): number {
    const sums = new Map<string, number>();
    for (const [idx, item] of measurementData.entries()) {
      const name = stack[idx];
      const newVal = item.desc.max + (sums.get(name) ?? 0);
      sums.set(name, newVal);
    }

    const array = Array.from(sums.values());
    return Math.max(...array);

//    const sumY = measurementData.map(obj => obj.desc.max).reduce((a, b) => a + b, 0);
  }
}
