/**
 * GFM Attendance Management System - Main Dashboard Logic
 * Handles tab navigation, interactive student roster, attendance marking,
 * defaulter warning triggers, Chart.js graphs, theme switcher, and notifications.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ==========================================
  // 1. STATE & USER SESSION INITIALIZATION
  // ==========================================
  let csrfToken = null;
  let currentUser = {
    id: 1,
    full_name: 'Prof. Aniket Verma',
    email: 'gfm@college.edu',
    role: 'gfm',
    department: 'Computer Engineering',
    roll_or_emp_id: 'GFM-204'
  };

  const storedUser = sessionStorage.getItem('attendance_user') || localStorage.getItem('attendance_user');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed && parsed.full_name) {
        currentUser = parsed;
      }
    } catch(e) {}
  }

  async function syncSessionContext() {
    try {
      const res = await fetch('../api/session.php', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          currentUser = data.user;
          csrfToken = data.csrf_token || null;
          sessionStorage.setItem('attendance_user', JSON.stringify(currentUser));
        }
      }
    } catch(e) {}
  }

  await syncSessionContext();

  // Populate User Information in UI
  function updateUserInfoUI() {
    const initials = currentUser.full_name
      ? currentUser.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'AV';

    // Text Content updates
    const heroName = document.getElementById('heroUserName');
    if (heroName) heroName.textContent = currentUser.full_name;

    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName) sidebarName.textContent = currentUser.full_name;

    const sidebarRole = document.getElementById('sidebarUserRole');
    if (sidebarRole) sidebarRole.textContent = `${currentUser.department} (GFM)`;

    const topNavName = document.getElementById('topNavName');
    if (topNavName) topNavName.textContent = currentUser.full_name;

    const dropdownName = document.getElementById('dropdownName');
    if (dropdownName) dropdownName.textContent = currentUser.full_name;

    const dropdownEmail = document.getElementById('dropdownEmail');
    if (dropdownEmail) dropdownEmail.textContent = currentUser.email;

    const profFullNameText = document.getElementById('profFullNameText');
    if (profFullNameText) profFullNameText.textContent = currentUser.full_name;

    const profEmpIdText = document.getElementById('profEmpIdText');
    if (profEmpIdText) profEmpIdText.textContent = currentUser.roll_or_emp_id || 'GFM-204';

    const profDeptText = document.getElementById('profDeptText');
    if (profDeptText) profDeptText.textContent = currentUser.department || 'Computer Engineering';

    const profEmailText = document.getElementById('profEmailText');
    if (profEmailText) profEmailText.textContent = currentUser.email;

    // Initials Avatar chips
    const avatarChips = [
      document.getElementById('userAvatarChip'),
      document.getElementById('navAvatarInitials'),
      document.getElementById('profileAvatarLarge')
    ];
    avatarChips.forEach(chip => {
      if (chip) chip.textContent = initials;
    });
  }

  updateUserInfoUI();

  // Real-time Clock
  function updateClock() {
    const now = new Date();
    const clockTime = document.getElementById('realtimeClock');
    const clockDate = document.getElementById('realtimeDate');
    if (clockTime) {
      clockTime.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    if (clockDate) {
      clockDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  updateClock();
  setInterval(updateClock, 1000);


  // ==========================================
  // 2. TOAST NOTIFICATION SYSTEM
  // ==========================================
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#10B981' : type === 'danger' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6';
    const iconClass = type === 'success' ? 'fa-circle-check' : type === 'danger' ? 'fa-triangle-exclamation' : 'fa-info-circle';

    toast.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      max-width: 400px;
    `;

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }


  // ==========================================
  // 3. NAVIGATION & TAB SWITCHING
  // ==========================================
  const menuItems = document.querySelectorAll('.menu-item[data-tab]');
  const tabViews = document.querySelectorAll('.tab-view');
  const sidebar = document.getElementById('sidebar');

  function switchTab(tabId) {
    // Hide all views & remove active menu states
    tabViews.forEach(view => view.classList.add('hidden-view'));
    menuItems.forEach(item => item.classList.remove('active'));

    // Activate selected view & menu item
    const targetView = document.getElementById(`view-${tabId}`);
    if (targetView) {
      targetView.classList.remove('hidden-view');
      targetView.classList.add('active');
    }

    const activeMenuItem = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
    if (activeMenuItem) {
      activeMenuItem.classList.add('active');
    }

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile sidebar if open
    if (window.innerWidth <= 1024 && sidebar) {
      sidebar.classList.remove('collapsed');
    }
  }

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
      window.location.hash = tabId;
    });
  });

  // Handle internal navigation buttons
  document.querySelectorAll('.nav-to-attendance-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab('attendance'));
  });
  document.querySelectorAll('.nav-to-notices-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab('notices'));
  });
  document.querySelectorAll('[data-tab="notices"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('notices');
    });
  });
  document.querySelectorAll('[data-tab="profile"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('profile');
    });
  });

  // Hash route initialization
  if (window.location.hash) {
    const hash = window.location.hash.replace('#', '');
    if (document.getElementById(`view-${hash}`)) {
      switchTab(hash);
    }
  }


  // ==========================================
  // 4. SIDEBAR RESPONSIVENESS & DROPDOWNS
  // ==========================================
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }
  if (sidebarCloseBtn && sidebar) {
    sidebarCloseBtn.addEventListener('click', () => {
      sidebar.classList.add('collapsed');
    });
  }

  // Notifications Dropdown Toggle
  const notifBellBtn = document.getElementById('notifBellBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  if (notifBellBtn && notifDropdown) {
    notifBellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
      if (profileMenu) profileMenu.classList.remove('show');
    });
  }

  // Profile Dropdown Toggle
  const profileDropdownBtn = document.getElementById('profileDropdownBtn');
  const profileMenu = document.getElementById('profileMenu');
  if (profileDropdownBtn && profileMenu) {
    profileDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('show');
      if (notifDropdown) notifDropdown.classList.remove('show');
    });
  }

  // Close dropdowns on body click
  document.addEventListener('click', () => {
    if (notifDropdown) notifDropdown.classList.remove('show');
    if (profileMenu) profileMenu.classList.remove('show');
  });


  // ==========================================
  // 5. LIGHT / DARK THEME TOGGLE
  // ==========================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const profileThemeToggleBtn = document.getElementById('profileThemeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gfm_theme', theme);
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  }

  const savedTheme = localStorage.getItem('gfm_theme') || 'light';
  setTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(current);
      showToast(`Switched to ${current.toUpperCase()} mode!`, 'info');
    });
  }
  if (profileThemeToggleBtn) {
    profileThemeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(current);
      showToast(`Switched to ${current.toUpperCase()} mode!`, 'info');
    });
  }


  // ==========================================
  // 6. MOCK STUDENT ROSTER DATA & RENDERERS
  // ==========================================
  let studentsData = [];

  // Helper to calculate percentage & status
  function getAttendanceStatus(attended, conducted) {
    const pct = ((attended / conducted) * 100).toFixed(1);
    let category = 'Regular';
    let badgeClass = 'bg-success-light';
    let badgeIcon = 'fa-check';

    if (pct < 60) {
      category = 'Critical Defaulter';
      badgeClass = 'bg-danger-light';
      badgeIcon = 'fa-triangle-exclamation';
    } else if (pct < 75) {
      category = 'Warning';
      badgeClass = 'bg-warning-light';
      badgeIcon = 'fa-exclamation-circle';
    }

    return { pct, category, badgeClass, badgeIcon };
  }

  // Render Student Roster Table
  function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    const searchVal = (document.getElementById('studentSearchInput')?.value || '').toLowerCase().trim();
    const divVal = document.getElementById('studentDivFilter')?.value || 'ALL';
    const statusVal = document.getElementById('studentStatusFilter')?.value || 'ALL';

    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = studentsData.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchVal) || s.roll.toLowerCase().includes(searchVal);
      const matchDiv = divVal === 'ALL' || s.div === divVal;
      const statusInfo = getAttendanceStatus(s.attended, s.conducted);

      let matchStatus = true;
      if (statusVal === 'Regular') matchStatus = statusInfo.pct >= 75;
      else if (statusVal === 'Warning') matchStatus = statusInfo.pct >= 60 && statusInfo.pct < 75;
      else if (statusVal === 'Defaulter') matchStatus = statusInfo.pct < 60;

      return matchSearch && matchDiv && matchStatus;
    });

    const countElem = document.getElementById('studentRosterCount');
    if (countElem) countElem.textContent = `${filtered.length} Students Found`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="center-align" style="padding: 30px; color: var(--text-secondary);">No matching students found.</td></tr>`;
      return;
    }

    filtered.forEach(student => {
      const { pct, category, badgeClass, badgeIcon } = getAttendanceStatus(student.attended, student.conducted);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${student.roll}</strong></td>
        <td>${student.name}</td>
        <td>${student.div}</td>
        <td style="color: var(--text-secondary);">${student.email}</td>
        <td>${student.attended} / ${student.conducted}</td>
        <td><strong style="color: ${pct >= 75 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444'}">${pct}%</strong></td>
        <td><span class="badge-status ${badgeClass}"><i class="fa-solid ${badgeIcon}"></i> ${category}</span></td>
        <td>
          <button class="tag-status-btn bg-success-light" onclick="alert('Viewing log for ${student.name}')" title="View Log"><i class="fa-solid fa-eye"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Filter Listeners
  document.getElementById('studentSearchInput')?.addEventListener('input', renderStudentTable);
  document.getElementById('studentDivFilter')?.addEventListener('change', renderStudentTable);
  document.getElementById('studentStatusFilter')?.addEventListener('change', renderStudentTable);

  renderStudentTable();


  // ==========================================
  // 7. ATTENDANCE ENTRY MODULE
  // ==========================================
  const entryDateInput = document.getElementById('entryDateInput');
  if (entryDateInput) {
    entryDateInput.value = new Date().toISOString().split('T')[0];
  }

  let attendanceState = {}; // { roll: boolean }
  studentsData.forEach(s => { attendanceState[s.roll] = true; }); // Default all present

  function renderAttendanceEntryRoster() {
    const tbody = document.getElementById('attendanceEntryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    studentsData.forEach((student, index) => {
      const isPresent = attendanceState[student.roll] !== false;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${student.roll}</strong></td>
        <td>${student.name}</td>
        <td>${((student.attended / student.conducted) * 100).toFixed(1)}%</td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="tag-status-btn ${isPresent ? 'bg-success-light' : 'secondary-solid'}" style="${isPresent ? 'background: #10B981; color: white;' : ''}" data-roll="${student.roll}" data-action="present">
              <i class="fa-solid fa-check"></i> Present
            </button>
            <button type="button" class="tag-status-btn ${!isPresent ? 'bg-danger-light' : 'secondary-solid'}" style="${!isPresent ? 'background: #EF4444; color: white;' : ''}" data-roll="${student.roll}" data-action="absent">
              <i class="fa-solid fa-xmark"></i> Absent
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    updateAttendanceCounters();
  }

  function updateAttendanceCounters() {
    const presentCount = Object.values(attendanceState).filter(val => val === true).length;
    const absentCount = Object.values(attendanceState).filter(val => val === false).length;

    const presentElem = document.getElementById('presentCountText');
    const absentElem = document.getElementById('absentCountText');
    if (presentElem) presentElem.textContent = presentCount;
    if (absentElem) absentElem.textContent = absentCount;
  }

  // Toggle present / absent on click
  document.getElementById('attendanceEntryTableBody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const roll = btn.getAttribute('data-roll');
    const action = btn.getAttribute('data-action');
    attendanceState[roll] = action === 'present';
    renderAttendanceEntryRoster();
  });

  // Mark All Present / Absent
  document.getElementById('markAllPresentBtn')?.addEventListener('click', () => {
    studentsData.forEach(s => { attendanceState[s.roll] = true; });
    renderAttendanceEntryRoster();
    showToast('Marked all students as Present.');
  });
  document.getElementById('markAllAbsentBtn')?.addEventListener('click', () => {
    studentsData.forEach(s => { attendanceState[s.roll] = false; });
    renderAttendanceEntryRoster();
    showToast('Marked all students as Absent.', 'warning');
  });

  // Submit Attendance
  document.getElementById('saveAttendanceBtn')?.addEventListener('click', async () => {
    const subject = document.getElementById('entrySubjectSelect')?.value || 'Web Development';
    const date = document.getElementById('entryDateInput')?.value || new Date().toISOString().split('T')[0];
    const time_slot = document.getElementById('entryTimeSelect')?.value || '09:30 AM - 10:30 AM';
    
    const records = [];
    studentsData.forEach(student => {
      const isPresent = attendanceState[student.roll] !== false;
      records.push({
        student_id: student.id,
        status: isPresent ? 'Present' : 'Absent'
      });
    });

    try {
      const response = await fetch('../api/save_attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, date, time_slot, records })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast(`Attendance for ${subject} saved successfully!`, 'success');
          await loadGFMDashboardData();
        } else {
          showToast(data.message || 'Failed to save attendance.', 'danger');
        }
      }
    } catch(err) {
      showToast('Error saving attendance records.', 'danger');
    }
  });

  renderAttendanceEntryRoster();


  // ==========================================
  // 8. DEFAULTER MANAGEMENT & WARNING ENGINE
  // ==========================================
  function renderDefaulterTable() {
    const tbody = document.getElementById('defaulterTableBody');
    const searchVal = (document.getElementById('defaulterSearchInput')?.value || '').toLowerCase().trim();
    const catVal = document.getElementById('defaulterCategoryFilter')?.value || 'ALL';

    if (!tbody) return;
    tbody.innerHTML = '';

    const defaulters = studentsData.filter(s => {
      const pct = (s.attended / s.conducted) * 100;
      const isDefaulter = pct < 75;
      const matchSearch = s.name.toLowerCase().includes(searchVal) || s.roll.toLowerCase().includes(searchVal);

      let matchCat = true;
      if (catVal === 'CRITICAL') matchCat = pct < 60;
      else if (catVal === 'WARNING') matchCat = pct >= 60 && pct < 75;

      return isDefaulter && matchSearch && matchCat;
    });

    if (defaulters.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="center-align" style="padding: 30px; color: var(--text-secondary);">No defaulters matching criteria.</td></tr>`;
      return;
    }

    defaulters.forEach(student => {
      const { pct, category, badgeClass, badgeIcon } = getAttendanceStatus(student.attended, student.conducted);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${student.roll}</strong></td>
        <td>${student.name}</td>
        <td>${student.div}</td>
        <td>${student.attended} / ${student.conducted}</td>
        <td><strong class="text-danger">${pct}%</strong></td>
        <td><span class="badge-status ${badgeClass}"><i class="fa-solid ${badgeIcon}"></i> ${category}</span></td>
        <td>${student.phone}</td>
        <td>
          <button class="table-action-btn danger-outline" style="padding: 4px 10px; font-size: 0.78rem;" onclick="alert('Warning notice sent to parent of ${student.name} (${student.phone})');">
            <i class="fa-solid fa-paper-plane"></i> Send Notice
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.getElementById('defaulterSearchInput')?.addEventListener('input', renderDefaulterTable);
  document.getElementById('defaulterCategoryFilter')?.addEventListener('change', renderDefaulterTable);

  renderDefaulterTable();

  // Quick Send Defaulter Warnings Button
  document.getElementById('quickSendDefaulterAlertsBtn')?.addEventListener('click', () => {
    showToast('SMS & Email warning notices sent to all 12 defaulter parents!', 'warning');
  });

  // Export CSV
  document.getElementById('exportDefaultersBtn')?.addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Roll No,Name,Division,Attendance Pct,Phone\n";
    studentsData.filter(s => (s.attended/s.conducted)*100 < 75).forEach(s => {
      csvContent += `${s.roll},${s.name},${s.div},${((s.attended/s.conducted)*100).toFixed(1)}%,${s.phone}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'GFM_Defaulter_List.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Defaulter CSV exported successfully!');
  });


  // ==========================================
  // 9. NOTICE BOARD ENGINE
  // ==========================================
  let noticesList = [];

  function renderNotices() {
    const container = document.getElementById('publishedNoticesList');
    if (!container) return;
    container.replaceChildren();

    noticesList.forEach(notice => {
      const div = document.createElement('div');
      div.className = 'chart-box';
      div.style.cssText = 'padding: 18px 24px; position: relative; border-left: 4px solid #3B82F6;';

      const top = document.createElement('div');
      top.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;';

      const content = document.createElement('div');

      const title = document.createElement('h3');
      title.style.cssText = 'font-size: 1rem; font-weight: 700; margin-bottom: 4px;';
      title.textContent = notice.title || 'Untitled Notice';

      const meta = document.createElement('span');
      meta.style.cssText = 'font-size: 0.78rem; color: var(--primary); font-weight: 700;';
      meta.textContent = `Target: ${notice.target || 'General'} • Posted ${notice.date || 'Recently'}`;

      const message = document.createElement('p');
      message.style.cssText = 'font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;';
      message.textContent = notice.message || 'No notice message provided.';

      content.append(title, meta);
      top.appendChild(content);
      div.append(top, message);
      container.appendChild(div);
    });
  }

  document.getElementById('newNoticeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('noticeTitleInput')?.value;
    const target = document.getElementById('noticeTargetSelect')?.value;
    const message = document.getElementById('noticeContentInput')?.value;

    if (!title || !message) return;

    try {
      if (!csrfToken) {
        await syncSessionContext();
      }

      const response = await fetch('../api/publish_notice.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ title, target, message })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        noticesList.unshift({
          id: Date.now(),
          title,
          target,
          message,
          date: 'Just Now'
        });
        renderNotices();
        e.target.reset();
        showToast('New notice published successfully!');
      } else {
        showToast(data.message || 'Failed to publish notice.', 'danger');
      }
    } catch(err) {
      showToast('Error communicating with server.', 'danger');
    }
  });

  renderNotices();


  // ==========================================
  // 10. CHART.JS INITIALIZATIONS
  // ==========================================
  // Overview Trend Line Chart
  const trendCtx = document.getElementById('overviewTrendChart')?.getContext('2d');
  if (trendCtx) {
    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [{
          label: 'Attendance %',
          data: [84, 88, 85, 91, 89, 92, 88],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 60, max: 100, ticks: { callback: v => v + '%' } }
        }
      }
    });
  }

  // Overview Donut Chart
  const donutCtx = document.getElementById('overviewDonutChart')?.getContext('2d');
  if (donutCtx) {
    new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Regular (>75%)', 'Warning (60-75%)', 'Critical (<60%)'],
        datasets: [{
          data: [168, 8, 4],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        cutout: '70%'
      }
    });
  }

  // Reports Subject Chart
  const reportsSubjectCtx = document.getElementById('reportsSubjectChart')?.getContext('2d');
  if (reportsSubjectCtx) {
    new Chart(reportsSubjectCtx, {
      type: 'bar',
      data: {
        labels: ['Web Dev', 'Data Struct', 'DBMS', 'Networks'],
        datasets: [{
          label: 'Avg Attendance %',
          data: [90, 85, 93, 84],
          backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#0EA5E9'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { min: 50, max: 100 } }
      }
    });
  }

  // Reports Division Chart
  const reportsDivCtx = document.getElementById('reportsDivisionChart')?.getContext('2d');
  if (reportsDivCtx) {
    new Chart(reportsDivCtx, {
      type: 'bar',
      data: {
        labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          { label: 'Div A', data: [88, 85, 92, 90, 93, 88], backgroundColor: '#3B82F6', borderRadius: 6 },
          { label: 'Div B', data: [82, 84, 88, 86, 89, 85], backgroundColor: '#8B5CF6', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 50, max: 100 } }
      }
    });
  }


  // ==========================================
  // 11. LOGOUT HANDLERS
  // ==========================================
  const logoutBtns = [
    document.getElementById('logoutBtn'),
    document.getElementById('menuLogoutBtn')
  ];

  logoutBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', async (e) => {
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
    }
  });

  async function loadGFMDashboardData() {
    try {
      const res = await fetch('../api/get_gfm_dashboard.php');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const data = result.data;
          
          studentsData = data.students;
          noticesList = data.notices;
          
          const gfmDivText = document.getElementById('gfmDivisionText');
          if (gfmDivText) gfmDivText.textContent = data.division;
          
          const gfmAssignedBatch = document.getElementById('gfmAssignedBatch');
          if (gfmAssignedBatch) gfmAssignedBatch.textContent = data.division + ' (2025-2026)';
          
          const stats = data.metrics;
          
          const totalStudentsElem = document.getElementById('gfmTotalStudents');
          if (totalStudentsElem) totalStudentsElem.textContent = stats.totalStudents;
          
          const todayAttendanceElem = document.getElementById('gfmTodayAttendance');
          if (todayAttendanceElem) todayAttendanceElem.textContent = stats.overallAvg + '%';
          
          const defaultersCountElem = document.getElementById('gfmDefaultersCount');
          if (defaultersCountElem) defaultersCountElem.textContent = stats.defaultersCount;
          
          const defaultersHelperElem = document.getElementById('gfmDefaultersHelper');
          if (defaultersHelperElem) {
            defaultersHelperElem.textContent = `${stats.criticalCount} Critical (<60%)`;
          }
          
          const conductedLecturesElem = document.getElementById('gfmConductedLectures');
          if (conductedLecturesElem) {
            conductedLecturesElem.textContent = `${stats.totalConducted} Sessions`;
          }
          
          const avgAttendanceElem = document.getElementById('gfmAverageAttendance');
          if (avgAttendanceElem) {
            avgAttendanceElem.textContent = `${stats.overallAvg}% Average Attendance`;
          }

          const warningCountText = document.getElementById('warningCountText');
          if (warningCountText) warningCountText.textContent = `${stats.warningCount} Students`;

          const criticalCountText = document.getElementById('criticalCountText');
          if (criticalCountText) criticalCountText.textContent = `${stats.criticalCount} Students`;

          studentsData.forEach(s => {
            if (!(s.roll in attendanceState)) {
              attendanceState[s.roll] = true;
            }
          });
          
          renderStudentTable();
          renderAttendanceEntryRoster();
          renderDefaulterTable();
          renderNotices();
          return;
        }
      }
    } catch(err) {
      console.error("Error loading GFM dashboard:", err);
    }
    
    showToast("Session expired. Redirecting to login...", "danger");
    setTimeout(() => {
      window.location.href = '../login.html';
    }, 1500);
  }
  
  await loadGFMDashboardData();

});
