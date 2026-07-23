// ============================================================
// HOD ATTENDANCE MANAGEMENT (FULL PARITY WITH GFM)
// ============================================================
(function() {
  'use strict';

  let currentRecords = [];
  let currentRoster = [];
  let csrfToken = '';
  let currentUser = null;
  let editingId = null;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const authed = await loadSession();
    if (!authed) return;

    setupTabs();
    setupEventListeners();
    loadHodStats();
    setDefaultDate();
  }

  function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const entryDate = document.getElementById('entryDate');
    if (entryDate) entryDate.value = today;
  }

  async function loadSession() {
    try {
      const res = await fetch('../api/session.php');
      const data = await res.json();
      if (data.authenticated && data.user && data.user.role === 'hod') {
        currentUser = data.user;
        csrfToken = data.csrf_token || '';
        document.getElementById('csrfToken').value = csrfToken;
        return true;
      } else {
        showToast('error', 'Session expired. Please login again.');
        setTimeout(() => window.location.href = '../login.html', 1500);
        return false;
      }
    } catch (e) {
      showToast('error', 'Network error. Please check your connection.');
      setTimeout(() => window.location.href = '../login.html', 1500);
      return false;
    }
  }

  function setupTabs() {
    const tabMark = document.getElementById('tabMarkBtn');
    const tabRecords = document.getElementById('tabRecordsBtn');
    const secMark = document.getElementById('sectionMarkAttendance');
    const secRecords = document.getElementById('sectionManageRecords');

    if (tabMark && tabRecords) {
      tabMark.addEventListener('click', () => {
        tabMark.classList.add('active');
        tabRecords.classList.remove('active');
        secMark.style.display = 'block';
        secRecords.style.display = 'none';
      });

      tabRecords.addEventListener('click', () => {
        tabRecords.classList.add('active');
        tabMark.classList.remove('active');
        secRecords.style.display = 'block';
        secMark.style.display = 'none';
        if (currentRecords.length === 0) {
          loadAttendanceRecords();
        }
      });
    }
  }

  function setupEventListeners() {
    // Attendance Entry Listeners
    document.getElementById('loadRosterBtn')?.addEventListener('click', loadRoster);
    document.getElementById('btnMarkAllPresent')?.addEventListener('click', () => setAllRosterStatus('Present'));
    document.getElementById('btnMarkAllAbsent')?.addEventListener('click', () => setAllRosterStatus('Absent'));
    document.getElementById('btnSubmitAttendance')?.addEventListener('click', submitAttendance);

    // Records / History Listeners
    document.getElementById('hodApplyFilterBtn')?.addEventListener('click', loadAttendanceRecords);
    document.getElementById('hodResetFilterBtn')?.addEventListener('click', resetFilters);
    document.getElementById('hodExportExcelBtn')?.addEventListener('click', exportExcel);
    document.getElementById('hodExportPdfBtn')?.addEventListener('click', exportPdf);

    // Edit Modal Listeners
    document.getElementById('editCancelBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('editSaveBtn')?.addEventListener('click', saveEdit);
    document.getElementById('editModalOverlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeEditModal();
    });

    // Global Live Search
    document.getElementById('globalSearch')?.addEventListener('input', (e) => {
      filterVisibleTables(e.target.value.toLowerCase());
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeEditModal();
    });
  }

  function loadHodStats() {
    fetch('../api/get_hod_dashboard.php')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          document.getElementById('hodTotalStat').textContent = data.data.totalStudents || '0';
          document.getElementById('hodAvgStat').textContent = (data.data.overallAttendance || '0');
          document.getElementById('hodDefaulterStat').textContent = (data.data.defaulters || '0');
        }
      })
      .catch(() => {});
  }

  // ============================================================
  // 1. MARK NEW ATTENDANCE LOGIC
  // ============================================================
  async function loadRoster() {
    const btn = document.getElementById('loadRosterBtn');
    const division = document.getElementById('entryDivision').value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

    try {
      const res = await fetch('../api/get_class_students.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ division })
      });
      const data = await res.json();

      if (data.success) {
        currentRoster = data.data || [];
        renderRosterTable(currentRoster);
      } else {
        showToast('error', data.message || 'Failed to load class roster.');
      }
    } catch (e) {
      showToast('error', 'Error loading roster.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-users-viewfinder"></i> Load Roster';
    }
  }

  function renderRosterTable(students) {
    const tbody = document.getElementById('entryRosterTableBody');
    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">No students found for this division.</td></tr>';
      return;
    }

    tbody.innerHTML = students.map((s, idx) => `
      <tr data-student-id="${s.user_id}">
        <td><strong>${escapeHtml(s.roll_no || '-')}</strong></td>
        <td>${escapeHtml(s.prn || '-')}</td>
        <td>${escapeHtml(s.full_name || '-')}</td>
        <td>${escapeHtml(s.division || '-')}</td>
        <td style="text-align:center;">
          <div class="radio-pill-group">
            <label class="opt-present">
              <input type="radio" name="status_${s.user_id}" value="Present" checked /> Present
            </label>
            <label class="opt-absent">
              <input type="radio" name="status_${s.user_id}" value="Absent" /> Absent
            </label>
            <label class="opt-medical">
              <input type="radio" name="status_${s.user_id}" value="Medical Leave" /> Medical
            </label>
            <label class="opt-duty">
              <input type="radio" name="status_${s.user_id}" value="Duty Leave" /> Duty
            </label>
          </div>
        </td>
        <td>
          <input type="text" class="custom-select-box roster-remark" placeholder="Remarks" style="width: 100%; padding: 4px 8px; font-size: 0.82rem;" />
        </td>
      </tr>
    `).join('');
  }

  function setAllRosterStatus(status) {
    if (currentRoster.length === 0) return;
    currentRoster.forEach(s => {
      const radio = document.querySelector(`input[name="status_${s.user_id}"][value="${status}"]`);
      if (radio) radio.checked = true;
    });
  }

  async function submitAttendance() {
    if (currentRoster.length === 0) {
      showToast('error', 'Please load a class roster first.');
      return;
    }

    const division = document.getElementById('entryDivision').value;
    const subject = document.getElementById('entrySubject').value;
    const date = document.getElementById('entryDate').value;
    const lecture_number = parseInt(document.getElementById('entryLectureNo').value) || 1;

    if (!date) {
      showToast('error', 'Date is required.');
      return;
    }

    const records = [];
    const rows = document.querySelectorAll('#entryRosterTableBody tr[data-student-id]');

    rows.forEach(row => {
      const studentId = parseInt(row.getAttribute('data-student-id'));
      const selectedRadio = row.querySelector('input[type="radio"]:checked');
      const status = selectedRadio ? selectedRadio.value : 'Present';
      const remarkInput = row.querySelector('.roster-remark');
      const remarks = remarkInput ? remarkInput.value.trim() || 'Regular' : 'Regular';

      records.push({
        student_id: studentId,
        status: status,
        remarks: remarks
      });
    });

    const submitBtn = document.getElementById('btnSubmitAttendance');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
      const res = await fetch('../api/save_attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          division,
          subject,
          date,
          lecture_number,
          semester: 'Semester VI',
          records,
          update_existing: true,
          reason: 'HOD Attendance Entry'
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Attendance saved successfully!');
        loadHodStats();
      } else {
        showToast('error', data.message || 'Failed to save attendance.');
      }
    } catch (e) {
      showToast('error', 'Network error while saving attendance.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Attendance';
    }
  }

  // ============================================================
  // 2. ATTENDANCE RECORDS & HISTORY LOGIC
  // ============================================================
  function getFilterPayload() {
    const division = document.getElementById('hodDivisionFilter').value;
    const subject  = document.getElementById('hodSubjectFilter').value;
    const status   = document.getElementById('hodStatusFilter').value;

    return {
      division:   division === 'ALL' ? '' : division,
      subject:    subject  === 'ALL' ? '' : subject,
      start_date: document.getElementById('hodDateFrom').value,
      end_date:   document.getElementById('hodDateTo').value,
      status:     status   === 'ALL' ? '' : status,
      limit: 300,
      offset: 0,
      format: 'json'
    };
  }

  function loadAttendanceRecords() {
    const btn = document.getElementById('hodApplyFilterBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

    const payload = getFilterPayload();

    fetch('../api/get_attendance_history.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        currentRecords = data.data || [];
        renderTable(currentRecords);
        updateCounts(currentRecords);
        document.getElementById('hodTodayStat').textContent =
          currentRecords.length > 0 ? currentRecords.length + ' records' : '0 records';
      } else {
        const msg = data.message || 'Failed to load records.';
        showToast('error', msg);
        document.getElementById('hodAttendanceTableBody').innerHTML =
          '<tr><td colspan="10" style="text-align:center;padding:40px;color:#EF4444;">' +
          '<i class="fa-solid fa-circle-exclamation"></i> ' + escapeHtml(msg) + '</td></tr>';
      }
    })
    .catch(e => {
      showToast('error', e.message || 'Network error. Could not load records.');
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-filter"></i> Apply';
    });
  }

  function renderTable(records) {
    const tbody = document.getElementById('hodAttendanceTableBody');
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;">No records found for the selected filters.</td></tr>';
      return;
    }

    tbody.innerHTML = records.map((r) => `
      <tr>
        <td><strong>${escapeHtml(r.roll_no || '-')}</strong></td>
        <td>${escapeHtml(r.prn || '-')}</td>
        <td>${escapeHtml(r.full_name || '-')}</td>
        <td>${escapeHtml(r.division || '-')}</td>
        <td>${escapeHtml(r.subject || '-')}</td>
        <td>${r.date || '-'}</td>
        <td>${r.lecture_number || '-'}</td>
        <td><span class="badge-status ${getStatusBadgeClass(r.status)}">${escapeHtml(r.status || '-')}</span></td>
        <td>${escapeHtml(r.remarks || '-')}</td>
        <td>
          <button class="table-action-btn secondary-solid"
            onclick="window.HodAttendanceManager.openEditModal(${r.id}, '${escapeHtml(r.status || '')}', '${escapeHtml(r.remarks || '')}')"
            style="padding:4px 10px;font-size:0.78rem;">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
        </td>
      </tr>
    `).join('');
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'Present':       return 'bg-success-light';
      case 'Absent':        return 'bg-danger-light';
      case 'Medical Leave': return 'bg-warning-light';
      case 'Duty Leave':    return 'bg-info-light';
      default:              return 'bg-secondary-light';
    }
  }

  function updateCounts(records) {
    let present = 0, absent = 0, medical = 0, duty = 0;
    records.forEach(r => {
      switch (r.status) {
        case 'Present':       present++; break;
        case 'Absent':        absent++;  break;
        case 'Medical Leave': medical++; break;
        case 'Duty Leave':    duty++;    break;
      }
    });
    document.getElementById('hodPresentCount').textContent = present;
    document.getElementById('hodAbsentCount').textContent  = absent;
    document.getElementById('hodMedicalCount').textContent = medical;
    document.getElementById('hodDutyCount').textContent    = duty;
  }

  function filterVisibleTables(query) {
    const rows = document.querySelectorAll('.dashboard-table tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }

  function resetFilters() {
    document.getElementById('hodDivisionFilter').value = 'ALL';
    document.getElementById('hodSubjectFilter').value  = 'ALL';
    document.getElementById('hodDateFrom').value       = '';
    document.getElementById('hodDateTo').value         = '';
    document.getElementById('hodStatusFilter').value   = 'ALL';
    currentRecords = [];
    document.getElementById('hodAttendanceTableBody').innerHTML =
      '<tr><td colspan="10" style="text-align:center;padding:40px;">Click Apply to load attendance records.</td></tr>';
    updateCounts([]);
    document.getElementById('hodTodayStat').textContent = '0 records';
  }

  async function exportExcel() {
    const payload = { ...getFilterPayload(), format: 'excel' };
    submitExportForm(payload);
    showToast('success', 'Export initiated. Check your downloads.');
  }

  async function exportPdf() {
    const payload = { ...getFilterPayload(), format: 'pdf' };
    submitExportForm(payload);
    showToast('success', 'PDF export initiated.');
  }

  function submitExportForm(payload) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '../api/export.php';
    form.target = '_blank';
    const input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = 'payload';
    input.value = JSON.stringify(payload);
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => { if (form.parentNode) document.body.removeChild(form); }, 5000);
  }

  function openEditModal(attendanceId, currentStatus, currentRemarks) {
    editingId = attendanceId;
    document.getElementById('editCurrentStatus').textContent   = currentStatus;
    document.getElementById('editNewStatus').value             = currentStatus;
    document.getElementById('editNewRemarks').value            = currentRemarks || '';
    document.getElementById('editReason').value                = '';
    document.getElementById('editModalOverlay').classList.add('active');
  }

  function closeEditModal() {
    document.getElementById('editModalOverlay').classList.remove('active');
    editingId = null;
  }

  async function saveEdit() {
    if (!editingId) return;
    const newStatus  = document.getElementById('editNewStatus').value;
    const newRemarks = document.getElementById('editNewRemarks').value;
    const reason     = document.getElementById('editReason').value;

    if (!reason.trim()) {
      showToast('error', 'Reason is required for HOD edits.');
      return;
    }

    const saveBtn = document.getElementById('editSaveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
      const res = await fetch('../api/edit_attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          attendance_id: editingId,
          status:        newStatus,
          remarks:       newRemarks,
          reason:        reason
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Attendance updated successfully.');
        closeEditModal();
        loadAttendanceRecords();
      } else {
        showToast('error', data.message || 'Failed to update attendance.');
      }
    } catch (e) {
      showToast('error', 'Network error. Could not save changes.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Changes';
    }
  }

  function showToast(type, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-xmark' : 'fa-info-circle'}"></i></div>
      <div class="toast-body">
        <p class="toast-title">${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</p>
        <p class="toast-message">${escapeHtml(message)}</p>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  window.HodAttendanceManager = { openEditModal };
})();
