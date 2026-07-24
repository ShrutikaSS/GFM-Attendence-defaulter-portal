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
    department: 'Artificial Intelligence & Machine Learning',
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
    if (profDeptText) profDeptText.textContent = currentUser.department || 'Artificial Intelligence & Machine Learning';

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
    btn.addEventListener('click', () => {
      window.location.href = 'gfm-attendance-entry.html';
    });
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
    let pctVal = 0;
    if (conducted > 0) {
      pctVal = (attended / conducted) * 100;
    }
    const pct = pctVal.toFixed(1);
    
    let category = 'Regular';
    let badgeClass = 'bg-success-light';
    let badgeIcon = 'fa-check';

    if (conducted > 0 && pctVal < 60) {
      category = 'Critical Defaulter';
      badgeClass = 'bg-danger-light';
      badgeIcon = 'fa-triangle-exclamation';
    } else if (conducted > 0 && pctVal < 75) {
      category = 'Warning';
      badgeClass = 'bg-warning-light';
      badgeIcon = 'fa-exclamation-circle';
    }

    return { pct, category, badgeClass, badgeIcon };
  }

  // Render Student Roster Table
  function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    const divVal = document.getElementById('studentDivFilter')?.value || 'ALL';
    const statusVal = document.getElementById('studentStatusFilter')?.value || 'ALL';

    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = studentsData.filter(s => {
      const matchDiv = divVal === 'ALL' || s.div === divVal;
      const statusInfo = getAttendanceStatus(s.attended, s.conducted);

      let matchStatus = true;
      if (statusVal === 'Regular') matchStatus = statusInfo.pct >= 75;
      else if (statusVal === 'Warning') matchStatus = statusInfo.pct >= 60 && statusInfo.pct < 75;
      else if (statusVal === 'Defaulter') matchStatus = statusInfo.pct < 60;

      return matchDiv && matchStatus;
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

  let liveClassStudents = [];
  let classAttendanceState = {}; // { student_id: status }

  const entryClassSelect = document.getElementById('entryClassSelect');

  async function loadClassStudentsForEntry() {
    const classVal = entryClassSelect ? entryClassSelect.value : '';
    const tbody = document.getElementById('attendanceEntryTableBody');
    if (!tbody) return;

    if (!classVal) {
      liveClassStudents = [];
      classAttendanceState = {};
      tbody.innerHTML = `
        <tr id="emptyStateRow">
          <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>
            Select FY A, FY B or FY C to load students.
          </td>
        </tr>`;
      updateAttendanceCounters();
      return;
    }

    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-secondary);">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
          Loading student list for ${classVal}...
        </td>
      </tr>`;

    const subject = document.getElementById('entrySubjectSelect')?.value || 'Web Development';
    const date = entryDateInput?.value || new Date().toISOString().split('T')[0];

    try {
      const res = await fetch('../api/attendance_entry.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class: classVal, subject: subject, date: date })
      });
      const data = await res.json();

      if (data.success && data.data && data.data.students) {
        liveClassStudents = data.data.students;
        classAttendanceState = {};
        liveClassStudents.forEach(s => {
          classAttendanceState[s.student_id] = s.existing_status || 'Present';
        });
        renderAttendanceEntryRoster();
        showToast(`Loaded ${liveClassStudents.length} students for ${classVal}.`, 'success');
      } else {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #EF4444;">${data.message || 'Failed to load students.'}</td></tr>`;
      }
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #EF4444;">Network error while fetching students.</td></tr>`;
    }
  }

  if (entryClassSelect) {
    entryClassSelect.addEventListener('change', loadClassStudentsForEntry);
  }

  function renderAttendanceEntryRoster() {
    const tbody = document.getElementById('attendanceEntryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (liveClassStudents.length === 0) {
      tbody.innerHTML = `
        <tr id="emptyStateRow">
          <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>
            Select FY A, FY B or FY C to load students.
          </td>
        </tr>`;
      updateAttendanceCounters();
      return;
    }

    liveClassStudents.forEach((student, index) => {
      const existingStatus = classAttendanceState[student.student_id] || 'Present';
      const existingRemarks = student.existing_remarks || 'Regular';
      const pct = parseFloat(student.attendance_percentage || 0);
      const pctClass = pct >= 75 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-danger';

      const tr = document.createElement('tr');
      tr.className = 'attendance-row';
      tr.setAttribute('data-student-id', student.student_id);
      
      tr.innerHTML = `
        <td><strong>${student.roll_no}</strong></td>
        <td>${student.prn}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" alt="" />
            <strong>${student.student_name}</strong>
          </div>
        </td>
        <td><strong class="${pctClass}">${pct.toFixed(2)}%</strong></td>
        <td class="cell-center">
          <label class="radio-option radio-present" style="justify-content: center; cursor: pointer;">
            <input type="radio" name="status_${student.student_id}" value="Present" ${existingStatus === 'Present' ? 'checked' : ''} />
            <span>Present</span>
          </label>
        </td>
        <td class="cell-center">
          <label class="radio-option radio-absent" style="justify-content: center; cursor: pointer;">
            <input type="radio" name="status_${student.student_id}" value="Absent" ${existingStatus === 'Absent' ? 'checked' : ''} />
            <span>Absent</span>
          </label>
        </td>
        <td class="cell-center">
          <label class="radio-option radio-medical" style="justify-content: center; cursor: pointer;">
            <input type="radio" name="status_${student.student_id}" value="Medical Leave" ${existingStatus === 'Medical Leave' ? 'checked' : ''} />
            <span>Medical</span>
          </label>
        </td>
        <td class="cell-center">
          <label class="radio-option radio-duty" style="justify-content: center; cursor: pointer;">
            <input type="radio" name="status_${student.student_id}" value="Duty Leave" ${existingStatus === 'Duty Leave' ? 'checked' : ''} />
            <span>Duty</span>
          </label>
        </td>
        <td>
          <input type="text" class="attendance-remark-input" 
                 value="${existingRemarks}" 
                 placeholder="Add remark" style="width: 100%; border: 1px solid var(--border-color); padding: 4px; border-radius: 4px;" />
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // Add change listeners to radio buttons
    tbody.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const tr = e.target.closest('tr');
        const studentId = tr.getAttribute('data-student-id');
        classAttendanceState[studentId] = e.target.value;
        updateAttendanceCounters();
      });
    });

    updateAttendanceCounters();
  }

  function updateAttendanceCounters() {
    let present = 0, absent = 0, medical = 0, duty = 0;
    Object.values(classAttendanceState).forEach(val => {
      if (val === 'Present') present++;
      if (val === 'Absent') absent++;
      if (val === 'Medical Leave') medical++;
      if (val === 'Duty Leave') duty++;
    });

    const presentElem = document.getElementById('presentCountText');
    const absentElem = document.getElementById('absentCountText');
    if (presentElem) presentElem.textContent = present;
    if (absentElem) absentElem.textContent = absent;
    // Note: gfm.html only has present and absent counts by default, but we can update them anyway.
  }

  // Toggle present / absent on click
  document.getElementById('attendanceEntryTableBody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const studentId = btn.getAttribute('data-student-id');
    const action = btn.getAttribute('data-action');
    classAttendanceState[studentId] = action === 'present' ? 'Present' : 'Absent';
    renderAttendanceEntryRoster();
  });

  // Mark All Present / Absent
  document.getElementById('markAllPresentBtn')?.addEventListener('click', () => {
    liveClassStudents.forEach(s => { classAttendanceState[s.student_id] = 'Present'; });
    renderAttendanceEntryRoster();
    showToast('Marked all students as Present.');
  });
  document.getElementById('markAllAbsentBtn')?.addEventListener('click', () => {
    liveClassStudents.forEach(s => { classAttendanceState[s.student_id] = 'Absent'; });
    renderAttendanceEntryRoster();
    showToast('Marked all students as Absent.', 'warning');
  });

  // Submit Attendance
  document.getElementById('saveAttendanceBtn')?.addEventListener('click', async () => {
    const classVal = entryClassSelect ? entryClassSelect.value : '';
    if (!classVal) {
      showToast('Please select a class (FY A, FY B, or FY C).', 'danger');
      return;
    }
    if (liveClassStudents.length === 0) {
      showToast('No students loaded to mark attendance.', 'danger');
      return;
    }

    const subject = document.getElementById('entrySubjectSelect')?.value || 'Web Development';
    const date = document.getElementById('entryDateInput')?.value || new Date().toISOString().split('T')[0];
    
    const records = [];
    const rows = document.querySelectorAll('#attendanceEntryTableBody .attendance-row');
    rows.forEach(row => {
      const studentId = parseInt(row.getAttribute('data-student-id'));
      const radio = row.querySelector('input[type="radio"]:checked');
      const status = radio ? radio.value : 'Present';
      const remarkInput = row.querySelector('.attendance-remark-input');
      const remarks = remarkInput ? remarkInput.value : 'Regular';
      records.push({ student_id: studentId, status: status, remarks: remarks });
    });

    try {
      const response = await fetch('../api/save_attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ class: classVal, subject: subject, date: date, records: records, update_existing: true })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast(`Attendance for ${classVal} - ${subject} saved successfully!`, 'success');
          await loadClassStudentsForEntry();
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
    const catVal = document.getElementById('defaulterCategoryFilter')?.value || 'ALL';
    const divVal = document.getElementById('defaulterDivisionFilter')?.value || 'ALL';
    const thresholdVal = parseInt(document.getElementById('defaulterThresholdInput')?.value || '75');

    if (!tbody) return;
    tbody.innerHTML = '';

    const defaulters = studentsData.filter(s => {
      if (s.conducted == 0) return false;
      const pct = (s.attended / s.conducted) * 100;
      const isDefaulter = pct < thresholdVal;

      let matchCat = true;
      if (catVal === 'CRITICAL') matchCat = pct < (thresholdVal - 15);
      else if (catVal === 'WARNING') matchCat = pct >= (thresholdVal - 15) && pct < thresholdVal;
      
      let matchDiv = true;
      if (divVal !== 'ALL') matchDiv = s.div === divVal;

      return isDefaulter && matchCat && matchDiv;
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

  document.getElementById('defaulterCategoryFilter')?.addEventListener('change', renderDefaulterTable);
  document.getElementById('defaulterDivisionFilter')?.addEventListener('change', renderDefaulterTable);
  document.getElementById('defaulterThresholdInput')?.addEventListener('input', renderDefaulterTable);

  renderDefaulterTable();

  // Quick Send Defaulter Warnings Button
  document.getElementById('quickSendDefaulterAlertsBtn')?.addEventListener('click', async () => {
    const defaulters = studentsData.filter(s => s.conducted > 0 && (s.attended/s.conducted)*100 < 75);
    if (defaulters.length === 0) {
      showToast('No defaulters found to notify.', 'warning');
      return;
    }
    
    if (!confirm(`Are you sure you want to send warning notices to ${defaulters.length} students?`)) {
      return;
    }

    try {
      const studentIds = defaulters.map(s => s.id); // Assuming s.id is the user_id of the student
      const res = await fetch('../api/send_defaulter_warnings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: studentIds })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Failed to send warnings.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server.', 'danger');
    }
  });

  // Export CSV
  document.getElementById('exportDefaultersBtn')?.addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Roll No,Name,Division,Attendance Pct,Phone\n";
    studentsData.filter(s => s.conducted > 0 && (s.attended/s.conducted)*100 < 75).forEach(s => {
      const pct = ((s.attended/s.conducted)*100).toFixed(1);
      csvContent += `${s.roll},${s.name},${s.div},${pct}%,${s.phone}\n`;
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

  async function loadNotices() {
    try {
      const res = await fetch('../api/get_notices.php?scope=public');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notices) {
          noticesList = data.notices;
          renderNotices();
        }
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    }
  }

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

  // Initialize Notices on Load
  loadNotices();

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
