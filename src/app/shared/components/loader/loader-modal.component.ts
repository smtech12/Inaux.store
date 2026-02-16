import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loader-modal',
  templateUrl: './loader-modal.component.html',
  styleUrls: ['./loader-modal.component.scss']
})
export class LoaderModalComponent implements OnInit, OnDestroy {
  public isLoading: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(private loaderService: LoaderService) { }

  ngOnInit(): void {
    this.subscription = this.loaderService.loading$.subscribe(
      (loading: boolean) => {
        this.isLoading = loading;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

