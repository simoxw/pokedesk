export const LEGENDARY_IDS = new Set([
  // Gen 1
  144,145,146,150,151,
  // Gen 2
  243,244,245,249,250,251,
  // Gen 3
  377,378,379,380,381,382,383,384,385,386,
  // Gen 4
  480,481,482,483,484,485,486,487,488,489,490,491,492,493,
  // Gen 5
  638,639,640,641,642,643,644,645,646,647,648,649,
  // Gen 6
  716,717,718,719,720,721,
  // Gen 7
  785,786,787,788,789,790,791,792,793,794,795,796,797,798,799,800,801,802,807,808,809,
  // Gen 8
  888,889,890,891,892,893,894,895,896,897,898,
  // Gen 9
  1001,1002,1003,1004,1007,1008,1009,1010,1011,1012,1013,1017,1020,1021,1022,1023,1024,1025,
]);

export const MEGA_IDS = new Set([
  10033, // mega-venusaur 
  10034, // mega-charizard-x 
  10035, // mega-charizard-y 
  10036, // mega-blastoise 
  10037, // mega-alakazam 
  10038, // mega-gengar 
  10039, // mega-kangaskhan 
  10040, // mega-pinsir 
  10041, // mega-gyarados 
  10042, // mega-aerodactyl 
  10043, // mega-mewtwo-x 
  10044, // mega-mewtwo-y 
  10045, // mega-ampharos 
  10046, // mega-scizor 
  10047, // mega-heracross 
  10048, // mega-houndoom 
  10049, // mega-tyranitar 
  10050, // mega-blaziken 
  10051, // mega-gardevoir 
  10052, // mega-mawile 
  10053, // mega-aggron 
  10054, // mega-medicham 
  10055, // mega-manectric 
  10056, // mega-banette 
  10057, // mega-absol 
  10058, // mega-garchomp 
  10059, // mega-lucario 
  10060, // mega-abomasnow 
  10061, // mega-beedrill 
  10062, // mega-pidgeot 
  10063, // mega-slowbro 
  10064, // mega-steelix 
  10065, // mega-sceptile 
  10066, // mega-swampert 
  10067, // mega-sableye 
  10068, // mega-sharpedo 
  10069, // mega-camerupt 
  10070, // mega-altaria 
  10071, // mega-glalie 
  10072, // mega-salamence 
  10073, // mega-metagross 
  10074, // mega-latias 
  10075, // mega-latios 
  10076, // mega-rayquaza 
  10077, // mega-lopunny 
  10078, // mega-gallade 
  10079, // mega-audino 
  10080, // mega-diancie 
]);

export const MEGA_SLUGS: string[] = [
  'venusaur-mega', 'charizard-mega-x', 'charizard-mega-y', 'blastoise-mega',
  'alakazam-mega', 'gengar-mega', 'kangaskhan-mega', 'pinsir-mega',
  'gyarados-mega', 'aerodactyl-mega', 'mewtwo-mega-x', 'mewtwo-mega-y',
  'ampharos-mega', 'scizor-mega', 'heracross-mega', 'houndoom-mega',
  'tyranitar-mega', 'blaziken-mega', 'gardevoir-mega', 'mawile-mega',
  'aggron-mega', 'medicham-mega', 'manectric-mega', 'banette-mega',
  'absol-mega', 'garchomp-mega', 'lucario-mega', 'abomasnow-mega',
  'beedrill-mega', 'pidgeot-mega', 'slowbro-mega', 'steelix-mega',
  'sceptile-mega', 'swampert-mega', 'sableye-mega', 'sharpedo-mega',
  'camerupt-mega', 'altaria-mega', 'glalie-mega', 'salamence-mega',
  'metagross-mega', 'latias-mega', 'latios-mega', 'rayquaza-mega',
  'lopunny-mega', 'gallade-mega', 'audino-mega', 'diancie-mega',
];

export const GEN_RANGES: Record<string, [number, number]> = {
  gen1: [1, 151],
  gen2: [152, 251],
  gen3: [252, 386],
  gen4: [387, 493],
  gen5: [494, 649],
  gen6: [650, 721],
  gen7: [722, 809],
  gen8: [810, 898],
  gen9: [906, 1025],
};
