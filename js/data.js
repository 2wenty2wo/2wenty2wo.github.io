export const metricThreadSizes = [
  'M1', 'M1.2', 'M1.4', 'M1.6', 'M2', 'M2.5', 'M3', 'M3.5', 'M4',
  'M5', 'M6', 'M7', 'M8', 'M10', 'M12', 'M14', 'M16', 'M18', 'M20',
  'M22', 'M24', 'M30'
];

export const imperialThreadSizes = [
  '#4-40', '#6-32', '#8-32', '#10-24', '1/4-20', '5/16-18', '3/8-16', '7/16-14', '1/2-13'
];

export const fuseValues = [
  '0.25', '0.5', '0.75', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '7.5', '8', '10', '12',
  '15', '20', '25', '30', '40'
];

export const bearingOptions = [
  { code: '608ZZ', description: '8 × 22 × 7 mm, metal shields' },
  { code: '608-2RS', description: '8 × 22 × 7 mm, rubber seals' },
  { code: '625ZZ', description: '5 × 16 × 5 mm, miniature shielded' },
  { code: '6200ZZ', description: '10 × 30 × 9 mm, deep groove' },
  { code: '6900ZZ', description: '10 × 22 × 6 mm, thin section' },
  { code: '6701ZZ', description: '12 × 18 × 4 mm, thin section' },
  { code: 'MR85-2RS', description: '5 × 8 × 2.5 mm, rubber seals' }
];

