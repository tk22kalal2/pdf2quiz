import { MCQFormatter } from './mcqFormatter.js';
import { APIClient } from './apiClient.js';

export async function generateMCQs(text, difficulty = 'easy') {
  const apiClient = new APIClient();
  const formatter = new MCQFormatter();
  
  try {
    const response = await apiClient.generateQuestions(text, difficulty);
    const questions = formatter.parseQuestions(response);
    
    if (!questions || questions.length === 0) {
      throw new Error('No valid questions were generated');
    }
    
    return questions;
  } catch (error) {
    console.error('MCQ generation error:', error.message);
    
    // Provide user-friendly error messages
    if (error.message.includes('No questions were generated') || 
        error.message.includes('No valid questions could be parsed')) {
      throw new Error('Unable to generate questions from the provided text. Please try uploading a different PDF or section.');
    }
    
    if (error.message.includes('API request failed')) {
      throw new Error('Unable to connect to the question generation service. Please try again in a moment.');
    }
    
    // Generic error with helpful message
    throw new Error('There was an issue generating the questions. Please try again.');
  }
}