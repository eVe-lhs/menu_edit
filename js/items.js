import { appState } from "./core.js";
import { editItem, deleteItem } from "./modals.js";

// This function will now be called automatically whenever the state changes.
export function renderItemsTable() {
  const itemsTableBody = document.getElementById("itemsTableBody");
  const itemsEmpty = document.getElementById("itemsEmpty");
  itemsTableBody.innerHTML = "";

  if (appState.items.length === 0) {
    itemsEmpty.style.display = "block";
    itemsTableBody.style.display = "none";
    return;
  }
  itemsEmpty.style.display = "none";
  itemsTableBody.style.display = "";

  const sortedItems = [...appState.items].sort((a, b) =>
    a.Code.localeCompare(b.Code)
  );

  sortedItems.forEach((item) => {
    const originalIndex = appState.items.indexOf(item);
    const row = document.createElement("tr");

    let imageCellContent = "No image";
    // Now this check will work because this function re-runs after images are loaded
    if (item.Image && appState.images[item.Image]) {
      const blob = appState.images[item.Image];
      const url = URL.createObjectURL(blob);
      imageCellContent = `
        <div class="table-image-container">
            <img class="table-image-preview" src="${url}" alt="${item.Name}">
            <span class="image-filename">${item.Image}</span>
        </div>`;
    } else if (item.Image) {
      imageCellContent = `<span class="image-filename">${item.Image} (Not in zip)</span>`;
    }

    row.innerHTML = `
      <td>${item.Code}</td>
      <td>${item.Name}</td>
      <td>${item.JP_Name}</td>
      <td>${item.MM_Name}</td>
      <td>${item.CN_Name}</td>
      <td>${item.Category}</td>
      <td>${item.Restaurant_Section}</td>
      <td>¥${item.Price_Included_Tax}</td>
      <td>${imageCellContent}</td>
      <td>
        <button class="edit-item" data-index="${originalIndex}">Edit</button>
        <button class="danger delete-item" data-index="${originalIndex}">Delete</button>
      </td>
    `;
    itemsTableBody.appendChild(row);
  });

  // Add event listeners after all rows are created
  document.querySelectorAll(".edit-item").forEach((button) => {
    button.addEventListener("click", (e) => editItem(e.target.dataset.index));
  });
  document.querySelectorAll(".delete-item").forEach((button) => {
    button.addEventListener("click", (e) => deleteItem(e.target.dataset.index));
  });
}
