export type RegionalRegion = 'Alola' | 'Galar' | 'Hisui' | 'Paldea';

export interface RegionalFormEntry {
  slug: string;
  region: RegionalRegion;
  rarity: 'common' | 'uncommon' | 'rare';
}

// Slug usati con api.getPokemon(slug) → id numerico reale (10091+)
// La rarità: Hisuiane = rare, Alolane = common/uncommon, Galariane = uncommon, Paldea = rare
export const REGIONAL_FORMS: RegionalFormEntry[] = [
  // ── ALOLA ──
  { slug: 'rattata-alola',     region: 'Alola', rarity: 'common'   },
  { slug: 'raticate-alola',    region: 'Alola', rarity: 'uncommon' },
  { slug: 'raichu-alola',      region: 'Alola', rarity: 'rare'     },
  { slug: 'sandshrew-alola',   region: 'Alola', rarity: 'common'   },
  { slug: 'sandslash-alola',   region: 'Alola', rarity: 'uncommon' },
  { slug: 'vulpix-alola',      region: 'Alola', rarity: 'common'   },
  { slug: 'ninetales-alola',   region: 'Alola', rarity: 'rare'     },
  { slug: 'diglett-alola',     region: 'Alola', rarity: 'common'   },
  { slug: 'dugtrio-alola',     region: 'Alola', rarity: 'uncommon' },
  { slug: 'meowth-alola',      region: 'Alola', rarity: 'common'   },
  { slug: 'persian-alola',     region: 'Alola', rarity: 'uncommon' },
  { slug: 'geodude-alola',     region: 'Alola', rarity: 'common'   },
  { slug: 'graveler-alola',    region: 'Alola', rarity: 'uncommon' },
  { slug: 'golem-alola',       region: 'Alola', rarity: 'rare'     },
  { slug: 'grimer-alola',      region: 'Alola', rarity: 'common'   },
  { slug: 'muk-alola',         region: 'Alola', rarity: 'uncommon' },
  { slug: 'exeggutor-alola',   region: 'Alola', rarity: 'rare'     },
  { slug: 'marowak-alola',     region: 'Alola', rarity: 'rare'     },
  // ── GALAR ──
  { slug: 'meowth-galar',      region: 'Galar', rarity: 'common'   },
  { slug: 'ponyta-galar',      region: 'Galar', rarity: 'uncommon' },
  { slug: 'rapidash-galar',    region: 'Galar', rarity: 'rare'     },
  { slug: 'slowpoke-galar',    region: 'Galar', rarity: 'common'   },
  { slug: 'slowbro-galar',     region: 'Galar', rarity: 'uncommon' },
  { slug: 'slowking-galar',    region: 'Galar', rarity: 'rare'     },
  { slug: 'farfetchd-galar',   region: 'Galar', rarity: 'uncommon' },
  { slug: 'weezing-galar',     region: 'Galar', rarity: 'uncommon' },
  { slug: 'mr-mime-galar',     region: 'Galar', rarity: 'uncommon' },
  { slug: 'articuno-galar',    region: 'Galar', rarity: 'rare'     },
  { slug: 'zapdos-galar',      region: 'Galar', rarity: 'rare'     },
  { slug: 'moltres-galar',     region: 'Galar', rarity: 'rare'     },
  { slug: 'corsola-galar',     region: 'Galar', rarity: 'uncommon' },
  { slug: 'zigzagoon-galar',   region: 'Galar', rarity: 'common'   },
  { slug: 'linoone-galar',     region: 'Galar', rarity: 'uncommon' },
  { slug: 'darumaka-galar',    region: 'Galar', rarity: 'uncommon' },
  { slug: 'darmanitan-galar',  region: 'Galar', rarity: 'rare'     },
  { slug: 'yamask-galar',      region: 'Galar', rarity: 'uncommon' },
  { slug: 'stunfisk-galar',    region: 'Galar', rarity: 'uncommon' },
  // ── HISUI ──
  { slug: 'growlithe-hisui',   region: 'Hisui', rarity: 'uncommon' },
  { slug: 'arcanine-hisui',    region: 'Hisui', rarity: 'rare'     },
  { slug: 'voltorb-hisui',     region: 'Hisui', rarity: 'common'   },
  { slug: 'electrode-hisui',   region: 'Hisui', rarity: 'uncommon' },
  { slug: 'typhlosion-hisui',  region: 'Hisui', rarity: 'rare'     },
  { slug: 'qwilfish-hisui',    region: 'Hisui', rarity: 'uncommon' },
  { slug: 'sneasel-hisui',     region: 'Hisui', rarity: 'uncommon' },
  { slug: 'samurott-hisui',    region: 'Hisui', rarity: 'rare'     },
  { slug: 'lilligant-hisui',   region: 'Hisui', rarity: 'rare'     },
  { slug: 'zorua-hisui',       region: 'Hisui', rarity: 'uncommon' },
  { slug: 'zoroark-hisui',     region: 'Hisui', rarity: 'rare'     },
  { slug: 'braviary-hisui',    region: 'Hisui', rarity: 'rare'     },
  { slug: 'sliggoo-hisui',     region: 'Hisui', rarity: 'uncommon' },
  { slug: 'goodra-hisui',      region: 'Hisui', rarity: 'rare'     },
  { slug: 'avalugg-hisui',     region: 'Hisui', rarity: 'uncommon' },
  { slug: 'decidueye-hisui',   region: 'Hisui', rarity: 'rare'     },
  // ── PALDEA ──
  { slug: 'wooper-paldea',     region: 'Paldea', rarity: 'uncommon' },
];

export const REGIONAL_FORM_SLUGS = REGIONAL_FORMS.map(f => f.slug);
export const REGIONAL_FORMS_BY_REGION = {
  Alola:  REGIONAL_FORMS.filter(f => f.region === 'Alola'),
  Galar:  REGIONAL_FORMS.filter(f => f.region === 'Galar'),
  Hisui:  REGIONAL_FORMS.filter(f => f.region === 'Hisui'),
  Paldea: REGIONAL_FORMS.filter(f => f.region === 'Paldea'),
};

// Overrides manuali evoluzioni con pietre per forme regionali
// Chiave = slug del pokemon, valore = { item API slug → slug evoluzione }
export const REGIONAL_STONE_EVOLUTIONS: Record<string, { item: string; targetSlug: string }> = {
  'sandshrew-alola':  { item: 'ice-stone',  targetSlug: 'sandslash-alola'         },
  'vulpix-alola':     { item: 'ice-stone',  targetSlug: 'ninetales-alola'          },
  'darumaka-galar':   { item: 'ice-stone',  targetSlug: 'darmanitan-galar-standard'},
};

// Identificatore: un pokemon con pokemonId > 10000 è una forma regionale
export const isRegionalForm = (pokemonId: number): boolean => pokemonId > 10000;