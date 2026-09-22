const STORAGE_KEY = "monPlanningCours";
const SPLIT_HOURS_KEY = "monPlanningHeuresDivisees";
const DISMISSED_TIPS_KEY = "monPlanningAstucesFermees";
const ESPACE_KEY = "monPlanningEspaceActuel";
const PERSONNES_KEY = "monPlanningPersonnes";
const ANIMAUX_KEY = "monPlanningAnimaux";
const ASSIGNATIONS_KEY = "monPlanningAssignations";
const TODO_LISTES_KEY = "monPlanningTodoListes";
const TODO_ITEMS_KEY = "monPlanningTodoItems";
const TODO_LISTE_ACTUELLE_KEY = "monPlanningTodoListeActuelle";

const ESPACES = [
  { id: "solo", label: "Solo", emoji: "🙋" },
  { id: "entreprise", label: "Entreprise", emoji: "🏢" },
  { id: "famille", label: "Famille", emoji: "👨‍👩‍👧" },
];

function currentEspace() {
  return localStorage.getItem(ESPACE_KEY) || "solo";
}

function setCurrentEspace(espace) {
  localStorage.setItem(ESPACE_KEY, espace);
}

// Solo garde les clés d'origine (rétrocompatible avec les données déjà créées) ; Entreprise et
// Famille ont chacun leurs propres clés, totalement indépendantes des autres espaces.
function spaceKey(baseKey) {
  const espace = currentEspace();
  return espace === "solo" ? baseKey : `${baseKey}_${espace}`;
}

// Astuces affichées près de leur fonctionnalité, et retrouvables dans le menu "Astuces".
// Pour en ajouter une : ajouter un objet {id, containerId, text} ici.
const TIPS = [
  {
    id: "diviser-heure",
    containerId: "hintWeek",
    text: "Clique dans une case horaire, sur le jour de ton choix, pour diviser seulement cette heure-là en demi-heures.",
  },
  {
    id: "mois-important",
    containerId: "hintMonth",
    text: "Seules les activités marquées « Important » ou « Très important » apparaissent dans la vue Mois. Les « Très important » sont encadrées en rouge.",
  },
  {
    id: "import-ics",
    containerId: null,
    text: "Dans le menu, l'onglet « 📥 Importer » lit un fichier .ics (export d'emploi du temps Pronote ou autre) et remplit ton planning automatiquement.",
  },
];
const DAY_START_MIN = 0;
const DAY_END_MIN = 24 * 60;
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const RANGE_KEY = "monPlanningPlageHoraire";
const THEME_KEY = "monPlanningTheme";
const USER_KEY = "monPlanningUser";
const SEMAINE_A_REF_KEY = "monPlanningSemaineARef";
const ZONE_VACANCES_KEY = "monPlanningZoneVacances";
const MIN_BLOCK_HEIGHT_WITH_TEXT = 20;

// Dates officielles 2026-2027 (education.gouv.fr). À vérifier/mettre à jour chaque année scolaire.
const VACANCES_SCOLAIRES = {
  commun: [
    { debut: "2026-10-17", fin: "2026-11-02", label: "Toussaint" },
    { debut: "2026-12-19", fin: "2027-01-04", label: "Noël" },
  ],
  A: [
    { debut: "2027-02-13", fin: "2027-03-01", label: "Hiver" },
    { debut: "2027-04-10", fin: "2027-04-26", label: "Printemps" },
  ],
  B: [
    { debut: "2027-02-20", fin: "2027-03-08", label: "Hiver" },
    { debut: "2027-04-17", fin: "2027-05-03", label: "Printemps" },
  ],
  C: [
    { debut: "2027-02-06", fin: "2027-02-22", label: "Hiver" },
    { debut: "2027-04-03", fin: "2027-04-19", label: "Printemps" },
  ],
  ete: [{ debut: "2027-07-03", fin: "2027-09-01", label: "Été" }],
};

// Thèmes disponibles dans le menu "Thème". Pour en ajouter un : un objet {id, label, swatch}
// ici, plus le bloc de variables CSS correspondant dans style.css ([data-theme="id"] { ... }).
const THEMES = [
  { id: "clair", label: "Clair", swatch: ["#F7F7FB", "#6C63FF", "#22223B"] },
  { id: "pastel", label: "Pastel", swatch: ["#F5EAFC", "#B565D8", "#3D2E52"] },
  { id: "nature", label: "Nature", swatch: ["#E8F2DC", "#3E8E3E", "#21301F"] },
  { id: "vibrant", label: "Vibrant", swatch: ["#FFF1D6", "#FF3B3B", "#241214"] },
  { id: "ardoise", label: "Ardoise", swatch: ["#E7E9EC", "#5B6EE1", "#2B2E33"] },
  { id: "sombre", label: "Sombre", swatch: ["#1A1A24", "#8B80FF", "#EAEAF2"] },
  { id: "ocean", label: "Océan", swatch: ["#0D1B2A", "#4FC3F7", "#E6F1FF"] },
];

let referenceDate = new Date();
let dayReferenceDate = new Date();
let currentView = "semaine";
// Hauteur du calendrier affiché : recalculée à chaque rendu pour tenir sur l'écran sans scroll.
let CALENDAR_HEIGHT = 600;
// Plage d'heures visible (en minutes) ; réduire la plage "zoome" sur ces heures.
let VIEW_START_MIN = 0;
let VIEW_END_MIN = DAY_END_MIN;

// Calcule la hauteur disponible sous l'élément (jusqu'en bas de l'écran) pour éviter le scroll vertical.
function computeCalendarHeight(el) {
  const top = el.getBoundingClientRect().top;
  const available = window.innerHeight - top - 24;
  return Math.max(280, Math.round(available));
}

function loadRange() {
  try {
    const saved = JSON.parse(localStorage.getItem(spaceKey(RANGE_KEY)));
    if (saved && Number.isInteger(saved.start) && Number.isInteger(saved.end) && saved.start < saved.end) {
      return saved;
    }
  } catch {}
  return { start: 0, end: 24 };
}

function saveRange(range) {
  localStorage.setItem(spaceKey(RANGE_KEY), JSON.stringify(range));
}

function applyRange(range) {
  VIEW_START_MIN = range.start * 60;
  VIEW_END_MIN = range.end * 60;
}

function loadCourses() {
  try {
    return JSON.parse(localStorage.getItem(spaceKey(STORAGE_KEY))) || [];
  } catch {
    return [];
  }
}

function saveCourses(courses) {
  localStorage.setItem(spaceKey(STORAGE_KEY), JSON.stringify(courses));
}

function splitKey(jour, hour) {
  return `${jour}-${hour}`;
}

function loadSplitHours() {
  try {
    return new Set(JSON.parse(localStorage.getItem(spaceKey(SPLIT_HOURS_KEY))) || []);
  } catch {
    return new Set();
  }
}

function saveSplitHours(set) {
  localStorage.setItem(spaceKey(SPLIT_HOURS_KEY), JSON.stringify(Array.from(set)));
}

