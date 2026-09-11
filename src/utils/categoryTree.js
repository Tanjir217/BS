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
      nodes.get(parentId).children.push(category);
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