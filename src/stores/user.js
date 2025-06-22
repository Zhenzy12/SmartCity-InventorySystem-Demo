import { defineStore } from "pinia";
import mockUser from "../data/mockUser.json";
import mockInventoryAccess from "../data/mockInventoryAccess.json"

const useUserStore = defineStore("user", {
  state: () => ({
    user: null,
    inventoryAccess: null,
    loading: false,
    userLoaded: false,
  }),
  actions: {
    fetchUser() {
      this.loading = true;
      this.user = mockUser.user;
      this.inventoryAccess = mockInventoryAccess;
      this.loading = false;
      this.userLoaded = true;
    },
  },
});

export default useUserStore;