function toggleSplitHour(jour, hour) {
  const splitHours = loadSplitHours();
  const key = splitKey(jour, hour);
  if (splitHours.has(key)) {
    splitHours.delete(key);
  } else {
    splitHours.add(key);
  }
  saveSplitHours(splitHours);
  renderCalendar();
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTop(min) {
  return ((min - VIEW_START_MIN) / (VIEW_END_MIN - VIEW_START_MIN)) * CALENDAR_HEIGHT;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function loadSemaineARef() {
  return localStorage.getItem(spaceKey(SEMAINE_A_REF_KEY)) || toISODate(getMonday(new Date()));
}

function saveSemaineARef(dateISO) {
  localStorage.setItem(spaceKey(SEMAINE_A_REF_KEY), dateISO);
}

// "A" ou "B" selon le nombre de semaines écoulées depuis la référence (un lundi de semaine A).
function getWeekLetter(date) {
  const ref = getMonday(new Date(loadSemaineARef() + "T00:00:00"));
  const monday = getMonday(date);
  const diffWeeks = Math.round((monday - ref) / (7 * 86400000));
  return ((diffWeeks % 2) + 2) % 2 === 0 ? "A" : "B";
}

function loadZoneVacances() {
  return localStorage.getItem(spaceKey(ZONE_VACANCES_KEY)) || "aucune";
}

function saveZoneVacances(zone) {
  localStorage.setItem(spaceKey(ZONE_VACANCES_KEY), zone);
}

function loadPersonnes() {
  try {
    return JSON.parse(localStorage.getItem(spaceKey(PERSONNES_KEY))) || [];
  } catch {
    return [];
  }
}

function savePersonnes(personnes) {
  localStorage.setItem(spaceKey(PERSONNES_KEY), JSON.stringify(personnes));
}

function loadAnimaux() {
  try {
    return JSON.parse(localStorage.getItem(spaceKey(ANIMAUX_KEY))) || [];
  } catch {
    return [];
  }
}

function saveAnimaux(animaux) {
  localStorage.setItem(spaceKey(ANIMAUX_KEY), JSON.stringify(animaux));
}

function loadTodoListes() {
  try {
    return JSON.parse(localStorage.getItem(spaceKey(TODO_LISTES_KEY))) || [];
  } catch {
    return [];
  }
}

function saveTodoListes(listes) {
  localStorage.setItem(spaceKey(TODO_LISTES_KEY), JSON.stringify(listes));
}

function loadTodoItems() {
  try {
    return JSON.parse(localStorage.getItem(spaceKey(TODO_ITEMS_KEY))) || [];
  } catch {
    return [];
  }
}

function saveTodoItems(items) {
  localStorage.setItem(spaceKey(TODO_ITEMS_KEY), JSON.stringify(items));
}

function loadCurrentTodoListeId() {
  return localStorage.getItem(spaceKey(TODO_LISTE_ACTUELLE_KEY)) || null;
}

function saveCurrentTodoListeId(id) {
  localStorage.setItem(spaceKey(TODO_LISTE_ACTUELLE_KEY), id || "");
}

function loadAssignations() {
  try {
    return JSON.parse(localStorage.getItem(spaceKey(ASSIGNATIONS_KEY))) || [];
  } catch {
    return [];
  }
}

function saveAssignations(assignations) {
  localStorage.setItem(spaceKey(ASSIGNATIONS_KEY), JSON.stringify(assignations));
}

// Vrai si cette date tombe pendant les vacances scolaires (communes, de la zone choisie, ou l'été).
function isDuringVacances(date) {
  const zone = loadZoneVacances();
  if (zone === "aucune") return false;
  const iso = toISODate(date);
  const periodes = [...VACANCES_SCOLAIRES.commun, ...(VACANCES_SCOLAIRES[zone] || []), ...VACANCES_SCOLAIRES.ete];
  return periodes.some((p) => iso >= p.debut && iso <= p.fin);
}

function formatDateShort(date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// --- Import de fichier .ics (export d'emploi du temps type Pronote) ---

function formatHHMM(date) {
  return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}

function unescapeICSText(s) {
  return s.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

// "20240902T080000" (local), "20240902T060000Z" (UTC) ou "20240902" (jour entier).
function parseICSDateTime(raw) {
  const isUTC = raw.endsWith("Z");
  const clean = raw.replace("Z", "");
  const year = Number(clean.slice(0, 4));
  const month = Number(clean.slice(4, 6)) - 1;
  const day = Number(clean.slice(6, 8));
  let hour = 0, minute = 0, second = 0;
  if (clean.length > 8 && clean[8] === "T") {
    hour = Number(clean.slice(9, 11));
    minute = Number(clean.slice(11, 13));
    second = Number(clean.slice(13, 15)) || 0;
  }
  return isUTC ? new Date(Date.UTC(year, month, day, hour, minute, second)) : new Date(year, month, day, hour, minute, second);
}

// Découpe le texte .ics en événements {CLE: valeur}, en recollant les lignes repliées (RFC 5545).
function parseICS(text) {
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const lines = [];
  rawLines.forEach((line) => {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else if (line.trim() !== "") {
      lines.push(line);
    }
  });

  const events = [];
  let current = null;
  lines.forEach((line) => {
    if (line === "BEGIN:VEVENT") {
      current = {};
    } else if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) return;
      const key = line.slice(0, colonIndex).split(";")[0].toUpperCase();
      current[key] = line.slice(colonIndex + 1);
    }
  });
  return events;
}

// Regroupe les occurrences par (jour de semaine, horaires, titre) : si un cours revient
// plusieurs fois, on le recrée en activité "Hebdomadaire" plutôt qu'en dizaines d'entrées.
function importICSFile(text) {
  const events = parseICS(text);
  const groups = new Map();

  events.forEach((ev) => {
    if (!ev.DTSTART || !ev.DTEND || !ev.SUMMARY) return;
    const start = parseICSDateTime(ev.DTSTART);
    const end = parseICSDateTime(ev.DTEND);
    const title = unescapeICSText(ev.SUMMARY).trim();
    if (!title) return;
    const weekday = (start.getDay() + 6) % 7;
    const key = `${weekday}|${formatHHMM(start)}|${formatHHMM(end)}|${title.toLowerCase()}`;

    if (!groups.has(key)) {
      groups.set(key, {
        weekday,
        heureDebut: formatHHMM(start),
        heureFin: formatHHMM(end),
        title,
        location: ev.LOCATION ? unescapeICSText(ev.LOCATION).trim() : "",
        dates: [],
      });
    }
    groups.get(key).dates.push(toISODate(start));
  });

  const getColor = createColorAssigner();

  const courses = loadCourses();
  let countRecurrent = 0;
  let countPonctuel = 0;

  groups.forEach((group) => {
    const dates = group.dates.slice().sort();
    const isRecurrent = dates.length > 1;
    const base = {
      id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
      activite: group.title,
      salle: group.location,
      prof: "",
      heureDebut: group.heureDebut,
      heureFin: group.heureFin,
      importance: "faible",
      couleur: getColor(group.title),
    };

    if (isRecurrent) {
      courses.push({
        ...base,
        type: "hebdomadaire",
        jour: String(group.weekday),
        date: null,
        dateDebut: dates[0],
        fin: "date_fin",
        dateFin: dates[dates.length - 1],
        nombreOccurrences: null,
      });
      countRecurrent++;
    } else {
      courses.push({
        ...base,
        type: "ponctuel",
        jour: null,
        date: dates[0],
        dateDebut: null,
        fin: null,
        dateFin: null,
        nombreOccurrences: null,
      });
      countPonctuel++;
    }
  });

  saveCourses(courses);
  return { countRecurrent, countPonctuel };
}

function handleICSFileSelected(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const { countRecurrent, countPonctuel } = importICSFile(reader.result);
    const total = countRecurrent + countPonctuel;
    if (total === 0) {
      alert("Aucun événement reconnu dans ce fichier. Vérifie que c'est bien un export .ics d'emploi du temps.");
      return;
    }
    closeMenuDetail();
    alert(
      `Import terminé : ${total} activité(s) ajoutée(s)\n` +
        `— ${countRecurrent} récurrente(s) chaque semaine\n` +
        `— ${countPonctuel} ponctuelle(s)`
    );
    switchView(currentView);
  };
  reader.readAsText(file);
}

// --- Import de fichier .pdf (extraction de texte + détection heuristique) ---

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const DAY_NAMES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const TIME_RANGE_REGEX = /(\d{1,2})\s*[h:]\s*(\d{2})?\s*(?:-|–|à)\s*(\d{1,2})\s*[h:]\s*(\d{2})?/i;

// Reconstruit des lignes de texte lisibles à partir des items positionnés du PDF
// (regroupés par position verticale, puis triés de gauche à droite).
function reconstructLinesFromPDF(items) {
  const rows = new Map();
  items.forEach((item) => {
    const y = Math.round(item.transform[5] / 2) * 2;
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push(item);
  });
  return Array.from(rows.keys())
    .sort((a, b) => b - a) // le PDF mesure Y du bas vers le haut : on veut le haut de page d'abord
    .map((y) =>
      rows
        .get(y)
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map((it) => it.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((line) => line.length > 0);
}

async function extractPDFData(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const items = [];
  const rects = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    items.push(...content.items);
    const opList = await page.getOperatorList();
    rects.push(...extractColoredRects(opList));
  }
  return { items, rects };
}

// Reconstruit, à partir des instructions de dessin du PDF, les rectangles remplis d'une couleur
// (le fond coloré de chaque case de cours) — bien plus fiable que le texte pour connaître la vraie
// taille d'une case, y compris quand elle est plus longue que le peu de texte qu'elle contient.
function extractColoredRects(opList) {
  const OPS = pdfjsLib.OPS;

  function multiplyMatrices(m1, m2) {
    return [
      m1[0] * m2[0] + m1[1] * m2[2],
      m1[0] * m2[1] + m1[1] * m2[3],
      m1[2] * m2[0] + m1[3] * m2[2],
      m1[2] * m2[1] + m1[3] * m2[3],
      m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
      m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
    ];
  }
  function applyMatrix(m, x, y) {
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  }

  let ctmStack = [[1, 0, 0, 1, 0, 0]];
  let currentColor = null;
  let pendingPath = null;
  const rects = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];
    if (fn === OPS.save) {
      ctmStack.push(ctmStack[ctmStack.length - 1].slice());
    } else if (fn === OPS.restore) {
      ctmStack.pop();
    } else if (fn === OPS.transform) {
      ctmStack[ctmStack.length - 1] = multiplyMatrices(args, ctmStack[ctmStack.length - 1]);
    } else if (fn === OPS.setFillRGBColor) {
      currentColor = Array.from(args);
    } else if (fn === OPS.constructPath) {
      pendingPath = args;
    } else if (fn === OPS.fill) {
      if (pendingPath) {
        const ctm = ctmStack[ctmStack.length - 1];
        const [opsArr, coords] = pendingPath;
        let ci = 0;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const addPoint = (px, py) => {
          const [dx, dy] = applyMatrix(ctm, px, py);
          minX = Math.min(minX, dx);
          maxX = Math.max(maxX, dx);
          minY = Math.min(minY, dy);
          maxY = Math.max(maxY, dy);
        };
        opsArr.forEach((op) => {
          if (op === OPS.rectangle) {
            const x = coords[ci++], y = coords[ci++], w = coords[ci++], h = coords[ci++];
            addPoint(x, y);
            addPoint(x + w, y + h);
          } else if (op === OPS.moveTo || op === OPS.lineTo) {
            addPoint(coords[ci++], coords[ci++]);
          } else if (op === OPS.curveTo) {
            for (let k = 0; k < 3; k++) addPoint(coords[ci++], coords[ci++]);
          }
        });
        if (isFinite(minX)) {
          rects.push({ minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY, color: currentColor });
        }
      }
      pendingPath = null;
    }
  }
  return rects;
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Le repère horaire connu le plus proche d'une position verticale donnée.
function nearestCalibrationPoint(pos, calibrationPoints) {
  let best = calibrationPoints[0];
  let bestDist = Math.abs(pos - best.pos);
  calibrationPoints.forEach((p) => {
    const dist = Math.abs(pos - p.pos);
    if (dist < bestDist) {
      best = p;
      bestDist = dist;
    }
  });
  return best;
}

function minutesToHHMM(minutes) {
  const rounded = ((Math.round(minutes / 5) * 5) % 1440 + 1440) % 1440;
  return `${String(Math.floor(rounded / 60)).padStart(2, "0")}:${String(rounded % 60).padStart(2, "0")}`;
}

function isWhite(color) {
  return color && color[0] === 255 && color[1] === 255 && color[2] === 255;
}

// Reconnaît une grille type Pronote/Index Éducation à partir des cases colorées dessinées dans le
// PDF (bien plus fiable que le texte pour la durée d'un cours) : les jours forment les en-têtes de
// colonnes, les heures une règle verticale à gauche, et chaque case colorée est un cours.
function detectGridSchedule(rawItems, rects) {
  // On utilise le centre du texte (x + largeur/2), pas son bord gauche : plus fiable pour
  // repérer dans quelle colonne (jour) un morceau de texte tombe réellement.
  const items = rawItems
    .map((it) => ({ text: it.str.trim(), x: it.transform[4] + (it.width || 0) / 2, y: it.transform[5] }))
    .filter((it) => it.text);

  const dayHeaders = items.filter((it) => DAY_NAMES.includes(it.text.toLowerCase()));
  if (dayHeaders.length < 2) return []; // pas assez de colonnes pour reconnaître une grille

  const sortedDays = dayHeaders.slice().sort((a, b) => a.x - b.x);
  const columns = sortedDays.map((d, i) => ({
    day: DAY_NAMES.indexOf(d.text.toLowerCase()),
    xMin: i === 0 ? -Infinity : (sortedDays[i - 1].x + d.x) / 2,
    xMax: i === sortedDays.length - 1 ? Infinity : (d.x + sortedDays[i + 1].x) / 2,
  }));

  const TIME_LABEL_REGEX = /^(\d{1,2})h(\d{2})$/;
  const timeLabels = items.filter((it) => TIME_LABEL_REGEX.test(it.text));
  if (timeLabels.length < 2) return []; // pas de règle horaire exploitable

  const calibrationPoints = timeLabels.map((it) => {
    const m = it.text.match(TIME_LABEL_REGEX);
    return { pos: it.y, minutes: Number(m[1]) * 60 + Number(m[2]) };
  });

  const headerY = Math.max(...dayHeaders.map((d) => d.y));
  const excludedTexts = new Set([...DAY_NAMES, ...timeLabels.map((t) => t.text.toLowerCase())]);

  const courseRects = (rects || []).filter((r) => {
    if (r.h <= 15 || r.w <= 30) return false; // trop petit pour être une case de cours
    if (r.maxY >= headerY) return false; // au-dessus de la grille
    if (isWhite(r.color)) return false; // case vide
    const centerX = (r.minX + r.maxX) / 2;
    return columns.some((c) => centerX >= c.xMin && centerX < c.xMax);
  });
  if (courseRects.length === 0) return []; // pas de rectangles exploitables, on laissera le repli texte s'en charger

  // Le bord d'une case colorée ne tombe pas exactement sur le repère horaire (marge de rendu) ;
  // on mesure ce décalage sur ce fichier précis plutôt que de coder une valeur fixe qui ne
  // généraliserait pas à d'autres exports. On ne se calibre que sur le tout premier cours de
  // chaque jour : les cours suivants sont trop proches d'autres repères et faussent la mesure
  // (ex. un cours à 9h peut sembler plus proche du repère 8h55 que de 9h00).
  const firstOfDayRects = columns
    .map((col) => courseRects.filter((r) => { const cx = (r.minX + r.maxX) / 2; return cx >= col.xMin && cx < col.xMax; }))
    .filter((rectsInCol) => rectsInCol.length > 0)
    .map((rectsInCol) => rectsInCol.reduce((a, b) => (a.maxY > b.maxY ? a : b)));

  const calibrationRects = firstOfDayRects.length > 0 ? firstOfDayRects : courseRects;
  const topOffset = median(calibrationRects.map((r) => r.maxY - nearestCalibrationPoint(r.maxY, calibrationPoints).pos));
  const bottomOffset = median(calibrationRects.map((r) => r.minY - nearestCalibrationPoint(r.minY, calibrationPoints).pos));

  const candidates = [];
  courseRects.forEach((rect) => {
    const centerX = (rect.minX + rect.maxX) / 2;
    const col = columns.find((c) => centerX >= c.xMin && centerX < c.xMax);
    if (!col) return;

    const heureDebut = minutesToHHMM(nearestCalibrationPoint(rect.maxY - topOffset, calibrationPoints).minutes);
    const heureFin = minutesToHHMM(nearestCalibrationPoint(rect.minY - bottomOffset, calibrationPoints).minutes);
    if (heureFin <= heureDebut) return; // case suspecte, on l'ignore

    const textsIn = items
      .filter((it) => !excludedTexts.has(it.text.toLowerCase()) && !/^[A-Z]$/.test(it.text))
      .filter((it) => it.x >= rect.minX - 5 && it.x <= rect.maxX + 5 && it.y <= rect.maxY + 2 && it.y >= rect.minY - 2)
      .sort((a, b) => b.y - a.y);
    if (textsIn.length === 0) return;

    candidates.push({
      activite: textsIn[0].text,
      prof: textsIn.length > 1 ? textsIn[1].text : "",
      salle: textsIn.length > 2 ? textsIn[textsIn.length - 1].text : "",
      jour: col.day,
      heureDebut,
      heureFin,
    });
  });

  return candidates;
}

// Repère, ligne par ligne, les horaires (obligatoires pour qu'on retienne la ligne) et le jour
// le plus proche vu au-dessus (les grilles PDF ont souvent le jour en en-tête, pas sur chaque ligne).
function detectScheduleEntries(lines) {
  const candidates = [];
  let lastDay = null;

  lines.forEach((line, index) => {
    const dayMatch = DAY_NAMES.find((d) => new RegExp(`\\b${d}\\b`, "i").test(line));
    if (dayMatch) lastDay = dayMatch;

    const timeMatch = line.match(TIME_RANGE_REGEX);
    if (!timeMatch) return;

    const heureDebut = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2] || "00"}`;
    const heureFin = `${timeMatch[3].padStart(2, "0")}:${timeMatch[4] || "00"}`;

    let rest = line
      .replace(TIME_RANGE_REGEX, "")
      .replace(dayMatch ? new RegExp(`\\b${dayMatch}\\b`, "i") : "", "")
      .replace(/\s+/g, " ")
      .trim();

    // Certains exports mettent le nom de l'activité sur la ligne suivante plutôt que sur celle-ci.
    if (!rest && lines[index + 1]) rest = lines[index + 1].trim();
    if (!rest) rest = "Activité importée";

    candidates.push({
      activite: rest,
      jour: lastDay ? DAY_NAMES.indexOf(lastDay) : 0,
      heureDebut,
      heureFin,
      salle: "",
    });
  });

  return candidates;
}

async function handlePDFFileSelected(file) {
  const { items: rawItems, rects } = await extractPDFData(file);

  let candidates = [];
  try {
    candidates = detectGridSchedule(rawItems, rects);
  } catch (err) {
    console.error("Détection en grille impossible :", err);
  }

  if (candidates.length === 0) {
    const lines = reconstructLinesFromPDF(rawItems);
    candidates = detectScheduleEntries(lines).map((c) => ({ ...c, prof: "" }));
  }

  if (candidates.length === 0) {
    alert(
      "Aucune activité n'a pu être détectée dans ce PDF. Le format n'est peut-être pas compatible — " +
        "essaie plutôt un export .ics si ton outil le propose."
    );
    return;
  }
  openPdfReview(candidates);
}

function buildPdfReviewRow(candidate) {
  const row = document.createElement("div");
  row.className = "pdf-review-row";

  const top = document.createElement("div");
  top.className = "pdf-review-row-top";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = true;
  checkbox.className = "pdf-check";
  checkbox.title = "Importer cette ligne";

  const activiteInput = document.createElement("input");
  activiteInput.type = "text";
  activiteInput.className = "pdf-activite";
  activiteInput.value = candidate.activite;

  const jourSelect = document.createElement("select");
  jourSelect.className = "pdf-jour";
  JOURS.forEach((jourLabel, i) => jourSelect.appendChild(new Option(jourLabel, i)));
  jourSelect.value = candidate.jour;

  top.append(checkbox, activiteInput, jourSelect);

  const bottom = document.createElement("div");
  bottom.className = "pdf-review-row-bottom";

  const debutInput = document.createElement("input");
  debutInput.type = "time";
  debutInput.step = "300";
  debutInput.className = "pdf-debut";
  debutInput.value = candidate.heureDebut;

  const finInput = document.createElement("input");
  finInput.type = "time";
  finInput.step = "300";
  finInput.className = "pdf-fin";
  finInput.value = candidate.heureFin;

  const salleInput = document.createElement("input");
  salleInput.type = "text";
  salleInput.className = "pdf-salle";
  salleInput.placeholder = "Salle";
  salleInput.value = candidate.salle || "";

  const profInput = document.createElement("input");
  profInput.type = "text";
  profInput.className = "pdf-prof";
  profInput.placeholder = "Prof";
  profInput.value = candidate.prof || "";

  bottom.append(debutInput, finInput, salleInput, profInput);

  row.append(top, bottom);
  return row;
}

function openPdfReview(candidates) {
  const list = document.getElementById("pdfReviewList");
  list.innerHTML = "";
  candidates.forEach((c) => list.appendChild(buildPdfReviewRow(c)));
  document.getElementById("pdfReviewOverlay").classList.remove("hidden");
}

function closePdfReview() {
  document.getElementById("pdfReviewOverlay").classList.add("hidden");
}

function confirmPdfImport() {
  const rows = document.querySelectorAll("#pdfReviewList .pdf-review-row");
  const courses = loadCourses();
  const getColor = createColorAssigner();
  let imported = 0;

  // Si le PDF ne représente qu'une semaine précise (pas une répétition), on crée des activités
  // ponctuelles à la date réelle de cette semaine plutôt que des activités hebdomadaires.
  const singleWeek = document.getElementById("importSingleWeek").checked;
  const weekMonday = singleWeek ? new Date(document.getElementById("importWeekMonday").value + "T00:00:00") : null;

  rows.forEach((row) => {
    if (!row.querySelector(".pdf-check").checked) return;
    const activite = row.querySelector(".pdf-activite").value.trim();
    if (!activite) return;
    const jour = row.querySelector(".pdf-jour").value;

    const base = {
      id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
      activite,
      heureDebut: row.querySelector(".pdf-debut").value,
      heureFin: row.querySelector(".pdf-fin").value,
      salle: row.querySelector(".pdf-salle").value.trim(),
      prof: row.querySelector(".pdf-prof").value.trim(),
      importance: "faible",
      couleur: getColor(activite),
    };

    if (singleWeek) {
      const eventDate = new Date(weekMonday);
      eventDate.setDate(eventDate.getDate() + Number(jour));
      courses.push({
        ...base,
        type: "ponctuel",
        jour: null,
        date: toISODate(eventDate),
        dateDebut: null,
        fin: null,
        nombreOccurrences: null,
        dateFin: null,
      });
    } else {
      courses.push({
        ...base,
        type: "hebdomadaire",
        jour,
        date: null,
        dateDebut: null,
        fin: "jamais",
        nombreOccurrences: null,
        dateFin: null,
      });
    }
    imported++;
  });

  saveCourses(courses);
  closePdfReview();
  closeMenuDetail();
  alert(`${imported} activité(s) importée(s).`);
  switchView(currentView);
}

// Un cours "repetitif" (ancien nom) est l'équivalent d'un "hebdomadaire" sans fin.
function normalizedType(course) {
  const type = course.type || "repetitif";
  return type === "repetitif" ? "hebdomadaire" : type;
}

// Est-ce que cette activité a une occurrence sur cette date précise ?
function courseOccursOnDate(course, date) {
  const iso = toISODate(date);
  const type = normalizedType(course);

  if (type === "ponctuel") {
    return course.date === iso;
  }

  if (course.dateDebut && iso < course.dateDebut) return false;
  if (isDuringVacances(date)) return false; // pas cours pendant les vacances scolaires

  if (type === "quotidien") {
    return isWithinRecurrenceEnd(course, date);
  }

  // hebdomadaire : un jour de semaine fixe, et éventuellement une semaine sur deux (A/B).
  const weekday = (date.getDay() + 6) % 7; // 0 = Lundi
  if (Number(course.jour) !== weekday) return false;
  const semaine = course.semaine || "toutes";
  if (semaine !== "toutes" && getWeekLetter(date) !== semaine) return false;
  return isWithinRecurrenceEnd(course, date);
}

function isWithinRecurrenceEnd(course, date) {
  const fin = course.fin || "jamais";
  if (fin === "jamais") return true;

  if (fin === "date_fin") {
    return !course.dateFin || toISODate(date) <= course.dateFin;
  }

  if (fin === "apres_n") {
    if (!course.dateDebut) return true;
    const n = Number(course.nombreOccurrences) || 1;
    const startDate = new Date(course.dateDebut + "T00:00:00");
    const diffDays = Math.round((date - startDate) / 86400000);
    if (diffDays < 0) return false;
    const type = normalizedType(course);
    const occurrenceIndex = type === "quotidien" ? diffDays : Math.floor(diffDays / 7);
    return occurrenceIndex < n;
  }

  return true;
}

function loadDismissedTips() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_TIPS_KEY)) || []);
  } catch {
    return new Set();
  }
}

function dismissTip(tipId) {
  const dismissed = loadDismissedTips();
  dismissed.add(tipId);
  localStorage.setItem(DISMISSED_TIPS_KEY, JSON.stringify(Array.from(dismissed)));
  renderHints();
}

function renderHints() {
  const dismissed = loadDismissedTips();
  TIPS.forEach((tip) => {
    const container = document.getElementById(tip.containerId);
    if (!container) return;
    container.innerHTML = "";
    if (dismissed.has(tip.id)) return;

    const p = document.createElement("p");
    p.className = "hint";
    const span = document.createElement("span");
    span.textContent = "💡 " + tip.text;
    const closeBtn = document.createElement("button");
    closeBtn.className = "hint-close";
    closeBtn.setAttribute("aria-label", "Fermer cette astuce");
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => dismissTip(tip.id));
    p.appendChild(span);
    p.appendChild(closeBtn);
    container.appendChild(p);
  });
}

function renderTipsList() {
  const list = document.getElementById("tipsList");
  list.innerHTML = "";
  TIPS.forEach((tip) => {
    const item = document.createElement("div");
    item.className = "tips-list-item";
    item.innerHTML = `<span class="icon">💡</span><span>${escapeHtml(tip.text)}</span>`;
    list.appendChild(item);
  });
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "clair";
}

function applyTheme(themeId) {
  localStorage.setItem(THEME_KEY, themeId);
  if (themeId === "clair") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeId);
  }
}

function renderThemeList() {
  const list = document.getElementById("themeList");
  list.innerHTML = "";
  const current = loadTheme();
  THEMES.forEach((theme) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "theme-option" + (theme.id === current ? " selected" : "");
    option.innerHTML = `<span class="theme-swatch">${theme.swatch
      .map((c) => `<span style="background:${c}"></span>`)
      .join("")}</span><span>${escapeHtml(theme.label)}</span>`;
    option.addEventListener("click", () => {
      applyTheme(theme.id);
      renderThemeList();
    });
    list.appendChild(option);
  });
}

// Menu unique regroupant Thème, Astuces, et les futures sections.
// Pour ajouter une section : un objet {id, label, panelId, render} ici, plus le
// <div id="panelId">...</div> correspondant dans index.html.
const MENU_TABS = [
  { id: "theme", label: "🎨 Thème", panelId: "menuTabTheme", render: renderThemeList },
  { id: "tips", label: "💡 Astuces", panelId: "menuTabTips", render: renderTipsList },
  { id: "print", label: "🖨️ Imprimer", action: () => { closeMenuModal(); window.print(); } },
  { id: "import", label: "📥 Importer", panelId: "menuTabImport", render: () => {} },
  { id: "semaines", label: "🅰️🅱️ Semaines A/B", panelId: "menuTabSemaines", render: renderSemaineARefInput },
  { id: "vacances", label: "🏖️ Vacances", panelId: "menuTabVacances", render: renderZoneVacancesInput },
  { id: "personnes", label: "👥 Personnes", panelId: "menuTabPersonnes", render: renderPersonnesManageList },
  { id: "animaux", label: "🐾 Animaux", panelId: "menuTabAnimaux", render: renderAnimauxManageList },
];

// L'import concerne le calendrier détaillé de Solo/Famille/Entreprise (Jour/Semaine/Mois y
// affichent des activités) ; les semaines A/B et les vacances ne concernent que Solo/Famille ;
// Personnes ne concerne que les espaces à plusieurs utilisateurs (Entreprise/Famille) ; Animaux
// n'existe que dans le calendrier détaillé de l'espace Famille.
function visibleMenuTabs() {
  const espace = currentEspace();
  return MENU_TABS.filter((tab) => {
    if (tab.id === "personnes") return espace === "entreprise" || espace === "famille";
    if (tab.id === "animaux") return espace === "famille";
    if (tab.id === "import") return espace === "solo" || espace === "famille" || espace === "entreprise";
    if (tab.id === "semaines" || tab.id === "vacances") return espace === "solo" || espace === "famille";
    return true;
  });
}

function renderMenuTabs() {
  const tabs = document.getElementById("menuTabs");
  tabs.innerHTML = "";
  visibleMenuTabs().forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-tab-btn";
    btn.textContent = tab.label;
    btn.addEventListener("click", () => (tab.action ? tab.action() : openMenuDetail(tab.id)));
    tabs.appendChild(btn);
  });
}

// Le menu n'affiche que la liste des titres, sans contenu présélectionné : il faut cliquer
// sur un titre pour ouvrir son contenu dans une fenêtre à part (voir openMenuDetail).
function openMenuModal() {
  renderMenuTabs();
  document.getElementById("menuModalOverlay").classList.remove("hidden");
}

function closeMenuModal() {
  document.getElementById("menuModalOverlay").classList.add("hidden");
}

function openMenuDetail(tabId) {
  const tab = MENU_TABS.find((t) => t.id === tabId);
  if (!tab) return;
  document.getElementById("menuModalOverlay").classList.add("hidden");
  document.getElementById("menuDetailTitle").textContent = tab.label;
  MENU_TABS.forEach((t) => {
    if (!t.panelId) return;
    document.getElementById(t.panelId).classList.toggle("hidden", t.id !== tabId);
  });
  tab.render();
  document.getElementById("menuDetailOverlay").classList.remove("hidden");
}

function backToMenuFromDetail() {
  document.getElementById("menuDetailOverlay").classList.add("hidden");
  openMenuModal();
}

function closeMenuDetail() {
  document.getElementById("menuDetailOverlay").classList.add("hidden");
}

function renderSemaineARefInput() {
  document.getElementById("semaineARef").value = loadSemaineARef();
}

function renderZoneVacancesInput() {
  document.getElementById("zoneVacances").value = loadZoneVacances();
}

function renderWeekLabel(monday) {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  document.getElementById("weekLabel").textContent =
    `${formatDateShort(monday)} – ${formatDateShort(sunday)}`;
}

const COMPACT_DURATION_THRESHOLD_MIN = 180; // 3h
const COMPACT_MAX_HEIGHT = 46;

function getDurationMinutes(course) {
  const start = timeToMinutes(course.heureDebut);
  const end = timeToMinutes(course.heureFin);
  return end > start ? end - start : (DAY_END_MIN - start) + end;
}

// Les activités longues (sommeil, ou plus de 3h) sont affichées en format réduit
// pour ne pas envahir visuellement le calendrier.
function isCompactActivity(course) {
  return (
    course.activite.toLowerCase().includes("sommeil") ||
    getDurationMinutes(course) > COMPACT_DURATION_THRESHOLD_MIN
  );
}

// Découpe une activité qui traverse minuit en un ou deux segments à placer sur le calendrier.
// dayOffset indique sur quelle colonne (0 = le jour de l'occurrence, 1 = le lendemain) placer le segment.
// Les bornes restent en minutes absolues (0-1440) ; le clip sur la plage visible se fait au rendu.
function computeSegments(course) {
  const start = timeToMinutes(course.heureDebut);
  const end = timeToMinutes(course.heureFin);
  const compact = isCompactActivity(course);

  if (end > start) {
    return [{ dayOffset: 0, startMin: start, endMin: end, compact }];
  }

  // Passe minuit : une partie sur le jour de l'occurrence, une partie sur le lendemain.
  return [
    { dayOffset: 0, startMin: start, endMin: DAY_END_MIN, compact },
    { dayOffset: 1, startMin: DAY_START_MIN, endMin: end, compact },
  ];
}

// Convertit un segment (minutes absolues) en position/hauteur à l'écran, en tenant compte
// de la plage visible (clip) et du compactage des activités longues. Renvoie null si le
// segment tombe entièrement hors de la plage affichée.
function segmentToPixels(seg) {
  const clippedStart = Math.max(seg.startMin, VIEW_START_MIN);
  const clippedEnd = Math.min(seg.endMin, VIEW_END_MIN);
  if (clippedEnd <= clippedStart) return null;

  const top = minutesToTop(clippedStart);
  let height = minutesToTop(clippedEnd) - minutesToTop(clippedStart);
  if (seg.compact) height = Math.min(height, COMPACT_MAX_HEIGHT);
  return { top, height };
}

// Colonne des heures à gauche, partagée par la vue Semaine et la vue Jour.
function buildTimeColumn(viewStartHour, viewEndHour) {
  const timeCol = document.createElement("div");
  timeCol.className = "time-col-wrap";
  timeCol.style.position = "relative";
  timeCol.style.height = CALENDAR_HEIGHT + "px";
  for (let h = viewStartHour; h < viewEndHour; h++) {
    const label = document.createElement("div");
    label.className = "time-col";
    label.style.position = "absolute";
    // Centré sur la ligne de l'heure, sans jamais dépasser vers le haut (première heure).
    label.style.top = Math.max(0, minutesToTop(h * 60) - 6) + "px";
    label.style.right = "6px";
    label.textContent = h + "h";
    timeCol.appendChild(label);
  }
  return timeCol;
}

// Ajoute les lignes de repère et les cases cliquables (diviser en demi-heures) à une colonne de jour.
// splitIndex est le jour de la semaine (0-6) utilisé comme clé pour la préférence de division.
function decorateDayColumn(col, splitIndex, splitHours, viewStartHour, viewEndHour) {
  for (let half = viewStartHour * 2; half < viewEndHour * 2; half++) {
    const isHourMark = half % 2 === 0;
    const hourOfLine = Math.floor(half / 2);
    if (!isHourMark && !splitHours.has(splitKey(splitIndex, hourOfLine))) continue;
    const line = document.createElement("div");
    line.className = "grid-line" + (isHourMark ? " grid-line-hour" : "");
    line.style.top = minutesToTop(half * 30) + "px";
    col.appendChild(line);
  }

  for (let h = viewStartHour; h < viewEndHour; h++) {
    const hourCell = document.createElement("div");
    hourCell.className = "hour-cell" + (splitHours.has(splitKey(splitIndex, h)) ? " active" : "");
    hourCell.style.top = minutesToTop(h * 60) + "px";
    hourCell.style.height = minutesToTop((h + 1) * 60) - minutesToTop(h * 60) + "px";
    hourCell.title = "Cliquer pour diviser cette heure en demi-heures (ce jour uniquement)";
    hourCell.addEventListener("click", () => toggleSplitHour(splitIndex, h));
    col.appendChild(hourCell);
  }
}

// Vue Semaine : aperçu compact des 7 jours. Les blocs n'affichent que la couleur
// (le nom reste consultable au survol) pour que tout tienne sur l'écran sans scroll.
function renderCalendar() {
  const calendar = document.getElementById("calendar");
  CALENDAR_HEIGHT = computeCalendarHeight(calendar);
  calendar.innerHTML = "";
  const courses = loadCourses();
  const monday = getMonday(referenceDate);
  const today = new Date();
  renderWeekLabel(monday);

  calendar.appendChild(makeCell("calendar-header", ""));
  JOURS.forEach((jour, i) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const header = makeCell(
      "calendar-header" + (isSameDay(dayDate, today) ? " today" : ""),
      `${jour}<br><small>${formatDateShort(dayDate)}</small>`
    );
    header.style.cursor = "pointer";
    header.title = "Voir ce jour en détail";
    header.addEventListener("click", () => {
      dayReferenceDate = new Date(dayDate);
      switchView("jour");
    });
    calendar.appendChild(header);
  });

  const splitHours = loadSplitHours();
  const viewStartHour = VIEW_START_MIN / 60;
  const viewEndHour = VIEW_END_MIN / 60;

  calendar.appendChild(buildTimeColumn(viewStartHour, viewEndHour));

  // Segments à afficher, regroupés par colonne (une activité peut avoir 1 ou 2 segments
  // si elle passe minuit). On vérifie, pour chaque jour affiché, si une occurrence a lieu ce jour-là.
  const segmentsByDay = Array.from({ length: 7 }, () => []);
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    courses.forEach((course) => {
      if (!courseOccursOnDate(course, dayDate)) return;
      computeSegments(course).forEach((seg) => {
        const targetDay = (i + seg.dayOffset) % 7;
        segmentsByDay[targetDay].push({ ...seg, course });
      });
    });
  }

  for (let i = 0; i < 7; i++) {
    const col = document.createElement("div");
    col.className = "day-col";
    col.style.height = CALENDAR_HEIGHT + "px";
    col.dataset.jour = i;

    decorateDayColumn(col, i, splitHours, viewStartHour, viewEndHour);

    segmentsByDay[i].forEach((seg) => {
      const pixels = segmentToPixels(seg);
      if (!pixels) return; // entièrement hors de la plage affichée
      const { course, compact } = seg;
      const block = document.createElement("div");
      block.className = "course-block" + (compact ? " compact" : "");
      block.style.top = pixels.top + "px";
      block.style.height = Math.max(pixels.height, MIN_BLOCK_HEIGHT_WITH_TEXT) + "px";
      block.style.background = getCourseBackground(course);
      block.innerHTML = `<span class="titre">${escapeHtml(course.activite)}</span><span class="detail">${course.heureDebut}–${course.heureFin}${course.salle ? " · " + escapeHtml(course.salle) : ""}</span>`;
      block.title = compact ? `${course.activite} : ${course.heureDebut}–${course.heureFin} (bloc réduit)` : "";
      block.addEventListener("click", () => openModal(course));
      col.appendChild(block);
    });

    calendar.appendChild(col);
  }

  replayFadeIn(calendar);
}

// Vue Jour : un seul jour, en large, avec les noms des activités affichés en clair.
function renderDayCalendar() {
  const calendar = document.getElementById("dayCalendar");
  CALENDAR_HEIGHT = computeCalendarHeight(calendar);
  calendar.innerHTML = "";
  const courses = loadCourses();
  const today = new Date();
  const weekdayIndex = (dayReferenceDate.getDay() + 6) % 7; // 0 = Lundi

  document.getElementById("dayLabel").textContent = dayReferenceDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  calendar.appendChild(makeCell("calendar-header", ""));
  calendar.appendChild(
    makeCell(
      "calendar-header" + (isSameDay(dayReferenceDate, today) ? " today" : ""),
      `${JOURS[weekdayIndex]}<br><small>${formatDateShort(dayReferenceDate)}</small>`
    )
  );

  const splitHours = loadSplitHours();
  const viewStartHour = VIEW_START_MIN / 60;
  const viewEndHour = VIEW_END_MIN / 60;

  calendar.appendChild(buildTimeColumn(viewStartHour, viewEndHour));

  const col = document.createElement("div");
  col.className = "day-col";
  col.style.height = CALENDAR_HEIGHT + "px";
  decorateDayColumn(col, weekdayIndex, splitHours, viewStartHour, viewEndHour);

  // Les segments de ce jour, plus la fin d'une activité de la veille qui passe minuit.
  const previousDate = new Date(dayReferenceDate);
  previousDate.setDate(previousDate.getDate() - 1);

  const segments = [];
  courses.forEach((course) => {
    if (courseOccursOnDate(course, dayReferenceDate)) {
      computeSegments(course).forEach((seg) => {
        if (seg.dayOffset === 0) segments.push({ ...seg, course });
      });
    }
    if (courseOccursOnDate(course, previousDate)) {
      computeSegments(course).forEach((seg) => {
        if (seg.dayOffset === 1) segments.push({ ...seg, course });
      });
    }
  });

  segments.forEach((seg) => {
    const pixels = segmentToPixels(seg);
    if (!pixels) return;
    const { course, compact } = seg;
    const block = document.createElement("div");
    block.className = "course-block" + (compact ? " compact" : "");
    block.style.top = pixels.top + "px";
    block.style.height = Math.max(pixels.height, MIN_BLOCK_HEIGHT_WITH_TEXT) + "px";
    block.style.background = getCourseBackground(course);
    block.innerHTML = `<span class="titre">${escapeHtml(course.activite)}</span><span class="detail">${course.heureDebut}–${course.heureFin}${course.salle ? " · " + escapeHtml(course.salle) : ""}</span>`;
    block.title = compact ? `${course.activite} : ${course.heureDebut}–${course.heureFin} (bloc réduit)` : "";
    block.addEventListener("click", () => openModal(course));
    col.appendChild(block);
  });

  calendar.appendChild(col);
  replayFadeIn(calendar);
}

function makeCell(className, html) {
  const div = document.createElement("div");
  div.className = className;
  div.innerHTML = html;
  return div;
}

// Relance l'animation de fondu (définie en CSS) sur un conteneur déjà affiché, par exemple
// après un changement de semaine/jour/mois qui ne masque/réaffiche pas l'élément lui-même.
function replayFadeIn(el) {
  if (!el) return;
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// Choisit, parmi les couleurs de la palette, la première qui n'est pas déjà utilisée
// par une autre activité — pour varier automatiquement les couleurs par défaut.
function pickDefaultColor() {
  const usedColors = new Set(loadCourses().map((c) => c.couleur));
  const swatchColors = Array.from(document.querySelectorAll("#colorPicker .swatch")).map((s) => s.dataset.color);
  return swatchColors.find((c) => !usedColors.has(c)) || swatchColors[0];
}

// Si une autre activité porte déjà exactement ce nom, on reprend sa couleur pour rester cohérent
// (ex. toutes les séances de "Piano" dans la même couleur), plutôt que d'en choisir une nouvelle.
function findColorForActivityName(name, excludeId) {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;
  const match = loadCourses().find((c) => c.id !== excludeId && c.activite.trim().toLowerCase() === normalized);
  return match ? match.couleur : null;
}

// Fournit une couleur cohérente par nom d'activité pour tout un lot d'import : reprend la couleur
// d'une activité déjà enregistrée du même nom, ou celle déjà donnée plus tôt dans ce même import,
// avant d'en piocher une nouvelle inutilisée.
function createColorAssigner() {
  const swatchColors = Array.from(document.querySelectorAll("#colorPicker .swatch")).map((s) => s.dataset.color);
  const usedColors = new Set(loadCourses().map((c) => c.couleur));
  const batchColors = new Map();
  let nextIndex = 0;

  return function getColor(name) {
    const normalized = name.trim().toLowerCase();
    const existing = findColorForActivityName(name, null);
    if (existing) return existing;
    if (batchColors.has(normalized)) return batchColors.get(normalized);

    while (nextIndex < swatchColors.length - 1 && usedColors.has(swatchColors[nextIndex % swatchColors.length])) {
      nextIndex++;
    }
    const color = swatchColors[nextIndex % swatchColors.length];
    nextIndex++;
    batchColors.set(normalized, color);
    usedColors.add(color);
    return color;
  };
}

function selectSwatch(color) {
  document.getElementById("couleur").value = color;
  document.querySelectorAll("#colorPicker .swatch").forEach((s) => s.classList.toggle("selected", s.dataset.color === color));
}

function openModal(course) {
  const overlay = document.getElementById("modalOverlay");
  const form = document.getElementById("courseForm");
  const deleteBtn = document.getElementById("deleteBtn");

  form.reset();
  document.querySelectorAll("#colorPicker .swatch").forEach((s) => s.classList.remove("selected"));

  if (course) {
    document.getElementById("modalTitle").textContent = "Modifier l'activité";
    document.getElementById("courseId").value = course.id;
    document.getElementById("activite").value = course.activite;
    document.getElementById("type").value = normalizedType(course);
    document.getElementById("jour").value = course.jour || "0";
    document.getElementById("semaine").value = course.semaine || "toutes";
    document.getElementById("date").value = course.date || "";
    document.getElementById("dateDebut").value = course.dateDebut || toISODate(new Date());
    document.getElementById("fin").value = course.fin || "jamais";
    document.getElementById("nombreOccurrences").value = course.nombreOccurrences || 5;
    document.getElementById("dateFin").value = course.dateFin || "";
    document.getElementById("heureDebut").value = course.heureDebut;
    document.getElementById("heureFin").value = course.heureFin;
    document.getElementById("salle").value = course.salle || "";
    document.getElementById("prof").value = course.prof || "";
    document.getElementById("importance").value = course.importance || "faible";
    document.getElementById("couleur").value = course.couleur || "#6C63FF";
    populatePersonneCheckboxes(coursePersonneIds(course));
    populateAnimalCheckboxes(courseAnimalIds(course));
    deleteBtn.classList.remove("hidden");
  } else {
    document.getElementById("modalTitle").textContent = "Ajouter une activité";
    document.getElementById("courseId").value = "";
    document.getElementById("type").value = "ponctuel";
    document.getElementById("semaine").value = "toutes";
    document.getElementById("dateDebut").value = toISODate(new Date());
    document.getElementById("fin").value = "jamais";
    document.getElementById("nombreOccurrences").value = 5;
    document.getElementById("dateFin").value = "";
    document.getElementById("importance").value = "faible";
    document.getElementById("couleur").value = pickDefaultColor();
    populatePersonneCheckboxes([]);
    populateAnimalCheckboxes([]);
    deleteBtn.classList.add("hidden");
  }

  document.getElementById("personneField").classList.toggle("hidden", currentEspace() !== "famille");
  document.getElementById("animalField").classList.toggle("hidden", currentEspace() !== "famille");

  updateTypeFieldsVisibility();
  updateCoursFieldsVisibility();

  const selectedColor = document.getElementById("couleur").value;
  const match = document.querySelector(`#colorPicker .swatch[data-color="${selectedColor}"]`);
  if (match) match.classList.add("selected");

  overlay.classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.add("hidden");
}

// Le champ "Personne" (espace Famille) n'a de sens que si des personnes existent déjà.
function coursePersonneIds(course) {
  if (Array.isArray(course.personneIds)) return course.personneIds;
  return course.personneId ? [course.personneId] : [];
}

function populatePersonneCheckboxes(selectedIds) {
  const container = document.getElementById("personneCheckboxes");
  container.innerHTML = "";
  loadPersonnes().forEach((p) => {
    const row = document.createElement("label");
    row.className = "personne-checkbox-row";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = p.id;
    checkbox.checked = selectedIds.includes(p.id);
    checkbox.addEventListener("change", onPersonneCheckboxChange);
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = p.couleur;
    row.append(checkbox, dot, document.createTextNode(p.nom));
    container.appendChild(row);
  });
}

function getCheckedPersonneIds() {
  return Array.from(document.querySelectorAll("#personneCheckboxes input:checked")).map((c) => c.value);
}

// Le champ "Animal" (espace Famille) n'a de sens que si des animaux existent déjà.
function courseAnimalIds(course) {
  return Array.isArray(course.animalIds) ? course.animalIds : [];
}

function populateAnimalCheckboxes(selectedIds) {
  const container = document.getElementById("animalCheckboxes");
  container.innerHTML = "";
  loadAnimaux().forEach((a) => {
    const row = document.createElement("label");
    row.className = "personne-checkbox-row";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = a.id;
    checkbox.checked = selectedIds.includes(a.id);
    checkbox.addEventListener("change", onAnimalCheckboxChange);
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = a.couleur;
    row.append(checkbox, dot, document.createTextNode(a.nom));
    container.appendChild(row);
  });
}

function getCheckedAnimalIds() {
  return Array.from(document.querySelectorAll("#animalCheckboxes input:checked")).map((c) => c.value);
}

// Une seule personne OU un seul animal cochés (au total) : on adopte directement sa couleur
// (comme avant). Plusieurs ou aucun : la couleur reste au libre choix (le calendrier divisera
// le bloc lui-même).
function onPersonneCheckboxChange() {
  updateSwatchFromSelection();
}

function onAnimalCheckboxChange() {
  updateSwatchFromSelection();
}

function updateSwatchFromSelection() {
  const personneIds = getCheckedPersonneIds();
  const animalIds = getCheckedAnimalIds();
  if (personneIds.length + animalIds.length !== 1) return;
  const couleur = personneIds.length === 1
    ? loadPersonnes().find((p) => p.id === personneIds[0])?.couleur
    : loadAnimaux().find((a) => a.id === animalIds[0])?.couleur;
  if (couleur) selectSwatch(couleur);
}

// Couleur (ou dégradé si plusieurs personnes/animaux) à appliquer au fond d'un bloc d'activité.
function getCourseBackground(course) {
  if (currentEspace() === "famille") {
    const personneIds = coursePersonneIds(course);
    const animalIds = courseAnimalIds(course);
    if (personneIds.length + animalIds.length > 1) {
      const personnes = loadPersonnes();
      const animaux = loadAnimaux();
      const colors = [
        ...personneIds.map((id) => personnes.find((p) => p.id === id)?.couleur),
        ...animalIds.map((id) => animaux.find((a) => a.id === id)?.couleur),
      ].filter(Boolean);
      if (colors.length > 1) {
        const step = 100 / colors.length;
        const stops = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`).join(", ");
        return `linear-gradient(to right, ${stops})`;
      }
    }
  }
  return course.couleur || "#6C63FF";
}

function updateTypeFieldsVisibility() {
  const type = document.getElementById("type").value;
  const isPonctuel = type === "ponctuel";
  const isHebdomadaire = type === "hebdomadaire";
  const isRecurrent = !isPonctuel;

  document.getElementById("jourField").classList.toggle("hidden", !isHebdomadaire);
  document.getElementById("dateField").classList.toggle("hidden", !isPonctuel);
  document.getElementById("dateDebutField").classList.toggle("hidden", !isRecurrent);
  document.getElementById("finField").classList.toggle("hidden", !isRecurrent);

  document.getElementById("jour").required = isHebdomadaire;
  document.getElementById("date").required = isPonctuel;
  document.getElementById("dateDebut").required = isRecurrent;

  updateFinFieldsVisibility();
}

function updateFinFieldsVisibility() {
  const isRecurrent = document.getElementById("type").value !== "ponctuel";
  const fin = document.getElementById("fin").value;
  document.getElementById("nombreOccurrencesField").classList.toggle("hidden", !isRecurrent || fin !== "apres_n");
  document.getElementById("dateFinField").classList.toggle("hidden", !isRecurrent || fin !== "date_fin");
}

function updateCoursFieldsVisibility() {
  const isCours = document.getElementById("activite").value.toLowerCase().includes("cours");
  document.getElementById("salleProfFields").classList.toggle("hidden", !isCours);
}

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Écran de bienvenue affiché uniquement la première fois (pas de vrai compte,
// juste un prénom/email mémorisés dans le navigateur pour personnaliser l'accueil).
function showApp(user) {
  document.getElementById("onboardingOverlay").classList.add("hidden");
  document.getElementById("appRoot").classList.remove("hidden");
  document.getElementById("userGreeting").textContent = user.prenom ? `— Salut, ${user.prenom} !` : "";
  // Le calendrier a pu être mesuré pendant qu'il était caché (hauteur alors incorrecte) : on le
  // recalcule maintenant qu'il est visible.
  applyEspaceUI();
}

function initOnboarding() {
  const user = loadUser();
  if (user) {
    showApp(user);
    return;
  }

  document.getElementById("onboardingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const prenom = document.getElementById("onboardingPrenom").value.trim();
    const email = document.getElementById("onboardingEmail").value.trim();
    if (!prenom || !email) return;
    const user = { prenom, email };
    saveUser(user);
    showApp(user);
  });
}

// --- Espaces (Solo / Entreprise / Famille) ---

function renderEspaceButton() {
  const espace = ESPACES.find((e) => e.id === currentEspace());
  document.getElementById("espaceBtn").textContent = `${espace.emoji} ${espace.label}`;
}

function renderEspaceList() {
  const list = document.getElementById("espaceList");
  list.innerHTML = "";
  const current = currentEspace();
  ESPACES.forEach((espace) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "theme-option" + (espace.id === current ? " selected" : "");
    option.innerHTML = `<span>${espace.emoji}</span><span>${escapeHtml(espace.label)}</span>`;
    option.addEventListener("click", () => selectEspace(espace.id));
    list.appendChild(option);
  });
}

function openEspaceModal() {
  renderEspaceList();
  document.getElementById("espaceModalOverlay").classList.remove("hidden");
}

function closeEspaceModal() {
  document.getElementById("espaceModalOverlay").classList.add("hidden");
}

function selectEspace(espaceId) {
  setCurrentEspace(espaceId);
  closeEspaceModal();
  applyEspaceUI();
}

// Rafraîchit tout ce qui dépend des données de l'espace courant : Jour/Semaine/Mois sont
// disponibles dans les 3 espaces (activités horaires), sauf que le "Mois" de l'espace Entreprise
// est le tableau de présence par personne (voir switchView) plutôt que le mois classique.
function applyEspaceUI() {
  const espace = currentEspace();
  renderEspaceButton();

  const range = loadRange();
  applyRange(range);
  const rangeStartEl = document.getElementById("rangeStart");
  const rangeEndEl = document.getElementById("rangeEnd");
  if (rangeStartEl && rangeEndEl && rangeStartEl.options.length) {
    rangeStartEl.value = range.start;
    rangeEndEl.value = range.end;
  }

  if (espace === "entreprise") entrepriseSelectedPersonneId = null;
  renderHints();
  switchView(currentView);

  if (!document.getElementById("todoModalOverlay").classList.contains("hidden")) {
    renderTodoSpace();
  }
}

// --- Personnes (Entreprise / Famille) ---

function renderPersonneColorPicker() {
  const picker = document.getElementById("personneColorPicker");
  picker.innerHTML = "";
  const swatchColors = Array.from(document.querySelectorAll("#colorPicker .swatch")).map((s) => s.dataset.color);
  swatchColors.forEach((color, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch" + (i === 0 ? " selected" : "");
    btn.style.background = color;
    btn.dataset.color = color;
    btn.addEventListener("click", () => {
      picker.querySelectorAll(".swatch").forEach((s) => s.classList.remove("selected"));
      btn.classList.add("selected");
      document.getElementById("personneCouleur").value = color;
    });
    picker.appendChild(btn);
  });
  document.getElementById("personneCouleur").value = swatchColors[0];
}

function renderPersonnesManageList() {
  renderPersonneColorPicker();
  const list = document.getElementById("personnesList");
  list.innerHTML = "";
  const personnes = loadPersonnes();
  if (personnes.length === 0) {
    list.innerHTML = '<p class="import-explainer">Aucune personne pour l\'instant.</p>';
    return;
  }
  personnes.forEach((p) => {
    const row = document.createElement("div");
    row.className = "personne-row";
    row.innerHTML = `<span class="dot" style="background:${p.couleur}"></span><span class="nom">${escapeHtml(p.nom)}</span>`;
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-danger";
    delBtn.textContent = "Supprimer";
    delBtn.addEventListener("click", () => {
      if (!confirm(`Supprimer ${p.nom} ?`)) return;
      savePersonnes(loadPersonnes().filter((x) => x.id !== p.id));
      saveAssignations(loadAssignations().filter((a) => a.personneId !== p.id));
      renderPersonnesManageList();
      if (currentEspace() === "entreprise") renderEntrepriseView();
    });
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function addPersonne(nom, couleur) {
  const personnes = loadPersonnes();
  personnes.push({ id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8), nom, couleur });
  savePersonnes(personnes);
}

// --- Animaux (Famille) ---

function renderAnimalColorPicker() {
  const picker = document.getElementById("animalColorPicker");
  picker.innerHTML = "";
  const swatchColors = Array.from(document.querySelectorAll("#colorPicker .swatch")).map((s) => s.dataset.color);
  swatchColors.forEach((color, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch" + (i === 0 ? " selected" : "");
    btn.style.background = color;
    btn.dataset.color = color;
    btn.addEventListener("click", () => {
      picker.querySelectorAll(".swatch").forEach((s) => s.classList.remove("selected"));
      btn.classList.add("selected");
      document.getElementById("animalCouleur").value = color;
    });
    picker.appendChild(btn);
  });
  document.getElementById("animalCouleur").value = swatchColors[0];
}

function renderAnimauxManageList() {
  renderAnimalColorPicker();
  const list = document.getElementById("animauxList");
  list.innerHTML = "";
  const animaux = loadAnimaux();
  if (animaux.length === 0) {
    list.innerHTML = '<p class="import-explainer">Aucun animal pour l\'instant.</p>';
    return;
  }
  animaux.forEach((a) => {
    const row = document.createElement("div");
    row.className = "personne-row";
    row.innerHTML = `<span class="dot" style="background:${a.couleur}"></span><span class="nom">${escapeHtml(a.nom)}</span>`;
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-danger";
    delBtn.textContent = "Supprimer";
    delBtn.addEventListener("click", () => {
      if (!confirm(`Supprimer ${a.nom} ?`)) return;
      saveAnimaux(loadAnimaux().filter((x) => x.id !== a.id));
      renderAnimauxManageList();
    });
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function addAnimal(nom, couleur) {
  const animaux = loadAnimaux();
  animaux.push({ id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8), nom, couleur });
  saveAnimaux(animaux);
}

// --- Espace To-do : plusieurs listes nommées, chacune avec des tâches à faire / déjà faites ---

let todoViewMode = "active"; // "active" ou "done"

function currentTodoListeId() {
  const id = loadCurrentTodoListeId();
  const listes = loadTodoListes();
  if (id && listes.some((l) => l.id === id)) return id;
  return listes.length ? listes[0].id : null;
}

function addTodoListe(nom) {
  const listes = loadTodoListes();
  const liste = { id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8), nom };
  listes.push(liste);
  saveTodoListes(listes);
  saveCurrentTodoListeId(liste.id);
}

function deleteTodoListe(id) {
  saveTodoListes(loadTodoListes().filter((l) => l.id !== id));
  saveTodoItems(loadTodoItems().filter((i) => i.listeId !== id));
  if (loadCurrentTodoListeId() === id) saveCurrentTodoListeId(null);
}

function addTodoItem(texte) {
  const listeId = currentTodoListeId();
  if (!listeId || !texte.trim()) return;
  const items = loadTodoItems();
  items.push({
    id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
    listeId,
    texte: texte.trim(),
    fait: false,
  });
  saveTodoItems(items);
}

// Coche/décoche une tâche : cliquer dans "À faire" l'envoie dans "Déjà fait", et recliquer dans
// "Déjà fait" l'annule (elle revient dans "À faire").
function toggleTodoItem(id) {
  const items = loadTodoItems();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.fait = !item.fait;
  saveTodoItems(items);
}

function deleteTodoItem(id) {
  saveTodoItems(loadTodoItems().filter((i) => i.id !== id));
}

function renderTodoListesSidebar() {
  const list = document.getElementById("todoListesList");
  list.innerHTML = "";
  const listes = loadTodoListes();
  const current = currentTodoListeId();
  listes.forEach((l) => {
    const row = document.createElement("div");
    row.className = "todo-sidebar-item" + (l.id === current ? " selected" : "");
    row.innerHTML = `<span class="nom">${escapeHtml(l.nom)}</span>`;
    row.addEventListener("click", () => {
      saveCurrentTodoListeId(l.id);
      renderTodoSpace();
    });
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "todo-sidebar-remove";
    removeBtn.textContent = "✕";
    removeBtn.title = "Supprimer cette liste";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm(`Supprimer la liste "${l.nom}" et toutes ses tâches ?`)) return;
      deleteTodoListe(l.id);
      renderTodoSpace();
    });
    row.appendChild(removeBtn);
    list.appendChild(row);
  });
}

function renderTodoItemRow(item) {
  const row = document.createElement("div");
  row.className = "todo-item" + (item.fait ? " done" : "");

  const main = document.createElement("button");
  main.type = "button";
  main.className = "todo-item-main";
  main.innerHTML = `<span class="todo-check">${item.fait ? "✓" : ""}</span><span class="todo-texte">${escapeHtml(item.texte)}</span>`;
  main.addEventListener("click", () => {
    toggleTodoItem(item.id);
    renderTodoLists();
  });

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "todo-delete";
  delBtn.textContent = "✕";
  delBtn.title = "Supprimer définitivement";
  delBtn.addEventListener("click", () => {
    deleteTodoItem(item.id);
    renderTodoLists();
  });

  row.append(main, delBtn);
  return row;
}

function renderTodoLists() {
  const listeId = currentTodoListeId();
  const items = loadTodoItems().filter((i) => i.listeId === listeId);

  const activeList = document.getElementById("todoActiveList");
  activeList.innerHTML = "";
  const active = items.filter((i) => !i.fait);
  if (active.length === 0) {
    activeList.innerHTML = '<p class="import-explainer">Rien à faire pour l\'instant.</p>';
  } else {
    active.forEach((item) => activeList.appendChild(renderTodoItemRow(item)));
  }

  const doneList = document.getElementById("todoDoneList");
  doneList.innerHTML = "";
  const done = items.filter((i) => i.fait);
  if (done.length === 0) {
    doneList.innerHTML = '<p class="import-explainer">Rien de fait pour l\'instant.</p>';
  } else {
    done.forEach((item) => doneList.appendChild(renderTodoItemRow(item)));
  }
}

function switchTodoView(mode) {
  todoViewMode = mode;
  document.getElementById("showTodoActiveView").classList.toggle("active", mode === "active");
  document.getElementById("showTodoDoneView").classList.toggle("active", mode === "done");
  document.getElementById("todoActiveView").classList.toggle("hidden", mode !== "active");
  document.getElementById("todoDoneView").classList.toggle("hidden", mode !== "done");
}

function renderTodoSpace() {
  const espace = ESPACES.find((e) => e.id === currentEspace());
  document.getElementById("todoModalEspace").textContent = `${espace.emoji} Espace ${espace.label}`;
  renderTodoListesSidebar();
  const hasListe = !!currentTodoListeId();
  document.getElementById("todoNoListe").classList.toggle("hidden", hasListe);
  document.getElementById("todoContent").classList.toggle("hidden", !hasListe);
  if (!hasListe) return;
  switchTodoView(todoViewMode);
  renderTodoLists();
}

function openTodoModal() {
  renderTodoSpace();
  document.getElementById("todoModalOverlay").classList.remove("hidden");
}

function closeTodoModal() {
  document.getElementById("todoModalOverlay").classList.add("hidden");
}

// --- Espace Entreprise : tableau de présence par jour ---

let entrepriseReferenceDate = new Date();
let entrepriseSelectedPersonneId = null;

function renderEntreprisePersonnesList() {
  const list = document.getElementById("entreprisePersonnesList");
  list.innerHTML = "";
  const personnes = loadPersonnes();
  if (personnes.length === 0) {
    list.innerHTML = '<p class="import-explainer">Ajoute des personnes dans Menu → 👥 Personnes pour commencer.</p>';
    return;
  }
  personnes.forEach((p) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "personne-chip" + (p.id === entrepriseSelectedPersonneId ? " selected" : "");
    chip.innerHTML = `<span class="dot" style="background:${p.couleur}"></span><span>${escapeHtml(p.nom)}</span>`;
    chip.addEventListener("click", () => {
      entrepriseSelectedPersonneId = entrepriseSelectedPersonneId === p.id ? null : p.id;
      renderEntrepriseView();
    });
    list.appendChild(chip);
  });
}

function toggleEntrepriseAssignation(dateISO) {
  if (!entrepriseSelectedPersonneId) {
    alert("Sélectionne d'abord une personne ci-dessus.");
    return;
  }
  const assignations = loadAssignations();
  const idx = assignations.findIndex((a) => a.personneId === entrepriseSelectedPersonneId && a.date === dateISO);
  if (idx >= 0) {
    assignations.splice(idx, 1);
  } else {
    assignations.push({ personneId: entrepriseSelectedPersonneId, date: dateISO });
  }
  saveAssignations(assignations);
  renderEntrepriseMonth();
}

function renderEntrepriseMonth() {
  const grid = document.getElementById("entrepriseMonthGrid");
  grid.innerHTML = "";
  const personnes = loadPersonnes();
  const assignations = loadAssignations();
  const courses = loadCourses();
  const today = new Date();

  const year = entrepriseReferenceDate.getFullYear();
  const month = entrepriseReferenceDate.getMonth();
  document.getElementById("entrepriseMonthLabel").textContent = new Date(year, month, 1).toLocaleDateString(
    "fr-FR",
    { month: "long", year: "numeric" }
  );

  JOURS.forEach((jour) => grid.appendChild(makeCell("month-header", jour.slice(0, 3))));

  const firstOfMonth = new Date(year, month, 1);
  const gridStart = getMonday(firstOfMonth);

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    const outsideMonth = cellDate.getMonth() !== month;
    const iso = toISODate(cellDate);

    const cell = document.createElement("div");
    cell.className =
      "month-cell" + (outsideMonth ? " outside" : "") + (isSameDay(cellDate, today) ? " today" : "");
    cell.style.cursor = "pointer";

    const dateNum = document.createElement("div");
    dateNum.className = "date-num";
    dateNum.textContent = cellDate.getDate();
    cell.appendChild(dateNum);

    const colors = assignations
      .filter((a) => a.date === iso)
      .map((a) => personnes.find((p) => p.id === a.personneId)?.couleur)
      .filter(Boolean);
    if (colors.length === 1) {
      cell.classList.add("filled");
      cell.style.background = colors[0];
    } else if (colors.length > 1) {
      cell.classList.add("filled");
      const step = 100 / colors.length;
      const stops = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`).join(", ");
      cell.style.background = `linear-gradient(135deg, ${stops})`;
    }

    // Les activités ajoutées via "+ Ajouter une activité" (pas de vue Jour/Semaine en
    // Entreprise, donc toutes s'affichent ici, pas seulement les "importantes").
    courses
      .filter((c) => courseOccursOnDate(c, cellDate))
      .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
      .forEach((c) => {
        const chip = document.createElement("div");
        chip.className = "chip" + (c.importance === "tres_important" ? " chip-tres-important" : "");
        chip.style.background = c.couleur || "#6C63FF";
        chip.style.color = "white";
        chip.textContent = `${c.heureDebut} ${c.activite}`;
        chip.title = c.activite;
        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          openModal(c);
        });
        cell.appendChild(chip);
      });

    cell.addEventListener("click", () => toggleEntrepriseAssignation(iso));
    grid.appendChild(cell);
  }
}

