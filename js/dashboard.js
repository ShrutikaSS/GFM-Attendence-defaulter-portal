/**
 * GFM ATTENDANCE DEFAULTER STUDENTS LIST MANAGEMENT SYSTEM
 * JavaScript Controller - Premium ERP Simulation Layer (Vanilla JS)
 */

// ==========================================================================
// 1. STATE & GLOBAL CONFIGURATION
// ==========================================================================
let students = [];
let currentPage = 1;
const rowsPerPage = 10;
let currentSortColumn = 'roll';
let currentSortDirection = 'asc';
let currentFilter = 'all'; // all, regular, warning, defaulter
let searchQuery = '';

// Thresholds configured in Settings modal
let baselineThreshold = 75;
let defaulterThreshold = 60;

// Calendar active month tracker
let calendarCurrentDate = new Date(2026, 6, 21); // Current Time set to July 2026

// Mock System notifications
let notificationsList = [
  {
    id: 1,
    title: "Critical attendance alert generated",
    content: "Student Rahul Sharma (PRN 122A20003) dropped below 50% attendance.",
    timestamp: "10 mins ago",
    category: "critical",
    unread: true
  },
  {
    id: 2,
    title: "New student assigned to batch",
    content: "Neha Deshmukh (Roll 418) has been registered to TE-COMP-A.",
    timestamp: "1 hour ago",
    category: "system",
    unread: true
  },
  {
    id: 3,
    title: "Monthly report generated successfully",
    content: "The cumulative attendance audit sheet for June has been signed by HOD.",
    timestamp: "4 hours ago",
    category: "notice",
    unread: true
  },
  {
    id: 4,
    title: "Weekly backup complete",
    content: "System database successfully mirrored to campus secure cloud backup.",
    timestamp: "1 day ago",
    category: "system",
    unread: false
  }
];

// ==========================================================================
// 2. INITIALIZATION & DUMMY DATA GENERATOR
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  generateMockStudents();
  renderDashboard();
  setupEventListeners();
  initClock();
  generateCalendar();
  loadQuickNotes();
  
  // Render notification systems
  renderNotificationBadges();
  renderFullNotificationsList();
});

// Generate 120 mock students matching requirements:
// Regular (>75%): 84 students
// Warning (60-74%): 18 students
// Critical (<60%): 18 students
// Total: 120
function generateMockStudents() {
  const firstNames = ["Aditya", "Sneha", "Rahul", "Priya", "Amit", "Neha", "Vikram", "Anjali", "Siddharth", "Kiran", "Yash", "Tanvi", "Rohan", "Divya", "Abhishek", "Deepa", "Sameer", "Pooja", "Gaurav", "Nisha"];
  const lastNames = ["Sharma", "Patil", "Deshmukh", "Iyer", "Joshi", "Verma", "Kulkarni", "Mehta", "Nair", "Rao", "Chavan", "Sinha", "Gupta", "Pandey", "Shinde", "Thakur", "Reddy", "Mishra", "Naik", "Bose"];
  const branches = ["Computer Engineering"];
  
  // Define explicit 15 student seed for realism
  const seeds = [
    { name: "Rahul Sharma", attendance: 48.5, roll: 301, prn: "122A20001" },
    { name: "Sneha Patil", attendance: 82.4, roll: 302, prn: "122A20002" },
    { name: "Aditya Kulkarni", attendance: 58.0, roll: 303, prn: "122A20003" },
    { name: "Priya Iyer", attendance: 76.8, roll: 304, prn: "122A20004" },
    { name: "Amit Deshmukh", attendance: 64.2, roll: 305, prn: "122A20005" },
    { name: "Neha Joshi", attendance: 91.5, roll: 306, prn: "122A20006" },
    { name: "Vikram Chavan", attendance: 52.1, roll: 307, prn: "122A20007" },
    { name: "Anjali Nair", attendance: 88.0, roll: 308, prn: "122A20008" },
    { name: "Siddharth Rao", attendance: 71.0, roll: 309, prn: "122A20009" },
    { name: "Kiran Mehta", attendance: 95.2, roll: 310, prn: "122A20010" },
    { name: "Yash Sinha", attendance: 59.9, roll: 311, prn: "122A20011" },
    { name: "Tanvi Gupta", attendance: 79.5, roll: 312, prn: "122A20012" },
    { name: "Rohan Pandey", attendance: 68.3, roll: 313, prn: "122A20013" },
    { name: "Divya Shinde", attendance: 85.0, roll: 314, prn: "122A20014" },
    { name: "Abhishek Reddy", attendance: 45.0, roll: 315, prn: "122A20015" }
  ];

  // Initialize with seed list
  seeds.forEach(s => {
    students.push({
      prn: s.prn,
      roll: s.roll,
      name: s.name,
      branch: branches[0],
      semester: "V",
      attendance: s.attendance
    });
  });

  // Calculate current counts
  let countCritical = students.filter(s => s.attendance < defaulterThreshold).length; // currently 5
  let countWarning = students.filter(s => s.attendance >= defaulterThreshold && s.attendance < baselineThreshold).length; // currently 3
  let countRegular = students.filter(s => s.attendance >= baselineThreshold).length; // currently 7

  // Target distributions
  const targetCritical = 18;
  const targetWarning = 18;
  const targetRegular = 84;

  let currentRoll = 316;
  let currentPrnNum = 16;

  // Helper to construct PRN
  const makePrn = (num) => `122A2${String(num).padStart(4, '0')}`;

  // Fill Critical
  while (countCritical < targetCritical) {
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const att = parseFloat((40 + Math.random() * 19.9).toFixed(1)); // 40.0 - 59.9
    students.push({ prn: makePrn(currentPrnNum++), roll: currentRoll++, name, branch: branches[0], semester: "V", attendance: att });
    countCritical++;
  }

  // Fill Warning
  while (countWarning < targetWarning) {
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const att = parseFloat((60 + Math.random() * 14.9).toFixed(1)); // 60.0 - 74.9
    students.push({ prn: makePrn(currentPrnNum++), roll: currentRoll++, name, branch: branches[0], semester: "V", attendance: att });
    countWarning++;
  }

  // Fill Regular
  while (countRegular < targetRegular) {
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const att = parseFloat((75 + Math.random() * 20.9).toFixed(1)); // 75.0 - 95.9
    students.push({ prn: makePrn(currentPrnNum++), roll: currentRoll++, name, branch: branches[0], semester: "V", attendance: att });
    countRegular++;
  }
  
  // Sort initially by roll number
  sortData('roll', 'asc');
}

