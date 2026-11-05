
/* =================================
   BODY RESET EXERCISE
   Main JavaScript
================================= */

// Storage
const STORAGE = {
  exercises: "bodyReset_exercises",
  programs: "bodyReset_programs",
  clients: "bodyReset_clients"
};

let exercises = JSON.parse(localStorage.getItem(STORAGE.exercises)) || [];
let programs = JSON.parse(localStorage.getItem(STORAGE.programs)) || [];
let clients = JSON.parse(localStorage.getItem(STORAGE.clients)) || [];

// Helpers
function saveData() {
  localStorage.setItem(STORAGE.exercises, JSON.stringify(exercises));
  localStorage.setItem(STORAGE.programs, JSON.stringify(programs));
  localStorage.setItem(STORAGE.clients, JSON.stringify(clients));
  updateDashboard();
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showMessage(message) {
  alert(message);
}

// Navigation
function showSection(sectionId) {
  document.querySelectorAll(".page-section").forEach(section => {
    section.classList.remove("active");
  });

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });

  const target = document.getElementById(sectionId);

  if (target) {
    target.classList.add("active");
  }

  const navItem = document.querySelector(
    `.nav-item[data-section="${sectionId}"]`
  );

  if (navItem) {
    navItem.classList.add("active");
  }

  const titles = {
    dashboard: "لوحة التحكم",
    exercises: "مكتبة التمارين",
    programs: "البرامج التدريبية",
    clients: "العملاء",
    settings: "الإعدادات"
  };

  const heading = document.querySelector(".welcome h1");

  if (heading) {
    heading.textContent = titles[sectionId] || "Body Reset Exercise";
  }
}

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    showSection(item.dataset.section);
  });
});

// Dashboard
function updateDashboard() {
  const stats = document.querySelectorAll(".stat-card h3");

  if (stats.length >= 3) {
    stats[0].textContent = exercises.length;
    stats[1].textContent = programs.length;
    stats[2].textContent = clients.length;
  }

  renderExercises();
  renderPrograms();
  renderClients();
}

// Exercise Management
function addExercise(data) {
  exercises.push({
    id: createId(),
    name: data.name,
    muscle: data.muscle,
    equipment: data.equipment,
    level: data.level,
    description: data.description,
    image: data.image,
    video: data.video,
    date: new Date().toISOString()
  });

  saveData();
}

function deleteExercise(id) {
  if (!confirm("هل أنت متأكد من حذف التمرين؟")) return;

  exercises = exercises.filter(item => item.id !== id);
  saveData();
}

