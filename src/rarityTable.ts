// Pokémon divisi per fascia di rarità basata su capture_rate PokeAPI
// COMUNI: capture_rate >= 190
// NON COMUNI: capture_rate 46-189  
// RARI: capture_rate <= 45

export const RARITY = {
  common: {
    label: null, // nessun badge
    weight: 0.50,
    color: null,
  },
  uncommon: {
    label: '🔵 NON COMUNE',
    weight: 0.30,
    color: 'text-blue-400',
  },
  rare: {
    label: '🟡 RARO',
    weight: 0.20,
    color: 'text-yellow-400',
  },
} as const;

export type RarityTier = keyof typeof RARITY;

// Gen 1 (1-151)
const COMMON_GEN1 = [10,13,16,19,21,23,27,29,32,35,39,41,43,46,48,50,52,54,56,60,63,66,69,72,74,77,79,81,84,86,88,90,96,98,100,102,104,109,111,114,118,120,129,133,137,138,140];
const UNCOMMON_GEN1 = [1,4,7,25,37,58,116,147,2,5,8,26,38,61,64,67,70,73,75,78,80,82,85,87,89,91,92,95,97,99,101,103,105,106,107,108,110,112,113,115,117,119,121,122,123,124,125,126,127,128,132,134,135,136];
const RARE_GEN1 = [3,6,9,36,40,45,53,55,57,59,62,65,68,71,76,83,93,94,105,130,131,142,143,144,145,146,149,150,151];

// Gen 2 (152-251)
const COMMON_GEN2 = [161,163,165,167,170,177,179,183,187,191,193,194,195,198,209,216,218,220,223,226,228,231,234,235,240,261,263,265,270,273,276,278,280,283,285,287,290,293,296,298,300,303,304,307,309,312,314,316,318,320,322,325,327,328,331,333,336,339,341,343,345,347,349,351,353,355,359,361,363,366,369,370,371,374];
const UNCOMMON_GEN2 = [152,155,158,176,178,180,184,188,192,196,197,199,200,203,206,207,210,211,213,214,215,217,219,221,222,224,225,227,229,230,232,233,236,237,238,239,241,242,246];
const RARE_GEN2 = [154,157,160,175,185,186,189,190,201,202,204,205,208,212,243,244,245,247,248,249,250,251];

// Gen 3 (252-386)
const COMMON_GEN3 = [252,255,258,261,263,265,270,273,276,278,280,283,285,287,290,293,296,298,300,303,304,307,309,312,314,316,318,320,322,325,327,328,331,333,336,339,341,343,345,347,349,351,353,355,359,361,363,366,369,370,374];
const UNCOMMON_GEN3 = [253,256,259,262,264,266,271,274,277,279,281,284,286,288,291,294,297,299,301,305,308,310,313,315,317,319,321,323,326,329,332,334,337,338,340,342,344,346,348,350,352,354,356,360,362,364,367,368,371];
const RARE_GEN3 = [254,257,260,282,289,292,295,302,306,311,324,330,335,357,358,372,373,375,376,377,378,379,380,381,382,383,384,385,386];

// Gen 4 (387-493)
const COMMON_GEN4 = [387,390,393,396,399,401,403,406,408,410,412,415,418,420,422,425,427,431,433,434,436,438,439,440,441,442,443,449,451,453,455,456,458,459,461,464,472];
const UNCOMMON_GEN4 = [388,391,394,397,400,402,404,407,409,411,413,416,419,421,423,426,428,432,435,437,444,450,452,454,457,460,462,463,465,466,467,468,469,470,471,473,474,475,476,477,478,479,480,481,482];
const RARE_GEN4 = [389,392,395,398,405,414,417,424,429,430,445,446,447,448,483,484,485,486,487,488,489,490,491,492,493];

// Gen 5 (494-649)
const COMMON_GEN5 = [495,498,501,504,506,509,511,513,515,517,519,521,523,525,527,529,531,533,535,537,540,543,546,548,550,551,554,556,557,559,561,562,564,566,568,570,572,574,577,580,582,585,587,588,590,592,594,595,597,599,602,605,607,610,613,616,618,619,621,624,626,627,629,631,632,633,636];
const UNCOMMON_GEN5 = [496,499,502,505,507,510,512,514,516,518,520,522,524,526,528,530,532,534,536,538,539,541,544,547,549,552,553,555,558,560,563,565,567,569,571,573,575,578,581,583,586,589,591,593,596,598,600,603,606,608,611,614,617,620,622,625,628,630,634,637];
const RARE_GEN5 = [497,500,503,508,515,542,545,576,579,584,601,604,609,612,615,623,635,638,639,640,641,642,643,644,645,646,647,648,649];

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

// Estensione per Gen6/7/8 per Safari (minimo esempio: id consecutivi)
const COMMON_GEN6 = range(650, 680);
const UNCOMMON_GEN6 = range(681, 705);
const RARE_GEN6 = range(706, 721);

const COMMON_GEN7 = range(722, 760);
const UNCOMMON_GEN7 = range(761, 790);
const RARE_GEN7 = range(791, 809);

const COMMON_GEN8 = range(810, 840);
const UNCOMMON_GEN8 = range(841, 870);
const RARE_GEN8 = range(871, 898);

export const RARITY_POOLS: Record<RarityTier, Record<number, number[]>> = {
  common: {
    1: COMMON_GEN1,
    2: COMMON_GEN2,
    3: COMMON_GEN3,
    4: COMMON_GEN4,
    5: COMMON_GEN5,
    6: COMMON_GEN6,
    7: COMMON_GEN7,
    8: COMMON_GEN8,
  },
  uncommon: {
    1: UNCOMMON_GEN1,
    2: UNCOMMON_GEN2,
    3: UNCOMMON_GEN3,
    4: UNCOMMON_GEN4,
    5: UNCOMMON_GEN5,
    6: UNCOMMON_GEN6,
    7: UNCOMMON_GEN7,
    8: UNCOMMON_GEN8,
  },
  rare: {
    1: RARE_GEN1,
    2: RARE_GEN2,
    3: RARE_GEN3,
    4: RARE_GEN4,
    5: RARE_GEN5,
    6: RARE_GEN6,
    7: RARE_GEN7,
    8: RARE_GEN8,
  },
};

export function pickRarityTier(): RarityTier {
  const roll = Math.random();
  if (roll < RARITY.common.weight) return 'common';
  if (roll < RARITY.common.weight + RARITY.uncommon.weight) return 'uncommon';
  return 'rare';
}

export function getRandomIdByRarity(
  unlockedGens: number[],
  tier: RarityTier
): number | null {
  const pool = RARITY_POOLS[tier];
  const candidates: number[] = [];
  for (const gen of unlockedGens) {
    const ids = pool[gen];
    if (ids && ids.length > 0) candidates.push(...ids);
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