// ==========================================================================
// 3. CORE RENDERING ENGINE
// ==========================================================================
function renderDashboard() {
  updateStatsMetrics();
  renderStudentTable();
  renderCriticalDefaulters();
  updateRightSidebarWidgets();
}

// Stats Cards Counts calculation
function updateStatsMetrics() {
  const totalCount = students.length;
  const defaulterCount = students.filter(s => s.attendance < defaulterThreshold).length;
  const warningCount = students.filter(s => s.attendance >= defaulterThreshold && s.attendance < baselineThreshold).length;
  const regularCount = students.filter(s => s.attendance >= baselineThreshold).length;
  
  // Avg Attendance calculation
  const totalAttendanceSum = students.reduce((sum, s) => sum + s.attendance, 0);
  const avgAttendanceVal = Math.round(totalAttendanceSum / totalCount);

  // Update DOM values
  document.getElementById("statsTotalStudentsCount").innerText = totalCount;
  document.getElementById("statsDefaulterCount").innerText = defaulterCount;
  document.getElementById("statsAverageAttendanceVal").innerText = `${avgAttendanceVal}%`;
  document.getElementById("heroWarningAlert").innerText = `${defaulterCount} critical defaulter students`;
  document.getElementById("donutTotalCount").innerText = totalCount;

  // Donut Labels updating
  const regularPct = Math.round((regularCount / totalCount) * 100);
  const warningPct = Math.round((warningCount / totalCount) * 100);
  const defaulterPct = Math.round((defaulterCount / totalCount) * 100);

  document.getElementById("legendRegularLabel").innerText = `${regularCount} Students (${regularPct}%)`;
  document.getElementById("legendWarningLabel").innerText = `${warningCount} Students (${warningPct}%)`;
  document.getElementById("legendDefaulterLabel").innerText = `${defaulterCount} Students (${defaulterPct}%)`;

  // Update Right sidebar radial text
  document.getElementById("radialProgressCircle").style.strokeDashoffset = 251.2 - (251.2 * avgAttendanceVal) / 100;
  document.querySelector(".radial-pct").innerText = `${avgAttendanceVal}%`;
}

// Main Student attendance register list rendering
function renderStudentTable() {
  const tbody = document.getElementById("studentTableBody");
  tbody.innerHTML = "";

  // 1. Apply Search and Dropdown filters
  let filteredList = students.filter(student => {
    // Search matching
    const searchMatch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        student.prn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        String(student.roll).includes(searchQuery);
    
    // Status drop-down matching
    let filterMatch = true;
    if (currentFilter === 'regular') {
      filterMatch = student.attendance >= baselineThreshold;
    } else if (currentFilter === 'warning') {
      filterMatch = student.attendance >= defaulterThreshold && student.attendance < baselineThreshold;
    } else if (currentFilter === 'defaulter') {
      filterMatch = student.attendance < defaulterThreshold;
    }

    return searchMatch && filterMatch;
  });

  const totalFilteredRecords = filteredList.length;

  // Adjust pagination boundaries
  const totalPages = Math.ceil(totalFilteredRecords / rowsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalFilteredRecords);

  const paginatedList = filteredList.slice(startIndex, endIndex);

  // Update register meta count badge text
  document.getElementById("activeFilterBadge").innerText = `TE-COMP-A • ${totalFilteredRecords} Students`;

  // Update pagination footer numbers
  document.getElementById("paginationStartRow").innerText = totalFilteredRecords === 0 ? 0 : startIndex + 1;
  document.getElementById("paginationEndRow").innerText = endIndex;
  document.getElementById("paginationTotalRows").innerText = totalFilteredRecords;

  // Render Rows
  if (paginatedList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="center-align" style="padding: 30px; color: var(--text-secondary);">No student records matched search filters.</td></tr>`;
  } else {
    paginatedList.forEach(student => {
      let statusBadge = '';
      if (student.attendance >= baselineThreshold) {
        statusBadge = `<span class="badge-status bg-success-light"><span class="dot bg-success"></span>Regular</span>`;
      } else if (student.attendance >= defaulterThreshold) {
        statusBadge = `<span class="badge-status bg-warning-light"><span class="dot bg-warning"></span>Warning</span>`;
      } else {
        statusBadge = `<span class="badge-status bg-danger-light"><span class="dot bg-danger"></span>Defaulter</span>`;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="font-weight-bold">${student.prn}</td>
        <td>${student.roll}</td>
        <td>${student.name}</td>
        <td>${student.branch}</td>
        <td>${student.semester}</td>
        <td class="font-weight-bold ${student.attendance < defaulterThreshold ? 'danger-text' : (student.attendance < baselineThreshold ? 'warning-text' : 'success-text')}">${student.attendance}%</td>
        <td>${statusBadge}</td>
        <td class="center-align">
          <div class="table-cell-actions">
            <button class="table-cell-btn warn" onclick="openSendNoticeSingleModal('${student.name}', '${student.prn}')" title="Send parent notice alert">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </button>
            <button class="table-cell-btn send" onclick="markIndividualAttendance('${student.prn}')" title="Quick edit session attendance">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Draw Pagination Buttons
  renderPaginationButtons(totalPages);
}

// Generate pagination controls footer layout
function renderPaginationButtons(totalPages) {
  const pagBody = document.getElementById("tablePaginationPages");
  pagBody.innerHTML = "";

  // Prev Button
  const prevBtn = document.createElement("button");
  prevBtn.className = "page-num-btn";
  prevBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="15 18 9 12 15 6"/></svg>`;
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderStudentTable(); } };
  pagBody.appendChild(prevBtn);

  // Pages Button List
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `page-num-btn ${currentPage === i ? 'active' : ''}`;
    pageBtn.innerText = i;
    pageBtn.onclick = () => { currentPage = i; renderStudentTable(); };
    pagBody.appendChild(pageBtn);
  }

  // Next Button
  const nextBtn = document.createElement("button");
  nextBtn.className = "page-num-btn";
  nextBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 18 15 12 9 6"/></svg>`;
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderStudentTable(); } };
  pagBody.appendChild(nextBtn);
}

