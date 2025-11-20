import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Conpx @yashkhare0/voko-cli-clipboard functionality
  const setupCopyButtons = (selector: string) => {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const text = btn.getAttribute('data-clipboard');
        if (!text) return;

        try {
          await navigator.clipboard.writeText(text);

          const originalContent = btn.innerHTML;
          const isIconOnly = btn.classList.contains('copy-btn-mini');

          btn.innerHTML = isIconOnly
            ? '<i class="fas fa-check"></i>'
            : '<i class="fas fa-check"></i> Copied';
          btn.classList.add('copied');

          setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    });
  };

  setupCopyButtons('.copy-btn');
  setupCopyButtons('.copy-btn-mini');
  setupCopyButtons('#copy-install');

  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

      // Add active class to clicked tab
      tab.classList.add('active');

      // Show corresponding content
      const tabId = tab.getAttribute('data-tab');
      if (tabId) {
        document.getElementById(tabId)?.classList.add('active');
      }
    });
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLAnchorElement;
      const href = target.getAttribute('href');
      if (href) {
        const target = document.querySelector(href);
        if (target) {
          const headerOffset = 80; // Height of fixed navbar
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }
    });
  });
});
