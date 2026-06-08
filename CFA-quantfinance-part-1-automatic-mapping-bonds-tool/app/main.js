import { scoreRecords } from "./scoring.js";
import { sampleRecords } from "./sample-data.js";

const RECORDS_STORAGE_KEY = "sovereign-bond-records-v1";
const RECORDS_META_STORAGE_KEY = "sovereign-bond-records-meta-v1";
const PINNED_STORAGE_KEY = "sovereign-bond-pinned-v1";
const HIDDEN_STORAGE_KEY = "sovereign-bond-hidden-v1";
const DEFAULT_BOND_TYPE = "localCurrency";
const bondTypeLabels = {
  localCurrency: "Local Currency",
  eurobond: "Eurobond"
};
const csvColumnDefinitions = [
  { key: "country", label: "Country" },
  { key: "region", label: "Region" },
  { key: "bondName", label: "Bond Name" },
  { key: "bondType", label: "Bond Type" },
  { key: "currency", label: "Currency" },
  { key: "maturity", label: "Maturity" },
  { key: "couponRate", label: "Coupon Rate (%)" },
  { key: "bondPrice", label: "Bond Price (clean price)" },
  { key: "yieldToMaturity", label: "Yield to Maturity (%)" },
  { key: "creditRating", label: "Credit Rating" },
  { key: "debtToGdp", label: "Debt-to-GDP (%)" },
  { key: "fiscalDeficitToGdp", label: "Fiscal Deficit-to-GDP (%)" },
  { key: "inflationRate", label: "Inflation Rate (%)" },
  { key: "policyInterestRate", label: "Policy Interest Rate (%)" },
  { key: "exchangeRateVolatility", label: "Exchange Rate Volatility (%)" },
  { key: "foreignExchangeReserves", label: "Foreign Exchange Reserves (USD bn)" },
  { key: "goldReserves", label: "Gold Reserves (tonnes)" },
  { key: "cdsSpread", label: "CDS Spread (bps)" },
  { key: "liquidityBidAskSpread", label: "Liquidity / Bid-Ask Spread (%)" },
  { key: "sourceNote", label: "Source Note" },
  { key: "lastUpdated", label: "Last Updated (UTC)" }
];
const csvColumns = csvColumnDefinitions.map((column) => column.key);
const csvHeaderLookup = new Map(
  csvColumnDefinitions.flatMap((column) => [
    [normalizeCsvHeader(column.key), column.key],
    [normalizeCsvHeader(column.label), column.key]
  ])
);
const editableNumberFields = [
  "yieldToMaturity",
  "bondPrice",
  "couponRate",
  "debtToGdp",
  "fiscalDeficitToGdp",
  "inflationRate",
  "policyInterestRate",
  "exchangeRateVolatility",
  "foreignExchangeReserves",
  "goldReserves",
  "cdsSpread",
  "liquidityBidAskSpread"
];

let initialSaveStatusMessage = "Manual edits save in this browser";
let records = loadRecords();
let scoredRows = scoreRecords(records);
let expandedCountry = null;
const pinnedCountries = new Set(loadPinnedCountries());
const hiddenCountries = new Set(loadHiddenCountries());

const tableBody = document.querySelector("#bondRows");
const hiddenList = document.querySelector("#hiddenList");
const hiddenCount = document.querySelector("#hiddenCount");
const searchInput = document.querySelector("#searchInput");
const bondTypeFilter = document.querySelector("#bondTypeFilter");
const regionFilter = document.querySelector("#regionFilter");
const sortMode = document.querySelector("#sortMode");
const visibleCount = document.querySelector("#visibleCount");
const onlineCount = document.querySelector("#onlineCount");
const resetLocalData = document.querySelector("#resetLocalData");
const importCsv = document.querySelector("#importCsv");
const exportCsv = document.querySelector("#exportCsv");
const csvImportInput = document.querySelector("#csvImportInput");
const saveState = document.querySelector("#saveState");
const saveStatus = document.querySelector("#saveStatus");
const editModal = document.querySelector("#editModal");
const editForm = document.querySelector("#editForm");
const editTitle = document.querySelector("#editTitle");
const closeEdit = document.querySelector("#closeEdit");
const cancelEdit = document.querySelector("#cancelEdit");