function renderExercises() {
  const grid = document.getElementById("exerciseGrid");

  if (!grid) return;

  if (!exercises.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏋️</div>
        <h3>لسه مفيش تمارين</h3>
        <p>ابدأ بإضافة أول تمرين لمكتبتك.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = exercises.map(item => `
    <article class="exercise-card">
      <div class="exercise-image">
        ${item.image
          ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">`
          : "🏋️"}
      </div>
      <div class="exercise-info">
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.description || "لا يوجد وصف بعد")}</p>
        <div class="exercise-tags">
          <span class="tag">${escapeHTML(item.muscle)}</span>
          <span class="tag">${escapeHTML(item.level)}</span>
        </div>
        ${item.video ? `
          <p><a href="${escapeHTML(item.video)}" target="_blank" rel="noopener">مشاهدة الفيديو ↗</a></p>
        ` : ""}
        <button class="small-btn" onclick="deleteExercise('${item.id}')">
          حذف
        </button>
      </div>
    </article>
  `).join("");
}

// Search and Filter
function filterExercises() {
  const search = document.getElementById("exerciseSearch");
  const filter = document.getElementById("exerciseFilter");

  const searchValue = search ? search.value.trim().toLowerCase() : "";
  const filterValue = filter ? filter.value : "";

  const grid = document.getElementById("exerciseGrid");

  if (!grid) return;

  const filtered = exercises.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchValue) ||
      item.muscle.toLowerCase().includes(searchValue);

    const matchesFilter =
      !filterValue || item.muscle === filterValue;

    return matchesSearch && matchesFilter;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔎</div>
        <h3>لا توجد نتائج</h3>
        <p>جرّب تغيير كلمة البحث أو الفلتر.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <article class="exercise-card">
      <div class="exercise-image">
        ${item.image
          ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">`
          : "🏋️"}
      </div>
      <div class="exercise-info">
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.description || "")}</p>
        <div class="exercise-tags">
          <span class="tag">${escapeHTML(item.muscle)}</span>
          <span class="tag">${escapeHTML(item.level)}</span>
        </div>
        <button class="small-btn" onclick="deleteExercise('${item.id}')">حذف</button>
      </div>
    </article>
  `).join("");
}

document.getElementById("exerciseSearch")?.addEventListener("input", filterExercises);
document.getElementById("exerciseFilter")?.addEventListener("change", filterExercises);

// Program Management
function addProgram(data) {
  programs.push({
    id: createId(),
    name: data.name,
    duration: data.duration,
    level: data.level,
    description: data.description
  });

  saveData();
}

function deleteProgram(id) {
  if (!confirm("هل تريد حذف البرنامج؟")) return;

  programs = programs.filter(item => item.id !== id);
  saveData();
}

function renderPrograms() {
  const list = document.getElementById("programList");

  if (!list) return;

  if (!programs.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>لا توجد برامج تدريبية</h3>
        <p>أنشئ أول برنامج تدريبي.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = programs.map(item => `
    <div class="list-item">
      <div>
        <h3>${escapeHTML(item.name)}</h3>
        <p>
          ${escapeHTML(item.duration)} |
          ${escapeHTML(item.level)}
        </p>
        <p>${escapeHTML(item.description || "")}</p>
      </div>
      <div class="item-actions">
        <button class="small-btn" onclick="deleteProgram('${item.id}')">
          حذف
        </button>
      </div>
    </div>
  `).join("");
}

// Client Management
function addClient(data) {
  clients.push({
    id: createId(),
    name: data.name,
    phone: data.phone,
    weight: data.weight,
    goal: data.goal,
    notes: data.notes
  });

  saveData();
}

function deleteClient(id) {
  if (!confirm("هل تريد حذف العميل؟")) return;

  clients = clients.filter(item => item.id !== id);
  saveData();
}

function renderClients() {
  const list = document.getElementById("clientList");

  if (!list) return;

  if (!clients.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👤</div>
        <h3>لا يوجد عملاء حتى الآن</h3>
        <p>أضف أول عميل لمتابعة تقدمه.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = clients.map(item => `
    <div class="list-item">
      <div>
        <h3>${escapeHTML(item.name)}</h3>
        <p>الهاتف: ${escapeHTML(item.phone || "غير مسجل")}</p>
        <p>الوزن: ${escapeHTML(item.weight || "غير مسجل")} كجم</p>
        <p>الهدف: ${escapeHTML(item.goal || "غير محدد")}</p>
        <p>${escapeHTML(item.notes || "")}</p>
      </div>
      <button class="small-btn" onclick="deleteClient('${item.id}')">
        حذف
      </button>
    </div>
  `).join("");
}

// Modal
function openModal(title, content) {
  const modal = document.getElementById("modal");

  if (!modal) return;

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      ${content}
    </div>
  `;

  modal.classList.add("active");
}

function closeModal() {
  const modal = document.getElementById("modal");

  if (modal) {
    modal.classList.remove("active");
  }
}

