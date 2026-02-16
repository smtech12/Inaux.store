import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from '../shared/shared.module';
import { HomeTwoComponent } from './home-two/home-two.component';
import { ShopModule } from '../shop/shop.module';


@NgModule({
  declarations: [
    HomeTwoComponent,
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    SharedModule,
    ShopModule, 
  ]
})
export class HomeModule { }
