// Collection of 30+ Inspirational Quotes for Spidy AI Startup Experience
export const SPIDY_QUOTES = [
  "Your next idea could change everything.",
  "Think smarter. Build faster.",
  "Every expert started as a beginner.",
  "Debug the problem, not yourself.",
  "Great things are built one line at a time.",
  "Stay curious. Keep building.",
  "Your future self will thank you.",
  "Turn questions into possibilities.",
  "Code. Learn. Repeat.",
  "Small progress is still progress.",
  "Simplicity is the ultimate sophistication.",
  "Intelligence is the ability to adapt to change.",
  "The best way to predict the future is to invent it.",
  "Complex problems yield to persistent minds.",
  "Focus on solution, not obstacle.",
  "Craftsmanship lives in the details.",
  "Innovation happens at the intersection of discipline and imagination.",
  "Make it work, make it right, make it fast.",
  "Knowledge expands when shared.",
  "Every line of code is a step toward mastery.",
  "Build with purpose. Solve with elegance.",
  "Dream big. Execute quietly.",
  "The secret to getting ahead is getting started.",
  "Technology is best when it brings people together.",
  "Strive for progress, not perfection.",
  "Logic will get you from A to B; imagination will take you everywhere.",
  "Challenges are opportunities in disguise.",
  "Shape the digital horizon with code.",
  "Clean code always looks like it was written by someone who cares.",
  "Your potential is bounded only by your persistence.",
  "Empower your workflow with AI intelligence."
];

let lastQuoteIndex = -1;

export function getRandomQuote(): string {
  let index: number;
  do {
    index = Math.floor(Math.random() * SPIDY_QUOTES.length);
  } while (index === lastQuoteIndex && SPIDY_QUOTES.length > 1);

  lastQuoteIndex = index;
  return SPIDY_QUOTES[index];
}
