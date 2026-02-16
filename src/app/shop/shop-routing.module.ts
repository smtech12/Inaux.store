import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShopComponent } from './pages/shop/shop.component';
import { ShopRightSidebarComponent } from './pages/shop-right-sidebar/shop-right-sidebar.component';
import { ShopFourColComponent } from './pages/shop-four-col/shop-four-col.component';
import { ShopThreeColComponent } from './pages/shop-three-col/shop-three-col.component';
import { ShopDetailsComponent } from './pages/shop-details/shop-details.component';
import { DynamicShopDetailsComponent } from './pages/dynamic-shop-details/dynamic-shop-details.component';
import { CartComponent } from './pages/cart/cart.component';
import { WishlistComponent } from './pages/wishlist/wishlist.component';
import { CompareComponent } from './pages/compare/compare.component';
import { SearchComponent } from './pages/search/search.component';
import { AccountComponent } from '../pages/account/account.component';



const routes: Routes = [
  {
    path: 'shop',
    component: ShopComponent,
    title: 'Shop'
  },
  {
    path: 'shop-right',
    component: ShopRightSidebarComponent,
    title: 'Shop Right Page'
  },
  {
    path: 'shop-4-col',
    component: ShopFourColComponent,
    title: 'Shop Four Col Page'
  },
  {
    path: 'shop-3-col',
    component: ShopThreeColComponent,
    title: 'Shop Three Col Page'
  },
  {
    path: 'shop/product-details',
    component: ShopDetailsComponent,
    title: 'Shop Details Page'
  },
  {
    path: 'shop/product-details/:id',
    component: DynamicShopDetailsComponent,
    title: 'Shop Details'
  },
  {
    path: 'cart',
    component: CartComponent,
    title: 'Shop Cart'
  },
  {
    path: 'wishlist',
    component: WishlistComponent,
    title: 'Shop Wishlist'
  },
  {
    path: 'compare',
    component: CompareComponent,
    title: 'Shop Compare'
  },
  {
    path: 'search',
    component: SearchComponent,
    title: 'Shop Search'
  },
  {
    path: 'account',
    component: AccountComponent,
    title: 'My Profile'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShopRoutingModule { }
