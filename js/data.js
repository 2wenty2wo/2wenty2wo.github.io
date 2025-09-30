export const metricThreadSizes = [
  'M1',
  'M1.2',
  'M1.4',
  'M1.6',
  'M2',
  'M2.5',
  'M3',
  'M3.5',
  'M4',
  'M5',
  'M6',
  'M7',
  'M8',
  'M10',
  'M12',
  'M14',
  'M16',
  'M18',
  'M20',
  'M22',
  'M24',
  'M30',
];

export const imperialThreadSizes = [
  '#4-40',
  '#6-32',
  '#8-32',
  '#10-24',
  '1/4-20',
  '5/16-18',
  '3/8-16',
  '7/16-14',
  '1/2-13',
];

export const fuseValues = [
  '0.032',
  '0.063',
  '0.1',
  '0.125',
  '0.16',
  '0.2',
  '0.25',
  '0.315',
  '0.4',
  '0.5',
  '0.63',
  '0.75',
  '0.8',
  '1',
  '1.25',
  '1.5',
  '1.6',
  '2',
  '2.5',
  '3',
  '3.15',
  '4',
  '5',
  '6',
  '6.3',
  '7.5',
  '8',
  '10',
  '12',
  '12.5',
  '15',
  '16',
  '20',
  '25',
  '30',
  '40',
];

export const fuseTypeOptions = [
  { id: 'Glass', label: 'Glass Fuse', image: 'images/fuses/glass_fuse.svg' },
  { id: 'Ceramic', label: 'Ceramic Fuse', image: 'images/fuses/ceramic_fuse.svg' },
  { id: 'Blade', label: 'Blade Fuse', image: 'images/fuses/blade_fuse.svg' },
];

export const electricalComponentTypes = ['Resistor', 'Capacitor', 'Diode'];

export const componentImageMap = {
  Resistor: {
    'Through-Hole': 'images/resistors/resistor_through_hole.svg',
    SMD: 'images/resistors/resistor_smd.svg',
    default: 'images/resistors/resistor_through_hole.svg',
  },
  Capacitor: {
    'Through-Hole': 'images/capacitors/capacitor_through_hole.svg',
    SMD: 'images/capacitors/capacitor_smd.svg',
    default: 'images/capacitors/capacitor_through_hole.svg',
  },
  Diode: {
    'Through-Hole': 'images/diodes/diode_through_hole.svg',
    SMD: 'images/diodes/diode_smd.svg',
    default: 'images/diodes/diode_through_hole.svg',
  },
};

export const componentMountOptions = [
  { id: 'Through-Hole', label: 'Through-Hole' },
  { id: 'SMD', label: 'SMD' },
];

const E12_BASE_VALUES = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
const RESISTOR_DECADES = [0.1, 1, 10, 100, 1000, 10000, 100000, 1000000];

function formatResistorValue(value) {
  if (value === 0) {
    return '0 Ω';
  }
  if (value < 1) {
    const rounded = Math.round(value * 100) / 100;
    return `${rounded.toString().replace(/\.0+$/, '')} Ω`;
  }
  if (value < 1000) {
    const rounded = Math.round(value * 10) / 10;
    const normalized = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
    return `${normalized.replace(/\.0+$/, '')} Ω`;
  }
  if (value < 1000000) {
    const kilo = value / 1000;
    const rounded = Math.round(kilo * 10) / 10;
    const normalized = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
    return `${normalized.replace(/\.0+$/, '')} kΩ`;
  }
  const mega = value / 1000000;
  const rounded = Math.round(mega * 10) / 10;
  const normalized = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
  return `${normalized.replace(/\.0+$/, '')} MΩ`;
}

const resistorValueSet = new Set([0]);
RESISTOR_DECADES.forEach(multiplier => {
  E12_BASE_VALUES.forEach(base => {
    const value = Math.round(base * multiplier * 100) / 100;
    resistorValueSet.add(value);
  });
});

export const resistorValueOptions = Array.from(resistorValueSet)
  .sort((a, b) => a - b)
  .map(value => {
    const label = formatResistorValue(value);
    return { id: label, label };
  });

function formatCapacitorValue(value) {
  const absolute = Math.abs(value);
  if (!Number.isFinite(absolute) || absolute <= 0) {
    return '0 F';
  }
  if (absolute >= 1) {
    const rounded = Math.round(value * 100) / 100;
    const normalized = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
    return `${normalized.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')} F`;
  }
  if (absolute >= 0.001) {
    const milli = value * 1000;
    const rounded = Math.round(milli * 100) / 100;
    const normalized = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
    return `${normalized.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')} mF`;
  }
  if (absolute >= 0.000001) {
    const micro = value * 1000000;
    const rounded = Math.round(micro * 100) / 100;
    const normalized = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
    return `${normalized.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')} µF`;
  }
  if (absolute >= 0.000000001) {
    const nano = value * 1000000000;
    const rounded = Math.round(nano * 100) / 100;
    const normalized = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
    return `${normalized.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')} nF`;
  }
  const pico = value * 1000000000000;
  const rounded = Math.round(pico * 100) / 100;
  const normalized = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
  return `${normalized.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')} pF`;
}

const capacitorValueSet = new Set();
const CAPACITOR_BASE_VALUES = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
const CAPACITOR_DECADES = [
  1e-12,
  1e-11,
  1e-10,
  1e-9,
  1e-8,
  1e-7,
  1e-6,
  1e-5,
  1e-4,
  1e-3,
];

CAPACITOR_DECADES.forEach(multiplier => {
  CAPACITOR_BASE_VALUES.forEach(base => {
    const value = Math.round(base * multiplier * 1000000000000) / 1000000000000;
    capacitorValueSet.add(value);
  });
});

export const capacitorValueOptions = Array.from(capacitorValueSet)
  .sort((a, b) => a - b)
  .map(value => {
    const label = formatCapacitorValue(value);
    return { id: label, label };
  });

export const diodeValueOptions = [
  { id: '1N4148', label: '1N4148 Signal Diode' },
  { id: '1N914', label: '1N914 Signal Diode' },
  { id: '1N4001', label: '1N4001 Rectifier Diode' },
  { id: '1N4002', label: '1N4002 Rectifier Diode' },
  { id: '1N4004', label: '1N4004 Rectifier Diode' },
  { id: '1N4007', label: '1N4007 Rectifier Diode' },
  { id: '1N5817', label: '1N5817 Schottky Diode' },
  { id: '1N5819', label: '1N5819 Schottky Diode' },
  { id: 'SS14', label: 'SS14 Schottky Diode' },
  { id: 'UF4007', label: 'UF4007 Ultrafast Rectifier' },
  { id: 'BAV99', label: 'BAV99 Dual Switching Diode' },
  { id: 'BAT54', label: 'BAT54 Schottky Diode' },
  { id: 'BZX55C5V1', label: 'BZX55C5V1 Zener Diode' },
  { id: 'BZX55C12', label: 'BZX55C12 Zener Diode' },
  { id: 'MMBZ5V6', label: 'MMBZ5V6 Zener Diode' },
];

export const diodeValueLabelMap = diodeValueOptions.reduce((map, option) => {
  map[option.id] = option.label;
  return map;
}, {});

