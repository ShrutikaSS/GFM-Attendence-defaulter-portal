document.addEventListener('DOMContentLoaded', async () => {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  if (header) {
    header.innerHTML = `
      <nav class="navbar">
        <a class="brand" href="index.html">
          <span class="brand-mark" id="brandMarkBtn" style="cursor: pointer; transition: transform 0.2s ease; background: transparent; box-shadow: none; display: block; overflow: hidden;" title="Click to view Zeal College Logo">
            <img src="images/college-logo.jpg" alt="Zeal Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </span>
          <span>Student Attendance Management System</span>
        </a>
        <button class="menu-toggle" aria-label="Toggle navigation">☰</button>
        <div class="nav-links">
          <a href="home.html" class="${currentPage === 'home.html' ? 'active' : ''}">Home</a>
          <a href="defaulter.html" class="${currentPage === 'defaulter.html' ? 'active' : ''}">Defaulter Criteria</a>
          <a href="notice.html" class="${currentPage === 'notice.html' ? 'active' : ''}">Notice</a>
          <a href="about.html" class="${currentPage === 'about.html' ? 'active' : ''}">About</a>
          <a href="help.html" class="${currentPage === 'help.html' ? 'active' : ''}">Help</a>
          <a class="nav-btn" href="login.html">Login</a>
        </div>
      </nav>
    `;

    // Append College Logo Modal
    const modalHTML = `
      <div id="collegeLogoModal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;">
        <div style="background: white; border-radius: 20px; padding: 30px; max-width: 420px; width: 90%; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.3); text-align: center; position: relative; transform: scale(0.9); transition: transform 0.3s ease;" id="logoModalContent">
          <button id="closeLogoModalBtn" style="position: absolute; top: 14px; right: 18px; border: none; background: transparent; font-size: 1.8rem; cursor: pointer; color: #94a3b8; transition: color 0.2s;" onmouseover="this.style.color='#475569'" onmouseout="this.style.color='#94a3b8'">&times;</button>
          <img src="images/college-logo.jpg" alt="Zeal College Logo" style="width: 200px; height: auto; margin-bottom: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" />
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.4rem; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">Zeal Education Society</h3>
          <p style="font-family: 'Inter', sans-serif; font-size: 0.95rem; color: #475569; margin: 0 0 4px 0; font-weight: 600;">Zeal College of Engineering and Research</p>
          <p style="font-family: 'Inter', sans-serif; font-size: 0.85rem; color: #94a3b8; margin: 0;">Narhe, Pune • Estd. 1996</p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const brandMarkBtn = document.getElementById('brandMarkBtn');
    const logoModal = document.getElementById('collegeLogoModal');
    const logoContent = document.getElementById('logoModalContent');
    const closeBtn = document.getElementById('closeLogoModalBtn');

    if (brandMarkBtn && logoModal) {
      brandMarkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        logoModal.style.opacity = '1';
        logoModal.style.pointerEvents = 'auto';
        logoContent.style.transform = 'scale(1)';
      });

      const closeModal = () => {
        logoModal.style.opacity = '0';
        logoModal.style.pointerEvents = 'none';
        logoContent.style.transform = 'scale(0.9)';
      };

      closeBtn.addEventListener('click', closeModal);
      logoModal.addEventListener('click', (e) => {
        if (e.target === logoModal) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && logoModal.style.opacity === '1') closeModal();
      });

      brandMarkBtn.addEventListener('mouseenter', () => {
        brandMarkBtn.style.transform = 'scale(1.08)';
      });
      brandMarkBtn.addEventListener('mouseleave', () => {
        brandMarkBtn.style.transform = 'scale(1)';
      });
    }
  }

  if (footer) {
    footer.innerHTML = `
      <div class="footer-grid">
        <div>
          <h3>College Name</h3>
          <p>Zeal College Of Engineering And Research</p>
          <p>Department of Academic Administration</p>
          <div class="socials">
            <a href="#">f</a>
            <a href="#">in</a>
            <a href="#">x</a>
          </div>
        </div>
        <div>
          <h3>Quick Links</h3>
          <ul>
            <li><a href="home.html">Home</a></li>
            <li><a href="defaulter.html">Defaulter Criteria</a></li>
            <li><a href="notice.html">Notice</a></li>
          </ul>
        </div>
        <div>
          <h3>Privacy</h3>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3>Contact</h3>
          <ul>
            <li>support@collegeportal.edu</li>
            <li>+91 98765 43210</li>
            <li>© 2026 College Portal</li>
          </ul>
        </div>
      </div>
    `;
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.16 });

  revealItems.forEach((item) => observer.observe(item));

  const counters = document.querySelectorAll('.counter');
  counters.forEach((counter) => {
    const target = Number(counter.dataset.target || 0);
    const suffix = counter.dataset.suffix || '';
    let current = 0;
    const duration = 1200;
    const stepTime = 30;
    const steps = Math.ceil(duration / stepTime);
    const increment = target / steps;

    const tick = () => {
      current += increment;
      if (current < target) {
        counter.textContent = `${Math.ceil(current)}${suffix}`;
        setTimeout(tick, stepTime);
      } else {
        counter.textContent = `${target}${suffix}`;
      }
    };

    tick();
  });

  function buildNoticeCard(notice) {
    const card = document.createElement('article');
    card.className = 'notice-card reveal visible notice-stream-card';

    const meta = document.createElement('div');
    meta.className = 'notice-meta';

    const label = document.createElement('span');
    label.className = 'notice-type-badge';
    label.textContent = 'Public Notice';

    const title = document.createElement('h3');
    title.textContent = notice.title || 'Untitled Notice';

    const date = document.createElement('span');
    date.textContent = notice.date || 'Recently';

    const metaText = document.createElement('div');
    metaText.className = 'notice-heading-block';
    metaText.append(label, title);

    meta.append(metaText, date);

    const target = document.createElement('p');
    target.className = 'notice-target';
    target.textContent = notice.target || 'All Batches';

    const message = document.createElement('p');
    message.className = 'notice-message';
    message.textContent = notice.message || 'No notice details available.';

    const footer = document.createElement('div');
    footer.className = 'notice-footer';

    const author = document.createElement('span');
    author.className = 'notice-author';
    author.textContent = notice.created_by_name || 'Department Admin';

    const status = document.createElement('span');
    status.className = 'notice-status';
    status.textContent = 'Synced from HOD';

    footer.append(author, status);

    card.append(meta, target, message, footer);
    return card;
  }

  function renderNoticeCollection(container, notices, emptyMessage) {
    if (!container) return;

    container.replaceChildren();

    if (!Array.isArray(notices) || notices.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = emptyMessage;
      container.appendChild(empty);
      return;
    }

    notices.forEach((notice) => {
      container.appendChild(buildNoticeCard(notice));
    });
  }

  async function loadPublicNotices() {
    const landingList = document.getElementById('landingNoticeList');
    const publicList = document.getElementById('publicNoticeList');

    if (!landingList && !publicList) {
      return;
    }

    try {
      if (landingList) {
        const res = await fetch('api/get_notices.php?scope=public&limit=3', {
          headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        renderNoticeCollection(landingList, data.notices || [], 'No public notices are available yet.');
      }

      if (publicList) {
        const res = await fetch('api/get_notices.php?scope=public&limit=12', {
          headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        renderNoticeCollection(publicList, data.notices || [], 'No public notices are available yet.');
      }
    } catch (error) {
      renderNoticeCollection(landingList, [], 'Unable to load notices right now.');
      renderNoticeCollection(publicList, [], 'Unable to load notices right now.');
    }
  }

  await loadPublicNotices();
});
