import { renderCategoriesTable, updateCategoryDropdown } from "./categories.js";
import { renderItemsTable } from "./items.js";
import { renderTablesTable } from "./tables.js";
import { parseCSVLine, escapeCSVField } from "./utils.js";

// --- Reactivity System ---
const listeners = [];

export function subscribe(listener) {
  listeners.push(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

const state = {
  categories: [],
  items: [],
  tables: [],
  images: {},
  currentZip: null,
};

export const appState = new Proxy(state, {
  set(target, property, value) {
    target[property] = value;
    notify();
    return true;
  },
});
// --- End Reactivity System ---

export async function importFromZip(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const zip = await JSZip.loadAsync(file);
    let targetFolder = null;
    zip.forEach((relativePath, zipEntry) => {
      if (
        !zipEntry.dir &&
        (relativePath.endsWith("categories.csv") ||
          relativePath.endsWith("items.csv"))
      ) {
        const folderPath = relativePath.split("/").slice(0, -1).join("/");
        targetFolder = zip.folder(folderPath);
      }
    });

    if (!targetFolder) {
      alert("Could not find the data folder in the ZIP file");
      return;
    }

    const newCategories = [];
    const categoriesCsvFile = targetFolder.file("categories.csv");
    if (categoriesCsvFile) {
      const categoriesCsv = await categoriesCsvFile.async("text");
      const lines = categoriesCsv.split("\n").slice(1);
      lines.forEach((line) => {
        if (line.trim()) {
          const [name, japan_name, myanmar_name, chinese_name] =
            parseCSVLine(line);
          if (name && japan_name) {
            newCategories.push({
              name: name.trim(),
              japan_name: japan_name.trim(),
              myanmar_name: myanmar_name ? myanmar_name.trim() : "",
              chinese_name: chinese_name ? chinese_name.trim() : "",
            });
          }
        }
      });
    }

    const newItems = [];
    const itemsCsvFile = targetFolder.file("items.csv");
    if (itemsCsvFile) {
      const itemsCsv = await itemsCsvFile.async("text");
      const lines = itemsCsv.split("\n").slice(1);
      lines.forEach((line) => {
        if (line.trim()) {
          const fields = parseCSVLine(line);
          const [
            Code,
            Name,
            JP_Name,
            MM_Name,
            CN_Name,
            Category,
            Food_Status,
            Restaurant_Section,
            Price,
            Tax,
            Price_Included_Tax,
            Image,
          ] = fields;
          if (Code && Name) {
            newItems.push({
              Code: Code.trim(),
              Name: Name.trim(),
              JP_Name: JP_Name ? JP_Name.trim() : "",
              MM_Name: MM_Name ? MM_Name.trim() : "",
              CN_Name: CN_Name ? CN_Name.trim() : "",
              Category: Category ? Category.trim() : "",
              Food_Status: Food_Status ? Food_Status.trim() : "Available",
              Restaurant_Section: Restaurant_Section
                ? Restaurant_Section.trim()
                : "NongInlay",
              Price: Price ? Price.trim() : "0",
              Tax: Tax ? Tax.trim() : "0",
              Price_Included_Tax: Price_Included_Tax
                ? Price_Included_Tax.trim()
                : "0",
              Image: Image ? Image.trim() : "",
            });
          }
        }
      });
    }

    const newTables = [];
    const tablesCsvFile = targetFolder.file("tables.csv");
    if (tablesCsvFile) {
      const tablesCsv = await tablesCsvFile.async("text");
      const lines = tablesCsv.split("\n").slice(1);
      lines.forEach((line) => {
        if (line.trim()) {
          const [id, number, type, restaurant] = line.split(",");
          if (id && number) {
            newTables.push({
              id: id.trim(),
              number: number.trim(),
              type: type ? type.trim() : "Table",
              restaurant: restaurant ? restaurant.trim() : "NongInlay",
            });
          }
        }
      });
    }

    // This triggers the first renders for text content
    appState.categories = newCategories;
    appState.items = newItems;
    appState.tables = newTables;
    appState.currentZip = zip;

    const loadedImages = {};
    const imagesFolder = targetFolder.folder("images");
    if (imagesFolder) {
      const imagePromises = [];
      imagesFolder.forEach((relativePath, file) => {
        if (!file.dir) {
          // **THE FIX IS HERE**
          // Use the base filename as the key, not the full path.
          const filename = relativePath.split("/").pop();
          const promise = file.async("blob").then((blob) => {
            loadedImages[filename] = blob;
          });
          imagePromises.push(promise);
        }
      });
      await Promise.all(imagePromises);
      // This triggers the final, correct render for the images.
      appState.images = loadedImages;
    }

    alert("Data imported successfully!");
  } catch (error) {
    console.error("Error importing zip file:", error);
    alert("Error importing zip file. Please make sure it contains valid data.");
  }
}

export function exportToZip() {
  if (
    appState.categories.length === 0 ||
    appState.items.length === 0 ||
    appState.tables.length === 0
  ) {
    alert(
      "Please add at least one category, one table and one item before exporting"
    );
    return;
  }

  const zip = new JSZip();
  const today = new Date();
  const folderName = `menu_data_${today.getFullYear()}${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}${today
    .getHours()
    .toString()
    .padStart(2, "0")}${today.getMinutes().toString().padStart(2, "0")}${today
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
  const dataFolder = zip.folder(folderName);
  const imagesFolder = dataFolder.folder("images");

  Object.keys(appState.images).forEach((filename) => {
    const baseFilename = filename.split("/").pop();
    imagesFolder.file(baseFilename, appState.images[filename]);
  });

  let categoriesCsv = "name,japan_name,myanmar_name,chinese_name\n";
  appState.categories.forEach((cat) => {
    categoriesCsv += `${escapeCSVField(cat.name)},${escapeCSVField(
      cat.japan_name
    )},${escapeCSVField(cat.myanmar_name)},${escapeCSVField(
      cat.chinese_name
    )}\n`;
  });

  let itemsCsv =
    "Code,Name,JP Name,MM Name,CN Name,Category,Food Status,Restaurant Section,Price,Tax,Price Included Tax,Image\n";
  appState.items.forEach((item) => {
    itemsCsv += `${escapeCSVField(item.Code)},${escapeCSVField(
      item.Name
    )},${escapeCSVField(item.JP_Name)},${escapeCSVField(
      item.MM_Name
    )},${escapeCSVField(item.CN_Name)},${escapeCSVField(
      item.Category
    )},${escapeCSVField(item.Food_Status)},${escapeCSVField(
      item.Restaurant_Section
    )},${escapeCSVField(item.Price)},${escapeCSVField(
      item.Tax
    )},${escapeCSVField(item.Price_Included_Tax)},${escapeCSVField(
      item.Image
    )}\n`;
  });

  let tablesCsv = "ID,Table Number,Table Type,Sub Restaurant\n";
  appState.tables.forEach((table) => {
    tablesCsv += `${table.id},${table.number},${table.type},${table.restaurant}\n`;
  });

  dataFolder.file("categories.csv", categoriesCsv);
  dataFolder.file("items.csv", itemsCsv);
  dataFolder.file("tables.csv", tablesCsv);

  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, `${folderName}.zip`);
  });
}
