import React, { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import * as QRCode from "qrcode"; // namespace import avoids undefined default
import JsBarcode from "jsbarcode";
import Papa from "papaparse";

// ---- units & helpers -------------------------------------------------------
const MM_PER_INCH = 25.4;
const PT_PER_INCH = 72;
const mmToPt = (mm) => (mm * PT_PER_INCH) / MM_PER_INCH;
const mmToPx = (mm) => mm * 3.7795275591; // preview only
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- sizing presets --------------------------------------------------------
const DEFAULT_DIMS = { widthMM: 55, heightMM: 12, marginMM: { left: 2, right: 2, top: 1, bottom: 1 } };
const HEIGHT_PRESETS = [9, 12, 18, 24];
const PAGE_PRESETS = [
  { id: "A4", label: "A4 (210×297 mm)", widthMM: 210, heightMM: 297 },
  { id: "Letter", label: "Letter (216×279 mm)", widthMM: 216, heightMM: 279 },
];

// ---- categories (adds Nut & Washer for the screenshot look) ---------------
const CATEGORY_SCHEMAS = {
  screw: {
    label: "Screw", icon: "screw",
    fields: ["thread", "length_mm", "material", "head", "drive", "standard", "notes"],
    chips: (v) => [v.thread, v.length_mm && `L=${v.length_mm}mm`, v.material, v.head, v.drive, v.standard].filter(Boolean),
    title: (v) => `${v.thread || "?"} ${v.head || "Screw"}`.trim(),
    subtitle: (v) => [v.material, v.drive].filter(Boolean).join(" • "),
  },
  nut: {
    label: "Nut", icon: "nut",
    fields: ["thread", "type", "material", "standard", "notes"],
    chips: (v) => [v.thread, v.type, v.material, v.standard].filter(Boolean),
    title: (v) => `${v.thread || "?"} ${v.type || "Nut"}`.trim(),
    subtitle: (v) => [v.material, v.standard].filter(Boolean).join(" • "),
  },
  washer: {
    label: "Washer", icon: "washer",
    fields: ["thread", "id_mm", "od_mm", "thickness_mm", "material", "standard", "notes"],
    chips: (v) => [v.thread, v.id_mm && `ID=${v.id_mm}`, v.od_mm && `OD=${v.od_mm}`, v.thickness_mm && `${v.thickness_mm}mm`, v.material].filter(Boolean),
    title: (v) => `${v.thread || "?"} Washer`, subtitle: (v) => [v.material, v.standard].filter(Boolean).join(" • "),
  },
  heat_insert: {
    label: "Heat-Insert", icon: "heat_insert",
    fields: ["thread", "length_mm", "outer_mm", "hole_mm", "material", "knurl", "notes"],
    chips: (v) => [v.length_mm && `L=${v.length_mm}mm`, v.outer_mm && `OD=${v.outer_mm}`, v.hole_mm && `Hole=${v.hole_mm}`, v.material, v.knurl].filter(Boolean),
    title: (v) => `${v.thread || "?"} Heat-Insert`, subtitle: (v) => [v.material, v.knurl].filter(Boolean).join(" • "),
  },
  fuse_blade: {
    label: "Fuse (Blade)", icon: "fuse_blade",
    fields: ["series", "rating_A", "voltage_V", "blow", "qty", "notes"],
    chips: (v) => [v.rating_A && `${v.rating_A}A`, v.voltage_V && `${v.voltage_V}V`, v.blow && v.blow.toUpperCase(), v.qty && `x${v.qty}`].filter(Boolean),
    title: (v) => `${v.series || "Blade"} Fuse`, subtitle: (v) => v.notes || "Automotive",
  },
  fuse_glass: {
    label: "Fuse (Glass)", icon: "fuse_glass",
    fields: ["size", "rating_A", "voltage_V", "timelag", "breaking", "notes"],
    chips: (v) => [v.size, v.rating_A && `${v.rating_A}A`, v.voltage_V && `${v.voltage_V}V`, v.timelag, v.breaking].filter(Boolean),
    title: (v) => `${v.size || "5×20"} Glass Fuse`, subtitle: (v) => v.timelag || "",
  },
  resistor: {
    label: "Resistor", icon: "resistor",
    fields: ["value", "tolerance", "watt", "series", "smd_code", "notes"],
    chips: (v) => [v.value, v.tolerance, v.watt && `${v.watt}W`, v.series, v.smd_code].filter(Boolean),
    title: (v) => `Resistor ${v.value || "?"}`, subtitle: (v) => [v.tolerance, v.watt && `${v.watt}W`].filter(Boolean).join(" • "),
  },
  capacitor: {
    label: "Capacitor", icon: "capacitor",
    fields: ["type", "value", "voltage", "esr", "pkg", "notes"],
    chips: (v) => [v.value, v.voltage, v.esr && `ESR ${v.esr}`, v.pkg].filter(Boolean),
    title: (v) => `${v.type || "Cap"} ${v.value || "?"}`, subtitle: (v) => v.voltage || "",
  },
  connector: {
    label: "Connector", icon: "jst",
    fields: ["family", "positions", "pitch_mm", "gender", "part", "notes"],
    chips: (v) => [v.family, v.positions && `${v.positions}p`, v.pitch_mm && `${v.pitch_mm}mm`, v.gender].filter(Boolean),
    title: (v) => `${v.family || "Conn"} ${v.positions || "?"}p`, subtitle: (v) => v.part || "",
  },
  wire: {
    label: "Wire", icon: "wire",
    fields: ["awg", "mm2", "strands", "insulation", "voltage", "temp", "color", "notes"],
    chips: (v) => [v.awg && `AWG ${v.awg}`, v.mm2 && `${v.mm2}mm²`, v.color, v.voltage, v.temp].filter(Boolean),
    title: (v) => `${v.color || ""} Wire`.trim(), subtitle: (v) => [v.awg && `AWG ${v.awg}`, v.mm2 && `${v.mm2}mm²`].filter(Boolean).join(" • "),
  },
  custom: {
    label: "Custom", icon: "custom",
    fields: ["title", "subtitle", "chips", "notes"],
    chips: (v) => (v.chips ? String(v.chips).split("|").map((s) => s.trim()).filter(Boolean) : []),
    title: (v) => v.title || "Custom", subtitle: (v) => v.subtitle || "",
  },
};

// ---- templates (still available if you expand later) ----------------------
const TEMPLATES = [
  { id: "minimal", label: "Minimal" },
  { id: "specStack", label: "Spec Stack" },
  { id: "iconRight", label: "Icon Right" },
  { id: "twoLine", label: "Two-Line" },
];

// ---- model & util ----------------------------------------------------------
const makeBlankRecord = (category = "screw") => ({
  id: `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  category,
  dims: { ...DEFAULT_DIMS },
  icon: { name: CATEGORY_SCHEMAS[category]?.icon || "custom" },
  barcode: { type: "none", value: "" },
  fields: {},
  template: "specStack",
  theme: "default",
});

// ---- tiny ui atoms ---------------------------------------------------------
const Toggle = ({ checked, onChange, children }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm transition ${checked?"bg-blue-50 border-blue-200":"bg-white border-neutral-200"}`}>
    <span className="flex items-center gap-2">{children}</span>
    <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked?"bg-blue-600":"bg-neutral-300"}`}>
      <span className={`h-4 w-4 bg-white rounded-full transform transition ${checked?"translate-x-4":"translate-x-1"}`}></span>
    </span>
  </button>
);

const Seg = ({ options, value, onChange }) => (
  <div className="grid grid-cols-4 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
    {options.map((o) => (
      <button key={o.value} onClick={() => onChange(o.value)}
        className={`text-sm px-3 py-1.5 rounded-lg transition ${value===o.value?"bg-white shadow border border-neutral-200":""}`}>{o.label}</button>
    ))}
  </div>
);

const Pill = ({ text }) => (
  <span className="border px-1.5 py-[1px] rounded-md text-[10px] leading-none mr-1 mb-1 inline-block">{text}</span>
);

// ---- icon renderer ---------------------------------------------------------
function renderIconToPath(name) {
  switch (name) {
    case "heat_insert":
      return `<g stroke-width="0.35" stroke="black" fill="none"><path d=\"M1,9 L5,9 L5,7 L1,7 Z\" /><path d=\"M1,7 L5,3\" /><circle cx=\"3\" cy=\"6\" r=\"1.2\" /></g>`;
    case "fuse_blade":
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><rect x=\"1\" y=\"3\" width=\"4\" height=\"6\" rx=\"0.6\" /><path d=\"M1,3 L0,1 M5,3 L6,1 M1,9 L0,11 M5,9 L6,11\" /></g>`;
    case "fuse_glass":
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><rect x=\"0.4\" y=\"4\" width=\"1.0\" height=\"4\" /><rect x=\"4.6\" y=\"4\" width=\"1.0\" height=\"4\" /><rect x=\"1.4\" y=\"4\" width=\"3.2\" height=\"4\" rx=\"1.2\" /></g>`;
    case "resistor":
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><path d=\"M0,6 L1.2,6\" /><rect x=\"1.2\" y=\"4.6\" width=\"3.6\" height=\"2.8\" rx=\"0.8\" /><path d=\"M4.8,6 L6,6\" /></g>`;
    case "capacitor":
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><path d=\"M1.5,5 L1.5,7\" /><path d=\"M3.5,5 L3.5,7\" /><path d=\"M0,6 L1.5,6 M3.5,6 L6,6\" /></g>`;
    case "jst":
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><rect x=\"0.5\" y=\"4\" width=\"5\" height=\"4\" rx=\"0.6\" /><path d=\"M1.2,5.2 L1.2,6.8 M2.4,5.2 L2.4,6.8 M3.6,5.2 L3.6,6.8 M4.8,5.2 L4.8,6.8\" /></g>`;
    case "wire":
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><path d=\"M0,8 C2,3 4,9 6,4\" /></g>`;
    case "screw":
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><rect x=\"1.6\" y=\"3\" width=\"2.8\" height=\"6\" /><path d=\"M1.6,3 L4.4,3 M3,3 L3,9\" /></g>`;
    case "nut":
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><polygon points=\"1.2,6 3,3.8 4.8,6 3,8.2\" /><circle cx=\"3\" cy=\"6\" r=\"0.9\" /></g>`;
    case "washer":
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><circle cx=\"3\" cy=\"6\" r=\"2.6\" /><circle cx=\"3\" cy=\"6\" r=\"1.2\" /></g>`;
    default:
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><circle cx=\"3\" cy=\"6\" r=\"2.4\" /><path d=\"M3,3.6 L3,8.4 M0.6,6 L5.4,6\" /></g>`;
  }
}

