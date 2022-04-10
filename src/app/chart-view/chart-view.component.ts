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
      return (ctx.element.x) + ctx.chart.chartArea.width * this.slideDirection;
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
            return tooltipItem.dataset.label + ": " + tooltipItem.parsed.y.toFixed(1);
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

  public clearData(delta: number) {
    this.slideDirection = Math.sign(delta);
    this.chart.update('hide');
  }

  public setDataArray(measurementData: MeasurementData[], frame: TimeFrame, delta: number, stack?: string[]) {

    this.setTimeframe(frame);
    this.slideDirection = delta;

    const minX = Math.min(...measurementData.map(obj => obj.start));
    const maxX = Math.max(...measurementData.map(obj => obj.end));

    const minY = Math.min(0, ...measurementData.map(obj => obj.desc.min));
    const maxY = Math.max(0, ...measurementData.map(obj => obj.desc.max));
    const sumY = measurementData.map(obj => obj.desc.max).reduce((a, b) => a + b, 0);

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
    yScale.max = (stack) ? sumY : maxY;

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
          spanGaps: this.toleratedGapWidth,
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

    if (this.overlayData) {
      datasets.push(this.overlayData);
    }

    this.chartData = {
      datasets: datasets
    }
  }

  public setTimeframe(frame: TimeFrame) {
    let unit: TimeUnit;
    let tooltipFormat;

    switch (frame) {
      case TimeFrame.HOURLY:
        unit = "minute"
        tooltipFormat = 'HH:mm'
        this.toleratedGapWidth = 2 * 60 * 1000; // tolerate 1 missing entry
        break;
      case TimeFrame.DAILY:
        unit = "hour"
        tooltipFormat = 'HH:mm'
        this.toleratedGapWidth = 15 * 60 * 1000;
        break;
      case TimeFrame.MONTHLY:
        unit = "day"
        tooltipFormat = 'yyyy-MM-dd'
        this.toleratedGapWidth = 24 * 60 * 60 * 1000;
        break;
    }

    const xScale: TimeScaleOptions = this.chartOptions!.scales!.x as TimeScaleOptions;

    xScale.time.unit = unit;
    xScale.time.tooltipFormat = tooltipFormat;
  }

  public setOverlayData(data: Measurement[], label: string) {
    if (!data) {
      this.overlayData = undefined;
    }

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
    this.chart.update();
  }
}
