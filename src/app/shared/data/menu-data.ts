import { IMenuType, IMobileMenu } from "../types/menu-d-t";

const menuData: IMenuType[] = [
  {
    link: '/home',
    title: 'Home',
    // hasDropdown: true,
    // megamenu: false,
    // dropdownItems: [
    //   // { link: '/home/home-style-1', title: 'Home Style 1' },
    //   { link: '/home', title: 'Home Style 2' },
    //   // { link: '/home/home-style-3', title: 'Home Style 3' },
    //   // { link: '/home/home-style-4', title: 'Home Style 4' },
    //   // { link: '/home/home-style-5', title: 'Home Style 5' },
    //   // { link: '/home/home-style-6', title: 'Home Style 6' },
    //   // { link: '/home/home-style-7', title: 'Home Style 7' },
    // ]
  },
  {
    link: '/shop',
    title: 'Shop',
    // hasDropdown: true,
    // megamenu: true,
    // dropdownItems: [
    //   {
    //     link: '/shop',
    //     title: 'Shop Pages',
    //     dropdownMenu: [
    //       { link: '/shop', title: 'Standard Shop Page' },
    //       // { link: '/shop/shop-right', title: 'Shop Right Sidebar' },
    //       // { link: '/shop/shop-4-col', title: 'Shop 4 Column' },
    //       // { link: '/shop/shop-3-col', title: 'Shop 3 Column' },
    //       // { link: '/shop', title: 'Shop Page' },
    //       // { link: '/shop', title: 'Shop Page' },
    //       // { link: '/shop', title: 'Shop Infinity' },
    //     ]
    //   },
    //   {
    //     link: '/shop',
    //     title: 'Products Pages',
    //     dropdownMenu: [
    //       { link: '/shop/product-details', title: 'Product Details' },
    //       // { link: '/shop/product-details', title: 'Product Page V2' },
    //       // { link: '/shop/product-details', title: 'Product Page V3' },
    //       // { link: '/shop/product-details', title: 'Product Page V4' },
    //       // { link: '/shop/product-details', title: 'Simple Product' },
    //       // { link: '/shop/product-details', title: 'Variable Product' },
    //       // { link: '/shop/product-details', title: 'External Product' },
    //     ]
    //   },
    //   // {
    //   //   link: '/shop',
    //   //   //   title: 'Other Shop Pages',
    //   //   dropdownMenu: [
    //   //     { link: '/wishlist', title: 'Wishlist' },
    //   //     { link: '/compare', title: 'Compare' },
    //   //     { link: '/cart', title: 'Shopping Cart' },
    //   //     { link: '/checkout', title: 'Checkout' },
    //   //     { link: '/register', title: 'Register' },
    //   //     { link: '/login', title: 'Login' },
    //   //   ]
    //   // },
    // ]
  },

  // {
  //   link: '/pages/blog',
  //   title: 'Blog',
  //   hasDropdown: true,
  //   megamenu: false,
  //   dropdownItems: [
  //     { link: '/pages/blog', title: 'Blog' },
  //     { link: '/pages/blog-left-sidebar', title: 'Blog Left Sidebar' },
  //     { link: '/pages/blog-no-sidebar', title: 'Blog No Sidebar' },
  //     { link: '/pages/blog-2-col', title: 'Blog 2 Column' },
  //     { link: '/pages/blog-3-col', title: 'Blog 3 Column' },
  //     { link: '/pages/blog-details', title: 'Blog Details' },
  //   ]
  // },
  // {
  //   link: '/shop',
  //   title: 'Pages',
  //   hasDropdown: true,
  //   megamenu: false,
  //   dropdownItems: [
  //     { link: '/wishlist', title: 'Wishlist' },
  //     { link: '/cart', title: 'Shopping Cart' },
  //     { link: '/checkout', title: 'Checkout' },
  //     { link: '/account', title: 'Account' },
  //     { link: '/register', title: 'Register' },
  //     { link: '/login', title: 'Login' },
  //     { link: '/404', title: 'Error 404' },
  //   ]
  //   },
  {
    link: '/contact',
    title: 'Contact',
  },
]

export default menuData;

// mobile menus
export const mobile_menus: IMobileMenu[] = [
  {
    title: "Home",
    link: '/home',
  },
  {
    title: "Shop",
    link: '/shop',
  },
  {
    title: "Wishlist",
    link: '/wishlist',
  },
  {
    title: "Track Order",
    link: '/order-track',
  },
  {
    title: "Login",
    link: '/login',
  },
  {
    title: "Contact",
    link: '/contact',
  },
];