function escapeXML(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// build SVG with options from the right panel
function buildLabelSVG(rec, opts = { showChips: true, showIcon: true }) {
  const schema = CATEGORY_SCHEMAS[rec.category] || CATEGORY_SCHEMAS.custom;
  const width = rec.dims.widthMM, height = rec.dims.heightMM; const m = rec.dims.marginMM;
  const innerWidth = Math.max(0, width - (m.left + m.right));
  const innerHeight = Math.max(0, height - (m.top + m.bottom));
  const chips = (opts.showChips ? schema.chips(rec.fields) : []);
  const title = schema.title(rec.fields); const subtitle = schema.subtitle(rec.fields);
  const iconBox = opts.showIcon ? 6 : 0, pad = 0.6;
  const hasQR = rec.barcode?.type === "qr" && rec.barcode.value;
  const has128 = rec.barcode?.type === "code128" && rec.barcode.value;

  let qrHref = "";
  if (hasQR) {
    try {
      const maybe = QRCode.toDataURL(rec.barcode.value, { margin: 0, scale: 4 });
      if (typeof maybe === "string") qrHref = maybe; // if promise, skip silently
    } catch {}
  }

  const titleSize = Math.min(3.4, innerHeight * 0.38);
  const subSize = Math.min(2.6, innerHeight * 0.28);
  const pillHeight = Math.min(3, innerHeight * 0.28);
  const tmpl = rec.template || "specStack";
  const textX = tmpl === "iconRight" ? pad : iconBox + pad;
  const textW = innerWidth - iconBox - pad * 2;
  const barcodeH = (hasQR || has128) ? Math.min(7, innerHeight * 0.55) : 0;
  const pillY = innerHeight - barcodeH - pillHeight - pad;

  const pillSVGs = [];
  let x = textX; const maxX = textX + textW;
  chips.forEach((c) => {
    const charWmm = 0.9; const w = Math.min(textW, 3 + c.length * charWmm);
    if (x + w > maxX) return; // single-row clamp
    pillSVGs.push(
      `<g transform="translate(${m.left + x}, ${m.top + pillY})"><rect width="${w}" height="${pillHeight}" rx="1.2" ry="1.2" fill="none" stroke="black" stroke-width="0.2"/><text x="1.2" y="${pillHeight - 0.9}" font-size="${Math.max(1.9, pillHeight - 1)}" font-family="Inter,Arial">${escapeXML(c)}</text></g>`
    );
    x += w + 0.8;
  });

  const barcodeGroup = (has128)
    ? `<g id="barcode-${rec.id}" transform="translate(${m.left + textX}, ${m.top + innerHeight - barcodeH - pad})"><rect width="${textW}" height="${barcodeH}" fill="none"/></g>`
    : "";
  const qrImg = (hasQR && qrHref)
    ? `<image href="${qrHref}" x="${m.left + textX + textW - barcodeH}" y="${m.top + innerHeight - barcodeH - pad}" width="${barcodeH}" height="${barcodeH}" />`
    : "";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
  <rect x="${m.left}" y="${m.top}" width="${innerWidth}" height="${innerHeight}" rx="1" ry="1" fill="white" stroke="black" stroke-width="0.2"/>
  ${opts.showIcon ? `<g transform="translate(${m.left}, ${m.top})"><rect width="${iconBox}" height="${innerHeight}" fill="none" /><g>${renderIconToPath(rec.icon?.name || "custom")}</g></g>` : ""}
  <text x="${m.left + textX}" y="${m.top + 2 + titleSize}" font-family="Inter,Arial" font-weight="700" font-size="${titleSize}">${escapeXML(title)}</text>
  ${subtitle ? `<text x="${m.left + textX}" y="${m.top + 2 + titleSize + subSize + 0.6}" font-family="Inter,Arial" font-size="${subSize}">${escapeXML(subtitle)}</text>` : ""}
  ${pillSVGs.join("
")}
  ${barcodeGroup}
  ${qrImg}
</svg>`;
  return svg;
}

const ICONS = { heat_insert: true, fuse_blade: true, fuse_glass: true, resistor: true, capacitor: true, jst: true, wire: true, screw: true, nut: true, washer: true, custom: true };

// ---- preview ---------------------------------------------------------------
const LabelPreview = ({ rec, opts }) => {
  const svgRef = useRef(null);
  useEffect(() => {
    if (!svgRef.current) return;
    if (rec.barcode?.type === "code128" && rec.barcode?.value) {
      const node = svgRef.current.querySelector(`#barcode-${rec.id}`);
      if (node) {
        while (node.firstChild) node.removeChild(node.firstChild);
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", `${mmToPx(rec.dims.widthMM)}px`);
        svg.setAttribute("height", `${mmToPx(6)}px`);
        node.appendChild(svg);
        try { JsBarcode(svg, rec.barcode.value, { format: "CODE128", displayValue: false, margin: 0, width: 1, height: mmToPx(6) }); } catch {}
      }
    }
  }, [rec]);
  const svgString = useMemo(() => buildLabelSVG(rec, opts), [rec, opts]);
  return (
    <div className="border bg-white" style={{ width: mmToPx(rec.dims.widthMM), height: mmToPx(rec.dims.heightMM) }} ref={svgRef} dangerouslySetInnerHTML={{ __html: svgString }} />
  );
};

