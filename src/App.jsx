import React, { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";

const mmToPt = (mm) => (mm * 72) / 25.4;
const mmToPx = (mm) => mm * 3.7795275591;

export default function App() {
  const [part, setPart] = useState("screw");
  const [system, setSystem] = useState("metric");
  const [thread, setThread] = useState("M3");
  const [kind, setKind] = useState("Bolt");
  const [length, setLength] = useState("20");
  const [standard, setStandard] = useState("DIN 186");
  const [showImage, setShowImage] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [labelWidth, setLabelWidth] = useState(55);
  const [tapeWidth, setTapeWidth] = useState(12);
  const [qrData, setQrData] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (showQR) {
      const text = `${thread} × ${length} ${standard}`;
      QRCode.toDataURL(text, { margin: 0 }).then(setQrData);
    } else {
      setQrData(null);
    }
  }, [showQR, thread, length, standard]);

  const previewWidthPx = mmToPx(labelWidth);
  const previewHeightPx = mmToPx(tapeWidth);

  async function downloadPDF() {
    const svg = svgRef.current;
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.src = url;
    await new Promise((res) => (img.onload = res));
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const pngUrl = canvas.toDataURL("image/png");
    const pngBytes = await fetch(pngUrl).then((r) => r.arrayBuffer());
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([mmToPt(labelWidth), mmToPt(tapeWidth)]);
    const pngImage = await pdf.embedPng(pngBytes);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    });
    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "label.pdf";
    a.click();
  }

  const labelText = `${thread} × ${length} ${standard}`;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center">Gridfinity Label Generator</h1>
      <p className="text-center text-neutral-600 mb-6">
        Print-Ready Labels for Your Gridfinity System
      </p>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-semibold mb-2">Screw Type</h2>
            <div className="flex gap-2 mb-4">
              {["screw", "nut", "washer"].map((p) => (
                <button
                  key={p}
                  className={`px-3 py-1 rounded ${
                    part === p ? "bg-blue-600 text-white" : "bg-neutral-200"
                  }`}
                  onClick={() => setPart(p)}
                >
                  {p[0].toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              {["metric", "imperial"].map((s) => (
                <button
                  key={s}
                  className={`px-3 py-1 rounded ${
                    system === s ? "bg-blue-600 text-white" : "bg-neutral-200"
                  }`}
                  onClick={() => setSystem(s)}
                >
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <select
                className="border p-1 rounded"
                value={thread}
                onChange={(e) => setThread(e.target.value)}
              >
                <option>M3</option>
                <option>M4</option>
                <option>M5</option>
                <option>M6</option>
              </select>
              <select
                className="border p-1 rounded"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option>Bolt</option>
                <option>Socket</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <input
                className="border p-1 rounded"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
              <select
                className="border p-1 rounded"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
              >
                <option>DIN 186</option>
                <option>DIN 912</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="text-sm font-semibold mb-1">Label Preview</div>
              <div
                className="border bg-yellow-200 flex items-center justify-center"
                style={{ width: previewWidthPx, height: previewHeightPx }}
              >
                <svg
                  ref={svgRef}
                  width={previewWidthPx}
                  height={previewHeightPx}
                  viewBox={`0 0 ${labelWidth} ${tapeWidth}`}
                >
                  <rect
                    width={labelWidth}
                    height={tapeWidth}
                    fill="#FDE68A"
                    rx="1"
                  />
                  {showImage && (
                    <g transform="translate(2,1)">
                      <path
                        d="M1.5,3 L4.5,3 L4.5,9 L1.5,9 Z M3,3 L3,9 M1.5,3 L4.5,3"
                        stroke="black"
                        strokeWidth="0.3"
                        fill="none"
                      />
                    </g>
                  )}
                  <text
                    x="10"
                    y={tapeWidth / 2 + 1}
                    fontSize="3"
                    dominantBaseline="middle"
                  >
                    {labelText}
                  </text>
                  {showQR && qrData && (
                    <image
                      href={qrData}
                      x={labelWidth - 10}
                      y={1}
                      width="9"
                      height="9"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Label Settings</h2>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showImage}
                  onChange={(e) => setShowImage(e.target.checked)}
                />
                Image
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showQR}
                  onChange={(e) => setShowQR(e.target.checked)}
                />
                QR code
              </label>
            </div>
            <label className="block text-sm mb-2">
              Label Width
              <input
                type="number"
                className="w-full border p-1 rounded mt-1"
                value={labelWidth}
                onChange={(e) => setLabelWidth(Number(e.target.value))}
              />
            </label>
            <div className="mb-4">
              <div className="text-sm font-semibold mb-1">Label Height</div>
              <div className="flex gap-2">
                {[9, 12, 18, 24].map((h) => (
                  <button
                    key={h}
                    className={`px-3 py-1 rounded ${
                      tapeWidth === h
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-200"
                    }`}
                    onClick={() => setTapeWidth(h)}
                  >
                    {h} mm
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={downloadPDF}
              >
                Download
              </button>
              <a
                className="bg-yellow-400 text-black px-4 py-2 rounded"
                href="https://www.buymeacoffee.com/"
                target="_blank"
              >
                Buy me a coffee
              </a>
            </div>
            <div className="mt-4">
              <a
                href="https://github.com/2wenty2wo/2wenty2wo.github.io/issues"
                className="text-blue-600"
              >
                Provide feedback
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

