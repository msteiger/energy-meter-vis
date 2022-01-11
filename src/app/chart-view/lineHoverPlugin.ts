import {Chart, ChartComponent, Plugin} from "chart.js";

export class LineHoverPlugin implements Plugin<'line'> {

  public id =  "line-hover";

  afterDatasetsDraw(chart: Chart) {

    if (chart.config.type === 'line' && chart.tooltip) {
      const tooltip = chart.tooltip;
      if (tooltip.getActiveElements().length > 0) {
        const ctx = chart.ctx;
        const x = tooltip.caretX;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, chart.chartArea.top);
        ctx.lineTo(x, chart.chartArea.bottom);
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#808080';
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
