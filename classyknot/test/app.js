const notesList = document.getElementById("notesList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const meta = document.getElementById("meta");
const sidebar = document.querySelector(".sidebar");
const menuBtn = document.getElementById("menuBtn");

menuBtn.onclick = () => sidebar.classList.toggle("open");

let notesIndex = {};

fetch("notes.json")
  .then(res => res.json())
  .then(data => {
    notesIndex = buildIndex(data);
    renderSidebar(data);
    loadFromUrl();
  });

function renderSidebar(data) {
  notesList.innerHTML = "";

  Object.entries(data).forEach(([section, topics]) => {
    addItem(section, true);

    Object.entries(topics).forEach(([topic, notes]) => {
      addItem("▸ " + topic, true, 10);

      notes.forEach(note => {
        const slug = slugify(note.title);
        notesIndex[slug] = note;
        const li = addItem("– " + note.title, false, 25);
        li.onclick = () => openNote(note);
      });
    });
  });
}

function addItem(text, bold = false, margin = 0) {
  const li = document.createElement("li");
  li.textContent = text;
  li.style.marginLeft = margin + "px";
  if (bold) li.style.fontWeight = "bold";
  notesList.appendChild(li);
  return li;
}
function openNote(note) {
  const slug = slugify(note.title);

  const url = new URL(window.location);
  url.searchParams.set("note", slug);
  history.pushState({}, "", url);

  renderNote(note);
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

function buildIndex(data) {
  const index = {};
  Object.values(data).forEach(topics =>
    Object.values(topics).forEach(notes =>
      notes.forEach(n => index[slugify(n.title)] = n)
    )
  );
  return index;
}

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("note");

  if (slug && notesIndex[slug]) {
    renderNote(notesIndex[slug]);
  }
}

function renderNote(note) {
  noteTitle.textContent = note.title;
  meta.textContent = `${note.difficulty} | Updated: ${note.lastUpdated}`;
  noteContent.innerHTML = marked.parse(embedVideos(note.content));
  Prism.highlightAll();
}

