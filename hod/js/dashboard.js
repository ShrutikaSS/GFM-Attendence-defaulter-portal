document.addEventListener('DOMContentLoaded', async () => {
  const shell = document.querySelector('.app-shell');
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.querySelector('.menu-toggle');
  const loading = document.querySelector('.page-loading');
  const revealItems = document.querySelectorAll('.reveal');

  if (loading) {
    loading.style.display = 'block';
    setTimeout(() => {
      loading.style.display = 'none';
      revealItems.forEach((item) => item.classList.add('visible'));
    }, 600);
  }

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('is-collapsed');
    });
  }

  if (shell) {
    shell.addEventListener('click', (event) => {
      if (window.innerWidth <= 860 && sidebar && !sidebar.classList.contains('is-collapsed')) {
        const clickedInsideSidebar = sidebar.contains(event.target);
        if (!clickedInsideSidebar) {
          sidebar.classList.add('is-collapsed');
        }
      }
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.14 });

  revealItems.forEach((item) => observer.observe(item));

  // Retrieve active session user
  let user = null;
  let csrfToken = null;
  const storedUser = sessionStorage.getItem('attendance_user') || localStorage.getItem('attendance_user');
  if (storedUser) {
    try { user = JSON.parse(storedUser); } catch(e) {}
  }

  async function syncSessionContext() {
    try {
      const res = await fetch('../api/session.php', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          user = data.user;
          csrfToken = data.csrf_token || null;
          sessionStorage.setItem('attendance_user', JSON.stringify(user));
        }
      }
    } catch(e) {}
  }

  await syncSessionContext();

  if (user) {
    // Update HOD Name in Sidebar & Greetings
    const profileMetaH2 = document.querySelector('.sidebar-profile .profile-meta h2');
    if (profileMetaH2) profileMetaH2.textContent = user.full_name;

    const profileBadge = document.querySelector('.sidebar-profile .profile-badge');
    if (profileBadge) profileBadge.textContent = user.role.toUpperCase();

    const welcomeH1 = document.querySelector('.welcome-card h1');
    if (welcomeH1) welcomeH1.textContent = `Welcome, ${user.full_name}`;

    // Profile Page specific elements
    const profileCardH2 = document.querySelector('.profile-details h2');
    if (profileCardH2) profileCardH2.textContent = user.full_name;

    const profileEmail = document.querySelector('.profile-details p:nth-of-type(2)');
    if (profileEmail && profileEmail.innerHTML.includes('fa-envelope')) {
      profileEmail.innerHTML = `<i class="fa-solid fa-envelope"></i> ${user.email}`;
    }

    const profileDept = document.querySelector('.profile-details p:nth-of-type(3)');
    if (profileDept && profileDept.innerHTML.includes('fa-building-columns') && user.department) {
      profileDept.innerHTML = `<i class="fa-solid fa-building-columns"></i> ${user.department}`;
    }
  }

  // Fetch Dashboard Stats if on main dashboard page
  if (document.getElementById('hodTotalStudents')) {
    try {
      const res = await fetch('../api/get_hod_dashboard.php');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const stats = result.data;
          document.getElementById('hodTotalStudents').textContent = stats.totalStudents;
          document.getElementById('hodTotalFaculty').textContent = stats.totalFaculty;
          document.getElementById('hodTotalClasses').textContent = stats.totalClasses;
          document.getElementById('hodAttendancePct').textContent = stats.overallAttendance;
          document.getElementById('hodDefaulters').textContent = stats.defaulters;
          document.getElementById('hodPendingReports').textContent = stats.pendingReports;
        }
      }
    } catch(err) {
      console.error("Error loading HOD stats from backend:", err);
    }
  }

  function buildNoticeCard(notice) {
    const card = document.createElement('article');
    card.className = 'notice-card reveal visible dashboard-notice-card';

    const meta = document.createElement('div');
    meta.className = 'notice-card-meta';

    const chip = document.createElement('span');
    chip.className = 'notice-target-chip';
    chip.textContent = notice.target || 'General';

    const date = document.createElement('small');
    date.textContent = `${notice.date || 'Recently'} • ${notice.created_by_name || 'Department Admin'}`;

    meta.append(chip, date);

    const title = document.createElement('h3');
    title.textContent = notice.title || 'Untitled Notice';

    const message = document.createElement('p');
    message.className = 'dashboard-notice-message';
    message.textContent = notice.message || 'No message available.';

    const footer = document.createElement('div');
    footer.className = 'dashboard-notice-footer';

    const syncState = document.createElement('span');
    syncState.className = 'dashboard-notice-sync';
    syncState.textContent = notice.target === 'All Batches' || notice.target === 'ALL'
      ? 'Visible on public notice board'
      : 'Internal targeted notice';

    footer.appendChild(syncState);

    card.append(meta, title, message, footer);
    return card;
  }

  function renderHodNotices(notices) {
    const list = document.getElementById('hodNoticeList');
    if (!list) return;

    list.replaceChildren();

    if (!Array.isArray(notices) || notices.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'notice-empty';
      emptyState.textContent = 'No notices have been published yet.';
      list.appendChild(emptyState);
      return;
    }

    notices.forEach((notice) => {
      list.appendChild(buildNoticeCard(notice));
    });
  }

  async function loadHodNotices() {
    const list = document.getElementById('hodNoticeList');
    if (!list) return;

    try {
      const res = await fetch('../api/get_notices.php?scope=all&limit=20', {
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Unable to load notices');
      }

      const data = await res.json();
      renderHodNotices(data.notices || []);
    } catch (err) {
      const fallback = document.createElement('div');
      fallback.className = 'notice-empty';
      fallback.textContent = 'Unable to load notices right now.';
      list.replaceChildren(fallback);
    }
  }

  const hodNoticeForm = document.getElementById('hodNoticeForm');
  if (hodNoticeForm) {
    await loadHodNotices();

    hodNoticeForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const titleInput = document.getElementById('hodNoticeTitle');
      const targetInput = document.getElementById('hodNoticeTarget');
      const messageInput = document.getElementById('hodNoticeMessage');

      const title = titleInput?.value.trim() || '';
      const target = targetInput?.value.trim() || 'All Batches';
      const message = messageInput?.value.trim() || '';

      if (!title || !message) {
        return;
      }

      if (!csrfToken) {
        await syncSessionContext();
      }

      try {
        const res = await fetch('../api/publish_notice.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-Token': csrfToken || ''
          },
          body: JSON.stringify({ title, target, message })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          showToast(data.message || 'Failed to publish notice.', 'danger');
          return;
        }

        hodNoticeForm.reset();
        await loadHodNotices();
        showToast('Notice published successfully!');
      } catch (err) {
        showToast('Unable to publish notice right now.', 'danger');
      }
    });
  }

  // Logout Handler
  const logoutLinks = document.querySelectorAll('a[href*="index.html"], .logout-btn, #logoutBtn');
  logoutLinks.forEach(link => {
    if (link.textContent.toLowerCase().includes('logout') || link.id === 'logoutBtn') {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to log out from GFM Portal?')) {
          sessionStorage.clear();
          localStorage.clear();
          try {
            await fetch('../api/logout.php');
          } catch(err) {}
          window.location.href = '../login.html';
        }
  });


});
