export function createQuestionDisplay(question, index, onOptionSelect) {
  const container = document.createElement('div');
  
  const questionElement = document.createElement('div');
  questionElement.className = 'question';
  questionElement.textContent = `Question ${index + 1}: ${question.question}`;
  container.appendChild(questionElement);
  
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'options-container';
  
  question.options.forEach((option, optionIndex) => {
    const button = createOptionButton(option, optionIndex, question.correctAnswer, onOptionSelect);
    optionsContainer.appendChild(button);
  });
  
  container.appendChild(optionsContainer);
  return container;
}

function createOptionButton(option, index, correctAnswer, onSelect) {
  const button = document.createElement('button');
  button.className = 'option-button';
  button.textContent = `${String.fromCharCode(65 + index)}) ${option}`;
  
  button.addEventListener('click', () => onSelect(button, index, correctAnswer));
  
  return button;
}