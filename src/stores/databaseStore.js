// /src/stores/databaseStore.js
import { defineStore } from "pinia";
import mockInventoryAccessData from "../data/mockInventoryAccessData.json";
import mockUserData from "../data/mockUserData.json";
import mockBorrowersData from "../data/mockBorrowersData.json";
import mockCategoryListData from "../data/mockCategoryListData.json";
import mockEquipmentCopiesData from "../data/mockEquipmentCopiesData.json";
import mockOfficeEquipmentsData from "../data/mockOfficeEquipmentsData.json";
import mockOfficeListData from "../data/mockOfficeListData.json";
import mockOfficeSuppliesData from "../data/mockOfficeSuppliesData.json";
import mockTransactionHistoryData from "../data/mockTransactionHistoryData.json";
import mockTransactionItemsData from "../data/mockTransactionItemsData.json";

export const useDatabaseStore = defineStore("database", {
  state: () => ({
    officeEquipments: [],
    officeSupplies: [],
    equipmentCopies: [],
    categoryList: [],
    transactionItems: [],
    transactionHistory: [],
    users: [],
    borrowers: [],
    officeList: [],
    inventoryAccesses: [],
    fetchedDataCount: 0,
    isLoading: true,
  }),
  actions: {
    fetchData() {
      this.isLoading = true;
      this.fetchedDataCount = 12;
      this.inventoryAccesses = mockInventoryAccessData;
      this.users = mockUserData;
      this.officeEquipments = mockOfficeEquipmentsData;
      this.officeSupplies = mockOfficeSuppliesData;
      this.equipmentCopies = mockEquipmentCopiesData;
      this.categoryList = mockCategoryListData;
      this.transactionItems = mockTransactionItemsData;
      this.transactionHistory = mockTransactionHistoryData;
      this.borrowers = mockBorrowersData;
      this.officeList = mockOfficeListData;
      this.isLoading = false;
    },
    // CRUD for borrowers
    addBorrower(borrower) {
      this.borrowers.push(borrower);
    },
    updateBorrower(updatedBorrower) {
      const index = this.borrowers.findIndex(
        (b) => b.id === updatedBorrower.id
      );
      if (index !== -1) {
        this.borrowers[index] = {
          ...this.borrowers[index],
          ...updatedBorrower,
        };
      }
    },
    deleteBorrower(borrowerId, deletedBy) {
      const index = this.borrowers.findIndex((b) => b.id === borrowerId);
      if (index !== -1) {
        this.borrowers[index].is_deleted = 1;
        this.borrowers[index].deleted_by = deletedBy;
      }
    },
    restoreBorrower(borrowerId) {
      const index = this.borrowers.findIndex((b) => b.id === borrowerId);
      if (index !== -1) {
        this.borrowers[index].is_deleted = 0;
        this.borrowers[index].deleted_by = null;
        this.borrowers[index].updated_at = new Date().toLocaleDateString();
      }
    },
    // crud for category
    addCategory(category) {
      this.categoryList.push(category);
    },
    updateCategory(updatedCategory) {
      const index = this.categoryList.findIndex(
        (c) => c.id === updatedCategory.id
      );
      if (index !== -1) {
        this.categoryList[index] = {
          ...this.categoryList[index],
          ...updatedCategory,
        };
      }
    },
    deleteCategory(categoryId) {
      const index = this.categoryList.findIndex((c) => c.id === categoryId);
      if (index !== -1) {
        this.categoryList[index].is_deleted = 1;
        this.categoryList[index].updated_at = new Date().toLocaleDateString();
      }
    },
    restoreCategory(categoryId) {
      const index = this.categoryList.findIndex((c) => c.id === categoryId);
      if (index !== -1) {
        this.categoryList[index].is_deleted = 0;
      }
    },
    // CRUD for equipment copies
    addEquipmentCopy(equipmentCopy) {
      this.equipmentCopies.push(equipmentCopy);
    },
    updateEquipmentCopy(updatedEquipmentCopy) {
      const index = this.equipmentCopies.findIndex(
        (ec) => ec.id === updatedEquipmentCopy.id
      );
      if (index !== -1) {
        this.equipmentCopies[index] = {
          ...this.equipmentCopies[index],
          ...updatedEquipmentCopy,
        };
      }
    },
    deleteEquipmentCopy(equipmentCopyId) {
      const index = this.equipmentCopies.findIndex(
        (ec) => ec.id === equipmentCopyId
      );
      if (index !== -1) {
        this.equipmentCopies.splice(index, 1);
      }
    },
    // CRUD for inventory access
    addInventoryAccess(inventoryAccess) {
      this.inventoryAccesses.push(inventoryAccess);
    },
    updateInventoryAccess(updatedInventoryAccess) {
      const index = this.inventoryAccesses.findIndex(
        (ia) => ia.id === updatedInventoryAccess.id
      );
      if (index !== -1) {
        this.inventoryAccesses[index] = {
          ...this.inventoryAccesses[index],
          ...updatedInventoryAccess,
        };
      }
    },
    deleteInventoryAccess(inventoryAccessId) {
      const index = this.inventoryAccesses.findIndex(
        (ia) => ia.id === inventoryAccessId
      );
      if (index !== -1) {
        this.inventoryAccesses.splice(index, 1);
      }
    },
    // CRUD for office equipments
    addOfficeEquipment(officeEquipment) {
      this.officeEquipments.push(officeEquipment);
    },
    updateOfficeEquipment(updatedOfficeEquipment) {
      const index = this.officeEquipments.findIndex(
        (oe) => oe.id === updatedOfficeEquipment.id
      );
      if (index !== -1) {
        this.officeEquipments[index] = {
          ...this.officeEquipments[index],
          ...updatedOfficeEquipment,
        };
      }
    },
    deleteOfficeEquipment(officeEquipmentId) {
      const index = this.officeEquipments.findIndex(
        (ti) => ti.id === officeEquipmentId
      );
      if (index !== -1) {
        this.officeEquipments.splice(index, 1);
      }
    },
    // CRUD for offices
    addOffice(office) {
      this.officeList.push(office);
    },
    updateOffice(updatedOffice) {
      const index = this.officeList.findIndex((o) => o.id === updatedOffice.id);
      if (index !== -1) {
        this.officeList[index] = {
          ...this.officeList[index],
          ...updatedOffice,
        };
      }
    },
    deleteOffice(officeId) {
      const index = this.officeList.findIndex((o) => o.id === officeId);
      if (index !== -1) {
        this.officeList[index].is_deleted = 1;
        this.officeList[index].updated_at = new Date().toLocaleDateString();
      }
    },
    restoreOffice(officeId) {
      const index = this.officeList.findIndex((o) => o.id === officeId);
      if (index !== -1) {
        this.officeList[index].is_deleted = 0;
      }
    },
    // CRUD for office supplies
    addOfficeSupply(officeSupply) {
      this.officeSupplies.push(officeSupply);
    },
    updateOfficeSupply(updatedOfficeSupply) {
      const index = this.officeSupplies.findIndex(
        (os) => os.id === updatedOfficeSupply.id
      );
      if (index !== -1) {
        this.officeSupplies[index] = {
          ...this.officeSupplies[index],
          ...updatedOfficeSupply,
        };
      }
    },
    deleteOfficeSupply(officeSupplyId) {
      const index = this.officeSupplies.findIndex(
        (os) => os.id === officeSupplyId
      );
      if (index !== -1) {
        this.officeSupplies.splice(index, 1);
      }
    },
    // CRUD for transaction history
    addTransactionHistory(transactionHistory) {
      this.transactionHistory.push(transactionHistory);
    },
    updateTransactionHistory(updatedTransactionHistory) {
      const index = this.transactionHistory.findIndex(
        (th) => th.id === updatedTransactionHistory.id
      );
      if (index !== -1) {
        this.transactionHistory[index] = {
          ...this.transactionHistory[index],
          ...updatedTransactionHistory,
        };
      }
    },
    deleteTransactionHistory(transactionHistoryId) {
      const index = this.transactionHistory.findIndex(
        (th) => th.id === transactionHistoryId
      );
      if (index !== -1) {
        this.transactionHistory.splice(index, 1);
      }
    },
    // CRUD for transaction items
    addTransactionItem(transactionItem) {
      this.transactionItems.push(transactionItem);
    },
    updateTransactionItem(updatedTransactionItem) {
      const index = this.transactionItems.findIndex(
        (ti) => ti.id === updatedTransactionItem.id
      );
      if (index !== -1) {
        this.transactionItems[index] = {
          ...this.transactionItems[index],
          ...updatedTransactionItem,
        };
      }
    },
    deleteTransactionItem(transactionItemId) {
      const index = this.transactionItems.findIndex(
        (ti) => ti.id === transactionItemId
      );
      if (index !== -1) {
        this.transactionItems.splice(index, 1);
      }
    },
    // CRUD for users
    addUser(user) {
      this.users.push(user);
    },
    updateUser(updatedUser) {
      const index = this.users.findIndex((u) => u.id === updatedUser.id);
      if (index !== -1) {
        this.users[index] = {
          ...this.users[index],
          ...updatedUser,
        };
      }
    },
    deleteUser(userId) {
      const index = this.users.findIndex((u) => u.id === userId);
      if (index !== -1) {
        this.users[index].is_deleted = 1;
        this.users[index].updated_at = new Date().toLocaleDateString();
      }
    },
    restoreUser(userId) {
      const index = this.users.findIndex((u) => u.id === userId);
      if (index !== -1) {
        this.users[index].is_deleted = 0;
        this.users[index].updated_at = new Date().toLocaleDateString();
      }
    },
  },
});
