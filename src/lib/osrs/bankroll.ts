import { create } from "zustand";
import { persist } from "zustand/middleware";

type BankrollState = {
  /** Raw input string e.g. "50m" or "10000000" */
  input: string;
  setInput: (v: string) => void;
};

export const useBankroll = create<BankrollState>()(
  persist(
    (set) => ({
      input: "50m",
      setInput: (input) => set({ input }),
    }),
    { name: "osrs-ge-bankroll-v1" },
  ),
);
