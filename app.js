/* BODY RESET
   استخدم Project URL وPublishable key فقط.
   ممنوع وضع Secret أو service_role key هنا.
*/

const SUPABASE_URL = "https://xgxmtizyzjfxxwsmcspe.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Jl3bsVErQ87xlzyNkJrRNw_aD_TKsEg";

const configured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

const db = configured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  exercises: [],
  programs: [],
  clients: [],
  session: null
};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function safeURL(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function message(id, text, error = false) {
  const element = document.getElementById(id);
  if (!element) return;

  element.textContent = text;
  element.style.color = error ? "var(--danger)" : "var(--lime)";
}

function requireDatabase() {
  if (!db) {
    throw new Error(
      "أدخل رابط Supabase وPublishable key في أعلى ملف app.js."
    );
  }
}

async function getRows(table, query = q => q) {
  const { data, error } = await query(
    db.from(table).select("*").order("created_at", { ascending: false })
  );

  if (error) throw error;
  return data || [];
}

/* =========================
   واجهة العميل
========================= */

function setupPublic() {
  $$("[data-public-tab]").forEach(button => {
    button.addEventListener("click", () => {
      const tab = button.dataset.publicTab;

      $$("[data-public-tab]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      $("#publicExercises").classList.toggle("hidden", tab !== "exercises");
      $("#publicPrograms").classList.toggle("hidden", tab !== "programs");
    });
  });

  [
    "#publicExerciseSearch",
    "#publicMuscleFilter",
    "#publicLevelFilter"
  ].forEach(selector => {
    $(selector)?.addEventListener("input", renderPublicExercises);
    $(selector)?.addEventListener("change", renderPublicExercises);
  });

  loadPublicData();
}

async function loadPublicData() {
  try {
    requireDatabase();

    const [exercises, programs] = await Promise.all([
      getRows("exercises", q => q.eq("is_published", true)),
      getRows("programs", q => q.eq("is_published", true))
    ]);

    state.exercises = exercises;
    state.programs = programs;

    fillPublicMuscles();
    renderPublicExercises();
    renderPublicPrograms();

  } catch (error) {
    message("publicMessage", error.message, true);

    $("#publicExerciseGrid").innerHTML =
      '<div class="empty-state">تعذر تحميل التمارين.</div>';

    $("#publicProgramList").innerHTML =
      '<div class="empty-state">تعذر تحميل البرامج.</div>';
  }
}

function exerciseCard(item, admin = false) {
  const image = safeURL(item.image);
  const video = safeURL(item.video);

  return `
    <article class="exercise-card">

      <div class="exercise-image">
        ${
          image
            ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(item.name)}" loading="lazy">`
            : "🏋️"
        }
      </div>

      <div class="exercise-info">

        <h3>${escapeHTML(item.name)}</h3>

        <p>${escapeHTML(item.description || "لا يوجد وصف متاح.")}</p>

        <div class="tags">
          <span class="tag">${escapeHTML(item.muscle || "عام")}</span>
          <span class="tag">${escapeHTML(item.level || "غير محدد")}</span>
          ${item.equipment ? `<span class="tag">${escapeHTML(item.equipment)}</span>` : ""}
        </div>

        ${
          video
            ? `<a class="text-link" href="${escapeHTML(video)}" target="_blank" rel="noopener noreferrer">مشاهدة شرح التمرين</a>`
            : ""
        }

        ${
          admin
            ? `
              <div class="tags">
                <span class="tag">${item.is_published ? "منشور" : "مسودة"}</span>
              </div>

              <div class="item-actions" style="margin-top:12px">
                <button class="small-btn" data-edit="exercise" data-id="${escapeHTML(item.id)}">تعديل</button>
                <button class="small-btn publish" data-publish="exercise" data-id="${escapeHTML(item.id)}">
                  ${item.is_published ? "إلغاء النشر" : "نشر"}
                </button>
                <button class="small-btn danger" data-delete="exercise" data-id="${escapeHTML(item.id)}">حذف</button>
              </div>
            `
            : ""
        }

      </div>
    </article>
  `;
}

function fillPublicMuscles() {
  const select = $("#publicMuscleFilter");
  if (!select) return;

  const previous = select.value;

  const muscles = [
    ...new Set(state.exercises.map(item => item.muscle).filter(Boolean))
  ].sort();

  select.innerHTML =
    '<option value="">كل العضلات</option>' +
    muscles.map(muscle =>
      `<option value="${escapeHTML(muscle)}">${escapeHTML(muscle)}</option>`
    ).join("");

  select.value = muscles.includes(previous) ? previous : "";
}

function renderPublicExercises() {
  const grid = $("#publicExerciseGrid");
  if (!grid) return;

  const term = ($("#publicExerciseSearch")?.value || "").trim().toLowerCase();
  const muscle = $("#publicMuscleFilter")?.value || "";
  const level = $("#publicLevelFilter")?.value || "";

  const filtered = state.exercises.filter(item => {
    const searchText = `${item.name} ${item.muscle || ""}`.toLowerCase();

    return (
      (!term || searchText.includes(term)) &&
      (!muscle || item.muscle === muscle) &&
      (!level || item.level === level)
    );
  });

  grid.innerHTML = filtered.length
    ? filtered.map(item => exerciseCard(item)).join("")
    : '<div class="empty-state">لا توجد تمارين منشورة تطابق البحث.</div>';
}

function renderPublicPrograms() {
  const list = $("#publicProgramList");
  if (!list) return;

  list.innerHTML = state.programs.length
    ? state.programs.map(item => `
        <article class="program-card">
          <div class="program-card-body">
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.description || "لا يوجد وصف متاح.")}</p>
            <div class="tags">
              <span class="tag">${escapeHTML(item.duration || "المدة غير محددة")}</span>
              <span class="tag">${escapeHTML(item.level || "كل المستويات")}</span>
            </div>
          </div>
        </article>
      `).join("")
    : '<div class="empty-state">لا توجد برامج منشورة حاليًا.</div>';
}

/* =========================
   تسجيل دخول المدير
========================= */

async function checkAdmin() {
  const { data, error } = await db.rpc("is_admin");

  if (error) throw error;
  return data === true;
}

async function setupAdmin() {
  if (!db) {
    message(
      "loginMessage",
      "أدخل رابط Supabase وPublishable key في أعلى app.js أولًا.",
      true
    );
    return;
  }

  $("#loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    message("loginMessage", "جاري تسجيل الدخول...");

    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      await openAdmin(data.session);

    } catch (error) {
      message("loginMessage", error.message, true);
    }
  });

  const { data, error } = await db.auth.getSession();

  if (error) {
    message("loginMessage", error.message, true);
    return;
  }

  if (data.session) {
    await openAdmin(data.session);
  }
}

async function openAdmin(session) {
  state.session = session;

  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      await db.auth.signOut();
      state.session = null;

      message(
        "loginMessage",
        "هذا الحساب غير مصرح له بدخول لوحة المدير.",
        true
      );

      return;
    }

    $("#loginScreen").classList.add("hidden");
    $("#adminApp").classList.remove("hidden");

    $("#adminEmail").textContent = session.user.email || "";

    bindAdminEvents();
    await refreshAdminData();

  } catch (error) {
    message("loginMessage", error.message, true);
  }
}

/* =========================
   بيانات لوحة المدير
========================= */

async function refreshAdminData() {
  const [exercises, programs, clients] = await Promise.all([
    getRows("exercises"),
    getRows("programs"),
    getRows("clients")
  ]);

  state.exercises = exercises;
  state.programs = programs;
  state.clients = clients;

  $("#totalExercises").textContent = exercises.length;
  $("#totalPrograms").textContent = programs.length;
  $("#totalClients").textContent = clients.length;

  renderAdminExercises();
  renderAdminPrograms();
  renderAdminClients();
  renderRecentExercises();
}

function renderRecentExercises() {
  const element = $("#recentExercises");
  if (!element) return;

  const recent = state.exercises.slice(0, 5);

  element.innerHTML = recent.length
    ? recent.map(item => `
        <div class="list-card">
          <div>
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.muscle || "عام")}</p>
          </div>
          <span class="tag">${item.is_published ? "منشور" : "مسودة"}</span>
        </div>
      `).join("")
    : "لا توجد تمارين حتى الآن.";
}

function switchAdminTab(tab) {
  $$(".admin-section").forEach(section => {
    section.classList.toggle("hidden", section.id !== tab);
  });

  $$("[data-admin-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.adminTab === tab);
  });
}

function renderAdminExercises() {
  const grid = $("#exerciseGrid");
  if (!grid) return;

  const term = ($("#exerciseSearch")?.value || "").trim().toLowerCase();
  const muscle = $("#muscleFilter")?.value || "";

  const filtered = state.exercises.filter(item => {
    const text = `${item.name} ${item.muscle || ""}`.toLowerCase();

    return (
      (!term || text.includes(term)) &&
      (!muscle || item.muscle === muscle)
    );
  });

  grid.innerHTML = filtered.length
    ? filtered.map(item => exerciseCard(item, true)).join("")
    : '<div class="empty-state">لا توجد تمارين.</div>';
}

function renderAdminPrograms() {
  const list = $("#programList");
  if (!list) return;

  list.innerHTML = state.programs.length
    ? state.programs.map(item => `
        <article class="program-card">
          <div class="program-card-body">
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.description || "")}</p>

            <div class="tags">
              <span class="tag">${escapeHTML(item.duration || "المدة غير محددة")}</span>
              <span class="tag">${escapeHTML(item.level || "غير محدد")}</span>
              <span class="tag">${item.is_published ? "منشور" : "مسودة"}</span>
            </div>

            <div class="item-actions" style="margin-top:14px">
              <button class="small-btn" data-edit="program" data-id="${escapeHTML(item.id)}">تعديل</button>
              <button class="small-btn publish" data-publish="program" data-id="${escapeHTML(item.id)}">
                ${item.is_published ? "إلغاء النشر" : "نشر"}
              </button>
              <button class="small-btn danger" data-delete="program" data-id="${escapeHTML(item.id)}">حذف</button>
            </div>
          </div>
        </article>
      `).join("")
    : '<div class="empty-state">لم تضف برامج بعد.</div>';
}

function renderAdminClients() {
  const list = $("#clientList");
  if (!list) return;

  list.innerHTML = state.clients.length
    ? state.clients.map(item => `
        <article class="list-card">
          <div>
            <h3>${escapeHTML(item.name)}</h3>
            <p>الهاتف: ${escapeHTML(item.phone || "غير مسجل")}</p>
            <p>الوزن: ${escapeHTML(item.weight ?? "غير مسجل")} كجم</p>
            <p>الهدف: ${escapeHTML(item.goal || "غير محدد")}</p>
            <p>${escapeHTML(item.notes || "")}</p>
          </div>

          <div class="item-actions">
            <button class="small-btn" data-edit="client" data-id="${escapeHTML(item.id)}">تعديل</button>
            <button class="small-btn danger" data-delete="client" data-id="${escapeHTML(item.id)}">حذف</button>
          </div>
        </article>
      `).join("")
    : '<div class="empty-state">لا يوجد عملاء مسجلون.</div>';
}

/* =========================
   نوافذ الإضافة والتعديل
========================= */

function showModal(title, html) {
  $("#modalBody").innerHTML = `
    <h2 style="margin-bottom:18px">${escapeHTML(title)}</h2>
    ${html}
  `;

  $("#modal").classList.remove("hidden");
  $("#modal").setAttribute("aria-hidden", "false");
}

function closeModal() {
  $("#modal").classList.add("hidden");
  $("#modal").setAttribute("aria-hidden", "true");
}

function field(label, name, value = "", type = "text", extra = "") {
  return `
    <div class="form-group">
      <label>
        ${label}
        <input
          class="field"
          name="${name}"
          type="${type}"
          value="${escapeHTML(value)}"
          ${extra}
        >
      </label>
    </div>
  `;
}

function textarea(label, name, value = "") {
  return `
    <div class="form-group full">
      <label>
        ${label}
        <textarea class="field" name="${name}" rows="3">${escapeHTML(value)}</textarea>
      </label>
    </div>
  `;
}

function select(label, name, options, value = "") {
  return `
    <div class="form-group">
      <label>
        ${label}
        <select class="field" name="${name}">
          ${options.map(option => `
            <option value="${escapeHTML(option)}" ${option === value ? "selected" : ""}>
              ${escapeHTML(option)}
            </option>
          `).join("")}
        </select>
      </label>
    </div>
  `;
}

function formActions() {
  return `
    <div class="form-actions">
      <button class="btn btn-primary" type="submit">حفظ</button>
      <button class="btn btn-quiet" type="button" data-close-modal>إلغاء</button>
    </div>
  `;
}

function openExerciseEditor(item = {}) {
  showModal(item.id ? "تعديل تمرين" : "إضافة تمرين", `
    <form id="recordForm">
      <div class="form-grid">

        ${field("اسم التمرين", "name", item.name || "", "text", "required")}

        ${select("العضلة المستهدفة", "muscle", [
          "الصدر", "الظهر", "الأكتاف", "البايسبس",
          "الترايسبس", "الأرجل", "البطن", "الكارديو"
        ], item.muscle || "الصدر")}

        ${select("المستوى", "level", [
          "مبتدئ", "متوسط", "متقدم"
        ], item.level || "مبتدئ")}

        ${field("الأدوات المستخدمة", "equipment", item.equipment || "")}

        ${field("رابط الصورة", "image", item.image || "", "url")}

        ${field("رابط الفيديو", "video", item.video || "", "url")}

        ${textarea("وصف التمرين وطريقة الأداء", "description", item.description || "")}

      </div>

      <label class="check-row">
        <input type="checkbox" name="is_published" ${item.is_published ? "checked" : ""}>
        نشر التمرين ليظهر للعميل
      </label>

      ${formActions()}
    </form>
  `);

  bindRecordForm("exercises", item);
}

function openProgramEditor(item = {}) {
  showModal(item.id ? "تعديل برنامج" : "إضافة برنامج", `
    <form id="recordForm">
      <div class="form-grid">

        ${field("اسم البرنامج", "name", item.name || "", "text", "required")}

        ${field("مدة البرنامج", "duration", item.duration || "")}

        ${select("المستوى", "level", [
          "مبتدئ", "متوسط", "متقدم", "كل المستويات"
        ], item.level || "مبتدئ")}

        ${textarea("وصف البرنامج", "description", item.description || "")}

      </div>

      <label class="check-row">
        <input type="checkbox" name="is_published" ${item.is_published ? "checked" : ""}>
        نشر البرنامج ليظهر للعميل
      </label>

      ${formActions()}
    </form>
  `);

  bindRecordForm("programs", item);
}

function openClientEditor(item = {}) {
  showModal(item.id ? "تعديل بيانات العميل" : "إضافة عميل", `
    <form id="recordForm">
      <div class="form-grid">

        ${field("اسم العميل", "name", item.name || "", "text", "required")}

        ${field("رقم الهاتف", "phone", item.phone || "", "tel")}

        ${field("الوزن بالكيلو", "weight", item.weight ?? "", "number", 'min="0" step="0.1"')}

        ${select("الهدف", "goal", [
          "خسارة الدهون",
          "بناء العضلات",
          "زيادة الوزن",
          "تحسين اللياقة",
          "الحفاظ على الوزن"
        ], item.goal || "تحسين اللياقة")}

        ${textarea("ملاحظات", "notes", item.notes || "")}

      </div>

      ${formActions()}
    </form>
  `);

  bindRecordForm("clients", item);
}

/* =========================
   حفظ البيانات
========================= */

function bindRecordForm(table, item) {
  $("#recordForm").addEventListener("submit", async event => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    if (table !== "clients") {
      payload.is_published = form.get("is_published") === "on";
    }

    if (table === "exercises") {
      for (const key of ["image", "video"]) {
        if (payload[key] && !safeURL(payload[key])) {
          alert("رابط الصورة أو الفيديو غير صالح.");
          return;
        }
      }
    }

    if (table === "clients") {
      payload.weight = payload.weight === ""
        ? null
        : Number(payload.weight);
    }

    try {
      const query = item.id
        ? db.from(table).update(payload).eq("id", item.id)
        : db.from(table).insert({
            ...payload,
            user_id: state.session.user.id
          });

      const { error } = await query;
      if (error) throw error;

      closeModal();
      await refreshAdminData();
      message("adminMessage", "تم حفظ البيانات بنجاح.");

    } catch (error) {
      alert(error.message);
    }
  });
}

/* =========================
   النشر والحذف
========================= */

async function togglePublish(table, item) {
  try {
    const { error } = await db
      .from(table)
      .update({ is_published: !item.is_published })
      .eq("id", item.id);

    if (error) throw error;

    await refreshAdminData();

    message(
      "adminMessage",
      item.is_published ? "تم إلغاء النشر." : "تم نشر العنصر."
    );

  } catch (error) {
    message("adminMessage", error.message, true);
  }
}

async function deleteRecord(table, id) {
  if (!confirm("هل أنت متأكد من حذف هذا العنصر؟")) return;

  try {
    const { error } = await db
      .from(table)
      .delete()
      .eq("id", id);

    if (error) throw error;

    await refreshAdminData();
    message("adminMessage", "تم الحذف بنجاح.");

  } catch (error) {
    message("adminMessage", error.message, true);
  }
}

/* =========================
   أحداث لوحة المدير
========================= */

function bindAdminEvents() {
  $$("[data-admin-tab]").forEach(button => {
    button.addEventListener("click", () => {
      switchAdminTab(button.dataset.adminTab);
    });
  });

  $("#addExercise").addEventListener("click", () => openExerciseEditor());
  $("#addProgram").addEventListener("click", () => openProgramEditor());
  $("#addClient").addEventListener("click", () => openClientEditor());

  $("#exerciseSearch").addEventListener("input", renderAdminExercises);
  $("#muscleFilter").addEventListener("change", renderAdminExercises);

  $("#modal").addEventListener("click", event => {
    if (event.target.closest("[data-close-modal]")) {
      closeModal();
    }
  });

  $("#adminApp").addEventListener("click", event => {
    const edit = event.target.closest("[data-edit]");
    const publish = event.target.closest("[data-publish]");
    const remove = event.target.closest("[data-delete]");

    if (edit) {
      const type = edit.dataset.edit;
      const table = {
        exercise: "exercises",
        program: "programs",
        client: "clients"
      }[type];

      const item = state[table].find(
        row => String(row.id) === edit.dataset.id
      );

      if (!item) return;

      if (type === "exercise") openExerciseEditor(item);
      if (type === "program") openProgramEditor(item);
      if (type === "client") openClientEditor(item);
    }

    if (publish) {
      const type = publish.dataset.publish;
      const table = type === "exercise" ? "exercises" : "programs";

      const item = state[table].find(
        row => String(row.id) === publish.dataset.id
      );

      if (item) togglePublish(table, item);
    }

    if (remove) {
      const table = {
        exercise: "exercises",
        program: "programs",
        client: "clients"
      }[remove.dataset.delete];

      deleteRecord(table, remove.dataset.id);
    }
  });

  $("#logoutBtn").addEventListener("click", async () => {
    const { error } = await db.auth.signOut();

    if (error) {
      message("adminMessage", error.message, true);
      return;
    }

    location.reload();
  });
}

/* =========================
   تشغيل التطبيق
========================= */

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "public") {
    setupPublic();
  }

  if (document.body.dataset.page === "admin") {
    setupAdmin();
  }
});