onlineCount.textContent = "1";
updateSaveStatus(initialSaveStatusMessage);
setupInfoTooltips();

const indicatorLabels = {
  yieldToMaturity: "Yield to Maturity",
  realYield: "Real Yield",
  liquidityBidAskSpread: "Liquidity / Bid-Ask Spread",
  bondPriceDiscount: "Bond Price / Discount",
  creditRating: "Credit Rating Score",
  cdsSpread: "CDS Spread",
  debtToGdp: "Debt-to-GDP",
  fiscalDeficitToGdp: "Fiscal Deficit-to-GDP",
  inflationRate: "Inflation Rate",
  exchangeRateVolatility: "Exchange Rate Volatility",
  foreignExchangeReserves: "Foreign Exchange Reserves",
  policyInterestRate: "Policy Interest Rate",
  goldReserves: "Gold Reserves"
};

const indicatorUnits = {
  yieldToMaturity: "%",
  realYield: "%",
  liquidityBidAskSpread: "%",
  bondPriceDiscount: "pts",
  creditRating: "",
  cdsSpread: "bps",
  debtToGdp: "%",
  fiscalDeficitToGdp: "%",
  inflationRate: "%",
  exchangeRateVolatility: "%",
  foreignExchangeReserves: "USD bn",
  policyInterestRate: "%",
  goldReserves: "tonnes"
};

function setupInfoTooltips() {
  const tooltip = document.createElement("div");
  tooltip.className = "floating-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);

  let activeTip = null;

  const showTooltip = (tip) => {
    const text = tip.dataset.tooltip;
    if (!text) return;

    activeTip = tip;
    tooltip.textContent = text;
    tooltip.classList.add("is-visible");
    positionTooltip(tooltip, tip);
  };

  const hideTooltip = () => {
    activeTip = null;
    tooltip.classList.remove("is-visible");
  };

  document.querySelectorAll(".info-tip").forEach((tip) => {
    tip.addEventListener("mouseenter", () => showTooltip(tip));
    tip.addEventListener("focus", () => showTooltip(tip));
    tip.addEventListener("mouseleave", hideTooltip);
    tip.addEventListener("blur", hideTooltip);
  });

  document.querySelector(".table-panel")?.addEventListener("scroll", () => {
    if (activeTip) positionTooltip(tooltip, activeTip);
  });
  window.addEventListener("resize", () => {
    if (activeTip) positionTooltip(tooltip, activeTip);
  });
}

function positionTooltip(tooltip, tip) {
  const margin = 12;
  const tipRect = tip.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const targetCenter = tipRect.left + tipRect.width / 2;
  const maxLeft = window.innerWidth - tooltipRect.width - margin;
  const left = Math.max(margin, Math.min(targetCenter - tooltipRect.width / 2, maxLeft));
  const top = tipRect.bottom + 10;
  const arrowLeft = Math.max(12, Math.min(targetCenter - left, tooltipRect.width - 12));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.setProperty("--tooltip-arrow-left", `${arrowLeft}px`);
}

function getVisibleRows() {
  const query = searchInput.value.trim().toLowerCase();
  const bondType = bondTypeFilter.value;
  const region = regionFilter.value;
  const sort = sortMode.value;

  const filteredRows = scoredRows
    .filter((row) => {
      if (hiddenCountries.has(row.country)) return false;
      const rowBondType = normalizeBondType(row.bondType);
      const matchesBondType = bondType === "all" || rowBondType === bondType;
      const matchesRegion = region === "all" || row.region === region;
      const searchText = `${row.country} ${row.region} ${row.currency} ${getBondTypeLabel(rowBondType)} ${row.creditRating}`.toLowerCase();
      return matchesBondType && matchesRegion && searchText.includes(query);
    });

  return sortRows(filteredRows, sort);
}

function sortRows(rows, sort) {
  return [...rows].sort((a, b) => {
    const pinnedDelta = Number(pinnedCountries.has(b.country)) - Number(pinnedCountries.has(a.country));
    if (pinnedDelta !== 0) return pinnedDelta;

    if (sort === "score-asc") return a.totalScore - b.totalScore;
    if (sort === "az") return a.country.localeCompare(b.country);
    return b.totalScore - a.totalScore;
  });
}

