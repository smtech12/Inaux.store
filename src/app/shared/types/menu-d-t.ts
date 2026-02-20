export interface IMenuType {
  link: string,
  title: string,
  queryParams?: { [key: string]: any },
  hasDropdown?: boolean,
  megamenu?: boolean,
  dropdownItems?: {
    link: string
    title: string,
    queryParams?: { [key: string]: any },
    dropdownMenu?: {
      link: string
      title: string,
      queryParams?: { [key: string]: any },
    }[]
  }[],
}


// Define the menu data type
export interface IMobileMenu {
  title: string;
  link?: string;
  dropdownMenu?: {
    link: string;
    title: string;
    queryParams?: { [key: string]: any };
  }[];
}
