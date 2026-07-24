const sentNotices = new Set();

window.notifyStudent = function(btnElement, key, name) {
  sentNotices.add(key);

  const row = btnElement.closest('tr');
  if (row) {
    // Notice Sent TD is cell index 7
    const noticeSentTd = row.cells[7];
    if (noticeSentTd) {
      noticeSentTd.innerHTML = `<span style="color: #168a4d; font-weight: 700;"><i class="fa-solid fa-check"></i> Sent</span>`;
    }

    // Action TD is cell index 8
    const actionTd = row.cells[8];
    if (actionTd) {
      actionTd.innerHTML = `
        <button class="table-action-btn" disabled style="padding: 4px 12px; font-size: 0.78rem; background: rgba(37, 194, 110, 0.16); color: #168a4d; border: 1px solid rgba(37, 194, 110, 0.4); border-radius: 8px; font-weight: 700; cursor: default;">
          <i class="fa-solid fa-check"></i> Sent
        </button>
      `;
    }
  }

  fetch('../api/send_defaulter_warnings.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prn: key, student_name: name })
  }).catch(err => console.log('Notice sent log:', err));
};

document.addEventListener('DOMContentLoaded', async () => {
  const body = document.getElementById('defaulterTableBody');
  const search = document.getElementById('defaulterSearchInput');
  const divSelect = document.getElementById('defaulterDivSelect');
  const thresholdInput = document.getElementById('defaulterThresholdInput');

  let rows = [];

  const renderRows = () => {
    if (!body) return;
    const query = (search?.value || '').trim().toLowerCase();
    const selectedDiv = divSelect?.value || 'All';
    const thresholdVal = parseInt(thresholdInput?.value || '75');

    // Defaulters are students with attendance < thresholdVal
    const filtered = rows.filter((row) => {
      const pct = parseFloat(row.attendance_pct);
      const isDefaulter = pct < thresholdVal;
      
      const name = (row.name || '').toLowerCase();
      const roll = (row.roll || '').toLowerCase();
      const prn = (row.prn || '').toLowerCase();
      
      const matchesSearch = name.includes(query) || roll.includes(query) || prn.includes(query);
      const matchesDiv = selectedDiv === 'All' || row.division === selectedDiv;

      return isDefaulter && matchesSearch && matchesDiv;
    });

    if (filtered.length === 0) {
      body.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No defaulters found matching criteria.</td></tr>`;
      return;
    }

    body.innerHTML = filtered.map((row) => {
      const pct = parseFloat(row.attendance_pct);
      const sessions = parseInt(row.sessions);
      let status = 'Warning';
      let statusClass = 'bg-warning-light text-warning';
      let reason = sessions === 0 ? 'No attendance recorded' : 'Frequent Absences';
      
      if (pct < (thresholdVal - 15)) {
        status = 'Critical Defaulter';
        statusClass = 'bg-danger-light text-danger';
        reason = sessions === 0 ? 'No attendance recorded' : 'Critical attendance shortage';
      }

      const key = row.prn || row.roll;
      const isSent = sentNotices.has(key);

      const noticeSentHtml = isSent 
        ? `<span style="color: #168a4d; font-weight: 700;"><i class="fa-solid fa-check"></i> Sent</span>` 
        : `Pending`;

      const actionBtnHtml = isSent 
        ? `<button class="table-action-btn" disabled style="padding: 4px 12px; font-size: 0.78rem; background: rgba(37, 194, 110, 0.16); color: #168a4d; border: 1px solid rgba(37, 194, 110, 0.4); border-radius: 8px; font-weight: 700; cursor: default;"><i class="fa-solid fa-check"></i> Sent</button>`
        : `<button class="table-action-btn danger-outline" style="padding: 4px 10px; font-size: 0.78rem;" onclick="notifyStudent(this, '${key}', '${(row.name || '').replace(/'/g, "\\'")}')"><i class="fa-solid fa-paper-plane"></i> Notice</button>`;

      return `
        <tr class="attendance-row">
          <td><strong>${row.roll}</strong></td>
          <td>${row.prn}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${row.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" alt="" />
              <strong>${row.name}</strong>
            </div>
          </td>
          <td>${row.division}</td>
          <td><strong style="color: #EF4444">${pct.toFixed(1)}%</strong> (${row.attended}/${row.sessions})</td>
          <td>${reason}</td>
          <td><span class="badge ${statusClass}" style="padding: 6px 10px; border-radius: 12px; font-size: 0.82rem; font-weight: 600;">${status}</span></td>
          <td>${noticeSentHtml}</td>
          <td>${actionBtnHtml}</td>
        </tr>
      `;
    }).join('');
  };

  try {
    if (body) {
      body.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading defaulters...</td></tr>`;
    }
    const res = await fetch('../api/get_hod_attendance.php');
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        rows = result.data;
        renderRows();
      } else {
        if (body) body.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: red;">Failed to load data.</td></tr>`;
      }
    }
  } catch (err) {
    console.error("Error loading defaulters:", err);
    if (body) body.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: red;">Network Error.</td></tr>`;
  }

  search?.addEventListener('input', renderRows);
  divSelect?.addEventListener('change', renderRows);
  thresholdInput?.addEventListener('input', renderRows);
});
