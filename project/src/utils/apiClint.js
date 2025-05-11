const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export class APIClient {
  async generateQuestions(text) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "Generate multiple-choice questions with exactly 4 options (A, B, C, D). For each question, clearly indicate the correct answer. Format each question as: 'Q: [Question]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nCorrect Answer: [A/B/C/D]'"
            },
            {
              role: "user",
              content: `Generate multiple-choice questions based on the following text:\n\n${text}`
            }
          ],
          max_tokens: 8000,
          temperature: 0.9
        })
      });

      if (!response.ok) {
        const error = new Error('API request failed');
        error.response = response;
        throw error;
      }

      const result = await response.json();
      
      if (!result.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response format');
      }

      return result.choices[0].message.content;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your internet connection.');
      }
      throw error;
    }
  }
}
