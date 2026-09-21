/*
|--------------------------------------------------------------------------
| Build category tree
|--------------------------------------------------------------------------
*/

export function buildCategoryTree(categories = []) {
  const nodes = new Map();

  categories.forEach((category) => {
    nodes.set(category.$id, {
      ...category,
      children: [],
      parentCategory: null,
    });
  });

  const roots = [];

  nodes.forEach((category) => {
    const parentId = category.parentCategoryID;

    if (
      parentId &&
      parentId !== category.$id &&
      nodes.has(parentId)
    ) {
      const parent = nodes.get(parentId);

      category.parentCategory = parent;
      parent.children.push(category);
    } else {
      roots.push(category);
    }
  });

  return roots;
}

/*
|--------------------------------------------------------------------------
| Find category by slug path
|--------------------------------------------------------------------------
|
| Example:
|
| ["women", "classics", "hangisi"]
|
| resolves:
|
| Women
|   └── Classics
|        └── Hangisi
|
|--------------------------------------------------------------------------
*/

export function findCategoryByPath(
  tree,
  slugPath = []
) {
  let currentLevel = tree;
  let currentCategory = null;

  for (const slug of slugPath) {
    currentCategory = currentLevel.find(
      (category) => category.slug === slug
    );

    if (!currentCategory) {
      return null;
    }

    currentLevel = currentCategory.children;
  }

  return currentCategory;
}

/*
|--------------------------------------------------------------------------
| Get category path
|--------------------------------------------------------------------------
*/

export function getCategoryPath(category) {
  const path = [];

  let current = category;

  while (current) {
    path.unshift(current.slug);

    current = current.parentCategory;
  }

  return path;
}

/*
|--------------------------------------------------------------------------
| Get category URL
|--------------------------------------------------------------------------
*/

export function getCategoryUrl(category) {
  const path = getCategoryPath(category);

  if (path.length === 0) {
    return "/all-products";
  }

  return `/all-products/${path.join("/")}`;
}

/*
|--------------------------------------------------------------------------
| Get all descendant category IDs
|--------------------------------------------------------------------------
*/

export function getDescendantCategoryIds(
  category
) {
  const ids = [category.$id];

  function walk(children = []) {
    children.forEach((child) => {
      ids.push(child.$id);

      walk(child.children);
    });
  }

  walk(category.children);

  return ids;
}

/*
|--------------------------------------------------------------------------
| Build product/category URL helpers
|--------------------------------------------------------------------------
*/

export function getCategoryPathById(categories = [], categoryId) {
  if (!categoryId) {
    return [];
  }

  const byId = new Map(
    categories.map((category) => [category.$id, category]),
  );

  const path = [];
  const visited = new Set();
  let current = byId.get(categoryId);

  while (current && !visited.has(current.$id)) {
    visited.add(current.$id);
    if (current.slug) {
      path.unshift(current.slug);
    }
    current = current.parentCategoryID
      ? byId.get(current.parentCategoryID)
      : null;
  }

  return path;
}

export function getProductUrl(product, categories = []) {
  const path = getCategoryPathById(categories, product?.categoryID);

  if (path.length > 0 && product?.slug) {
    return `/products/${path.join("/")}/${product.slug}`;
  }

  return product?.slug ? `/products/${product.slug}` : "/all-products";
}
