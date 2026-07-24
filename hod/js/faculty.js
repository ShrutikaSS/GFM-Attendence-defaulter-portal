let currentFacultyList = [];

async function loadFacultyData() {
  const cardsContainer = document.getElementById('facultyCards');
  const tableBody = document.getElementById('facultyTableBody');

  try {
    const res = await fetch('../api/get_hod_faculty.php');
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        currentFacultyList = result.data;
        renderFaculty(currentFacultyList);
      }
    }
  } catch (err) {
    console.error("Error loading faculty registry:", err);
  }
}

function renderFaculty(facultyList) {
  const cardsContainer = document.getElementById('facultyCards');
  const tableBody = document.getElementById('facultyTableBody');

  // Render Cards (Summary panel)
  if (cardsContainer) {
    cardsContainer.innerHTML = facultyList.map((faculty) => `
      <article class="panel-card reveal visible">
        <div class="panel-head">
          <h3>${escapeHtml(faculty.name)}</h3>
          <span class="badge-status ${faculty.status === 'Active' ? 'good' : 'warning'}">${escapeHtml(faculty.status)}</span>
        </div>
        <p><strong>Department:</strong> ${escapeHtml(faculty.department)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(faculty.subject)}</p>
        <div class="button-row" style="margin-top: 12px;">
          <button class="btn btn-secondary" onclick="alert('Viewing profile for ${escapeHtml(faculty.name)}')">View</button>
          <button class="btn btn-primary" onclick="openEditModal(${faculty.id})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn btn-secondary" onclick="alert('Assigning subjects for ${escapeHtml(faculty.name)}')">Assign</button>
        </div>
      </article>
    `).join('');
  }

  // Render Table list
  if (tableBody) {
    tableBody.innerHTML = facultyList.map((row) => `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.department)}</td>
        <td>SE</td>
        <td>${escapeHtml(row.division)}</td>
        <td>${escapeHtml(row.subject)}</td>
        <td>${escapeHtml(row.email || 'N/A')}</td>
        <td>${escapeHtml(row.phone || 'N/A')}</td>
        <td><span class="badge-status ${row.status === 'Active' ? 'good' : 'warning'}">${escapeHtml(row.status)}</span></td>
        <td>
          <div class="button-row">
            <button class="btn btn-secondary" onclick="alert('Viewing logs for ${escapeHtml(row.name)}')">View</button>
            <button class="btn btn-primary" onclick="openEditModal(${row.id})"><i class="fa-solid fa-pen"></i> Edit</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.openEditModal = function(id) {
  const faculty = currentFacultyList.find(f => f.id == id);
  if (!faculty) return;

  document.getElementById('editFacultyId').value = faculty.id;
  document.getElementById('editFacultyName').value = faculty.name || '';
  
  const deptSelect = document.getElementById('editFacultyDepartment');
  if (deptSelect) {
    let exists = Array.from(deptSelect.options).some(opt => opt.value === faculty.department);
    if (!exists && faculty.department) {
      const opt = document.createElement('option');
      opt.value = faculty.department;
      opt.textContent = faculty.department;
      deptSelect.appendChild(opt);
    }
    deptSelect.value = faculty.department || '';
  }

  document.getElementById('editFacultySubject').value = faculty.subject || '';
  document.getElementById('editFacultyDivision').value = faculty.division || 'Div A';
  document.getElementById('editFacultyStatus').value = faculty.status || 'Active';
  document.getElementById('editFacultyEmail').value = faculty.email || '';
  document.getElementById('editFacultyPhone').value = faculty.phone || '';

  const modal = document.getElementById('editFacultyModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
};

window.closeEditModal = function() {
  const modal = document.getElementById('editFacultyModal');
  if (modal) {
    modal.classList.add('hidden');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadFacultyData();

  const closeBtn = document.getElementById('closeEditModalBtn');
  const cancelBtn = document.getElementById('cancelEditModalBtn');
  const modalOverlay = document.getElementById('editFacultyModal');
  const editForm = document.getElementById('editFacultyForm');

  if (closeBtn) closeBtn.addEventListener('click', closeEditModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeEditModal();
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        id: document.getElementById('editFacultyId').value,
        name: document.getElementById('editFacultyName').value,
        department: document.getElementById('editFacultyDepartment').value,
        subject: document.getElementById('editFacultySubject').value,
        division: document.getElementById('editFacultyDivision').value,
        status: document.getElementById('editFacultyStatus').value,
        email: document.getElementById('editFacultyEmail').value,
        phone: document.getElementById('editFacultyPhone').value
      };

      try {
        const res = await fetch('../api/update_faculty.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          alert('Faculty details updated successfully!');
          closeEditModal();
          await loadFacultyData();
        } else {
          alert('Error: ' + (data.message || 'Failed to update faculty.'));
        }
      } catch (err) {
        console.error('Update error:', err);
        alert('An error occurred while saving faculty details.');
      }
    });
  }

  // Faculty Search / Filtering
  const facultySearch = document.getElementById('facultySearchInput');
  if (facultySearch) {
    facultySearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      document.querySelectorAll('#facultyCards .panel-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });

      document.querySelectorAll('#facultyTableBody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
});