// ---- export PDF ------------------------------------------------------------
async function exportPDF(records, page = PAGE_PRESETS[0], gapMM = 3, opts={}) {
  const pdf = await PDFDocument.create();
  const pageWpt = mmToPt(page.widthMM), pageHpt = mmToPt(page.heightMM);
  let pageDoc = pdf.addPage([pageWpt, pageHpt]);
  let cursorX = 10, cursorY = 10;
  const addNewPage = () => { pageDoc = pdf.addPage([pageWpt, pageHpt]); cursorX = 10; cursorY = 10; };
  for (const rec of records) {
    const svg = buildLabelSVG(rec, opts);
    const imgDataUrl = await svgToPngDataUrl(svg, rec.dims.widthMM, rec.dims.heightMM);
    const png = await pdf.embedPng(imgDataUrl);
    const wpt = mmToPt(rec.dims.widthMM), hpt = mmToPt(rec.dims.heightMM);
    if (cursorX + rec.dims.widthMM > page.widthMM - 10) { cursorX = 10; cursorY += (rec.dims.heightMM + gapMM); }
    if (cursorY + rec.dims.heightMM > page.heightMM - 10) addNewPage();
    const drawX = mmToPt(cursorX), drawY = pageHpt - mmToPt(cursorY + rec.dims.heightMM);
    pageDoc.drawImage(png, { x: drawX, y: drawY, width: wpt, height: hpt });
    const cm = 2; pageDoc.drawLine({ start: { x: drawX, y: drawY + hpt }, end: { x: drawX - mmToPt(cm), y: drawY + hpt }, thickness: 0.5, color: rgb(0, 0, 0) });
    pageDoc.drawLine({ start: { x: drawX + wpt, y: drawY + hpt }, end: { x: drawX + wpt + mmToPt(cm), y: drawY + hpt }, thickness: 0.5, color: rgb(0, 0, 0) });
    cursorX += rec.dims.widthMM + gapMM;
  }
  const bytes = await pdf.save();
  downloadBlob(new Blob([bytes], { type: "application/pdf" }), `labels_${Date.now()}.pdf`);
}

