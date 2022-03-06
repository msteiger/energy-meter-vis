import { Component } from '@angular/core';
import { de } from 'date-fns/locale';
import { DateAdapter } from '@angular/material/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    private dateAdapter: DateAdapter<Date, Locale>) {
      // it should be possible to set the defaults like this:
      // providers: [
      // {
      //   provide: DateAdapter,
      //   useClass: DateFnsAdapter, deps: [MAT_DATE_LOCALE],
      // },
      // {
      //   provide: MAT_DATE_LOCALE,
      //   useValue: 'de'
      // }, {
      //   provide: MAT_DATE_FORMATS,
      //   useValue: MAT_DATE_FNS_FORMATS
      // }],
      // but it does not work / seems to be unneccessary

      dateAdapter.setLocale(de);
  }

  ngOnInit(): void {
  }
}
