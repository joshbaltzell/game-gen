import type { Theme } from "@/types/madlibs";

export const themes: Theme[] = [
  {
    id: "space",
    name: "Space Adventure",
    description: "Blast off to the stars and save the galaxy!",
    icon: "🚀",
    blanks: [
      {
        id: "heroName", label: "Hero's Name", placeholder: "Captain Nova", partOfSpeech: "name", maxLength: 20,
        suggestions: ["Captain Nova", "Astrid Comet", "Zip Nebula", "Luna Stardust", "Rex Cosmo", "Blaze Orbit", "Stella Warp", "Jett Pulsar", "Nyx Galaxy", "Solara Flux"],
      },
      {
        id: "villainName", label: "Villain's Name", placeholder: "Lord Nebula", partOfSpeech: "name", maxLength: 20,
        suggestions: ["Lord Nebula", "Darkmatter Rex", "Void Empress", "Baron Blackhole", "Queen Entropy", "Zargon the Dread", "Admiral Chaos", "The Singularity", "Cosmo Wraith", "Nebula Shade"],
      },
      {
        id: "heroWeapon", label: "Special Weapon", placeholder: "Plasma Sword", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Plasma Sword", "Photon Blaster", "Nova Gauntlet", "Star Whip", "Gravity Hammer", "Ion Saber", "Cosmic Bow", "Neutron Lance", "Pulse Pistol", "Quantum Blade"],
      },
      {
        id: "sidekick", label: "Sidekick Creature", placeholder: "Robot Dog", partOfSpeech: "creature", maxLength: 25,
        suggestions: ["Robot Dog", "Mini Asteroid Buddy", "Glowing Space Worm", "Tiny Rocket Cat", "Holographic Parrot", "Sentient Drone", "Crystal Ferret", "Nebula Sprite", "Astro Hamster", "Plasma Pup"],
      },
      {
        id: "planet", label: "Planet Name", placeholder: "Zorgon-7", partOfSpeech: "place", maxLength: 20,
        suggestions: ["Zorgon-7", "Nebulus Prime", "Crystalia", "Starforge IV", "Void's Edge", "Luminara-9", "Eclipsis", "Nexus Station", "Asteroid Haven", "Quasar Point"],
      },
      {
        id: "collectible", label: "Thing to Collect", placeholder: "Star Crystals", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Star Crystals", "Moon Gems", "Plasma Orbs", "Cosmic Coins", "Stardust Shards", "Nova Fragments", "Warp Tokens", "Photon Pearls", "Gravity Cubes", "Nebula Nuggets"],
      },
      {
        id: "heroAdj", label: "Hero's Personality", placeholder: "Brave", partOfSpeech: "adjective", maxLength: 15,
        suggestions: ["Brave", "Fearless", "Quick-witted", "Bold", "Daring", "Clever", "Determined", "Heroic", "Spirited", "Gutsy"],
      },
      {
        id: "villainAdj", label: "Villain's Personality", placeholder: "Sneaky", partOfSpeech: "adjective", maxLength: 15,
        suggestions: ["Sneaky", "Ruthless", "Cunning", "Devious", "Sinister", "Malicious", "Treacherous", "Wicked", "Villainous", "Scheming"],
      },
      {
        id: "obstacle", label: "Dangerous Obstacle", placeholder: "Asteroid Field", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Asteroid Field", "Ion Storm", "Gravity Well", "Plasma Minefield", "Solar Flare", "Dark Matter Cloud", "Wormhole Trap", "Laser Grid", "Space Debris", "Cosmic Rift"],
      },
      {
        id: "victoryAction", label: "Victory Celebration", placeholder: "moonwalking", partOfSpeech: "verb", maxLength: 20,
        suggestions: ["moonwalking", "zero-G dancing", "star surfing", "cosmic dabbing", "rocket spinning", "laser pointing", "orbit flipping", "meteor sliding", "space strutting", "nova bursting"],
      },
    ],
    artDirection: "16-bit retro pixel art, sci-fi space theme, dark starry backgrounds, neon accents, cosmic colors",
    storyPromptTemplate: "space adventure",
    levelCount: 3,
    colorPalette: ["#0B0C2A", "#1B2838", "#00D4FF", "#FF6B35", "#FFFFFF"],
  },
  {
    id: "fantasy",
    name: "Fantasy Quest",
    description: "Embark on a magical journey through enchanted lands!",
    icon: "🏰",
    blanks: [
      {
        id: "heroName", label: "Hero's Name", placeholder: "Thornwick", partOfSpeech: "name", maxLength: 20,
        suggestions: ["Thornwick", "Ember Sage", "Lyra Moonshadow", "Alaric the Bold", "Fern Oakhart", "Willow Bright", "Cedric Storm", "Ivy Dawnblade", "Rowan Shield", "Gareth Flamecrest"],
      },
      {
        id: "villainName", label: "Evil Sorcerer", placeholder: "Shadowmere", partOfSpeech: "name", maxLength: 20,
        suggestions: ["Shadowmere", "Malachar the Fallen", "Dark Queen Nyx", "Lord Grimshaw", "Duchess Venom", "The Lich King", "Morgath the Wicked", "Vexora Nightbane", "Thorne of Ash", "Baron Crypt"],
      },
      {
        id: "heroWeapon", label: "Enchanted Weapon", placeholder: "Crystal Staff", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Crystal Staff", "Flaming Sword", "Thunder Axe", "Shadow Dagger", "Frost Bow", "Dragon Mace", "Spirit Wand", "Moon Glaive", "Vine Whip", "Rune Hammer"],
      },
      {
        id: "sidekick", label: "Magical Companion", placeholder: "Fire Sprite", partOfSpeech: "creature", maxLength: 25,
        suggestions: ["Fire Sprite", "Baby Dragon", "Wise Owl Familiar", "Enchanted Fox", "Crystal Golem", "Fairy Wisp", "Shadow Cat", "Talking Toad", "Mini Phoenix", "Moss Spirit"],
      },
      {
        id: "kingdom", label: "Kingdom Name", placeholder: "Eldergrove", partOfSpeech: "place", maxLength: 20,
        suggestions: ["Eldergrove", "Crystalheim", "Thornwood Keep", "Mystic Falls", "Dragon's Rest", "Silverhollow", "Frostpeak", "Sunfire Vale", "Moonshadow Reach", "Ironbark Citadel"],
      },
      {
        id: "collectible", label: "Magical Item", placeholder: "Enchanted Gems", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Enchanted Gems", "Dragon Scales", "Phoenix Feathers", "Rune Stones", "Fairy Dust", "Magic Scrolls", "Crystal Hearts", "Golden Acorns", "Moon Shards", "Spell Orbs"],
      },
      {
        id: "heroAdj", label: "Hero's Trait", placeholder: "Courageous", partOfSpeech: "adjective", maxLength: 15,
        suggestions: ["Courageous", "Noble", "Wise", "Valiant", "Steadfast", "Honorable", "Gallant", "Resourceful", "Tenacious", "Dauntless"],
      },
      {
        id: "villainAdj", label: "Villain's Trait", placeholder: "Cunning", partOfSpeech: "adjective", maxLength: 15,
        suggestions: ["Cunning", "Merciless", "Treacherous", "Dark-hearted", "Cruel", "Vengeful", "Corrupted", "Insidious", "Power-hungry", "Deceitful"],
      },
      {
        id: "obstacle", label: "Treacherous Obstacle", placeholder: "Cursed Swamp", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Cursed Swamp", "Thorn Maze", "Lava Bridge", "Enchanted Fog", "Goblin Ambush", "Poison Swamp", "Collapsing Ruins", "Dark Forest", "Spider Nest", "Ice Cavern"],
      },
      {
        id: "victoryAction", label: "Victory Celebration", placeholder: "feasting", partOfSpeech: "verb", maxLength: 20,
        suggestions: ["feasting", "sword juggling", "dragon riding", "spell casting", "crown wearing", "potion toasting", "shield bashing", "banner waving", "lute playing", "bonfire dancing"],
      },
    ],
    artDirection: "16-bit retro pixel art, high fantasy theme, lush green forests, stone castles, magical glowing effects",
    storyPromptTemplate: "fantasy adventure",
    levelCount: 3,
    colorPalette: ["#1a3a2a", "#2d5a3d", "#7ddf64", "#ffd700", "#8b4513"],
  },
  {
    id: "underwater",
    name: "Ocean Odyssey",
    description: "Dive deep into the mysterious ocean depths!",
    icon: "🌊",
    blanks: [
      {
        id: "heroName", label: "Hero's Name", placeholder: "Coral", partOfSpeech: "name", maxLength: 20,
        suggestions: ["Coral", "Finn Tidewalker", "Marina Pearl", "Triton Wave", "Aqua Swift", "Shelly Neptune", "Kai Riptide", "Oceana Spark", "Reed Current", "Nixie Deep"],
      },
      {
        id: "villainName", label: "Sea Monster", placeholder: "Kraken King", partOfSpeech: "name", maxLength: 20,
        suggestions: ["Kraken King", "Abyss Lord", "Typhoon Rex", "Queen Leviathan", "Moray the Wicked", "Undertow Baron", "Sirena Dark", "The Maelstrom", "Coral Crusher", "Phantom Tide"],
      },
      {
        id: "heroWeapon", label: "Ocean Weapon", placeholder: "Trident", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Trident", "Coral Blade", "Bubble Blaster", "Shell Shield", "Wave Staff", "Pearl Sling", "Kelp Whip", "Tide Hammer", "Current Bow", "Abyssal Spear"],
      },
      {
        id: "sidekick", label: "Sea Buddy", placeholder: "Glowing Jellyfish", partOfSpeech: "creature", maxLength: 25,
        suggestions: ["Glowing Jellyfish", "Tiny Seahorse", "Hermit Crab Pal", "Electric Eel Friend", "Baby Sea Turtle", "Pufferfish Buddy", "Smart Octopus", "Manta Ray Guide", "Clownfish Companion", "Starfish Sidekick"],
      },
      {
        id: "reef", label: "Reef/City Name", placeholder: "Luminara Reef", partOfSpeech: "place", maxLength: 20,
        suggestions: ["Luminara Reef", "Coral City", "Deepwater Haven", "Pearl Grotto", "Sunken Atlantis", "Tidepool Village", "Abyssal Ruins", "Crystal Cove", "Kelp Kingdom", "Bubble Bay"],
      },
      {
        id: "collectible", label: "Treasure to Find", placeholder: "Golden Pearls", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Golden Pearls", "Sea Diamonds", "Mermaid Coins", "Glowing Shells", "Coral Gems", "Treasure Doubloons", "Sunken Rubies", "Tide Crystals", "Neptune Tokens", "Abyssal Orbs"],
      },
      {
        id: "heroAdj", label: "Hero's Trait", placeholder: "Swift", partOfSpeech: "adjective", maxLength: 15,
        suggestions: ["Swift", "Agile", "Clever", "Bold", "Spirited", "Quick", "Daring", "Nimble", "Bright", "Plucky"],
      },
      {
        id: "villainAdj", label: "Villain's Trait", placeholder: "Terrifying", partOfSpeech: "adjective", maxLength: 15,
        suggestions: ["Terrifying", "Monstrous", "Ruthless", "Ravenous", "Ancient", "Venomous", "Colossal", "Merciless", "Dreadful", "Relentless"],
      },
      {
        id: "obstacle", label: "Ocean Hazard", placeholder: "Whirlpool", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Whirlpool", "Poison Ink Cloud", "Giant Clam Trap", "Electric Current", "Coral Spikes", "Urchin Minefield", "Dark Trench", "Pressure Zone", "Shark Patrol", "Kelp Tangle"],
      },
      {
        id: "victoryAction", label: "Victory Celebration", placeholder: "splashing", partOfSpeech: "verb", maxLength: 20,
        suggestions: ["splashing", "bubble blowing", "wave surfing", "dolphin riding", "pearl tossing", "coral dancing", "tide spinning", "reef parading", "shell drumming", "whirlpool twirling"],
      },
    ],
    artDirection: "16-bit retro pixel art, underwater ocean theme, deep blue and turquoise, coral reefs, bioluminescent creatures",
    storyPromptTemplate: "underwater adventure",
    levelCount: 3,
    colorPalette: ["#001a33", "#003366", "#00bfff", "#ff6b9d", "#00ff88"],
  },
  {
    id: "jungle",
    name: "Jungle Expedition",
    description: "Explore the wild and untamed jungle!",
    icon: "🌴",
    blanks: [
      {
        id: "heroName", label: "Explorer's Name", placeholder: "Rex Vine", partOfSpeech: "name", maxLength: 20,
        suggestions: ["Rex Vine", "Jade Tracker", "Thorn Walker", "Kai Jungle", "Luna Canopy", "Ember Trail", "Fern Pathfinder", "Rio Wildstone", "Scout Briar", "Zara Fernwood"],
      },
      {
        id: "villainName", label: "Jungle Tyrant", placeholder: "The Scorpion Queen", partOfSpeech: "name", maxLength: 20,
        suggestions: ["The Scorpion Queen", "Viper King", "Shadow Panther", "Lord Thornback", "Serpent Empress", "The Jungle Shade", "Tarantula Baron", "Chief Boneclaw", "Mantis Warlord", "Crocodile Rex"],
      },
      {
        id: "heroWeapon", label: "Exploration Tool", placeholder: "Vine Whip", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Vine Whip", "Bamboo Staff", "Boomerang Blade", "Stone Machete", "Blowdart Tube", "Flame Torch", "Grapple Vine", "Thunder Drum", "Thorn Dagger", "Feather Spear"],
      },
      {
        id: "sidekick", label: "Animal Buddy", placeholder: "Clever Monkey", partOfSpeech: "creature", maxLength: 25,
        suggestions: ["Clever Monkey", "Brave Tree Frog", "Tiny Toucan", "Baby Jaguar", "Friendly Gecko", "Explorer Parrot", "Leaf Bug Pal", "Jungle Mouse", "Brave Chameleon", "Loyal Capybara"],
      },
      {
        id: "temple", label: "Lost Temple", placeholder: "Temple of Echoes", partOfSpeech: "place", maxLength: 20,
        suggestions: ["Temple of Echoes", "Pyramid of Vines", "Jaguar's Throne", "Forgotten Ziggurat", "Canopy Cathedral", "Stone of Ages", "Moss Ruins", "Serpent's Sanctum", "Golden Altar", "Ancient Root Hall"],
      },
      {
        id: "collectible", label: "Ancient Artifact", placeholder: "Jade Idols", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Jade Idols", "Golden Masks", "Amber Fossils", "Sacred Feathers", "Tribal Tokens", "Stone Tablets", "Crystal Skulls", "Jungle Gems", "Ancient Coins", "Totem Pieces"],
      },
      {
        id: "heroAdj", label: "Hero's Trait", placeholder: "Resourceful", partOfSpeech: "adjective", maxLength: 15,
        suggestions: ["Resourceful", "Adventurous", "Fearless", "Sharp-eyed", "Rugged", "Quick-footed", "Tenacious", "Wild-hearted", "Intrepid", "Daring"],
      },
      {
        id: "villainAdj", label: "Villain's Trait", placeholder: "Ruthless", partOfSpeech: "adjective", maxLength: 15,
        suggestions: ["Ruthless", "Savage", "Cunning", "Predatory", "Venomous", "Merciless", "Ferocious", "Stealthy", "Ravenous", "Bloodthirsty"],
      },
      {
        id: "obstacle", label: "Jungle Danger", placeholder: "Quicksand Pit", partOfSpeech: "noun", maxLength: 25,
        suggestions: ["Quicksand Pit", "Swinging Log Trap", "Poison Dart Wall", "Vine Snare", "Lava Stream", "Spike Pit", "Boulder Roll", "Piranha River", "Collapsing Bridge", "Thorn Barrier"],
      },
      {
        id: "victoryAction", label: "Victory Celebration", placeholder: "drumming", partOfSpeech: "verb", maxLength: 20,
        suggestions: ["drumming", "vine swinging", "war dancing", "chest beating", "torch twirling", "mask wearing", "totem building", "bonfire leaping", "canopy gliding", "river splashing"],
      },
    ],
    artDirection: "16-bit retro pixel art, tropical jungle theme, dense green foliage, ancient stone ruins, warm golden light",
    storyPromptTemplate: "jungle adventure",
    levelCount: 3,
    colorPalette: ["#1a3300", "#336600", "#66cc00", "#ffcc00", "#8b4513"],
  },
];

export function getThemeById(id: string): Theme | undefined {
  return themes.find((t) => t.id === id);
}
