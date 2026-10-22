import { RequestHandler } from "express";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const handleOpenAI: RequestHandler = async (req, res) => {
  // Set CORS headers
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    if (!OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, returning fallback response');
      return res.status(200).json({
        content: generateFallbackResponse(body.messages),
        fallback: true
      });
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: body.model || 'gpt-3.5-turbo',
        messages: body.messages || [],
        max_tokens: body.max_tokens || 150,
        temperature: body.temperature || 0.7
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log('OpenAI rate limit exceeded, returning fallback response');
        return res.status(200).json({
          content: generateFallbackResponse(body.messages),
          fallback: true
        });
      }
      const errorData = await response.json().catch(() => ({}));
      console.log('OpenAI API error:', errorData);
      return res.status(200).json({
        content: generateFallbackResponse(body.messages),
        fallback: true
      });
    }

    const data = await response.json();

    return res.status(200).json({
      content: data.choices[0]?.message?.content || 'No response generated',
      usage: data.usage
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return res.status(200).json({
      content: generateFallbackResponse(req.body.messages),
      fallback: true
    });
  }
};

function generateFallbackResponse(messages: Array<{role: string, content: string}>): string {
  const lastMessage = messages?.[messages.length - 1]?.content?.toLowerCase() || '';

  // Dashboard suggestions
  if (lastMessage.includes('productivity') || lastMessage.includes('suggestion')) {
    const suggestions = [
      "Focus on your most important task first when your energy is highest.",
      "Break down large projects into smaller, manageable steps you can complete today.",
      "Take regular breaks to maintain your focus and avoid burnout.",
      "Review your recent accomplishments to build momentum for what's next.",
      "Consider what habits would support your current goals."
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  // Journal prompts
  if (lastMessage.includes('journal') || lastMessage.includes('prompt')) {
    const prompts = [
      "What are you most grateful for today?",
      "What challenge helped you grow recently?",
      "What small win can you celebrate right now?",
      "How do you want to show up in the world today?",
      "What pattern in your life would you like to change?"
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  // Mood insights
  if (lastMessage.includes('mood') || lastMessage.includes('feeling')) {
    const insights = [
      "Remember that emotions are temporary visitors - acknowledge them without judgment.",
      "Consider what activities or people consistently boost your mood.",
      "Notice the small moments throughout your day that bring you joy.",
      "Your feelings are valid and provide valuable information about your needs."
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  }

  // Task suggestions
  if (lastMessage.includes('task') || lastMessage.includes('focus')) {
    const taskTips = [
      "Start with the task that requires your highest mental energy.",
      "Use the 2-minute rule: if it takes less than 2 minutes, do it now.",
      "Choose one important task to complete before checking messages or social media.",
      "Consider batching similar tasks together for better efficiency."
    ];
    return taskTips[Math.floor(Math.random() * taskTips.length)];
  }

  // Habit motivation
  if (lastMessage.includes('habit') || lastMessage.includes('streak')) {
    const motivation = [
      "Consistency beats perfection. Small daily actions create lasting change.",
      "Your current streak shows your commitment. Keep building on this momentum.",
      "Focus on the process, not the outcome. Each day you practice, you're growing.",
      "Remember why you started this habit - your future self will thank you."
    ];
    return motivation[Math.floor(Math.random() * motivation.length)];
  }

  // Default response
  return "Stay focused on what matters most to you today. Small, consistent steps lead to meaningful progress.";
}
