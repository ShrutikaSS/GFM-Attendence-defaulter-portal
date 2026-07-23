// ============================================================
// FAST ATTENDANCE ENTRY - GFM PORTAL
// ============================================================
(function() {
  'use strict';

  let currentStudents = [];
  let currentConfig = {};
  let csrfToken = '';
  let currentUser = null;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    loadSession();
    if (!currentUser) {
      window.location.href = '../login.html';
      return;
    }

    setupDateDefaults();
    setupEventListeners();
    loadSidebarUserInfo();
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
      console.error('Session load failed:', e);
    }
  }

  function setupDateDefaults() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('entryDate');
    if (dateInput) dateInput.value = today;

    const lectureInput = document.getElementById('entryLecture');
    if (lectureInput) lectureInput.value = 1;
  }

  function setupEventListeners() {
    const classSelect = document.getElementById('entryClass');
    if (classSelect) {
      classSelect.addEventListener('change', () => {
        if (classSelect.value) {
          loadStudentList();
        } else {
          resetForm();
        }
      });
    }

    document.getElementById('loadStudentsBtn').addEventListener('click', loadStudentList);
    document.getElementById('resetFormBtn').addEventListener('click', resetForm);
    document.getElementById('markAllPresentBtn').addEventListener('click', () => bulkMark('Present'));
    document.getElementById('markAllAbsentBtn').addEventListener('click', () => bulkMark('Absent'));
    document.getElementById('resetAttendanceBtn').addEventListener('click', resetAttendance);
    document.getElementById('saveAttendanceBtn').addEventListener('click', saveAttendance);
    document.getElementById('attendanceSearchInput').addEventListener('input', filterAttendanceTable);
    document.getElementById('duplicateCancelBtn').addEventListener('click', closeDuplicateModal);
    document.getElementById('duplicateOverwriteBtn').addEventListener('click', () => saveAttendance(true));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveAttendance();
      }
      if (e.key === 'p' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        bulkMark('Present');
      }
    });
  }

  function loadSidebarUserInfo() {
    if (!currentUser) return;
    const name = currentUser.full_name || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('sidebarUserName').textContent = name;
    document.getElementById('sidebarUserRole').textContent = currentUser.department + ' (GFM)';
    document.getElementById('navAvatarInitials').textContent = initials;
    document.getElementById('topNavName').textContent = name;
    document.getElementById('userAvatarChip').textContent = initials;
  }

  async function loadStudentList() {
    const btn = document.getElementById('loadStudentsBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

    const classValue = document.getElementById('entryClass').value;
    if (!classValue) {
      showToast('error', 'Please select a class (FY A, FY B, or FY C).');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-users"></i> Load Student List';
      return;
    }

    const [year, division] = classValue.split(' ');
    const subject = document.getElementById('entrySubject').value;
    const date = document.getElementById('entryDate').value;
    const lecture_number = parseInt(document.getElementById('entryLecture').value) || 1;

    const payload = {
      year: year,
      division: division,
      subject: subject,
      date: date,
      lecture_number: lecture_number
    };

    currentConfig = payload;

    try {
      const res = await fetch('../api/attendance_entry.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        currentStudents = data.data.students || [];
        renderAttendanceTable(currentStudents);
        document.getElementById('tableSubjectTitle').textContent = 
          `${payload.subject} | ${year} ${division} | ${payload.date} | Lecture ${payload.lecture_number}`;
        
        // Show attendance table section
        document.getElementById('entry-form-section').classList.remove('active');
        document.getElementById('entry-form-section').classList.add('hidden-view');
        document.getElementById('attendance-table-section').classList.remove('hidden-view');
        document.getElementById('attendance-table-section').classList.add('active');

        showToast('success', `${currentStudents.length} students loaded successfully for ${year} ${division}.`);
      } else {
        showToast('error', data.message || 'Failed to load students.');
      }
    } catch (e) {
      showToast('error', 'Network error. Please try again.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-users"></i> Load Student List';
    }
  }

  function renderAttendanceTable(students) {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-secondary);">No students found for this class in MySQL database.</td></tr>';
      return;
    }

    students.forEach((student, index) => {
      const existingStatus = student.existing_status || '';
      const existingRemarks = student.existing_remarks || 'Regular';
      const attendancePct = parseFloat(student.attendance_percentage) || 0;
      const pctClass = attendancePct >= 75 ? 'text-success' : attendancePct >= 60 ? 'text-warning' : 'text-danger';

      const tr = document.createElement('tr');
      tr.setAttribute('data-student-id', student.student_id);
      tr.setAttribute('data-prn', student.prn);
      tr.setAttribute('data-name', student.student_name.toLowerCase());
      tr.className = 'attendance-row';

      tr.innerHTML = `
        <td><strong>${escapeHtml(student.roll_no)}</strong></td>
        <td>${escapeHtml(student.prn)}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}" 
                 style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;" 
                 alt="" loading="lazy" />
            <strong style="font-size: 0.92rem;">${escapeHtml(student.student_name)}</strong>
          </div>
        </td>
        <td class="cell-center">
          <strong class="${pctClass}">${attendancePct.toFixed(2)}%</strong>
        </td>
        <td class="cell-center">
          <label class="radio-option radio-present" style="justify-content: center; cursor: pointer;">
            <input type="radio" name="status_${student.student_id}" value="Present" ${existingStatus === 'Present' || !existingStatus ? 'checked' : ''} />
            <span class="radio-visual"></span>
            <span>Present</span>
          </label>
        </td>
        <td class="cell-center">
          <label class="radio-option radio-absent" style="justify-content: center; cursor: pointer;">
            <input type="radio" name="status_${student.student_id}" value="Absent" ${existingStatus === 'Absent' ? 'checked' : ''} />
            <span class="radio-visual"></span>
            <span>Absent</span>
          </label>
        </td>
        <td class="cell-center">
          <label class="radio-option radio-medical" style="justify-content: center; cursor: pointer;">
            <input type="radio" name="status_${student.student_id}" value="Medical Leave" ${existingStatus === 'Medical Leave' ? 'checked' : ''} />
            <span class="radio-visual"></span>
            <span>Medical</span>
          </label>
        </td>
        <td class="cell-center">
          <label class="radio-option radio-duty" style="justify-content: center; cursor: pointer;">
            <input type="radio" name="status_${student.student_id}" value="Duty Leave" ${existingStatus === 'Duty Leave' ? 'checked' : ''} />
            <span class="radio-visual"></span>
            <span>Duty</span>
          </label>
        </td>
        <td>
          <input type="text" class="attendance-remark-input" 
                 data-student-id="${student.student_id}"
                 value="${escapeHtml(existingRemarks)}" 
                 placeholder="Add remark (optional)" style="width: 100%;" />
        </td>
      `;

      tbody.appendChild(tr);
    });

    updateCounts();
    
    // Add change listeners to radio buttons
    tbody.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', updateCounts);
    });
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

  function bulkMark(status) {
    const radios = document.querySelectorAll(`input[name^="status_"][value="${status}"]`);
    radios.forEach(radio => { radio.checked = true; });
    updateCounts();
    showToast('info', `Marked all students as ${status}.`);
  }

  function resetAttendance() {
    const radios = document.querySelectorAll('#attendanceTableBody input[type="radio"]');
    radios.forEach(radio => { radio.checked = false; });
    const remarks = document.querySelectorAll('.attendance-remark-input');
    remarks.forEach(r => { r.value = ''; });
    updateCounts();
    showToast('info', 'Attendance reset.');
  }

  function resetForm() {
    currentStudents = [];
    currentConfig = {};
    document.getElementById('entry-form-section').classList.remove('hidden-view');
    document.getElementById('entry-form-section').classList.add('active');
    document.getElementById('attendance-table-section').classList.remove('active');
    document.getElementById('attendance-table-section').classList.add('hidden-view');
    document.getElementById('attendanceTableBody').innerHTML = `
      <tr id="emptyStateRow">
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>
          Select FY A, FY B or FY C to load students.
        </td>
      </tr>`;
    resetAttendance();
  }

  function filterAttendanceTable() {
    const search = document.getElementById('attendanceSearchInput').value.toLowerCase().trim();
    const rows = document.querySelectorAll('.attendance-row');
    rows.forEach(row => {
      const name = row.getAttribute('data-name') || '';
      const roll = row.querySelector('td:nth-child(2) strong')?.textContent.toLowerCase() || '';
      const prn = row.getAttribute('data-prn')?.toLowerCase() || '';
      const match = !search || name.includes(search) || roll.includes(search) || prn.includes(search);
      row.style.display = match ? '' : 'none';
    });
  }

  function updateCounts() {
    const rows = document.querySelectorAll('.attendance-row');
    let present = 0, absent = 0, medical = 0, duty = 0;
    rows.forEach(row => {
      const radio = row.querySelector('input[type="radio"]:checked');
      if (radio) {
        switch (radio.value) {
          case 'Present': present++; break;
          case 'Absent': absent++; break;
          case 'Medical Leave': medical++; break;
          case 'Duty Leave': duty++; break;
        }
      }
    });
    document.getElementById('presentCountText').textContent = present;
    document.getElementById('absentCountText').textContent = absent;
    document.getElementById('medicalCountText').textContent = medical;
    document.getElementById('dutyCountText').textContent = duty;
    document.getElementById('totalCountText').textContent = rows.length;
  }

  async function saveAttendance(updateExisting = false) {
    const btn = document.getElementById('saveAttendanceBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const records = [];
    const rows = document.querySelectorAll('.attendance-row');
    rows.forEach(row => {
      const studentId = parseInt(row.getAttribute('data-student-id'));
      const radio = row.querySelector('input[type="radio"]:checked');
      const status = radio ? radio.value : 'Present';
      const remarkInput = row.querySelector('.attendance-remark-input');
      const remarks = remarkInput ? remarkInput.value : 'Regular';
      records.push({ student_id: studentId, status: status, remarks: remarks });
    });

    const payload = {
      ...currentConfig,
      records: records,
      update_existing: updateExisting,
      reason: 'Attendance marked by GFM'
    };

    try {
      const res = await fetch('../api/save_attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message);
        // Refresh table to show updated values
        await loadStudentList();
      } else if (data.duplicates_skipped && data.duplicates_skipped.length > 0 && !updateExisting) {
        showDuplicateModal(data.duplicates_skipped);
      } else {
        showToast('error', data.message || 'Failed to save attendance.');
      }
    } catch (e) {
      showToast('error', 'Network error during save.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Attendance';
    }
  }

  function showDuplicateModal(duplicates) {
    const modal = document.getElementById('duplicateModal');
    const list = document.getElementById('duplicateList');
    list.innerHTML = '';
    duplicates.slice(0, 10).forEach(d => {
      const li = document.createElement('li');
      li.textContent = `Student ID ${d.student_id}: ${d.old_status} -> ${d.new_status}`;
      list.appendChild(li);
    });
    if (duplicates.length > 10) {
      const li = document.createElement('li');
      li.textContent = `...and ${duplicates.length - 10} more.`;
      list.appendChild(li);
    }
    modal.style.display = 'flex';
  }

  function closeDuplicateModal() {
    document.getElementById('duplicateModal').style.display = 'none';
  }

  function showToast(type, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-xmark' : 'fa-info-circle'}"></i>
      </div>
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
})();
