import { appState } from "./core.js";
import { renderCategoriesTable, updateCategoryDropdown } from "./categories.js";
import { renderItemsTable } from "./items.js";
import { renderTablesTable } from "./tables.js";

let currentCategoryId = null;
let currentItemId = null;
let currentTableId = null;

// --- Visibility Functions ---
export function showCategoryForm(category = null) {
  if (category) {
    document.getElementById("categoryFormTitle").textContent = "Edit Category";
    document.getElementById("categoryName").value = category.name;
    document.getElementById("categoryJpName").value = category.japan_name;
    document.getElementById("categoryMmName").value = category.myanmar_name;
    document.getElementById("categoryCnName").value = category.chinese_name;
    currentCategoryId = appState.categories.indexOf(category);
  } else {
    document.getElementById("categoryFormTitle").textContent =
      "Add New Category";
    document.getElementById("categoryName").value = "";
    document.getElementById("categoryJpName").value = "";
    document.getElementById("categoryMmName").value = "";
    document.getElementById("categoryCnName").value = "";
    currentCategoryId = null;
  }
  document.getElementById("categoryModal").style.display = "block";
}

export function hideCategoryForm() {
  document.getElementById("categoryModal").style.display = "none";
}

export async function showItemForm(item = null) {
  if (appState.categories.length === 0) {
    alert("Please add at least one category before adding items.");
    return;
  }
  updateCategoryDropdown();
  document.getElementById("itemCategory").disabled = false;

  // Regular item mode
  document.getElementById("itemFormTitle").textContent = item
    ? "Edit Item"
    : "Add New Item";
  document.getElementById("optionFields").style.display = "none";
  document.getElementById("itemNameField").style.display = "block";
  document.getElementById("itemJpNameField").style.display = "block";
  document.getElementById("itemMmNameField").style.display = "block";
  document.getElementById("itemCnNameField").style.display = "block";
  document.getElementById("itemImageGroup").style.display = "block";

  document.getElementById("itemCode").style.display = "block";

  if (item) {
    document.getElementById("itemCode").value = item.Code;
    document.getElementById("itemName").value = item.Name;
    document.getElementById("itemJpName").value = item.JP_Name;
    document.getElementById("itemMmName").value = item.MM_Name;
    document.getElementById("itemCnName").value = item.CN_Name;
    document.getElementById("itemCategory").value = item.Category;
    document.getElementById("itemFoodStatus").value = item.Food_Status;
    document.getElementById("itemRestaurantSection").value =
      item.Restaurant_Section;
    document.getElementById("itemPrice").value = item.Price;
    document.getElementById("itemTax").value = item.Tax;

    document.getElementById("itemImage").value = "";
    const preview = document.getElementById("itemImagePreview");
    preview.src = "";
    if (item.Image && appState.images[item.Image]) {
      preview.src = URL.createObjectURL(appState.images[item.Image]);
    }
    currentItemId = appState.items.indexOf(item);
  } else {
    // Reset form
    document.getElementById("itemCode").value = "";
    document.getElementById("itemName").value = "";
    document.getElementById("itemJpName").value = "";
    document.getElementById("itemMmName").value = "";
    document.getElementById("itemCnName").value = "";
    document.getElementById("itemCategory").value =
      appState.categories.length > 0 ? appState.categories[0].name : "";
    document.getElementById("itemFoodStatus").value = "Available";
    document.getElementById("itemRestaurantSection").value = "NongInlay";
    document.getElementById("itemPrice").value = "";
    document.getElementById("itemTax").value = "5";
    document.getElementById("itemImagePreview").src = "";
    document.getElementById("itemImage").value = "";
    currentItemId = null;
  }
  document.getElementById("itemModal").style.display = "block";
}