function renderTable() {
  const rows = getVisibleRows();
  visibleCount.textContent = String(rows.length);
  tableBody.innerHTML = renderRows(rows);
  renderHiddenCountries();
}

function renderRows(rows) {
  let rank = 0;

  return rows
    .map((row) => {
      const isExpanded = expandedCountry === row.country;
      const isPinned = pinnedCountries.has(row.country);

      rank += 1;

      return `
        <tr class="data-row ${isExpanded ? "is-expanded" : ""}" data-country="${row.country}">
          <td>${rank}</td>
          <td class="actions-cell">
            <div class="actions-inline">
              <button class="row-toggle" type="button" aria-expanded="${isExpanded}" data-country="${row.country}">
                <span>${isExpanded ? "Hide" : "View"}</span>
              </button>
              <button class="edit-toggle" type="button" data-country="${row.country}">Edit</button>
              <button class="hide-toggle" type="button" data-country="${row.country}">Hide</button>
            </div>
          </td>
          <td class="country-cell">${row.country}</td>
          <td>${getBondTypeLabel(row.bondType)}</td>
          <td>
            <button class="pin-toggle ${isPinned ? "is-pinned" : ""}" type="button" aria-pressed="${isPinned}" data-country="${row.country}">
              ${isPinned ? "Pinned" : "Pin"}
            </button>
          </td>
          <td>${row.region}</td>
          <td>${row.currency}</td>
          <td>
            <input
              class="ytm-input"
              type="number"
              step="0.01"
              inputmode="decimal"
              aria-label="Yield to Maturity for ${row.country}"
              data-country="${row.country}"
              value="${formatEditableNumber(row.yieldToMaturity)}"
            />
          </td>
          <td><span class="rating">${row.creditRating}</span></td>
          <td class="score">${row.totalScore.toFixed(1)}</td>
          <td>${row.dataConfidence.toFixed(1)}%</td>
        </tr>
        ${isExpanded ? renderDetailRow(row) : ""}
      `;
    })
    .join("");
}

function renderDetailRow(row) {
  const bondScore = row.scoreBreakdown.bondReturnLiquidity.score;
  const riskScore = row.scoreBreakdown.sovereignRisk.score;
  const creditRating = row.scoreBreakdown.sovereignRisk.components.creditRating;
  const bondComponents = renderComponentList(row.scoreBreakdown.bondReturnLiquidity.components);
  const riskComponents = renderComponentList(row.scoreBreakdown.sovereignRisk.components);

  return `
    <tr class="detail-row">
      <td colspan="11">
        <section class="detail-panel" aria-label="${row.country} score details">
          <div class="detail-summary">
            <article>
              <span>Raw Credit Rating</span>
              <strong>${row.creditRating}</strong>
              <small>Mapped score: ${formatScore(creditRating.normalized)} / 100</small>
            </article>
            <article>
              <span>Bond Return & Liquidity</span>
              <strong>${formatScore(bondScore)} / 100</strong>
              <small>Category weight: 35%</small>
            </article>
            <article>
              <span>Sovereign Risk</span>
              <strong>${formatScore(riskScore)} / 100</strong>
              <small>Category weight: 65%</small>
            </article>
            <article>
              <span>Total Score</span>
              <strong>${row.totalScore.toFixed(1)} / 100</strong>
              <small>Data completeness: ${row.dataConfidence.toFixed(1)}%</small>
            </article>
          </div>
          <div class="component-grid">
            <div>
              <h2>Bond Components</h2>
              ${bondComponents}
            </div>
            <div>
              <h2>Sovereign Risk Components</h2>
              ${riskComponents}
            </div>
          </div>
        </section>
      </td>
    </tr>
  `;
}

function renderComponentList(components) {
  return `
    <dl class="component-list">
      ${Object.entries(components)
        .map(
          ([indicator, component]) => `
            <div>
              <dt>${indicatorLabels[indicator]}</dt>
              <dd>
                <small class="raw-value">Raw: ${formatRawValue(indicator, component.rawValue)}</small>
                <small class="benchmark-value">${formatBenchmark(indicator, component.benchmark)}</small>
                <span>${formatScore(component.normalized)} / 100</span>
                <small>Weight ${(component.weight * 100).toFixed(0)}%</small>
              </dd>
            </div>
          `
        )
        .join("")}
    </dl>
  `;
}

