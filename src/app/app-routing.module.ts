import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {InverterComponent} from "./inverter/inverter.component";

const routes: Routes = [
  { path: 'dashboard', component:  InverterComponent},
  { path: '**', redirectTo: '/dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
