import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: true,
  }),
  actions: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode;
    },
  },
});
