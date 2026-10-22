const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface AIResponse {
  content: string;
  error?: string;
}

class OpenAIService {
  private static async makeRequest(
    messages: Array<{ role: string; content: string }>,
  ): Promise<AIResponse> {
    // Use appropriate endpoint for development vs production
    const endpoint = import.meta.env.DEV
      ? "/api/openai"
      : "/.netlify/functions/openai";

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "chat",
          messages,
          model: "gpt-3.5-turbo",
          max_tokens: 150,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded");
        }
        if (response.status === 401) {
          throw new Error("API key not configured");
        }
        if (response.status >= 500) {
          throw new Error("OpenAI service temporarily unavailable");
        }
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        content: data.content || "No response generated",
      };
    } catch (error) {
      console.warn("OpenAI API temporarily unavailable:", error);

      // Return error response for graceful fallback handling
      let errorMessage = "AI service temporarily unavailable";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Request timeout";
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network connection unavailable";
        } else if (error.message.includes("API key")) {
          errorMessage = "API key not configured";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        content: "",
        error: errorMessage,
      };
    }
  }

  static async generateDashboardSuggestion(userContext: {
    recentTasks?: string[];
    moodEntries?: string[];
    habits?: string[];
  }): Promise<AIResponse> {
    const contextStr = JSON.stringify(userContext);

    return this.makeRequest([
      {
        role: "system",
        content:
          "You are a helpful productivity assistant. Generate personalized suggestions for the user based on their recent activity. Keep responses concise and actionable.",
      },
      {
        role: "user",
        content: `Based on my recent activity: ${contextStr}, give me a helpful productivity suggestion. Respond with just the suggestion text, no extra formatting.`,
      },
    ]);
  }

  static async generateJournalPrompt(
    timeOfDay: "morning" | "afternoon" | "evening" | "creative" | "reflection",
  ): Promise<AIResponse> {
    const prompts = {
      morning:
        "Generate an inspiring morning journal prompt to help someone start their day with intention and positivity.",
      afternoon:
        "Create a mid-day reflection prompt to help someone check in with themselves and their goals.",
      evening:
        "Generate an evening journal prompt for reflection, gratitude, and winding down.",
      creative:
        "Create a creative, imaginative journal prompt that sparks curiosity and self-discovery.",
      reflection:
        "Generate a deep, thoughtful prompt for self-reflection and personal growth.",
    };

    return this.makeRequest([
      {
        role: "system",
        content:
          "You are a thoughtful journal prompt generator. Create meaningful, engaging prompts that encourage self-reflection and personal growth.",
      },
      {
        role: "user",
        content: prompts[timeOfDay],
      },
    ]);
  }

  static async generateMoodInsight(moodData: {
    recentMoods: string[];
    triggers: string[];
    notes: string[];
  }): Promise<AIResponse> {
    const dataStr = JSON.stringify(moodData);

    return this.makeRequest([
      {
        role: "system",
        content:
          "You are an empathetic mood analyst. Provide gentle, helpful insights about mood patterns and suggestions for emotional well-being.",
      },
      {
        role: "user",
        content: `Based on this mood data: ${dataStr}, provide a brief insight about patterns and a helpful suggestion for emotional well-being.`,
      },
    ]);
  }

  static async generateTaskSuggestion(context: {
    completedTasks?: string[];
    pendingTasks?: string[];
    timeOfDay?: string;
  }): Promise<AIResponse> {
    const contextStr = JSON.stringify(context);

    return this.makeRequest([
      {
        role: "system",
        content:
          "You are a productivity coach. Suggest the next best task or action based on the user's current context and energy level.",
      },
      {
        role: "user",
        content: `Given this context: ${contextStr}, suggest what I should focus on next. Keep it specific and actionable.`,
      },
    ]);
  }

  static async generateHabitMotivation(habit: {
    name: string;
    streak: number;
    difficulty?: string;
  }): Promise<AIResponse> {
    return this.makeRequest([
      {
        role: "system",
        content:
          "You are a supportive habit coach. Provide encouraging, personalized motivation for building habits.",
      },
      {
        role: "user",
        content: `I'm working on the habit "${habit.name}" and have a ${habit.streak}-day streak. Give me encouraging motivation to keep going.`,
      },
    ]);
  }

  static async generateSmartNote(context: {
    noteTitle?: string;
    existingContent?: string;
    category?: string;
  }): Promise<AIResponse> {
    const contextStr = JSON.stringify(context);

    return this.makeRequest([
      {
        role: "system",
        content:
          "You are a creative writing assistant. Help expand ideas, suggest related topics, or provide writing inspiration for notes.",
      },
      {
        role: "user",
        content: `Help me expand this note: ${contextStr}. Suggest related ideas or provide inspiration to develop this further.`,
      },
    ]);
  }

  static async enhanceWriting(
    content: string,
    enhancementType: "grammar" | "style" | "clarity" | "expand",
  ): Promise<AIResponse> {
    const prompts = {
      grammar:
        "Fix grammar, spelling, and punctuation errors in this text while preserving the original meaning and tone.",
      style:
        "Improve the writing style, flow, and readability of this text while maintaining the author's voice.",
      clarity:
        "Make this text clearer and more concise while keeping all important information.",
      expand:
        "Expand on this text with additional relevant details, examples, or insights that would enrich the content.",
    };

    return this.makeRequest([
      {
        role: "system",
        content: `You are a professional writing assistant. ${prompts[enhancementType]} Return only the improved text without explanations or formatting.`,
      },
      {
        role: "user",
        content: content,
      },
    ]);
  }

  static async generateContentSuggestions(context: {
    title?: string;
    currentContent?: string;
    type: "note" | "journal";
  }): Promise<AIResponse> {
    const isJournal = context.type === "journal";
    const systemPrompt = isJournal
      ? "You are a thoughtful journaling assistant. Help users explore their thoughts and feelings more deeply by suggesting meaningful questions or topics to write about."
      : "You are a creative writing assistant for note-taking. Suggest related topics, ideas, or questions that would complement the current note content.";

    return this.makeRequest([
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Given the title "${context.title}" and current content: "${context.currentContent}", suggest 3-5 follow-up questions or topics I could explore. Keep suggestions brief and inspiring.`,
      },
    ]);
  }

  static async analyzeWritingTone(content: string): Promise<AIResponse> {
    return this.makeRequest([
      {
        role: "system",
        content:
          "You are a writing analyst. Analyze the tone and emotional content of text and provide brief, helpful insights.",
      },
      {
        role: "user",
        content: `Analyze the tone and emotional content of this text and provide a brief summary: "${content}"`,
      },
    ]);
  }

  static async suggestTitle(content: string): Promise<AIResponse> {
    return this.makeRequest([
      {
        role: "system",
        content:
          "You are a creative assistant. Generate engaging, descriptive titles based on content. Keep titles concise and meaningful.",
      },
      {
        role: "user",
        content: `Suggest 3 creative titles for this content: "${content}". Return just the titles, each on a new line.`,
      },
    ]);
  }
}

// Local text enhancement functions
export class LocalTextEnhancer {
  static enhanceGrammar(text: string): string {
    let enhanced = text;

    // Basic punctuation fixes
    enhanced = enhanced.replace(/\s+/g, " "); // Multiple spaces to single space
    enhanced = enhanced.replace(/^\s+|\s+$/g, ""); // Trim whitespace
    enhanced = enhanced.replace(/([.!?])\s*([a-z])/g, "$1 $2"); // Space after punctuation
    enhanced = enhanced.replace(/([a-z])([.!?])([A-Z])/g, "$1$2 $3"); // Space after punctuation before capital
    enhanced = enhanced.replace(/\bi\b/g, "I"); // Capitalize 'i'
    enhanced = enhanced.replace(
      /([.!?]\s*)([a-z])/g,
      (match, punct, letter) => punct + letter.toUpperCase(),
    ); // Capitalize after punctuation

    // Common grammar corrections
    enhanced = enhanced.replace(/\bim\b/gi, "I'm");
    enhanced = enhanced.replace(/\bdont\b/gi, "don't");
    enhanced = enhanced.replace(/\bcant\b/gi, "can't");
    enhanced = enhanced.replace(/\bwont\b/gi, "won't");
    enhanced = enhanced.replace(/\bisnt\b/gi, "isn't");
    enhanced = enhanced.replace(/\barent\b/gi, "aren't");
    enhanced = enhanced.replace(/\btheres\b/gi, "there's");
    enhanced = enhanced.replace(/\bits\s/gi, "it's ");

    return enhanced;
  }

  static enhanceStyle(text: string): string {
    let enhanced = text;

    // Remove redundant words
    enhanced = enhanced.replace(/\bvery\s+very\b/gi, "extremely");
    enhanced = enhanced.replace(/\breally\s+really\b/gi, "absolutely");
    enhanced = enhanced.replace(/\bquite\s+quite\b/gi, "remarkably");

    // Strengthen weak phrases
    enhanced = enhanced.replace(/\bI think that\b/gi, "I believe");
    enhanced = enhanced.replace(/\bIn my opinion\b/gi, "I feel");
    enhanced = enhanced.replace(/\bkind of\b/gi, "somewhat");
    enhanced = enhanced.replace(/\bsort of\b/gi, "rather");

    // Replace weak verbs with stronger ones
    enhanced = enhanced.replace(/\bis very good\b/gi, "excels");
    enhanced = enhanced.replace(/\bis very bad\b/gi, "struggles");
    enhanced = enhanced.replace(/\bwent quickly\b/gi, "rushed");
    enhanced = enhanced.replace(/\bwalked slowly\b/gi, "strolled");

    return enhanced;
  }

  static enhanceClarity(text: string): string {
    let enhanced = text;

    // Break up long sentences (split sentences with more than 20 words)
    const sentences = enhanced.split(/([.!?]+)/);
    const clarifiedSentences = [];

    for (let i = 0; i < sentences.length; i += 2) {
      let sentence = sentences[i];
      const punctuation = sentences[i + 1] || "";

      if (sentence && sentence.split(" ").length > 20) {
        // Try to split at conjunctions
        const splitSentence = sentence.replace(
          /,\s+(and|but|or|so|yet|for|nor)\s+/gi,
          (match, conjunction) => {
            return `. ${conjunction.charAt(0).toUpperCase() + conjunction.slice(1)} `;
          },
        );
        clarifiedSentences.push(splitSentence + punctuation);
      } else {
        clarifiedSentences.push(sentence + punctuation);
      }
    }

    enhanced = clarifiedSentences.join("");

    // Simplify complex words
    enhanced = enhanced.replace(/\butilize\b/gi, "use");
    enhanced = enhanced.replace(/\bfacilitate\b/gi, "help");
    enhanced = enhanced.replace(/\bcommence\b/gi, "start");
    enhanced = enhanced.replace(/\bterminate\b/gi, "end");
    enhanced = enhanced.replace(/\bdemonstrate\b/gi, "show");
    enhanced = enhanced.replace(/\baccommodate\b/gi, "help");

    return enhanced;
  }

  static expandContent(text: string): string {
    let enhanced = text;

    // Add transition words between sentences
    const sentences = enhanced.split(/([.!?]+\s*)/);
    const expandedSentences = [];

    const transitions = [
      "Furthermore, ",
      "Additionally, ",
      "Moreover, ",
      "In fact, ",
      "For instance, ",
      "However, ",
      "Nevertheless, ",
      "On the other hand, ",
      "As a result, ",
      "Consequently, ",
      "Therefore, ",
      "Meanwhile, ",
    ];

    for (let i = 0; i < sentences.length; i += 2) {
      let sentence = sentences[i];
      const punctuation = sentences[i + 1] || "";

      if (sentence && sentence.trim()) {
        // Randomly add transitions to some sentences (not the first one)
        if (
          i > 0 &&
          Math.random() < 0.3 &&
          !sentence
            .trim()
            .match(
              /^(Furthermore|Additionally|Moreover|In fact|For instance|However|Nevertheless|On the other hand|As a result|Consequently|Therefore|Meanwhile)/i,
            )
        ) {
          const randomTransition =
            transitions[Math.floor(Math.random() * transitions.length)];
          sentence = sentence.trim();
          if (sentence) {
            sentence =
              randomTransition +
              sentence.charAt(0).toLowerCase() +
              sentence.slice(1);
          }
        }

        // Add elaborative phrases
        if (sentence.includes("good") && Math.random() < 0.5) {
          sentence = sentence.replace(/\bgood\b/gi, "remarkably good");
        }
        if (sentence.includes("bad") && Math.random() < 0.5) {
          sentence = sentence.replace(/\bbad\b/gi, "particularly challenging");
        }
        if (sentence.includes("interesting") && Math.random() < 0.5) {
          sentence = sentence.replace(
            /\binteresting\b/gi,
            "fascinating and thought-provoking",
          );
        }
      }

      expandedSentences.push(sentence + punctuation);
    }

    enhanced = expandedSentences.join("");

    return enhanced;
  }
}

// Fallback suggestions for when AI is unavailable
export const fallbackSuggestions = {
  dashboard: [
    "Based on your energy level today, it's a great time to tackle that important task you've been putting off.",
    "Your recent progress shows great momentum. Consider adding a new habit to build on this success.",
    "You've been consistent with your journaling. Try reflecting on your biggest win this week.",
  ],

  journal: {
    morning: [
      "What are you most grateful for this morning?",
      "What intention do you want to set for today?",
      "How do you want to show up in the world today?",
    ],
    afternoon: [
      "What's the highlight of your day so far?",
      "What challenge have you overcome today?",
      "How are you taking care of yourself today?",
    ],
    evening: [
      "What were the three best moments of today?",
      "What are you proud of accomplishing today?",
      "What are you looking forward to tomorrow?",
    ],
    creative: [
      "If you could have dinner with anyone, who would it be and what would you talk about?",
      "Describe a place that makes you feel completely at peace",
      "What story from your life would you want to share with the world?",
    ],
    reflection: [
      "What patterns do you notice in your thoughts lately?",
      "How have you changed in the past year?",
      "What values are most important to you right now?",
    ],
  },

  mood: [
    "Remember that emotions are temporary visitors - acknowledge them without judgment.",
    "Consider what activities or people tend to boost your mood consistently.",
    "Notice the small moments that bring you joy throughout the day.",
  ],

  tasks: [
    "Focus on your most important task first when your energy is highest.",
    "Break down large tasks into smaller, manageable steps.",
    "Celebrate completing tasks, no matter how small - progress is progress.",
  ],

  habits: [
    "Consistency beats perfection. Small daily actions create lasting change.",
    "Your current streak shows your commitment. Keep building on this momentum.",
    "Remember why you started this habit - your future self will thank you.",
  ],

  writing: {
    contentSuggestions: [
      "What emotions or feelings does this topic bring up for you?",
      "Can you think of a specific example or story that relates to this?",
      "How has your perspective on this changed over time?",
      "What would you want others to know about this experience?",
      "What questions does this raise for you to explore further?",
    ],
    titleSuggestions: [
      "Reflections on Today",
      "Thoughts in Motion",
      "A Moment of Clarity",
      "Today's Discovery",
      "Insights and Wanderings",
    ],
    enhancementTips: [
      "Consider adding specific details to make your writing more vivid",
      "Try connecting this idea to your personal experiences",
      "Think about breaking longer sentences into shorter, clearer ones",
      "Consider what emotions you want to convey to the reader",
    ],
  },
};

export { OpenAIService };
