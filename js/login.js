document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const alertBox = document.getElementById('loginAlert');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const eyeIcon = document.getElementById('eyeIcon');

  // Mock User Database for Offline / Static Demo Mode
  // Mock User Database for Offline / Static Demo Mode
  const demoUsers = [
    {
      id: 1,
      full_name: 'Dr. Dipali Shende',
      email: 'hod@college.edu',
      password: 'dipali123',
      role: 'hod',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: 'HOD-001'
    },
    {
      id: 3,
      full_name: 'Omkar Wadekar',
      email: 'omkar@college.edu',
      password: 'omkar123',
      role: 'gfm',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: 'GFM-A101',
      division_assigned: 'Div A'
    },
    {
      id: 4,
      full_name: 'Pushkaraj Sonalkar',
      email: 'pushkaraj@college.edu',
      password: 'pushkaraj123',
      role: 'gfm',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: 'GFM-B102',
      division_assigned: 'Div B'
    },
    {
      id: 5,
      full_name: 'Shrutika Saudagar',
      email: 'shrutika@college.edu',
      password: 'shrutika123',
      role: 'gfm',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: 'GFM-C103',
      division_assigned: 'Div C'
    },
    {
      id: 9,
      full_name: 'Ram Mutthe',
      email: 'ram@gmail.com',
      password: '125UAM1004',
      role: 'student',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: '1',
      prn: '125UAM1004',
      roll_no: '1',
      semester: 'Semester VI',
      division: 'Div B',
      phone: '+91 98765 43204',
      guardian_contact: '+91 98220 11204 (Father)',
      academic_year: '2025 - 2026',
      gfm_name: 'Pushkaraj Sonalkar',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 6,
      full_name: 'Om Potarkar',
      email: 'om@gmail.com',
      password: '125UAM1001',
      role: 'student',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: '1',
      prn: '125UAM1001',
      roll_no: '1',
      semester: 'Semester VI',
      division: 'Div A',
      phone: '+91 98765 43201',
      guardian_contact: '+91 98220 11201 (Father)',
      academic_year: '2025 - 2026',
      gfm_name: 'Omkar Wadekar',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 7,
      full_name: 'Akib Momin',
      email: 'akib@gmail.com',
      password: '125UAM1002',
      role: 'student',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: '2',
      prn: '125UAM1002',
      roll_no: '2',
      semester: 'Semester VI',
      division: 'Div A',
      phone: '+91 98765 43202',
      guardian_contact: '+91 98220 11202 (Father)',
      academic_year: '2025 - 2026',
      gfm_name: 'Omkar Wadekar',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 8,
      full_name: 'Sachin Tompe',
      email: 'sachin@gmail.com',
      password: '125UAM1003',
      role: 'student',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: '3',
      prn: '125UAM1003',
      roll_no: '3',
      semester: 'Semester VI',
      division: 'Div A',
      phone: '+91 98765 43203',
      guardian_contact: '+91 98220 11203 (Father)',
      academic_year: '2025 - 2026',
      gfm_name: 'Omkar Wadekar',
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 10,
      full_name: 'Yash Lahase',
      email: 'yash@gmail.com',
      password: '125UAM1005',
      role: 'student',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: '2',
      prn: '125UAM1005',
      roll_no: '2',
      semester: 'Semester VI',
      division: 'Div B',
      phone: '+91 98765 43205',
      guardian_contact: '+91 98220 11205 (Father)',
      academic_year: '2025 - 2026',
      gfm_name: 'Pushkaraj Sonalkar',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 11,
      full_name: 'Sumit Kulkarni',
      email: 'sumit@gmail.com',
      password: '125UAM1006',
      role: 'student',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: '3',
      prn: '125UAM1006',
      roll_no: '3',
      semester: 'Semester VI',
      division: 'Div B',
      phone: '+91 98765 43206',
      guardian_contact: '+91 98220 11206 (Father)',
      academic_year: '2025 - 2026',
      gfm_name: 'Pushkaraj Sonalkar',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 12,
      full_name: 'Mahesh Jadhav',
      email: 'mahesh@gmail.com',
      password: '125UAM1007',
      role: 'student',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: '1',
      prn: '125UAM1007',
      roll_no: '1',
      semester: 'Semester VI',
      division: 'Div C',
      phone: '+91 98765 43207',
      guardian_contact: '+91 98220 11207 (Father)',
      academic_year: '2025 - 2026',
      gfm_name: 'Shrutika Saudagar',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 13,
      full_name: 'Pushkar Mali',
      email: 'pushkar@gmail.com',
      password: '125UAM1008',
      role: 'student',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: '2',
      prn: '125UAM1008',
      roll_no: '2',
      semester: 'Semester VI',
      division: 'Div C',
      phone: '+91 98765 43208',
      guardian_contact: '+91 98220 11208 (Father)',
      academic_year: '2025 - 2026',
      gfm_name: 'Shrutika Saudagar',
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 14,
      full_name: 'Rushi Mane',
      email: 'rushi@gmail.com',
      password: '125UAM1009',
      role: 'student',
      department: 'Artificial Intelligence & Machine Learning',
      roll_or_emp_id: '3',
      prn: '125UAM1009',
      roll_no: '3',
      semester: 'Semester VI',
      division: 'Div C',
      phone: '+91 98765 43209',
      guardian_contact: '+91 98220 11209 (Father)',
      academic_year: '2025 - 2026',
      gfm_name: 'Shrutika Saudagar',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
    }
  ];

  const redirectMap = {
    student: 'dashboards/student.html',
    gfm: 'dashboards/gfm.html',
    hod: 'hod/dashboard.html'
  };

  function extractFirstName(name, email) {
    const cleanName = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim();
    const firstWord = cleanName.split(' ')[0].toLowerCase();
    if (firstWord) return firstWord;
    return email.split('@')[0].toLowerCase();
  }

  function showAlert(message, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = 'block';
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.style.display = 'none';
  }

  // Password Visibility Toggle
  if (togglePasswordBtn && passwordInput && eyeIcon) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      eyeIcon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  }

  // Auto-detect role on email typing
  if (emailInput) {
    emailInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase().trim();
      let matchedRole = null;

      if (val.includes('student') || val.includes('@gmail.com') || val.includes('ram@') || val.includes('om@') || val.includes('akib@') || val.includes('sachin@') || val.includes('yash@') || val.includes('sumit@') || val.includes('mahesh@') || val.includes('pushkar@') || val.includes('rushi@')) matchedRole = 'student';
      else if (val.includes('gfm') || val.includes('omkar') || val.includes('pushkaraj') || val.includes('shrutika')) matchedRole = 'gfm';
      else if (val.includes('hod') || val.includes('dipali')) matchedRole = 'hod';

      if (matchedRole) {
        const radio = document.querySelector(`input[name="role"][value="${matchedRole}"]`);
        if (radio) radio.checked = true;
      }
    });
  }

  function handleDemoLogin(email, password, selectedRole) {
    let matchedUser = demoUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (matchedUser) {
      const expectedFirstName = extractFirstName(matchedUser.full_name, matchedUser.email);
      const expectedPassword = expectedFirstName + '123';
      const fallbackRolePass = matchedUser.role + '123';

      if (matchedUser.role === 'student') {
        const studentPrn = matchedUser.prn || '';
        if (
          password.toUpperCase() !== studentPrn.toUpperCase() &&
          password.toLowerCase() !== expectedPassword &&
          password !== matchedUser.password &&
          password !== 'student123'
        ) {
          showAlert(`Incorrect password for ${matchedUser.full_name}. Please use your PRN number (${studentPrn}).`);
          return false;
        }
      } else {
        if (
          password.toLowerCase() !== expectedPassword &&
          password.toLowerCase() !== fallbackRolePass &&
          password !== matchedUser.password
        ) {
          showAlert(`Incorrect password for ${matchedUser.full_name}. Please use password "${expectedPassword}".`);
          return false;
        }
      }
    } else {
      // Dynamic user creation if any other email entered
      const namePart = email.split('@')[0].toLowerCase();
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const expectedPass = namePart + '123';

      if (selectedRole === 'student') {
        matchedUser = {
          id: Date.now(),
          full_name: formattedName + ' Student',
          email: email,
          password: password,
          role: 'student',
          department: 'Artificial Intelligence & Machine Learning',
          roll_or_emp_id: '101',
          prn: '125UAM1099',
          roll_no: '101',
          semester: 'Semester VI',
          division: 'Div A',
          academic_year: '2025 - 2026',
          gfm_name: 'Prof. Omkar Wadekar',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
        };
      } else if (selectedRole === 'gfm') {
        matchedUser = {
          id: Date.now(),
          full_name: formattedName + ' (GFM)',
          email: email,
          password: password,
          role: 'gfm',
          department: 'Artificial Intelligence & Machine Learning',
          roll_or_emp_id: 'GFM-101',
          division_assigned: 'Div A'
        };
      } else if (selectedRole === 'hod') {
        matchedUser = {
          id: Date.now(),
          full_name: 'Dr. ' + formattedName,
          email: email,
          password: password,
          role: 'hod',
          department: 'Artificial Intelligence & Machine Learning',
          roll_or_emp_id: 'HOD-001'
        };
      }
    }

    if (matchedUser && matchedUser.role !== selectedRole) {
      showAlert(`Selected role ("${selectedRole.toUpperCase()}") does not match account role ("${matchedUser.role.toUpperCase()}"). Please select the correct role.`);
      return false;
    }

    const targetRedirect = redirectMap[selectedRole] || 'dashboards/student.html';
    showAlert('Login successful! Redirecting...', 'success');
    sessionStorage.setItem('attendance_user', JSON.stringify(matchedUser));
    localStorage.setItem('attendance_user', JSON.stringify(matchedUser));

    setTimeout(() => {
      window.location.href = targetRedirect;
    }, 500);

    return true;
  }

  // ==========================================
  // DIRECT ZPRN PASSWORD RESET WORKFLOW (NO OTP)
  // ==========================================
  const forgotLink = document.getElementById('forgotPasswordLink');
  const forgotModal = document.getElementById('forgotModal');
  const closeForgotModalBtn = document.getElementById('closeForgotModal');
  const directResetForm = document.getElementById('directResetForm');
  const forgotPrnInput = document.getElementById('forgotPrnInput');
  const forgotNewPasswordInput = document.getElementById('forgotNewPasswordInput');
  const forgotConfirmPasswordInput = document.getElementById('forgotConfirmPasswordInput');
  const finishResetBtn = document.getElementById('finishResetBtn');

  const forgotStep1 = document.getElementById('forgotStep1');
  const forgotStep3 = document.getElementById('forgotStep3');
  const forgotAlert = document.getElementById('forgotAlert');

  function showModalAlert(box, msg, type = 'error') {
    if (!box) return;
    box.textContent = msg;
    box.className = `alert-box alert-${type}`;
    box.style.display = 'block';
  }

  function hideModalAlerts() {
    if (forgotAlert) forgotAlert.style.display = 'none';
  }

  if (forgotLink && forgotModal) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      const mainInputVal = emailInput ? emailInput.value.trim() : '';
      if (forgotPrnInput) forgotPrnInput.value = mainInputVal;
      if (forgotNewPasswordInput) forgotNewPasswordInput.value = '';
      if (forgotConfirmPasswordInput) forgotConfirmPasswordInput.value = '';
      
      if (forgotStep1) forgotStep1.style.display = 'block';
      if (forgotStep3) forgotStep3.style.display = 'none';
      hideModalAlerts();
      
      forgotModal.style.display = 'grid';
    });
  }

  if (closeForgotModalBtn && forgotModal) {
    closeForgotModalBtn.addEventListener('click', () => {
      forgotModal.style.display = 'none';
    });
  }

  // Direct ZPRN Password Reset Form Submission
  if (directResetForm) {
    directResetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideModalAlerts();

      const prn = forgotPrnInput ? forgotPrnInput.value.trim() : '';
      const newPass = forgotNewPasswordInput ? forgotNewPasswordInput.value.trim() : '';
      const confirmPass = forgotConfirmPasswordInput ? forgotConfirmPasswordInput.value.trim() : '';

      if (!prn) {
        showModalAlert(forgotAlert, 'Please enter your registered ZPRN / PRN number.');
        return;
      }

      if (!newPass) {
        showModalAlert(forgotAlert, 'Please enter a new password.');
        return;
      }

      if (newPass !== confirmPass) {
        showModalAlert(forgotAlert, 'New password and confirm password do not match.');
        return;
      }

      try {
        const res = await fetch('api/forgot_password.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prn: prn, new_password: newPass })
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (!data.success) {
              showModalAlert(forgotAlert, data.message || 'ZPRN number not found.');
              return;
            }
          }
        }
      } catch(err) {}

      // Update demo Users in local state
      const foundUser = demoUsers.find(u => 
        (u.prn && u.prn.toUpperCase() === prn.toUpperCase()) ||
        (u.roll_or_emp_id && u.roll_or_emp_id.toUpperCase() === prn.toUpperCase()) ||
        u.email.toLowerCase() === prn.toLowerCase()
      );
      if (foundUser) {
        foundUser.password = newPass;
      }

      if (forgotStep1) forgotStep1.style.display = 'none';
      if (forgotStep3) forgotStep3.style.display = 'block';
    });
  }

  if (finishResetBtn && forgotModal) {
    finishResetBtn.addEventListener('click', () => {
      forgotModal.style.display = 'none';
    });
  }

  if (finishResetBtn && forgotModal) {
    finishResetBtn.addEventListener('click', () => {
      forgotModal.style.display = 'none';
    });
  }

  // Form Submit Handler
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideAlert();

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';
      const selectedRole = document.querySelector('input[name="role"]:checked')?.value || 'student';

      if (!email || !password) {
        showAlert('Please enter both email address and password.');
        return;
      }

      try {
        const response = await fetch('api/login.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, role: selectedRole })
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            if (data.success) {
              showAlert('Login successful! Redirecting...', 'success');
              sessionStorage.setItem('attendance_user', JSON.stringify(data.user));
              localStorage.setItem('attendance_user', JSON.stringify(data.user));
              setTimeout(() => {
                window.location.href = data.redirect;
              }, 500);
              return;
            } else {
              showAlert(data.message || 'Login failed. Please check credentials.');
              return;
            }
          }
        }
        // If server response is not valid JSON, fallback to demo mode
        handleDemoLogin(email, password, selectedRole);
      } catch (err) {
        // Network error (e.g. file:// protocol or PHP server not running) -> Fallback to client-side demo mode!
        handleDemoLogin(email, password, selectedRole);
      }
    });
  }
});

