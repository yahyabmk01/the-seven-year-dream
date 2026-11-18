/**
 * Story data for "The Seven-Year Dream" — 12-Node Diamond Narrative Map
 * (8 branching/merging scenes across Years 1–11 + 4 evaluated endings).
 * Separate from UI components.
 */

export const FIRST_SCENE_ID = 's1_royal_summons';
export const DEFAULT_SCENE_DURATION = 120;

export const SCENES = {
  s1_royal_summons: {
    id: 's1_royal_summons',
    phase: 'Year 1 — The Golden Harvest',
    year: 1,
    duration: 120,
    yearCard: {
      title: 'Year 1 — The Golden Harvest',
      subtitle: 'The granaries are full, and a troubling dream stirs the palace.',
      mood: 'abundance',
    },
    text: 'You wake from the dream of seven fat cattle devoured by seven gaunt cattle, and seven full stalks swallowed by seven withered ones. A royal courier summons you to the palace because the King has been troubled by the exact same dream.',
    defaultChoice: 'A',
    choices: [
      {
        id: 'A',
        title: 'Private Counsel',
        bgImageUrl: '/choices/s1_choice_a.webp',
        text: 'Interpret the dream privately for the King as a literal 14-year economic cycle—7 years of surplus followed by 7 years of drought—and propose state storage.',
        resultText:
          'The King listens in silence, impressed by your calm framing. You leave the chamber with provisional authority.',
        effects: { grain: 10, panic: 0, trust: 15 },
        setFlags: { told_king: true },
        next: 's2a_quiet_council',
      },
      {
        id: 'B',
        title: 'Public Warning',
        bgImageUrl: '/choices/s1_choice_b.webp',
        text: 'Warn the court and the outer courtyard crowd openly so citizens can start saving food in their own homes immediately.',
        resultText:
          'Gasps ripple through the courtyard. Before sundown, merchants in the lower bazaar begin raising flour prices.',
        effects: { grain: 5, panic: 30, trust: -10 },
        setFlags: { warned_public: true },
        next: 's2b_public_stir',
      },
      {
        id: 'C',
        title: 'Quiet Allegory',
        bgImageUrl: '/choices/s1_choice_c.webp',
        text: 'Downplay the dream as a poetic allegory for spiritual gratitude, avoiding alarm while quietly buying private grain deeds on the side.',
        resultText:
          'The court breathes a sigh of relief and returns to the banquet. Outside, you quietly secure three private storehouses.',
        effects: { grain: 10, panic: -5, trust: -5 },
        setFlags: { kept_secret: true },
        next: 's2a_quiet_council',
      },
    ],
  },

  s2a_quiet_council: {
    id: 's2a_quiet_council',
    phase: 'Year 2 — Early Policy',
    year: 2,
    duration: 120,
    text: "The harvest is massive. Because panic remains low, the treasury is flush and farmers are celebrating. You must design the kingdom's first agricultural policy before the surplus is consumed or exported.",
    defaultChoice: 'A',
    choices: [
      {
        id: 'A',
        title: 'Royal Granary Levy',
        bgImageUrl: '/choices/s2a_choice_a.webp',
        text: 'Propose a 20% "Royal Granary Levy" collected in raw grain rather than gold, storing wheat in the husk to prevent spoilage.',
        resultText:
          'Farmers grumble at the tax, but because the harvest is overflowing, nobody goes hungry. Massive silos rise quietly.',
        effects: { grain: 20, panic: 5, trust: 5 },
        setFlags: { husk_storage: true },
        next: 's3_merchant_guild',
      },
      {
        id: 'B',
        title: 'Market Buyout',
        bgImageUrl: '/choices/s2a_choice_b.webp',
        text: 'Offer high treasury gold prices to buy surplus grain voluntarily on the open market without announcing why.',
        resultText:
          'State buyers sweep the markets. Traders wonder why the crown wants so much wheat, sparking quiet tavern rumors.',
        effects: { grain: 15, panic: 10, trust: 0 },
        setFlags: { market_buyout: true },
        next: 's3_merchant_guild',
      },
      {
        id: 'C',
        title: 'Free Trade',
        bgImageUrl: '/choices/s2a_choice_c.webp',
        text: 'Keep taxes low and let free trade flourish, trusting that market wealth will allow the kingdom to import food if needed later.',
        resultText:
          'Merchants praise your wisdom. Gold pours into the capital, though the royal silos remain mostly empty.',
        effects: { grain: -5, panic: -5, trust: 10 },
        setFlags: { free_market: true },
        next: 's3_merchant_guild',
      },
    ],
  },

  s2b_public_stir: {
    id: 's2b_public_stir',
    phase: 'Year 2 — Early Policy',
    year: 2,
    duration: 120,
    text: 'Word of a "seven-year curse" has spread from the palace steps to every tavern. Even though the fields are bursting with wheat, bakeries are already seeing long lines and hoarding.',
    defaultChoice: 'B',
    choices: [
      {
        id: 'A',
        title: 'Bread Price Caps',
        bgImageUrl: '/choices/s2b_choice_a.webp',
        text: 'Issue a royal decree capping bread prices and criminalizing private grain hoarding above household limits.',
        resultText:
          'Bakers protest the price caps and hide their best flour under the floorboards. Tension in the streets sharpens.',
        effects: { grain: 10, panic: 15, trust: -10 },
        setFlags: { price_caps: true },
        next: 's3_merchant_guild',
      },
      {
        id: 'B',
        title: 'Public Display',
        bgImageUrl: '/choices/s2b_choice_b.webp',
        text: 'Open a small palace granary for public display to prove food is abundant and calm the crowds.',
        resultText:
          'Seeing the mountains of golden wheat reassures the crowd, though distributing free loaves drains early reserves.',
        effects: { grain: -10, panic: -20, trust: 10 },
        setFlags: { calm_display: true },
        next: 's3_merchant_guild',
      },
      {
        id: 'C',
        title: 'Household Stockpiles',
        bgImageUrl: '/choices/s2b_choice_c.webp',
        text: 'Double down on the warning and urge every family to dig underground cellars and stockpile immediately.',
        resultText:
          'A full-scale buying frenzy erupts. Empty shelves appear in the richest districts despite record harvests.',
        effects: { grain: 5, panic: 25, trust: -15 },
        setFlags: { mass_hoarding: true },
        next: 's3_merchant_guild',
      },
    ],
  },

  s3_merchant_guild: {
    id: 's3_merchant_guild',
    phase: 'Year 4 — The Endless Boom',
    year: 4,
    duration: 120,
    yearCard: {
      title: 'Year 4 — The Endless Boom',
      subtitle: 'Four consecutive years of rain embolden skeptics and traders alike.',
      mood: 'abundance',
    },
    text: 'Four consecutive years of unprecedented rain have made skeptics bold. Rival ministers mock the "famine prophecy" in council, and the Merchant Guild demands permission to export grain at huge profits to neighboring kingdoms.',
    defaultChoice: 'B',
    choices: [
      {
        id: 'A',
        title: 'Export Ban',
        bgImageUrl: '/choices/s3_choice_a.webp',
        text: 'Block all grain exports and audit regional granaries to prevent smuggling.',
        resultText:
          'The Guild is furious at the lost profits, and rumors spread that the crown knows something terrible.',
        effects: { grain: 15, panic: 10, trust: -10 },
        setFlags: { export_ban: true },
        next: 's4a_auditors_report',
      },
      {
        id: 'B',
        title: 'Taxed Exports',
        bgImageUrl: '/choices/s3_choice_b.webp',
        text: 'Allow limited exports of processed flour, taxing the profits to build deeper subterranean storage vaults.',
        resultText:
          'A balanced compromise: merchants keep trading, and new stone vaults are completed without alarming the public.',
        effects: { grain: 10, panic: 0, trust: 10 },
        setFlags: { taxed_exports: true },
        next: 's4a_auditors_report',
      },
      {
        id: 'C',
        title: 'Grand Festival',
        bgImageUrl: '/choices/s3_choice_c.webp',
        text: 'Lift restrictions and host a kingdom-wide Festival of Abundance to boost morale and political standing.',
        resultText:
          'The capital celebrates for seven nights. Your popularity soars, while reserve margins quietly shrink.',
        effects: { grain: -15, panic: -10, trust: 15 },
        setFlags: { grand_festival: true },
        next: 's4b_complacency_wave',
      },
    ],
  },

  s4a_auditors_report: {
    id: 's4a_auditors_report',
    phase: 'Year 6 — The Last Full River',
    year: 6,
    duration: 120,
    yearCard: {
      title: 'Year 6 — The Last Full River',
      subtitle: 'Engineers notice the river receding two weeks earlier than usual.',
      mood: 'abundance',
    },
    text: 'Year six brings one final massive harvest, but engineers notice the river receding two weeks earlier than usual. Regional governors ask how to handle the final surplus before winter.',
    defaultChoice: 'B',
    choices: [
      {
        id: 'A',
        title: 'Sealed Silos',
        bgImageUrl: '/choices/s4a_choice_a.webp',
        text: 'Enforce strict regional quotas: every district must seal its local silos under royal guard until further notice.',
        resultText:
          "Armed guards stationed outside granaries make citizens nervous, but the kingdom's reserves reach historic highs.",
        effects: { grain: 15, panic: 15, trust: -5 },
        setFlags: { sealed_silos: true },
        next: 's5_famine_onset',
      },
      {
        id: 'B',
        title: 'Quiet Buyout',
        bgImageUrl: '/choices/s4a_choice_b.webp',
        text: 'Quietly buy up the final harvest surplus using crown gold reserves, framing it as a routine military supply contract.',
        resultText:
          'Framing the purchase as military logistics avoids any public alarm while locking away critical grain.',
        effects: { grain: 15, panic: 0, trust: 5 },
        setFlags: { quiet_buyout: true },
        next: 's5_famine_onset',
      },
      {
        id: 'C',
        title: 'Provincial Relief',
        bgImageUrl: '/choices/s4a_choice_c.webp',
        text: 'Distribute half the surplus to ease the burden on poorer provinces and buy goodwill ahead of hard times.',
        resultText:
          'The provinces praise your generosity, entering the dry years with full bellies but thinner reserves.',
        effects: { grain: -10, panic: -10, trust: 15 },
        setFlags: { charity_release: true },
        next: 's5_famine_onset',
      },
    ],
  },

  s4b_complacency_wave: {
    id: 's4b_complacency_wave',
    phase: 'Year 6 — The Last Full River',
    year: 6,
    duration: 120,
    yearCard: {
      title: 'Year 6 — The Last Full River',
      subtitle: 'Years of celebration leave the realm untested as foreign envoys arrive.',
      mood: 'abundance',
    },
    text: "After years of celebration, almost nobody believes a famine is coming. Foreign envoys arrive offering chests of pure gold to buy half of the kingdom's remaining emergency reserves.",
    defaultChoice: 'B',
    choices: [
      {
        id: 'A',
        title: 'Emergency Decree',
        bgImageUrl: '/choices/s4b_choice_a.webp',
        text: 'Refuse the gold abruptly and declare an immediate state of agricultural emergency.',
        resultText:
          'The sudden reversal shocks the capital. Citizens rush the markets in confusion before the drought even starts.',
        effects: { grain: 5, panic: 30, trust: -15 },
        setFlags: { sudden_alarm: true },
        next: 's5_famine_onset',
      },
      {
        id: 'B',
        title: 'Discreet Imports',
        bgImageUrl: '/choices/s4b_choice_b.webp',
        text: 'Quietly decline the foreign envoys and redirect treasury funds into emergency grain imports while prices are still low.',
        resultText:
          'Caravans arrive discreetly at night, recovering precious buffer stock just before the seasonal winds shift.',
        effects: { grain: 20, panic: 5, trust: 0 },
        setFlags: { late_imports: true },
        next: 's5_famine_onset',
      },
      {
        id: 'C',
        title: 'Sell Reserves',
        bgImageUrl: '/choices/s4b_choice_c.webp',
        text: 'Accept the gold—the treasury will be rich enough to buy food from abroad if a drought ever actually happens.',
        resultText:
          'The royal vaults glitter with gold, leaving the grain silos echoing and hollow.',
        effects: { grain: -25, panic: 0, trust: 10 },
        setFlags: { sold_reserves: true },
        next: 's5_famine_onset',
      },
    ],
  },

  s5_famine_onset: {
    id: 's5_famine_onset',
    phase: 'Year 8 — The Copper Sky',
    year: 8,
    duration: 120,
    yearCard: {
      title: 'Year 8 — The Copper Sky',
      subtitle: 'The river fails to flood, and the seven lean years begin.',
      mood: 'drought',
    },
    text: 'The river fails to flood. The soil cracks under a relentless copper sun, and the spring seeds wither in the ground. Neighboring kingdoms send desperate envoys—the drought is regional, meaning nobody abroad has food to sell.',
    defaultChoice: 'A',
    choices: [
      {
        id: 'A',
        title: 'Tiered Rationing',
        bgImageUrl: '/choices/s5_choice_a.webp',
        text: 'Establish a transparent, tiered rationing system: fixed weekly grain allotments per household at pre-drought prices.',
        resultText:
          'Clear rules and predictable distributions keep queues orderly as citizens see everyone sharing the same burden.',
        effects: { grain: 5, panic: -10, trust: 15 },
        setFlags: { fair_rationing: true },
        next: 's6_deep_drought',
      },
      {
        id: 'B',
        title: 'Lock Granaries',
        bgImageUrl: '/choices/s5_choice_b.webp',
        text: 'Keep the palace granaries locked until conditions worsen, forcing households to exhaust their own pantries first.',
        resultText:
          'Rumors swirl that the elite are hoarding food for themselves. Riots break out near the outer gate.',
        effects: { grain: 10, panic: 25, trust: -20 },
        setFlags: { locked_palace: true },
        next: 's6_deep_drought',
      },
      {
        id: 'C',
        title: 'Wide Release',
        bgImageUrl: '/choices/s5_choice_c.webp',
        text: 'Open the granaries wide immediately to prove the crown can defeat the famine and silence critics.',
        resultText:
          'The streets erupt in relief, though rations are consumed at twice the sustainable rate.',
        effects: { grain: -25, panic: -15, trust: 10 },
        setFlags: { early_opening: true },
        next: 's6_deep_drought',
      },
    ],
  },

  s6_deep_drought: {
    id: 's6_deep_drought',
    phase: 'Year 11 — The Fourth Year of Dust',
    year: 11,
    duration: 120,
    yearCard: {
      title: 'Year 11 — The Fourth Year of Dust',
      subtitle: 'Wells run dry, and one final decree will decide the survival of the kingdom.',
      mood: 'drought',
    },
    text: "Four years into the famine, wells are running dry and desperate refugees arrive at the capital's gates. Your advisors warn that whatever happens in the next season will determine the survival of the kingdom.",
    defaultChoice: 'A',
    choices: [
      {
        id: 'A',
        title: 'Protect Seed Grain',
        bgImageUrl: '/choices/s6_choice_a.webp',
        text: 'Institute strict seed-grain protection—forbidding the eating of planting seeds—while trading excess state reserves for neighboring livestock and land.',
        resultText:
          "Sacrificing today's extra loaf to protect future planting secures the kingdom's long-term recovery.",
        effects: { grain: 5, panic: -5, trust: 10 },
        setFlags: { seed_protected: true },
        next: 'ENDING',
      },
      {
        id: 'B',
        title: 'Martial Seizure',
        bgImageUrl: '/choices/s6_choice_b.webp',
        text: 'Impose martial law and seize all private household pantries to redistribute food by force.',
        resultText:
          'Soldiers going door-to-door triggers panic, hidden caches, and violent clashes across every district.',
        effects: { grain: 5, panic: 30, trust: -25 },
        setFlags: { martial_seizure: true },
        next: 'ENDING',
      },
      {
        id: 'C',
        title: 'Relax Rations',
        bgImageUrl: '/choices/s6_choice_c.webp',
        text: 'Relax rationing rules so people can take what they need to survive the winter morale crisis.',
        resultText:
          'Families eat well for one final month before the bottom of the silos scrapes bare.',
        effects: { grain: -20, panic: 5, trust: 5 },
        setFlags: { relaxed_rations: true },
        next: 'ENDING',
      },
    ],
  },
};