// Render critical student profile list cards (sub-60%)
function renderCriticalDefaulters() {
  const container = document.getElementById("criticalDefaulterGrid");
  container.innerHTML = "";

  const criticals = students.filter(s => s.attendance < defaulterThreshold);

  // Slice to max 6 profiles to fit dashboard aesthetic elegantly
  criticals.slice(0, 6).forEach((student, index) => {
    const mockAvatars = [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=256&auto=format&fit=crop"
    ];

    const avatar = mockAvatars[index % mockAvatars.length];

    const card = document.createElement("div");
    card.className = "defaulter-profile-card";
    card.innerHTML = `
      <div class="defaulter-card-top">
        <img src="${avatar}" class="defaulter-photo" alt="${student.name}">
        <div class="defaulter-meta">
          <h4>${student.name}</h4>
          <span>Roll No: ${student.roll} • PRN: ${student.prn}</span>
        </div>
      </div>
      <div class="defaulter-progress-bar-container">
        <div class="progress-bar-lbl">
          <span class="danger-text">Critical Attendance</span>
          <strong class="danger-text">${student.attendance}%</strong>
        </div>
        <div class="defaulter-bar-bg">
          <div class="defaulter-bar-fill" style="width: ${student.attendance}%;"></div>
        </div>
      </div>
      <div class="defaulter-actions-row">
        <button class="card-action-btn warn" onclick="triggerSingleQuickWarning('${student.name}')">Warn Student</button>
        <button class="card-action-btn notice" onclick="openSendNoticeSingleModal('${student.name}', '${student.prn}')">Send Notice</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Right column mini summary counts
function updateRightSidebarWidgets() {
  const totalCount = students.length;
  const countDefaulters = students.filter(s => s.attendance < defaulterThreshold).length;
  
  // Calculate relative summary values
  const presentCount = Math.round(totalCount * 0.916);
  const leaveCount = 2;
  const absentCount = totalCount - presentCount - leaveCount;

  document.getElementById("widgetPresentCount").innerText = `${presentCount} / ${totalCount}`;
  document.getElementById("widgetAbsentCount").innerText = `${absentCount} / ${totalCount}`;
  document.getElementById("widgetLeaveCount").innerText = `${leaveCount} / ${totalCount}`;
}

// ==========================================================================
// 4. SORTING & FILTERING UTILITIES
// ==========================================================================
function sortData(column, direction) {
  currentSortColumn = column;
  currentSortDirection = direction;

  students.sort((a, b) => {
    let valA = a[column];
    let valB = b[column];

    // Handle lowercase strings sorting
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function handleTableSort(column) {
  let nextDir = 'asc';
  if (currentSortColumn === column && currentSortDirection === 'asc') {
    nextDir = 'desc';
  }
  
  sortData(column, nextDir);
  
  // Reset sort icons styling in DOM
  document.querySelectorAll(".sortable-header").forEach(header => {
    header.classList.remove("sorted-asc", "sorted-desc");
  });
  
  const currentHeader = document.querySelector(`.sortable-header[data-sort="${column}"]`);
  if (currentHeader) {
    currentHeader.classList.add(nextDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
  }

  currentPage = 1;
  renderStudentTable();
}

function filterTableByStatus(status) {
  currentFilter = status;
  document.getElementById("tableAttendanceFilter").value = status;
  currentPage = 1;
  renderStudentTable();
  scrollToElement('studentTableSection');
}

function filterTableByDefaulterMode() {
  filterTableByStatus('defaulter');
}

// ==========================================================================
// 5. INTERACTIVE NOTIFICATION SUB-SYSTEM
// ==========================================================================
function renderNotificationBadges() {
  const unreadCount = notificationsList.filter(n => n.unread).length;
  const bellBadge = document.getElementById("notificationBadgeCount");
  
  if (unreadCount > 0) {
    bellBadge.style.display = "block";
    bellBadge.innerText = unreadCount;
  } else {
    bellBadge.style.display = "none";
  }

  // Banner in Full log panel
  const banner = document.getElementById("unreadCountBanner");
  if (banner) {
    banner.innerText = `${unreadCount} Unread Notifications`;
  }
}

// Build notification lists in panel dropdown and main page
function renderFullNotificationsList() {
  const dropdownList = document.getElementById("dropdownNotificationList");
  const fullPageContainer = document.getElementById("notificationFullListContainer");

  dropdownList.innerHTML = "";
  if (fullPageContainer) fullPageContainer.innerHTML = "";

  notificationsList.forEach(notif => {
    // Determine category styling
    let iconSvg = '';
    let categoryClass = 'bg-primary-light';
    
    if (notif.category === 'critical') {
      categoryClass = 'bg-danger-light';
      iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--danger)" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else if (notif.category === 'notice') {
      categoryClass = 'bg-warning-light';
      iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--warning)" stroke-width="2" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
    } else {
      categoryClass = 'bg-blue-light';
      iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--primary)" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
    }

    // Dropdown Node item
    const ddItem = document.createElement("li");
    ddItem.className = notif.unread ? "unread" : "";
    ddItem.innerHTML = `
      <div class="notif-icon-circle ${categoryClass}">
        ${iconSvg}
      </div>
      <div class="notif-body">
        <p>${notif.title}</p>
        <span class="notif-time">${notif.timestamp}</span>
      </div>
    `;
    ddItem.onclick = () => {
      notif.unread = false;
      renderNotificationBadges();
      renderFullNotificationsList();
      showToast(`Viewed: ${notif.title}`, 'info');
    };
    dropdownList.appendChild(ddItem);

    // Full Page panel view list item
    if (fullPageContainer) {
      const fullItem = document.createElement("div");
      fullItem.className = `full-notification-item ${notif.unread ? 'unread' : ''}`;
      fullItem.innerHTML = `
        <div class="notif-icon-circle ${categoryClass}">
          ${iconSvg}
        </div>
        <div class="notif-details">
          <h4>${notif.title}</h4>
          <p>${notif.content}</p>
          <div class="notif-meta-row">
            <span class="notif-badge-lbl ${notif.category}">${notif.category}</span>
            <span class="notif-time">${notif.timestamp}</span>
          </div>
        </div>
        <div class="delete-notif-btn" onclick="deleteNotification(${notif.id}, event)" title="Dismiss log alert">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="12"/></svg>
        </div>
      `;
      fullItem.onclick = () => {
        if (notif.unread) {
          notif.unread = false;
          renderNotificationBadges();
          renderFullNotificationsList();
        }
      };
      fullPageContainer.appendChild(fullItem);
    }
  });

  if (notificationsList.length === 0) {
    dropdownList.innerHTML = `<li style="padding: 16px; color: var(--text-secondary); text-align: center;">No new alerts.</li>`;
    if (fullPageContainer) {
      fullPageContainer.innerHTML = `<div style="padding: 40px; color: var(--text-secondary); text-align: center;">All notifications cleared.</div>`;
    }
  }
}

function markAllNotificationsAsRead() {
  notificationsList.forEach(n => n.unread = false);
  renderNotificationBadges();
  renderFullNotificationsList();
  showToast("All notifications marked as read.", "success");
}

function deleteNotification(id, event) {
  event.stopPropagation(); // Avoid triggering card read event
  notificationsList = notificationsList.filter(n => n.id !== id);
  renderNotificationBadges();
  renderFullNotificationsList();
  showToast("Notification cleared from logs.", "info");
}

// Add new notifications on action triggers
function insertSystemLog(title, content, category) {
  const newNotif = {
    id: Date.now(),
    title,
    content,
    timestamp: "Just now",
    category,
    unread: true
  };
  notificationsList.unshift(newNotif);
  renderNotificationBadges();
  renderFullNotificationsList();
}

// ==========================================================================
// 6. UI ACTIONS, MODALS, & NAVIGATION
// ==========================================================================

// Global toast alert notification
function showToast(message, type = 'info') {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast-item ${type}`;

  let icon = '';
  if (type === 'success') {
    icon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--success)" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === 'danger') {
    icon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--danger)" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else if (type === 'warning') {
    icon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--warning)" stroke-width="2.5" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>`;
  } else {
    icon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--primary)" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-content-box">
      ${icon}
      <span class="toast-text">${message}</span>
    </div>
    <div class="toast-close-btn">
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="12"/></svg>
    </div>
  `;

  // Close toast trigger
  toast.querySelector(".toast-close-btn").onclick = () => {
    toast.classList.add("exit");
    setTimeout(() => toast.remove(), 300);
  };

  container.appendChild(toast);

  // Auto remove toast after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add("exit");
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// Modal control functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add("show");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("show");
}

// Side-bar page navigation switching
function showView(viewId) {
  document.querySelectorAll(".dashboard-body").forEach(view => {
    view.classList.add("hidden-view");
  });

  document.getElementById(`${viewId}-view`).classList.remove("hidden-view");

  // Highlight menu item in sidebar
  document.querySelectorAll(".menu-item").forEach(item => {
    item.classList.remove("active");
  });

  const activeMenu = document.querySelector(`.menu-item[data-page="${viewId}"]`);
  if (activeMenu) {
    activeMenu.classList.add("active");
  }
}

// View-scroll actions
function scrollToElement(id) {
  // If in notifications full view, return to dashboard view first
  showView('dashboard');
  
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

// ==========================================================================
// 7. SPECIFIC MODAL FLOW WORKFLOWS
// ==========================================================================

/* --- A. ATTENDANCE ENTRY MODAL --- */
let attendanceSessionStatus = {}; // Tracks temporary modifications in manual entry dialog

function openAttendanceEntryModal() {
  attendanceSessionStatus = {};
  const tbody = document.getElementById("attendanceEntryTableBody");
  tbody.innerHTML = "";

  // Load a subset of 15 students for compact entry demo
  const entryStudentsList = students.slice(0, 15);

  entryStudentsList.forEach(student => {
    // Default checked present state
    attendanceSessionStatus[student.prn] = 'present';

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.roll}</td>
      <td><strong>${student.name}</strong></td>
      <td>${student.prn}</td>
      <td class="font-weight-bold">${student.attendance}%</td>
      <td class="center-align">
        <div class="status-radio-group">
          <input type="radio" id="p_${student.prn}" name="status_${student.prn}" value="present" checked onchange="updateIndividualSessionStatus('${student.prn}', 'present')">
          <label for="p_${student.prn}" class="radio-btn-label present">P</label>

          <input type="radio" id="a_${student.prn}" name="status_${student.prn}" value="absent" onchange="updateIndividualSessionStatus('${student.prn}', 'absent')">
          <label for="a_${student.prn}" class="radio-btn-label absent">A</label>

          <input type="radio" id="m_${student.prn}" name="status_${student.prn}" value="medical" onchange="updateIndividualSessionStatus('${student.prn}', 'medical')">
          <label for="m_${student.prn}" class="radio-btn-label medical">M</label>

          <input type="radio" id="d_${student.prn}" name="status_${student.prn}" value="duty" onchange="updateIndividualSessionStatus('${student.prn}', 'duty')">
          <label for="d_${student.prn}" class="radio-btn-label duty">D</label>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  openModal('attendanceEntryModal');
}

function updateIndividualSessionStatus(prn, val) {
  attendanceSessionStatus[prn] = val;
}

function bulkSetEntryStatus(status) {
  // Select all corresponding radios
  document.querySelectorAll(`.radio-btn-label.${status}`).forEach(label => {
    const radio = document.getElementById(label.getAttribute("for"));
    if (radio) {
      radio.checked = true;
      // Extract student PRN from id format p_PRN or a_PRN
      const prn = radio.id.split('_').slice(1).join('_');
      attendanceSessionStatus[prn] = status;
    }
  });
  showToast(`All listed students marked as ${status.toUpperCase()}.`, "info");
}

function handleAttendanceSubmit(event) {
  event.preventDefault();
  
  // Calculate attendance modifications based on manual options marked
  // Present, Medical, Duty = increase count. Absent = lower counts
  Object.keys(attendanceSessionStatus).forEach(prn => {
    const student = students.find(s => s.prn === prn);
    if (student) {
      const status = attendanceSessionStatus[prn];
      let currentVal = student.attendance;
      if (status === 'absent') {
        currentVal = Math.max(10, parseFloat((currentVal - 1.2).toFixed(1)));
      } else {
        currentVal = Math.min(100, parseFloat((currentVal + 0.4).toFixed(1)));
      }
      student.attendance = currentVal;
    }
  });

  closeModal('attendanceEntryModal');
  renderDashboard();
  showToast("Session attendance registered and saved.", "success");
  insertSystemLog("Manual attendance session registered", "Attendance session saved for class TE-COMP-A on standard lectures.", "attendance");
}

// Single student row click modification popup
function markIndividualAttendance(prn) {
  const student = students.find(s => s.prn === prn);
  if (!student) return;

  const choice = confirm(`Toggle attendance check state for ${student.name}.\nOK = Present Session (+0.5%)\nCancel = Absent Session (-1.5%)`);
  if (choice) {
    student.attendance = Math.min(100, parseFloat((student.attendance + 0.5).toFixed(1)));
    showToast(`Attendance marked Present for ${student.name}.`, 'success');
  } else {
    student.attendance = Math.max(10, parseFloat((student.attendance - 1.5).toFixed(1)));
    showToast(`Attendance marked Absent for ${student.name}.`, 'danger');
  }
  renderDashboard();
}

/* --- B. ATTENDANCE IMPORT EXCEL FLOW --- */
function openImportModal() {
  resetExcelUpload();
  openModal('attendanceImportModal');
}

function handleExcelFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    processMockExcelUpload(file.name, file.size);
  }
}

function processMockExcelUpload(filename, size) {
  const zone = document.getElementById("excelDropZone");
  const preview = document.getElementById("excelUploadPreview");
  const nameLbl = document.getElementById("previewFileName");
  const sizeLbl = document.getElementById("previewFileSize");
  const progressFill = document.getElementById("excelUploadProgressBar");
  const progressStatus = document.getElementById("excelProgressStatus");
  const validationBox = document.getElementById("excelValidationBox");
  const confirmBtn = document.getElementById("btnConfirmExcelImport");

  zone.style.display = "none";
  preview.style.display = "flex";
  validationBox.style.display = "none";
  confirmBtn.disabled = true;

  nameLbl.innerText = filename;
  sizeLbl.innerText = (size / (1024 * 1024)).toFixed(2) + " MB";

  // Simulate progress bar loader animation
  let prog = 0;
  progressFill.style.width = "0%";
  
  const timer = setInterval(() => {
    prog += 10;
    progressFill.style.width = prog + "%";
    progressStatus.innerText = `Uploading and parsing files... ${prog}%`;

    if (prog >= 100) {
      clearInterval(timer);
      progressStatus.innerText = "Parsing spreadsheet components completed.";
      validationBox.style.display = "block";
      confirmBtn.disabled = false;
    }
  }, 150);
}

function resetExcelUpload() {
  document.getElementById("excelDropZone").style.display = "flex";
  document.getElementById("excelUploadPreview").style.display = "none";
  document.getElementById("excelFileInput").value = "";
  document.getElementById("btnConfirmExcelImport").disabled = true;
}

function executeExcelImport() {
  closeModal('attendanceImportModal');
  
  // Randomly update attendance stats on 20 students to simulate imported file updates
  for(let i = 0; i < 20; i++) {
    const idx = Math.floor(Math.random() * students.length);
    const adjust = parseFloat((Math.random() * 6 - 3).toFixed(1)); // -3% to +3% change
    students[idx].attendance = Math.min(100, Math.max(15, parseFloat((students[idx].attendance + adjust).toFixed(1))));
  }

  renderDashboard();
  showToast("Excel spreadsheet imported successfully. 120 student rosters refreshed.", "success");
  insertSystemLog("Biometric Excel attendance logs imported", "120 records compiled from device logs. Defaulter list updated.", "system");
}

/* --- C. SEND CORRECTIVE NOTICE DIALOGS --- */
function openSendNoticeModal() {
  document.getElementById("noticeRecipientName").value = "All Critical Defaulters (18 Students)";
  document.getElementById("noticeRecipientPrn").value = "all";
  updateNoticeTemplate();
  openModal('sendNoticeModal');
}

function openSendNoticeSingleModal(name, prn) {
  document.getElementById("noticeRecipientName").value = `${name} (${prn})`;
  document.getElementById("noticeRecipientPrn").value = prn;
  updateNoticeTemplate();
  openModal('sendNoticeModal');
}

function updateNoticeTemplate() {
  const category = document.getElementById("noticeCategory").value;
  const contentArea = document.getElementById("noticeContent");
  const recipient = document.getElementById("noticeRecipientName").value;

  let templateText = "";
  if (category === 'critical-warning') {
    templateText = `Dear Parent/Guardian,\n\nThis is an official administrative alert regarding the critical class attendance percentage of your ward (${recipient}).\n\nCurrently, the cumulative attendance is registered below 60%. As per university rules, students with attendance under 75% are ineligible to appear for term end examinations.\n\nPlease ensure corrective actions are taken immediately to avoid academic loss.\n\nRegards,\nProf. Rajesh Kulkarni\nGFM Coordinator, Apex IT`;
  } else if (category === 'warning-alert') {
    templateText = `Dear Parent/Guardian,\n\nWe would like to draw your attention to the current attendance status of your ward (${recipient}).\n\nTheir current overall attendance is in the warning band (60%-74%). Regular attendance in theory lectures and lab sessions is vital for continuous evaluation.\n\nRegards,\nProf. Rajesh Kulkarni\nGFM Coordinator, Apex IT`;
  } else if (category === 'parent-meeting') {
    templateText = `Dear Parent/Guardian,\n\nYou are hereby requested to attend a Parent-Faculty Meeting on Saturday, July 25, 2026, at 10:00 AM in Room 304, Academic Block II.\n\nThe agenda is to discuss the critical attendance deficit of your ward (${recipient}) and sign a commitment bond for the remainder of the semester.\n\nRegards,\nProf. Rajesh Kulkarni\nGFM Coordinator, Apex IT`;
  }

  contentArea.value = templateText;
}

function handleSendNoticeSubmit(event) {
  event.preventDefault();
  const recipient = document.getElementById("noticeRecipientName").value;
  const channelEmail = document.getElementById("channelEmail").checked;
  const channelSMS = document.getElementById("channelSMS").checked;

  closeModal('sendNoticeModal');
  showToast(`Corrective notice alerts dispatched successfully to ${recipient}.`, "success");
  
  let deliveryDetails = "Sent via Portal";
  if (channelEmail) deliveryDetails += " + Email";
  if (channelSMS) deliveryDetails += " + SMS";
  
  insertSystemLog(`Attendance warning notice dispatched`, `Notice sent to ${recipient}. Delivery path: ${deliveryDetails}.`, "notice");
  
  // Decrease pending warnings count mock visual indicator
  const pendingCount = document.getElementById("statsPendingNoticesCount");
  let val = parseInt(pendingCount.innerText);
  if (val > 0) {
    pendingCount.innerText = String(val - 1).padStart(2, '0');
  }
}

// Bulk warning trigger button
function dispatchAllBulkWarnings() {
  const confirmAction = confirm("Send email and portal notices to all 18 critical attendance defaulters and their parent guardians?");
  if (confirmAction) {
    showToast("Bulk warning notices dispatched to 18 parents.", "success");
    insertSystemLog("Bulk notices dispatched", "Level-1 warnings sent to parents of all students below 60% attendance.", "critical");
    document.getElementById("statsPendingNoticesCount").innerText = "00";
  }
}

// Quick warning alert trigger on profile cards
function triggerSingleQuickWarning(name) {
  showToast(`Portal notification warning sent to ${name}.`, "info");
  insertSystemLog("Portal alert dispatched", `Immediate warning indicator pushed to student portal for ${name}.`, "notice");
}

/* --- D. PDF & EXCEL REPORTS --- */
function executeReportGeneration() {
  closeModal('reportsModal');
  showToast("Compiling statistics and generating report file...", "info");
  
  setTimeout(() => {
    showToast("Report compiled. Download started.", "success");
    insertSystemLog("Report downloaded by user", "Student cumulative spreadsheet generated and saved locally.", "system");
  }, 1500);
}

function triggerPDFExport() {
  showToast("Initiating PDF printer layout compiling...", "info");
  setTimeout(() => {
    window.print();
  }, 1000);
}


// ==========================================================================
// 8. INTERACTIVE COMPONENT DETAILS (CLOCK, CALENDAR, DRAG/DROP, SCRATCHPAD)
// ==========================================================================

// Real-time hero banner clock
function initClock() {
  const clockTime = document.getElementById("liveClockTime");
  const clockDate = document.getElementById("liveClockDate");

  function tick() {
    const now = new Date();
    // Fake current year to 2026 to match instructions metadata
    const fakeNow = new Date(2026, 6, 21, now.getHours(), now.getMinutes(), now.getSeconds());
    
    clockTime.innerText = fakeNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    clockDate.innerText = fakeNow.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  tick();
  setInterval(tick, 1000);
}

// Generate calendar table grid
function generateCalendar() {
  const daysBody = document.getElementById("calendarDaysBody");
  daysBody.innerHTML = "";

  const month = calendarCurrentDate.getMonth();
  const year = calendarCurrentDate.getFullYear();

  // Set month title
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  document.getElementById("calendarMonthYear").innerText = `${monthNames[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const prevLastDay = new Date(year, month, 0).getDate();

  // Highlight days with events
  const eventDays = [25, 28, 31]; // Meeting, Review, Phase-1 Report

  // Render previous month overlap dates
  for (let i = firstDayIndex; i > 0; i--) {
    const day = document.createElement("div");
    day.className = "cal-day prev-month";
    day.innerText = prevLastDay - i + 1;
    daysBody.appendChild(day);
  }

  // Render current month dates
  for (let i = 1; i <= lastDay; i++) {
    const day = document.createElement("div");
    day.className = "cal-day";
    day.innerText = i;

    // Highlight today (July 21, 2026)
    if (i === 21 && month === 6 && year === 2026) {
      day.classList.add("today");
    }

    // Highlight custom events
    if (eventDays.includes(i) && month === 6 && year === 2026) {
      day.classList.add("highlight-event");
      day.title = i === 25 ? "Parent-GFM Meeting" : (i === 28 ? "Attendance Review" : "Report Submission");
    }

    day.onclick = () => {
      if (eventDays.includes(i)) {
        showToast(`Event: ${day.title} on ${monthNames[month]} ${i}`, 'warning');
      } else {
        showToast(`Date selected: ${monthNames[month]} ${i}, ${year}`, 'info');
      }
    };

    daysBody.appendChild(day);
  }

  // Render next month overlap dates
  const totalDaysSoFar = firstDayIndex + lastDay;
  const remainingCells = 42 - totalDaysSoFar; // 6 rows * 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const day = document.createElement("div");
    day.className = "cal-day next-month";
    day.innerText = i;
    daysBody.appendChild(day);
  }
}

