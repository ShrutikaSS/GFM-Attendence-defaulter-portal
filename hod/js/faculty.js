document.addEventListener('DOMContentLoaded', async () => {
  const cardsContainer = document.getElementById('facultyCards');
  const tableBody = document.getElementById('facultyTableBody');

  try {
    const res = await fetch('../api/get_hod_faculty.php');
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        const facultyList = result.data;

        // Render Cards (Summary panel)
        if (cardsContainer) {
          cardsContainer.innerHTML = facultyList.map((faculty) => `
            <article class="panel-card reveal visible">
              <div class="panel-head">
                <h3>${faculty.name}</h3>
                <span class="badge-status ${faculty.status === 'Active' ? 'good' : 'warning'}">${faculty.status}</span>
              </div>
              <p><strong>Department:</strong> ${faculty.department}</p>
              <p><strong>Subject:</strong> ${faculty.subject}</p>
              <div class="button-row" style="margin-top: 12px;">
                <button class="btn btn-secondary" onclick="alert('Viewing profile for ${faculty.name}')">View</button>
                <button class="btn btn-primary" onclick="alert('Editing profile for ${faculty.name}')">Edit</button>
                <button class="btn btn-secondary" onclick="alert('Assigning subjects for ${faculty.name}')">Assign</button>
              </div>
            </article>
          `).join('');
        }

        // Render Table list
        if (tableBody) {
          tableBody.innerHTML = facultyList.map((row) => `
            <tr>
              <td>${row.name}</td>
              <td>${row.department}</td>
              <td>SE</td> <!-- Seed data is for SE AIML -->
              <td>${row.division}</td>
              <td>${row.subject}</td>
              <td>${row.email || 'N/A'}</td>
              <td>${row.phone || 'N/A'}</td>
              <td><span class="badge-status ${row.status === 'Active' ? 'good' : 'warning'}">${row.status}</span></td>
              <td>
                <div class="button-row">
                  <button class="btn btn-secondary" onclick="alert('Viewing logs for ${row.name}')">View</button>
                  <button class="btn btn-primary" onclick="alert('Editing allocation for ${row.name}')">Edit</button>
                </div>
              </td>
            </tr>
          `).join('');
        }
      }
    }
  } catch (err) {
    console.error("Error loading faculty registry:", err);
  }

  // Faculty Search / Filtering
  const facultySearch = document.getElementById('facultySearchInput');
  if (facultySearch) {
    facultySearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      // Filter faculty card items
      document.querySelectorAll('#facultyCards .panel-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });

      // Filter faculty table rows
      document.querySelectorAll('#facultyTableBody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
});
