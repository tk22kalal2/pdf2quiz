// Popup creation and management
function createPopup(type) {
  const popup = document.createElement('div');
  popup.className = `popup ${type}-popup`;
  
  const content = document.createElement('div');
  content.className = 'popup-content';
  popup.appendChild(content);
  
  document.body.appendChild(popup);
  return { popup, content };
}

// Show error popup with details
export function showErrorPopup(message, details = []) {
  const { popup, content } = createPopup('error');
  
  const title = document.createElement('h3');
  title.textContent = 'Error';
  content.appendChild(title);
  
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  content.appendChild(messageElement);
  
  if (details.length > 0) {
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'error-details';
    
    const list = document.createElement('ul');
    details.forEach(detail => {
      const li = document.createElement('li');
      li.textContent = detail;
      list.appendChild(li);
    });
    
    detailsContainer.appendChild(list);
    content.appendChild(detailsContainer);
  }
  
  const button = document.createElement('button');
  button.textContent = 'Close';
  button.onclick = () => document.body.removeChild(popup);
  content.appendChild(button);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(popup)) {
      document.body.removeChild(popup);
    }
  }, 5000);
}

// Show info popup for status updates
export function showInfoPopup(message) {
  const { popup, content } = createPopup('info');
  content.textContent = message;
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (document.body.contains(popup)) {
      document.body.removeChild(popup);
    }
  }, 3000);
}