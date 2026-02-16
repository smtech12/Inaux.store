export type ISocial =  {
  link: string;
  icon: string;
  name: string;
}

const social_links:ISocial[] = [
  {
    link: "http://facebook.com",
    icon: "fab fa-facebook-f",
    name: "Facebook",
  },
  {
    link: "http://instagram.com",
    icon: "fab fa-instagram",
    name: "Instagram",
  },
]

export default social_links;