function renderEntrepriseView() {
  renderEntreprisePersonnesList();
  renderEntrepriseMonth();
}

function initEvents() {
  document.getElementById("addCourseBtn").addEventListener("click", () => openModal(null));

  const importWeekMonday = document.getElementById("importWeekMonday");
  importWeekMonday.value = toISODate(getMonday(new Date()));
  document.getElementById("importSingleWeek").addEventListener("change", (e) => {
    document.getElementById("importWeekMondayField").classList.toggle("hidden", !e.target.checked);
  });

  document.getElementById("importTriggerBtn").addEventListener("click", () => {
    document.getElementById("importFileInput").click();
  });
  document.getElementById("importFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.name.toLowerCase().endsWith(".pdf")) {
      handlePDFFileSelected(file).catch((err) => {
        console.error(err);
        alert("Impossible de lire ce PDF (fichier protégé, corrompu, ou format non pris en charge).");
      });
    } else {
      handleICSFileSelected(file);
    }
  });

  document.getElementById("confirmPdfReviewBtn").addEventListener("click", confirmPdfImport);
  document.getElementById("cancelPdfReviewBtn").addEventListener("click", closePdfReview);
  document.getElementById("pdfReviewOverlay").addEventListener("click", (e) => {
    if (e.target.id === "pdfReviewOverlay") closePdfReview();
  });

  document.getElementById("clearAllBtn").addEventListener("click", () => {
    if (!confirm("Supprimer toutes les activités de ton planning ? Cette action est irréversible.")) return;
    saveCourses([]);
    closeMenuDetail();
    switchView(currentView);
  });

  document.getElementById("semaineARef").addEventListener("change", (e) => {
    saveSemaineARef(e.target.value);
    renderCalendar();
    renderMonthCalendar();
    if (currentView === "jour") renderDayCalendar();
  });

  document.getElementById("zoneVacances").addEventListener("change", (e) => {
    saveZoneVacances(e.target.value);
    renderCalendar();
    renderMonthCalendar();
    if (currentView === "jour") renderDayCalendar();
  });

  document.getElementById("cancelBtn").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });

  document.getElementById("type").addEventListener("change", updateTypeFieldsVisibility);
  document.getElementById("fin").addEventListener("change", updateFinFieldsVisibility);
  document.getElementById("activite").addEventListener("input", (e) => {
    updateCoursFieldsVisibility();
    const currentId = document.getElementById("courseId").value;
    const matchedColor = findColorForActivityName(e.target.value, currentId);
    if (matchedColor) selectSwatch(matchedColor);
  });

  document.querySelectorAll("#colorPicker .swatch").forEach((swatch) => {
    swatch.addEventListener("click", () => selectSwatch(swatch.dataset.color));
  });

  document.getElementById("courseForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("courseId").value || String(Date.now());
    const type = document.getElementById("type").value;
    const isPonctuel = type === "ponctuel";
    const fin = document.getElementById("fin").value;
    const course = {
      id,
      activite: document.getElementById("activite").value.trim(),
      type,
      jour: type === "hebdomadaire" ? document.getElementById("jour").value : null,
      semaine: type === "hebdomadaire" ? document.getElementById("semaine").value : null,
      date: isPonctuel ? document.getElementById("date").value : null,
      dateDebut: isPonctuel ? null : document.getElementById("dateDebut").value,
      fin: isPonctuel ? null : fin,
      nombreOccurrences: !isPonctuel && fin === "apres_n" ? Number(document.getElementById("nombreOccurrences").value) : null,
      dateFin: !isPonctuel && fin === "date_fin" ? document.getElementById("dateFin").value : null,
      heureDebut: document.getElementById("heureDebut").value,
      heureFin: document.getElementById("heureFin").value,
      salle: document.getElementById("salle").value.trim(),
      prof: document.getElementById("prof").value.trim(),
      importance: document.getElementById("importance").value,
      couleur: document.getElementById("couleur").value,
      personneIds: currentEspace() === "famille" ? getCheckedPersonneIds() : [],
      animalIds: currentEspace() === "famille" ? getCheckedAnimalIds() : [],
    };

    let courses = loadCourses();
    const existingIndex = courses.findIndex((c) => c.id === id);
    if (existingIndex >= 0) {
      courses[existingIndex] = course;
    } else {
      courses.push(course);
    }
    saveCourses(courses);
    closeModal();
    switchView(currentView);
  });

  document.getElementById("deleteBtn").addEventListener("click", () => {
    const id = document.getElementById("courseId").value;
    if (!id) return;
    let courses = loadCourses().filter((c) => c.id !== id);
    saveCourses(courses);
    closeModal();
    switchView(currentView);
  });

  document.getElementById("prevWeek").addEventListener("click", () => {
    referenceDate.setDate(referenceDate.getDate() - 7);
    renderCalendar();
  });
  document.getElementById("nextWeek").addEventListener("click", () => {
    referenceDate.setDate(referenceDate.getDate() + 7);
    renderCalendar();
  });
  document.getElementById("todayWeekBtn").addEventListener("click", () => {
    referenceDate = new Date();
    renderCalendar();
  });

  document.getElementById("prevMonth").addEventListener("click", () => {
    referenceDate.setMonth(referenceDate.getMonth() - 1);
    renderMonthCalendar();
  });
  document.getElementById("nextMonth").addEventListener("click", () => {
    referenceDate.setMonth(referenceDate.getMonth() + 1);
    renderMonthCalendar();
  });
  document.getElementById("todayMonthBtn").addEventListener("click", () => {
    referenceDate = new Date();
    renderMonthCalendar();
  });

  document.getElementById("prevDay").addEventListener("click", () => {
    dayReferenceDate.setDate(dayReferenceDate.getDate() - 1);
    renderDayCalendar();
  });
  document.getElementById("nextDay").addEventListener("click", () => {
    dayReferenceDate.setDate(dayReferenceDate.getDate() + 1);
    renderDayCalendar();
  });
  document.getElementById("todayDayBtn").addEventListener("click", () => {
    dayReferenceDate = new Date();
    renderDayCalendar();
  });

  document.getElementById("showWeekView").addEventListener("click", () => switchView("semaine"));
  document.getElementById("showDayView").addEventListener("click", () => switchView("jour"));
  document.getElementById("showMonthView").addEventListener("click", () => switchView("mois"));

  window.addEventListener("resize", () => {
    if (currentView === "semaine") renderCalendar();
    else if (currentView === "jour") renderDayCalendar();
  });

  document.getElementById("espaceBtn").addEventListener("click", openEspaceModal);
  document.getElementById("closeEspaceBtn").addEventListener("click", closeEspaceModal);
  document.getElementById("espaceModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "espaceModalOverlay") closeEspaceModal();
  });

  document.getElementById("todoBtn").addEventListener("click", openTodoModal);
  document.getElementById("closeTodoBtn").addEventListener("click", closeTodoModal);
  document.getElementById("todoModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "todoModalOverlay") closeTodoModal();
  });

  document.getElementById("personneForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nom = document.getElementById("personneNom").value.trim();
    const couleur = document.getElementById("personneCouleur").value;
    if (!nom) return;
    addPersonne(nom, couleur);
    document.getElementById("personneNom").value = "";
    renderPersonnesManageList();
    if (currentEspace() === "entreprise") renderEntrepriseView();
  });

  document.getElementById("animalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nom = document.getElementById("animalNom").value.trim();
    const couleur = document.getElementById("animalCouleur").value;
    if (!nom) return;
    addAnimal(nom, couleur);
    document.getElementById("animalNom").value = "";
    renderAnimauxManageList();
  });

  document.getElementById("prevEntrepriseMonth").addEventListener("click", () => {
    entrepriseReferenceDate.setMonth(entrepriseReferenceDate.getMonth() - 1);
    renderEntrepriseMonth();
  });
  document.getElementById("nextEntrepriseMonth").addEventListener("click", () => {
    entrepriseReferenceDate.setMonth(entrepriseReferenceDate.getMonth() + 1);
    renderEntrepriseMonth();
  });

  document.getElementById("addTodoListeBtn").addEventListener("click", () => {
    document.getElementById("todoListeForm").classList.remove("hidden");
    document.getElementById("todoListeNom").focus();
  });
  document.getElementById("cancelTodoListeBtn").addEventListener("click", () => {
    document.getElementById("todoListeForm").classList.add("hidden");
    document.getElementById("todoListeNom").value = "";
  });
  document.getElementById("todoListeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nom = document.getElementById("todoListeNom").value.trim();
    if (!nom) return;
    addTodoListe(nom);
    document.getElementById("todoListeNom").value = "";
    document.getElementById("todoListeForm").classList.add("hidden");
    todoViewMode = "active";
    renderTodoSpace();
  });
  document.getElementById("todoAddForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const texte = document.getElementById("todoNouvelleTache").value;
    if (!texte.trim()) return;
    addTodoItem(texte);
    document.getElementById("todoNouvelleTache").value = "";
    renderTodoLists();
  });
  document.getElementById("showTodoActiveView").addEventListener("click", () => switchTodoView("active"));
  document.getElementById("showTodoDoneView").addEventListener("click", () => switchTodoView("done"));

  document.getElementById("menuBtn").addEventListener("click", () => openMenuModal());
  document.getElementById("closeMenuBtn").addEventListener("click", closeMenuModal);
  document.getElementById("menuModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "menuModalOverlay") closeMenuModal();
  });

  document.getElementById("backMenuBtn").addEventListener("click", backToMenuFromDetail);
  document.getElementById("closeMenuDetailBtn").addEventListener("click", closeMenuDetail);
  document.getElementById("menuDetailOverlay").addEventListener("click", (e) => {
    if (e.target.id === "menuDetailOverlay") closeMenuDetail();
  });

  initRangeControls();
}

