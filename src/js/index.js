import { DatabaseManager } from "./indexedDB.js";

const noteColorInput = document.querySelector("#noteColor");
const addInput = document.querySelector("#addButton");
const mainElement = document.querySelector("main");

let counterID = 0; // Temporal para manejar IDs
let zIndexValue = 1;

// Inicializar IndexedDB
const dbManager = DatabaseManager.getInstance();
dbManager.open().then(() => {
  console.log("Base de datos abierta correctamente.");
  loadNotes(); // Cargar notas al inicio
}).catch((error) => {
  console.error("Error al abrir la base de datos:", error);
});

// Crear nueva nota y guardarla en IndexedDB
addInput.addEventListener("click", () => {
  let noteData = {
    id: counterID, // Asignar un ID temporal antes de guardar
    color: noteColorInput.value,
    content: "",
    x: 100, // Posición inicial predeterminada
    y: 100
  };

  // Crear elemento DOM y agregar al DOM
  let newNote = createNoteElement(noteData);
  mainElement.appendChild(newNote);

  // Guardar la nota en IndexedDB
  dbManager.addData(noteData).then(() => {
    console.log("Nota guardada.");
    counterID++; // Incrementar el ID solo después de guardar exitosamente
  }).catch((error) => {
    console.error("Error al guardar la nota:", error);
  });
});

// Cargar todas las notas al inicio
function loadNotes() {
  dbManager.getAllData().then((notes) => {
    notes.forEach((note) => {
      let newNote = createNoteElement(note);
      mainElement.appendChild(newNote);
      if (note.id >= counterID) {
        counterID = note.id + 1; // Actualizar el ID máximo
      }
    });
  }).catch((error) => {
    console.error("Error al cargar las notas:", error);
  });
}

// Crear un elemento DOM para la nota
function createNoteElement(note) {
  let newNote = document.createElement("div");
  newNote.classList = "note";
  newNote.id = `note-${note.id}`;
  newNote.style.left = `${note.x}px`;
  newNote.style.top = `${note.y}px`;
  newNote.style.position = "absolute";

  let noteHeader = document.createElement("div");
  noteHeader.classList = "noteHeader";
  noteHeader.style.background = note.color;
  noteHeader.innerHTML = `<button class="delete">X</button>`;
  newNote.appendChild(noteHeader);

  let noteContent = document.createElement("div");
  noteContent.classList = "noteContent";
  let textArea = document.createElement("textarea");
  textArea.value = note.content;
  textArea.addEventListener("input", (event) => {
    const updatedContent = event.target.value;
    dbManager.updateData(note.id, { content: updatedContent }).then(() => {
      console.log(`Contenido de la nota con ID ${note.id} actualizado.`);
    }).catch((error) => {
      console.error(`Error al actualizar el contenido de la nota con ID ${note.id}:`, error);
    });
  });
  noteContent.appendChild(textArea);
  newNote.appendChild(noteContent);

  return newNote;
}

// Eliminar una nota tanto del DOM como de IndexedDB
document.addEventListener("click", (event) => {
  if (event.target.classList.contains('delete')) {
    const note = event.target.closest('.note');
    const noteId = parseInt(note.id.replace("note-", ""), 10);

    note.remove(); // Eliminar del DOM

    dbManager.deleteData(noteId).then(() => {
      console.log(`Nota con ID ${noteId} eliminada.`);
    }).catch((error) => {
      console.error(`Error al eliminar la nota con ID ${noteId}:`, error);
    });
  }
});

// Hacer las notas arrastrables y actualizar su posición en IndexedDB
let cursor = { x: null, y: null };
let note = { dom: null, x: null, y: null };

document.addEventListener("mousedown", (event) => {
  if (event.target.classList.contains('noteHeader')) {
    cursor = {
      x: event.clientX,
      y: event.clientY
    };

    let current = event.target.closest('.note');
    let rect = current.getBoundingClientRect();

    note = {
      dom: current,
      x: rect.left,
      y: rect.top
    };

    current.style.cursor = "grabbing";
    current.style.zIndex = zIndexValue;
    zIndexValue++;
  }
});

document.addEventListener("mousemove", (event) => {
  if (note.dom == null) return;

  let currentCursor = {
    x: event.clientX,
    y: event.clientY
  };

  let distance = {
    x: currentCursor.x - cursor.x,
    y: currentCursor.y - cursor.y
  };

  note.dom.style.left = (note.x + distance.x) + "px";
  note.dom.style.top = (note.y + distance.y) + "px";
});

document.addEventListener("mouseup", (event) => {
  if (note.dom) {
    let noteId = parseInt(note.dom.id.replace("note-", ""), 10);
    let updatedPosition = {
      x: parseInt(note.dom.style.left, 10),
      y: parseInt(note.dom.style.top, 10)
    };

    // Actualizar posición en IndexedDB
    dbManager.updateData(noteId, updatedPosition).then(() => {
      console.log(`Posición de la nota con ID ${noteId} actualizada.`);
    }).catch((error) => {
      console.error(`Error al actualizar la posición de la nota con ID ${noteId}:`, error);
    });

    note.dom.style.cursor = "grab";
    note.dom = null;
  }
});