// Add Exercise Form
function openExerciseForm() {
  openModal("إضافة تمرين جديد", `
    <form id="exerciseForm">
      <div class="form-grid">
        <div class="form-group">
          <label>اسم التمرين</label>
          <input class="form-input" name="name" required>
        </div>

        <div class="form-group">
          <label>العضلة المستهدفة</label>
          <select class="form-input" name="muscle" required>
            <option value="">اختر العضلة</option>
            <option>صدر</option>
            <option>ظهر</option>
            <option>أكتاف</option>
            <option>بايسبس</option>
            <option>ترايسبس</option>
            <option>أرجل</option>
            <option>بطن</option>
            <option>سواعد</option>
            <option>سمانة</option>
          </select>
        </div>

        <div class="form-group">
          <label>المستوى</label>
          <select class="form-input" name="level">
            <option>مبتدئ</option>
            <option>متوسط</option>
            <option>متقدم</option>
          </select>
        </div>

        <div class="form-group">
          <label>الأداة المستخدمة</label>
          <input class="form-input" name="equipment" placeholder="دامبل، بار، جهاز...">
        </div>

        <div class="form-group">
          <label>رابط الصورة</label>
          <input class="form-input" name="image" type="url" placeholder="https://...">
        </div>

        <div class="form-group">
          <label>رابط الفيديو</label>
          <input class="form-input" name="video" type="url" placeholder="https://...">
        </div>

        <div class="form-group" style="grid-column:1/-1">
          <label>شرح التمرين</label>
          <textarea class="form-input" name="description"></textarea>
        </div>
      </div>

      <button class="btn btn-primary" type="submit" style="margin-top:18px">
        حفظ التمرين
      </button>
    </form>
  `);

  document.getElementById("exerciseForm").addEventListener("submit", event => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.target).entries());

    addExercise(data);
    closeModal();
    showMessage("تمت إضافة التمرين بنجاح");
  });
}

// Add Program Form
function openProgramForm() {
  openModal("إنشاء برنامج تدريبي", `
    <form id="programForm">
      <div class="form-grid">
        <div class="form-group">
          <label>اسم البرنامج</label>
          <input class="form-input" name="name" required>
        </div>

        <div class="form-group">
          <label>مدة البرنامج</label>
          <input class="form-input" name="duration" placeholder="8 أسابيع">
        </div>

        <div class="form-group">
          <label>المستوى</label>
          <select class="form-input" name="level">
            <option>مبتدئ</option>
            <option>متوسط</option>
            <option>متقدم</option>
          </select>
        </div>

        <div class="form-group" style="grid-column:1/-1">
          <label>وصف البرنامج</label>
          <textarea class="form-input" name="description"></textarea>
        </div>
      </div>

      <button class="btn btn-primary" style="margin-top:18px">
        حفظ البرنامج
      </button>
    </form>
  `);

  document.getElementById("programForm").addEventListener("submit", event => {
    event.preventDefault();

    addProgram(Object.fromEntries(new FormData(event.target).entries()));
    closeModal();
    showMessage("تم إنشاء البرنامج بنجاح");
  });
}

// Add Client Form
function openClientForm() {
  openModal("إضافة عميل جديد", `
    <form id="clientForm">
      <div class="form-grid">
        <div class="form-group">
          <label>اسم العميل</label>
          <input class="form-input" name="name" required>
        </div>

        <div class="form-group">
          <label>رقم الهاتف</label>
          <input class="form-input" name="phone">
        </div>

        <div class="form-group">
          <label>الوزن بالكيلو</label>
          <input class="form-input" name="weight" type="number" min="0" step="0.1">
        </div>

        <div class="form-group">
          <label>الهدف</label>
          <select class="form-input" name="goal">
            <option>خسارة الدهون</option>
            <option>بناء العضلات</option>
            <option>زيادة الوزن</option>
            <option>تحسين اللياقة</option>
            <option>الحفاظ على الوزن</option>
          </select>
        </div>

        <div class="form-group" style="grid-column:1/-1">
          <label>ملاحظات</label>
          <textarea class="form-input" name="notes"></textarea>
        </div>
      </div>

      <button class="btn btn-primary" style="margin-top:18px">
        حفظ العميل
      </button>
    </form>
  `);

  document.getElementById("clientForm").addEventListener("submit", event => {
    event.preventDefault();

    addClient(Object.fromEntries(new FormData(event.target).entries()));
    closeModal();
    showMessage("تمت إضافة العميل بنجاح");
  });
}

// Close modal when clicking outside
document.getElementById("modal")?.addEventListener("click", event => {
  if (event.target.id === "modal") {
    closeModal();
  }
});

// Connect buttons
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-add-exercise]").forEach(button => {
    button.addEventListener("click", openExerciseForm);
  });

  document.querySelectorAll("[data-add-program]").forEach(button => {
    button.addEventListener("click", openProgramForm);
  });

  document.querySelectorAll("[data-add-client]").forEach(button => {
    button.addEventListener("click", openClientForm);
  });

  updateDashboard();
});

// Initial render
updateDashboard();
    