export function showOptionForm(item = null) {
  if (appState.items.length === 0) {
    alert("Please add at least one base item before adding options.");
    return;
  }
  updateCategoryDropdown();

  document.getElementById("itemFormTitle").textContent = item
    ? "Edit Option"
    : "Add New Option";
  document.getElementById("optionFields").style.display = "block";
  document.getElementById("itemNameField").style.display = "none";
  document.getElementById("itemJpNameField").style.display = "none";
  document.getElementById("itemMmNameField").style.display = "none";
  document.getElementById("itemCnNameField").style.display = "none";
  document.getElementById("itemImageGroup").style.display = "none";

  const codeSelect = document.getElementById("itemCodeSelect");
  codeSelect.innerHTML = '<option value="">Select a base item</option>';

  const baseItems = appState.items.filter((i) => !i.Name.includes("["));
  const sortedBaseItems = [...baseItems].sort((a, b) =>
    a.Code.localeCompare(b.Code)
  );

  sortedBaseItems.forEach((baseItem) => {
    const option = document.createElement("option");
    option.value = baseItem.Code;
    option.textContent = `${baseItem.Code} - ${baseItem.Name}`;
    codeSelect.appendChild(option);
  });

  codeSelect.onchange = () => {
    const selectedItem = baseItems.find((i) => i.Code === codeSelect.value);
    if (selectedItem) {
      document.getElementById("baseItemName").value = selectedItem.Name;
      document.getElementById("baseItemJpName").value = selectedItem.JP_Name;
      document.getElementById("baseItemMmName").value = selectedItem.MM_Name;
      document.getElementById("baseItemCnName").value = selectedItem.CN_Name;
      document.getElementById("itemCategory").value = selectedItem.Category;
    }
  };

  if (item) {
    const baseCode = item.Code;
    codeSelect.value = baseCode;
    codeSelect.dispatchEvent(new Event("change"));

    const nameMatch = item.Name.match(/\[(.*?)\]/);
    const jpMatch = item.JP_Name.match(/\[(.*?)\]/);
    const mmMatch = item.MM_Name.match(/\[(.*?)\]/);
    const cnMatch = item.CN_Name.match(/\[(.*?)\]/);

    document.getElementById("itemNameOption").value = nameMatch
      ? nameMatch[1]
      : "";
    document.getElementById("itemJpNameOption").value = jpMatch
      ? jpMatch[1]
      : "";
    document.getElementById("itemMmNameOption").value = mmMatch
      ? mmMatch[1]
      : "";
    document.getElementById("itemCnNameOption").value = cnMatch
      ? cnMatch[1]
      : "";
    currentItemId = appState.items.indexOf(item);
  } else {
    // reset
    codeSelect.value = "";
    document.getElementById("baseItemName").value = "";
    document.getElementById("baseItemJpName").value = "";
    document.getElementById("baseItemMmName").value = "";
    document.getElementById("baseItemCnName").value = "";
    document.getElementById("itemNameOption").value = "";
    document.getElementById("itemJpNameOption").value = "";
    document.getElementById("itemMmNameOption").value = "";
    document.getElementById("itemCnNameOption").value = "";
    currentItemId = null;
  }

  document.getElementById("itemModal").style.display = "block";
}

export function hideItemForm() {
  document.getElementById("itemModal").style.display = "none";
}

export function showTableForm(table = null) {
  if (table) {
    document.getElementById("tableFormTitle").textContent = "Edit Table";
    document.getElementById("tableNumber").value = table.number;
    document.getElementById("tableType").value = table.type;
    document.getElementById("tableRestaurant").value = table.restaurant;
    currentTableId = appState.tables.indexOf(table);
  } else {
    document.getElementById("tableFormTitle").textContent = "Add New Table";
    document.getElementById("tableNumber").value = "";
    document.getElementById("tableType").value = "Table";
    document.getElementById("tableRestaurant").value = "NongInlay";
    currentTableId = null;
  }
  document.getElementById("tableModal").style.display = "block";
}

export function hideTableForm() {
  document.getElementById("tableModal").style.display = "none";
}

// --- Save/Edit/Delete Functions ---
export function saveCategory() {
  const name = document.getElementById("categoryName").value.trim();
  const jpName = document.getElementById("categoryJpName").value.trim();
  const mmName = document.getElementById("categoryMmName").value.trim();
  const cnName = document.getElementById("categoryCnName").value.trim();

  if (!name || !jpName) {
    alert("Please fill in at least the Name and Japanese Name fields.");
    return;
  }

  const category = {
    name,
    japan_name: jpName,
    myanmar_name: mmName,
    chinese_name: cnName,
  };

  if (currentCategoryId !== null) {
    appState.categories[currentCategoryId] = category;
  } else {
    appState.categories.push(category);
  }

  renderCategoriesTable();
  updateCategoryDropdown();
  hideCategoryForm();
}

export function editCategory(index) {
  showCategoryForm(appState.categories[index]);
}

export function deleteCategory(index) {
  if (confirm("Are you sure you want to delete this category?")) {
    const categoryName = appState.categories[index].name;
    const itemsUsingCategory = appState.items.filter(
      (item) => item.Category === categoryName
    );
    if (itemsUsingCategory.length > 0) {
      alert(
        "Cannot delete this category because it is being used by one or more items."
      );
      return;
    }
    appState.categories.splice(index, 1);
    renderCategoriesTable();
    updateCategoryDropdown();
  }
}

