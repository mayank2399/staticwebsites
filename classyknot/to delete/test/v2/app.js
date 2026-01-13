const notesList = document.getElementById("notesList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const meta = document.getElementById("meta");
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("topMenuBtn");

menuBtn.onclick = () => sidebar.classList.toggle("open");

let notesIndex = {};


const searchInput = document.getElementById("searchInput");
let originalData = {};



fetch("notes.json")
  .then(res => res.json())
  .then(data => {
    originalData = data;
    renderSidebar(data);
    loadFromUrl();
  });

function renderSidebar(data) {
  notesList.innerHTML = "";
  notesIndex = {};
  renderLevel(data, notesList, 0);
}

function renderLevel(node, container, level) {
  Object.entries(node).forEach(([key, value]) => {
    const li = document.createElement("li");
    li.textContent = key;
    li.style.marginLeft = `${level * 12}px`;
    li.style.fontWeight = "600";

    const childContainer = document.createElement("ul");
    childContainer.style.display = "none";

    li.onclick = (e) => {
      e.stopPropagation();
      childContainer.style.display =
        childContainer.style.display === "none" ? "block" : "none";
    };

    container.appendChild(li);
    container.appendChild(childContainer);

    // CASE 1: Leaf node → array of notes
    if (Array.isArray(value)) {
      value.forEach(note => {
        const slug = slugify(note.title);
        notesIndex[slug] = note;

        const noteLi = document.createElement("li");
        noteLi.textContent = "– " + note.title;
        noteLi.style.marginLeft = `${(level + 1) * 12}px`;

        noteLi.onclick = (e) => {
          e.stopPropagation();
          openNote(note);
        };

        childContainer.appendChild(noteLi);
      });
    }

    // CASE 2: Nested object → recurse
    else if (typeof value === "object") {
      renderLevel(value, childContainer, level + 1);
    }
  });
}


function createItem(text, bold = false, margin = 0) {
  const li = document.createElement("li");
  li.textContent = text;
  li.style.marginLeft = margin + "px";
  if (bold) li.style.fontWeight = "600";
  return li;
}

function toggle(el) {
  el.style.display = el.style.display === "none" ? "block" : "none";
}

function openNote(note) {
  const slug = slugify(note.title);
  const url = new URL(window.location);
  url.searchParams.set("note", slug);
  history.pushState({}, "", url);

  renderNote(note);
  sidebar.classList.remove("open");
}

function renderNote(note) {
  noteTitle.textContent = note.title;
  meta.textContent = `${note.difficulty} | Updated: ${note.lastUpdated}`;
  noteContent.innerHTML = marked.parse(embedVideos(note.content));
  Prism.highlightAll();
}

function embedVideos(md) {
  return md.replace(
    /(https:\/\/www\.youtube\.com\/watch\?v=([\w-]+))/g,
    `<iframe width="100%" height="360" src="https://www.youtube.com/embed/$2" frameborder="0" allowfullscreen></iframe>`
  );
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function loadFromUrl() {
  const slug = new URLSearchParams(window.location.search).get("note");
  if (slug && notesIndex[slug]) {
    renderNote(notesIndex[slug]);
  }
}
searchInput.addEventListener("input", e => {
  const query = e.target.value.toLowerCase().trim();

  if (!query) {
    renderSidebar(originalData);
    return;
  }

  const filtered = {};

  Object.entries(originalData).forEach(([topic, subtopics]) => {
    Object.entries(subtopics).forEach(([subtopic, notes]) => {
      const matchedNotes = notes.filter(note =>
        topic.toLowerCase().includes(query) ||
        subtopic.toLowerCase().includes(query) ||
        note.title.toLowerCase().includes(query)
      );

      if (matchedNotes.length) {
        if (!filtered[topic]) filtered[topic] = {};
        filtered[topic][subtopic] = matchedNotes;
      }
    });
  });

  renderSidebar(filtered);
});