function adjustCalendarMonth(offset) {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + offset);
  generateCalendar();
}

// Scratchpad Autosave logic
function loadQuickNotes() {
  const notes = localStorage.getItem("gfm_scratchpad_notes");
  const textarea = document.getElementById("quickNotesTextarea");
  if (notes && textarea) {
    textarea.value = notes;
  }

  if (textarea) {
    textarea.oninput = () => {
      localStorage.setItem("gfm_scratchpad_notes", textarea.value);
    };
  }
}

// ==========================================================================
// 9. EVENT LISTENERS SETUP
// ==========================================================================
function setupEventListeners() {
  // A. Collapsible Sidebar toggle
  const sidebar = document.getElementById("sidebar");
  const hamburger = document.getElementById("hamburgerBtn");
  const closeSidebar = document.getElementById("sidebarCloseBtn");

  hamburger.onclick = (e) => {
    e.stopPropagation();
    if (window.innerWidth > 992) {
      sidebar.classList.toggle("collapsed");
    } else {
      sidebar.classList.toggle("mobile-open");
    }
  };

  if (closeSidebar) {
    closeSidebar.onclick = () => {
      sidebar.classList.remove("mobile-open");
    };
  }

  // Close sidebar drawer clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 992 && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
      sidebar.classList.remove("mobile-open");
    }
  });

  // B. Navigation Links (Single Page routing toggles)
  document.querySelectorAll(".sidebar-menu .menu-item").forEach(link => {
    link.addEventListener("click", (e) => {
      const page = link.getAttribute("data-page");
      
      // Modals triggers shouldn't redirect pages
      if (['attendance-entry', 'attendance-import', 'reports', 'profile', 'settings'].includes(page)) {
        e.preventDefault();
        return;
      }

      if (page) {
        e.preventDefault();
        showView(page);
        
        // Scroll to table container directly on specific pages
        if (page === 'student-list') {
          scrollToElement('studentTableSection');
        } else if (page === 'defaulters') {
          filterTableByDefaulterMode();
        }
      }
    });
  });

  // C. Profile Dropdown Panel
  const profileTrigger = document.getElementById("profileDropdownBtn");
  const profileMenu = document.getElementById("profileDropdownMenu");

  profileTrigger.onclick = (e) => {
    e.stopPropagation();
    const expanded = profileTrigger.getAttribute("aria-expanded") === 'true';
    profileTrigger.setAttribute("aria-expanded", !expanded);
    profileMenu.classList.toggle("show");
  };

  // D. Notification Dropdown Panel
  const bellTrigger = document.getElementById("navbarBellBtn");
  const notifDropdown = document.getElementById("notificationDropdown");

  bellTrigger.onclick = (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle("show");
  };

  // Close drop panels when clicking outside
  document.addEventListener("click", () => {
    profileMenu.classList.remove("show");
    profileTrigger.setAttribute("aria-expanded", "false");
    notifDropdown.classList.remove("show");
  });

  // E. Table Filter Select
  document.getElementById("tableAttendanceFilter").onchange = (e) => {
    currentFilter = e.target.value;
    currentPage = 1;
    renderStudentTable();
  };

  // F. Table Search Input filter
  document.getElementById("tableSearchInput").oninput = (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    renderStudentTable();
  };

  // G. Global Navbar Search Box
  document.getElementById("globalSearchInput").oninput = (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    // Set table filter input to match search queries visually
    document.getElementById("tableSearchInput").value = searchQuery;
    // Scroll automatically to table
    renderStudentTable();
    scrollToElement('studentTableSection');
  };

  // H. Dark Mode switcher action
  const themeToggle = document.getElementById("themeToggleBtn");
  themeToggle.onclick = () => {
    const currentTheme = document.body.getAttribute("data-theme");
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // I. Drag and Drop file selector zones
  const dropZone = document.getElementById("excelDropZone");
  
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
        processMockExcelUpload(file.name, file.size);
      } else {
        showToast("Invalid file format. Please upload spreadsheet files only.", "danger");
      }
    });
  }

  // J. Logout Buttons Mocks
  document.getElementById("btnLogout").onclick = handleLogout;
  document.getElementById("btnLogoutDropdown").onclick = handleLogout;
}

