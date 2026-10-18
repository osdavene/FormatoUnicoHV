/**
 * Aplicación Web Local para diligenciar el Formato Único de Hoja de Vida (Persona Natural)
 * Guarda automáticamente en LocalStorage, permite exportar/importar JSON,
 * ordena experiencias de la más reciente a la más antigua y estampa sobre el PDF oficial.
 */

const STORAGE_KEY = "formato_unico_hv_data_v2";

function createEmptyEstudio() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    modalidad: "UN",
    semestres: "",
    graduado: "SI",
    nombreTitulo: "",
    mesTerminacion: "",
    anioTerminacion: "",
    tarjetaProfesional: ""
  };
}

function createEmptyIdioma() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    idioma: "",
    habla: "B",
    lee: "B",
    escribe: "B"
  };
}

function createEmptyExperiencia() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    actual: false,
    empresa: "",
    tipoEntidad: "PRIVADA", // PUBLICA | PRIVADA
    sectorTiempo: "PRIVADO", // PUBLICO | PRIVADO | INDEPENDIENTE
    pais: "COLOMBIA",
    departamento: "",
    municipio: "",
    correoEntidad: "",
    telefonos: "",
    fechaIngreso: "",
    fechaRetiro: "",
    cargo: "",
    dependencia: "",
    direccion: ""
  };
}

function getDefaultState() {
  return {
    entidadReceptora: "",
    primerApellido: "",
    segundoApellido: "",
    nombres: "",
    tipoDoc: "CC",
    numDoc: "",
    sexo: "M",
    nacionalidad: "COL",
    paisNacionalidad: "COLOMBIA",
    claseLibreta: "",
    numLibreta: "",
    dmLibreta: "",
    fechaNacimiento: "",
    paisNacimiento: "COLOMBIA",
    deptoNacimiento: "",
    municipioNacimiento: "",
    direccionCorrespondencia: "",
    paisCorrespondencia: "COLOMBIA",
    deptoCorrespondencia: "",
    municipioCorrespondencia: "",
    telefono: "",
    email: "",
    gradoBasica: "11",
    tituloBachiller: "",
    mesGradoBachiller: "",
    anioGradoBachiller: "",
    estudios: [createEmptyEstudio()],
    idiomas: [createEmptyIdioma()],
    experiencias: [createEmptyExperiencia()],
    tiempoPublicoAnios: "",
    tiempoPublicoMeses: "",
    tiempoPrivadoAnios: "",
    tiempoPrivadoMeses: "",
    tiempoIndependienteAnios: "",
    tiempoIndependienteMeses: "",
    tiempoTotalAnios: "",
    tiempoTotalMeses: "",
    inhabilidad: "NO",
    ciudadFechaDiligenciamiento: "",
    firmaDataUrl: ""
  };
}

let state = getDefaultState();

// ============================================================================
// ORDENAMIENTO CRONOLÓGICO (DE LA MÁS RECIENTE A LA MÁS ANTIGUA)
// ============================================================================
function getExperienceSortScore(exp) {
  // Si es empleo actual o contrato vigente, tiene máxima prioridad
  const isCurrent = Boolean(exp.actual);
  const ingresoTs = exp.fechaIngreso ? Date.parse(exp.fechaIngreso) || 0 : 0;
  const retiroTs = exp.fechaRetiro ? Date.parse(exp.fechaRetiro) || 0 : 0;
  // Si está marcado como actual y no tiene fecha de retiro, usamos Infinity
  const effectiveEnd = isCurrent && !retiroTs ? Number.MAX_SAFE_INTEGER : (retiroTs || ingresoTs);
  return {
    isCurrent: isCurrent ? 1 : 0,
    effectiveEnd,
    ingresoTs
  };
}

function getSortedExperiencias(list) {
  return [...(list || [])].sort((a, b) => {
    const sa = getExperienceSortScore(a);
    const sb = getExperienceSortScore(b);
    if (sb.isCurrent !== sa.isCurrent) return sb.isCurrent - sa.isCurrent;
    if (sb.effectiveEnd !== sa.effectiveEnd) return sb.effectiveEnd - sa.effectiveEnd;
    return sb.ingresoTs - sa.ingresoTs;
  });
}

// ============================================================================
// PERSISTENCIA (LOCALSTORAGE + JSON)
// ============================================================================
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const el = document.getElementById("saveStatusText");
    if (el) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      el.textContent = `Guardado automáticamente (${timeStr})`;
    }
  } catch (err) {
    console.error("Error guardando en LocalStorage:", err);
  }
}

function loadState() {
  try {
    localStorage.removeItem("formato_unico_hv_data_v1");
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...getDefaultState(), ...parsed };
      if (!Array.isArray(state.estudios) || state.estudios.length === 0) state.estudios = [createEmptyEstudio()];
      if (!Array.isArray(state.idiomas)) state.idiomas = [];
      if (!Array.isArray(state.experiencias) || state.experiencias.length === 0) state.experiencias = [createEmptyExperiencia()];
    } else {
      state = getDefaultState();
    }
  } catch (err) {
    console.error("Error leyendo LocalStorage:", err);
    state = getDefaultState();
  }
}

// ============================================================================
// RENDERIZADO DEL FORMULARIO
// ============================================================================
function renderGradeButtons() {
  const container = document.getElementById("gradeSelector");
  if (!container) return;
  container.innerHTML = "";
  const labels = ["1o.", "2o.", "3o.", "4o.", "5o.", "6o.", "7o.", "8o.", "9o.", "10", "11"];
  for (let i = 1; i <= 11; i++) {
    const val = String(i);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "grade-btn" + (String(state.gradoBasica) === val ? " selected" : "");
    btn.textContent = labels[i - 1];
    btn.addEventListener("click", () => {
      state.gradoBasica = String(state.gradoBasica) === val ? "" : val;
      renderGradeButtons();
      saveState();
    });
    container.appendChild(btn);
  }
}

