import { ProgressManager } from './progressManager.js';
import { showErrorPopup, showInfoPopup } from './popupManager.js';

export async function getTotalPages(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;
    return pdf.numPages;
  } catch (error) {
    showErrorPopup('Failed to get total pages');
    throw error;
  }
}

export async function extractTextFromPDF(file, currentPage) {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;
    
    showInfoPopup(`Processing page ${currentPage}`);
    
    const page = await pdf.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const imageDataURL = canvas.toDataURL();
    
    const result = await Tesseract.recognize(
      imageDataURL,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            const progressPercent = Math.round(m.progress * 100);
            showInfoPopup(`OCR Progress: ${progressPercent}%`);
          }
        }
      }
    );

    if (!result?.data?.text) {
      throw new Error('OCR failed to extract text');
    }
    
    return result.data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    let errorMessage = 'Failed to process the PDF.';
    
    if (error.name === 'PasswordException') {
      errorMessage = 'This PDF is password protected. Please provide an unprotected PDF.';
    } else if (error.name === 'InvalidPDFException') {
      errorMessage = 'This file is not a valid PDF. Please check the file and try again.';
    } else if (error.message.includes('OCR failed')) {
      errorMessage = 'Failed to extract text from the PDF. The page might be empty or contain unrecognizable text.';
    }

    showErrorPopup(errorMessage);
    throw new Error(errorMessage);
  }
}