function formatScore(value) {
  return value === null ? "Missing" : value.toFixed(1);
}

function formatRawValue(indicator, value) {
  if (value === null) return "Missing";
  const unit = indicatorUnits[indicator];
  if (indicator === "creditRating") return `${value.toFixed(0)} mapped points`;
  if (indicator === "bondPriceDiscount") return `${value.toFixed(1)} ${unit}`;
  if (unit === "USD bn") return `${value.toLocaleString()} ${unit}`;
  if (unit === "tonnes") return `${value.toLocaleString()} ${unit}`;
  return `${value.toFixed(2)}${unit}`;
}

function formatBenchmark(indicator, benchmark) {
  if (!benchmark || benchmark.hundredScoreValue === null) return "Benchmark: Missing";

  if (indicator === "creditRating") {
    return "Benchmark: AAA = 100, D = 0";
  }

  if (benchmark.method === "fixed-piecewise") {
    const pointText = benchmark.points
      .map((point) => `${formatRawValue(indicator, point.rawValue)}=${point.score}`)
      .join(", ");
    return `Benchmark: fixed scale ${pointText}`;
  }

  const zeroValue = formatRawValue(indicator, benchmark.zeroScoreValue);
  const hundredValue = formatRawValue(indicator, benchmark.hundredScoreValue);
  const hundredLabel = benchmark.direction === "lower" ? "P5" : "P95";
  const zeroLabel = benchmark.direction === "lower" ? "P95" : "P5";
  return `Benchmark: ${hundredLabel} ${hundredValue} = 100, ${zeroLabel} ${zeroValue} = 0`;
}

searchInput.addEventListener("input", renderTable);
bondTypeFilter.addEventListener("change", renderTable);
regionFilter.addEventListener("change", renderTable);
sortMode.addEventListener("change", renderTable);
tableBody.addEventListener("click", (event) => {
  const hideToggle = event.target.closest(".hide-toggle");
  if (hideToggle) {
    hideCountry(hideToggle.dataset.country);
    return;
  }

  const editToggle = event.target.closest(".edit-toggle");
  if (editToggle) {
    openEditForm(editToggle.dataset.country);
    return;
  }

  const pinToggle = event.target.closest(".pin-toggle");
  if (pinToggle) {
    const country = pinToggle.dataset.country;
    if (pinnedCountries.has(country)) {
      pinnedCountries.delete(country);
    } else {
      pinnedCountries.add(country);
    }
    savePinnedCountries();
    renderTable();
    return;
  }

  const toggle = event.target.closest(".row-toggle");
  if (!toggle) return;

  const country = toggle.dataset.country;
  expandedCountry = expandedCountry === country ? null : country;
  renderTable();
});
tableBody.addEventListener("change", (event) => {
  const input = event.target.closest(".ytm-input");
  if (!input) return;
  saveInlineYtm(input.dataset.country, input.value);
});
tableBody.addEventListener("keydown", (event) => {
  const input = event.target.closest(".ytm-input");
  if (!input || event.key !== "Enter") return;
  event.preventDefault();
  input.blur();
});
resetLocalData.addEventListener("click", resetLocalRecords);
exportCsv.addEventListener("click", exportVisibleCsv);
importCsv.addEventListener("click", () => csvImportInput.click());
csvImportInput.addEventListener("change", importCsvFile);
hiddenList.addEventListener("click", (event) => {
  const restoreButton = event.target.closest(".restore-toggle");
  if (!restoreButton) return;
  restoreCountry(restoreButton.dataset.country);
});
closeEdit.addEventListener("click", closeEditForm);
cancelEdit.addEventListener("click", closeEditForm);
editModal.addEventListener("click", (event) => {
  if (event.target === editModal) closeEditForm();
});
editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveEditForm();
});

renderTable();

function loadRecords() {
  try {
    const stored = window.localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!stored) return cloneRecords(sampleRecords);

    const storedRecords = JSON.parse(stored);
    if (!Array.isArray(storedRecords)) return cloneRecords(sampleRecords);

    const merged = mergeLatestSampleRecords(storedRecords);
    if (merged.addedCount > 0) {
      persistRecords(merged.records);
      initialSaveStatusMessage = `${merged.addedCount} sample countries added to local data`;
    }

    return merged.records;
  } catch {
    return cloneRecords(sampleRecords);
  }
}