export const boltHeadOptions = [
  { id: 'button_head', label: 'Button Head', image: 'button_head' },
  { id: 'cap_head', label: 'Socket Cap', image: 'cap_head' },
  { id: 'capstan_head', label: 'Capstan Head', image: 'capstan_head' },
  { id: 'captive_shaft', label: 'Captive Shaft', image: 'captive_shaft' },
  { id: 'carriage_head', label: 'Carriage Bolt', image: 'carriage_head' },
  { id: 'cheese_head', label: 'Cheese Head', image: 'cheese_head' },
  { id: 'countersunk_head', label: 'Countersunk', image: 'countersunk_head' },
  { id: 'eye_hook_head', label: 'Eye Bolt', image: 'eye_hook_head' },
  { id: 'fillister_head', label: 'Fillister Head', image: 'fillister_head' },
  { id: 'flanged_head', label: 'Flanged Hex', image: 'flanged_head' },
  { id: 'grub_headless', label: 'Set Screw', image: 'grub_headless' },
  { id: 'hand_grip_head', label: 'Hand Grip', image: 'hand_grip_head' },
  { id: 'hexagon_head', label: 'Hex Bolt', image: 'hexagon_head' },
  { id: 'mushroom_truss_head', label: 'Mushroom Truss', image: 'mushroom_truss_head' },
  { id: 'pan_head', label: 'Pan Head', image: 'pan_head' },
  { id: 'raised_countersunk_head', label: 'Raised Countersunk', image: 'raised_countersunk_head' },
  { id: 'security_head', label: 'Security Button', image: 'security_head' },
  { id: 'shoulder_head', label: 'Shoulder Bolt', image: 'shoulder_head' },
];

export const boltDriveOptions = [
  { id: 'flat', label: 'Slotted', image: 'flat' },
  { id: 'hex', label: 'Hex', image: 'hex' },
  { id: 'hex_bolt', label: 'Hex Bolt', image: 'hex_bolt' },
  { id: 'philips', label: 'Phillips', image: 'philips' },
  { id: 'security_hex', label: 'Security Hex', image: 'security_hex' },
  { id: 'security_torx', label: 'Security Torx', image: 'security_torx' },
  { id: 'square', label: 'Square', image: 'square' },
  { id: 'torx', label: 'Torx', image: 'torx' },
];

export const screwTypeOptions = [
  { id: 'countersunk_wood_screw', label: 'Countersunk Wood Screw', image: 'countersunk_wood_screw' },
  { id: 'pan_head_wood_screw', label: 'Pan Head Wood Screw', image: 'pan_head_wood_screw' },
  { id: 'self_drilling_hex_screw', label: 'Self-drilling Hex Screw', image: 'self_drilling_hex_screw' },
];

export const boltHeadMap = new Map(boltHeadOptions.map(option => [option.id, option]));
export const boltDriveMap = new Map(boltDriveOptions.map(option => [option.id, option]));
export const screwTypeMap = new Map(screwTypeOptions.map(option => [option.id, option]));

export const nutTypeOptions = [
  { id: 'hex', label: 'Hex Nut', image: 'hex_nut' },
  { id: 'square', label: 'Square Nut', image: 'square_nut' },
];

export const nutTypeMap = new Map(nutTypeOptions.map(option => [option.id, option]));

export const bearingOptions = [
  { code: '608ZZ', description: '8 × 22 × 7 mm, metal shields' },
  { code: '608-2RS', description: '8 × 22 × 7 mm, rubber seals' },
  { code: '625ZZ', description: '5 × 16 × 5 mm, miniature shielded' },
  { code: '6200ZZ', description: '10 × 30 × 9 mm, deep groove' },
  { code: '6900ZZ', description: '10 × 22 × 6 mm, thin section' },
  { code: '6701ZZ', description: '12 × 18 × 4 mm, thin section' },
  { code: 'MR85-2RS', description: '5 × 8 × 2.5 mm, rubber seals' },
];

export const hardwareCatalog = {
  Bolt: [],
  Screw: [
    { code: 'DIN 571', name: 'Coach Screw (Wood Screw)' },
    { code: 'DIN 7995', name: 'Cross Recessed Pan Head Wood Screw' },
    { code: 'DIN 7996', name: 'Cross Recessed Countersunk Head Wood Screw' },
    { code: 'DIN 7997', name: 'Cross Recessed Raised Countersunk Head Wood Screw' },
    { code: 'DIN 95', name: 'Round Head Wood Screw' },
    { code: 'DIN 96', name: 'Raised Countersunk Head Wood Screw' },
    { code: 'DIN 97', name: 'Countersunk Head Wood Screw' },
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
    { code: 'ISO 7040', name: 'Prevailing Torque Type Hexagon Nut' },
  ],
  Washer: [
    { code: 'Plain Washer', name: 'General Purpose Flat Washer' },
    { code: 'Spring Washer', name: 'Split Lock Washer' },
  ],
  'Threaded Heat Insert': [],
  Bearing: [],
  Resistor: [],
  Capacitor: [],
  Diode: [
    { code: 'General Purpose', name: 'Rectifier Diode' },
    { code: 'Signal', name: 'Small Signal Diode' },
  ],
  Fuse: [
    { code: 'IEC 60127-2', name: 'Time-Lag Cartridge Fuse' },
    { code: 'IEC 60127-3', name: 'Fast-Acting Cartridge Fuse' },
    { code: 'UL 248-14', name: 'Supplementary Fuse' },
  ],
};