export const hardwareCatalog = {
  Bolt: [
    { code: 'Socket Head', name: 'Socket Head Cap Screw' },
    { code: 'Button Head', name: 'Button Head Cap Screw' }
  ],
  Screw: [
    { code: 'DIN 571', name: 'Coach Screw (Wood Screw)' },
    { code: 'DIN 7995', name: 'Cross Recessed Pan Head Wood Screw' },
    { code: 'DIN 7996', name: 'Cross Recessed Countersunk Head Wood Screw' },
    { code: 'DIN 7997', name: 'Cross Recessed Raised Countersunk Head Wood Screw' },
    { code: 'DIN 95', name: 'Round Head Wood Screw' },
    { code: 'DIN 96', name: 'Raised Countersunk Head Wood Screw' },
    { code: 'DIN 97', name: 'Countersunk Head Wood Screw' }
  ],
  Nut: [
    { code: 'DIN 1478', name: 'Wing Nut' },
    { code: 'DIN 1479', name: 'Wing Nut' },
    { code: 'DIN 1480', name: 'Wing Nut' },
    { code: 'DIN 1587', name: 'Cap Nut' },
    { code: 'DIN 1804', name: 'Slotted Round Nut' },
    { code: 'DIN 1816', name: 'Square Weld Nut' },
    { code: 'DIN 315', name: 'Wing Nut' },
    { code: 'DIN 431', name: 'Square Nut' },
    { code: 'DIN 439', name: 'Hexagon Thin Nut' },
    { code: 'DIN 466', name: 'Square Nut' },
    { code: 'DIN 467', name: 'Knurled Nut' },
    { code: 'DIN 508', name: 'T-Slot Nut' },
    { code: 'DIN 546', name: 'Small Hexagon Nut' },
    { code: 'DIN 557', name: 'Square Nut' },
    { code: 'DIN 562', name: 'Square Thin Nut' },
    { code: 'DIN 582', name: 'Eye Nut' },
    { code: 'DIN 6330', name: 'Hexagon Nut' },
    { code: 'DIN 6331', name: 'Hexagon High Nut' },
    { code: 'DIN 6334', name: 'Hexagon High Nut' },
    { code: 'DIN 6915', name: 'High-Strength Hexagon Nut' },
    { code: 'DIN 6923', name: 'Hexagon Flange Nut' },
    { code: 'DIN 6925', name: 'Hexagon Weld Nut' },
    { code: 'DIN 6926', name: 'Prevailing Torque Type Hexagon Nut' },
    { code: 'DIN 6927', name: 'Prevailing Torque Type Hexagon Thin Nut' },
    { code: 'DIN 70852', name: 'Hexagon Nut with Flange' },
    { code: 'DIN 74361', name: 'Hexagon Nut with Flange' },
    { code: 'DIN 7965', name: 'Square Weld Nut' },
    { code: 'DIN 7967', name: 'Prevailing Torque Type Hexagon Nut' },
    { code: 'DIN 80701', name: 'Hexagon Nut' },
    { code: 'DIN 80705', name: 'Hexagon Nut' },
    { code: 'DIN 917', name: 'Cap Nut' },
    { code: 'DIN 928', name: 'Hexagon Weld Nut' },
    { code: 'DIN 929', name: 'Hexagon Weld Nut' },
    { code: 'DIN 934', name: 'Hexagon Nut' },
    { code: 'DIN 935', name: 'Castle Nut' },
    { code: 'DIN 936', name: 'Hexagon Thin Nut' },
    { code: 'DIN 937', name: 'Hexagon Thin Slotted Nut' },
    { code: 'DIN 979', name: 'Hexagon Slotted Nut' },
    { code: 'DIN 980', name: 'Prevailing Torque Type Hexagon Nut' },
    { code: 'DIN 981', name: 'Slotted Round Nut' },
    { code: 'DIN 982', name: 'Prevailing Torque Type Hexagon Nut' },
    { code: 'DIN 985', name: 'Prevailing Torque Type Hexagon Nut' },
    { code: 'DIN 986', name: 'Prevailing Torque Type Hexagon Thin Nut' },
    { code: 'ISO 7040', name: 'Prevailing Torque Type Hexagon Nut' }
  ],
  Washer: [
    { code: 'DIN 1052', name: 'Washer for Wood Construction' },
    { code: 'DIN 125', name: 'Plain Washer' },
    { code: 'DIN 127', name: 'Spring Lock Washer' },
    { code: 'DIN 128', name: 'Spring Lock Washer' },
    { code: 'DIN 137', name: 'Spring Lock Washer' },
    { code: 'DIN 1440', name: 'Plain Washer' },
    { code: 'DIN 1441', name: 'Plain Washer' },
    { code: 'DIN 2093', name: 'Disc Spring' },
    { code: 'DIN 25201', name: 'Wedge Lock Washer' },
    { code: 'DIN 432', name: 'Square Washer' },
    { code: 'DIN 433', name: 'Plain Washer' },
    { code: 'DIN 434', name: 'Square Taper Washer' },
    { code: 'DIN 435', name: 'Square Taper Washer' },
    { code: 'DIN 436', name: 'Square Washer' },
    { code: 'DIN 440', name: 'Plain Washer' },
    { code: 'DIN 462', name: 'Square Washer' },
    { code: 'DIN 463', name: 'Square Washer' },
    { code: 'DIN 5406', name: 'Tooth Lock Washer' },
    { code: 'DIN 6319', name: 'Spherical Washer' },
    { code: 'DIN 6340', name: 'Heavy Duty Plain Washer' },
    { code: 'DIN 6796', name: 'Conical Spring Washer' },
    { code: 'DIN 6797', name: 'Tooth Lock Washer' },
    { code: 'DIN 6798', name: 'Tooth Lock Washer' },
    { code: 'DIN 6916', name: 'High-Strength Structural Washer' },
    { code: 'DIN 6917', name: 'Square Taper Washer' },
    { code: 'DIN 6918', name: 'Square Taper Washer' },
    { code: 'DIN 70952', name: 'Plain Washer' },
    { code: 'DIN 7349', name: 'Heavy Duty Plain Washer' },
    { code: 'DIN 74361', name: 'Plain Washer' },
    { code: 'DIN 7603', name: 'Sealing Washer' },
    { code: 'DIN 7980', name: 'Spring Lock Washer' },
    { code: 'DIN 7989', name: 'Plain Washer' },
    { code: 'DIN 9021', name: 'Plain Washer' },
    { code: 'DIN 93', name: 'Tab Washer' },
    { code: 'DIN 988', name: 'Shim Ring' }
  ],
  'Heat Insert': [],
  Bearing: [],
  Component: [],
  Fuse: [
    { code: 'IEC 60127-2', name: 'Time-Lag Cartridge Fuse' },
    { code: 'IEC 60127-3', name: 'Fast-Acting Cartridge Fuse' },
    { code: 'UL 248-14', name: 'Supplementary Fuse' }
  ]
};

export const hardwareImageFolders = {
  Bolt: 'bolts',
  Screw: 'screws',
  Nut: 'nuts',
  Washer: 'washers'
};

