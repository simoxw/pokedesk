export interface LeaguePokemon {
  id: number;
  level: number;
}

export interface LeagueTrainer {
  id: string;
  name: string;
  title: string;
  type: string;
  spriteUrl: string;
  pokemon: LeaguePokemon[];
  intro: string[];
  win: string[];
  lose: string[];
  reward: { coins: number; items: Record<string, number> };
}

export interface LeagueRegion {
  id: string;
  name: string;
  generation: number;
  elite4: LeagueTrainer[];
  champion: LeagueTrainer;
  completionReward: { coins: number; items: Record<string, number>; trophyLabel: string };
}

const sprite = (name: string) =>
  `https://play.pokemonshowdown.com/sprites/trainers/${name}.png`;

export const LEAGUE_REGIONS: LeagueRegion[] = [
  // ─────────────────────────────────────────
  // KANTO — Gen 1
  // ─────────────────────────────────────────
  {
    id: 'kanto',
    name: 'Kanto',
    generation: 1,
    elite4: [
      {
        id: 'lorelei',
        name: 'Lorelei',
        title: 'Superquattro del Ghiaccio',
        type: 'ice',
        spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/lorelei-gen3.png',
        pokemon: [
          { id: 87,  level: 52 }, // Dewgong
          { id: 91,  level: 53 }, // Cloyster
          { id: 124, level: 54 }, // Jynx
          { id: 131, level: 56 }, // Lapras
        ],
        intro: [
          'Nessuno può battere i miei Pokémon di ghiaccio!',
          'Preparati a congelare ogni speranza di vittoria!',
        ],
        win: ['Non immaginavo che saresti arrivato così lontano… sei più forte di quanto pensassi.'],
        lose: ['Il ghiaccio non perdona! Torna quando sarai davvero pronto!'],
        reward: { coins: 600, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'bruno',
        name: 'Bruno',
        title: 'Superquattro del Combattimento',
        type: 'fighting',
        spriteUrl: sprite('bruno'),
        pokemon: [
          { id: 95,  level: 53 }, // Onix
          { id: 106, level: 55 }, // Hitmonlee
          { id: 107, level: 55 }, // Hitmonchan
          { id: 68,  level: 58 }, // Machamp
        ],
        intro: [
          'Io e i miei Pokémon ci siamo allenati duramente per questo!',
          'Affronta il mio potere con tutto ciò che hai!',
        ],
        win: ['Sei forte. Ma non abbastanza da fermarmi a lungo.'],
        lose: ['La forza bruta vince sempre! Non c\'era scampo per te!'],
        reward: { coins: 700, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'agatha',
        name: 'Agatha',
        title: 'Superquattro dei Fantasma',
        type: 'ghost',
        spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/agatha-gen1rb.png',
        pokemon: [
          { id: 94,  level: 54 }, // Gengar
          { id: 93,  level: 54 }, // Haunter
          { id: 24,  level: 56 }, // Arbok
          { id: 94,  level: 58 }, // Gengar
        ],
        intro: [
          'Ragazzo curioso… vieni a giocare con i fantasmi?',
          'I miei Pokémon si nutrono della paura. E tu hai tanta paura!',
        ],
        win: ['Mmh… sei sopravvissuto alle mie illusioni. Per ora.'],
        lose: ['Hehehehe! I fantasmi non conoscono sconfitta!'],
        reward: { coins: 750, items: { superpotion: 2, hyperpotion: 1 } },
      },
      {
        id: 'lance',
        name: 'Lance',
        title: 'Superquattro del Drago',
        type: 'dragon',
        spriteUrl: sprite('lance'),
        pokemon: [
          { id: 130, level: 56 }, // Gyarados
          { id: 142, level: 58 }, // Aerodactyl
          { id: 148, level: 58 }, // Dragonair
          { id: 149, level: 62 }, // Dragonite
        ],
        intro: [
          'I draghi sono le creature più potenti al mondo.',
          'Sopravvivere fino a qui è già un miracolo. Ma qui finisce il tuo cammino!',
        ],
        win: ['Bene… dimostra al Campione ciò che hai dimostrato a me.'],
        lose: ['Dragonite è invincibile! Nessuno può fermare i draghi!'],
        reward: { coins: 900, items: { hyperpotion: 2, megaball: 2 } },
      },
    ],
    champion: {
      id: 'blue',
      name: 'Blu',
      title: 'Campione di Kanto',
      type: 'normal',
      spriteUrl: sprite('blue'),
      pokemon: [
        { id: 18,  level: 59 }, // Pidgeot
        { id: 65,  level: 61 }, // Alakazam
        { id: 130, level: 61 }, // Gyarados
        { id: 9,   level: 65 }, // Blastoise
      ],
      intro: [
        'Ah, sei tu! Ho aspettato questo momento!',
        'Non ti farò sconti solo perché sei arrivato fin qui. Vediamo chi è il migliore!',
      ],
      win: ['...Impressionante. Ma la prossima volta sarò io a vincere!'],
      lose: ['Sono il Campione! Ricordatelo bene!'],
      reward: { coins: 2000, items: { rare_candy: 2, ultraball: 2, hyperpotion: 3 } },
    },
    completionReward: {
      coins: 3000,
      items: { rare_candy: 1, tm: 1 },
      trophyLabel: '🏆 Trofeo Kanto',
    },
  },

  // ─────────────────────────────────────────
  // JOHTO — Gen 2
  // ─────────────────────────────────────────
  {
    id: 'johto',
    name: 'Johto',
    generation: 2,
    elite4: [
      {
        id: 'will',
        name: 'Fausto',
        title: 'Superquattro dello Psichico',
        type: 'psychic',
        spriteUrl: sprite('will'),
        pokemon: [
          { id: 178, level: 50 }, // Xatu
          { id: 124, level: 52 }, // Jynx
          { id: 103, level: 53 }, // Exeggutor
          { id: 80,  level: 54 }, // Slowbro
        ],
        intro: [
          'Ho girato il mondo per trovare i Pokémon Psichici più rari.',
          'La mia mente è oltre la tua comprensione. Soccombiti!',
        ],
        win: ['Il tuo spirito è più forte di quanto leggessi nella tua mente…'],
        lose: ['La mente domina il corpo! Non potevi battermi!'],
        reward: { coins: 600, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'koga',
        name: 'Koga',
        title: 'Superquattro del Veleno',
        type: 'poison',
        spriteUrl: sprite('koga'),
        pokemon: [
          { id: 168, level: 51 }, // Ariados
          { id: 49,  level: 52 }, // Venomoth
          { id: 89,  level: 54 }, // Muk
          { id: 169, level: 56 }, // Crobat
        ],
        intro: [
          'Un ninja non rivela i suoi segreti.',
          'Il veleno agisce lentamente… ma inesorabilmente. Proprio come la tua sconfitta!',
        ],
        win: ['Hmph. Hai resistito al veleno. Raro.'],
        lose: ['La via del ninja è imperscrutabile! Non potevi vincere!'],
        reward: { coins: 700, items: { full_heal: 3, megaball: 1 } },
      },
      {
        id: 'bruno-johto',
        name: 'Bruno',
        title: 'Superquattro del Combattimento',
        type: 'fighting',
        spriteUrl: sprite('bruno'),
        pokemon: [
          { id: 237, level: 52 }, // Hitmontop
          { id: 106, level: 54 }, // Hitmonlee
          { id: 107, level: 54 }, // Hitmonchan
          { id: 68,  level: 58 }, // Machamp
        ],
        intro: [
          'Io e i miei Pokémon siamo come un\'unica forza!',
          'Non ho mai perso contro nessuno. E non inizierò oggi!',
        ],
        win: ['La tua forza è reale. Continua così, allenatore.'],
        lose: ['Il duro allenamento non mente mai! Sei troppo debole!'],
        reward: { coins: 750, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'karen',
        name: 'Carla',
        title: 'Superquattro del Buio',
        type: 'dark',
        spriteUrl: sprite('karen'),
        pokemon: [
          { id: 197, level: 52 }, // Umbreon
          { id: 198, level: 54 }, // Murkrow
          { id: 229, level: 57 }, // Houndoom
          { id: 94,  level: 56 }, // Gengar
        ],
        intro: [
          'I Pokémon del Buio sono spesso temuti e mal compresi.',
          'Ma la vera oscurità non conosce paura. Vediamo se tu puoi dire lo stesso!',
        ],
        win: ['I Pokémon forti sono quelli che si amano. Hai passato la prova.'],
        lose: ['L\'oscurità inghiotte tutto! Non puoi sfuggirle!'],
        reward: { coins: 900, items: { hyperpotion: 2, megaball: 2 } },
      },
    ],
    champion: {
      id: 'lance-champion',
      name: 'Lance',
      title: 'Campione di Johto',
      type: 'dragon',
      spriteUrl: sprite('lance'),
      pokemon: [
        { id: 130, level: 56 }, // Gyarados
        { id: 142, level: 58 }, // Aerodactyl
        { id: 148, level: 60 }, // Dragonair
        { id: 149, level: 62 }, // Dragonite
      ],
      intro: [
        'Sei arrivato fin qui… non è cosa da poco.',
        'Ma i draghi regnano su tutto! Dimostra che meriti questo titolo!',
      ],
      win: ['Incredibile. Forse i draghi hanno finalmente trovato un degno rivale.'],
      lose: ['I draghi non conoscono sconfitta! Il cielo appartiene a loro!'],
      reward: { coins: 2000, items: { rare_candy: 2, ultraball: 2, hyperpotion: 3 } },
    },
    completionReward: {
      coins: 3000,
      items: { rare_candy: 1, tm: 1 },
      trophyLabel: '🏆 Trofeo Johto',
    },
  },

  // ─────────────────────────────────────────
  // HOENN — Gen 3
  // ─────────────────────────────────────────
  {
    id: 'hoenn',
    name: 'Hoenn',
    generation: 3,
    elite4: [
      {
        id: 'sidney',
        name: 'Sidney',
        title: 'Superquattro del Buio',
        type: 'dark',
        spriteUrl: sprite('sidney'),
        pokemon: [
          { id: 262, level: 52 }, // Mightyena
          { id: 275, level: 54 }, // Shiftry
          { id: 332, level: 53 }, // Cacturne
          { id: 359, level: 56 }, // Absol
        ],
        intro: [
          'Oh, finalmente un avversario interessante!',
          'Amo i Pokémon che sembrano cattivi. Preparati a sentirti sopraffatto!',
        ],
        win: ['Ehh… non male. Non mi aspettavo di perdere così presto.'],
        lose: ['Ho vinto! Sapevo che non avresti avuto scampo!'],
        reward: { coins: 600, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'phoebe',
        name: 'Febe',
        title: 'Superquattro dei Fantasma',
        type: 'ghost',
        spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/faba.png',
        pokemon: [
          { id: 302, level: 53 }, // Sableye
          { id: 353, level: 54 }, // Shuppet
          { id: 354, level: 55 }, // Banette
          { id: 356, level: 57 }, // Dusclops
        ],
        intro: [
          'Ho trascorso anni con gli spiriti dei miei antenati.',
          'I fantasmi sono i miei amici! E non ti permetteranno di passare!',
        ],
        win: ['Oh! Gli spiriti ti proteggono… che bello vederlo.'],
        lose: ['I fantasmi hanno risposto alla mia chiamata!'],
        reward: { coins: 700, items: { full_heal: 2, megaball: 1 } },
      },
      {
        id: 'glacia',
        name: 'Nidia',
        title: 'Superquattro del Ghiaccio',
        type: 'ice',
        spriteUrl: sprite('glacia'),
        pokemon: [
          { id: 364, level: 52 }, // Sealeo
          { id: 362, level: 54 }, // Glalie
          { id: 221, level: 54 }, // Piloswine
          { id: 365, level: 57 }, // Walrein
        ],
        intro: [
          'Un fuoco brucia in me nonostante io usi Pokémon di ghiaccio.',
          'Questa è la vera forza! Ora spegnerò il tuo con il mio gelo!',
        ],
        win: ['Il tuo fuoco ha superato il mio ghiaccio. Straordinario.'],
        lose: ['Il gelo eterno non si scioglie mai! Hai perso!'],
        reward: { coins: 750, items: { superpotion: 2, hyperpotion: 1 } },
      },
      {
        id: 'drake',
        name: 'Drake',
        title: 'Superquattro del Drago',
        type: 'dragon',
        spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/drake-gen3.png',
        pokemon: [
          { id: 372, level: 52 }, // Shelgon
          { id: 334, level: 54 }, // Altaria
          { id: 330, level: 56 }, // Flygon
          { id: 373, level: 60 }, // Salamence
        ],
        intro: [
          'Ho navigato i sette mari per trovare i draghi più forti.',
          'Rispetta i Pokémon, rispetta il mare. Ora dimostra di meritare la vittoria!',
        ],
        win: ['...Sì. Hai tutto: forza, rispetto e cuore. Vai avanti.'],
        lose: ['Il mare e i draghi non perdonano chi è debole!'],
        reward: { coins: 900, items: { hyperpotion: 2, megaball: 2 } },
      },
    ],
    champion: {
      id: 'steven',
      name: 'Steven',
      title: 'Campione di Hoenn',
      type: 'steel',
      spriteUrl: sprite('steven'),
      pokemon: [
        { id: 227, level: 57 }, // Skarmory
        { id: 306, level: 58 }, // Aggron
        { id: 348, level: 58 }, // Armaldo
        { id: 376, level: 62 }, // Metagross
      ],
      intro: [
        'Interessante… sei arrivato davvero fin qui.',
        'Sono il miglior allenatore di Hoenn. Scopriamo se meriti davvero quel titolo!',
      ],
      win: ['...Notevole. I tuoi Pokémon luccicano come le pietre più rare.'],
      lose: ['L\'acciaio è il materiale più duro. Proprio come la mia volontà!'],
      reward: { coins: 2000, items: { rare_candy: 2, ultraball: 2, hyperpotion: 3 } },
    },
    completionReward: {
      coins: 3000,
      items: { rare_candy: 1, fire_stone: 1 },
      trophyLabel: '🏆 Trofeo Hoenn',
    },
  },

  // ─────────────────────────────────────────
  // SINNOH — Gen 4
  // ─────────────────────────────────────────
  {
    id: 'sinnoh',
    name: 'Sinnoh',
    generation: 4,
    elite4: [
      {
        id: 'aaron',
        name: 'Aaron',
        title: 'Superquattro degli Insetto',
        type: 'bug',
        spriteUrl: sprite('aaron'),
        pokemon: [
          { id: 469, level: 51 }, // Yanmega
          { id: 212, level: 52 }, // Scizor
          { id: 416, level: 53 }, // Vespiquen
          { id: 452, level: 56 }, // Drapion
        ],
        intro: [
          'Quando ero piccolo venivo deriso per i miei Pokémon Insetto.',
          'Ora sono della Superquattro! Vediamo se riesci a battere la mia crescita!',
        ],
        win: ['Hai vinto con stile. Forse anch\'io devo continuare a crescere.'],
        lose: ['I Pokémon Insetto sono più forti di quanto tutti credano!'],
        reward: { coins: 600, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'bertha',
        name: 'Berta',
        title: 'Superquattro della Terra',
        type: 'ground',
        spriteUrl: sprite('bertha'),
        pokemon: [
          { id: 340, level: 52 }, // Whiscash
          { id: 472, level: 54 }, // Gliscor
          { id: 76,  level: 54 }, // Golem
          { id: 450, level: 58 }, // Hippowdon
        ],
        intro: [
          'Vieni, vieni! Ho visto migliaia di allenatori in questa sala.',
          'La terra è paziente, ma quando trema… tutto crolla! Preparati!',
        ],
        win: ['Hahaha! Mi piace! Hai la terra sotto i piedi e il cielo negli occhi!'],
        lose: ['La terra sostiene tutto. Ma anche seppellisce chi è debole!'],
        reward: { coins: 700, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'flint',
        name: 'Ignazio',
        title: 'Superquattro del Fuoco',
        type: 'fire',
        spriteUrl: sprite('flint'),
        pokemon: [
          { id: 229, level: 53 }, // Houndoom
          { id: 136, level: 55 }, // Flareon
          { id: 78,  level: 54 }, // Rapidash
          { id: 392, level: 58 }, // Infernape
        ],
        intro: [
          'Ehi, sei in fiamme? Perché io lo sono SEMPRE!',
          'La mia passione brucia più forte di qualsiasi cosa! Muoviti!',
        ],
        win: ['Whoa… il tuo fuoco era più caldo del mio. Rispetto.'],
        lose: ['AAAAH SÌ! Il fuoco non si spegne mai! Brucia tutto!'],
        reward: { coins: 750, items: { superpotion: 2, hyperpotion: 1 } },
      },
      {
        id: 'lucian',
        name: 'Luciano',
        title: 'Superquattro dello Psichico',
        type: 'psychic',
        spriteUrl: sprite('lucian'),
        pokemon: [
          { id: 122, level: 53 }, // Mr. Mime
          { id: 196, level: 55 }, // Espeon
          { id: 437, level: 56 }, // Bronzong
          { id: 475, level: 60 }, // Gallade
        ],
        intro: [
          'Stavo proprio leggendo un libro sulla forza della mente.',
          'La mente domina la materia. Dimostrami che la tua mente è più forte della mia!',
        ],
        win: ['...Il tuo libro non è ancora scritto. Ma la storia è promettente.'],
        lose: ['La mente è la vera arma! Tu non possiedi ancora questa saggezza!'],
        reward: { coins: 900, items: { hyperpotion: 2, megaball: 2 } },
      },
    ],
    champion: {
      id: 'cynthia',
      name: 'Camilla',
      title: 'Campionessa di Sinnoh',
      type: 'dragon',
      spriteUrl: sprite('cynthia'),
      pokemon: [
        { id: 442, level: 58 }, // Spiritomb
        { id: 448, level: 60 }, // Lucario
        { id: 350, level: 60 }, // Milotic
        { id: 445, level: 62 }, // Garchomp
      ],
      intro: [
        'Benvenuto. Ho esaminato la tua battaglia… sei davvero straordinario.',
        'Ma io sono la campionessa di Sinnoh. Non ho intenzione di perdere. Iniziamo!',
      ],
      win: ['...Bellissimo. Una battaglia degna dei miti di Sinnoh. Grazie.'],
      lose: ['Questa è la differenza tra noi. Allenati ancora, e torna da me.'],
      reward: { coins: 2000, items: { rare_candy: 2, ultraball: 2, hyperpotion: 3 } },
    },
    completionReward: {
      coins: 3000,
      items: { rare_candy: 1, dawn_stone: 1 },
      trophyLabel: '🏆 Trofeo Sinnoh',
    },
  },

  // ─────────────────────────────────────────
  // UNOVA — Gen 5
  // ─────────────────────────────────────────
  {
    id: 'unova',
    name: 'Unima',
    generation: 5,
    elite4: [
      {
        id: 'shauntal',
        name: 'Irene',
        title: 'Superquattro dei Fantasma',
        type: 'ghost',
        spriteUrl: sprite('shauntal'),
        pokemon: [
          { id: 563, level: 51 }, // Cofagrigus
          { id: 426, level: 52 }, // Drifblim
          { id: 623, level: 54 }, // Golurk
          { id: 609, level: 57 }, // Chandelure
        ],
        intro: [
          'Oh, un nuovo personaggio entra nella storia!',
          'Permettimi di scrivere la tua sconfitta… sarà un capitolo magnifico!',
        ],
        win: ['...La tua storia è più avvincente di quanto immaginassi. Che finale inaspettato!'],
        lose: ['Il finale era già scritto. La tua sconfitta è diventata letteratura!'],
        reward: { coins: 600, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'marshal',
        name: 'Marco',
        title: 'Superquattro del Combattimento',
        type: 'fighting',
        spriteUrl: sprite('marshal'),
        pokemon: [
          { id: 538, level: 51 }, // Throh
          { id: 539, level: 52 }, // Sawk
          { id: 620, level: 54 }, // Mienshao
          { id: 534, level: 58 }, // Conkeldurr
        ],
        intro: [
          'Eccoti! Ti aspettavo con impazienza!',
          'Combattere è la via verso la verità! Mostrami tutta la tua forza!',
        ],
        win: ['Rispetto. Il tuo allenamento ha dato i suoi frutti.'],
        lose: ['Il combattimento onesto porta alla vittoria! Tu non eri pronto!'],
        reward: { coins: 700, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'grimsley',
        name: 'Manlio',
        title: 'Superquattro del Buio',
        type: 'dark',
        spriteUrl: sprite('grimsley'),
        pokemon: [
          { id: 510, level: 51 }, // Liepard
          { id: 553, level: 54 }, // Krookodile
          { id: 560, level: 53 }, // Scrafty
          { id: 625, level: 57 }, // Bisharp
        ],
        intro: [
          'Nella vita si vince o si perde. Non esistono vie di mezzo.',
          'Oggi sei venuto a perdere. Almeno fallo con stile!',
        ],
        win: ['...Heh. Hai vinto il jackpot. Non male, scommettitore.'],
        lose: ['Chi rischia tutto, perde tutto! La fortuna era dalla mia parte!'],
        reward: { coins: 750, items: { superpotion: 2, hyperpotion: 1 } },
      },
      {
        id: 'caitlin',
        name: 'Caitlin',
        title: 'Superquattro dello Psichico',
        type: 'psychic',
        spriteUrl: sprite('caitlin'),
        pokemon: [
          { id: 518, level: 52 }, // Musharna
          { id: 561, level: 52 }, // Sigilyph
          { id: 576, level: 54 }, // Gothitelle
          { id: 579, level: 58 }, // Reuniclus
        ],
        intro: [
          'Per tanto tempo non ho potuto controllare la mia forza.',
          'Ora sono padrona di me stessa. E della tua sconfitta!',
        ],
        win: ['...La tua calma interiore supera la mia. Sei cresciuto davvero.'],
        lose: ['La mente serena è imbattibile. La mia serenità ti ha sconfitto!'],
        reward: { coins: 900, items: { hyperpotion: 2, megaball: 2 } },
      },
    ],
    champion: {
      id: 'alder',
      name: 'Alder',
      title: 'Campione di Unima',
      type: 'fire',
      spriteUrl: sprite('alder'),
      pokemon: [
        { id: 617, level: 54 }, // Accelgor
        { id: 589, level: 54 }, // Escavalier
        { id: 621, level: 56 }, // Druddigon
        { id: 637, level: 60 }, // Volcarona
      ],
      intro: [
        'Viaggiare, incontrare persone, vivere ogni giorno appieno…',
        'Questa è la filosofia del vero allenatore. Dimostrami che la conosci!',
      ],
      win: ['Sì! È questa la risposta che cercavo. Forza, legami, vita. Hai tutto.'],
      lose: ['La vita è un viaggio. Questo è solo un ostacolo. Rialzati!'],
      reward: { coins: 2000, items: { rare_candy: 2, ultraball: 2, hyperpotion: 3 } },
    },
    completionReward: {
      coins: 3000,
      items: { rare_candy: 1, thunder_stone: 1 },
      trophyLabel: '🏆 Trofeo Unima',
    },
  },

  // ─────────────────────────────────────────
  // KALOS — Gen 6
  // ─────────────────────────────────────────
  {
    id: 'kalos',
    name: 'Kalos',
    generation: 6,
    elite4: [
      {
        id: 'malva',
        name: 'Malva',
        title: 'Superquattro del Fuoco',
        type: 'fire',
        spriteUrl: sprite('malva'),
        pokemon: [
          { id: 668, level: 52 }, // Pyroar
          { id: 663, level: 53 }, // Talonflame
          { id: 324, level: 54 }, // Torkoal
          { id: 609, level: 57 }, // Chandelure
        ],
        intro: [
          'Ah, un nuovo sfidante. Come noioso.',
          'Anche se devo ammetterlo… brucerò via la tua speranza con piacere!',
        ],
        win: ['...Tch. Non pensavo fossi così tenace. Vai avanti.'],
        lose: ['Il fuoco consuma tutto! Anche le tue illusioni di vittoria!'],
        reward: { coins: 600, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'siebold',
        name: 'Siebold',
        title: 'Superquattro dell\'Acqua',
        type: 'water',
        spriteUrl: sprite('siebold'),
        pokemon: [
          { id: 130, level: 54 }, // Gyarados
          { id: 693, level: 52 }, // Clawitzer
          { id: 689, level: 55 }, // Barbaracle
          { id: 121, level: 57 }, // Starmie
        ],
        intro: [
          'Come chef, cerco la perfezione in ogni cosa.',
          'Questa battaglia sarà la mia opera d\'arte. E tu ne sarai la sconfitta!',
        ],
        win: ['...Superbo. Una tecnica raffinata come un piatto stellato. Complimenti.'],
        lose: ['La perfezione non tollera errori! E tu ne hai fatti troppi!'],
        reward: { coins: 700, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'wikstrom',
        name: 'Wikstrom',
        title: 'Superquattro dell\'Acciaio',
        type: 'steel',
        spriteUrl: sprite('wikstrom'),
        pokemon: [
          { id: 707, level: 52 }, // Klefki
          { id: 476, level: 54 }, // Probopass
          { id: 212, level: 55 }, // Scizor
          { id: 681, level: 58 }, // Aegislash
        ],
        intro: [
          'Prode guerriero! Il tuo coraggio nell\'arrivare fin qui è degno di lode!',
          'Ma ora affronterai l\'acciaio temperato dal fuoco! In guardia!',
        ],
        win: ['MAGNIFICA BATTAGLIA! Sei un cavaliere degno di questo titolo!'],
        lose: ['L\'acciaio non si spezza! La tua lama era troppo fragile!'],
        reward: { coins: 750, items: { superpotion: 2, hyperpotion: 1 } },
      },
      {
        id: 'drasna',
        name: 'Drasna',
        title: 'Superquattro del Drago',
        type: 'dragon',
        spriteUrl: sprite('drasna'),
        pokemon: [
          { id: 691, level: 52 }, // Dragalge
          { id: 334, level: 55 }, // Altaria
          { id: 621, level: 54 }, // Druddigon
          { id: 715, level: 58 }, // Noivern
        ],
        intro: [
          'Oh come sono contenta di vederti! I miei draghi vogliono giocare!',
          'Spero che tu sia davvero forte… i miei Pokémon si annoiano facilmente!',
        ],
        win: ['Oh! Che bella sorpresa! I miei draghi erano soddisfatti. Grazie!'],
        lose: ['Ahahahah! I miei draghi hanno trovato il loro giocattolo! Sei rimasto a pezzi!'],
        reward: { coins: 900, items: { hyperpotion: 2, megaball: 2 } },
      },
    ],
    champion: {
      id: 'diantha',
      name: 'Diana',
      title: 'Campionessa di Kalos',
      type: 'fairy',
      spriteUrl: sprite('diantha'),
      pokemon: [
        { id: 701, level: 57 }, // Hawlucha
        { id: 711, level: 58 }, // Gourgeist
        { id: 706, level: 59 }, // Goodra
        { id: 282, level: 62 }, // Gardevoir
      ],
      intro: [
        'Ciao! Capisco perché tutti parlano così bene di te.',
        'Ma essere famosi non significa essere campioni. Dimostrami chi sei davvero!',
      ],
      win: ['...Bellissimo. Come un film perfetto. Sei il protagonista che non mi aspettavo.'],
      lose: ['La star del film vince sempre alla fine! E io sono la star!'],
      reward: { coins: 2000, items: { rare_candy: 2, ultraball: 2, hyperpotion: 3 } },
    },
    completionReward: {
      coins: 3000,
      items: { rare_candy: 1, moon_stone: 1 },
      trophyLabel: '🏆 Trofeo Kalos',
    },
  },

  // ─────────────────────────────────────────
  // ALOLA — Gen 7
  // ─────────────────────────────────────────
  {
    id: 'alola',
    name: 'Alola',
    generation: 7,
    elite4: [
      {
        id: 'hala',
        name: 'Hala',
        title: 'Kahuna del Combattimento',
        type: 'fighting',
        spriteUrl: sprite('hala'),
        pokemon: [
          { id: 297, level: 51 }, // Hariyama
          { id: 62,  level: 52 }, // Poliwrath
          { id: 760, level: 54 }, // Bewear
          { id: 740, level: 55 }, // Crabominable
        ],
        intro: [
          'Alola! Sei arrivato davvero fin qui… sono impressionato!',
          'Ma il Kahuna di Melemele non si arrende facilmente! Andiamo!',
        ],
        win: ['ALOLA! Che spirito meraviglioso! Sei l\'orgoglio di queste isole!'],
        lose: ['Lo spirito Alola scorre in me! La mia forza viene dalla terra!'],
        reward: { coins: 600, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'olivia',
        name: 'Olivia',
        title: 'Kahuna della Roccia',
        type: 'rock',
        spriteUrl: sprite('olivia'),
        pokemon: [
          { id: 299, level: 51 }, // Nosepass
          { id: 525, level: 52 }, // Boldore
          { id: 703, level: 53 }, // Carbink
          { id: 745, level: 55 }, // Lycanroc
        ],
        intro: [
          'Sono sorpresa di vederti qui… piacevolmente sorpresa!',
          'Le rocce di Akala sono dure come la mia determinazione. Tieniti forte!',
        ],
        win: ['Oh… sei davvero speciale. Come una pietra rarissima.'],
        lose: ['Le rocce resistono al tempo! E la mia squadra ti ha resistito!'],
        reward: { coins: 700, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'acerola',
        name: 'Acerola',
        title: 'Kahuna dei Fantasma',
        type: 'ghost',
        spriteUrl: sprite('acerola'),
        pokemon: [
          { id: 426, level: 53 }, // Drifblim
          { id: 778, level: 54 }, // Mimikyu
          { id: 781, level: 55 }, // Dhelmise
          { id: 770, level: 57 }, // Palossand
        ],
        intro: [
          'Eheh! I miei amici fantasma vogliono giocare con te!',
          'Non ti spaventare… o forse sì! È più divertente così!',
        ],
        win: ['Yay! Hai vinto! I miei fantasmi erano felicissimi di battere con te!'],
        lose: ['I fantasmi di Ula\'Ula sono i migliori! Ti hanno preso di sorpresa!'],
        reward: { coins: 750, items: { full_heal: 3, megaball: 1 } },
      },
      {
        id: 'kahili',
        name: 'Kahili',
        title: 'Elite del Volo',
        type: 'flying',
        spriteUrl: sprite('kahili'),
        pokemon: [
          { id: 169, level: 51 }, // Crobat
          { id: 741, level: 53 }, // Oricorio
          { id: 628, level: 54 }, // Braviary
          { id: 733, level: 56 }, // Toucannon
        ],
        intro: [
          'Come il mare in tempesta, la mia forza non conosce limiti.',
          'Spero che tu sappia nuotare. Perché stai per essere travolto!',
        ],
        win: ['...La corrente ti portava dalla parte giusta oggi. Ben fatto.'],
        lose: ['Il vento soffiava dalla mia parte oggi! Nessuno scampo!'],
        reward: { coins: 900, items: { hyperpotion: 2, megaball: 2 } },
      },
    ],
    champion: {
      id: 'kukui',
      name: 'Prof. Kukui',
      title: 'Campione di Alola',
      type: 'normal',
      spriteUrl: sprite('kukui'),
      pokemon: [
        { id: 462, level: 56 }, // Magnezone
        { id: 143, level: 58 }, // Snorlax
        { id: 745, level: 58 }, // Lycanroc
        { id: 727, level: 62 }, // Incineroar
      ],
      intro: [
        'Cugino! Sei arrivato davvero al vertice!',
        'Ho creato la Lega Alola per un momento come questo. Lasciami tutto!',
      ],
      win: ['YEAH! Fantastico, cugino! Sei il primo Campione della Lega Alola!'],
      lose: ['La Lega Alola ha il suo primo Campione… e sono io! Alola!'],
      reward: { coins: 2000, items: { rare_candy: 2, ultraball: 2, hyperpotion: 3 } },
    },
    completionReward: {
      coins: 3000,
      items: { rare_candy: 1, water_stone: 1 },
      trophyLabel: '🏆 Trofeo Alola',
    },
  },

  // ─────────────────────────────────────────
  // GALAR — Gen 8 (Champion Cup Finals)
  // ─────────────────────────────────────────
  {
    id: 'galar',
    name: 'Galar',
    generation: 8,
    elite4: [
      {
        id: 'bede',
        name: 'Bede',
        title: 'Finalista della Champion Cup',
        type: 'fairy',
        spriteUrl: sprite('bede'),
        pokemon: [
          { id: 866, level: 51 }, // Mr. Rime
          { id: 282, level: 53 }, // Gardevoir
          { id: 468, level: 54 }, // Togekiss
          { id: 858, level: 57 }, // Hatterene
        ],
        intro: [
          'Non so perché tu sia qui. Sicuramente non per battermi.',
          'Sono il miglior allenatore di Galar. Punto.',
        ],
        win: ['...Hmph. Forse hai qualcosa che non riesco ad ammettere. Per ora.'],
        lose: ['Ovviamente ho vinto. Come poteva andare diversamente?'],
        reward: { coins: 600, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'marnie',
        name: 'Marnie',
        title: 'Finalista della Champion Cup',
        type: 'dark',
        spriteUrl: sprite('marnie'),
        pokemon: [
          { id: 510, level: 51 }, // Liepard
          { id: 560, level: 53 }, // Scrafty
          { id: 877, level: 54 }, // Morpeko
          { id: 861, level: 57 }, // Grimmsnarl
        ],
        intro: [
          'Non sono qui per fare amicizia. Sono qui per vincere.',
          'I miei fan si aspettano una vittoria. Non li deluderò.',
        ],
        win: ['...Non male. Suppongo che meriti di andare avanti.'],
        lose: ['Spero che i miei fan abbiano visto! Questa era per voi!'],
        reward: { coins: 700, items: { superpotion: 2, megaball: 1 } },
      },
      {
        id: 'nessa',
        name: 'Nessa',
        title: 'Finalista della Champion Cup',
        type: 'water',
        spriteUrl: sprite('nessa'),
        pokemon: [
          { id: 279, level: 52 }, // Pelipper
          { id: 768, level: 53 }, // Golisopod
          { id: 834, level: 55 }, // Drednaw
          { id: 847, level: 57 }, // Barraskewda
        ],
        intro: [
          'Come il mare in tempesta, la mia forza non conosce limiti.',
          'Spero che tu sappia nuotare. Perché stai per essere travolto!',
        ],
        win: ['...La corrente ti portava dalla parte giusta oggi. Ben fatto.'],
        lose: ['Il mare non perdona! E neanche io!'],
        reward: { coins: 750, items: { superpotion: 2, hyperpotion: 1 } },
      },
      {
        id: 'raihan',
        name: 'Raihan',
        title: 'Finalista della Champion Cup',
        type: 'dragon',
        spriteUrl: sprite('raihan'),
        pokemon: [
          { id: 330, level: 52 }, // Flygon
          { id: 526, level: 54 }, // Gigalith
          { id: 844, level: 56 }, // Sandaconda
          { id: 884, level: 60 }, // Duraludon
        ],
        intro: [
          'Finalmente! L\'unico che può battere Leon!',
          'Beh, dopo di me devi ancora pensarci. Prima supera i miei draghi!',
        ],
        win: ['Wow, che foto memorabile! Sei fortissimo, amico!'],
        lose: ['PERFETTO! Questa foto è da copertina! Raihan vince ancora!'],
        reward: { coins: 900, items: { hyperpotion: 2, megaball: 2 } },
      },
    ],
    champion: {
      id: 'leon',
      name: 'Leon',
      title: 'Campione di Galar',
      type: 'fire',
      spriteUrl: sprite('leon'),
      pokemon: [
        { id: 681, level: 56 }, // Aegislash
        { id: 887, level: 58 }, // Dragapult
        { id: 612, level: 58 }, // Haxorus
        { id: 6,   level: 62 }, // Charizard
      ],
      intro: [
        'Oi! Sei arrivato fin qui… sei davvero un fenomeno!',
        'Ma io sono imbattuto da quando ero bambino. E non cambierà oggi!',
      ],
      win: ['...Incredibile. Per la prima volta sento di aver perso davvero. Sei magnifico!'],
      lose: ['Il campione che non ha mai perso! Questo è Leon di Galar!'],
      reward: { coins: 2000, items: { rare_candy: 2, ultraball: 2, hyperpotion: 3 } },
    },
    completionReward: {
      coins: 3000,
      items: { rare_candy: 1, leaf_stone: 1 },
      trophyLabel: '🏆 Trofeo Galar',
    },
  },
];

// Helper: scala i livelli in base al numero di run completate
export function scaleLeagueLevel(
  baseLevel: number,
  completedRuns: number
): number {
  if (completedRuns === 0) return baseLevel;
  // Seconda run+: +20 livelli, clampato a 88
  return Math.min(88, baseLevel + 20);
}

export interface MasterTrainer {
  id: string;
  name: string;
  spriteFile: string;
  pokemon: { id: number; level: number }[];
  intro: string[];
  win: string[];
  lose: string[];
  reward: { coins: number; items: Record<string, number> };
}

export const MASTER_TRAINERS: MasterTrainer[] = [
  {
    id: 'red',
    name: 'Red',
    spriteFile: 'red',
    pokemon: [
      { id: 150, level: 100 }, { id: 144, level: 98 },
      { id: 145, level: 98 }, { id: 146, level: 95 },
    ],
    intro: ['...', '(Red ti fissa in silenzio. La sua determinazione è palpabile.)'],
    win: ['...', '(Red annuisce lentamente, con rispetto negli occhi.)'],
    lose: ['...'],
    reward: { coins: 5000, items: { rare_candy: 3, masterball: 1 } },
  },
  {
    id: 'blue',
    name: 'Blue',
    spriteFile: 'blue',
    pokemon: [
      { id: 384, level: 98 }, { id: 382, level: 96 },
      { id: 383, level: 96 }, { id: 386, level: 92 },
    ],
    intro: ['Pfff! Un altro sfidante mediocre?', 'Dimmi almeno che ti sei allenato, perché io non ho tempo da perdere!'],
    win: ['...Beh. Forse non sei così mediocre.', 'Non aspettarti di vincere la prossima volta.'],
    lose: ['Come immaginavo! Nessuno può battermi!', 'Torna quando sarai davvero pronto!'],
    reward: { coins: 5000, items: { rare_candy: 3, ultraball: 3 } },
  },
  {
    id: 'ethan',
    name: 'Ethan',
    spriteFile: 'ethan',
    pokemon: [
      { id: 250, level: 98 }, { id: 249, level: 96 },
      { id: 244, level: 94 }, { id: 243, level: 90 },
    ],
    intro: ['Sono il Campione di Johto! Non è cosa da poco affrontarmi.', 'Se sei arrivato qui, meriti rispetto. Ma vediamo cosa sai fare!'],
    win: ['Incredibile... hai sconfitto anche Ho-Oh!', 'Sei davvero un allenatore leggendario.'],
    lose: ['Le leggendarie di Johto sono imbattibili!', 'Nessuno supera il Campione di Johto!'],
    reward: { coins: 5000, items: { rare_candy: 3, hyperpotion: 3 } },
  },
  {
    id: 'lyra',
    name: 'Lyra',
    spriteFile: 'lyra',
    pokemon: [
      { id: 251, level: 95 }, { id: 245, level: 93 },
      { id: 381, level: 91 }, { id: 380, level: 88 },
    ],
    intro: ['Ehiiii! Non pensavo arrivassi così lontano!', 'Ma non illuderti — i miei Pokémon sono davvero speciali!'],
    win: ['Waaah! Hai davvero vinto! Sei fortissimo!', 'Devo allenarmi ancora di più...'],
    lose: ['Yeeeah! Celebi e Suicune non si fermano!', "La forza dell'amicizia vince sempre!"],
    reward: { coins: 5000, items: { rare_candy: 3, full_heal: 5 } },
  },
  {
    id: 'steven',
    name: 'Steven',
    spriteFile: 'steven',
    pokemon: [
      { id: 483, level: 96 }, { id: 484, level: 96 },
      { id: 487, level: 94 }, { id: 486, level: 92 },
    ],
    intro: ['Ho collezionato le pietre più rare al mondo.', 'Ma nessuna gemma brilla come un allenatore di valore. Dimostrami che sei tu.'],
    win: ['...Magnifico. Come un cristallo perfetto.', 'Rarissimo trovare qualcuno così prezioso.'],
    lose: ["L'acciaio è il materiale più raro e resistente.", 'Proprio come la mia squadra. Inattaccabile.'],
    reward: { coins: 5000, items: { rare_candy: 3, dawn_stone: 2 } },
  },
  {
    id: 'cynthia',
    name: 'Cynthia',
    spriteFile: 'cynthia',
    pokemon: [
      { id: 493, level: 100 }, { id: 491, level: 98 },
      { id: 488, level: 96 }, { id: 492, level: 94 },
    ],
    intro: ['Sei davvero arrivato qui. I miti di Sinnoh ti avrebbero glorificato.', 'Ma ora affronti me — e io non sono un mito. Sono reale. Iniziamo!'],
    win: ['...Straordinario. Hai battuto persino Arceus.', 'La storia di questo mondo ha il tuo nome ora.'],
    lose: ['I miti di Sinnoh non si possono riscrivere.', 'Arceus governa tutto. E io sono con lui.'],
    reward: { coins: 6000, items: { rare_candy: 4, masterball: 1 } },
  },
  {
    id: 'alder',
    name: 'Alder',
    spriteFile: 'alder',
    pokemon: [
      { id: 643, level: 95 }, { id: 644, level: 95 },
      { id: 646, level: 93 }, { id: 494, level: 90 },
    ],
    intro: ['La vita è un viaggio. Il tuo è arrivato fino a me.', 'Vediamo cosa hai imparato lungo la strada. Forza!'],
    win: ['Sì! Questo è il significato della vita!', 'Hai trovato la tua risposta. Sono orgoglioso.'],
    lose: ['Il viaggio non è ancora finito per te.', 'Torna quando avrai vissuto di più!'],
    reward: { coins: 5000, items: { rare_candy: 3, thunder_stone: 2 } },
  },
  {
    id: 'diantha',
    name: 'Diantha',
    spriteFile: 'diantha',
    pokemon: [
      { id: 716, level: 96 }, { id: 717, level: 96 },
      { id: 718, level: 94 }, { id: 719, level: 90 },
    ],
    intro: ['Un protagonista degno di un film epico!', 'Ma ogni film ha il suo villain irresistibile. Eccomi!'],
    win: ['Applausi! Questo è il finale perfetto!', 'Sei la star assoluta. Mi hai rubato la scena.'],
    lose: ['La protagonista non perde nel suo film!', 'Taglio! Questa scena è mia!'],
    reward: { coins: 5000, items: { rare_candy: 3, moon_stone: 2 } },
  },
  {
    id: 'leon',
    name: 'Leon',
    spriteFile: 'leon',
    pokemon: [
      { id: 888, level: 100 }, { id: 889, level: 100 },
      { id: 890, level: 98 }, { id: 898, level: 95 },
    ],
    intro: ['Oi! Non ho MAI perso nella mia vita.', 'E non inizierò oggi. Questa sarà la battaglia del secolo!'],
    win: ['...Non ci posso credere. Per la prima volta...', 'Sei il vero Campione dei Campioni!'],
    lose: ['AHAHAH! IL CAMPIONE IMBATTUTO TRIONFA!', 'Non esiste sfidante abbastanza forte per Leon!'],
    reward: { coins: 6000, items: { rare_candy: 4, masterball: 1 } },
  },
  {
    id: 'giovanni',
    name: 'Giovanni',
    spriteFile: 'giovanni',
    pokemon: [
      { id: 150, level: 96 }, { id: 383, level: 94 },
      { id: 645, level: 92 }, { id: 377, level: 88 },
    ],
    intro: ['Ah... finalmente qualcuno degno di sfidare il Team Rocket.', 'Il potere assoluto appartiene a chi sa come ottenerlo. E io so.'],
    win: ['...Impensabile. Sei davvero straordinario.', 'Forse meriti un posto nel Team Rocket.'],
    lose: ['Il potere assoluto è mio! Sempre!', 'Il Team Rocket non cede mai!'],
    reward: { coins: 5000, items: { rare_candy: 3, ultraball: 5 } },
  },
  {
    id: 'lance',
    name: 'Lance',
    spriteFile: 'lance',
    pokemon: [
      { id: 384, level: 98 }, { id: 483, level: 96 },
      { id: 484, level: 96 }, { id: 487, level: 92 },
    ],
    intro: ['I draghi sono le creature più potenti del mondo.', 'E io sono il loro padrone supremo. Nessuno ha mai vinto contro di me qui!'],
    win: ['...I draghi ti riconoscono come pari. Incredibile.', 'Forse esistono forze oltre i draghi. Tu sei una di quelle.'],
    lose: ['I draghi dominano tutto! Nemmeno tu puoi fermarli!', 'Il cielo e i draghi sono miei per sempre!'],
    reward: { coins: 5000, items: { rare_candy: 3, ultraball: 3 } },
  },
  {
    id: 'n',
    name: 'N',
    spriteFile: 'n',
    pokemon: [
      { id: 644, level: 95 }, { id: 643, level: 95 },
      { id: 649, level: 92 }, { id: 647, level: 88 },
    ],
    intro: ['I Pokémon mi hanno parlato di te.', 'Vogliono sapere se sei davvero degno della loro fiducia. Affrontami.'],
    win: ['I Pokémon hanno scelto. Sei il loro alleato.', 'Forse il mondo può cambiare grazie a persone come te.'],
    lose: ['La verità è dalla mia parte.', 'I Pokémon meritano libertà — e io la difendo!'],
    reward: { coins: 5000, items: { rare_candy: 3, full_heal: 5 } },
  },
  {
    id: 'lusamine',
    name: 'Lusamine',
    spriteFile: 'lusamine',
    pokemon: [
      { id: 793, level: 94 }, { id: 794, level: 92 },
      { id: 797, level: 90 }, { id: 800, level: 86 },
    ],
    intro: ['Sei bello... come un Pokémon perfetto da conservare.', 'Ma la bellezza si preserva sconfiggendola. Lasciati catturare dalla mia forza!'],
    win: ['...Hai rotto la perfezione.', 'Forse la perfezione non era ciò che cercavo.'],
    lose: ['La perfezione è mia! Solo mia!', 'Nessuno può avvicinarsi alla mia bellezza assoluta!'],
    reward: { coins: 5000, items: { rare_candy: 3, ultraball: 3 } },
  },
  {
    id: 'volo',
    name: 'Volo',
    spriteFile: 'volo',
    pokemon: [
      { id: 243, level: 92 }, { id: 642, level: 90 },
      { id: 644, level: 90 }, { id: 894, level: 86 },
    ],
    intro: ['Tutto ciò che ho fatto è stato per questo momento.', 'La mia ambizione non conosce limiti. Ora paghi!'],
    win: ['...Impossibile. Era tutto pianificato...', 'Come puoi aver vinto?!'],
    lose: ['Hahaha! La mia ambizione è inarrestabile!', 'Nessuno ostacola il mio piano!'],
    reward: { coins: 5000, items: { rare_candy: 3, thunder_stone: 3 } },
  },
  {
    id: 'rival',
    name: 'Rival',
    spriteFile: 'blue-gen1',
    pokemon: [
      { id: 791, level: 95 }, { id: 792, level: 95 },
      { id: 802, level: 93 }, { id: 807, level: 90 },
    ],
    intro: ['Non sei il solo ad essere cresciuto.', 'Ho viaggiato ogni regione. Ora ti mostro cosa ho imparato!'],
    win: ['...Quindi sei davvero più forte di me ora.', 'Non me lo dimenticherò. La prossima volta vinco io.'],
    lose: ['Come sempre, PERDI!', 'Sono il Rivale! Il Rivale vince sempre!'],
    reward: { coins: 5000, items: { rare_candy: 3, megaball: 5 } },
  },
];
