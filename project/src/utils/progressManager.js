export class ProgressManager {
  constructor() {
    this.processingStatus = document.getElementById('processingStatus');
    this.processingText = document.getElementById('processingText');
    this.successMessage = document.getElementById('successMessage');
    this.progressSteps = document.querySelector('.progress-steps');
  }

  start() {
    this.processingStatus.style.display = 'block';
    this.successMessage.style.display = 'none';
    this.updateStep(1, 'Extracting text from PDF...');
  }

  updateStep(step, message) {
    const steps = document.querySelectorAll('.step');
    steps.forEach(s => {
      const stepNum = parseInt(s.dataset.step);
      s.classList.remove('active', 'completed');
      if (stepNum < step) {
        s.classList.add('completed');
      } else if (stepNum === step) {
        s.classList.add('active');
      }
    });
    this.processingText.textContent = message;
  }

  startPDFProcessing(totalPages) {
    this.progressSteps.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const step = document.createElement('div');
      step.className = 'step';
      step.dataset.step = i;
      step.textContent = i;
      this.progressSteps.appendChild(step);
    }
    this.updatePDFProgress(1, totalPages);
  }

  updatePDFProgress(currentPage, totalPages) {
    const steps = document.querySelectorAll('.step');
    steps.forEach(s => {
      const stepNum = parseInt(s.dataset.step);
      s.classList.remove('active', 'completed');
      if (stepNum < currentPage) {
        s.classList.add('completed');
      } else if (stepNum === currentPage) {
        s.classList.add('active');
      }
    });
    this.processingText.textContent = `Processing page ${currentPage}/${totalPages}`;
  }

  complete() {
    const steps = document.querySelectorAll('.step');
    steps.forEach(s => s.classList.add('completed'));
    this.processingText.textContent = 'Processing complete!';
    this.successMessage.style.display = 'block';
    setTimeout(() => {
      this.processingStatus.style.display = 'none';
    }, 2000);
  }

  error(message) {
    this.processingText.textContent = `Error: ${message}`;
    this.processingText.style.color = '#dc3545';
    setTimeout(() => {
      this.processingStatus.style.display = 'none';
      this.processingText.style.color = '#666';
    }, 3000);
  }
}