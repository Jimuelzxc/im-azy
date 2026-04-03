function createFloatingButton() {
  const btn = document.createElement('button');
  btn.className = 'azy-floating-button';
  btn.setAttribute('aria-label', 'Ask Azy');
  btn.innerHTML = `
    <span class="azy-icon" aria-hidden="true">*</span>
    <span class="azy-button-text">Ask azy</span>
  `;
  document.body.appendChild(btn);
  return btn;
}