export const ENDINGS = {
  'The Self-Fulfilling Prophecy': {
    id: 'ENDING_1',
    number: 1,
    title: 'The Self-Fulfilling Prophecy',
    coreConcept: 'Self-Fulfilling Prophecy & Bank-Run Dynamics (Behavioural Economics)',
    outcome:
      'Fear outran scarcity. Long before the drought peaked, unchecked alarm triggered hoarding, market runs, and civil unrest across the provinces—turning a manageable forecast into the very crisis the kingdom dreaded.',
    academicExplanation:
      'Originally formalized by sociologist Robert K. Merton (1948), a self-fulfilling prophecy occurs when an initially false or premature belief evokes collective behavior that makes the original belief come true. In economics, this mirrors a bank run or panic hoarding (Diamond–Dybvig model): even when aggregate food supply is sufficient to feed the population, fear that others will hoard causes rational individuals to buy out shelves immediately—creating artificial scarcity, supply-chain collapse, and famine before the drought peaks.',
  },
  'The Yusuf Strategy': {
    id: 'ENDING_2',
    number: 2,
    title: 'The Yusuf Strategy',
    coreConcept: 'Counter-Cyclical Risk Management & Intertemporal Resource Allocation',
    outcome:
      'Quiet foresight and disciplined stewardship carried the nation through the lean years. Full royal granaries and steady public confidence ensured neither famine nor panic could fracture the realm.',
    academicExplanation:
      'Inspired by the administrative strategy in the narrative of Yusuf (Joseph), successful crisis management requires counter-cyclical fiscal and inventory policy—building strategic buffers during periods of abundance (low marginal utility of surplus) to smooth consumption during systemic shocks. Crucially, behavioral governance requires managing information asymmetry and public expectations: accumulating reserves quietly and distributing via transparent, predictable rules prevents herd panic while preserving institutional trust.',
  },
  'A Narrow Escape': {
    id: 'ENDING_3',
    number: 3,
    title: 'A Narrow Escape',
    coreConcept: 'Supply-Side Preparedness vs. Coordination Failure',
    outcome:
      'Your granaries held enough grain to feed the people, yet rising anxiety strained every distribution line. The kingdom survived the drought—though only by the thinnest margin of order.',
    academicExplanation:
      'Physical inventory alone cannot prevent social friction if communication fails. While strategic grain reserves prevented mass starvation, high public panic eroded social trust, caused price distortions, and forced costly enforcement—demonstrating that institutional credibility is an essential complement to physical risk management.',
  },
  'The Dream Predicts the Future': {
    id: 'ENDING_4',
    number: 4,
    title: 'The Dream Predicts the Future',
    coreConcept: 'Normalcy Bias & Hyperbolic Discounting',
    outcome:
      'The warning proved true, yet preparation fell short of the seven-year trial. Empty storehouses forced painful improvisation as the drought deepened, proving foresight alone cannot feed a nation without decisive action.',
    academicExplanation:
      'In behavioral economics and psychology, normalcy bias leads people to underestimate both the likelihood and severity of a disaster because past conditions have been stable. Combined with hyperbolic discounting—overvaluing immediate comfort, low taxes, and present consumption over long-term survival—the kingdom failed to hedge against tail risk, allowing a foreseeable cycle to become a catastrophe.',
  },
};

export function evaluateEnding(grain, panic) {
  if (panic >= 70) {
    return 'The Self-Fulfilling Prophecy';
  }
  if (grain >= 70 && panic < 55) {
    return 'The Yusuf Strategy';
  }
  if (grain >= 70) {
    return 'A Narrow Escape';
  }
  return 'The Dream Predicts the Future';
}

export function getSceneById(sceneId) {
  return SCENES[sceneId] || null;
}

export function getEndingByTitle(title) {
  return ENDINGS[title] || ENDINGS['The Dream Predicts the Future'];
}