function handleLogout(e) {
  e.preventDefault();
  const logoutConfirm = confirm("Are you sure you want to log out from GFM portal?");
  if (logoutConfirm) {
    showToast("Logging out from ERP environment...", "info");
    setTimeout(() => {
      alert("Mock Logout triggered. You would be redirected to the college portal gateway.");
      window.location.href = "../index.html";
    }, 1000);
  }
}

// Full Notification section log tab filter links
function filterLogs(category) {
  // Toggle active filter button styling
  document.querySelectorAll(".log-filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  const activeBtn = document.getElementById(`btnLogFilter${category.charAt(0).toUpperCase() + category.slice(1)}`);
  if (activeBtn) activeBtn.classList.add("active");

  const fullPageContainer = document.getElementById("notificationFullListContainer");
  fullPageContainer.innerHTML = "";

  const filteredLogs = notificationsList.filter(n => {
    if (category === 'all') return true;
    if (category === 'unread') return n.unread;
    return n.category === category;
  });

  filteredLogs.forEach(notif => {
    // Generate list item markup
    let iconSvg = '';
    let categoryClass = 'bg-primary-light';
    
    if (notif.category === 'critical') {
      categoryClass = 'bg-danger-light';
      iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--danger)" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else if (notif.category === 'notice') {
      categoryClass = 'bg-warning-light';
      iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--warning)" stroke-width="2" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
    } else {
      categoryClass = 'bg-blue-light';
      iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--primary)" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
    }

    const item = document.createElement("div");
    item.className = `full-notification-item ${notif.unread ? 'unread' : ''}`;
    item.innerHTML = `
      <div class="notif-icon-circle ${categoryClass}">
        ${iconSvg}
      </div>
      <div class="notif-details">
        <h4>${notif.title}</h4>
        <p>${notif.content}</p>
        <div class="notif-meta-row">
          <span class="notif-badge-lbl ${notif.category}">${notif.category}</span>
          <span class="notif-time">${notif.timestamp}</span>
        </div>
      </div>
      <div class="delete-notif-btn" onclick="deleteNotification(${notif.id}, event)" title="Dismiss log alert">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="12"/></svg>
      </div>
    `;
    item.onclick = () => {
      if (notif.unread) {
        notif.unread = false;
        renderNotificationBadges();
        filterLogs(category);
      }
    };
    fullPageContainer.appendChild(item);
  });

  if (filteredLogs.length === 0) {
    fullPageContainer.innerHTML = `<div style="padding: 40px; color: var(--text-secondary); text-align: center;">No logs matched filter criteria.</div>`;
  }
}

