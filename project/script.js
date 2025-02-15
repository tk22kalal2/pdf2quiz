let extractedText = '';
let questionIndex = 0;
let allQuestions = [];

document.getElementById('extractText').addEventListener('click', async function () {
  const pdfUpload = document.getElementById('pdfUpload');
  const output = document.getElementById('textResult');
  const loader = document.getElementById('loader');
  const generateMCQsButton = document.getElementById('generateMCQs');

  if (pdfUpload.files.length === 0) {
    alert('Please upload a PDF first!');
    return;
  }

  loader.style.display = 'block';
  output.textContent = '';
  generateMCQsButton.style.display = 'none';

  const file = pdfUpload.files[0];
  const fileReader = new FileReader();

  fileReader.onload = async function (event) {
    const typedArray = new Uint8Array(event.target.result);

    try {
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      extractedText = '';

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        const imageDataURL = canvas.toDataURL();
        const { data: { text } } = await Tesseract.recognize(imageDataURL, 'eng');
        extractedText += `Page ${pageNumber}:\n${text}\n\n`;
      }

      loader.style.display = 'none';
      output.textContent = extractedText || 'No text detected in the PDF!';
      generateMCQsButton.style.display = 'block';

    } catch (error) {
      loader.style.display = 'none';
      console.error('Error:', error);
      output.textContent = 'Error processing the PDF!';
    }
  };

  fileReader.readAsArrayBuffer(file);
});

document.getElementById('generateMCQs').addEventListener('click', async function () {
  const GROQ_API_KEY = "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";
  const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
  const mcqContainer = document.getElementById('mcqContainer');
  const mcqResult = document.getElementById('mcqResult');
  const nextQuestionButton = document.getElementById('nextQuestion');

  if (!extractedText) {
    alert('No extracted text available! Please extract text first.');
    return;
  }

  mcqResult.textContent = 'Generating question...';
  mcqContainer.style.display = 'block';

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-specdec",
        stream: false,
        messages: [
          {
            role: "system",
            content: "Generate multiple-choice questions with exactly 4 options (A, B, C, D). For each question, clearly indicate the correct answer. Format each question as: 'Q: [Question]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nCorrect Answer: [A/B/C/D]'"
          },
          {
            role: "user",
            content: `Generate multiple-choice questions based on the following text:\n\n${extractedText}`
          }
        ],
        max_tokens: 8000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const mcqs = result.choices[0].message.content;

    // Parse the MCQs into structured format
    allQuestions = mcqs.split('\n\n').map(questionBlock => {
      const lines = questionBlock.split('\n');
      const question = lines[0].replace('Q: ', '');
      const options = lines.slice(1, 5).map(option => option.slice(3));
      const correctAnswer = lines[5].replace('Correct Answer: ', '');
      
      return {
        question,
        options,
        correctAnswer,
        answered: false
      };
    });

    questionIndex = 0;
    displayQuestion(mcqResult, nextQuestionButton);

  } catch (error) {
    mcqResult.textContent = 'Error generating questions!';
    console.error('Error:', error);
  }
});

function createOptionButton(option, index, correctAnswer) {
  const button = document.createElement('button');
  button.className = 'option-button';
  button.textContent = `${String.fromCharCode(65 + index)}) ${option}`;
  
  button.addEventListener('click', function() {
    if (!allQuestions[questionIndex].answered) {
      allQuestions[questionIndex].answered = true;
      const isCorrect = String.fromCharCode(65 + index) === correctAnswer;
      
      // Disable all options after selection
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
  });
  
  return button;
}

function displayQuestion(mcqResult, nextQuestionButton) {
  mcqResult.innerHTML = ''; // Clear previous question
  
  if (questionIndex < allQuestions.length) {
    const currentQuestion = allQuestions[questionIndex];
    
    // Create question element
    const questionElement = document.createElement('div');
    questionElement.className = 'question';
    questionElement.textContent = `Question ${questionIndex + 1}: ${currentQuestion.question}`;
    mcqResult.appendChild(questionElement);
    
    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    
    // Create option buttons
    currentQuestion.options.forEach((option, index) => {
      const optionButton = createOptionButton(option, index, currentQuestion.correctAnswer);
      optionsContainer.appendChild(optionButton);
    });
    
    mcqResult.appendChild(optionsContainer);
    nextQuestionButton.style.display = 'block';
    
    // Update next button text for last question
    nextQuestionButton.textContent = questionIndex === allQuestions.length - 1 ? 'Finish' : 'Next Question';
    
    nextQuestionButton.onclick = () => {
      questionIndex++;
      displayQuestion(mcqResult, nextQuestionButton);
    };
  } else {
    mcqResult.textContent = 'Quiz completed!';
    nextQuestionButton.style.display = 'none';
  }
}