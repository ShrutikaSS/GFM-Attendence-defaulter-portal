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
    await loadSession();
    setupEventListeners();
    loadHodStats();
    loadAttendanceRecords();
  }

  async function loadSession() {
    try {
      const res = await fetch('../api/session.php');
      const data = await res.json();
      if (data.authenticated) {
        currentUser = data.user;
        csrfToken = data.csrf_token;
        document.getElementById('csrfToken').value = csrfToken;
      }
    } catch (e) {
      showToast('error', 'Session expired. Please login again.');
      setTimeout(() => window.location.href = '../index.html', 1500);
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

    // Keyboard shortcuts
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
          document.getElementById('hodAvgStat').textContent = (data.data.overallAttendance || '0') + '%';
          document.getElementById('hodDefaulterStat').textContent = (data.data.defaulters || '0');
        }
      })
      .catch(() => {});
  }

  function loadAttendanceRecords() {
    const btn = document.getElementById('hodApplyFilterBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

    const payload = {
      division: document.getElementById('hodDivisionFilter').value,
      subject: document.getElementById('hodSubjectFilter').value,
      start_date: document.getElementById('hodDateFrom').value,
      end_date: document.getElementById('hodDateTo').value,
      status: document.getElementById('hodStatusFilter').value,
      limit: 500
    };

    fetch('../api/export.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        // For table display, use a different approach - load from attendance history endpoint
        return fetch('../api/get_attendance_history.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ ...payload, limit: 200, format: 'json' })
        });
      }
      throw new Error(data.message);
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        currentRecords = data.data || [];
        renderTable(currentRecords);
        updateCounts(currentRecords);
        document.getElementById('hodTodayStat').textContent = currentRecords.length > 0 ? currentRecords.length + ' records' : '0 records';
      }
    })
    .catch(e => showToast('error', e.message || 'Failed to load records.'))
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-filter"></i> Apply';
    });
  }

  function renderTable(records) {
    const tbody = document.getElementById('hodAttendanceTableBody');
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">No records found.</td></tr>';
      return;
    }

    tbody.innerHTML = records.map((r, i) => `
      <tr>
        <td><strong>${escapeHtml(r.roll_no)}</strong></td>
        <td>${escapeHtml(r.prn)}</td>
        <td>${escapeHtml(r.full_name)}</td>
        <td>${escapeHtml(r.division)}</td>
        <td>${escapeHtml(r.subject)}</td>
        <td>${r.date}</td>
        <td>${r.lecture_number}</td>
        <td><span class="badge-status ${getStatusBadgeClass(r.status)}">${r.status}</span></td>
        <td>${escapeHtml(r.remarks || '-')}</td>
        <td>
          <button class="table-action-btn secondary-solid" onclick="window.HodAttendanceManager.openEditModal(${r.id}, '${escapeHtml(r.status)}', '${escapeHtml(r.remarks || '')}')" style="padding: 4px 10px; font-size: 0.78rem;">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
        </td>
      </tr>
    `).join('');
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'Present': return 'bg-success-light';
      case 'Absent': return 'bg-danger-light';
      case 'Medical Leave': return 'bg-warning-light';
      case 'Duty Leave': return 'bg-info-light';
      default: return 'bg-secondary-light';
    }
  }

  function updateCounts(records) {
    let present = 0, absent = 0, medical = 0, duty = 0;
    records.forEach(r => {
      switch (r.status) {
        case 'Present': present++; break;
        case 'Absent': absent++; break;
        case 'Medical Leave': medical++; break;
        case 'Duty Leave': duty++; break;
      }
    });
    document.getElementById('hodPresentCount').textContent = present;
    document.getElementById('hodAbsentCount').textContent = absent;
    document.getElementById('hodMedicalCount').textContent = medical;
    document.getElementById('hodDutyCount').textContent = duty;
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
    document.getElementById('hodSubjectFilter').value = 'ALL';
    document.getElementById('hodDateFrom').value = '';
    document.getElementById('hodDateTo').value = '';
    document.getElementById('hodStatusFilter').value = 'ALL';
    loadAttendanceRecords();
  }

  async function exportExcel() {
    const payload = {
      division: document.getElementById('hodDivisionFilter').value,
      subject: document.getElementById('hodSubjectFilter').value,
      start_date: document.getElementById('hodDateFrom').value,
      end_date: document.getElementById('hodDateTo').value,
      status: document.getElementById('hodStatusFilter').value,
      format: 'excel'
    };
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '../api/export.php';
    form.target = '_blank';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'payload';
    input.value = JSON.stringify(payload);
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
        if (form.parentNode) document.body.removeChild(form);
    }, 5000);
    showToast('success', 'Export initiated. Check your downloads.');
  }

  async function exportPdf() {
    const payload = {
      division: document.getElementById('hodDivisionFilter').value,
      subject: document.getElementById('hodSubjectFilter').value,
      start_date: document.getElementById('hodDateFrom').value,
      end_date: document.getElementById('hodDateTo').value,
      status: document.getElementById('hodStatusFilter').value,
      format: 'pdf'
    };
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '../api/export.php';
    form.target = '_blank';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'payload';
    input.value = JSON.stringify(payload);
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    showToast('success', 'PDF export initiated.');
  }

  function openEditModal(attendanceId, currentStatus, currentRemarks) {
    editingId = attendanceId;
    document.getElementById('editCurrentStatus').textContent = currentStatus;
    document.getElementById('editNewStatus').value = currentStatus;
    document.getElementById('editNewRemarks').value = currentRemarks || '';
    document.getElementById('editReason').value = '';
    document.getElementById('editModalOverlay').classList.add('active');
  }

  function closeEditModal() {
    document.getElementById('editModalOverlay').classList.remove('active');
    editingId = null;
  }

  async function saveEdit() {
    if (!editingId) return;
    const newStatus = document.getElementById('editNewStatus').value;
    const newRemarks = document.getElementById('editNewRemarks').value;
    const reason = document.getElementById('editReason').value;

    if (!reason.trim()) {
      showToast('error', 'Reason is required for HOD edits.');
      return;
    }

    try {
      const res = await fetch('../api/edit_attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          attendance_id: editingId,
          status: newStatus,
          remarks: newRemarks,
          reason: reason
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        closeEditModal();
        loadAttendanceRecords();
      } else {
        showToast('error', data.message);
      }
    } catch (e) {
      showToast('error', 'Network error.');
    }
  }

  function showToast(type, message) {
    const container = document.getElementById('toastContainer');
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
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  window.HodAttendanceManager = { openEditModal };
})();
