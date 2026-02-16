import { Component, Input, OnInit } from '@angular/core';
import { IProduct } from 'src/app/shared/types/product-d-t';
import { ProductService } from 'src/app/shared/services/product.service';
import { ProductDetailDTO, ProductAttributeDTO } from 'src/app/shared/types/product-detail-model';

@Component({
  selector: 'app-product-details-area',
  templateUrl: './product-details-area.component.html',
  styleUrls: ['./product-details-area.component.scss']
})
export class ProductDetailsAreaComponent implements OnInit {
  @Input() product: IProduct | undefined;
  public productAttributes: ProductAttributeDTO[] = [];
  public stars: number[] = [1, 2, 3, 4, 5];
  public defaultImage = '/assets/img/user.jpg';

  constructor(private productService: ProductService) { }

  ngOnInit() {
    this.sanitizeProductDescription();
    // Get the product detail DTO to access attributes
    const productDetailDTO = this.productService.getCurrentProductDetailDTO();
    if (productDetailDTO && productDetailDTO.attributes) {
      this.productAttributes = productDetailDTO.attributes;
    }
  }

  private sanitizeProductDescription() {
    if (this.product) {
      if (this.product.sm_desc) {
        this.product.sm_desc = this.product.sm_desc.replace(/&nbsp;/g, ' ');
      }
      if (this.product.details) {
        if (this.product.details.details_text) {
          this.product.details.details_text = this.product.details.details_text.replace(/&nbsp;/g, ' ');
        }
        if (this.product.details.details_text_2) {
          this.product.details.details_text_2 = this.product.details.details_text_2.replace(/&nbsp;/g, ' ');
        }
        if (this.product.details.details_list && Array.isArray(this.product.details.details_list)) {
          this.product.details.details_list = this.product.details.details_list.map(item => item.replace(/&nbsp;/g, ' '));
        }
      }
    }
  }

  /**
   * Get attribute values as comma-separated string
   */
  getAttributeValues(attribute: ProductAttributeDTO): string {
    return attribute.attributeValues ? attribute.attributeValues.join(', ') : '';
  }
}
