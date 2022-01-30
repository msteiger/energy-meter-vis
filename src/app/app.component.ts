import { Component } from '@angular/core';
import { Router} from "@angular/router";
import { Location } from '@angular/common';
import { de } from 'date-fns/locale';
import { DateAdapter } from '@angular/material/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  links = [{
    id: 'inverter',
    name: 'Inverter'
  }, {
    id: 'heating',
    name: 'Heating'
  }, {
    id: 'electricity',
    name: 'Electricity'
  }];

  activeLink = this.links[0];

  constructor(
    private location: Location,
    private router: Router,
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
    const fromUrl = this.links.find(link => (this.location.path() === '/' + link.id));
    if (fromUrl) {
      this.activeLink = fromUrl;
    }
  }
}
