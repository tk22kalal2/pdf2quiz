import { extractTextFromPDF, getTotalPages } from './utils/pdfExtractor.js';
import { generateMCQs } from './utils/mcqGenerator.js';
import { createQuestionDisplay } from './components/QuestionDisplay.js';
import { ProgressManager } from './utils/progressManager.js';
import { showErrorPopup, showInfoPopup } from './utils/popupManager.js';

let currentPage = 1;
let totalPages = 0;
let questionIndex = 0;
let currentPageQuestions = [];
let currentDifficulty = 'easy'; // Add difficulty tracking
const progress = new ProgressManager();

async function processPage(file, difficulty) {
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';
    }

    progress.updateStep(1, `Processing page ${currentPage} of ${totalPages}`);
    const pageText = await extractTextFromPDF(file, currentPage);
    
    if (!pageText || pageText.trim() === '') {
      throw new Error('No text could be extracted from the page');
    }

    progress.updateStep(2, 'Generating questions...');
    const questions = await generateMCQs(pageText, difficulty);
    
    if (!questions || questions.length === 0) {
      throw new Error('No questions could be generated from the extracted text');
    }

    currentPageQuestions = questions;
    
    progress.updateStep(3, `Generated ${questions.length} questions from page ${currentPage}`);
    questionIndex = 0;
    displayQuestion();
    
    return questions.length;
  } catch (error) {
    console.error('Page processing error:', error);
    progress.error(error.message);
    throw error;
  }
}

async function handleQuizGeneration(difficulty) {
  const pdfUpload = document.getElementById('pdfUpload');
  const mcqContainer = document.getElementById('mcqContainer');
  const file = pdfUpload.files[0];
  
  if (!file) {
    showErrorPopup('Please upload a PDF first!');
    return;
  }

  if (file.type !== 'application/pdf') {
    showErrorPopup('Please upload a valid PDF file');
    return;
  }

  try {
    currentDifficulty = difficulty; // Store the difficulty level
    mcqContainer.style.display = 'none';
    progress.start();
    
    totalPages = await getTotalPages(file);
    
    if (totalPages === 0) {
      throw new Error('The PDF file appears to be empty');
    }
    
    showInfoPopup(`PDF has ${totalPages} pages. Starting processing...`);
    currentPage = 1;
    
    const questionCount = await processPage(file, difficulty);
    showInfoPopup(`Generated ${questionCount} questions from page 1`);
    
    mcqContainer.style.display = 'block';
  } catch (error) {
    console.error('Quiz generation error:', error);
    showErrorPopup(error.message);
    progress.error(error.message);
  }
}

document.getElementById('generateEasyQuiz').addEventListener('click', () => handleQuizGeneration('easy'));
document.getElementById('generateHardQuiz').addEventListener('click', () => handleQuizGeneration('hard'));

function displayQuestion() {
  const mcqResult = document.getElementById('mcqResult');
  const nextQuestionButton = document.getElementById('nextQuestion');
  mcqResult.innerHTML = '';
  
  if (questionIndex < currentPageQuestions.length) {
    const questionDisplay = createQuestionDisplay(
      currentPageQuestions[questionIndex],
      questionIndex,
      handleOptionSelect
    );
    mcqResult.appendChild(questionDisplay);
    
    const isLastQuestionOnPage = questionIndex === currentPageQuestions.length - 1;
    const hasMorePages = currentPage < totalPages;
    
    nextQuestionButton.style.display = 'block';
    nextQuestionButton.textContent = isLastQuestionOnPage
      ? (hasMorePages ? 'Next Page' : 'Finish Quiz')
      : 'Next Question';
    
    nextQuestionButton.onclick = async () => {
      if (isLastQuestionOnPage && hasMorePages) {
        currentPage++;
        try {
          const file = document.getElementById('pdfUpload').files[0];
          // Pass the stored difficulty level for next page
          const questionCount = await processPage(file, currentDifficulty);
          showInfoPopup(`Generated ${questionCount} questions from page ${currentPage}`);
        } catch (error) {
          console.error('Error processing next page:', error);
          showErrorPopup('Failed to process next page: ' + error.message);
        }
      } else if (!isLastQuestionOnPage) {
        questionIndex++;
        displayQuestion();
      } else {
        mcqResult.textContent = 'Quiz completed!';
        nextQuestionButton.style.display = 'none';
        showInfoPopup('Quiz completed! Great job!');
      }
    };
  } else {
    mcqResult.textContent = 'Quiz completed!';
    nextQuestionButton.style.display = 'none';
    showInfoPopup('Quiz completed! Great job!');
  }
}

function handleOptionSelect(button, selectedIndex, correctAnswer) {
  if (!currentPageQuestions[questionIndex].answered) {
    currentPageQuestions[questionIndex].answered = true;
    const isCorrect = String.fromCharCode(65 + selectedIndex) === correctAnswer;
    
    const allButtons = document.querySelectorAll('.option-button');
    allButtons.forEach(btn => {
      btn.disabled = true;
      if (btn === button) {
        btn.classList.add(isCorrect ? 'correct' : 'incorrect');
      } else if (String.fromCharCode(65 + Array.from(allButtons).indexOf(btn)) === correctAnswer) {
        btn.classList.add('correct');
      }
    });
  }
}