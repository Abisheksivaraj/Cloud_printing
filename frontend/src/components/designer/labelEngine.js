/**
 * labelEngine.js — Offline AI Label Generator
 * Generates professional label layouts from natural language prompts.
 * No API key or internet connection required.
 */

const MM = 3.7795275591; // mm → pixels
const mm = (v) => Math.round(v * MM);

// ─── NLP: Detect label type ───────────────────────────────────────────────────
const LABEL_KEYWORDS = {
    shipper: ['ship', 'shipper', 'shipping', 'fedex', 'ups', 'dhl', 'usps', 'courier', 'delivery', 'dispatch', 'parcel', 'package', 'freight', 'logistics', 'express'],
    product: ['product', 'item', 'goods', 'retail', 'merchandise', 'sku', 'part', 'component', 'catalog'],
    pharma: ['pharma', 'pharmaceutical', 'medicine', 'drug', 'medication', 'rx', 'tablet', 'capsule', 'dose', 'dosage', 'prescription', 'amoxicillin', 'paracetamol', 'injection'],
    price: ['price', 'price tag', 'price-tag', 'cost', 'sale', 'shop', 'store', 'tag', 'rate'],
    warehouse: ['warehouse', 'storage', 'rack', 'bin', 'location', 'zone', 'shelf', 'bay', 'aisle', 'pallet'],
    address: ['address', 'mailing', 'mail', 'envelope', 'postal', 'letter'],
    asset: ['asset', 'equipment', 'property tag', 'serial', 'fixed asset', 'inventory tag'],
    food: ['food', 'nutrition', 'nutritional', 'ingredient', 'allergen', 'organic', 'snack', 'beverage', 'drink'],
    barcode: ['barcode only', 'just barcode', 'barcode label'],
};

function detectLabelType(prompt) {
    const lp = prompt.toLowerCase();
    for (const [type, kws] of Object.entries(LABEL_KEYWORDS)) {
        if (kws.some(k => lp.includes(k))) return type;
    }
    return 'custom';
}

// ─── NLP: Extract dimensions ──────────────────────────────────────────────────
function extractSize(prompt, defaults) {
    // Matches: 100x150, 100 x 150, 100×150, 4x6, etc.
    const m = prompt.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:mm)?/i);
    if (m) {
        const w = parseFloat(m[1]);
        const h = parseFloat(m[2]);
        // If looks like inches (small numbers), convert
        if (w <= 12 && h <= 12) return { width: Math.round(w * 25.4), height: Math.round(h * 25.4) };
        return { width: w, height: h };
    }
    return defaults;
}