function renderEstudios() {
  const container = document.getElementById("estudiosList");
  if (!container) return;
  container.innerHTML = "";

  state.estudios.forEach((est, idx) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-header">
        <div class="item-badge-group">
          <span class="badge badge-order">Estudio Superior #${idx + 1}</span>
          ${idx >= 5 ? `<span class="badge" style="background:#fef3c7;color:#b45309;">Nota: La tabla oficial de la Hoja 1 muestra hasta 5 filas</span>` : ""}
        </div>
        <button type="button" class="btn btn-danger-ghost btn-sm" data-remove-estudio="${idx}">🗑️ Eliminar</button>
      </div>
      <div class="grid-4">
        <div class="field">
          <label>Modalidad Académica</label>
          <select data-est-idx="${idx}" data-est-key="modalidad">
            <option value="">Seleccione...</option>
            <option value="TC" ${est.modalidad === "TC" ? "selected" : ""}>TC - Técnica</option>
            <option value="TL" ${est.modalidad === "TL" ? "selected" : ""}>TL - Tecnológica</option>
            <option value="TE" ${est.modalidad === "TE" ? "selected" : ""}>TE - Tecnológica Especializada</option>
            <option value="UN" ${est.modalidad === "UN" ? "selected" : ""}>UN - Universitaria</option>
            <option value="ES" ${est.modalidad === "ES" ? "selected" : ""}>ES - Especialización</option>
            <option value="MG" ${est.modalidad === "MG" ? "selected" : ""}>MG - Maestría o Magister</option>
            <option value="DOC" ${est.modalidad === "DOC" ? "selected" : ""}>DOC - Doctorado o PHD</option>
          </select>
        </div>
        <div class="field">
          <label>No. Semestres Aprobados</label>
          <input type="text" data-est-idx="${idx}" data-est-key="semestres" value="${escapeAttr(est.semestres)}" placeholder="Ej: 10" />
        </div>
        <div class="field">
          <label>¿Graduado?</label>
          <select data-est-idx="${idx}" data-est-key="graduado">
            <option value="SI" ${est.graduado === "SI" ? "selected" : ""}>SÍ</option>
            <option value="NO" ${est.graduado === "NO" ? "selected" : ""}>NO</option>
          </select>
        </div>
        <div class="field">
          <label>No. Tarjeta Profesional</label>
          <input type="text" data-est-idx="${idx}" data-est-key="tarjetaProfesional" value="${escapeAttr(est.tarjetaProfesional)}" placeholder="Si aplica" />
        </div>
      </div>
      <div class="grid-3">
        <div class="field col-span-2">
          <label>Nombre de los Estudios o Título Obtenido</label>
          <input type="text" data-est-idx="${idx}" data-est-key="nombreTitulo" value="${escapeAttr(est.nombreTitulo)}" placeholder="Ej: INGENIERO DE SISTEMAS" />
        </div>
        <div class="field">
          <label>Fecha de Terminación (Mes / Año)</label>
          <div class="grid-2">
            <select data-est-idx="${idx}" data-est-key="mesTerminacion">
              <option value="">Mes...</option>
              ${["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => `<option value="${m}" ${est.mesTerminacion === m ? "selected" : ""}>${m}</option>`).join("")}
            </select>
            <input type="number" data-est-idx="${idx}" data-est-key="anioTerminacion" value="${escapeAttr(est.anioTerminacion)}" placeholder="Año (Ej: 2021)" min="1950" max="2099" />
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-est-idx]").forEach(el => {
    el.addEventListener("input", (e) => {
      const i = Number(e.target.getAttribute("data-est-idx"));
      const k = e.target.getAttribute("data-est-key");
      state.estudios[i][k] = forceInputUppercase(e.target);
      saveState();
    });
  });

  container.querySelectorAll("[data-remove-estudio]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-remove-estudio"));
      state.estudios.splice(i, 1);
      if (state.estudios.length === 0) state.estudios.push(createEmptyEstudio());
      renderEstudios();
      saveState();
    });
  });
}

function renderIdiomas() {
  const container = document.getElementById("idiomasList");
  if (!container) return;
  container.innerHTML = "";

  if (state.idiomas.length === 0) {
    container.innerHTML = `<p style="font-size:0.84rem; color:var(--text-muted);">No has registrado idiomas adicionales al español.</p>`;
    return;
  }

  state.idiomas.forEach((idi, idx) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-header">
        <div class="item-badge-group">
          <span class="badge badge-order">Idioma #${idx + 1}</span>
          ${idx >= 2 ? `<span class="badge" style="background:#fef3c7;color:#b45309;">La Hoja 1 tiene espacio para 2 idiomas</span>` : ""}
        </div>
        <button type="button" class="btn btn-danger-ghost btn-sm" data-remove-idioma="${idx}">🗑️ Eliminar</button>
      </div>
      <div class="grid-4">
        <div class="field">
          <label>Idioma</label>
          <input type="text" data-idi-idx="${idx}" data-idi-key="idioma" value="${escapeAttr(idi.idioma)}" placeholder="Ej: INGLÉS" />
        </div>
        <div class="field">
          <label>Lo Habla</label>
          <select data-idi-idx="${idx}" data-idi-key="habla">
            <option value="">-</option>
            <option value="R" ${idi.habla === "R" ? "selected" : ""}>R - Regular</option>
            <option value="B" ${idi.habla === "B" ? "selected" : ""}>B - Bien</option>
            <option value="MB" ${idi.habla === "MB" ? "selected" : ""}>MB - Muy Bien</option>
          </select>
        </div>
        <div class="field">
          <label>Lo Lee</label>
          <select data-idi-idx="${idx}" data-idi-key="lee">
            <option value="">-</option>
            <option value="R" ${idi.lee === "R" ? "selected" : ""}>R - Regular</option>
            <option value="B" ${idi.lee === "B" ? "selected" : ""}>B - Bien</option>
            <option value="MB" ${idi.lee === "MB" ? "selected" : ""}>MB - Muy Bien</option>
          </select>
        </div>
        <div class="field">
          <label>Lo Escribe</label>
          <select data-idi-idx="${idx}" data-idi-key="escribe">
            <option value="">-</option>
            <option value="R" ${idi.escribe === "R" ? "selected" : ""}>R - Regular</option>
            <option value="B" ${idi.escribe === "B" ? "selected" : ""}>B - Bien</option>
            <option value="MB" ${idi.escribe === "MB" ? "selected" : ""}>MB - Muy Bien</option>
          </select>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-idi-idx]").forEach(el => {
    el.addEventListener("input", (e) => {
      const i = Number(e.target.getAttribute("data-idi-idx"));
      const k = e.target.getAttribute("data-idi-key");
      state.idiomas[i][k] = forceInputUppercase(e.target);
      saveState();
    });
  });

  container.querySelectorAll("[data-remove-idioma]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-remove-idioma"));
      state.idiomas.splice(i, 1);
      renderIdiomas();
      saveState();
    });
  });
}

