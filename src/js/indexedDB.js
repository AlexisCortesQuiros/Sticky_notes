import { INDEXDB_NAME, INDEXDB_VERSION, STORE_NAME } from "./constants.js";

export class DatabaseManager {

  constructor(databaseName, databaseVersion) {
    this.databaseName = databaseName;
    this.databaseVersion = databaseVersion;
    this.db = null;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new DatabaseManager(INDEXDB_NAME, INDEXDB_VERSION);
    }
    return this.instance;
  }

  open() {
    return new Promise((resolve, reject) => {
      let request = indexedDB.open(this.databaseName, this.databaseVersion);

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };

      request.onupgradeneeded = (event) => {
        let db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }

  addData(data) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject("La base de datos no está abierta.");
      }

      let transaction = this.db.transaction([STORE_NAME], "readwrite");
      let objectStore = transaction.objectStore(STORE_NAME);

      let request = objectStore.add(data);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  getAllData() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject("La base de datos no está abierta.");
      }

      let transaction = this.db.transaction([STORE_NAME], "readonly");
      let objectStore = transaction.objectStore(STORE_NAME);
      let request = objectStore.getAll();

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  deleteData(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject("La base de datos no está abierta.");
      }

      let transaction = this.db.transaction([STORE_NAME], "readwrite");
      let objectStore = transaction.objectStore(STORE_NAME);

      let request = objectStore.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  updateData(id, newData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject("La base de datos no está abierta.");
      }

      let transaction = this.db.transaction([STORE_NAME], "readwrite");
      let objectStore = transaction.objectStore(STORE_NAME);

      let request = objectStore.get(id);

      request.onsuccess = (event) => {
        let existingData = event.target.result;

        if (existingData) {
          let updatedData = { ...existingData, ...newData };
          let updateRequest = objectStore.put(updatedData);

          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = (event) => reject(event.target.error);
        } else {
          reject(`No se encontró el registro con ID: ${id}`);
        }
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }
}
