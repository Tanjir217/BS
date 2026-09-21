/*
|--------------------------------------------------------------------------
| Editorial navigation
|--------------------------------------------------------------------------
|
| Catalog navigation is generated dynamically from Appwrite categories.
|
| These items are intentionally kept separate because they are not
| product categories.
|
|--------------------------------------------------------------------------
*/

export const editorialNavigation = [
  {
    id: "wedding",
    label: "WEDDING",
    href: "/wedding",
    megaMenu: null,
  },

  {
    id: "stories",
    label: "STORIES",
    href: "/stories",
    megaMenu: null,
  },

  {
    id: "archives",
    label: "THE ARCHIVES",
    href: "/archives",
    megaMenu: null,
  },
];

/*
|--------------------------------------------------------------------------
| Mega menu promotional content
|--------------------------------------------------------------------------
|
| Promotions are editorial content, not catalog categories.
|
|--------------------------------------------------------------------------
*/

export const navigationPromos = {
  women: [
    {
      id: "wedding",
      image: "/images/navigation/wedding.jpg",
      label: "SHOP WEDDING",
      href: "/wedding",
      url: "https://i.pinimg.com/736x/e7/0e/c5/e70ec54106dc4c1204e94de70e804bd9.jpg",
    },

    {
      id: "new-collection",
      image: "/images/navigation/new-collection.jpg",
      label: "SHOP NEW COLLECTION",
      href: "/collections/new",
      url: "https://i.pinimg.com/1200x/fe/75/09/fe7509e6b9dc5063055486cc4fa3109e.jpg",
    },
  ],

  men: [
    {
      id: "wedding",
      image: "/images/navigation/wedding.jpg",
      label: "SHOP WEDDING",
      href: "/wedding",
      url: "https://i.pinimg.com/736x/0d/2f/bc/0d2fbc0aaaf2737f373e4c52c2d19cb8.jpg",
    },

    {
      id: "new-collection",
      image: "/images/navigation/new-collection.jpg",
      label: "SHOP NEW COLLECTION",
      href: "/collections/new",
      url: "https://i.pinimg.com/736x/d9/dc/35/d9dc3556af4fd5974464d9f08fe64d2b.jpg",
    },
  ],
};