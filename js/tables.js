import { appState } from "./core.js";
import { deleteTable } from "./modals.js";

export function renderTablesTable() {
  const tablesTableBody = document.getElementById("tablesTableBody");
  const tablesEmpty = document.getElementById("tablesEmpty");
  tablesTableBody.innerHTML = "";

  if (appState.tables.length === 0) {
    tablesEmpty.style.display = "block";
    return;
  }
  tablesEmpty.style.display = "none";

  appState.tables.forEach((table, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${table.id}</td>
            <td>${table.number}</td>
            <td>${table.type}</td>
            <td>${table.restaurant}</td>
            <td>
                <button class="danger delete-table" data-index="${index}">Delete</button>
            </td>
        `;
    tablesTableBody.appendChild(row);
  });

  // Add event listeners for the new buttons
  document.querySelectorAll(".delete-table").forEach((button) => {
    button.addEventListener("click", (e) =>
      deleteTable(e.target.dataset.index)
    );
  });
}
