import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeTwoComponent } from './home-two/home-two.component';

const routes: Routes = [
  {
    path: '',
    component: HomeTwoComponent,
    title: 'Home',
  },
  {
    path: 'home-style-2',
    component: HomeTwoComponent,
    title: 'Home',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