// Side bar toggler toggle view triggers
function toggleNotificationsPanel() {
  const notifView = document.getElementById("notifications-view");
  if (notifView.classList.contains("hidden-view")) {
    showView("notifications");
    filterLogs("all");
  } else {
    showView("dashboard");
  }
}

// ==========================================================================
// 10. THEME MANAGEMENT & CONFIGURATIONS
// ==========================================================================
function initializeTheme() {
  const savedTheme = localStorage.getItem("gfm_portal_theme") || 'light';
  setTheme(savedTheme);
}

function setTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("gfm_portal_theme", theme);

  const sun = document.querySelector(".sun-icon");
  const moon = document.querySelector(".moon-icon");

  if (theme === 'dark') {
    sun.style.display = "none";
    moon.style.display = "block";
  } else {
    sun.style.display = "block";
    moon.style.display = "none";
  }
}

// Password submission mock form handler
function handlePasswordSubmit(event) {
  event.preventDefault();
  const oldPass = document.getElementById("oldPass").value;
  const newPass = document.getElementById("newPass").value;
  const confirmPass = document.getElementById("confirmNewPass").value;

  if (newPass !== confirmPass) {
    showToast("Password confirmation mismatch. Please verify passwords match.", "danger");
    return;
  }

  closeModal('passwordChangeModal');
  showToast("Security credentials updated. Passwords changed successfully.", "success");
  insertSystemLog("User credential update", "Admin portal authentication password was updated successfully.", "system");
  document.getElementById("passwordChangeForm").reset();
}