function initRangeControls() {
  const startSelect = document.getElementById("rangeStart");
  const endSelect = document.getElementById("rangeEnd");

  for (let h = 0; h <= 23; h++) {
    startSelect.appendChild(new Option(h + "h", h));
  }
  for (let h = 1; h <= 24; h++) {
    endSelect.appendChild(new Option(h + "h", h));
  }

  const range = loadRange();
  applyRange(range);
  startSelect.value = range.start;
  endSelect.value = range.end;

  const onChange = () => {
    const start = Number(startSelect.value);
    const end = Number(endSelect.value);
    if (start >= end) {
      // Plage invalide : on repousse l'heure de fin juste après le début.
      endSelect.value = Math.min(start + 1, 24);
      return onChange();
    }
    const newRange = { start, end };
    saveRange(newRange);
    applyRange(newRange);
    renderCalendar();
  };

  startSelect.addEventListener("change", onChange);
  endSelect.addEventListener("change", onChange);
}

function switchView(view) {
  currentView = view;
  // En Entreprise, l'onglet "Mois" est le tableau de présence par personne (planningEntreprise)
  // plutôt que le mois classique à activités : Jour et Semaine, eux, sont partagés avec Solo/Famille.
  const entrepriseMonth = currentEspace() === "entreprise" && view === "mois";

  document.getElementById("weekView").classList.toggle("hidden", view !== "semaine");
  document.getElementById("dayView").classList.toggle("hidden", view !== "jour");
  document.getElementById("monthView").classList.toggle("hidden", !(view === "mois" && !entrepriseMonth));
  document.getElementById("planningEntreprise").classList.toggle("hidden", !entrepriseMonth);

  document.getElementById("showWeekView").classList.toggle("active", view === "semaine");
  document.getElementById("showDayView").classList.toggle("active", view === "jour");
  document.getElementById("showMonthView").classList.toggle("active", view === "mois");

  if (view === "semaine") renderCalendar();
  else if (view === "jour") renderDayCalendar();
  else if (entrepriseMonth) renderEntrepriseView();
  else renderMonthCalendar();
}

