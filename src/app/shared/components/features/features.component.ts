import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-features',
    templateUrl: './features.component.html',
    styleUrls: ['./features.component.scss']
})
export class FeaturesComponent implements OnInit {

    public featureData = [
        {
            id: 1,
            icon: 'fal fa-shipping-fast',
            title: 'Fast Delivery',
            subtitle: 'On-Time, Every Time.'
        },
        {
            id: 2,
            icon: 'fal fa-gift',
            title: 'Complete Satisfaction',
            subtitle: 'Satisfaction with every order.'
        },
        {
            id: 3,
            icon: 'fal fa-headset',
            title: 'Online Support 24/7',
            subtitle: '24/7 support for all your needs.'
        },
        {
            id: 4,
            icon: 'fal fa-hand-receiving',
            title: 'Easy Returns',
            subtitle: 'Valid on all orders'
        }
    ]

    constructor() { }

    ngOnInit(): void {
    }

}