export function saveItem() {
  const isOptionMode =
    document.getElementById("optionFields").style.display === "block";
  let code, name, jpName, mmName, cnName, category, image;

  if (isOptionMode) {
    code = document.getElementById("itemCodeSelect").value;
    const baseItem = appState.items.find(
      (i) => i.Code === code && !i.Name.includes("[")
    );
    if (!baseItem) {
      alert("Please select a valid base item.");
      return;
    }

    const nameOption = document.getElementById("itemNameOption").value.trim();
    const jpNameOption = document
      .getElementById("itemJpNameOption")
      .value.trim();
    const mmNameOption = document
      .getElementById("itemMmNameOption")
      .value.trim();
    const cnNameOption = document
      .getElementById("itemCnNameOption")
      .value.trim();

    if (!nameOption) {
      alert("Please enter an option name");
      return;
    }

    name = `${baseItem.Name} [${nameOption}]`;
    jpName = `${baseItem.JP_Name} [${jpNameOption || nameOption}]`;
    mmName = `${baseItem.MM_Name} [${mmNameOption || nameOption}]`;
    cnName = `${baseItem.CN_Name} [${cnNameOption || nameOption}]`;
    category = baseItem.Category;
    image = baseItem.Image;
  } else {
    code = document.getElementById("itemCode").value.trim();
    name = document.getElementById("itemName").value.trim();
    jpName = document.getElementById("itemJpName").value.trim();
    mmName = document.getElementById("itemMmName").value.trim();
    cnName = document.getElementById("itemCnName").value.trim();
    category = document.getElementById("itemCategory").value;

    const imageFile = document.getElementById("itemImage").files[0];
    if (imageFile) {
      const timestamp = new Date().getTime();
      const fileName = imageFile.name.toLowerCase();
      const newFileName = `${code}_${timestamp}${fileName.substring(
        fileName.lastIndexOf(".")
      )}`;
      image = newFileName;
      appState.images[newFileName] = imageFile;
    } else if (currentItemId !== null) {
      image = appState.items[currentItemId].Image;
    } else {
      alert("Please select an image for the new item.");
      return;
    }
  }

  const foodStatus = document.getElementById("itemFoodStatus").value;
  const restaurantSection = document.getElementById(
    "itemRestaurantSection"
  ).value;
  const price = document.getElementById("itemPrice").value;
  const tax = document.getElementById("itemTax").value;

  if (!code || !name || !category || !price || !tax) {
    alert("Please fill in all required fields");
    return;
  }

  const priceWithTax = (
    parseFloat(price) *
    (1 + parseFloat(tax) / 100)
  ).toFixed(0);

  const item = {
    Code: code,
    Name: name,
    JP_Name: jpName,
    MM_Name: mmName,
    CN_Name: cnName,
    Category: category,
    Food_Status: foodStatus,
    Restaurant_Section: restaurantSection,
    Price: price,
    Tax: tax,
    Price_Included_Tax: priceWithTax,
    Image: image,
  };

  if (currentItemId !== null) {
    appState.items[currentItemId] = item;
  } else {
    appState.items.push(item);
  }
  renderItemsTable();
  hideItemForm();
}

export function editItem(index) {
  const item = appState.items[index];
  if (item.Name.includes("[")) {
    showOptionForm(item);
  } else {
    showItemForm(item);
  }
}

export function deleteItem(index) {
  const item = appState.items[index];
  const hasOptions = appState.items.some(
    (i) => i.Code === item.Code && i !== item && i.Name.includes("[")
  );

  if (hasOptions) {
    alert(
      "Cannot delete this item because it has options. Please delete the options first."
    );
    return;
  }

  if (confirm("Are you sure you want to delete this item?")) {
    appState.items.splice(index, 1);
    renderItemsTable();
  }
}

export function saveTable() {
  const number = document.getElementById("tableNumber").value.trim();
  const type = document.getElementById("tableType").value;
  const restaurant = document.getElementById("tableRestaurant").value;

  if (!number) {
    alert("Please enter a table number");
    return;
  }

  const table = {
    id:
      currentTableId !== null
        ? appState.tables[currentTableId].id
        : appState.tables.length + 1,
    number,
    type,
    restaurant,
  };

  if (currentTableId !== null) {
    appState.tables[currentTableId] = table;
  } else {
    appState.tables.push(table);
  }
  renderTablesTable();
  hideTableForm();
}

export function deleteTable(index) {
  if (confirm("Are you sure you want to delete this table?")) {
    appState.tables.splice(index, 1);
    renderTablesTable();
  }
}

export function validateImage(file) {
  return new Promise((resolve, reject) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      reject("Only JPG, JPEG, PNG, and GIF images are allowed.");
      return;
    }
    const img = new Image();
    img.onload = function () {
      if (this.width !== 900 || this.height !== 900) {
        reject("Image must be exactly 900x900 pixels.");
      } else {
        resolve();
      }
    };
    img.onerror = () => reject("Invalid image file.");
    img.src = URL.createObjectURL(file);
  });
}
