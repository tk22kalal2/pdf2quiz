const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export class APIClient {
  async generateQuestions(text, difficulty = 'easy') {
    const systemPrompt = difficulty === 'hard' 
      ? "You are an expert medical educator specializing in NEET PG exam preparation. Generate challenging clinical-based multiple-choice questions (MCQs) that test advanced medical concepts. Each question MUST follow this EXACT format:\n\nQ: [Clinical Scenario]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nCorrect Answer: [A/B/C/D]"
      : "Generate multiple-choice questions. Each question MUST follow this EXACT format:\n\nQ: [Question]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nCorrect Answer: [A/B/C/D]";

    const userPrompt = `Generate ${difficulty === 'hard' ? 'clinical-based NEET PG style' : 'basic'} questions based on this text:\n\n${text}`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          max_tokens: 8000,
          temperature: difficulty === 'hard' ? 0.8 : 0.9
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response format');
      }

      return result.choices[0].message.content;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}