function downloadBlob(blob, filename) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }

async function svgToPngDataUrl(svgString, widthMM, heightMM) {
  const canvas = document.createElement("canvas");
  const w = Math.max(1, Math.round(mmToPx(widthMM))), h = Math.max(1, Math.round(mmToPx(heightMM)));
  canvas.width = w * 2; canvas.height = h * 2;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: "image/svg+xml" }); const url = URL.createObjectURL(svgBlob);
  await new Promise((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url; });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}

function parseCSV(text) { return Papa.parse(text, { header: true, skipEmptyLines: true }).data; }

// ---- main app --------------------------------------------------------------
export default function App() {
  const [records, setRecords] = useState([makeBlankRecord("screw")]);
  const [selectedId, setSelectedId] = useState(records[0].id);
  const [pagePreset, setPagePreset] = useState(PAGE_PRESETS[0]);
  const [gapMM, setGapMM] = useState(3);
  const [ui, setUi] = useState({ standardRef: true, showIcon: true, qr: false, system: "metric" });

  const sel = records.find((r) => r.id === selectedId) || records[0];
  const schema = CATEGORY_SCHEMAS[sel.category] || CATEGORY_SCHEMAS.custom;
  const printable = { w: sel.dims.widthMM - (sel.dims.marginMM.left + sel.dims.marginMM.right), h: sel.dims.heightMM - (sel.dims.marginMM.top + sel.dims.marginMM.bottom) };
  const isReady = !schema.title(sel.fields).includes("?");

  const update = (next) => setRecords((prev) => prev.map((r) => (r.id === next.id ? next : r)));
  const switchCat = (cat) => update({ ...sel, category: cat, icon: { name: CATEGORY_SCHEMAS[cat]?.icon || "custom" } });

  // CSV/JSON helpers kept, accessible via the kebab menu later if you want
  const saveJSON = () => downloadBlob(new Blob([JSON.stringify(records, null, 2)], { type: "application/json" }), `labels_${Date.now()}.json`);
  const loadJSON = (file) => { const reader = new FileReader(); reader.onload = () => { try { const arr = JSON.parse(reader.result); if (Array.isArray(arr)) { setRecords(arr); setSelectedId(arr[0]?.id); } } catch { alert("Invalid JSON"); } }; reader.readAsText(file); };
  const importCSV = (file) => { const reader = new FileReader(); reader.onload = () => { const rows = parseCSV(reader.result); const mapped = rows.map((row) => { const cat = (row.category || "custom").trim(); const rec = makeBlankRecord(cat); rec.dims.widthMM = Number(row.widthMM || rec.dims.widthMM); rec.dims.heightMM = Number(row.heightMM || rec.dims.heightMM); if (row.barcode_type) rec.barcode.type = row.barcode_type; if (row.barcode_value) rec.barcode.value = row.barcode_value; const schema = CATEGORY_SCHEMAS[cat] || CATEGORY_SCHEMAS.custom; (schema.fields || []).forEach((f) => { if (row[f] !== undefined) rec.fields[f] = row[f]; }); if (cat === "custom") { if (row.title) rec.fields.title = row.title; if (row.subtitle) rec.fields.subtitle = row.subtitle; if (row.chips) rec.fields.chips = row.chips; if (row.notes) rec.fields.notes = row.notes; } return rec; }); setRecords((prev) => [...prev, ...mapped]); if (mapped.length) setSelectedId(mapped[0].id); }; reader.readAsText(file); };

  // right panel options influence the output
  const opts = { showChips: ui.standardRef, showIcon: ui.showIcon };
  if (ui.qr) sel.barcode.type = sel.barcode.value ? "qr" : "qr"; else if (sel.barcode.type === "qr") sel.barcode.type = "none";

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* header like the screenshot */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight">Gridfinity Label Generator</h1>
          <p className="text-neutral-500 mt-1">Print-Ready Labels for Your Gridfinity System</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
          {/* LEFT: main card */}
          <div className="bg-white rounded-2xl shadow p-4 lg:p-6">
            {/* top tabs */}
            <div className="flex items-center gap-2 mb-4">
              {['screw','nut','washer'].map((cat) => (
                <button key={cat} onClick={() => switchCat(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${sel.category===cat?"bg-blue-600 text-white border-blue-600":"bg-neutral-100 border-neutral-200 text-neutral-700"}`}>{CATEGORY_SCHEMAS[cat].label}</button>
              ))}
              <div className="ml-auto">
                <Seg value={ui.system} onChange={(v)=>setUi({...ui, system:v})}
                  options={[{label:'Metric', value:'metric'},{label:'Imperial', value:'imperial'}]} />
              </div>
            </div>

            {/* inputs like screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm">Thread size...
                <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder={ui.system==='metric'?"e.g. M3":"e.g. #6-32"}
                  value={sel.fields.thread||''} onChange={(e)=>update({...sel, fields:{...sel.fields, thread:e.target.value}})} />
              </label>
              <label className="text-sm">Optional notes
                <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Notes (material, finish, etc.)"
                  value={sel.fields.notes||''} onChange={(e)=>update({...sel, fields:{...sel.fields, notes:e.target.value}})} />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <label className="text-sm">Hardware standard...
                <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="e.g. ISO 4762 / DIN 912"
                  value={sel.fields.standard||''} onChange={(e)=>update({...sel, fields:{...sel.fields, standard:e.target.value}})} />
              </label>
              <div></div>
            </div>

            {/* label preview header */}
            <div className="flex items-center justify-between mt-5 mb-2">
              <div className="text-sm font-medium">Label Preview <span className="text-neutral-400">ⓘ</span></div>
              <div className="text-xs text-neutral-500 text-right">
                {sel.dims.widthMM}mm × {sel.dims.heightMM}mm <span className="text-neutral-400">(label size)</span><br/>
                {Math.max(0, printable.w)}mm × {Math.max(0, printable.h)}mm <span className="text-neutral-400">(printable area)</span>
              </div>
            </div>

            {/* preview area with checker bg */}
            <div className="rounded-xl border p-4 bg-white" style={{
              backgroundSize: '16px 16px',
              backgroundImage: `linear-gradient(45deg,#f1f1f1 25%,transparent 25%),linear-gradient(-45deg,#f1f1f1 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f1f1f1 75%),linear-gradient(-45deg,transparent 75%,#f1f1f1 75%)`,
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
            }}>
              <div className="w-full flex items-center justify-center min-h-[140px]">
                {isReady ? (
                  <LabelPreview rec={sel} opts={opts} />
                ) : (
                  <div className="flex items-center gap-2 text-neutral-400 text-sm">
                    <span className="inline-flex border rounded-md px-2 py-1">🏷️</span>
                    Fill out the form to generate a label
                  </div>
                )}
              </div>
            </div>

            {/* bottom buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
              <button disabled={!isReady} onClick={()=>exportPDF([sel], pagePreset, gapMM, opts)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border font-medium ${isReady?"bg-blue-600 text-white border-blue-600 hover:bg-blue-700":"bg-neutral-200 text-neutral-500 border-neutral-200 cursor-not-allowed"}`}>
                <span>⬇️</span> Download
              </button>
              <a className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border bg-yellow-400/90 hover:bg-yellow-400 font-semibold" href="https://www.buymeacoffee.com/" target="_blank" rel="noreferrer">☕ Buy me a coffee</a>
            </div>
          </div>

          {/* RIGHT: settings panel */}
          <div className="bg-white rounded-2xl shadow p-4 lg:p-6 h-max">
            <div className="space-y-3">
              <div className="text-sm font-semibold">Label Settings</div>
              <Toggle checked={ui.standardRef} onChange={(v)=>setUi({...ui, standardRef:v})}><span>Standard Reference</span></Toggle>
              <Toggle checked={ui.showIcon} onChange={(v)=>setUi({...ui, showIcon:v})}><span>Image</span></Toggle>
              <Toggle checked={ui.qr} onChange={(v)=>setUi({...ui, qr:v})}><span>QR Code</span></Toggle>

              <div className="mt-4 text-sm">Label Width</div>
              <div className="flex items-center gap-2">
                <input type="number" className="w-24 border rounded-lg px-2 py-1" value={sel.dims.widthMM}
                  onChange={(e)=>update({...sel, dims:{...sel.dims, widthMM: clamp(Number(e.target.value||0), 37, 100)}})} />
                <span className="text-sm text-neutral-500">mm</span>
              </div>
              <input type="range" min={37} max={100} value={sel.dims.widthMM} onChange={(e)=>update({...sel, dims:{...sel.dims, widthMM: Number(e.target.value)}})} className="w-full" />
              <div className="flex justify-between text-xs text-neutral-500"><span>37mm</span><span>100mm</span></div>

              <div className="mt-4 text-sm">Label Height</div>
              <div className="grid grid-cols-4 gap-2">
                {HEIGHT_PRESETS.map(h => (
                  <button key={h} onClick={()=>update({...sel, dims:{...sel.dims, heightMM:h}})}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${sel.dims.heightMM===h?"bg-blue-600 text-white border-blue-600":"bg-neutral-100 border-neutral-200"}`}>{h} mm</button>
                ))}
              </div>

              <div className="mt-6 p-3 rounded-xl bg-neutral-50 border text-sm">
                <div className="font-medium mb-2">Paper & export</div>
                <label className="block mb-2">Paper size
                  <select className="mt-1 w-full border rounded p-2 text-sm" value={pagePreset.id} onChange={(e)=>setPagePreset(PAGE_PRESETS.find(p=>p.id===e.target.value) || PAGE_PRESETS[0])}>
                    {PAGE_PRESETS.map((p)=> <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </label>
                <label className="block">Gap (mm)
                  <input type="number" className="mt-1 w-full border rounded p-2 text-sm" value={gapMM} onChange={(e)=>setGapMM(Number(e.target.value))} />
                </label>
              </div>

              <a href="https://github.com/2wenty2wo/2wenty2wo.github.io/issues" target="_blank" rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center w-full rounded-xl border px-4 py-2 text-sm font-medium bg-blue-50 border-blue-200 hover:bg-blue-100">💬 Provide feedback</a>

              <div className="pt-3 text-xs text-neutral-500">
                <div className="font-medium mb-1">Advanced</div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 border rounded" onClick={saveJSON}>Save JSON</button>
                  <label className="px-2 py-1 border rounded cursor-pointer">Load JSON
                    <input type="file" accept="application/json" className="hidden" onChange={(e)=>e.target.files && loadJSON(e.target.files[0])} />
                  </label>
                  <label className="px-2 py-1 border rounded cursor-pointer">Import CSV
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e)=>e.target.files && importCSV(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-neutral-500">© {new Date().getFullYear()} Gridfinity Pro Labels — SVG/PDF, client‑side.</footer>
      </div>
    </div>
  );
}
