import { create } from "zustand";
import { persist } from "zustand/middleware";

type WatchlistState = {
  ids: number[];
  add: (id: number) => void;
  remove: (id: number) => void;
  toggle: (id: number) => void;
  has: (id: number) => boolean;
};

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      ids: [4151, 11802, 12817, 19553, 21018, 22324], // whip, ags, ely, torture, ancestral, scythe starter picks
      add: (id) =>
        set((s) => (s.ids.includes(id) ? s : { ids: [id, ...s.ids].slice(0, 40) })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      toggle: (id) => {
        const { ids } = get();
        if (ids.includes(id)) set({ ids: ids.filter((x) => x !== id) });
        else set({ ids: [id, ...ids].slice(0, 40) });
      },
      has: (id) => get().ids.includes(id),
    }),
    { name: "osrs-ge-watchlist-v1" },
  ),
);
