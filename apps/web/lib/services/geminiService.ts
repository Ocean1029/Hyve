export const generateIceBreaker = async (context: string = "college students hanging out"): Promise<string> => {
  try {
    const response = await fetch('/api/generate-icebreaker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate ice breaker');
    }

    const data = await response.json();
    return data.question;
  } catch (error) {
    console.error("API Error:", error);
    return "If you could travel anywhere right now, where would you go?"; // Fallback
  }
};

export const generateChatResponse = async (
  friendName: string,
  friendBio: string,
  lastMessage: string
): Promise<string> => {
  try {
    const response = await fetch('/api/generate-chat-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ friendName, friendBio, lastMessage }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate chat response');
    }

    const data = await response.json();
    return data.replyText;
  } catch (error) {
    console.error("API Error:", error);
    return "🔥"; // Fallback
  }
};
