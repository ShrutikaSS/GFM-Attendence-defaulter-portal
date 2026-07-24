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
    const entryDate = document.getElementById('entryDateInput');
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
        showToast('Session expired. Please login again.', 'danger');
        setTimeout(() => window.location.href = '../login.html', 1500);
        return false;
      }
    } catch (e) {
      showToast('Network error. Please check your connection.', 'danger');
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
    const entryClassSelect = document.getElementById('entryClassSelect');
    if (entryClassSelect) {
      entryClassSelect.addEventListener('change', loadClassStudentsForEntry);
    }
    
    document.getElementById('markAllPresentBtn')?.addEventListener('click', () => bulkMark('Present'));
    document.getElementById('markAllAbsentBtn')?.addEventListener('click', () => bulkMark('Absent'));
    document.getElementById('saveAttendanceBtn')?.addEventListener('click', submitAttendance);

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
  // 1. MARK NEW ATTENDANCE LOGIC (GFM STYLE)
  // ============================================================
  let liveClassStudents = [];
  let classAttendanceState = {};

  async function loadClassStudentsForEntry() {
    const entryClassSelect = document.getElementById('entryClassSelect');
    const classVal = entryClassSelect ? entryClassSelect.value : '';
    const tbody = document.getElementById('attendanceEntryTableBody');
    if (!tbody) return;

    if (!classVal) {
      liveClassStudents = [];
      classAttendanceState = {};
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

    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 30px; color: var(--text-secondary);">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
          Loading student list for ${classVal}...
        </td>
      </tr>`;

    const subject = document.getElementById('entrySubjectSelect')?.value || 'Web Development';
    const date = document.getElementById('entryDateInput')?.value || new Date().toISOString().split('T')[0];

    try {
      const res = await fetch('../api/attendance_entry.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
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
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 30px; color: #EF4444;">${data.message || 'Failed to load students.'}</td></tr>`;
      }
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 30px; color: #EF4444;">Network error while fetching students.</td></tr>`;
    }
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
        <td><strong>${escapeHtml(student.roll_no)}</strong></td>
        <td>${escapeHtml(student.prn)}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" alt="" />
            <strong>${escapeHtml(student.student_name)}</strong>
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
                 value="${escapeHtml(existingRemarks)}" 
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

    const presentElem = document.getElementById('entryPresentCount');
    const absentElem = document.getElementById('entryAbsentCount');
    const medicalElem = document.getElementById('entryMedicalCount');
    const dutyElem = document.getElementById('entryDutyCount');
    const totalElem = document.getElementById('entryTotalCount');

    if (presentElem) presentElem.textContent = present;
    if (absentElem) absentElem.textContent = absent;
    if (medicalElem) medicalElem.textContent = medical;
    if (dutyElem) dutyElem.textContent = duty;
    if (totalElem) totalElem.textContent = `${liveClassStudents.length} Students`;
  }

  function bulkMark(status) {
    if (liveClassStudents.length === 0) return;
    liveClassStudents.forEach(s => { classAttendanceState[s.student_id] = status; });
    renderAttendanceEntryRoster();
    if (status === 'Present') {
      showToast('Marked all students as Present.', 'success');
    } else {
      showToast('Marked all students as Absent.', 'warning');
    }
  }

  async function submitAttendance() {
    const entryClassSelect = document.getElementById('entryClassSelect');
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
    const timeSlot = document.getElementById('entryTimeSelect')?.value || '';
    
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

    const btn = document.getElementById('saveAttendanceBtn');
    if(btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    try {
      const response = await fetch('../api/save_attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ 
          class: classVal, 
          subject: subject, 
          date: date, 
          lecture_number: 1, // Simplified for now
          records: records, 
          update_existing: true,
          reason: 'HOD bulk marked'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        showToast(`Attendance for ${classVal} - ${subject} saved successfully!`, 'success');
        await loadClassStudentsForEntry();
      } else {
        showToast(data.message || 'Failed to save attendance.', 'danger');
      }
    } catch(err) {
      showToast('Error saving attendance records.', 'danger');
    } finally {
      if(btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Submit Attendance';
      }
    }
  }


  // ============================================================
  // 2. ATTENDANCE RECORDS LOGIC
  // ============================================================
  async function loadAttendanceRecords() {
    const tbody = document.getElementById('hodAttendanceTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
      const res = await fetch('../api/get_attendance_history.php');
      const data = await res.json();
      if (data.success) {
        currentRecords = data.data || [];
        renderRecordsTable(currentRecords);
        updateRecordsCounters(currentRecords);
      } else {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red;">${escapeHtml(data.message)}</td></tr>`;
      }
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: red;">Network Error</td></tr>';
    }
  }

  function renderRecordsTable(records) {
    const tbody = document.getElementById('hodAttendanceTableBody');
    if (!tbody) return;

    const divFilter = document.getElementById('hodDivisionFilter')?.value;
    const subFilter = document.getElementById('hodSubjectFilter')?.value;
    const statFilter = document.getElementById('hodStatusFilter')?.value;
    const fromDate = document.getElementById('hodDateFrom')?.value;
    const toDate = document.getElementById('hodDateTo')?.value;

    const filtered = records.filter(r => {
      let match = true;
      if (divFilter && divFilter !== 'ALL' && r.division !== divFilter) match = false;
      if (subFilter && subFilter !== 'ALL' && r.subject !== subFilter) match = false;
      if (statFilter && statFilter !== 'ALL' && r.status !== statFilter) match = false;
      if (fromDate && r.date < fromDate) match = false;
      if (toDate && r.date > toDate) match = false;
      return match;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">No attendance records found matching criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.roll_no)}</strong></td>
        <td>${escapeHtml(r.prn)}</td>
        <td>${escapeHtml(r.student_name)}</td>
        <td>${escapeHtml(r.division)}</td>
        <td>${escapeHtml(r.subject)}</td>
        <td>${escapeHtml(r.date)}</td>
        <td>${escapeHtml(r.lecture_number)}</td>
        <td><span class="badge ${getStatusBadgeClass(r.status)}">${escapeHtml(r.status)}</span></td>
        <td>${escapeHtml(r.remarks || '-')}</td>
        <td>
          <button class="icon-btn edit-btn primary-text" data-id="${r.id}" data-status="${escapeHtml(r.status)}" data-remarks="${escapeHtml(r.remarks || '')}" title="Edit Record">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id, btn.dataset.status, btn.dataset.remarks));
    });
    
    updateRecordsCounters(filtered);


  }

  function updateRecordsCounters(records) {
    let present = 0, absent = 0, medical = 0, duty = 0;
    records.forEach(r => {
      if (r.status === 'Present') present++;
      if (r.status === 'Absent') absent++;
      if (r.status === 'Medical Leave') medical++;
      if (r.status === 'Duty Leave') duty++;
    });

    const pElem = document.getElementById('hodPresentCount');
    const aElem = document.getElementById('hodAbsentCount');
    const mElem = document.getElementById('hodMedicalCount');
    const dElem = document.getElementById('hodDutyCount');

    if (pElem) pElem.textContent = present;
    if (aElem) aElem.textContent = absent;
    if (mElem) mElem.textContent = medical;
    if (dElem) dElem.textContent = duty;
  }

  function getStatusBadgeClass(status) {
    if (status === 'Present') return 'bg-success-light text-success';
    if (status === 'Absent') return 'bg-danger-light text-danger';
    if (status === 'Medical Leave') return 'bg-warning-light';
    if (status === 'Duty Leave') return 'bg-info-light';
    return '';
  }

  function resetFilters() {
    document.getElementById('hodDivisionFilter').value = 'ALL';
    document.getElementById('hodSubjectFilter').value = 'ALL';
    document.getElementById('hodStatusFilter').value = 'ALL';
    document.getElementById('hodDateFrom').value = '';
    document.getElementById('hodDateTo').value = '';
    renderRecordsTable(currentRecords);
  }

  // ============================================================
  // 3. EDIT RECORD LOGIC
  // ============================================================
  function openEditModal(id, currentStatus, currentRemarks) {
    editingId = id;
    document.getElementById('editCurrentStatus').textContent = currentStatus;
    document.getElementById('editCurrentStatus').className = `badge ${getStatusBadgeClass(currentStatus)}`;
    document.getElementById('editNewStatus').value = currentStatus;
    document.getElementById('editNewRemarks').value = currentRemarks;
    document.getElementById('editReason').value = '';
    document.getElementById('editModalOverlay').classList.add('active');
  }

  function closeEditModal() {
    editingId = null;
    document.getElementById('editModalOverlay').classList.remove('active');
  }

  async function saveEdit() {
    if (!editingId) return;

    const newStatus = document.getElementById('editNewStatus').value;
    const newRemarks = document.getElementById('editNewRemarks').value;
    const reason = document.getElementById('editReason').value.trim();

    if (!reason) {
      showToast('Please provide a reason for the change.', 'warning');
      return;
    }

    const btn = document.getElementById('editSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      const res = await fetch('../api/edit_attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          record_id: editingId,
          new_status: newStatus,
          remarks: newRemarks,
          reason: reason
        })
      });
      const data = await res.json();
      
      if (data.success) {
        showToast('Record updated successfully', 'success');
        closeEditModal();
        loadAttendanceRecords();
      } else {
        showToast(data.message || 'Failed to update', 'danger');
      }
    } catch (e) {
      showToast('Network error during update', 'danger');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  }

  // ============================================================
  // 4. UTILS
  // ============================================================
  function exportExcel() {
    showToast('Exporting to Excel...', 'info');
    // Implement standard CSV export logic here
  }

  function exportPdf() {
    showToast('Generating PDF...', 'info');
    // Implement jsPDF logic here
  }



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

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
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

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
