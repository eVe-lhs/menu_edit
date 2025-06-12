import { importFromZip, exportToZip, subscribe } from "./core.js";
import { renderCategoriesTable, updateCategoryDropdown } from "./categories.js";
import { renderItemsTable } from "./items.js";
import { renderTablesTable } from "./tables.js";
import {
  showCategoryForm,
  hideCategoryForm,
  saveCategory,
  showItemForm,
  showOptionForm,
  hideItemForm,
  saveItem,
  showTableForm,
  hideTableForm,
  saveTable,
  validateImage,
} from "./modals.js";
import { exportToPdf } from "./pdf-export.js";
import { exportToPpt, showPptOptionsModal } from "./ppt-export.js";

document.addEventListener("DOMContentLoaded", () => {
  // Subscribe all rendering functions to state changes
  subscribe(renderCategoriesTable);
  subscribe(renderItemsTable);
  subscribe(renderTablesTable);
  subscribe(updateCategoryDropdown);

  // Initial render with empty state
  renderCategoriesTable();
  renderItemsTable();
  renderTablesTable();
  updateCategoryDropdown();

  // Setup event listeners
  setupEventListeners();
});

function setupEventListeners() {
  const fileInput = document.getElementById("fileInput");
  const createNewBtn = document.getElementById("createNewBtn");
  const editBtn = document.getElementById("editBtn");
  // const exportPdfBtn = document.getElementById("exportPdfBtn");
  const exportPptBtn = document.getElementById("exportPptBtn");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const addItemBtn = document.getElementById("addItemBtn");
  const addOptionBtn = document.getElementById("addOptionBtn");
  const addTableBtn = document.getElementById("addTableBtn");
  const itemImageInput = document.getElementById("itemImage");

  // Main controls
  createNewBtn.addEventListener("click", exportToZip);
  editBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", importFromZip);
  exportPptBtn.addEventListener("click", showPptOptionsModal);
  // exportPdfBtn.addEventListener("click", exportToPdf);

  // Tab switching
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab, .tab-content")
        .forEach((el) => el.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab + "Tab").classList.add("active");
    });
  });

  // Add buttons
  addCategoryBtn.addEventListener("click", () => showCategoryForm());
  addItemBtn.addEventListener("click", () => showItemForm());
  addOptionBtn.addEventListener("click", () => showOptionForm());
  addTableBtn.addEventListener("click", () => showTableForm());

  // Modal Save/Cancel buttons
  document
    .getElementById("saveCategoryBtn")
    .addEventListener("click", saveCategory);
  document
    .getElementById("cancelCategoryBtn")
    .addEventListener("click", hideCategoryForm);
  document.getElementById("saveItemBtn").addEventListener("click", saveItem);
  document
    .getElementById("cancelItemBtn")
    .addEventListener("click", hideItemForm);
  document.getElementById("saveTableBtn").addEventListener("click", saveTable);
  document
    .getElementById("cancelTableBtn")
    .addEventListener("click", hideTableForm);

  // Modal close buttons ('x')
  document.querySelectorAll(".modal .close").forEach((btn) => {
    btn.addEventListener("click", () => {
      hideCategoryForm();
      hideItemForm();
      hideTableForm();
    });
  });

  // Image preview
  itemImageInput.addEventListener("change", async function (e) {
    if (e.target.files && e.target.files[0]) {
      try {
        await validateImage(e.target.files[0]);
        const reader = new FileReader();
        reader.onload = function (event) {
          document.getElementById("itemImagePreview").src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
      } catch (error) {
        alert(error);
        e.target.value = "";
        document.getElementById("itemImagePreview").src = "";
      }
    }
  });
}
