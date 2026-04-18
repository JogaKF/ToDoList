import type { DeletedItem } from '../../features/items/types';
import { TRASH_PREVIEW_LIMIT } from './constants';

export type DeletedItemBranch = {
  root: DeletedItem;
  totalItems: number;
  previewTitles: string[];
};

export function buildDeletedItemBranches(deletedItems: DeletedItem[]) {
  const deletedById = new Map(deletedItems.map((item) => [item.id, item]));
  const childrenByParent = new Map<string, DeletedItem[]>();

  for (const item of deletedItems) {
    if (!item.parentId || !deletedById.has(item.parentId)) {
      continue;
    }

    const bucket = childrenByParent.get(item.parentId) ?? [];
    bucket.push(item);
    bucket.sort((left, right) => left.position - right.position || left.createdAt.localeCompare(right.createdAt));
    childrenByParent.set(item.parentId, bucket);
  }

  const roots = deletedItems.filter((item) => !item.parentId || !deletedById.has(item.parentId));

  return roots
    .map((root) => {
      const titles: string[] = [];
      let totalItems = 0;

        const visit = (node: DeletedItem) => {
          totalItems += 1;
        if (titles.length < TRASH_PREVIEW_LIMIT) {
            titles.push(node.title);
          }

        for (const child of childrenByParent.get(node.id) ?? []) {
          visit(child);
        }
      };

      visit(root);

      return {
        root,
        totalItems,
        previewTitles: titles,
      };
    })
    .sort((left, right) => right.root.deletedAt.localeCompare(left.root.deletedAt));
}