export const hardwareImageFolders = {
  Bolt: 'bolts',
  Screw: 'screws',
  Nut: 'nuts',
  Washer: 'washers',
  'Threaded Heat Insert': 'threaded_heat_insert',
};

export const hardwareImageExtensions = {
  Washer: 'svg',
};

export const hardwareTypeImageMap = {
  Bolt: 'images/bolts/head/countersunk_head.svg',
  Screw: 'images/screws/countersunk_wood_screw.svg',
  'Threaded Heat Insert': 'images/threaded_heat_insert/heat_insert.svg',
  Nut: 'images/nuts/hex_nut.svg',
  Fuse: 'images/fuses/glass_fuse.svg',
  Connector: 'images/connectors/connector.svg',
  Resistor: 'images/resistors/resistor_through_hole.svg',
  Capacitor: 'images/capacitors/capacitor_through_hole.svg',
  Washer: 'images/washers/plain_washer.svg',
  Diode: 'images/diodes/diode_through_hole.svg',
};

export const connectorCatalog = [
  {
    id: 'pre-insulated-crimp',
    label: 'Pre-insulated Crimp Terminals',
    help: 'Colour-coded PVC or nylon insulated crimp lugs for 22–10 AWG conductors.',
    example: 'e.g., Blue ring terminal, 16–14 AWG, M4 stud',
    series: [
      { code: 'Red Ring Terminal', name: '22–16 AWG (0.5–1.5 mm²) Ring' },
      { code: 'Blue Ring Terminal', name: '16–14 AWG (1.5–2.5 mm²) Ring' },
      { code: 'Yellow Ring Terminal', name: '12–10 AWG (4.0–6.0 mm²) Ring' },
      { code: 'Red Fork Terminal', name: '22–16 AWG (0.5–1.5 mm²) Spade' },
      { code: 'Blue Fork Terminal', name: '16–14 AWG (1.5–2.5 mm²) Spade' },
      { code: 'Yellow Fork Terminal', name: '12–10 AWG (4.0–6.0 mm²) Spade' },
      { code: 'Red Locking Fork Terminal', name: '22–16 AWG (0.5–1.5 mm²) Locking Tongue Spade' },
      { code: 'Blue Locking Fork Terminal', name: '16–14 AWG (1.5–2.5 mm²) Locking Tongue Spade' },
      {
        code: 'Yellow Locking Fork Terminal',
        name: '12–10 AWG (4.0–6.0 mm²) Locking Tongue Spade',
      },
      { code: 'Red Butt Splice', name: '22–16 AWG (0.5–1.5 mm²) Straight Splice' },
      { code: 'Blue Butt Splice', name: '16–14 AWG (1.5–2.5 mm²) Straight Splice' },
      { code: 'Yellow Butt Splice', name: '12–10 AWG (4.0–6.0 mm²) Straight Splice' },
      { code: 'Red Step-Down Butt Splice', name: '22–18 AWG to 16–14 AWG Reducer' },
      { code: 'Blue Step-Down Butt Splice', name: '16–14 AWG to 12–10 AWG Reducer' },
      { code: 'Red Parallel Splice', name: '22–16 AWG (0.5–1.5 mm²) Parallel Splice' },
      { code: 'Blue Parallel Splice', name: '16–14 AWG (1.5–2.5 mm²) Parallel Splice' },
      { code: 'Yellow Parallel Splice', name: '12–10 AWG (4.0–6.0 mm²) Parallel Splice' },
      { code: 'Red Male Quick Disconnect', name: '22–16 AWG (0.5–1.5 mm²) Tab' },
      { code: 'Blue Male Quick Disconnect', name: '16–14 AWG (1.5–2.5 mm²) Tab' },
      { code: 'Yellow Male Quick Disconnect', name: '12–10 AWG (4.0–6.0 mm²) Tab' },
      { code: 'Red Female Quick Disconnect', name: '22–16 AWG (0.5–1.5 mm²) Receptacle' },
      { code: 'Blue Female Quick Disconnect', name: '16–14 AWG (1.5–2.5 mm²) Receptacle' },
      { code: 'Yellow Female Quick Disconnect', name: '12–10 AWG (4.0–6.0 mm²) Receptacle' },
      { code: 'Red Piggyback Disconnect', name: '22–16 AWG (0.5–1.5 mm²) Stacking Receptacle' },
      { code: 'Blue Piggyback Disconnect', name: '16–14 AWG (1.5–2.5 mm²) Stacking Receptacle' },
      { code: 'Yellow Piggyback Disconnect', name: '12–10 AWG (4.0–6.0 mm²) Stacking Receptacle' },
      { code: 'Red Male Bullet Terminal', name: '22–16 AWG (0.5–1.5 mm²) Bullet Terminal' },
      { code: 'Blue Male Bullet Terminal', name: '16–14 AWG (1.5–2.5 mm²) Bullet Terminal' },
      { code: 'Yellow Male Bullet Terminal', name: '12–10 AWG (4.0–6.0 mm²) Bullet Terminal' },
      { code: 'Red Female Bullet Terminal', name: '22–16 AWG (0.5–1.5 mm²) Bullet Receptacle' },
      { code: 'Blue Female Bullet Terminal', name: '16–14 AWG (1.5–2.5 mm²) Bullet Receptacle' },
      { code: 'Yellow Female Bullet Terminal', name: '12–10 AWG (4.0–6.0 mm²) Bullet Receptacle' },
      { code: 'Red Pin Terminal', name: '22–16 AWG (0.5–1.5 mm²) Pin' },
      { code: 'Blue Pin Terminal', name: '16–14 AWG (1.5–2.5 mm²) Pin' },
      { code: 'Yellow Pin Terminal', name: '12–10 AWG (4.0–6.0 mm²) Pin' },
      { code: 'Red Closed-End Connector', name: '22–16 AWG (0.5–1.5 mm²) Pigtail Cap' },
      { code: 'Blue Closed-End Connector', name: '16–14 AWG (1.5–2.5 mm²) Pigtail Cap' },
      { code: 'Yellow Closed-End Connector', name: '12–10 AWG (4.0–6.0 mm²) Pigtail Cap' },
    ],
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
      { code: 'Molex Sabre', name: '7.50 mm pitch high-power connector' },
    ],
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
      { code: 'JST-RCY', name: '2.54 mm battery connector (RCY series)' },
    ],
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
      {
        code: 'Twin Bootlace Ferrule 2 × 1.5 mm²',
        name: 'Twin entry insulated ferrule per DIN 46228-4',
      },
      {
        code: 'Twin Bootlace Ferrule 2 × 2.5 mm²',
        name: 'Twin entry insulated ferrule per DIN 46228-4',
      },
      {
        code: 'Uninsulated Bootlace Ferrule 1.0 mm²',
        name: 'Plain copper ferrule per DIN 46228-1',
      },
    ],
  },
];

// Match the 300 DPI artwork emitted by gridfinitylabels.com.
export const pxPerMm = 300 / 25.4;

export const STANDARD_PLACEHOLDER_TEXT = '\u00a0';
export const CONNECTOR_PLACEHOLDER_TEXT = '\u00a0';
// Non-breaking space placeholders maintain control sizing while hiding helper text.

export function findConnectorCategory(id) {
  return connectorCatalog.find(category => category.id === id);
}
