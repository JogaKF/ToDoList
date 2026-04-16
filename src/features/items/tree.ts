import type { Item, ItemTreeNode } from './types';

export function buildItemTree(items: Item[]) {
  const childrenByParent = new Map<string | null, Item[]>();
  const presentIds = new Set(items.map((item) => item.id));

  for (const item of items) {
    const normalizedParentId = item.parentId && presentIds.has(item.parentId) ? item.parentId : null;
    const bucket = childrenByParent.get(normalizedParentId) ?? [];
    bucket.push(item);
    childrenByParent.set(normalizedParentId, bucket);
  }

  for (const [, bucket] of childrenByParent) {
    bucket.sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
  }

  const buildNodes = (parentId: string | null, depth: number): ItemTreeNode[] => {
    const siblings = childrenByParent.get(parentId) ?? [];

    return siblings.map((item) => {
      const children = buildNodes(item.id, depth + 1);
      return {
        ...item,
        depth,
        children,
        hasChildren: children.length > 0,
      };
    });
  };

  return buildNodes(null, 0);
}

export function flattenVisibleTree(nodes: ItemTreeNode[], expandedIds: Record<string, boolean>) {
  const result: ItemTreeNode[] = [];

  const visit = (node: ItemTreeNode) => {
    result.push(node);

    if (!node.hasChildren) {
      return;
    }

    if (!expandedIds[node.id]) {
      return;
    }

    for (const child of node.children) {
      visit(child);
    }
  };

  for (const node of nodes) {
    visit(node);
  }

  return result;
}

export function collectExpandableIds(nodes: ItemTreeNode[]) {
  const result: string[] = [];

  const visit = (node: ItemTreeNode) => {
    if (node.hasChildren) {
      result.push(node.id);
    }

    for (const child of node.children) {
      visit(child);
    }
  };

  for (const node of nodes) {
    visit(node);
  }

  return result;
}
