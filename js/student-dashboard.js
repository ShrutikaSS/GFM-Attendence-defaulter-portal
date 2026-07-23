/**
 * GFM ATTENDANCE MANAGEMENT SYSTEM - STUDENT DASHBOARD
 * Vanilla JavaScript (Production Ready for PHP + MySQL API Integration)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. MOCK STATE & BACKEND READY DATA ENGINE
    // ==========================================
    // When connecting to PHP/MySQL later, replace this with fetch('/api/get_student_dashboard.php')
    const state = {
        student: {
            name: "Rahul Patil",
            rollNo: "2024CS108",
            department: "Artificial Intelligence & Machine Learning",
            semester: "Semester VI",
            division: "Div A",
            email: "rahul.patil@gfm.edu.in",
            phone: "+91 98765 43210",
            academicYear: "2025 - 2026",
            gfmName: "Prof. S. R. Sharma",
            guardianContact: "+91 98220 11223 (Father)",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
        },
        stats: {
            totalClasses: 150,
            classesAttended: 138,
            classesMissed: 12,
            overallAttendance: 92,
            minimumRequired: 75,
            targetGoal: 95
        },
        subjects: [
            { id: 1, name: "Web Development", faculty: "Prof. S. R. Sharma", total: 40, present: 38, absent: 2, percent: 95, icon: "fa-code" },
            { id: 2, name: "Data Structures", faculty: "Prof. A. V. Kulkarni", total: 36, present: 33, absent: 3, percent: 91.6, icon: "fa-diagram-project" },
            { id: 3, name: "Database Systems", faculty: "Prof. M. B. Deshmukh", total: 30, present: 28, absent: 2, percent: 93.3, icon: "fa-database" },
            { id: 4, name: "Computer Networks", faculty: "Prof. R. N. Mehta", total: 24, present: 21, absent: 3, percent: 87.5, icon: "fa-network-wired" },
            { id: 5, name: "Software Engineering", faculty: "Prof. P. T. Joshi", total: 20, present: 18, absent: 2, percent: 90.0, icon: "fa-cubes" }
        ],
        monthlyData: {
            months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            values: [90, 88, 94, 96, 93, 92],
            highestMonth: "April (96%)",
            lowestMonth: "February (88%)",
            avgAttendance: "92%"
        },
        notifications: [
            { id: 101, title: "Attendance Marked Today", desc: "Prof. Sharma marked Present for Web Development lecture.", time: "10 mins ago", unread: true, type: "SUCCESS", icon: "fa-circle-check", bgClass: "icon-bg-emerald" },
            { id: 102, title: "Assignment Deadline Reminder", desc: "Database Systems Mini Project report submission due tomorrow.", time: "2 hours ago", unread: true, type: "WARNING", icon: "fa-clock", bgClass: "icon-bg-amber" },
            { id: 103, title: "Internal Exam Schedule Released", desc: "Unit Test II timetable uploaded to GFM ERP portal.", time: "1 day ago", unread: true, type: "SYSTEM", icon: "fa-calendar-days", bgClass: "icon-bg-blue" },
            { id: 104, title: "GFM Monthly Review Complete", desc: "Attendance standing verified above 75% criterion.", time: "3 days ago", unread: false, type: "SUCCESS", icon: "fa-shield-halved", bgClass: "icon-bg-green" }
        ],
        schedule: [
            { id: 1, title: "Web Development Lab", time: "09:30 AM - 11:30 AM", room: "Computer Lab 4", status: "Completed" },
            { id: 2, title: "Data Structures Lecture", time: "11:45 AM - 12:45 PM", room: "Auditorium Hall B", status: "Ongoing" },
            { id: 3, title: "Database Systems", time: "01:30 PM - 02:30 PM", room: "Classroom 302", status: "Upcoming" }
        ],
        history: [
            { date: "2026-07-21", subject: "Web Development", faculty: "Prof. S. R. Sharma", status: "Present", percent: "95%", remarks: "Punctual & Interactive" },
            { date: "2026-07-21", subject: "Data Structures", faculty: "Prof. A. V. Kulkarni", status: "Present", percent: "91.6%", remarks: "Regular" },
            { date: "2026-07-20", subject: "Database Systems", faculty: "Prof. M. B. Deshmukh", status: "Present", percent: "93.3%", remarks: "Regular" },
            { date: "2026-07-20", subject: "Computer Networks", faculty: "Prof. R. N. Mehta", status: "Absent", percent: "87.5%", remarks: "Medical Leave Approved" },
            { date: "2026-07-19", subject: "Software Engineering", faculty: "Prof. P. T. Joshi", status: "Present", percent: "90.0%", remarks: "Regular" },
            { date: "2026-07-18", subject: "Web Development", faculty: "Prof. S. R. Sharma", status: "Present", percent: "95%", remarks: "Regular" },
            { date: "2026-07-17", subject: "Data Structures", faculty: "Prof. A. V. Kulkarni", status: "Present", percent: "91.6%", remarks: "Regular" },
            { date: "2026-07-16", subject: "Database Systems", faculty: "Prof. M. B. Deshmukh", status: "Present", percent: "93.3%", remarks: "Regular" },
            { date: "2026-07-15", subject: "Computer Networks", faculty: "Prof. R. N. Mehta", status: "Present", percent: "87.5%", remarks: "Regular" },
            { date: "2026-07-14", subject: "Software Engineering", faculty: "Prof. P. T. Joshi", status: "Absent", percent: "90.0%", remarks: "On Duty (NSS)" },
            { date: "2026-07-13", subject: "Web Development", faculty: "Prof. S. R. Sharma", status: "Present", percent: "95%", remarks: "Regular" },
            { date: "2026-07-12", subject: "Data Structures", faculty: "Prof. A. V. Kulkarni", status: "Present", percent: "91.6%", remarks: "Regular" }
        ],
        absent_dates: [
            { date: "2026-07-20", subject: "Computer Networks", remarks: "Medical Leave Approved", lecture: 3 },
            { date: "2026-07-14", subject: "Software Engineering", remarks: "On Duty (NSS)", lecture: 2 }
        ]
    };

    // Pagination State
    let currentHistoryPage = 1;
    const historyItemsPerPage = 6;
    let filteredHistory = [...state.history];

    let attendanceChartInstance = null;

    // ==========================================
    // 2. INITIALIZATION & DATA RENDERERS
    // ==========================================
    function init() {
        const storedUser = sessionStorage.getItem('attendance_user') || localStorage.getItem('attendance_user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed && parsed.full_name) {
                    state.student.name = parsed.full_name;
                    if (parsed.roll_no || parsed.roll_or_emp_id) state.student.rollNo = parsed.roll_no || parsed.roll_or_emp_id;
                    if (parsed.email) state.student.email = parsed.email;
                    if (parsed.department) state.student.department = parsed.department;
                    if (parsed.semester) state.student.semester = parsed.semester;
                    if (parsed.division) state.student.division = parsed.division;
                    if (parsed.gfm_name) state.student.gfmName = parsed.gfm_name;
                    if (parsed.phone) state.student.phone = parsed.phone;
                    if (parsed.guardian_contact) state.student.guardianContact = parsed.guardian_contact;
                    if (parsed.avatar_url) state.student.avatarUrl = parsed.avatar_url;
                }
            } catch(e) {}
        }

        // Load real data from API
        loadRealStudentData().then(apiData => {
            if (apiData) {
                Object.assign(state.stats, apiData.stats);
                if (apiData.subjects && apiData.subjects.length > 0) {
                    state.subjects = apiData.subjects;
                }
                if (apiData.monthlyData) {
                    state.monthlyData = apiData.monthlyData;
                }
                if (apiData.history && apiData.history.length > 0) {
                    state.history = apiData.history;
                }
                if (apiData.notifications && apiData.notifications.length > 0) {
                    state.notifications = apiData.notifications;
                }
                if (apiData.absent_dates && apiData.absent_dates.length > 0) {
                    state.absent_dates = apiData.absent_dates;
                }
                if (apiData.student) {
                    state.student = { ...state.student, ...apiData.student };
                }
            }

            renderStudentProfile();
            renderSummaryCards();
            renderSubjectCards();
            renderScheduleAndActivities();
            renderNotifications();
            renderHistoryTable();
            initAttendanceChart();
            initBunkCalculator();
            setupEventListeners();
            animateCounters();

            // Update current date
            const currentDateElem = document.getElementById('currentDate');
            if (currentDateElem) {
                const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
                currentDateElem.textContent = new Date().toLocaleDateString('en-US', options);
            }
        });
    }

    async function loadRealStudentData() {
        try {
            const res = await fetch('../api/get_student_dashboard.php');
            if (!res.ok) return null;
            const data = await res.json();
            if (data.success && data.data) {
                const mapped = {};
                if (data.data.student) mapped.student = data.data.student;
                if (data.data.stats) mapped.stats = data.data.stats;
                if (data.data.subjects) mapped.subjects = data.data.subjects;
                if (data.data.monthlyData) mapped.monthlyData = data.data.monthlyData;
                if (data.data.notifications) mapped.notifications = data.data.notifications;
                if (data.data.history) mapped.history = data.data.history;
                if (data.data.absent_dates) mapped.absent_dates = data.data.absent_dates;
                return mapped;
            }
        } catch (e) {
            console.warn('Could not load real student data, using defaults:', e.message);
        }
        return null;
    }

    // Render Student Profile Details
    function renderStudentProfile() {
        const p = state.student;
        if (!p.department || p.department === 'Computer Engineering' || p.department.includes('Computer')) {
            p.department = "Artificial Intelligence & Machine Learning";
        }
        // Navigation & Banner Elements
        setElemText('studentName', p.name);
        setElemText('studentNameNav', p.name);
        setElemText('studentRoll', p.rollNo);
        setElemText('studentRollNav', p.rollNo);
        setElemText('studentDept', p.department);
        setElemText('studentSem', p.semester);
        setElemText('studentDiv', p.division);

        // Profile Section Elements
        setElemText('profName', p.name);
        setElemText('profRoll', p.rollNo);
        setElemText('profDept', p.department);
        setElemText('profSemDiv', `${p.semester} - ${p.division}`);
        setElemText('profAcadYear', p.academicYear);
        setElemText('profEmail', p.email);
        setElemText('profPhone', p.phone);
        setElemText('profGfmName', p.gfmName);
        setElemText('profGuardian', p.guardianContact);

        if (document.getElementById('navUserAvatar')) document.getElementById('navUserAvatar').src = p.avatarUrl;
        if (document.getElementById('profilePhoto')) document.getElementById('profilePhoto').src = p.avatarUrl;
    }

    // Render Summary Cards & Warning Status
    function renderSummaryCards() {
        const s = state.stats;
        setElemText('overallAttendance', `${s.overallAttendance}%`);
        setElemText('classesAttended', s.classesAttended);
        setElemText('classesMissed', s.classesMissed);

        const badge = document.getElementById('overallAttendanceBadge');
        const warningStatusElem = document.getElementById('warningStatus');
        const warningDesc = document.getElementById('warningStatusDesc');
        const warningIconWrapper = document.getElementById('warningStatusIconWrapper');
        const eligibilityBadge = document.getElementById('eligibilityBadge');
        const gaugePercentage = document.getElementById('gaugePercentage');
        const gaugePath = document.getElementById('circularGaugePath');

        if (gaugePercentage) gaugePercentage.textContent = `${s.overallAttendance}%`;
        if (gaugePath) gaugePath.setAttribute('stroke-dasharray', `${s.overallAttendance}, 100`);

        // Rules check
        if (s.overallAttendance >= 75) {
            if (badge) { badge.className = "status-badge badge-success"; badge.textContent = "Above 75%"; }
            if (warningStatusElem) { warningStatusElem.textContent = "Safe"; warningStatusElem.className = "stat-status-text text-success"; }
            if (warningDesc) { warningDesc.textContent = "Good attendance standing"; warningDesc.className = "stat-subtext text-success"; }
            if (warningIconWrapper) warningIconWrapper.className = "stat-icon-wrapper icon-bg-emerald";
            if (eligibilityBadge) { eligibilityBadge.className = "badge badge-lg badge-success"; eligibilityBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Eligible for Exams`; }
        } else if (s.overallAttendance >= 60) {
            if (badge) { badge.className = "status-badge badge-warning"; badge.textContent = "Warning (60-75%)"; }
            if (warningStatusElem) { warningStatusElem.textContent = "Warning"; warningStatusElem.className = "stat-status-text text-amber"; }
            if (warningDesc) { warningDesc.textContent = "Need to attend upcoming classes"; warningDesc.className = "stat-subtext text-amber"; }
            if (warningIconWrapper) warningIconWrapper.className = "stat-icon-wrapper icon-bg-amber";
            if (eligibilityBadge) { eligibilityBadge.className = "badge badge-lg badge-warning"; eligibilityBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Action Required`; }
        } else {
            if (badge) { badge.className = "status-badge badge-danger"; badge.textContent = "Critical (<60%)"; }
            if (warningStatusElem) { warningStatusElem.textContent = "Critical"; warningStatusElem.className = "stat-status-text text-danger"; }
            if (warningDesc) { warningDesc.textContent = "Debarred risk! Contact GFM"; warningDesc.className = "stat-subtext text-danger"; }
            if (warningIconWrapper) warningIconWrapper.className = "stat-icon-wrapper icon-bg-danger";
            if (eligibilityBadge) { eligibilityBadge.className = "badge badge-lg badge-danger"; eligibilityBadge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Debarred Risk`; }
        }
    }

    // Render Subject Attendance Cards
    function renderSubjectCards() {
        const homeGrid = document.getElementById('personalAttendanceGrid');
        const fullGrid = document.getElementById('fullSubjectCardsGrid');

        if (!homeGrid && !fullGrid) return;

        const cardsHTML = state.subjects.map(sub => {
            let statusClass = "border-success";
            let pctBadgeClass = "badge-success";

            if (sub.percent < 75 && sub.percent >= 60) {
                statusClass = "border-warning";
                pctBadgeClass = "badge-warning";
            } else if (sub.percent < 60) {
                statusClass = "border-danger";
                pctBadgeClass = "badge-danger";
            }

            return `
                <div class="card glass-card subject-card ${statusClass}">
                    <div class="subject-card-header">
                        <div>
                            <h4 class="subject-name"><i class="fa-solid ${sub.icon} text-primary"></i> ${sub.name}</h4>
                            <span class="faculty-name">${sub.faculty}</span>
                        </div>
                        <span class="badge ${pctBadgeClass}">${sub.percent}%</span>
                    </div>

                    <div class="subject-metrics">
                        <div class="metric-col">
                            <span class="m-label">Total</span>
                            <span class="m-val">${sub.total}</span>
                        </div>
                        <div class="metric-col">
                            <span class="m-label">Present</span>
                            <span class="m-val text-success">${sub.present}</span>
                        </div>
                        <div class="metric-col">
                            <span class="m-label">Absent</span>
                            <span class="m-val text-danger">${sub.absent}</span>
                        </div>
                    </div>

                    <div class="subject-progress-footer">
                        <div class="subject-pct-row">
                            <span>Attendance Progress</span>
                            <strong>${sub.percent}%</strong>
                        </div>
                        <div class="stat-progress-line">
                            <div class="progress-bar-fill ${sub.percent >= 75 ? 'bg-emerald' : sub.percent >= 60 ? 'bg-amber' : 'bg-danger'}" style="width: ${sub.percent}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (homeGrid) homeGrid.innerHTML = cardsHTML;
        if (fullGrid) fullGrid.innerHTML = cardsHTML;
    }

    // Render Schedule & Recent Activity
    function renderScheduleAndActivities() {
        const scheduleList = document.getElementById('upcomingClassesList');
        if (scheduleList) {
            scheduleList.innerHTML = state.schedule.map(item => `
                <li class="schedule-item">
                    <div>
                        <div class="schedule-time"><i class="fa-regular fa-clock"></i> ${item.time}</div>
                        <div class="schedule-title">${item.title}</div>
                        <div class="schedule-room">${item.room}</div>
                    </div>
                    <span class="badge ${item.status === 'Completed' ? 'badge-success' : item.status === 'Ongoing' ? 'badge-primary' : 'badge-outline'}">${item.status}</span>
                </li>
            `).join('');
        }

        const recentList = document.getElementById('recentActivityList');
        if (recentList) {
            recentList.innerHTML = state.history.slice(0, 4).map(item => `
                <li class="activity-item">
                    <div class="activity-icon ${item.status === 'Present' ? 'icon-bg-emerald' : 'icon-bg-amber'}">
                        <i class="fa-solid ${item.status === 'Present' ? 'fa-check' : 'fa-xmark'}"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>${item.subject}</strong> marked as <span class="${item.status === 'Present' ? 'text-success' : 'text-danger'} font-700">${item.status}</span></p>
                        <span>${item.date} • ${item.faculty}</span>
                    </div>
                </li>
            `).join('');
        }

        // Render Absent Dates
        const absentList = document.getElementById('absentDatesList');
        const absentBadge = document.getElementById('absentCountBadge');
        if (absentList) {
            const absentDates = state.absent_dates || [];
            if (absentBadge) absentBadge.textContent = absentDates.length + ' Days';
            
            if (absentDates.length === 0) {
                absentList.innerHTML = '<li style="padding: 12px; text-align: center; color: var(--text-secondary);">No absences recorded. Great job!</li>';
            } else {
                absentList.innerHTML = absentDates.map(ad => `
                    <li class="absent-date-item">
                        <div class="absent-date-icon">
                            <i class="fa-solid fa-calendar-xmark"></i>
                        </div>
                        <div class="absent-date-info">
                            <strong>${ad.date}</strong>
                            <span>${ad.subject} ${ad.lecture ? '• Lecture ' + ad.lecture : ''}</span>
                            ${ad.remarks ? '<small class="text-muted">' + ad.remarks + '</small>' : ''}
                        </div>
                        <span class="badge badge-sm badge-danger">Absent</span>
                    </li>
                `).join('');
            }
        }
    }

    // Render Notifications Panel & Quick Dropdown
    function renderNotifications(filter = "ALL") {
        const listContainer = document.getElementById('notificationsList');
        const quickContainer = document.getElementById('quickNotifList');

        let filtered = state.notifications;
        if (filter === "UNREAD") filtered = state.notifications.filter(n => n.unread);
        if (filter === "WARNING") filtered = state.notifications.filter(n => n.type === "WARNING");

        if (listContainer) {
            if (filtered.length === 0) {
                listContainer.innerHTML = `<div style="text-align:center;padding:2.5rem 1rem;color:var(--text-muted)"><i class="fa-solid fa-bell-slash" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.4"></i><p style="font-size:0.9rem">No notifications found.</p></div>`;
            } else {
                listContainer.innerHTML = filtered.map(n => `
                    <div class="notif-card ${n.unread ? 'unread' : ''}" data-type="${n.type || 'SYSTEM'}" style="${n.type === 'WARNING' && n.unread ? 'border-left:4px solid #ef4444;background:rgba(239,68,68,0.07);' : ''}">
                        <div class="notif-icon-large ${n.bgClass}">
                            <i class="fa-solid ${n.icon}"></i>
                        </div>
                        <div class="notif-body-content">
                            <div class="notif-title-row">
                                <strong>${n.title}</strong>
                                <span class="notif-time-badge">${n.time}</span>
                            </div>
                            <p class="text-muted" style="font-size: 0.85rem;">${n.desc}</p>
                            ${n.unread ? '<span style="font-size:0.7rem;font-weight:600;color:var(--primary);margin-top:0.3rem;display:inline-block;">● UNREAD</span>' : ''}
                        </div>
                    </div>
                `).join('');
            }
        }

        if (quickContainer) {
            quickContainer.innerHTML = state.notifications.slice(0, 3).map(n => `
                <div class="quick-notif-item ${n.unread ? 'unread' : ''}">
                    <div class="quick-notif-icon ${n.bgClass}">
                        <i class="fa-solid ${n.icon}"></i>
                    </div>
                    <div class="quick-notif-content">
                        <strong>${n.title}</strong>
                        <p>${n.desc}</p>
                        <span class="quick-notif-time">${n.time}</span>
                    </div>
                </div>
            `).join('');
        }

        const unreadCount = state.notifications.filter(n => n.unread).length;
        setElemText('notifBadgeCount', unreadCount);
        setElemText('sidebarNotifBadge', unreadCount);
    }

    // Render Attendance History Table with Search, Filter & Pagination
    function renderHistoryTable() {
        const tbody = document.getElementById('attendanceHistory');
        if (!tbody) return;

        const startIndex = (currentHistoryPage - 1) * historyItemsPerPage;
        const pageItems = filteredHistory.slice(startIndex, startIndex + historyItemsPerPage);

        if (pageItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;" class="text-muted"><i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>No matching attendance records found.</td></tr>`;
        } else {
            tbody.innerHTML = pageItems.map(item => `
                <tr>
                    <td><strong>${item.date}</strong></td>
                    <td>${item.subject}</td>
                    <td>${item.faculty}</td>
                    <td>
                        <span class="badge ${item.status === 'Present' ? 'badge-success' : 'badge-danger'}">
                            <i class="fa-solid ${item.status === 'Present' ? 'fa-check' : 'fa-xmark'}"></i> ${item.status}
                        </span>
                    </td>
                    <td><strong>${item.percent}</strong></td>
                    <td class="text-muted">${item.remarks}</td>
                </tr>
            `).join('');
        }

        // Update Pagination Info
        const total = filteredHistory.length;
        const endItem = Math.min(startIndex + historyItemsPerPage, total);
        const startItem = total > 0 ? startIndex + 1 : 0;
        
        setElemText('historyPaginationInfo', `Showing ${startItem} to ${endItem} of ${total} entries`);
        setElemText('historyPageNum', `Page ${currentHistoryPage}`);

        const prevBtn = document.getElementById('historyPrevBtn');
        const nextBtn = document.getElementById('historyNextBtn');
        if (prevBtn) prevBtn.disabled = currentHistoryPage === 1;
        if (nextBtn) nextBtn.disabled = endItem >= total;
    }

    // Filter History Table Function
    function applyHistoryFilters() {
        const searchVal = (document.getElementById('historySearchInput')?.value || '').toLowerCase();
        const subjectVal = document.getElementById('historySubjectFilter')?.value || 'ALL';
        const statusVal = document.getElementById('historyStatusFilter')?.value || 'ALL';
        const dateVal = document.getElementById('historyDateFilter')?.value || '';

        filteredHistory = state.history.filter(item => {
            const matchesSearch = item.subject.toLowerCase().includes(searchVal) ||
                                  item.faculty.toLowerCase().includes(searchVal) ||
                                  item.remarks.toLowerCase().includes(searchVal);
            const matchesSubject = subjectVal === 'ALL' || item.subject === subjectVal;
            const matchesStatus = statusVal === 'ALL' || item.status === statusVal;
            const matchesDate = !dateVal || item.date === dateVal;

            return matchesSearch && matchesSubject && matchesStatus && matchesDate;
        });

        currentHistoryPage = 1;
        renderHistoryTable();
    }

    // ==========================================
    // 3. CHART & CALCULATOR ENGINE
    // ==========================================
    function initAttendanceChart() {
        const ctx = document.getElementById('attendanceGraphChart')?.getContext('2d');
        if (!ctx) return;

        // Gradient styling
        const gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#cbd5e1' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

        if (attendanceChartInstance) {
            attendanceChartInstance.destroy();
        }

        attendanceChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: state.monthlyData.months,
                datasets: [{
                    label: 'Attendance %',
                    data: state.monthlyData.values,
                    borderColor: '#2563eb',
                    borderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        titleColor: isDark ? '#f8fafc' : '#0f172a',
                        bodyColor: isDark ? '#cbd5e1' : '#475569',
                        borderColor: '#2563eb',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        callbacks: {
                            label: function(context) {
                                return ` Attendance: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { family: 'Inter' } }
                    },
                    y: {
                        min: 50,
                        max: 100,
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            font: { family: 'Inter' },
                            callback: value => value + '%'
                        }
                    }
                }
            }
        });
    }

    // Bunk Simulator & Attendance Goal Engine
    function initBunkCalculator() {
        const s = state.stats;
        setElemText('calcCurrentAtt', `${s.overallAttendance}%`);

        const adviceElem = document.getElementById('calcClassesAdvice');
        if (!adviceElem) return;

        // Formula: Current Present = s.classesAttended, Total = s.totalClasses
        // Safe bunk equation: (Attended / (Total + B)) >= 0.75 => B <= (Attended - 0.75 * Total) / 0.75
        const maxBunk = Math.floor((s.classesAttended - 0.75 * s.totalClasses) / 0.75);

        if (s.overallAttendance >= 75) {
            adviceElem.textContent = `Can miss ${Math.max(0, maxBunk)} classes`;
            adviceElem.className = "metric-value text-emerald";
        } else {
            // Need to attend: (Attended + N) / (Total + N) >= 0.75 => N >= (0.75 * Total - Attended) / 0.25
            const needAttend = Math.ceil((0.75 * s.totalClasses - s.classesAttended) / 0.25);
            adviceElem.textContent = `Must attend ${needAttend} lectures continuously`;
            adviceElem.className = "metric-value text-danger";
        }

        const simInput = document.getElementById('simulateMissClasses');
        const simBtn = document.getElementById('simCalcBtn');
        const simResult = document.getElementById('simResultMsg');

        if (simBtn && simInput && simResult) {
            const calculateSim = () => {
                const missed = parseInt(simInput.value) || 0;
                const newTotal = s.totalClasses + missed;
                const newPct = ((s.classesAttended / newTotal) * 100).toFixed(1);
                
                let standing = "Safe";
                let colorClass = "text-success";
                if (newPct < 75 && newPct >= 60) { standing = "Warning"; colorClass = "text-amber"; }
                if (newPct < 60) { standing = "Critical Risk"; colorClass = "text-danger"; }

                simResult.innerHTML = `Projected Attendance: <strong class="${colorClass}">${newPct}%</strong> (${standing})`;
            };

            simBtn.addEventListener('click', calculateSim);
            simInput.addEventListener('input', calculateSim);
        }
    }

    // ==========================================
    // 4. EVENT LISTENERS & UI INTERACTIONS
    // ==========================================
    function setupEventListeners() {
        
        // Tab Navigation switching
        const navLinks = document.querySelectorAll('.nav-link, .view-all-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetTab = link.getAttribute('data-tab');
                if (targetTab) {
                    e.preventDefault();
                    switchTab(targetTab);
                    closeMobileSidebar();
                }
            });
        });

        // Mobile Sidebar Toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');

        if (sidebarToggle && sidebar && backdrop) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                backdrop.classList.toggle('hidden');
            });

            backdrop.addEventListener('click', closeMobileSidebar);
        }

        // Dark Theme Toggle Buttons
        const themeBtn = document.getElementById('themeToggle');
        const darkSwitch = document.getElementById('settingsDarkSwitch');

        const savedTheme = localStorage.getItem('gfm_theme') || 'light';
        setTheme(savedTheme);

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const next = current === 'dark' ? 'light' : 'dark';
                setTheme(next);
            });
        }

        if (darkSwitch) {
            darkSwitch.addEventListener('change', (e) => {
                setTheme(e.target.checked ? 'dark' : 'light');
            });
        }

        // Notification Bell Dropdown Toggle
        const notifBell = document.getElementById('notifBell');
        const notifDropdown = document.getElementById('notifDropdown');

        if (notifBell && notifDropdown) {
            notifBell.addEventListener('click', (e) => {
                e.stopPropagation();
                notifDropdown.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!notifDropdown.contains(e.target) && !notifBell.contains(e.target)) {
                    notifDropdown.classList.add('hidden');
                }
            });
        }

        // Mark all read button
        const markAllBtn = document.getElementById('markAllReadBtn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', async () => {
                try {
                    const res = await fetch('../api/notification_actions.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ action: 'mark_all_read' })
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                        state.notifications.forEach(n => n.unread = false);
                        renderNotifications();
                        showToast("All notifications marked as read", "success");
                    } else {
                        showToast(data.message || "Failed to mark as read", "warning");
                    }
                } catch (err) {
                    showToast("Error communicating with server", "danger");
                }
            });
        }

        // Notifications Filter Tabs
        const notifTabBtns = document.querySelectorAll('.notif-tab-btn');
        notifTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                notifTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderNotifications(btn.getAttribute('data-filter'));
            });
        });

        // History Table Search & Filters
        document.getElementById('historySearchInput')?.addEventListener('input', applyHistoryFilters);
        document.getElementById('historySubjectFilter')?.addEventListener('change', applyHistoryFilters);
        document.getElementById('historyStatusFilter')?.addEventListener('change', applyHistoryFilters);
        document.getElementById('historyDateFilter')?.addEventListener('change', applyHistoryFilters);

        document.getElementById('historyResetBtn')?.addEventListener('click', () => {
            if (document.getElementById('historySearchInput')) document.getElementById('historySearchInput').value = '';
            if (document.getElementById('historySubjectFilter')) document.getElementById('historySubjectFilter').value = 'ALL';
            if (document.getElementById('historyStatusFilter')) document.getElementById('historyStatusFilter').value = 'ALL';
            if (document.getElementById('historyDateFilter')) document.getElementById('historyDateFilter').value = '';
            applyHistoryFilters();
            showToast("Search filters reset", "info");
        });

        // History Pagination Controls
        document.getElementById('historyPrevBtn')?.addEventListener('click', () => {
            if (currentHistoryPage > 1) {
                currentHistoryPage--;
                renderHistoryTable();
            }
        });

        document.getElementById('historyNextBtn')?.addEventListener('click', () => {
            if (currentHistoryPage * historyItemsPerPage < filteredHistory.length) {
                currentHistoryPage++;
                renderHistoryTable();
            }
        });

        // Logout Buttons
        const logoutHandler = async () => {
            if (confirm("Are you sure you want to log out from GFM Portal?")) {
                showToast("Logging out...", "warning");
                sessionStorage.clear();
                localStorage.clear();
                try {
                    await fetch('../api/logout.php');
                } catch (e) {}
                setTimeout(() => {
                    window.location.href = '../login.html';
                }, 500);
            }
        };
        document.getElementById('logoutBtnNav')?.addEventListener('click', logoutHandler);
        document.getElementById('sidebarLogoutBtn')?.addEventListener('click', logoutHandler);

        // Save Settings Demo
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            showToast("Preferences saved successfully!", "success");
        });
    }

    // Switch Tab Section
    function switchTab(tabId) {
        // Update Nav Links Active Class
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-tab') === tabId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Hide all sections, show active
        const tabMap = {
            'dashboard': 'sectionDashboard',
            'attendance': 'sectionAttendance',
            'history': 'sectionHistory',
            'notifications': 'sectionNotifications',
            'profile': 'sectionProfile',
            'settings': 'sectionSettings'
        };

        Object.keys(tabMap).forEach(key => {
            const section = document.getElementById(tabMap[key]);
            if (section) {
                if (key === tabId) {
                    section.classList.remove('hidden');
                    section.classList.add('active');
                } else {
                    section.classList.add('hidden');
                    section.classList.remove('active');
                }
            }
        });

        // Re-render chart if switching to dashboard
        if (tabId === 'dashboard') {
            setTimeout(initAttendanceChart, 100);
        }
    }

    function closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.add('hidden');
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('gfm_theme', theme);

        const darkSwitch = document.getElementById('settingsDarkSwitch');
        if (darkSwitch) darkSwitch.checked = (theme === 'dark');

        // Re-render chart grid colors
        initAttendanceChart();
    }

    // ==========================================
    // 5. HELPER UTILITIES: COUNTERS & TOASTS
    // ==========================================
    function setElemText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 1200;
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = target / steps;
            let current = 0;

            const isPct = counter.id === 'overallAttendance';

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = isPct ? `${target}%` : target;
                    clearInterval(timer);
                } else {
                    counter.textContent = isPct ? `${Math.floor(current)}%` : Math.floor(current);
                }
            }, stepTime);
        });
    }

    function showToast(message, type = "info", duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = "fa-info-circle text-primary";
        if (type === "success") icon = "fa-circle-check text-success";
        if (type === "warning") icon = "fa-triangle-exclamation text-amber";
        if (type === "danger") icon = "fa-circle-xmark text-danger";

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span style="font-size: 0.88rem; font-weight: 600;">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Launch Dashboard Engine with Backend Integration
    async function loadDashboardData() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('hidden');
        
        try {
            const res = await fetch('../api/get_student_dashboard.php');
            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    // Overwrite default state with database results
                    state.student = result.data.student;
                    if (state.student) {
                        state.student.department = "Artificial Intelligence & Machine Learning";
                    }
                    state.stats = result.data.stats;
                    state.subjects = result.data.subjects;
                    state.monthlyData = result.data.monthlyData;
                    state.notifications = result.data.notifications;
                    state.schedule = result.data.schedule;
                    state.history = result.data.history;
                    
                    filteredHistory = [...state.history];
                    
                    init();
                    if (overlay) overlay.classList.add('hidden');
                    return;
                }
            }
        } catch (err) {
            console.error("Error loading dashboard data from backend:", err);
        }
        
        // Redirect to login if unauthorized or error
        if (overlay) overlay.classList.add('hidden');
        showToast("Session expired. Redirecting to login...", "danger");
        setTimeout(() => {
            window.location.href = '../login.html';
        }, 1500);
    }
    
    loadDashboardData();

});
