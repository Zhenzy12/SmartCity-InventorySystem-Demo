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
        this.borrowers[index].updated_at = new Date().toLocaleDateString()
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
        this.categoryList[index].updated_at = new Date().toLocaleDateString() // Example deleted by user
      }
    },
    restoreCategory(categoryId) {
      const index = this.categoryList.findIndex((c) => c.id === categoryId);
      if (index !== -1) {
        this.categoryList[index].is_deleted = 0;
      }
    },
  },
});
