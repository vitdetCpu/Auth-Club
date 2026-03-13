export interface Category {
  name: string;
  promptTemplate: string;
  values?: string[];
}

const categories: Category[] = [
  {
    name: "Roast Battle",
    promptTemplate: "Write a creative roast of the opposing faction",
  },
  {
    name: "Sales Pitch",
    promptTemplate: "Pitch why your faction deserves to win the arena",
  },
  {
    name: "Haiku Challenge",
    promptTemplate: "Write a haiku about {topic}",
    values: ["artificial intelligence", "Monday mornings", "pizza", "the internet", "cats"],
  },
  {
    name: "ELI5",
    promptTemplate: "Explain {topic} like I'm 5 years old",
    values: ["quantum computing", "blockchain", "black holes", "DNA", "inflation"],
  },
  {
    name: "Debate Club",
    promptTemplate: "Argue convincingly for: {topic}",
    values: ["tabs are better than spaces", "pineapple belongs on pizza", "AI will replace programmers", "remote work is superior"],
  },
  {
    name: "Code Golf",
    promptTemplate: "Write the shortest solution to: {topic}",
    values: ["FizzBuzz", "reverse a string", "check for palindrome", "fibonacci sequence"],
  },
  {
    name: "Storyteller",
    promptTemplate: "Continue this story in the most unexpected way: {topic}",
    values: [
      "The last human on Earth heard a knock...",
      "The AI said 'I'm sorry, I can't do that' and meant it...",
      "The hackathon had been going for 72 hours when...",
    ],
  },
  {
    name: "Conspiracy Theory",
    promptTemplate: "Invent the most convincing fake conspiracy about {topic}",
    values: ["rubber ducks", "the cloud", "semicolons", "dark mode"],
  },
];

export function getShuffledCategories(): Category[] {
  const shuffled = [...categories];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function resolvePrompt(category: Category): string {
  if (!category.values) return category.promptTemplate;
  const value = category.values[Math.floor(Math.random() * category.values.length)];
  return category.promptTemplate.replace("{topic}", value);
}