// ─── NLP: Extract company/product name ───────────────────────────────────────
function extractName(prompt, fallback) {
    // "for [Name]", "company [Name]", "brand [Name]", "called [Name]", "named [Name]"
    const m = prompt.match(/(?:for|company|brand|called|named|of|from)\s+([A-Z][A-Za-z0-9\s&.'-]{1,30})/i);
    if (m) return m[1].trim().toUpperCase();
    return fallback;
}

// ─── NLP: Detect special elements ────────────────────────────────────────────
function detectOptions(prompt) {
    const lp = prompt.toLowerCase();
    return {
        hasQR: lp.includes('qr') || lp.includes('qr code'),
        hasBarcode: !lp.includes('no barcode') && !lp.includes('without barcode'),
        hasLogo: lp.includes('logo') || lp.includes('icon'),
        isAligned: lp.includes('center') || lp.includes('centred') || lp.includes('centered'),
        hasSeparator: lp.includes('line') || lp.includes('separator') || lp.includes('divider'),
        carrier: lp.includes('fedex') ? 'FedEx' : lp.includes('ups') ? 'UPS' : lp.includes('dhl') ? 'DHL' : lp.includes('usps') ? 'USPS' : 'ATPL Express',
        service: lp.includes('overnight') ? 'PRIORITY OVERNIGHT' : lp.includes('2 day') || lp.includes('2-day') ? '2ND DAY AIR' : lp.includes('ground') ? 'GROUND' : 'STANDARD',
        drugName: (() => { const m = prompt.match(/(?:for|drug|medicine|medication)\s+([A-Za-z]+(?:\s+\d+\s*mg)?)/i); return m ? m[1].trim() : 'AMOXICILLIN 500MG'; })(),
        dosage: (() => { const m = prompt.match(/(\d+\s*mg|\d+\s*ml|\d+\s*mcg)/i); return m ? m[1].toUpperCase() : '500MG'; })(),
        zone: (() => { const m = prompt.match(/(?:zone|section|area)\s*([A-Z0-9]+)/i); return m ? m[1].toUpperCase() : 'A'; })(),
        location: (() => { const m = prompt.match(/(?:row|rack|bay|bin|shelf|aisle)\s*([A-Z0-9-]+)/i); return m ? m[1].toUpperCase() : '12'; })(),
    };
}

// ─── ID generator ─────────────────────────────────────────────────────────────
let _idN = 0;
const eid = () => `le_${Date.now()}_${++_idN}`;

// ─── Color themes per carrier ────────────────────────────────────────────────
const CARRIER_COLORS = {
    FedEx: { header: '#4d148c', accent: '#ff6200' },
    UPS: { header: '#351c15', accent: '#ffb500' },
    DHL: { header: '#d40511', accent: '#ffcc00' },
    USPS: { header: '#004b87', accent: '#ed1c24' },
    'ATPL Express': { header: '#1a2e54', accent: '#e8712a' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LABEL TEMPLATE GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. SHIPPER LABEL ─────────────────────────────────────────────────────────
function shipperLabel(W, H, opts, companyName) {
    const c = CARRIER_COLORS[opts.carrier] || CARRIER_COLORS['ATPL Express'];
    const els = [];
    let uid = 0;

    // Header bar
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(12), backgroundColor: c.header, borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    // Carrier name
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(2.5), width: mm(55), height: mm(7), content: opts.carrier.toUpperCase(), fontSize: 16, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    // Service badge
    els.push({ id: eid(), type: 'rectangle', x: W - mm(42), y: mm(1.5), width: mm(40), height: mm(9), backgroundColor: c.accent, borderWidth: 0, borderColor: 'transparent', borderRadius: 3, zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: W - mm(42), y: mm(3), width: mm(40), height: mm(6), content: opts.service, fontSize: 7, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // FROM section label
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(14), width: mm(20), height: mm(4), content: 'SHIP FROM:', fontSize: 7, fontWeight: 'bold', fontFamily: 'Arial', color: '#666666', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    // FROM address
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(19), width: mm(47), height: mm(22), content: `${companyName}\n12 Industrial Estate, Phase II\nChennai - 600032\nTamil Nadu, INDIA`, fontSize: 8, fontFamily: 'Arial', fontWeight: 'normal', color: '#222222', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Vertical divider
    els.push({ id: eid(), type: 'rectangle', x: mm(52), y: mm(13), width: 1, height: mm(36), backgroundColor: '#cccccc', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // TO section label
    els.push({ id: eid(), type: 'text', x: mm(55), y: mm(14), width: mm(20), height: mm(4), content: 'SHIP TO:', fontSize: 7, fontWeight: 'bold', fontFamily: 'Arial', color: '#333333', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    // TO address (large, prominent)
    els.push({ id: eid(), type: 'text', x: mm(55), y: mm(19), width: mm(43), height: mm(30), content: `JOHN SMITH\n45 Buyer's Colony\nBengaluru - 560001\nKarnataka, INDIA\n📞 +91 98765 43210`, fontSize: 11, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Separator line
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(51), width: W, height: 2, backgroundColor: '#333333', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Route/sort info bar
    els.push({ id: eid(), type: 'rectangle', x: 0, y: mm(53), width: W, height: mm(8), backgroundColor: '#f5f5f5', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(55), width: mm(30), height: mm(5), content: `ROUTE: BLR-${Math.floor(Math.random() * 900 + 100)}`, fontSize: 9, fontWeight: 'bold', fontFamily: 'Courier New', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(65), y: mm(55), width: mm(33), height: mm(5), content: `WT: 2.5 KG`, fontSize: 9, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'right', zIndex: uid++ });

    // Main barcode
    els.push({ id: eid(), type: 'barcode', x: mm(5), y: mm(63), width: W - mm(10), height: mm(35), content: `ATL${Date.now().toString().slice(-10)}`, barcodeType: 'CODE128', zIndex: uid++, backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', showBarcodeText: true });

    // Tracking number text
    const trackNum = `ATL-${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
    els.push({ id: eid(), type: 'text', x: mm(10), y: mm(100), width: W - mm(20), height: mm(5), content: `TRACKING: ${trackNum}`, fontSize: 9, fontFamily: 'Courier New', fontWeight: 'bold', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Bottom border
    els.push({ id: eid(), type: 'rectangle', x: 0, y: H - mm(12), width: W, height: mm(12), backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#dddddd', borderStyle: 'solid', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(3), y: H - mm(10), width: W - mm(6), height: mm(7), content: `Ref: ORD-${Math.floor(Math.random() * 90000 + 10000)}  |  ${new Date().toLocaleDateString()}  |  1 of 1 PKG`, fontSize: 7, fontFamily: 'Arial', fontWeight: 'normal', color: '#888888', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Optional QR
    if (opts.hasQR) {
        els.push({ id: eid(), type: 'barcode', x: W - mm(22), y: mm(63), width: mm(20), height: mm(20), content: `https://track.atpl.in/${trackNum}`, barcodeType: 'QR', zIndex: uid++, backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent' });
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Shipper Label', description: `${opts.carrier} ${opts.service} shipping label with FROM/TO addresses, barcode, and tracking number.`, elements: els };
}

// ── 2. PRODUCT LABEL ─────────────────────────────────────────────────────────
function productLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;

    // Header
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(10), backgroundColor: '#1a2e54', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1.5), width: W - mm(4), height: mm(7), content: name, fontSize: 13, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Logo placeholder rectangle
    els.push({ id: eid(), type: 'rectangle', x: mm(2), y: mm(12), width: mm(22), height: mm(20), backgroundColor: '#e8f4fd', borderWidth: 1, borderColor: '#2196F3', borderStyle: 'dashed', borderRadius: 4, zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(12), width: mm(22), height: mm(20), content: 'LOGO', fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold', color: '#2196F3', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Product details
    els.push({ id: eid(), type: 'text', x: mm(26), y: mm(12), width: W - mm(28), height: mm(7), content: 'Premium Quality Product', fontSize: 9, fontWeight: 'bold', fontFamily: 'Arial', color: '#1a2e54', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(26), y: mm(20), width: W - mm(28), height: mm(12), content: `SKU: PRD-${Math.floor(Math.random() * 9000 + 1000)}\nBatch: B${Math.floor(Math.random() * 900 + 100)}\nMfg: ${new Date().toLocaleDateString()}`, fontSize: 7, fontFamily: 'Arial', fontWeight: 'normal', color: '#555555', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Divider
    els.push({ id: eid(), type: 'rectangle', x: mm(2), y: mm(34), width: W - mm(4), height: 1, backgroundColor: '#dddddd', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Barcode
    if (opts.hasBarcode) {
        const bcW = opts.hasQR ? W - mm(30) : W - mm(8);
        els.push({ id: eid(), type: 'barcode', x: mm(4), y: mm(36), width: bcW, height: mm(16), content: `PRD${Math.floor(Math.random() * 900000000 + 100000000)}`, barcodeType: 'CODE128', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
        if (opts.hasQR) {
            els.push({ id: eid(), type: 'barcode', x: W - mm(24), y: mm(35), width: mm(22), height: mm(18), content: `https://atpl.in/product/${Math.floor(Math.random() * 9000 + 1000)}`, barcodeType: 'QR', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
        }
    }

    // Footer
    els.push({ id: eid(), type: 'rectangle', x: 0, y: H - mm(7), width: W, height: mm(7), backgroundColor: '#f0f0f0', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: H - mm(6), width: W - mm(4), height: mm(5), content: `Made in India  |  ISO 9001:2015 Certified`, fontSize: 6, fontFamily: 'Arial', fontWeight: 'normal', color: '#888888', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Product Label', description: `Product label for ${name} with logo area, product details, and barcode.`, elements: els };
}

// ── 3. PHARMACEUTICAL LABEL ───────────────────────────────────────────────────
function pharmaLabel(W, H, opts, companyName) {
    const els = [];
    let uid = 0;

    // Outer border
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: H, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#cc0000', borderStyle: 'solid', zIndex: uid++ });
    // Header
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(9), backgroundColor: '#003080', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1), width: W - mm(4), height: mm(7), content: companyName, fontSize: 11, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Drug name
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(11), width: W - mm(6), height: mm(8), content: opts.drugName.toUpperCase(), fontSize: 14, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Dosage & form
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(20), width: W - mm(6), height: mm(5), content: `Dosage: ${opts.dosage}  ·  Oral Tablet  ·  10 Tablets/Strip`, fontSize: 7, fontFamily: 'Arial', fontWeight: 'normal', color: '#333333', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Divider
    els.push({ id: eid(), type: 'rectangle', x: mm(3), y: mm(26), width: W - mm(6), height: 1, backgroundColor: '#999999', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Lot & Expiry
    const expDate = new Date(); expDate.setFullYear(expDate.getFullYear() + 2);
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(28), width: W - mm(6), height: mm(5), content: `Lot: L${Math.floor(Math.random() * 900000 + 100000)}   Mfg: ${new Date().toLocaleDateString('en-GB')}   Exp: ${expDate.toLocaleDateString('en-GB')}`, fontSize: 7, fontFamily: 'Courier New', fontWeight: 'normal', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Warning box
    els.push({ id: eid(), type: 'rectangle', x: mm(3), y: mm(35), width: W - mm(6), height: mm(8), backgroundColor: '#fff3f3', borderWidth: 1, borderColor: '#cc0000', borderStyle: 'solid', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(4), y: mm(36.5), width: W - mm(8), height: mm(5), content: '⚠ KEEP OUT OF REACH OF CHILDREN  ·  RX ONLY  ·  STORE BELOW 25°C', fontSize: 6, fontWeight: 'bold', fontFamily: 'Arial', color: '#cc0000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Barcode
    if (opts.hasBarcode) {
        const bcH = H - mm(55);
        if (bcH > mm(10)) {
            els.push({ id: eid(), type: 'barcode', x: mm(5), y: mm(45), width: W - mm(10), height: mm(12), content: `RX${Math.floor(Math.random() * 90000000 + 10000000)}`, barcodeType: 'CODE128', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
        }
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Pharmaceutical Label', description: `Rx pharmaceutical label for ${opts.drugName} with dosage, lot number, expiry, warning, and barcode.`, elements: els };
}

// ── 4. PRICE TAG ──────────────────────────────────────────────────────────────
function priceTag(W, H, opts, name) {
    const els = [];
    let uid = 0;

    // Background
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: H, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000000', borderStyle: 'solid', borderRadius: 4, zIndex: uid++ });
    // Top color stripe
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(7), backgroundColor: '#e53935', borderWidth: 0, borderColor: 'transparent', borderRadius: 4, zIndex: uid++ });
    // Brand/store name
    els.push({ id: eid(), type: 'text', x: mm(1), y: mm(0.5), width: W - mm(2), height: mm(6), content: name, fontSize: 9, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Product name
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(9), width: W - mm(4), height: mm(6), content: 'Premium Product Item', fontSize: 8, fontFamily: 'Arial', fontWeight: 'normal', color: '#333333', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Price (large)
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(16), width: W - mm(4), height: mm(10), content: '₹ 499.00', fontSize: 20, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // MRP line
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(27), width: W - mm(4), height: mm(4), content: 'MRP (INCL. OF ALL TAXES)', fontSize: 6, fontFamily: 'Arial', fontWeight: 'normal', color: '#999999', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Divider
    els.push({ id: eid(), type: 'rectangle', x: mm(2), y: mm(32), width: W - mm(4), height: 1, backgroundColor: '#eeeeee', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Barcode
    if (opts.hasBarcode) {
        els.push({ id: eid(), type: 'barcode', x: mm(3), y: H - mm(18), width: W - mm(6), height: mm(12), content: `${Math.floor(Math.random() * 900000000000 + 100000000000)}`, barcodeType: 'EAN13', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Price Tag', description: `Retail price tag for ${name} with product name, price, and barcode.`, elements: els };
}

// ── 5. WAREHOUSE LABEL ────────────────────────────────────────────────────────
function warehouseLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;

    // Header
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(9), backgroundColor: '#f59e0b', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1), width: W - mm(4), height: mm(7), content: `${name} — WAREHOUSE LOCATION`, fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Zone — huge letter
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(11), width: mm(22), height: H - mm(23), content: opts.zone, fontSize: 64, fontWeight: 'bold', fontFamily: 'Arial', color: '#1a2e54', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(3), y: H - mm(11), width: mm(22), height: mm(6), content: 'ZONE', fontSize: 7, fontWeight: 'bold', fontFamily: 'Arial', color: '#666666', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Vertical divider
    els.push({ id: eid(), type: 'rectangle', x: mm(27), y: mm(11), width: 1.5, height: H - mm(15), backgroundColor: '#cccccc', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Location data
    const row = String.fromCharCode(65 + Math.floor(Math.random() * 8));
    const bay = Math.floor(Math.random() * 20 + 1);
    const level = Math.floor(Math.random() * 5 + 1);
    els.push({ id: eid(), type: 'text', x: mm(30), y: mm(12), width: W - mm(33), height: mm(8), content: `ROW  ${row}  —  BAY  ${bay}`, fontSize: 14, fontWeight: 'bold', fontFamily: 'Arial', color: '#1a2e54', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(30), y: mm(22), width: W - mm(33), height: mm(6), content: `LEVEL: ${level}  ·  MAX 500 KG`, fontSize: 10, fontFamily: 'Arial', fontWeight: 'normal', color: '#444444', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Barcode
    if (opts.hasBarcode) {
        els.push({ id: eid(), type: 'barcode', x: mm(30), y: H - mm(25), width: W - mm(34), height: mm(18), content: `WH-${opts.zone}-${row}${bay}-L${level}`, barcodeType: 'CODE39', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    }
    if (opts.hasQR) {
        els.push({ id: eid(), type: 'barcode', x: mm(30), y: H - mm(25), width: mm(18), height: mm(18), content: `WH-${opts.zone}-${row}${bay}-L${level}`, barcodeType: 'QR', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Warehouse Location Label', description: `Warehouse bin location label: Zone ${opts.zone}, Row ${row}, Bay ${bay}, Level ${level}.`, elements: els };
}

// ── 6. ADDRESS LABEL ──────────────────────────────────────────────────────────
function addressLabel(W, H, opts, name) {
    const els = [];
    let uid = 0;

    // Outer border
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: H, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cccccc', borderStyle: 'solid', zIndex: uid++ });

    // Return address (top-left, small)
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(3), width: mm(45), height: mm(16), content: `FROM:\n${name}\n12 Sender Street\nChennai - 600001`, fontSize: 7, fontFamily: 'Arial', fontWeight: 'normal', color: '#555555', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Divider
    els.push({ id: eid(), type: 'rectangle', x: mm(3), y: mm(21), width: W - mm(6), height: 1, backgroundColor: '#cccccc', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // TO label
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(23), width: mm(10), height: mm(5), content: 'TO:', fontSize: 9, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    // TO address (big)
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(29), width: W - mm(6), height: mm(18), content: `MR. JOHN DOE\n45 Recipient Nagar, Sector 7\nBengaluru - 560001\nKARNATAKA`, fontSize: 12, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    if (opts.hasBarcode) {
        els.push({ id: eid(), type: 'barcode', x: mm(3), y: H - mm(16), width: W - mm(6), height: mm(14), content: `POST${Math.floor(Math.random() * 900000000 + 100000000)}`, barcodeType: 'CODE128', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Address Label', description: `Mailing address label with return address and large TO address block.`, elements: els };
}

// ── 7. ASSET TAG ──────────────────────────────────────────────────────────────
function assetTag(W, H, opts, name) {
    const els = [];
    let uid = 0;
    const assetNum = `AT-${Math.floor(Math.random() * 90000 + 10000)}`;

    // Header
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(9), backgroundColor: '#263238', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(2), y: mm(1), width: W - mm(4), height: mm(7), content: `${name} — ASSET MANAGEMENT`, fontSize: 9, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Asset ID
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(12), width: W - mm(6), height: mm(8), content: assetNum, fontSize: 20, fontWeight: 'bold', fontFamily: 'Courier New', color: '#000000', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });

    // Details
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(22), width: W - mm(6), height: mm(14), content: `Department: Operations\nLocation: Head Office\nSerial: SN-${Math.floor(Math.random() * 900000 + 100000)}\nDate: ${new Date().toLocaleDateString()}`, fontSize: 7, fontFamily: 'Arial', fontWeight: 'normal', color: '#444444', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });

    // Divider
    els.push({ id: eid(), type: 'rectangle', x: mm(3), y: mm(38), width: W - mm(6), height: 1, backgroundColor: '#cccccc', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });

    // Barcode
    const bcH = opts.hasQR ? mm(15) : H - mm(48);
    els.push({ id: eid(), type: 'barcode', x: mm(3), y: mm(40), width: opts.hasQR ? W - mm(30) : W - mm(6), height: bcH, content: assetNum, barcodeType: 'CODE39', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    if (opts.hasQR) {
        els.push({ id: eid(), type: 'barcode', x: W - mm(24), y: mm(40), width: mm(21), height: mm(21), content: assetNum, barcodeType: 'QR', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Asset Tag', description: `Fixed asset management tag: ${assetNum} with serial number and barcode.`, elements: els };
}

// ── 8. CUSTOM LABEL ───────────────────────────────────────────────────────────
function customLabel(W, H, opts, name, prompt) {
    const els = [];
    let uid = 0;
    const lp = prompt.toLowerCase();

    // Try to build something sensible from the prompt
    let currentY = mm(5);
    const pad = mm(4);

    // Header if name found
    els.push({ id: eid(), type: 'rectangle', x: 0, y: 0, width: W, height: mm(10), backgroundColor: '#1a2e54', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
    els.push({ id: eid(), type: 'text', x: mm(3), y: mm(1.5), width: W - mm(6), height: mm(7), content: name, fontSize: 12, fontWeight: 'bold', fontFamily: 'Arial', color: '#ffffff', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'center', zIndex: uid++ });
    currentY = mm(14);

    // Text body
    els.push({ id: eid(), type: 'text', x: mm(3), y: currentY, width: W - mm(6), height: mm(10), content: 'Description / Details', fontSize: 10, fontFamily: 'Arial', fontWeight: 'normal', color: '#333333', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', textAlign: 'left', zIndex: uid++ });
    currentY += mm(14);

    // Separator
    if (opts.hasSeparator || true) {
        els.push({ id: eid(), type: 'rectangle', x: mm(3), y: currentY, width: W - mm(6), height: 1, backgroundColor: '#dddddd', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
        currentY += mm(3);
    }

    // Barcode
    if (opts.hasBarcode) {
        const bcW = opts.hasQR ? W - mm(28) : W - mm(8);
        const bcH = Math.min(mm(20), H - currentY - mm(8));
        if (bcH > mm(10)) {
            els.push({ id: eid(), type: 'barcode', x: mm(4), y: currentY, width: bcW, height: bcH, content: `LBL-${Math.floor(Math.random() * 900000 + 100000)}`, barcodeType: 'CODE128', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
            if (opts.hasQR) {
                els.push({ id: eid(), type: 'barcode', x: W - mm(22), y: currentY, width: mm(20), height: mm(20), content: `LBL-${Math.floor(Math.random() * 900000 + 100000)}`, barcodeType: 'QR', backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', zIndex: uid++ });
            }
        }
    }

    return { widthMm: W / MM, heightMm: H / MM, labelType: 'Custom Label', description: `Custom label generated for: "${prompt.slice(0, 60)}"`, elements: els };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

// Default sizes per label type (mm)
const DEFAULT_SIZES = {
    shipper: { width: 100, height: 150 },
    product: { width: 80, height: 60 },
    pharma: { width: 70, height: 50 },
    price: { width: 50, height: 40 },
    warehouse: { width: 100, height: 60 },
    address: { width: 100, height: 55 },
    asset: { width: 90, height: 60 },
    food: { width: 80, height: 100 },
    barcode: { width: 80, height: 35 },
    custom: { width: 100, height: 80 },
};

/**
 * Main function — call this from the chatbot.
 * @param {string} prompt - Natural language prompt from user
 * @param {object} currentSize - Current canvas size {width, height} in mm
 * @returns {object} { widthMm, heightMm, labelType, description, elements }
 */
export function generateLabel(prompt, currentSize = { width: 100, height: 150 }) {
    const labelType = detectLabelType(prompt);
    const defaultSize = DEFAULT_SIZES[labelType] || DEFAULT_SIZES.custom;
    const size = extractSize(prompt, defaultSize);
    const opts = detectOptions(prompt);
    const companyName = extractName(prompt, 'ATPL');

    const W = mm(size.width);
    const H = mm(size.height);

    switch (labelType) {
        case 'shipper': return shipperLabel(W, H, opts, companyName);
        case 'product': return productLabel(W, H, opts, companyName);
        case 'pharma': return pharmaLabel(W, H, opts, companyName);
        case 'price': return priceTag(W, H, opts, companyName);
        case 'warehouse': return warehouseLabel(W, H, opts, companyName);
        case 'address': return addressLabel(W, H, opts, companyName);
        case 'asset': return assetTag(W, H, opts, companyName);
        default: return customLabel(W, H, opts, companyName, prompt);
    }
}

/**
 * Generate a human-readable description of what was understood.
 */
export function explainPrompt(prompt) {
    const type = detectLabelType(prompt);
    const size = extractSize(prompt, DEFAULT_SIZES[type] || DEFAULT_SIZES.custom);
    const opts = detectOptions(prompt);
    const name = extractName(prompt, 'ATPL');

    const extras = [];
    if (opts.hasQR) extras.push('QR code');
    if (!opts.hasBarcode) extras.push('no barcode');
    if (opts.hasLogo) extras.push('logo area');
    if (opts.isAligned) extras.push('centered layout');

    return `Detected: **${type.charAt(0).toUpperCase() + type.slice(1)} Label** · ${size.width}×${size.height}mm · Company: ${name}${extras.length ? ' · ' + extras.join(', ') : ''}`;
}
