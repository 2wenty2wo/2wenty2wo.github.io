import React, { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import * as QRCode from "qrcode"; // namespace import avoids undefined default
import JsBarcode from "jsbarcode";
import Papa from "papaparse";

const MM_PER_INCH = 25.4;
const PT_PER_INCH = 72;
const mmToPt = (mm) => (mm * PT_PER_INCH) / MM_PER_INCH;
const mmToPx = (mm) => mm * 3.7795275591; // preview only

const DEFAULT_DIMS = { widthMM: 55, heightMM: 12, marginMM: { left: 2, right: 2, top: 1, bottom: 1 } };
const TAPE_PRESETS = [
  { label: "9 mm tape", widthMM: 55, heightMM: 9 },
  { label: "12 mm tape", widthMM: 55, heightMM: 12 },
  { label: "18 mm tape", widthMM: 55, heightMM: 18 },
  { label: "24 mm tape", widthMM: 55, heightMM: 24 },
];
const PAGE_PRESETS = [
  { id: "A4", label: "A4 (210×297 mm)", widthMM: 210, heightMM: 297 },
  { id: "Letter", label: "Letter (216×279 mm)", widthMM: 216, heightMM: 279 },
];

const CATEGORY_SCHEMAS = {
  heat_insert: {
    label: "Heat-Insert",
    icon: "heat_insert",
    fields: ["thread", "length_mm", "outer_mm", "hole_mm", "material", "knurl"],
    chips: (v) => [v.length_mm && `L=${v.length_mm} mm`, v.outer_mm && `OD=${v.outer_mm}`, v.hole_mm && `Hole=${v.hole_mm}`].filter(Boolean),
    title: (v) => `${v.thread || "?"} Heat-Insert`,
    subtitle: (v) => [v.material, v.knurl].filter(Boolean).join(" • "),
  },
  fuse_blade: {
    label: "Fuse (Blade)", icon: "fuse_blade",
    fields: ["series", "rating_A", "voltage_V", "blow", "qty"],
    chips: (v) => [v.rating_A && `${v.rating_A} A`, v.voltage_V && `${v.voltage_V} V`, v.blow && v.blow.toUpperCase(), v.qty && `x${v.qty}`].filter(Boolean),
    title: (v) => `${v.series || "Blade"} Fuse`, subtitle: (v) => (v.note || "Automotive"),
  },
  fuse_glass: {
    label: "Fuse (Glass)", icon: "fuse_glass",
    fields: ["size", "rating_A", "voltage_V", "timelag", "breaking"],
    chips: (v) => [v.size, v.rating_A && `${v.rating_A} A`, v.voltage_V && `${v.voltage_V} V`, v.timelag, v.breaking].filter(Boolean),
    title: (v) => `${v.size || "5×20"} Glass Fuse`, subtitle: (v) => (v.timelag || ""),
  },
  resistor: {
    label: "Resistor", icon: "resistor",
    fields: ["value", "tolerance", "watt", "series", "smd_code"],
    chips: (v) => [v.value, v.tolerance, v.watt && `${v.watt} W`, v.series, v.smd_code].filter(Boolean),
    title: (v) => `Resistor ${v.value || "?"}`, subtitle: (v) => [v.tolerance, v.watt && `${v.watt} W`].filter(Boolean).join(" • "),
  },
  capacitor: {
    label: "Capacitor", icon: "capacitor",
    fields: ["type", "value", "voltage", "esr", "pkg"],
    chips: (v) => [v.value, v.voltage, v.esr && `ESR ${v.esr}`, v.pkg].filter(Boolean),
    title: (v) => `${v.type || "Cap"} ${v.value || "?"}`, subtitle: (v) => v.voltage || "",
  },
  connector: {
    label: "Connector", icon: "jst",
    fields: ["family", "positions", "pitch_mm", "gender", "part"],
    chips: (v) => [v.family, v.positions && `${v.positions} pos`, v.pitch_mm && `${v.pitch_mm} mm`, v.gender].filter(Boolean),
    title: (v) => `${v.family || "Conn"} ${v.positions || "?"}p`, subtitle: (v) => v.part || "",
  },
  wire: {
    label: "Wire", icon: "wire",
    fields: ["awg", "mm2", "strands", "insulation", "voltage", "temp", "color"],
    chips: (v) => [v.awg && `AWG ${v.awg}`, v.mm2 && `${v.mm2} mm²`, v.color, v.voltage, v.temp].filter(Boolean),
    title: (v) => `${v.color || ""} Wire`.trim(), subtitle: (v) => [v.awg && `AWG ${v.awg}`, v.mm2 && `${v.mm2} mm²`].filter(Boolean).join(" • "),
  },
  screw: {
    label: "Screw/Bolt", icon: "screw",
    fields: ["standard", "thread", "length_mm", "material", "finish", "head", "drive"],
    chips: (v) => [v.thread, v.length_mm && `L=${v.length_mm} mm`, v.material, v.head, v.drive].filter(Boolean),
    title: (v) => `${v.thread || "?"} ${v.head || ""}`.trim(), subtitle: (v) => [v.material, v.finish].filter(Boolean).join(" • "),
  },
  custom: {
    label: "Custom", icon: "custom",
    fields: ["title", "subtitle", "chips", "notes"],
    chips: (v) => (v.chips ? String(v.chips).split("|").map((s) => s.trim()).filter(Boolean) : []),
    title: (v) => v.title || "Custom", subtitle: (v) => v.subtitle || "",
  },
};

const TEMPLATES = [
  { id: "minimal", label: "Minimal" },
  { id: "specStack", label: "Spec Stack" },
  { id: "iconRight", label: "Icon Right" },
  { id: "twoLine", label: "Two-Line" },
];

const makeBlankRecord = (category = "heat_insert") => ({
  id: `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  category,
  dims: { ...DEFAULT_DIMS },
  icon: { name: CATEGORY_SCHEMAS[category]?.icon || "custom" },
  barcode: { type: "none" },
  fields: {},
  template: "specStack",
  theme: "default",
});

const Pill = ({ text }) => (
  <span className="border px-1.5 py-[1px] rounded-md text-[10px] leading-none mr-1 mb-1 inline-block">{text}</span>
);

const RecordEditor = ({ rec, onChange }) => {
  const schema = CATEGORY_SCHEMAS[rec.category] || CATEGORY_SCHEMAS.custom;
  const [local, setLocal] = useState(rec);
  useEffect(() => setLocal(rec), [rec.id]);
  function set(path, value) {
    const next = { ...local };
    const segments = path.split(".");
    let ref = next;
    for (let i = 0; i < segments.length - 1; i++) ref = ref[segments[i]];
    ref[segments[segments.length - 1]] = value;
    setLocal(next); onChange(next);
  }
  const dims = local.dims;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">Category
          <select className="w-full border rounded p-1" value={local.category} onChange={(e) => set("category", e.target.value)}>
            {Object.entries(CATEGORY_SCHEMAS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
        </label>
        <label className="text-sm">Template
          <select className="w-full border rounded p-1" value={local.template} onChange={(e) => set("template", e.target.value)}>
            {TEMPLATES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <label className="text-sm col-span-2">Width (mm)
          <input type="number" className="w-full border rounded p-1" value={dims.widthMM} onChange={(e) => set("dims.widthMM", Number(e.target.value))} />
        </label>
        <label className="text-sm col-span-2">Height (mm)
          <input type="number" className="w-full border rounded p-1" value={dims.heightMM} onChange={(e) => set("dims.heightMM", Number(e.target.value))} />
        </label>
        <label className="text-sm">Left margin
          <input type="number" className="w-full border rounded p-1" value={dims.marginMM.left} onChange={(e) => set("dims.marginMM.left", Number(e.target.value))} />
        </label>
        <label className="text-sm">Right margin
          <input type="number" className="w-full border rounded p-1" value={dims.marginMM.right} onChange={(e) => set("dims.marginMM.right", Number(e.target.value))} />
        </label>
        <label className="text-sm">Top margin
          <input type="number" className="w-full border rounded p-1" value={dims.marginMM.top} onChange={(e) => set("dims.marginMM.top", Number(e.target.value))} />
        </label>
        <label className="text-sm">Bottom margin
          <input type="number" className="w-full border rounded p-1" value={dims.marginMM.bottom} onChange={(e) => set("dims.marginMM.bottom", Number(e.target.value))} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs font-semibold mb-1">Quick presets</div>
          <div className="flex flex-wrap gap-2">
            {TAPE_PRESETS.map((p) => (
              <button key={p.label} className="text-xs border rounded px-2 py-1" onClick={() => { set("dims.widthMM", p.widthMM); set("dims.heightMM", p.heightMM); }}>{p.label}</button>
            ))}
          </div>
        </div>
        <label className="text-sm">Icon
          <select className="w-full border rounded p-1" value={local.icon?.name} onChange={(e) => set("icon.name", e.target.value)}>
            {Object.keys(ICONS).map((k) => (<option key={k} value={k}>{k}</option>))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(schema.fields || []).map((f) => (
          <label key={f} className="text-sm capitalize">{f.replace(/_/g, " ")}
            <input className="w-full border rounded p-1" value={local.fields[f] || ""} onChange={(e) => set(`fields.${f}`, e.target.value)} />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="text-sm">Barcode Type
          <select className="w-full border rounded p-1" value={local.barcode?.type || "none"} onChange={(e) => set("barcode.type", e.target.value)}>
            <option value="none">None</option>
            <option value="qr">QR</option>
            <option value="code128">Code128</option>
          </select>
        </label>
        <label className="text-sm col-span-2">Barcode Value (URL/SKU)
          <input className="w-full border rounded p-1" value={local.barcode?.value || ""} onChange={(e) => set("barcode.value", e.target.value)} />
        </label>
      </div>

      <div className="text-xs text-neutral-500">Custom: set title/subtitle/chips (pipe-separated) and notes.</div>
    </div>
  );
};

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
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><rect x=\"1.5\" y=\"3\" width=\"3\" height=\"6\" /><path d=\"M1.5,3 L4.5,3 M3,3 L3,9\" /></g>`;
    default:
      return `<g stroke-width=\"0.35\" stroke=\"black\" fill=\"none\"><circle cx=\"3\" cy=\"6\" r=\"2.4\" /><path d=\"M3,3.6 L3,8.4 M0.6,6 L5.4,6\" /></g>`;
  }
}

function escapeXML(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function buildLabelSVG(rec) {
  const schema = CATEGORY_SCHEMAS[rec.category] || CATEGORY_SCHEMAS.custom;
  const width = rec.dims.widthMM, height = rec.dims.heightMM; const m = rec.dims.marginMM;
  const innerWidth = Math.max(0, width - (m.left + m.right));
  const innerHeight = Math.max(0, height - (m.top + m.bottom));
  const chips = schema.chips(rec.fields); const title = schema.title(rec.fields); const subtitle = schema.subtitle(rec.fields);
  const iconBox = 6, pad = 0.6;
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
  const iconX = tmpl === "iconRight" ? innerWidth - iconBox : 0;
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
  <g transform="translate(${m.left + (tmpl === "iconRight" ? innerWidth - iconBox : 0)}, ${m.top})"><rect width="${iconBox}" height="${innerHeight}" fill="none" /><g>${renderIconToPath(rec.icon?.name || "custom")}</g></g>
  <text x="${m.left + textX}" y="${m.top + 2 + titleSize}" font-family="Inter,Arial" font-weight="700" font-size="${titleSize}">${escapeXML(title)}</text>
  ${subtitle ? `<text x="${m.left + textX}" y="${m.top + 2 + titleSize + subSize + 0.6}" font-family="Inter,Arial" font-size="${subSize}">${escapeXML(subtitle)}</text>` : ""}
  ${pillSVGs.join("\n")}
  ${barcodeGroup}
  ${qrImg}
</svg>`;
  return svg;
}

const ICONS = { heat_insert: true, fuse_blade: true, fuse_glass: true, resistor: true, capacitor: true, jst: true, wire: true, screw: true, custom: true };

const LabelPreview = ({ rec }) => {
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
  const svgString = useMemo(() => buildLabelSVG(rec), [rec]);
  return (
    <div className="border bg-white" style={{ width: mmToPx(rec.dims.widthMM), height: mmToPx(rec.dims.heightMM) }} ref={svgRef} dangerouslySetInnerHTML={{ __html: svgString }} />
  );
};

async function exportPDF(records, page = PAGE_PRESETS[0], gapMM = 3) {
  const pdf = await PDFDocument.create();
  const pageWpt = mmToPt(page.widthMM), pageHpt = mmToPt(page.heightMM);
  let pageDoc = pdf.addPage([pageWpt, pageHpt]);
  let cursorX = 10, cursorY = 10;
  const addNewPage = () => { pageDoc = pdf.addPage([pageWpt, pageHpt]); cursorX = 10; cursorY = 10; };
  for (const rec of records) {
    const svg = buildLabelSVG(rec);
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

export default function App() {
  const [records, setRecords] = useState([makeBlankRecord("heat_insert")]);
  const [selectedId, setSelectedId] = useState(records[0].id);
  const [pagePreset, setPagePreset] = useState(PAGE_PRESETS[0]);
  const [gapMM, setGapMM] = useState(3);
  const sel = records.find((r) => r.id === selectedId) || records[0];
  const update = (next) => setRecords((prev) => prev.map((r) => (r.id === next.id ? next : r)));
  const addRecord = (cat = "heat_insert") => { const r = makeBlankRecord(cat); setRecords((prev) => [...prev, r]); setSelectedId(r.id); };
  const duplicateRecord = () => { if (!sel) return; const copy = JSON.parse(JSON.stringify(sel)); copy.id = copy.category + "-" + Date.now() + "-copy"; setRecords((prev) => [...prev, copy]); };
  const removeRecord = () => { if (!sel) return; setRecords((prev) => prev.filter((r) => r.id !== sel.id)); };
  const saveJSON = () => downloadBlob(new Blob([JSON.stringify(records, null, 2)], { type: "application/json" }), `labels_${Date.now()}.json`);
  const loadJSON = (file) => { const reader = new FileReader(); reader.onload = () => { try { const arr = JSON.parse(reader.result); if (Array.isArray(arr)) { setRecords(arr); setSelectedId(arr[0]?.id); } } catch { alert("Invalid JSON"); } }; reader.readAsText(file); };
  const importCSV = (file) => { const reader = new FileReader(); reader.onload = () => { const rows = parseCSV(reader.result); const mapped = rows.map((row) => { const cat = (row.category || "custom").trim(); const rec = makeBlankRecord(cat); rec.dims.widthMM = Number(row.widthMM || rec.dims.widthMM); rec.dims.heightMM = Number(row.heightMM || rec.dims.heightMM); if (row.barcode_type) rec.barcode.type = row.barcode_type; if (row.barcode_value) rec.barcode.value = row.barcode_value; const schema = CATEGORY_SCHEMAS[cat] || CATEGORY_SCHEMAS.custom; (schema.fields || []).forEach((f) => { if (row[f] !== undefined) rec.fields[f] = row[f]; }); if (cat === "custom") { if (row.title) rec.fields.title = row.title; if (row.subtitle) rec.fields.subtitle = row.subtitle; if (row.chips) rec.fields.chips = row.chips; if (row.notes) rec.fields.notes = row.notes; } return rec; }); setRecords((prev) => [...prev, ...mapped]); if (mapped.length) setSelectedId(mapped[0].id); }; reader.readAsText(file); };
  const downloadSVG = () => { if (!sel) return; const svg = buildLabelSVG(sel); const blob = new Blob([svg], { type: "image/svg+xml" }); downloadBlob(blob, `${sel.category}_${Date.now()}.svg`); };
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="max-w-7xl mx-auto p-4">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Gridfinity Pro Labels</h1>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border rounded" onClick={() => addRecord()}>New</button>
            <button className="px-3 py-1.5 border rounded" onClick={duplicateRecord}>Duplicate</button>
            <button className="px-3 py-1.5 border rounded" onClick={removeRecord}>Delete</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white rounded-2xl shadow p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Labels ({records.length})</div>
              <div className="text-xs text-neutral-500">Click to select</div>
            </div>
            <div className="max-h-[60vh] overflow-auto divide-y">
              {records.map((r) => {
                const schema = CATEGORY_SCHEMAS[r.category] || CATEGORY_SCHEMAS.custom;
                return (
                  <button key={r.id} onClick={() => setSelectedId(r.id)} className={`w-full text-left py-2 px-2 rounded hover:bg-neutral-50 ${selectedId===r.id?"bg-neutral-100": ""}`}>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 border rounded">
                        <svg viewBox="0 0 6 12" width="16" height="16" dangerouslySetInnerHTML={{ __html: renderIconToPath(r.icon?.name || "custom") }} />
                      </span>
                      {schema.title(r.fields)}
                    </div>
                    <div className="text-xs text-neutral-600">{schema.subtitle(r.fields)}</div>
                    <div className="mt-1">{(schema.chips(r.fields)).slice(0,4).map((c, i) => <Pill key={i} text={c} />)}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <div className="text-sm font-semibold mb-1">Add from preset</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(CATEGORY_SCHEMAS).map((k) => (
                  <button key={k} className="px-2 py-1 border rounded text-xs" onClick={() => addRecord(k)}>
                    {CATEGORY_SCHEMAS[k].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 border rounded" onClick={saveJSON}>Save JSON</button>
                <label className="px-3 py-1.5 border rounded cursor-pointer">Load JSON
                  <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && loadJSON(e.target.files[0])} />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 border rounded cursor-pointer">Import CSV
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files && importCSV(e.target.files[0])} />
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white rounded-2xl shadow p-3">
            {sel && <RecordEditor rec={sel} onChange={update} />}
          </div>

          <div className="lg:col-span-1 bg-white rounded-2xl shadow p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Preview (mm-true)</div>
              <div className="text-xs text-neutral-500">Print at “Actual size”</div>
            </div>
            <div className="flex justify-center items-center h-[180px] overflow-auto bg-neutral-50 rounded">
              {sel && <LabelPreview rec={sel} />}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="px-3 py-1.5 border rounded" onClick={downloadSVG}>Download SVG</button>
              <button className="px-3 py-1.5 border rounded" onClick={() => exportPDF(records, pagePreset, gapMM)}>Export PDF</button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-sm">Paper size
                <select className="w-full border rounded p-1" value={pagePreset.id} onChange={(e) => setPagePreset(PAGE_PRESETS.find((p)=>p.id===e.target.value) || PAGE_PRESETS[0])}>
                  {PAGE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </label>
              <label className="text-sm">Gap (mm)
                <input type="number" className="w-full border rounded p-1" value={gapMM} onChange={(e)=>setGapMM(Number(e.target.value))} />
              </label>
            </div>
            <div className="mt-3 text-xs text-neutral-600">Use presets (9/12/18/24 mm) or custom mm sizes. SVG uses mm for true-to-size printing.</div>
          </div>
        </div>

        <footer className="mt-6 text-center text-xs text-neutral-500">© {new Date().getFullYear()} Gridfinity Pro Labels — Offline-first, SVG/PDF.</footer>
      </div>
    </div>
  );
}