export const connectorCatalog = [
  {
    id: 'pre-insulated-crimp',
    label: 'Pre-insulated Crimp Terminals',
    help: 'Colour-coded PVC or nylon insulated crimp lugs for 22–10 AWG conductors.',
    example: 'e.g., Blue ring terminal, 16–14 AWG, M4 stud',
    series: [
      { code: 'Red Ring Terminal', name: '22–16 AWG (0.5–1.5 mm²) PVC insulated' },
      { code: 'Blue Ring Terminal', name: '16–14 AWG (1.5–2.5 mm²) PVC insulated' },
      { code: 'Yellow Ring Terminal', name: '12–10 AWG (4.0–6.0 mm²) PVC insulated' },
      { code: 'Red Fork Terminal', name: '22–16 AWG (0.5–1.5 mm²) insulated spade' },
      { code: 'Blue Fork Terminal', name: '16–14 AWG (1.5–2.5 mm²) insulated spade' },
      { code: 'Yellow Fork Terminal', name: '12–10 AWG (4.0–6.0 mm²) insulated spade' },
      { code: 'Red Locking Fork Terminal', name: '22–16 AWG (0.5–1.5 mm²) locking tongue spade' },
      { code: 'Blue Locking Fork Terminal', name: '16–14 AWG (1.5–2.5 mm²) locking tongue spade' },
      { code: 'Yellow Locking Fork Terminal', name: '12–10 AWG (4.0–6.0 mm²) locking tongue spade' },
      { code: 'Red Butt Splice', name: '22–16 AWG (0.5–1.5 mm²) straight splice' },
      { code: 'Blue Butt Splice', name: '16–14 AWG (1.5–2.5 mm²) straight splice' },
      { code: 'Yellow Butt Splice', name: '12–10 AWG (4.0–6.0 mm²) straight splice' },
      { code: 'Red Step-Down Butt Splice', name: '22–18 AWG to 16–14 AWG insulated reducer' },
      { code: 'Blue Step-Down Butt Splice', name: '16–14 AWG to 12–10 AWG insulated reducer' },
      { code: 'Red Parallel Splice', name: '22–16 AWG (0.5–1.5 mm²) parallel crimp' },
      { code: 'Blue Parallel Splice', name: '16–14 AWG (1.5–2.5 mm²) parallel crimp' },
      { code: 'Yellow Parallel Splice', name: '12–10 AWG (4.0–6.0 mm²) parallel crimp' },
      { code: 'Red Male Quick Disconnect', name: '22–16 AWG (0.5–1.5 mm²) fully insulated tab' },
      { code: 'Blue Male Quick Disconnect', name: '16–14 AWG (1.5–2.5 mm²) fully insulated tab' },
      { code: 'Yellow Male Quick Disconnect', name: '12–10 AWG (4.0–6.0 mm²) fully insulated tab' },
      { code: 'Red Female Quick Disconnect', name: '22–16 AWG (0.5–1.5 mm²) fully insulated receptacle' },
      { code: 'Blue Female Quick Disconnect', name: '16–14 AWG (1.5–2.5 mm²) fully insulated receptacle' },
      { code: 'Yellow Female Quick Disconnect', name: '12–10 AWG (4.0–6.0 mm²) fully insulated receptacle' },
      { code: 'Red Piggyback Disconnect', name: '22–16 AWG (0.5–1.5 mm²) stacking receptacle' },
      { code: 'Blue Piggyback Disconnect', name: '16–14 AWG (1.5–2.5 mm²) stacking receptacle' },
      { code: 'Yellow Piggyback Disconnect', name: '12–10 AWG (4.0–6.0 mm²) stacking receptacle' },
      { code: 'Red Male Bullet Terminal', name: '22–16 AWG (0.5–1.5 mm²) fully insulated' },
      { code: 'Blue Male Bullet Terminal', name: '16–14 AWG (1.5–2.5 mm²) fully insulated' },
      { code: 'Yellow Male Bullet Terminal', name: '12–10 AWG (4.0–6.0 mm²) fully insulated' },
      { code: 'Red Female Bullet Terminal', name: '22–16 AWG (0.5–1.5 mm²) fully insulated receptacle' },
      { code: 'Blue Female Bullet Terminal', name: '16–14 AWG (1.5–2.5 mm²) fully insulated receptacle' },
      { code: 'Yellow Female Bullet Terminal', name: '12–10 AWG (4.0–6.0 mm²) fully insulated receptacle' },
      { code: 'Red Pin Terminal', name: '22–16 AWG (0.5–1.5 mm²) insulated pin' },
      { code: 'Blue Pin Terminal', name: '16–14 AWG (1.5–2.5 mm²) insulated pin' },
      { code: 'Yellow Pin Terminal', name: '12–10 AWG (4.0–6.0 mm²) insulated pin' },
      { code: 'Red Closed-End Connector', name: '22–16 AWG (0.5–1.5 mm²) insulated pigtail cap' },
      { code: 'Blue Closed-End Connector', name: '16–14 AWG (1.5–2.5 mm²) insulated pigtail cap' },
      { code: 'Yellow Closed-End Connector', name: '12–10 AWG (4.0–6.0 mm²) insulated pigtail cap' }
    ]
  },
  {
    id: 'molex',
    label: 'Molex Connectors',
    help: 'Common Molex wire-to-board and power connector series. Note circuit count, pitch and housing gender.',
    example: 'e.g., Molex Micro-Fit 3.0, 6-circuit plug, 20 AWG leads',
    series: [
      { code: 'Molex KK 254', name: '2.54 mm pitch friction ramp wire-to-board' },
      { code: 'Molex KK 396', name: '3.96 mm pitch wire-to-board' },
      { code: 'Molex Mini-Fit Jr.', name: '4.2 mm pitch power connector' },
      { code: 'Molex Micro-Fit 3.0', name: '3.0 mm pitch compact power connector' },
      { code: 'Molex Mega-Fit', name: '5.7 mm pitch high-current connector' },
      { code: 'Molex SL Series', name: '2.54 mm pitch crimp housing (SL)' },
      { code: 'Molex Nano-Fit', name: '2.50 mm pitch fully isolated terminals' },
      { code: 'Molex Sabre', name: '7.50 mm pitch high-power connector' }
    ]
  },
  {
    id: 'jst',
    label: 'JST Connectors',
    help: 'Popular JST wire-to-board and wire-to-wire series. Record circuit count, pitch and mating parts.',
    example: 'e.g., JST-XH 5-pin housing with matching crimp terminals',
    series: [
      { code: 'JST-PH', name: '2.0 mm wire-to-board plug (PH series)' },
      { code: 'JST-XH', name: '2.5 mm wire-to-board plug (XH series)' },
      { code: 'JST-EH', name: '2.5 mm wire-to-board plug (EH series)' },
      { code: 'JST-SH', name: '1.0 mm wire-to-board plug (SH series)' },
      { code: 'JST-GH', name: '1.25 mm wire-to-board plug (GH series)' },
      { code: 'JST-ZH', name: '1.5 mm wire-to-board plug (ZH series)' },
      { code: 'JST-VH', name: '3.96 mm wire-to-board plug (VH series)' },
      { code: 'JST-SM', name: '2.54 mm wire-to-wire plug (SM series)' },
      { code: 'JST-JWPF', name: '2.0 mm sealed connector (JWPF series)' },
      { code: 'JST-RCY', name: '2.54 mm battery connector (RCY series)' }
    ]
  },
  {
    id: 'bootlace-ferrule',
    label: 'Bootlace Ferrules (Cord End Terminals)',
    help: 'Cord end ferrules sized to DIN 46228. Specify conductor size, entry style and colour code.',
    example: 'e.g., Twin bootlace ferrule, 2 × 1.5 mm², DIN 46228-4',
    series: [
      { code: 'Bootlace Ferrule 0.5 mm²', name: 'Insulated ferrule per DIN 46228-4' },
      { code: 'Bootlace Ferrule 0.75 mm²', name: 'Insulated ferrule per DIN 46228-4' },
      { code: 'Bootlace Ferrule 1.0 mm²', name: 'Insulated ferrule per DIN 46228-4' },
      { code: 'Bootlace Ferrule 1.5 mm²', name: 'Insulated ferrule per DIN 46228-4' },
      { code: 'Bootlace Ferrule 2.5 mm²', name: 'Insulated ferrule per DIN 46228-4' },
      { code: 'Bootlace Ferrule 4.0 mm²', name: 'Insulated ferrule per DIN 46228-4' },
      { code: 'Twin Bootlace Ferrule 2 × 1.5 mm²', name: 'Twin entry insulated ferrule per DIN 46228-4' },
      { code: 'Twin Bootlace Ferrule 2 × 2.5 mm²', name: 'Twin entry insulated ferrule per DIN 46228-4' },
      { code: 'Uninsulated Bootlace Ferrule 1.0 mm²', name: 'Plain copper ferrule per DIN 46228-1' }
    ]
  }
];

export const pxPerMm = 6;

export const STANDARD_PLACEHOLDER_TEXT = 'Select standard… (type to filter, Esc clears)';
export const CONNECTOR_PLACEHOLDER_TEXT = 'Select connector series… (type to filter, Esc clears)';

export function findConnectorCategory(id) {
  return connectorCatalog.find(category => category.id === id);
}
