import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UtilsService } from 'src/app/shared/services/utils.service';
import { ProductService } from 'src/app/shared/services/product.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-search-popup',
  templateUrl: './search-popup.component.html',
  styleUrls: ['./search-popup.component.scss']
})
export class SearchPopupComponent implements OnInit {

  public searchText: string = '';
  public allData: IProduct[] = [];
  public searchResults: IProduct[] = [];

  constructor(
    public utilsService: UtilsService,
    private router: Router,
    private productService: ProductService
  ) { };

  ngOnInit(): void {
    // Fetch all products once when component initializes
    this.productService.getProductListFromAPI().subscribe({
      next: (products) => {
        this.allData = products;
      },
      error: (err) => {
        console.error('Error loading products for search:', err);
      }
    });
  }

  onSearch(searchTerm: string) {
    this.searchText = searchTerm;
    if (!searchTerm || searchTerm.length < 2) {
      this.searchResults = [];
      return;
    }

    const term = searchTerm.toLowerCase();
    this.searchResults = this.allData.filter(product => {
      const matchName = product.title.toLowerCase().includes(term);
      const matchCategory = product.category.toLowerCase().includes(term);
      return matchName || matchCategory;
    }).slice(0, 10); // Limit to 10 results
  }

  navigateToProduct(product: IProduct) {
    this.router.navigate(['/shop/product-details', product.id]);
    this.utilsService.handleSearchOpen(); // Close the search popup
    this.searchText = '';
    this.searchResults = [];
  }

  handleSearchSubmit() {
    const queryParams: { [key: string]: string | null } = {};
    if (!this.searchText) {
      return
    }
    else {
      queryParams['searchText'] = this.searchText.split(' ').join('-').toLowerCase();
      this.router.navigate(['/search'], { queryParams });
      this.utilsService.handleSearchOpen();
    }
  }
}
