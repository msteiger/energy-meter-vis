import { Component } from '@angular/core';
import { Router} from "@angular/router";
import { Location } from '@angular/common';

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
    private router: Router) {
  }

  ngOnInit(): void {
    const fromUrl = this.links.find(link => (this.location.path() === '/' + link.id));
    if (fromUrl) {
      this.activeLink = fromUrl;
    }
  }
}