function cloneRecords(sourceRecords) {
  return sourceRecords.map((record) => normalizeRecord(record));
}

function normalizeRecord(record) {
  return {
    ...record,
    bondType: normalizeBondType(record.bondType)
  };
}

function mergeLatestSampleRecords(storedRecords) {
  const existingCountries = new Set(storedRecords.map((record) => normalizeCountryKey(record.country)));
  const missingSampleRecords = sampleRecords.filter(
    (record) => !existingCountries.has(normalizeCountryKey(record.country))
  );

  return {
    addedCount: missingSampleRecords.length,
    records: [...cloneRecords(storedRecords), ...cloneRecords(missingSampleRecords)]
  };
}

function normalizeCountryKey(country) {
  return String(country || "").trim().toLowerCase();
}

function normalizeBondType(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["eurobond", "eurobonds", "foreigncurrency", "foreigncurrencybond", "foreigncurrencybonds", "externalbond", "externalbonds"].includes(normalized)) {
    return "eurobond";
  }
  return DEFAULT_BOND_TYPE;
}

function getBondTypeLabel(value) {
  return bondTypeLabels[normalizeBondType(value)] || bondTypeLabels[DEFAULT_BOND_TYPE];
}

function persistRecords(nextRecords) {
  window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(nextRecords));
  window.localStorage.setItem(
    RECORDS_META_STORAGE_KEY,
    JSON.stringify({
      sampleCountryCount: sampleRecords.length,
      savedAt: new Date().toISOString()
    })
  );
}

function saveRecords() {
  persistRecords(records);
  updateSaveStatus();
}

function resetLocalRecords() {
  const shouldReset = window.confirm(
    "Reset local edits and pinned countries? This restores the sample data in this browser."
  );

  if (!shouldReset) return;

  window.localStorage.removeItem(RECORDS_STORAGE_KEY);
  window.localStorage.removeItem(RECORDS_META_STORAGE_KEY);
  window.localStorage.removeItem(PINNED_STORAGE_KEY);
  window.localStorage.removeItem(HIDDEN_STORAGE_KEY);
  records = cloneRecords(sampleRecords);
  scoredRows = scoreRecords(records);
  pinnedCountries.clear();
  hiddenCountries.clear();
  expandedCountry = null;
  closeEditForm();
  updateSaveStatus("Sample data restored locally");
  renderTable();
}

