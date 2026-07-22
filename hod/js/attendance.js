document.addEventListener('DOMContentLoaded', async () => {
  const body = document.getElementById('attendanceTableBody');
  const search = document.getElementById('studentSearch');
  const dateFilter = document.getElementById('hodAttendanceDateFilter');

  let rows = [];

  const renderRows = () => {
    if (!body) return;
    const query = (search?.value || '').trim().toLowerCase();
    const selectedDate = dateFilter?.value || '';
    const filtered = rows.filter((row) => {
      const matchesQuery = row.name.toLowerCase().includes(query) || row.roll.toLowerCase().includes(query) || row.prn.toLowerCase().includes(query);
      const matchesDate = !selectedDate || (row.latest_date || '').includes(selectedDate);
      return matchesQuery && matchesDate;
    });

    body.innerHTML = filtered.map((row) => {
      const pct = parseInt(row.attendance_pct);
      let status = 'Above 75%';
      let statusClass = 'good';
      if (pct < 60) {
        status = 'Below 60%';
        statusClass = 'danger';
      } else if (pct < 75) {
        status = '60–74%';
        statusClass = 'warning';
      }

      return `
        <tr>
          <td>${row.roll}</td>
          <td>${row.prn}</td>
          <td>${row.name}</td>
          <td>${row.division}</td>
          <td><strong>${pct}%</strong></td>
          <td>${row.sessions}</td>
          <td>${row.attended}</td>
          <td><span class="badge-status ${statusClass}">${status}</span></td>
          <td>${row.latest_date ? row.latest_date : 'No update yet'}</td>
          <td>
            <div class="button-row">
              <button class="btn btn-secondary" onclick="alert('Viewing attendance logs for ${row.name}')">View</button>
              <button class="btn btn-primary" onclick="alert('Exporting report for ${row.name}')">Export</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  try {
    const res = await fetch('../api/get_hod_attendance.php');
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        rows = result.data;
        renderRows();
      }
    }
  } catch (err) {
    console.error("Error loading HOD attendance logs:", err);
  }

  search?.addEventListener('input', renderRows);
  dateFilter?.addEventListener('change', renderRows);
});