function renderMonthCalendar() {
  const grid = document.getElementById("monthGrid");
  grid.innerHTML = "";
  const courses = loadCourses();
  const today = new Date();

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  document.getElementById("monthLabel").textContent =
    new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  JOURS.forEach((jour) => {
    grid.appendChild(makeCell("month-header", jour.slice(0, 3)));
  });

  const firstOfMonth = new Date(year, month, 1);
  const gridStart = getMonday(firstOfMonth);

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    const outsideMonth = cellDate.getMonth() !== month;

    const cell = document.createElement("div");
    cell.className =
      "month-cell" +
      (outsideMonth ? " outside" : "") +
      (isSameDay(cellDate, today) ? " today" : "");
    cell.title = "Voir ce jour en détail";
    cell.addEventListener("click", () => {
      dayReferenceDate = new Date(cellDate);
      switchView("jour");
    });

    const dateNum = document.createElement("div");
    dateNum.className = "date-num";
    dateNum.textContent = cellDate.getDate();
    cell.appendChild(dateNum);

    const importantCourses = courses
      .filter((c) => c.importance === "important" || c.importance === "tres_important")
      .filter((c) => courseOccursOnDate(c, cellDate))
      .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

    importantCourses.forEach((c) => {
      const chip = document.createElement("div");
      chip.className = "chip" + (c.importance === "tres_important" ? " chip-tres-important" : "");
      chip.style.background = getCourseBackground(c);
      chip.style.color = "white";
      chip.textContent = `${c.heureDebut} ${c.activite}`;
      chip.title = c.activite;
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        openModal(c);
      });
      cell.appendChild(chip);
    });

    grid.appendChild(cell);
  }

  replayFadeIn(grid);
}

initOnboarding();
initEvents();
applyEspaceUI();
