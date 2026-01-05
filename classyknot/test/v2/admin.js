let data = {};
const topicSelect = document.getElementById("topicSelect");
const subTopicSelect = document.getElementById("subTopicSelect");
const titleSelect = document.getElementById("titleSelect");
const contentInput = document.getElementById("contentInput");
const preview = document.getElementById("preview");

fetch("notes.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    loadTopics();
  });

function loadTopics() {
  topicSelect.innerHTML = "";
  Object.keys(data).forEach(t => addOption(topicSelect, t));
  topicSelect.onchange = loadSubTopics;
  loadSubTopics();
}

function loadSubTopics() {
  subTopicSelect.innerHTML = "";
  const topic = topicSelect.value;
  if (!data[topic]) return;

  Object.keys(data[topic]).forEach(st =>
    addOption(subTopicSelect, st)
  );
  subTopicSelect.onchange = loadTitles;
  loadTitles();
}

function loadTitles() {
  titleSelect.innerHTML = "";
  const topic = topicSelect.value;
  const sub = subTopicSelect.value;
  const notes = data?.[topic]?.[sub];
  if (!Array.isArray(notes)) return;

  notes.forEach(n => addOption(titleSelect, n.title));
  titleSelect.onchange = loadContent;
}

function loadContent() {
  const note = getSelectedNote();
  contentInput.value = note ? note.content : "";
  updatePreview();
}

function updatePreview() {
  preview.innerHTML = marked.parse(contentInput.value || "");
}

contentInput.oninput = updatePreview;

/* CREATE / ADD */
function addTopic() {
  const t = document.getElementById("newTopic").value;
  if (!t) return;
  data[t] = {};
  loadTopics();
}

function addSubTopic() {
  const t = topicSelect.value;
  const st = document.getElementById("newSubTopic").value;
  if (!st) return;
  data[t][st] = [];
  loadSubTopics();
}

function addTitle() {
  const title = document.getElementById("newTitle").value;
  if (!title) return;
  const t = topicSelect.value;
  const st = subTopicSelect.value;

  data[t][st].push({
    id: Date.now(),
    title,
    difficulty: "Beginner",
    tags: [],
    lastUpdated: new Date().toISOString().split("T")[0],
    content: ""
  });
  loadTitles();
}

/* SAVE */
function saveNote() {
  const note = getSelectedNote();
  if (!note) return;

  note.content = contentInput.value;
  note.lastUpdated = new Date().toISOString().split("T")[0];

  alert("Saved locally. Download updated JSON.");
  downloadJSON();
}

function getSelectedNote() {
  const t = topicSelect.value;
  const st = subTopicSelect.value;
  const title = titleSelect.value;
  return data?.[t]?.[st]?.find(n => n.title === title);
}

/* UTILS */
function addOption(select, value) {
  const o = document.createElement("option");
  o.textContent = value;
  select.appendChild(o);
}

function downloadJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "notes.json";
  a.click();
}
