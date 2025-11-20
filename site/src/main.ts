import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Copy to clipboard functionality
  const copyButtons = document.querySelectorAll('.copy-btn');
  const heroCopyBtn = document.getElementById('copy-install');

  const copyToClipboard = async (text: string, btn: HTMLElement) => {
    try {
      await navigator.clipboard.writeText(text);

      const originalIcon = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      btn.classList.add('copied');

      setTimeout(() => {
        btn.innerHTML = originalIcon;
        btn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  copyButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-clipboard');
      if (text) copyToClipboard(text, btn as HTMLElement);
    });
  });

  if (heroCopyBtn) {
    heroCopyBtn.addEventListener('click', () => {
      copyToClipboard('npx voko init', heroCopyBtn);
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const href = (this as HTMLAnchorElement).getAttribute('href');
      if (href) {
        document.querySelector(href)?.scrollIntoView({
          behavior: 'smooth',
        });
      }
    });
  });
});
