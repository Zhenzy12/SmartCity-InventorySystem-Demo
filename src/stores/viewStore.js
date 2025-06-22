import { defineStore } from "pinia";

export const useViewStore = defineStore("view", {
  state: () => ({
    tableView: JSON.parse(localStorage.getItem("tableView")) || false,
  }),
  actions: {
    toggleTableView() {
      this.tableView = !this.tableView;
      localStorage.setItem("tableView", JSON.stringify(this.tableView));
    },
  },
});
