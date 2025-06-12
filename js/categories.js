import { appState } from "./core.js";
import { editCategory, deleteCategory } from "./modals.js";

export function renderCategoriesTable() {
  const categoriesTableBody = document.getElementById("categoriesTableBody");
  const categoriesEmpty = document.getElementById("categoriesEmpty");
  categoriesTableBody.innerHTML = "";

  if (appState.categories.length === 0) {
    categoriesEmpty.style.display = "block";
    categoriesTableBody.style.display = "none";
    return;
  }
  categoriesEmpty.style.display = "none";
  categoriesTableBody.style.display = "";

  appState.categories.forEach((category, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${category.name}</td>
            <td>${category.japan_name}</td>
            <td>${category.myanmar_name}</td>
            <td>${category.chinese_name}</td>
            <td>
                <button class="edit-category" data-index="${index}">Edit</button>
                <button class="danger delete-category" data-index="${index}">Delete</button>
            </td>
        `;
    categoriesTableBody.appendChild(row);
  });

  document.querySelectorAll(".edit-category").forEach((button) => {
    button.addEventListener("click", (e) =>
      editCategory(e.target.dataset.index)
    );
  });
  document.querySelectorAll(".delete-category").forEach((button) => {
    button.addEventListener("click", (e) =>
      deleteCategory(e.target.dataset.index)
    );
  });
}

export function updateCategoryDropdown() {
  const categorySelect = document.getElementById("itemCategory");
  // This check prevents the error on page load.
  if (!categorySelect) return;

  const currentValue = categorySelect.value;
  categorySelect.innerHTML = '<option value="">Select a category</option>';

  if (appState.categories.length === 0) return;

  appState.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  if (
    currentValue &&
    appState.categories.some((cat) => cat.name === currentValue)
  ) {
    categorySelect.value = currentValue;
  }
}
