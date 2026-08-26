// src/data/navigation.js

export const navigation = [
  {
    id: "women",
    label: "WOMEN",
    href: "/women",

    megaMenu: {
      columns: [
        {
          id: "edits",
          title: "EDITS",
          links: [
            {
              label: "New Collection",
              href: "/women/new-collection",
            },
            {
              label: "Seasonal Classics",
              href: "/women/seasonal-classics",
            },
            {
              label: "Women's Silhouettes",
              href: "/women/silhouettes",
            },
            {
              label: "Wedding",
              href: "/women/wedding",
              separated: true,
            },
            {
              label: "Evening",
              href: "/women/evening",
            },
            {
              label: "Day",
              href: "/women/day",
            },
            {
              label: "Sleek Slingbacks",
              href: "/women/sleek-slingbacks",
            },
          ],
        },

        {
          id: "style",
          title: "STYLE",
          links: [
            {
              label: "Pumps",
              href: "/women/pumps",
            },
            {
              label: "Mules",
              href: "/women/mules",
            },
            {
              label: "Sandals",
              href: "/women/sandals",
            },
            {
              label: "Bridal Shoes",
              href: "/women/bridal-shoes",
            },
            {
              label: "Flats",
              href: "/women/flats",
            },
            {
              label: "Espadrilles",
              href: "/women/espadrilles",
            },
            {
              label: "Boots",
              href: "/women/boots",
            },
          ],
        },

        {
          id: "classics",
          title: "CLASSICS",
          links: [
            {
              label: "Hangisi",
              href: "/women/classics/hangisi",
            },
            {
              label: "BB",
              href: "/women/classics/bb",
            },
            {
              label: "Carolyne",
              href: "/women/classics/carolyne",
            },
            {
              label: "Lurum",
              href: "/women/classics/lurum",
            },
            {
              label: "Maysale",
              href: "/women/classics/maysale",
            },
            {
              label: "Nadira",
              href: "/women/classics/nadira",
            },
          ],
        },

        {
          id: "accessories",
          title: "ACCESSORIES",
          links: [
            {
              label: "Bags",
              href: "/women/accessories/bags",
            },
            {
              label: "Belts",
              href: "/women/accessories/belts",
            },
            {
              label: "Gifts for Her",
              href: "/women/accessories/gifts",
            },
          ],
        },
      ],

      promos: [
        {
          id: "wedding",
          image: "/images/navigation/wedding.jpg",
          label: "SHOP WEDDING",
          href: "/wedding",
          url: "https://i.pinimg.com/736x/e7/0e/c5/e70ec54106dc4c1204e94de70e804bd9.jpg"
        },
        {
          id: "new-collection",
          image: "/images/navigation/new-collection.jpg",
          label: "SHOP NEW COLLECTION",
          href: "/collections/new",
          url:"https://i.pinimg.com/1200x/fe/75/09/fe7509e6b9dc5063055486cc4fa3109e.jpg"
        },
      ],
    },
  },

  {
    id: "men",
    label: "MEN",
    href: "/men",
    megaMenu: null,
  },

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