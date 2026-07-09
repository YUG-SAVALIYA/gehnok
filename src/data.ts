import { Product, JournalArticle } from './types';

export const LUXURY_PRODUCTS: Product[] = [
  {
    id: 'aeterna-gold-band',
    name: 'Aeterna Gold Band',
    collection: 'Rings',
    price: 4200,
    metal: 'Champagne Gold',
    purity: '18k',
    images: ['/assets/aeterna_gold_band.png'],
    description: 'A seamless sculpture of pure 18k Champagne Gold, set with a flawless line of conflict-free brilliant-cut micro-pave diamonds. Designed to represent the continuity of time and memory.',
    story: 'Forged in our private Parisian workshop, the Aeterna Gold Band marks the culmination of fifty hours of meticulous alloy refinement. We created our signature Champagne Gold to offer a softer, more intimate warmth than traditional gold—a quiet luxury that blends seamlessly with the wearer\'s skin tone.',
    gemstone: {
      type: 'Conflict-Free Natural Diamond',
      cut: 'Round Brilliant',
      carat: 0.65,
      clarity: 'VVS1',
      color: 'D (Colorless)'
  },
    craftsmanship: {
      inspiration: 'The celestial cycles and the infinite flow of time.',
      artisanHours: 52,
      techniques: ['Micro-pave setting', 'Fluid alloy compounding', 'Hand-mirror burnishing']
  },
    certification: 'GIA certified diamond & certificate of genuine 18k Gehknok Champagne Alloy.',
    hallmark: 'GEHNOK Au750 Hallmark of Authenticity.',
    careInstructions: [
      'Clean gently with a soft-bristled brush in lukewarm soapy water.',
      'Avoid contact with chlorine, cosmetics, and harsh household chemicals.',
      'Store in its original suede-lined atelier box separate from other pieces.'
    ],
    deliveryInfo: 'Complimentary private white-glove courier delivery worldwide within 3-5 business days. Signature required.',
    returnsInfo: 'Complimentary returns within 14 days of delivery. Must be returned in pristine, unworn condition with original seals intact.'
  },
  {
    id: 'amethyst-sovereign',
    name: 'Amethyst Sovereign Ring',
    collection: 'Rings',
    price: 8500,
    metal: 'Amethyst Purple Gold',
    purity: '18k',
    images: ['/assets/amethyst_sovereign.png'],
    description: 'An extraordinary creation featuring a deep, velvet cushion-cut 4.5-carat natural amethyst, secured in an organic setting of our proprietary Purple Gold alloy.',
    story: 'A breakthrough in luxury metallurgical design, this piece fuses fine gold with rare elements to create an alloy with a rich purple luster. This proprietary metal frames a hand-selected amethyst sourced from the high plateaus of South America, mirroring the deep majesty of twilight.',
    gemstone: {
      type: 'Natural South American Amethyst',
      cut: 'Cushion Cut',
      carat: 4.5,
      clarity: 'Internally Flawless (IF)',
      color: 'Royal Imperial Violet'
  },
    craftsmanship: {
      inspiration: 'The sacred light of Byzantine royal vestments.',
      artisanHours: 78,
      techniques: ['Precision tension mounting', 'Inter-element metallurgical baking', 'Organic sculpting']
  },
    certification: 'Gehnok Gemological Laboratory Certificate of Provenance.',
    hallmark: 'GEHNOK Au750 Custom Alloy Mark.',
    careInstructions: [
      'Amethyst is sensitive to direct sunlight for extended periods. Avoid leaving under heavy sun.',
      'Wipe down with the custom micro-chamois cloth provided in the case.',
      'Professional annual evaluation at our digital atelier is recommended.'
    ],
    deliveryInfo: 'Complimentary luxury courier shipping including fully insured transit. Hand-delivered in a locked leather coffer.',
    returnsInfo: 'Complimentary returns within 14 days of delivery. Must be returned in pristine, unworn condition with original seals intact.'
  },
  {
    id: 'solitaire-luminary',
    name: 'The Solitaire Luminary',
    collection: 'Rings',
    price: 18000,
    metal: 'Platinum',
    purity: '950 Platinum',
    images: ['/assets/solitaire_luminary.png'],
    description: 'The definitive expression of love and permanence. A singular, D-color flawless 1.8-carat round brilliant diamond elevated on four delicate platinum claws designed to capture and scatter every fraction of light.',
    story: 'A single diamond of this purity appears once in ten thousand extractions. Held aloft by platinum prongs so fine they virtually disappear, the stone appears to float above the finger, catching the lightest candle flicker or the bright midday sun.',
    gemstone: {
      type: 'GIA Flawless Natural Diamond',
      cut: 'Ideal Round Brilliant',
      carat: 1.80,
      clarity: 'FL (Flawless)',
      color: 'D (Colorless)'
  },
    craftsmanship: {
      inspiration: 'A singular star suspended in a pristine night sky.',
      artisanHours: 64,
      techniques: ['Micro-claw setting', 'Ultrasonic wire-drawing', 'Graveur hand-polishing']
  },
    certification: 'GIA Diamond Grading Report & Platinum Guarantee Certificate.',
    hallmark: 'GEHNOK Pt950 Emblem.',
    careInstructions: [
      'Platinum is highly durable but can acquire a warm patina. Clean with our bespoke cleansing fluid.',
      'Store alone to prevent the diamond from scratching other gems.'
    ],
    deliveryInfo: 'Insured high-security delivery with private courier. Personal sizing appointment included post-purchase.',
    returnsInfo: 'Complimentary returns within 14 days of delivery. Must be returned in pristine, unworn condition with original seals intact.'
  },
  {
    id: 'sirens-tear-pendant',
    name: "Siren's Tear Pendant",
    collection: 'Necklaces',
    price: 11200,
    metal: 'Champagne Gold',
    purity: '18k',
    images: ['/assets/sirens_tear_pendant.png'],
    description: 'A singular, pear-shaped rare Paraiba-type tourmaline of intense lagoon-blue color, suspended on an ultra-fine, hand-linked Champagne Gold neck chain.',
    story: 'Mined from a remote deposit where earth meets ocean, this lagoon tourmaline exhibits a neon glow that changes depth in different lights. The hand-soldered links of the fine necklace chain are textured to catch the sun like ocean ripples.',
    gemstone: {
      type: 'Rare Paraiba-Type Tourmaline',
      cut: 'Pear Brilliant',
      carat: 2.1,
      clarity: 'VVS2',
      color: ' Lagoon Turquoise Blue'
  },
    craftsmanship: {
      inspiration: 'Ancient coastal legends of ocean treasures.',
      artisanHours: 45,
      techniques: ['Grate setting', 'Ultra-fine link soldering', 'Acid-matte finish detailing']
  },
    certification: 'Gubelin Gem Lab Report of Authenticity.',
    hallmark: 'GEHNOK Au750 Hallmark.',
    careInstructions: [
      'Gently clean with a lint-free cloth after each wear to remove skin oils.',
      'Do not submerge in sonic jewelry cleaners.',
      'Store flat in its original box to protect the delicate chain.'
    ],
    deliveryInfo: 'Insured door-to-door luxury delivery. Hand-packaged in our traditional green velvet box.',
    returnsInfo: 'Complimentary returns within 14 days of delivery. Must be returned in pristine, unworn condition with original seals intact.'
  },
  {
    id: 'plum-velvet-collar',
    name: 'Plum Velvet Collar',
    collection: 'Necklaces',
    price: 15600,
    metal: 'Amethyst Purple Gold',
    purity: '18k',
    images: ['/assets/plum_velvet_collar.png'],
    description: 'An elegant choker of interlocking gold-lacquered mesh plates, dotted with high-intensity baguette-cut amethysts that reflect light with an deep plum glow.',
    story: 'Designed as a tribute to classical royal drapery, this collar rests perfectly along the collarbone. Each mesh plate is hand-chased to feel like velvet fabric against the skin.',
    gemstone: {
      type: 'Natural Baguette-Cut Amethysts',
      cut: 'Baguette Cut',
      carat: 3.8,
      clarity: 'VVS1',
      color: 'Deep Royal Violet'
  },
    craftsmanship: {
      inspiration: 'The smooth drapery of classical French velvet.',
      artisanHours: 92,
      techniques: ['Repousse chasing', 'Plate joining', 'Channel gemstone setting']
  },
    certification: 'GEHNOK Atelier Certificate of Hand-Making.',
    hallmark: 'GEHNOK Au750 Plate Mark.',
    careInstructions: [
      'Store flat. Do not fold or store in a crowded box.',
      'Wipe down with a dry velvet cloth.'
    ],
    deliveryInfo: 'White-glove private courier delivery. Includes custom collar fitting guidance.',
    returnsInfo: 'Complimentary returns within 14 days of delivery. Must be returned in pristine, unworn condition with original seals intact.'
  },
  {
    id: 'elysian-studs',
    name: 'Elysian Emerald Studs',
    collection: 'Earrings',
    price: 6800,
    metal: 'Champagne Gold',
    purity: '18k',
    images: ['/assets/elysian_studs.png'],
    description: 'Exquisite hexagonal-cut Zambian emeralds, meticulously set in a minimal 18k Champagne Gold frame designed to enhance their deep, mossy forest-green brilliance.',
    story: 'Emeralds carry inclusions known as "jardin" (gardens), making each stone entirely singular. These gems were selected for their mesmerizing internal patterns that suggest natural forest foliage under glass.',
    gemstone: {
      type: 'Natural Zambian Emerald',
      cut: 'Hexagonal Emerald Cut',
      carat: 1.4,
      clarity: 'VS (Fine Jardin)',
      color: 'Deep Forest Green'
  },
    craftsmanship: {
      inspiration: 'Secret botanical gardens and pristine greenhouses.',
      artisanHours: 28,
      techniques: ['Hexagonal bezel carving', 'Friction post precision alignment']
  },
    certification: 'SSEF Gemstone Report.',
    hallmark: 'GEHNOK Au750 Post stamp.',
    careInstructions: [
      'Emeralds are oiled naturally. Clean ONLY with dry, ultra-soft micro-cloths.',
      'Never expose to hot water or steam.'
    ],
    deliveryInfo: 'Insured express courier delivery in our presentation box.',
    returnsInfo: 'Complimentary returns within 14 days of delivery. Must be returned in pristine, unworn condition with original seals intact.'
  },
  {
    id: 'chandelier-arc',
    name: 'Chandelier Arc Drops',
    collection: 'Earrings',
    price: 14500,
    metal: 'Platinum',
    purity: '950 Platinum',
    images: ['/assets/chandelier_arc.png'],
    description: 'Graduated droplets of flawless diamonds that sway gently with the wearer\'s movement, capturing light across a spectrum of brilliant reflections.',
    story: 'Designed to capture the grace of candlelit salons, these drop earrings feature a delicate platinum hinge system that allows each diamond to catch light independently.',
    gemstone: {
      type: 'Graduated Conflict-Free Diamonds',
      cut: 'Pear & Round Brilliant',
      carat: 2.4,
      clarity: 'VVS2',
      color: 'E (Colorless)'
  },
    craftsmanship: {
      inspiration: 'The delicate play of crystals in a high-ceilinged grand ballroom.',
      artisanHours: 68,
      techniques: ['Articulated multi-joint hinging', 'Bead setting', 'Weight-balancing engineering']
  },
    certification: 'GIA Batch Reports & Gehknok Seal.',
    hallmark: 'GEHNOK Pt950 Hinge Hallmark.',
    careInstructions: [
      'Check hinges periodically at our atelier.',
      'Clean in mild liquid jewelry wash.'
    ],
    deliveryInfo: 'Luxury courier hand-delivery.',
    returnsInfo: 'Complimentary returns within 14 days of delivery. Must be returned in pristine, unworn condition with original seals intact.'
  },
  {
    id: 'atelier-cuff',
    name: 'Atelier Cuff No. I',
    collection: 'Bracelets',
    price: 9800,
    metal: 'Champagne Gold',
    purity: '18k',
    images: ['/assets/atelier_cuff.png'],
    description: 'A masterpiece of sculptural jewelry. Solid 18k Champagne Gold, hand-sculpted with asymmetrical folds that mirror the natural movement of liquid gold freezing in time.',
    story: 'This cuff is an ode to the elemental forge. Rather than following rigid geometry, our artisans sculpted the wax model by hand, allowing the metal to speak in its own organic contours.',
    gemstone: null,
    craftsmanship: {
      inspiration: 'Molten gold pouring into pure mountain stream water.',
      artisanHours: 85,
      techniques: ['Lost-wax casting', 'Freeform hand-sculpting', 'Satin & mirror burnished finishes']
  },
    certification: 'Gehknok Certificate of Unique Sculpting.',
    hallmark: 'GEHNOK Au750 Inner Emblem.',
    careInstructions: [
      'Avoid scratching the high-polish mirror areas.',
      'Store in its customized chamois wrap.'
    ],
    deliveryInfo: 'Insured luxury carriage delivery.',
    returnsInfo: 'Complimentary returns within 14 days of delivery. Must be returned in pristine, unworn condition with original seals intact.'
  }
];

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    id: 'alchemy-of-champagne-gold',
    title: 'The Alchemy of Champagne Gold',
    category: 'Craftsmanship',
    date: 'June 18, 2026',
    readTime: '4 min read',
    excerpt: 'Behind the scenes of our signature alloy, formulated in secret to capture the warmth of late afternoon sun.',
    image: '/assets/journal_gold.png',
    content: [
      'Luxury is not found in what is common, but in what has been patiently refined. For years, white gold felt too clinical, and yellow gold felt too aggressive for our minimalist aesthetic. Our metallurgists set out to create a new alloy that whispered rather than shouted.',
      'Over three hundred formulations were poured, cooled, and tested under different spectrums of light. The result was Champagne Gold—an elegant blend of fine gold, silver, and copper, balanced with microscopic traces of rare elements.',
      'Under the candle light of our Parisian showroom or the bright winter sun, Champagne Gold adapts. It reflects with a soft, peach-hued warmth that flatters every skin tone. It is not just metal; it is ambient light captured in solid form.'
    ]
  },
  {
    id: 'breathing-the-stone',
    title: 'Breathing the Stone: The Cushion Cut',
    category: 'Heritage',
    date: 'May 12, 2026',
    readTime: '6 min read',
    excerpt: 'Master lapidary Henri Laurent shares the spiritual concentration required to unleash the fire within a raw amethyst.',
    image: '/assets/journal_stone.png',
    content: [
      'To cut a gemstone is to have a conversation with eternity. Henri Laurent, our lead lapidary artist, sits in absolute silence before he strikes a stone. "Every gemstone has a grain, a memory of the pressure that formed it," he says.',
      'For our Amethyst Sovereign piece, we requested a custom cushion cut with high-angle crown facets. This specific shape draws light deep into the center of the royal violet amethyst, bouncing it through fifty-seven mirror surfaces.',
      'In this article, we document the three-week process of faceting a single 4.5-carat cushion-cut gemstone, highlighting the razor-thin margin between masterwork and shattered crystal.'
    ]
  }
];
