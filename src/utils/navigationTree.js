import {
    getCategoryUrl,
  } from "./categoryTree";
  
  import {
    editorialNavigation,
    navigationPromos,
  } from "../data/navigation";
  
  /*
  |--------------------------------------------------------------------------
  | Preferred catalog navigation order
  |--------------------------------------------------------------------------
  |
  | If these categories exist, they appear first.
  | Any additional top-level categories are added afterward.
  |
  |--------------------------------------------------------------------------
  */
  
  const preferredOrder = [
    "women",
    "men",
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Sort root categories
  |--------------------------------------------------------------------------
  */
  
  function sortRootCategories(categories) {
    return [...categories].sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.slug);
      const bIndex = preferredOrder.indexOf(b.slug);
  
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
  
      if (aIndex !== -1) {
        return -1;
      }
  
      if (bIndex !== -1) {
        return 1;
      }
  
      return a.name.localeCompare(b.name);
    });
  }
  
  /*
  |--------------------------------------------------------------------------
  | Build mega menu columns
  |--------------------------------------------------------------------------
  |
  | Preferred structure:
  |
  | Women
  | ├── Edits
  | │   ├── New Collection
  | │   └── Seasonal Classics
  | │
  | ├── Style
  | │   ├── Pumps
  | │   └── Mules
  | │
  | ├── Classics
  | │   ├── Hangisi
  | │   └── BB
  | │
  | └── Accessories
  |     ├── Bags
  |     └── Belts
  |
  |--------------------------------------------------------------------------
  */
  
  function buildColumns(category) {
    const children = category.children || [];
  
    if (children.length === 0) {
      return [];
    }
  
    /*
     * If the category has grouped children, each child becomes
     * one mega-menu column.
     */
  
    const groupedChildren = children.filter(
      (child) => child.children?.length > 0
    );
  
    const leafChildren = children.filter(
      (child) => child.children?.length === 0
    );
  
    const columns = groupedChildren.map(
      (group) => ({
        id: group.$id,
        title: group.name.toUpperCase(),
  
        href: getCategoryUrl(group),
  
        links: group.children.map(
          (child) => ({
            id: child.$id,
            label: child.name,
            href: getCategoryUrl(child),
          })
        ),
      })
    );
  
    /*
     * If some direct children don't have children,
     * place them in a generic SHOP column.
     *
     * This allows a simple two-level category tree
     * to work without requiring an artificial third level.
     */
  
    if (leafChildren.length > 0) {
      columns.push({
        id: `${category.$id}-shop`,
        title: "",
        href: getCategoryUrl(category),
  
        links: leafChildren.map(
          (child) => ({
            id: child.$id,
            label: child.name,
            href: getCategoryUrl(child),
          })
        ),
      });
    }
  
    return columns;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Build one catalog navigation item
  |--------------------------------------------------------------------------
  */
  
  function buildCategoryNavigationItem(
    category
  ) {
    const columns = buildColumns(category);
  
    return {
      id: category.$id,
      label: category.name.toUpperCase(),
      href: getCategoryUrl(category),
  
      megaMenu:
        columns.length > 0
          ? {
              columns,
              promos:
                navigationPromos[
                  category.slug
                ] || [],
            }
          : null,
  
      category,
    };
  }
  
  /*
  |--------------------------------------------------------------------------
  | Build complete storefront navigation
  |--------------------------------------------------------------------------
  */
  
  export function buildNavigationFromTree(
    categoryTree
  ) {
    const categoryNavigation =
      sortRootCategories(
        categoryTree
      ).map(
        buildCategoryNavigationItem
      );
  
    return [
      ...categoryNavigation,
      ...editorialNavigation,
    ];
  }