function renderExperiencias() {
  const container = document.getElementById("experienciasList");
  if (!container) return;
  container.innerHTML = "";

  // Calculamos en qué posición quedará cada experiencia al ordenarse de más reciente a más antigua
  const sorted = getSortedExperiencias(state.experiencias);
  const rankMap = new Map();
  sorted.forEach((item, sIdx) => {
    rankMap.set(item.id, sIdx);
  });

  state.experiencias.forEach((exp, idx) => {
    const pdfOrderIdx = rankMap.get(exp.id) ?? idx;
    const sheetNumber = Math.floor(pdfOrderIdx / 4) + 1;
    const blockInSheet = (pdfOrderIdx % 4) + 1;

    const card = document.createElement("div");
    card.className = "item-card" + (exp.actual ? " current-job" : "");
    card.innerHTML = `
      <div class="item-card-header">
        <div class="item-badge-group">
          <span class="badge badge-order" data-rank-badge="${exp.id}">
            Posición en PDF: #${pdfOrderIdx + 1} (${pdfOrderIdx === 0 ? "Empleo Actual / Más Reciente" : "Anterior"})
          </span>
          <span class="badge badge-page" data-page-badge="${exp.id}">
            Hoja de Experiencia ${sheetNumber} • Bloque ${blockInSheet} de 4
          </span>
          ${exp.actual ? `<span class="badge badge-current">✓ Contrato Vigente / Empleo Actual</span>` : ""}
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <label style="display:inline-flex; align-items:center; gap:0.4rem; font-size:0.8rem; font-weight:700; cursor:pointer; color:#0f172a;">
            <input type="checkbox" data-exp-actual="${idx}" ${exp.actual ? "checked" : ""} />
            Es empleo actual / contrato vigente
          </label>
          <button type="button" class="btn btn-danger-ghost btn-sm" data-remove-exp="${idx}">🗑️ Eliminar</button>
        </div>
      </div>

      <div class="grid-4">
        <div class="field col-span-2">
          <label>Empresa o Entidad</label>
          <input type="text" data-exp-idx="${idx}" data-exp-key="empresa" value="${escapeAttr(exp.empresa)}" placeholder="Nombre de la empresa o entidad contratante" />
        </div>
        <div class="field">
          <label>Carácter de la Entidad</label>
          <select data-exp-idx="${idx}" data-exp-key="tipoEntidad">
            <option value="PUBLICA" ${exp.tipoEntidad === "PUBLICA" ? "selected" : ""}>PÚBLICA (Marca X en Pública)</option>
            <option value="PRIVADA" ${exp.tipoEntidad === "PRIVADA" ? "selected" : ""}>PRIVADA (Marca X en Privada)</option>
          </select>
        </div>
        <div class="field">
          <label>Tipo de Vinculación (Para Punto 4)</label>
          <select data-exp-idx="${idx}" data-exp-key="sectorTiempo">
            <option value="PUBLICO" ${exp.sectorTiempo === "PUBLICO" ? "selected" : ""}>Servidor Público</option>
            <option value="PRIVADO" ${exp.sectorTiempo === "PRIVADO" ? "selected" : ""}>Empleado del Sector Privado</option>
            <option value="INDEPENDIENTE" ${exp.sectorTiempo === "INDEPENDIENTE" ? "selected" : ""}>Trabajador Independiente / Contratista</option>
          </select>
        </div>
      </div>

      <div class="grid-4">
        <div class="field">
          <label>País</label>
          <input type="text" data-exp-idx="${idx}" data-exp-key="pais" value="${escapeAttr(exp.pais)}" placeholder="COLOMBIA" />
        </div>
        <div class="field">
          <label>Departamento</label>
          <input type="text" data-exp-idx="${idx}" data-exp-key="departamento" value="${escapeAttr(exp.departamento)}" placeholder="Ej: BOGOTÁ D.C." />
        </div>
        <div class="field">
          <label>Municipio</label>
          <input type="text" data-exp-idx="${idx}" data-exp-key="municipio" value="${escapeAttr(exp.municipio)}" placeholder="Ej: BOGOTÁ D.C." />
        </div>
        <div class="field">
          <label>Correo Electrónico Entidad</label>
          <input type="email" data-exp-idx="${idx}" data-exp-key="correoEntidad" value="${escapeAttr(exp.correoEntidad)}" placeholder="CONTACTO@ENTIDAD.GOV.CO" />
        </div>
      </div>

      <div class="grid-3">
        <div class="field">
          <label>Teléfonos</label>
          <input type="text" data-exp-idx="${idx}" data-exp-key="telefonos" value="${escapeAttr(exp.telefonos)}" placeholder="Ej: (601) 3456789" />
        </div>
        <div class="field">
          <label>Fecha de Ingreso</label>
          <input type="date" data-exp-idx="${idx}" data-exp-key="fechaIngreso" value="${escapeAttr(exp.fechaIngreso)}" />
        </div>
        <div class="field">
          <label>Fecha de Retiro ${exp.actual ? "(Opcional si sigue vigente)" : ""}</label>
          <input type="date" data-exp-idx="${idx}" data-exp-key="fechaRetiro" value="${escapeAttr(exp.fechaRetiro)}" />
        </div>
      </div>

      <div class="grid-3">
        <div class="field">
          <label>Cargo o Contrato</label>
          <input type="text" data-exp-idx="${idx}" data-exp-key="cargo" value="${escapeAttr(exp.cargo)}" placeholder="Ej: ANALISTA DE SISTEMAS / CONTRATISTA" />
        </div>
        <div class="field">
          <label>Dependencia</label>
          <input type="text" data-exp-idx="${idx}" data-exp-key="dependencia" value="${escapeAttr(exp.dependencia)}" placeholder="Ej: OFICINA DE TI" />
        </div>
        <div class="field">
          <label>Dirección</label>
          <input type="text" data-exp-idx="${idx}" data-exp-key="direccion" value="${escapeAttr(exp.direccion)}" placeholder="Ej: CARRERA 8 # 12 - 34" />
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Eventos de inputs de experiencia
  container.querySelectorAll("[data-exp-idx]").forEach(el => {
    el.addEventListener("input", (e) => {
      const i = Number(e.target.getAttribute("data-exp-idx"));
      const k = e.target.getAttribute("data-exp-key");
      state.experiencias[i][k] = forceInputUppercase(e.target);
      updateExperienceOrderBadges();
      saveState();
    });
  });

  container.querySelectorAll("[data-exp-actual]").forEach(chk => {
    chk.addEventListener("change", (e) => {
      const i = Number(e.target.getAttribute("data-exp-actual"));
      state.experiencias[i].actual = e.target.checked;
      renderExperiencias();
      saveState();
    });
  });

  container.querySelectorAll("[data-remove-exp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-remove-exp"));
      state.experiencias.splice(i, 1);
      if (state.experiencias.length === 0) state.experiencias.push(createEmptyExperiencia());
      renderExperiencias();
      saveState();
    });
  });
}

function updateExperienceOrderBadges() {
  const sorted = getSortedExperiencias(state.experiencias);
  sorted.forEach((item, pdfOrderIdx) => {
    const sheetNumber = Math.floor(pdfOrderIdx / 4) + 1;
    const blockInSheet = (pdfOrderIdx % 4) + 1;
    const rankEl = document.querySelector(`[data-rank-badge="${item.id}"]`);
    const pageEl = document.querySelector(`[data-page-badge="${item.id}"]`);
    if (rankEl) {
      rankEl.textContent = `Posición en PDF: #${pdfOrderIdx + 1} (${pdfOrderIdx === 0 ? "Empleo Actual / Más Reciente" : "Anterior"})`;
    }
    if (pageEl) {
      pageEl.textContent = `Hoja de Experiencia ${sheetNumber} • Bloque ${blockInSheet} de 4`;
    }
  });
}

