export class MCQFormatter {
  parseQuestions(mcqsText) {
    try {
      // Split by double newlines and filter empty blocks
      const questionBlocks = mcqsText.split(/\n\n+/).filter(block => block.trim());
      
      if (questionBlocks.length === 0) {
        throw new Error('No questions were generated');
      }

      const questions = [];
      let currentBlock = '';
      
      // Combine blocks into complete questions
      for (const block of questionBlocks) {
        currentBlock += block + '\n\n';
        if (block.toLowerCase().includes('correct answer')) {
          try {
            const question = this.parseQuestionBlock(currentBlock.trim());
            if (question) {
              questions.push(question);
            }
            currentBlock = '';
          } catch (error) {
            console.warn('Question parse error:', error.message);
          }
        }
      }

      if (questions.length === 0) {
        throw new Error('No valid questions could be parsed');
      }

      return questions;
    } catch (error) {
      console.error('Parsing error:', error.message, '\nRaw text:', mcqsText);
      throw error;
    }
  }

  parseQuestionBlock(block) {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line);
    
    // Extract question
    const questionLine = lines.find(line => line.startsWith('Q:'));
    if (!questionLine) {
      throw new Error('Question not found');
    }
    const question = questionLine.substring(2).trim();

    // Extract options
    const options = [];
    const optionLines = lines.filter(line => /^[A-D]\)/.test(line));
    
    if (optionLines.length !== 4) {
      throw new Error(`Invalid number of options: ${optionLines.length}`);
    }

    optionLines.forEach(line => {
      const option = line.replace(/^[A-D]\)\s*/, '').trim();
      options.push(option);
    });

    // Extract correct answer
    const answerLine = lines.find(line => /correct answer:\s*[A-D]/i.test(line));
    if (!answerLine) {
      throw new Error('Correct answer not found');
    }

    const answerMatch = answerLine.match(/:\s*([A-D])/i);
    if (!answerMatch) {
      throw new Error('Invalid answer format');
    }

    return {
      question,
      options,
      correctAnswer: answerMatch[1].toUpperCase(),
      answered: false
    };
  }
}