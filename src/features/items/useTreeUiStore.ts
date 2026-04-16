import { create } from 'zustand';

type TreeUiState = {
  expandedIds: Record<string, boolean>;
  toggleExpanded: (id: string) => void;
  expandMany: (ids: string[]) => void;
  collapseMany: (ids: string[]) => void;
  resetExpanded: (ids?: string[]) => void;
};

export const useTreeUiStore = create<TreeUiState>((set) => ({
  expandedIds: {},
  toggleExpanded: (id) =>
    set((state) => ({
      expandedIds: {
        ...state.expandedIds,
        [id]: !state.expandedIds[id],
      },
    })),
  expandMany: (ids) =>
    set((state) => {
      const expandedIds = { ...state.expandedIds };
      for (const id of ids) {
        expandedIds[id] = true;
      }
      return { expandedIds };
    }),
  collapseMany: (ids) =>
    set((state) => {
      const expandedIds = { ...state.expandedIds };
      for (const id of ids) {
        expandedIds[id] = false;
      }
      return { expandedIds };
    }),
  resetExpanded: (ids = []) =>
    set(() => ({
      expandedIds: Object.fromEntries(ids.map((id) => [id, true])),
    })),
}));