function loadPinnedCountries() {
  try {
    const stored = window.localStorage.getItem(PINNED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadHiddenCountries() {
  try {
    const stored = window.localStorage.getItem(HIDDEN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePinnedCountries() {
  window.localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify([...pinnedCountries]));
  updateSaveStatus("Pinned state saved locally");
}

function saveHiddenCountries() {
  window.localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify([...hiddenCountries]));
  updateSaveStatus("Hidden countries saved locally");
}

function hideCountry(country) {
  hiddenCountries.add(country);
  pinnedCountries.delete(country);
  if (expandedCountry === country) {
    expandedCountry = null;
  }
  saveHiddenCountries();
  savePinnedCountries();
  renderTable();
}

function restoreCountry(country) {
  hiddenCountries.delete(country);
  saveHiddenCountries();
  renderTable();
}

function renderHiddenCountries() {
  const hiddenRecords = records
    .filter((record) => hiddenCountries.has(record.country))
    .sort((a, b) => a.country.localeCompare(b.country));

  hiddenCount.textContent = String(hiddenRecords.length);
  hiddenList.innerHTML = hiddenRecords.length
    ? hiddenRecords
        .map(
          (record) => `
            <div class="hidden-item">
              <span>${record.country}</span>
              <small>${record.region} / ${record.currency} / ${getBondTypeLabel(record.bondType)}</small>
              <button class="restore-toggle" type="button" data-country="${record.country}">Restore</button>
            </div>
          `
        )
        .join("")
    : `<p>No hidden countries.</p>`;
}

function updateSaveStatus(message = "Manual edits save in this browser") {
  saveState.textContent = "Local";
  saveStatus.textContent = message;
}

function saveInlineYtm(country, value) {
  const parsed = parseNullableNumber(value);
  const recordIndex = records.findIndex((item) => item.country === country);
  if (recordIndex === -1) return;

  records = records.map((record, index) =>
    index === recordIndex
      ? {
          ...record,
          yieldToMaturity: parsed,
          lastUpdated: new Date().toISOString()
        }
      : record
  );
  scoredRows = scoreRecords(records);
  saveRecords();
  updateSaveStatus(`${country} YTM saved locally`);
  renderTable();
}

function openEditForm(country) {
  const record = records.find((item) => item.country === country);
  if (!record) return;

  editTitle.textContent = `Edit ${record.country}`;
  editForm.elements.country.value = record.country;
  editForm.elements.bondType.value = normalizeBondType(record.bondType);
  editForm.elements.creditRating.value = record.creditRating;
  editForm.elements.sourceNote.value = record.sourceNote || "";

  for (const field of editableNumberFields) {
    editForm.elements[field].value = record[field] ?? "";
  }

  editModal.hidden = false;
}

function closeEditForm() {
  editModal.hidden = true;
  editForm.reset();
}

function saveEditForm() {
  const country = editForm.elements.country.value;
  const recordIndex = records.findIndex((item) => item.country === country);
  if (recordIndex === -1) return;

  const updatedRecord = {
    ...records[recordIndex],
    bondType: normalizeBondType(editForm.elements.bondType.value),
    creditRating: editForm.elements.creditRating.value,
    sourceNote: editForm.elements.sourceNote.value.trim(),
    lastUpdated: new Date().toISOString()
  };

  for (const field of editableNumberFields) {
    updatedRecord[field] = parseNullableNumber(editForm.elements[field].value);
  }

  records = records.map((record, index) => (index === recordIndex ? updatedRecord : record));
  scoredRows = scoreRecords(records);
  expandedCountry = country;
  saveRecords();
  updateSaveStatus(`${country} saved locally`);
  closeEditForm();
  renderTable();
}

function parseNullableNumber(value) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatEditableNumber(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "";
}

function exportVisibleCsv() {
  const rows = getVisibleRows();
  const exportColumns = [
    { key: "rank", label: "Rank" },
    ...csvColumnDefinitions,
    { key: "totalScore", label: "Total Score (0-100)" },
    { key: "dataConfidence", label: "Data Completeness (%)" },
    { key: "realYield", label: "Real Yield (%)" }
  ];
  const csvRows = [
    exportColumns.map((column) => formatCsvValue(column.label)).join(","),
    ...rows.map((row, index) =>
      exportColumns
        .map((column) => {
          if (column.key === "rank") return index + 1;
          return formatCsvValue(row[column.key]);
        })
        .join(",")
    )
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sovereign-bond-ranking.csv";
  link.click();
  URL.revokeObjectURL(url);
  updateSaveStatus("Visible ranking exported as CSV");
}

function formatCsvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

async function importCsvFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const importedRecords = parseCsvRecords(text);
    if (importedRecords.length === 0) {
      updateSaveStatus("CSV import failed: no records found");
      return;
    }

    records = importedRecords;
    scoredRows = scoreRecords(records);
    pinnedCountries.clear();
    hiddenCountries.clear();
    expandedCountry = null;
    saveRecords();
    savePinnedCountries();
    saveHiddenCountries();
    updateSaveStatus(`${records.length} records imported locally`);
    renderTable();
  } catch {
    updateSaveStatus("CSV import failed");
  } finally {
    csvImportInput.value = "";
  }
}

function parseCsvRecords(text) {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => getCsvFieldKey(header));
  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = row[index] ?? "";
    });

    for (const field of editableNumberFields) {
      record[field] = parseNullableNumber(record[field] ?? "");
    }

    return normalizeRecord({
      country: record.country || "Unknown",
      region: record.region || "Unassigned",
      bondName: record.bondName || "",
      currency: record.currency || "",
      maturity: record.maturity || "10Y",
      creditRating: record.creditRating || "BBB",
      sourceNote: record.sourceNote || "",
      lastUpdated: record.lastUpdated || new Date().toISOString(),
      ...record
    });
  });
}

function getCsvFieldKey(header) {
  return csvHeaderLookup.get(normalizeCsvHeader(header)) || null;
}

function normalizeCsvHeader(header) {
  return String(header).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows;
}
