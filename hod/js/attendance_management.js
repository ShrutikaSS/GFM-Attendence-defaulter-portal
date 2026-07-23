// ============================================================
// HOD ATTENDANCE MANAGEMENT
// ============================================================
(function() {
  'use strict';

  let currentRecords = [];
  let csrfToken = '';
  let currentUser = null;
  let editingId = null;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const authed = await loadSession();
    if (!authed) return; // Redirected to login — stop execution
    setupEventListeners();
    loadHodStats();
    // Do NOT auto-load all records on page load — wait for user to apply filters
    document.getElementById('hodTodayStat').textContent = '0 records';
  }

  // Returns true if authenticated, false if not (and redirects)
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
        // Not authenticated or wrong role — redirect to login
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

  function setupEventListeners() {
    document.getElementById('hodApplyFilterBtn').addEventListener('click', loadAttendanceRecords);
    document.getElementById('hodResetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('hodExportExcelBtn').addEventListener('click', exportExcel);
    document.getElementById('hodExportPdfBtn').addEventListener('click', exportPdf);

    document.getElementById('editCancelBtn').addEventListener('click', closeEditModal);
    document.getElementById('editSaveBtn').addEventListener('click', saveEdit);
    document.getElementById('editModalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeEditModal();
    });

    // Global search — live filter on visible table rows
    document.getElementById('globalSearch')?.addEventListener('input', (e) => {
      filterTable(e.target.value.toLowerCase());
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeEditModal();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const search = document.getElementById('globalSearch');
        if (search) search.focus();
      }
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

  function getFilterPayload() {
    // Convert 'ALL' sentinel values to empty strings so the API skips those filters
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

    // Single direct call to attendance history — no more 2-step export.php chain
    fetch('../api/get_attendance_history.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
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
        // Show the actual server error message
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
      case 'Present':      return 'bg-success-light';
      case 'Absent':       return 'bg-danger-light';
      case 'Medical Leave': return 'bg-warning-light';
      case 'Duty Leave':   return 'bg-info-light';
      default:             return 'bg-secondary-light';
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

  function filterTable(query) {
    const rows = document.querySelectorAll('#hodAttendanceTableBody tr');
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
    // Reset table to empty state
    currentRecords = [];
    document.getElementById('hodAttendanceTableBody').innerHTML =
      '<tr><td colspan="10" style="text-align:center;padding:40px;">Click Apply to load attendance records.</td></tr>';
    updateCounts([]);
    document.getElementById('hodTodayStat').textContent = '0 records';
  }

  async function exportExcel() {
    const payload = {
      ...getFilterPayload(),
      format: 'excel'
    };
    submitExportForm(payload);
    showToast('success', 'Export initiated. Check your downloads.');
  }

  async function exportPdf() {
    const payload = {
      ...getFilterPayload(),
      format: 'pdf'
    };
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
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
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

  // Expose only what external HTML (onclick handlers) needs
  window.HodAttendanceManager = { openEditModal };
})();
