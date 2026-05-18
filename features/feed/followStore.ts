import { create } from "zustand";

type FollowStore = {
  following: Set<string>;
  isFollowing: (username: string) => boolean;
  toggleFollow: (username: string) => void;
};

export const useFollowStore = create<FollowStore>((set, get) => ({
  following: new Set<string>(),
  isFollowing: (username: string) => get().following.has(username),
  toggleFollow: (username: string) => {
    set((s) => {
      const next = new Set(s.following);
      if (next.has(username)) {
        next.delete(username);
      } else {
        next.add(username);
      }
      return { following: next };
    });
  },
}));