// Settings modal save handler
function handleSettingsSave(event) {
  event.preventDefault();
  baselineThreshold = parseInt(document.getElementById("setBaseline").value);
  defaulterThreshold = parseInt(document.getElementById("setDefaulter").value);

  closeModal('settingsModal');
  renderDashboard();
  showToast("Attendance settings configurations saved.", "success");
  insertSystemLog("Attendance configurations customized", `Attendance threshold set: Baseline: ${baselineThreshold}%, Defaulter: ${defaulterThreshold}%`, "system");
}

// Mock Attendance Chart trend toggle
function toggleTrendDuration(mode) {
  const btnWeekly = document.getElementById("btnTrendWeekly");
  const btnMonthly = document.getElementById("btnTrendMonthly");
  
  btnWeekly.classList.remove("active");
  btnMonthly.classList.remove("active");

  const trendLine = document.getElementById("trendLinePath");
  const trendArea = document.getElementById("trendAreaPath");
  const dotsContainer = document.getElementById("trendDotsContainer");
  const xAxisContainer = document.getElementById("trendXAxisLabels");

  if (mode === 'weekly') {
    btnWeekly.classList.add("active");
    // Standard weekly path
    trendLine.setAttribute("d", "M 50 80 C 80 70, 90 55, 110 60 C 130 65, 150 40, 170 45 C 190 50, 210 80, 230 70 C 250 60, 270 55, 290 50 C 310 45, 330 35, 350 40");
    trendArea.setAttribute("d", "M 50 180 L 50 80 Q 110 50 110 60 T 170 45 T 230 70 T 290 50 T 350 40 L 350 180 Z");
    
    // Reset Weekly dots
    dotsContainer.innerHTML = `
      <circle cx="50" cy="80" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" class="chart-dot" data-val="78%"/>
      <circle cx="110" cy="60" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" class="chart-dot" data-val="84%"/>
      <circle cx="170" cy="45" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" class="chart-dot" data-val="88%"/>
      <circle cx="230" cy="70" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" class="chart-dot" data-val="80%"/>
      <circle cx="290" cy="50" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" class="chart-dot" data-val="87%"/>
      <circle cx="350" cy="40" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" class="chart-dot" data-val="92%"/>
    `;
    xAxisContainer.innerHTML = `
      <text x="50" y="198" class="chart-text-lbl">Mon</text>
      <text x="110" y="198" class="chart-text-lbl">Tue</text>
      <text x="170" y="198" class="chart-text-lbl">Wed</text>
      <text x="230" y="198" class="chart-text-lbl">Thu</text>
      <text x="290" y="198" class="chart-text-lbl">Fri</text>
      <text x="350" y="198" class="chart-text-lbl">Sat</text>
    `;
    showToast("Weekly analytics loaded.", "info");
  } else {
    btnMonthly.classList.add("active");
    // Smooth lower flat lines for monthly average
    trendLine.setAttribute("d", "M 50 110 C 100 120, 120 100, 150 105 C 180 110, 220 90, 250 95 C 280 100, 310 115, 350 105");
    trendArea.setAttribute("d", "M 50 180 L 50 110 Q 150 105 150 105 T 250 95 T 350 105 L 350 180 Z");

    // Monthly Dots
    dotsContainer.innerHTML = `
      <circle cx="50" cy="110" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" class="chart-dot" data-val="71%"/>
      <circle cx="150" cy="105" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" class="chart-dot" data-val="73%"/>
      <circle cx="250" cy="95" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" class="chart-dot" data-val="76%"/>
      <circle cx="350" cy="105" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2" class="chart-dot" data-val="73%"/>
    `;
    xAxisContainer.innerHTML = `
      <text x="50" y="198" class="chart-text-lbl">April</text>
      <text x="150" y="198" class="chart-text-lbl">May</text>
      <text x="250" y="198" class="chart-text-lbl">June</text>
      <text x="350" y="198" class="chart-text-lbl">July</text>
    `;
    showToast("Monthly historical aggregates compiled and loaded.", "info");
  }
}
