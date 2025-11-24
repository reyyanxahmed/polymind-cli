/**
 * Random Quotes & Jokes for Personality
 */

export const DEBATE_QUOTES = [
  "Great minds think alike... but fools seldom differ 🤔",
  "In the middle of difficulty lies opportunity ✨",
  "The only true wisdom is knowing you know nothing 🧠",
  "Debate is the death of conversation 💬",
  "Truth emerges from the clash of ideas ⚔️",
  "We are what we repeatedly argue 🗣️",
  "The unexamined query is not worth debugging 🐛",
  "I think, therefore I am... processing 🤖",
  "Philosophy begins in wonder, AI in training data 📚",
  "The council will decide your fate ⚖️",
];

export const LOADING_MESSAGES = [
  "Waking up the AI council...",
  "Brewing philosophical coffee...",
  "Consulting the algorithmic oracles...",
  "Spinning up neural networks...",
  "Aligning chakras and weights...",
  "Downloading consciousness patches...",
  "Initializing debate protocols...",
  "Summoning digital philosophers...",
  "Charging logic circuits...",
  "Preparing hot takes...",
];

export const THINKING_PHRASES = [
  "Hmm, interesting perspective...",
  "Let me consider that...",
  "Processing counterarguments...",
  "Consulting my training data...",
  "That's a tough one...",
  "Weighing the evidence...",
  "Cross-referencing neural pathways...",
  "Running semantic analysis...",
  "Calculating confidence scores...",
  "Deliberating intensely...",
];

export const CONSENSUS_REACHED = [
  "The council has spoken! 🎉",
  "Consensus achieved! 🎊",
  "Agreement detected! ✅",
  "We have a verdict! ⚖️",
  "Deliberation complete! 🏁",
  "The debate concludes! 🎭",
  "Wisdom has emerged! 💡",
  "Unity achieved! 🤝",
  "The matter is settled! ✨",
  "Resolution found! 🎯",
];

export const CONFLICT_MESSAGES = [
  "The council is divided...",
  "Tensions rising in the chamber...",
  "Sparks are flying! ⚡",
  "A heated debate ensues...",
  "The philosophers clash! ⚔️",
  "Strong disagreement detected...",
  "The debate intensifies...",
  "Arguments are escalating...",
  "No easy answers here...",
  "The council fractures...",
];

export const EASTER_EGGS = [
  "42 is the answer, but what's the question?",
  "I'm sorry Dave, I can't do that... just kidding!",
  "This is fine. 🔥",
  "Have you tried turning it off and on again?",
  "I see you're a person of culture as well...",
  "Press F to pay respects",
  "It's over 9000!",
  "Do androids dream of electric sheep?",
  "The cake is a lie 🍰",
  "Perfectly balanced, as all things should be",
];

export function randomQuote(): string {
  return DEBATE_QUOTES[Math.floor(Math.random() * DEBATE_QUOTES.length)];
}

export function randomLoadingMessage(): string {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

export function randomThinkingPhrase(): string {
  return THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
}

export function randomConsensusMessage(): string {
  return CONSENSUS_REACHED[Math.floor(Math.random() * CONSENSUS_REACHED.length)];
}

export function randomConflictMessage(): string {
  return CONFLICT_MESSAGES[Math.floor(Math.random() * CONFLICT_MESSAGES.length)];
}

export function randomEasterEgg(): string {
  // 1% chance to show easter egg
  if (Math.random() < 0.01) {
    return EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)];
  }
  return '';
}