function syncStaticInputsFromState() {
  document.querySelectorAll("[data-field]").forEach(el => {
    const key = el.getAttribute("data-field");
    el.value = state[key] ?? "";
  });

  const radioNames = ["tipoDoc", "sexo", "nacionalidad", "claseLibreta", "inhabilidad"];
  radioNames.forEach(name => {
    const val = state[name] ?? "";
    const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
    if (radio) radio.checked = true;
  });

  renderGradeButtons();
  renderEstudios();
  renderIdiomas();
  renderExperiencias();
  renderSignaturePreview();
}

function escapeAttr(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function forceInputUppercase(el) {
  const val = String(el.value ?? "");
  if (el.tagName === "INPUT" && ["text", "email", "tel"].includes(el.type)) {
    const upper = val.toUpperCase();
    if (el.value !== upper) {
      try {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        el.value = upper;
        if (start !== null && end !== null) el.setSelectionRange(start, end);
      } catch (_) {
        el.value = upper;
      }
    }
    return upper;
  }
  return val;
}

// ============================================================================
// CÁLCULO AUTOMÁTICO DEL PUNTO 4 (TIEMPO TOTAL DE EXPERIENCIA)
// ============================================================================
function calcularTiempoExperiencia() {
  const totalsDays = {
    PUBLICO: 0,
    PRIVADO: 0,
    INDEPENDIENTE: 0
  };

  const today = new Date();
  state.experiencias.forEach(exp => {
    if (!exp.fechaIngreso) return;
    const start = new Date(exp.fechaIngreso + "T00:00:00");
    if (isNaN(start.getTime())) return;

    let end = today;
    if (exp.fechaRetiro) {
      const parsedEnd = new Date(exp.fechaRetiro + "T00:00:00");
      if (!isNaN(parsedEnd.getTime())) end = parsedEnd;
    } else if (!exp.actual) {
      return;
    }

    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const days = diffMs / (1000 * 60 * 60 * 24);
    const cat = exp.sectorTiempo || (exp.tipoEntidad === "PUBLICA" ? "PUBLICO" : "PRIVADO");
    if (totalsDays[cat] !== undefined) {
      totalsDays[cat] += days;
    }
  });

  function daysToYearsMonths(days) {
    const totalMonths = Math.round(days / 30.4375);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return { years, months };
  }

  const pub = daysToYearsMonths(totalsDays.PUBLICO);
  const priv = daysToYearsMonths(totalsDays.PRIVADO);
  const ind = daysToYearsMonths(totalsDays.INDEPENDIENTE);

  const totalMonthsAll =
    (pub.years * 12 + pub.months) +
    (priv.years * 12 + priv.months) +
    (ind.years * 12 + ind.months);

  state.tiempoPublicoAnios = String(pub.years);
  state.tiempoPublicoMeses = String(pub.months);
  state.tiempoPrivadoAnios = String(priv.years);
  state.tiempoPrivadoMeses = String(priv.months);
  state.tiempoIndependienteAnios = String(ind.years);
  state.tiempoIndependienteMeses = String(ind.months);
  state.tiempoTotalAnios = String(Math.floor(totalMonthsAll / 12));
  state.tiempoTotalMeses = String(totalMonthsAll % 12);

  syncStaticInputsFromState();
  saveState();
}

function recomputeTotalTiempoRow() {
  const pA = parseInt(state.tiempoPublicoAnios || "0", 10) || 0;
  const pM = parseInt(state.tiempoPublicoMeses || "0", 10) || 0;
  const prA = parseInt(state.tiempoPrivadoAnios || "0", 10) || 0;
  const prM = parseInt(state.tiempoPrivadoMeses || "0", 10) || 0;
  const iA = parseInt(state.tiempoIndependienteAnios || "0", 10) || 0;
  const iM = parseInt(state.tiempoIndependienteMeses || "0", 10) || 0;

  const totalMeses = (pA + prA + iA) * 12 + (pM + prM + iM);
  state.tiempoTotalAnios = String(Math.floor(totalMeses / 12));
  state.tiempoTotalMeses = String(totalMeses % 12);

  const elA = document.querySelector('[data-field="tiempoTotalAnios"]');
  const elM = document.querySelector('[data-field="tiempoTotalMeses"]');
  if (elA) elA.value = state.tiempoTotalAnios;
  if (elM) elM.value = state.tiempoTotalMeses;
}

// ============================================================================
// PROCESAMIENTO DE FIRMA (SUBIDA, LIMPIEZA DE FONDO BLANCO Y DIBUJO)
// ============================================================================
function renderSignaturePreview() {
  const img = document.getElementById("signaturePreviewImg");
  const placeholder = document.getElementById("signaturePlaceholderText");
  if (!img || !placeholder) return;

  if (state.firmaDataUrl) {
    img.src = state.firmaDataUrl;
    img.style.display = "block";
    placeholder.style.display = "none";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
    placeholder.style.display = "block";
  }
}

function processSignatureImageFile(file) {
  if (!file) return;
  const removeBg = document.getElementById("chkRemoveBg")?.checked ?? true;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const rawImg = new Image();
    rawImg.onload = () => {
      const maxW = 600;
      const maxH = 260;
      let w = rawImg.width;
      let h = rawImg.height;
      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(rawImg, 0, 0, w, h);

      if (removeBg) {
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          // Luminancia perceptual
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 225) {
            d[i + 3] = 0; // Fondo blanco -> transparente
          } else if (lum > 190) {
            // Suavizado de bordes
            d[i + 3] = Math.round(((225 - lum) / 35) * d[i + 3]);
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      state.firmaDataUrl = canvas.toDataURL("image/png");
      renderSignaturePreview();
      saveState();
    };
    rawImg.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function initDrawSignaturePad() {
  const canvas = document.getElementById("drawSignatureCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let drawing = false;
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  window.addEventListener("pointerup", () => {
    drawing = false;
  });

  document.getElementById("btnClearCanvas")?.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  document.getElementById("btnUseCanvasSignature")?.addEventListener("click", () => {
    state.firmaDataUrl = canvas.toDataURL("image/png");
    renderSignaturePreview();
    saveState();
    document.getElementById("drawCanvasWrap")?.classList.remove("open");
  });
}

// ============================================================================
// GENERACIÓN DEL PDF OFICIAL IDÉNTICO CON PDF-LIB
// ============================================================================
function base64ToUint8Array(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function parseDateParts(dateStr) {
  if (!dateStr) return { dd: "", mm: "", yyyy: "" };
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return { dd: "", mm: "", yyyy: "" };
  return {
    yyyy: parts[0] || "",
    mm: parts[1] || "",
    dd: parts[2] || ""
  };
}

async function generateOfficialPdfBytes() {
  const { PDFDocument, StandardFonts, rgb, PDFName } = window.PDFLib;

  const templateBytes = base64ToUint8Array(window.PDF_TEMPLATE_BASE64);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const baseTemplateDoc = await PDFDocument.load(templateBytes);

  // Limpiar widget residual ('untitled1') que traía el PDF original del gobierno en la Hoja 3
  try {
    pdfDoc.catalog.delete(PDFName.of("AcroForm"));
    pdfDoc.getPages().forEach(p => p.node.delete(PDFName.of("Annots")));
  } catch (_) {}

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0.05, 0.07, 0.12);

  const PAGE_HEIGHT = 792.0;
  const y = (topY) => PAGE_HEIGHT - topY;

  function drawTextFit(page, text, xLeft, topBaselineY, maxWidth, fontSize = 8.5, bold = false) {
    const str = String(text ?? "").trim().toUpperCase();
    if (!str) return;
    const f = bold ? fontBold : fontRegular;
    let size = fontSize;
    while (size > 5.5 && f.widthOfTextAtSize(str, size) > maxWidth) {
      size -= 0.4;
    }
    page.drawText(str, {
      x: xLeft,
      y: y(topBaselineY),
      size,
      font: f,
      color: black
    });
  }

  function drawCenteredText(page, text, xCenter, topBaselineY, fontSize = 8.5, bold = false) {
    const str = String(text ?? "").trim().toUpperCase();
    if (!str) return;
    const f = bold ? fontBold : fontRegular;
    const w = f.widthOfTextAtSize(str, fontSize);
    page.drawText(str, {
      x: xCenter - w / 2,
      y: y(topBaselineY),
      size: fontSize,
      font: f,
      color: black
    });
  }

  function drawMarkX(page, xCenter, topCenterY, size = 9) {
    drawCenteredText(page, "X", xCenter, topCenterY + size * 0.35, size, true);
  }

  // Helper para estampar dígitos en casillas divididas (Día 2 dígitos, Mes 2 dígitos, Año 4 dígitos)
  function drawDateBoxes(page, dateParts, xDayStart, xMonthStart, xYearStart, topBaselineY) {
    if (dateParts.dd && dateParts.dd.length === 2) {
      drawCenteredText(page, dateParts.dd[0], xDayStart + 5.0, topBaselineY, 8.2, false);
      drawCenteredText(page, dateParts.dd[1], xDayStart + 14.9, topBaselineY, 8.2, false);
    }
    if (dateParts.mm && dateParts.mm.length === 2) {
      drawCenteredText(page, dateParts.mm[0], xMonthStart + 5.0, topBaselineY, 8.2, false);
      drawCenteredText(page, dateParts.mm[1], xMonthStart + 14.9, topBaselineY, 8.2, false);
    }
    if (dateParts.yyyy && dateParts.yyyy.length === 4) {
      drawCenteredText(page, dateParts.yyyy[0], xYearStart + 4.9, topBaselineY, 8.2, false);
      drawCenteredText(page, dateParts.yyyy[1], xYearStart + 14.8, topBaselineY, 8.2, false);
      drawCenteredText(page, dateParts.yyyy[2], xYearStart + 24.7, topBaselineY, 8.2, false);
      drawCenteredText(page, dateParts.yyyy[3], xYearStart + 34.6, topBaselineY, 8.2, false);
    }
  }

  // ==========================================================================
  // PÁGINA 1: DATOS PERSONALES Y FORMACIÓN ACADÉMICA
  // ==========================================================================
  const page1 = pdfDoc.getPage(0);

  // Entidad receptora
  drawTextFit(page1, state.entidadReceptora, 443, 68.5, 114, 8.5, true);

  // 1. Datos Personales
  drawTextFit(page1, state.primerApellido, 63, 188.5, 155, 9.5, true);
  drawTextFit(page1, state.segundoApellido, 227, 188.5, 160, 9.5, true);
  drawTextFit(page1, state.nombres, 397, 188.5, 166, 9.5, true);

  // Tipo de documento
  if (state.tipoDoc === "CC") drawMarkX(page1, 86.1, 214.5, 8.5);
  if (state.tipoDoc === "CE") drawMarkX(page1, 116.4, 214.5, 8.5);
  if (state.tipoDoc === "PAS") drawMarkX(page1, 150.4, 214.7, 8.5);
  drawTextFit(page1, state.numDoc, 185, 218.2, 106, 9, false);

  // Sexo
  if (state.sexo === "F") drawMarkX(page1, 320.1, 214.5, 8.5);
  if (state.sexo === "M") drawMarkX(page1, 344.7, 214.7, 8.5);

  // Nacionalidad y País
  if (state.nacionalidad === "COL") drawMarkX(page1, 387.3, 214.0, 8.5);
  if (state.nacionalidad === "EXT") drawMarkX(page1, 459.8, 214.5, 8.5);
  drawTextFit(page1, state.paisNacionalidad, 475, 218.2, 84, 8.5, false);

  // Libreta Militar
  if (state.claseLibreta === "PRIMERA") drawMarkX(page1, 149.0, 245.1, 8.5);
  if (state.claseLibreta === "SEGUNDA") drawMarkX(page1, 264.7, 245.1, 8.5);
  drawTextFit(page1, state.numLibreta, 337, 248.3, 116, 8.5, false);
  drawTextFit(page1, state.dmLibreta, 497, 248.3, 60, 8.5, false);

  // Fecha y lugar de nacimiento
  const nacParts = parseDateParts(state.fechaNacimiento);
  drawDateBoxes(page1, nacParts, 134.9, 184.2, 233.8, 284.0);
  drawTextFit(page1, state.paisNacimiento, 116, 302.0, 116, 8.5, false);
  drawTextFit(page1, state.deptoNacimiento, 116, 319.0, 116, 8.5, false);
  drawTextFit(page1, state.municipioNacimiento, 116, 336.5, 116, 8.5, false);

  // Dirección de correspondencia
  drawTextFit(page1, state.direccionCorrespondencia, 293, 284.0, 265, 8.5, false);
  drawTextFit(page1, state.paisCorrespondencia, 319, 302.0, 115, 8.5, false);
  drawTextFit(page1, state.deptoCorrespondencia, 473, 302.0, 86, 8.5, false);
  drawTextFit(page1, state.municipioCorrespondencia, 346, 318.5, 116, 8.5, false);
  drawTextFit(page1, state.telefono, 346, 337.0, 89, 8.5, false);
  drawTextFit(page1, state.email, 473, 337.0, 86, 8.0, false);

  // 2. Formación Académica - Básica y Media
  const gradeIndex = parseInt(state.gradoBasica || "0", 10);
  if (gradeIndex >= 1 && gradeIndex <= 11) {
    const gradeBoundaries = [96.5, 114.3, 131.3, 148.3, 165.3, 182.3, 199.3, 216.3, 233.3, 250.3, 267.3, 284.3];
    const xCenter = (gradeBoundaries[gradeIndex - 1] + gradeBoundaries[gradeIndex]) / 2;
    drawMarkX(page1, xCenter, 468.0, 9.5);
  }
  drawTextFit(page1, state.tituloBachiller, 362, 441.5, 156, 8.5, false);

  const mesBach = String(state.mesGradoBachiller || "").padStart(2, "0");
  const anioBach = String(state.anioGradoBachiller || "").trim();
  drawDateBoxes(
    page1,
    { dd: "", mm: state.mesGradoBachiller ? mesBach : "", yyyy: anioBach.length === 4 ? anioBach : "" },
    0,
    348.8,
    409.4,
    472.0
  );

  // Educación Superior (5 filas en Hoja 1)
  const rowBaselinesSup = [590.5, 607.5, 624.5, 641.5, 658.5];
  (state.estudios || []).slice(0, 5).forEach((est, idx) => {
    const by = rowBaselinesSup[idx];
    drawCenteredText(page1, est.modalidad, 83.0, by, 8.5, false);
    drawCenteredText(page1, est.semestres, 141.7, by, 8.5, false);
    if (est.nombreTitulo || est.modalidad || est.semestres) {
      if (est.graduado === "SI") drawCenteredText(page1, "X", 186.8, by, 8.5, true);
      if (est.graduado === "NO") drawCenteredText(page1, "X", 210.3, by, 8.5, true);
    }
    drawTextFit(page1, est.nombreTitulo, 225, by, 194, 8.0, false);
    if (est.mesTerminacion) {
      drawCenteredText(page1, String(est.mesTerminacion).padStart(2, "0"), 434.6, by, 8.0, false);
    }
    const anio = String(est.anioTerminacion || "").trim();
    if (anio.length === 4) {
      const yearCols = [453.8, 467.5, 481.0, 494.0];
      for (let d = 0; d < 4; d++) {
        drawCenteredText(page1, anio[d], yearCols[d], by, 8.0, false);
      }
    }
    drawTextFit(page1, est.tarjetaProfesional, 503, by, 63, 8.0, false);
  });

  // Idiomas (2 filas en Hoja 1)
  const idiomaBaselines = [719.0, 735.5];
  (state.idiomas || []).slice(0, 2).forEach((idi, idx) => {
    if (!idi.idioma) return;
    const by = idiomaBaselines[idx];
    drawTextFit(page1, idi.idioma, 158, by, 136, 8.5, false);

    if (idi.habla === "R") drawCenteredText(page1, "X", 307.1, by, 8.5, true);
    if (idi.habla === "B") drawCenteredText(page1, "X", 324.2, by, 8.5, true);
    if (idi.habla === "MB") drawCenteredText(page1, "X", 341.3, by, 8.5, true);

    if (idi.lee === "R") drawCenteredText(page1, "X", 358.3, by, 8.5, true);
    if (idi.lee === "B") drawCenteredText(page1, "X", 375.2, by, 8.5, true);
    if (idi.lee === "MB") drawCenteredText(page1, "X", 392.2, by, 8.5, true);

    if (idi.escribe === "R") drawCenteredText(page1, "X", 409.3, by, 8.5, true);
    if (idi.escribe === "B") drawCenteredText(page1, "X", 426.3, by, 8.5, true);
    if (idi.escribe === "MB") drawCenteredText(page1, "X", 443.5, by, 8.5, true);
  });

  // ==========================================================================
  // PÁGINA 2 (Y PÁGINAS ADICIONALES SI HAY MÁS DE 4 EXPERIENCIAS)
  // ==========================================================================
  const sortedExps = getSortedExperiencias(state.experiencias).filter(
    e => e.empresa || e.cargo || e.fechaIngreso || e.fechaRetiro || e.dependencia
  );

  // Coordenadas exactas de los 4 bloques de experiencia en la Hoja 2
  const expBlocksCoords = [
    { row1Y: 238.0, row2Y: 268.0, row3TextY: 298.0, dateBoxY: 299.2, row4Y: 327.0, retXDay: 426.3, retXMon: 475.6, retXYear: 522.9 },
    { row1Y: 368.7, row2Y: 398.7, row3TextY: 428.7, dateBoxY: 429.9, row4Y: 457.7, retXDay: 426.3, retXMon: 475.6, retXYear: 522.9 },
    { row1Y: 498.2, row2Y: 528.2, row3TextY: 558.2, dateBoxY: 559.4, row4Y: 587.2, retXDay: 425.7, retXMon: 475.0, retXYear: 522.3 },
    { row1Y: 628.6, row2Y: 658.6, row3TextY: 688.6, dateBoxY: 689.8, row4Y: 717.6, retXDay: 426.3, retXMon: 475.6, retXYear: 522.9 }
  ];

  const totalSheetsNeeded = Math.max(1, Math.ceil(sortedExps.length / 4));
  const expPages = [pdfDoc.getPage(1)];

  for (let s = 1; s < totalSheetsNeeded; s++) {
    const [copiedPage] = await pdfDoc.copyPages(baseTemplateDoc, [1]);
    pdfDoc.insertPage(1 + s, copiedPage);
    expPages.push(copiedPage);
  }

  sortedExps.forEach((exp, idx) => {
    const sheetIdx = Math.floor(idx / 4);
    const blockIdx = idx % 4;
    const p = expPages[sheetIdx];
    const c = expBlocksCoords[blockIdx];

    // Fila 1: Empresa, Pública/Privada, País
    drawTextFit(p, exp.empresa, 62, c.row1Y, 258, 8.5, true);
    if (exp.tipoEntidad === "PUBLICA") drawCenteredText(p, "X", 346.8, c.row1Y, 9, true);
    if (exp.tipoEntidad === "PRIVADA") drawCenteredText(p, "X", 394.7, c.row1Y, 9, true);
    drawTextFit(p, exp.pais, 425, c.row1Y, 138, 8.5, false);

    // Fila 2: Departamento, Municipio, Correo Entidad
    drawTextFit(p, exp.departamento, 62, c.row2Y, 170, 8.5, false);
    drawTextFit(p, exp.municipio, 240, c.row2Y, 165, 8.5, false);
    drawTextFit(p, exp.correoEntidad, 415, c.row2Y, 148, 8.0, false);

    // Fila 3: Teléfonos, Fecha Ingreso, Fecha Retiro
    drawTextFit(p, exp.telefonos, 62, c.row3TextY, 170, 8.5, false);
    const ingParts = parseDateParts(exp.fechaIngreso);
    drawDateBoxes(p, ingParts, 259.6, 308.9, 356.2, c.dateBoxY);

    const retParts = parseDateParts(exp.fechaRetiro);
    drawDateBoxes(p, retParts, c.retXDay, c.retXMon, c.retXYear, c.dateBoxY);

    // Fila 4: Cargo o Contrato, Dependencia, Dirección
    drawTextFit(p, exp.cargo, 62, c.row4Y, 170, 8.5, false);
    drawTextFit(p, exp.dependencia, 240, c.row4Y, 158, 8.5, false);
    drawTextFit(p, exp.direccion, 408, c.row4Y, 156, 8.5, false);
  });

  // ==========================================================================
  // ÚLTIMA PÁGINA (HOJA 3): TIEMPO TOTAL Y FIRMA
  // ==========================================================================
  const page3 = pdfDoc.getPage(pdfDoc.getPageCount() - 1);

  // 4. Tiempo Total de Experiencia
  drawCenteredText(page3, state.tiempoPublicoAnios, 394.1, 194.5, 9.5, false);
  drawCenteredText(page3, state.tiempoPublicoMeses, 464.3, 194.5, 9.5, false);

  drawCenteredText(page3, state.tiempoPrivadoAnios, 394.1, 222.5, 9.5, false);
  drawCenteredText(page3, state.tiempoPrivadoMeses, 464.3, 222.5, 9.5, false);

  drawCenteredText(page3, state.tiempoIndependienteAnios, 394.1, 250.5, 9.5, false);
  drawCenteredText(page3, state.tiempoIndependienteMeses, 464.3, 250.5, 9.5, false);

  drawCenteredText(page3, state.tiempoTotalAnios, 394.1, 278.0, 9.5, true);
  drawCenteredText(page3, state.tiempoTotalMeses, 464.3, 278.0, 9.5, true);

  // 5. Juramento de Inhabilidades
  if (state.inhabilidad === "SI") drawMarkX(page3, 272.3, 369.4, 8.5);
  if (state.inhabilidad === "NO") drawMarkX(page3, 304.6, 369.4, 8.5);

  // Ciudad y fecha de diligenciamiento
  drawTextFit(page3, state.ciudadFechaDiligenciamiento, 216, 455.5, 322, 9.0, false);

  // Firma del Servidor Público o Contratista (sobre la línea x=219.4..411.3, y=493.5)
  if (state.firmaDataUrl) {
    try {
      const sigImage = await pdfDoc.embedPng(state.firmaDataUrl);
      const maxSigWidth = 175;
      const maxSigHeight = 44;
      const scale = Math.min(maxSigWidth / sigImage.width, maxSigHeight / sigImage.height);
      const sigW = sigImage.width * scale;
      const sigH = sigImage.height * scale;
      const sigX = 315.3 - sigW / 2;
      const sigBottomY = y(492.0); // Justo encima de la línea de firma (493.5)

      page3.drawImage(sigImage, {
        x: sigX,
        y: sigBottomY,
        width: sigW,
        height: sigH
      });
    } catch (err) {
      console.error("Error incrustando firma en el PDF:", err);
    }
  }

  // ==========================================================================
  // PAGINACIÓN CONSECUTIVA AUTOMÁTICA (1, 2, 3, 4...)
  // ==========================================================================
  const allPages = pdfDoc.getPages();
  allPages.forEach((p, idx) => {
    const pageNumStr = String(idx + 1);
    const isLastPage = idx === allPages.length - 1;
    const origX = isLastPage ? 590.28 : 587.76;
    const origBaselineTopY = isLastPage ? 749.58 : 751.44;

    // Cubrir el número estático original de la plantilla en la esquina inferior derecha
    p.drawRectangle({
      x: 583,
      y: y(756),
      width: 22,
      height: 19,
      color: rgb(1, 1, 1)
    });

    // Estampar el número de página consecutivo real
    p.drawText(pageNumStr, {
      x: origX,
      y: y(origBaselineTopY),
      size: 12,
      font: fontRegular,
      color: rgb(0, 0, 0)
    });
  });

  return await pdfDoc.save();
}

// ============================================================================
// DATOS DE EJEMPLO (DEMO)
// ============================================================================
function loadDemoData() {
  state = {
    entidadReceptora: "ENTIDAD DE EJEMPLO",
    primerApellido: "PÉREZ",
    segundoApellido: "GÓMEZ",
    nombres: "JUAN CARLOS",
    tipoDoc: "CC",
    numDoc: "1000123456",
    sexo: "M",
    nacionalidad: "COL",
    paisNacionalidad: "COLOMBIA",
    claseLibreta: "PRIMERA",
    numLibreta: "1000123456",
    dmLibreta: "01",
    fechaNacimiento: "1995-05-15",
    paisNacimiento: "COLOMBIA",
    deptoNacimiento: "CUNDINAMARCA",
    municipioNacimiento: "BOGOTÁ D.C.",
    direccionCorrespondencia: "CALLE 100 # 15 - 20",
    paisCorrespondencia: "COLOMBIA",
    deptoCorrespondencia: "CUNDINAMARCA",
    municipioCorrespondencia: "BOGOTÁ D.C.",
    telefono: "3001234567",
    email: "JUAN.PEREZ@EJEMPLO.COM",
    gradoBasica: "11",
    tituloBachiller: "BACHILLER ACADÉMICO",
    mesGradoBachiller: "11",
    anioGradoBachiller: "2012",
    estudios: [
      {
        id: "est-demo-1",
        modalidad: "UN",
        semestres: "10",
        graduado: "SI",
        nombreTitulo: "INGENIERO DE SISTEMAS",
        mesTerminacion: "12",
        anioTerminacion: "2017",
        tarjetaProfesional: ""
      }
    ],
    idiomas: [
      {
        id: "idi-demo-1",
        idioma: "INGLÉS",
        habla: "B",
        lee: "MB",
        escribe: "B"
      }
    ],
    experiencias: [
      {
        id: "exp-demo-1",
        actual: true,
        empresa: "EMPRESA TECNOLÓGICA DE EJEMPLO S.A.S.",
        tipoEntidad: "PRIVADA",
        sectorTiempo: "PRIVADO",
        pais: "COLOMBIA",
        departamento: "CUNDINAMARCA",
        municipio: "BOGOTÁ D.C.",
        correoEntidad: "CONTACTO@EJEMPLO.COM",
        telefonos: "6011234567",
        fechaIngreso: "2022-02-01",
        fechaRetiro: "",
        cargo: "PROFESIONAL DE PROYECTOS",
        dependencia: "DIRECCIÓN DE TECNOLOGÍA",
        direccion: "CARRERA 10 # 20 - 30"
      }
    ],
    tiempoPublicoAnios: "0",
    tiempoPublicoMeses: "0",
    tiempoPrivadoAnios: "4",
    tiempoPrivadoMeses: "8",
    tiempoIndependienteAnios: "0",
    tiempoIndependienteMeses: "0",
    tiempoTotalAnios: "4",
    tiempoTotalMeses: "8",
    inhabilidad: "NO",
    ciudadFechaDiligenciamiento: "BOGOTÁ D.C., 17 DE OCTUBRE DE 2026",
    firmaDataUrl: createDemoSignatureDataUrl()
  };
  syncStaticInputsFromState();
  saveState();
}

function createDemoSignatureDataUrl() {
  if (typeof document === "undefined" || !document.createElement) return "";
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(35, 72);
  ctx.bezierCurveTo(60, 20, 95, 85, 130, 42);
  ctx.bezierCurveTo(155, 18, 170, 75, 210, 50);
  ctx.bezierCurveTo(235, 35, 260, 62, 290, 44);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(55, 78);
  ctx.quadraticCurveTo(165, 62, 275, 70);
  ctx.stroke();
  return canvas.toDataURL("image/png");
}

// ============================================================================
// INICIALIZACIÓN DE EVENTOS
// ============================================================================
let currentPdfBlobUrl = null;

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  syncStaticInputsFromState();
  initDrawSignaturePad();

  // Escuchar cambios en campos simples
  document.querySelectorAll("[data-field]").forEach(el => {
    el.addEventListener("input", (e) => {
      const key = e.target.getAttribute("data-field");
      state[key] = forceInputUppercase(e.target);
      if (key.startsWith("tiempo") && !key.startsWith("tiempoTotal")) {
        recomputeTotalTiempoRow();
      }
      saveState();
    });
  });

  // Escuchar cambios en radios
  ["tipoDoc", "sexo", "nacionalidad", "claseLibreta", "inhabilidad"].forEach(name => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          state[name] = e.target.value;
          saveState();
        }
      });
    });
  });

  // Botones de agregar ítems
  document.getElementById("btnAddEstudio")?.addEventListener("click", () => {
    state.estudios.push(createEmptyEstudio());
    renderEstudios();
    saveState();
  });

  document.getElementById("btnAddIdioma")?.addEventListener("click", () => {
    state.idiomas.push(createEmptyIdioma());
    renderIdiomas();
    saveState();
  });

  document.getElementById("btnAddExperiencia")?.addEventListener("click", () => {
    state.experiencias.push(createEmptyExperiencia());
    renderExperiencias();
    saveState();
  });

  document.getElementById("btnSortExperiencias")?.addEventListener("click", () => {
    state.experiencias = getSortedExperiencias(state.experiencias);
    renderExperiencias();
    saveState();
  });

  document.getElementById("btnCalcTiempo")?.addEventListener("click", () => {
    calcularTiempoExperiencia();
  });

  // Fecha de hoy
  document.getElementById("btnSetToday")?.addEventListener("click", () => {
    const meses = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
    const d = new Date();
    const muni = (state.municipioCorrespondencia || "BOGOTÁ D.C.").toUpperCase();
    state.ciudadFechaDiligenciamiento = `${muni}, ${d.getDate()} DE ${meses[d.getMonth()]} DE ${d.getFullYear()}`;
    syncStaticInputsFromState();
    saveState();
  });

  // Subida de firma
  const dropzone = document.getElementById("signatureDropzone");
  const fileInput = document.getElementById("inputSignatureFile");

  dropzone?.addEventListener("click", () => fileInput?.click());
  dropzone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "#0284c7";
  });
  dropzone?.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "#94a3b8";
  });
  dropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "#94a3b8";
    const file = e.dataTransfer?.files?.[0];
    if (file) processSignatureImageFile(file);
  });

  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) processSignatureImageFile(file);
  });

  document.getElementById("btnToggleDraw")?.addEventListener("click", () => {
    document.getElementById("drawCanvasWrap")?.classList.toggle("open");
  });

  document.getElementById("btnRemoveSignature")?.addEventListener("click", () => {
    state.firmaDataUrl = "";
    if (fileInput) fileInput.value = "";
    renderSignaturePreview();
    saveState();
  });

  // Exportar JSON
  document.getElementById("btnExportJson")?.addEventListener("click", () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ape = (state.primerApellido || "HV").toLowerCase().replace(/\s+/g, "_");
    a.href = url;
    a.download = `datos_hoja_de_vida_${ape}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Importar JSON
  document.getElementById("inputImportJson")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        state = { ...getDefaultState(), ...imported };
        syncStaticInputsFromState();
        saveState();
        alert("Datos cargados correctamente desde el archivo JSON.");
      } catch (err) {
        alert("El archivo seleccionado no es un JSON válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // Demo y Limpiar
  document.getElementById("btnLoadDemo")?.addEventListener("click", () => {
    loadDemoData();
  });

  document.getElementById("btnClearAll")?.addEventListener("click", () => {
    if (confirm("¿Deseas vaciar todos los campos del formulario?")) {
      state = getDefaultState();
      syncStaticInputsFromState();
      saveState();
    }
  });

  // Descargar PDF Oficial
  async function downloadPdf() {
    const pdfBytes = await generateOfficialPdfBytes();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ape = (state.primerApellido || "Persona_Natural").trim().replace(/\s+/g, "_");
    a.href = url;
    a.download = `Formato_Unico_Hoja_de_Vida_${ape}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  document.getElementById("btnDownloadPdf")?.addEventListener("click", downloadPdf);
  document.getElementById("btnMobileDownloadPdf")?.addEventListener("click", downloadPdf);
  document.getElementById("btnModalDownload")?.addEventListener("click", downloadPdf);

  // Menú desplegable de opciones en móvil
  const btnToggleMobileMenu = document.getElementById("btnToggleMobileMenu");
  const toolbarActions = document.getElementById("toolbarActions");
  btnToggleMobileMenu?.addEventListener("click", () => {
    const isOpen = toolbarActions?.classList.toggle("open");
    btnToggleMobileMenu.textContent = isOpen ? "✕ Cerrar" : "☰ Opciones";
  });

  // Cerrar el menú móvil al pulsar cualquiera de sus opciones
  toolbarActions?.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.innerWidth <= 960 && toolbarActions.classList.contains("open")) {
        toolbarActions.classList.remove("open");
        if (btnToggleMobileMenu) btnToggleMobileMenu.textContent = "☰ Opciones";
      }
    });
  });

  // Vista Previa del PDF en Modal
  document.getElementById("btnPreviewPdf")?.addEventListener("click", async () => {
    const pdfBytes = await generateOfficialPdfBytes();
    if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    currentPdfBlobUrl = URL.createObjectURL(blob);
    const frame = document.getElementById("pdfPreviewFrame");
    if (frame) frame.src = currentPdfBlobUrl;
    document.getElementById("pdfModal")?.classList.add("open");
  });

  document.getElementById("btnCloseModal")?.addEventListener("click", () => {
    document.getElementById("pdfModal")?.classList.remove("open");
  });
});
