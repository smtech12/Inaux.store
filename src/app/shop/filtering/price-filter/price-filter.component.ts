import { ActivatedRoute, Router } from '@angular/router';
import {Component,Output,Input,EventEmitter,Inject,PLATFORM_ID,OnChanges,SimpleChanges} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Options } from '@angular-slider/ngx-slider';
import { ViewportScroller } from '@angular/common';
import { ProductService } from 'src/app/shared/services/product.service';

@Component({
  selector: 'app-price-filter',
  templateUrl: './price-filter.component.html',
  styleUrls: ['./price-filter.component.scss']
})
export class PriceFilterComponent implements OnChanges {
   // Using Output EventEmitter
   @Output() priceFilter: EventEmitter<any> = new EventEmitter<any>();

   // define min, max and range
   @Input() min!: number;
   @Input() max!: number;

   public collapse: boolean = true;
   public isBrowser: boolean = false;

   public price: { minPrice: number; maxPrice: number } = {
     minPrice: 0,
     maxPrice: 0,
   };

   options: Options = {
     floor: 0,
     ceil: 0,
     hidePointerLabels: true,
   };

   constructor(
     @Inject(PLATFORM_ID) private platformId: Object,
     public productService: ProductService,
     private route: ActivatedRoute,
     private router: Router,
     private viewScroller: ViewportScroller,
   ) {
     if (isPlatformBrowser(this.platformId)) {
       this.isBrowser = true; // for ssr
     }
   }

   ngOnInit(): void {
     // Initialize with input values
     if (this.min !== undefined && this.max !== undefined) {
       this.updatePriceAndOptions();
     }
   }

   ngOnChanges(changes: SimpleChanges): void {
     // Update when min or max inputs change
     if (changes['min'] || changes['max']) {
       if (this.min !== undefined && this.max !== undefined) {
         this.updatePriceAndOptions();
       }
     }
   }

   private updatePriceAndOptions(): void {
     // Update price object
     this.price = {
       minPrice: this.min || 0,
       maxPrice: this.max || 0,
     };

     // Update slider options
     this.options = {
       ...this.options,
       floor: this.min || 0,
       ceil: this.max || 0,
     };
   }

   // Range Changed
   appliedFilter(event: any) {
     this.price = { minPrice: event.value, maxPrice: event.highValue };
     this.priceFilter.emit(this.price);
   }

    // handle price filtering
    handlePriceRoute () {
     this.router
       .navigate([], {
         relativeTo: this.route,
         queryParams: this.price,
         queryParamsHandling: 'merge', // preserve the existing query params in the route
         skipLocationChange: false, // do trigger navigation
       })
       .finally(() => {
         this.viewScroller.setOffset([120, 120]);
         this.viewScroller.scrollToAnchor('products')
       });
   }
}
