# GFM Attendance Defaulter Portal — Setup Guide

## Prerequisites
- [XAMPP](https://www.apachefriends.org/) installed (includes Apache + MySQL + PHP)

---

## Step-by-Step Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ShrutikaSS/GFM-Attendence-defaulter-portal.git
```

### 2. Copy to XAMPP htdocs
Copy the cloned folder to your XAMPP `htdocs` directory:
```
C:\xampp\htdocs\GFM-Attendence-defaulter-portal\
```
(on macOS/Linux: `/Applications/XAMPP/htdocs/` or `/opt/lampp/htdocs/`)

### 3. Start XAMPP
Open XAMPP Control Panel and start:
- **Apache**
- **MySQL**

### 4. Import the Database
1. Open **phpMyAdmin** in your browser: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
2. Click **"New"** on the left sidebar to create a new database
3. Name it exactly: `attendance_db`
4. Click **Create**
5. Click on `attendance_db` in the left sidebar
6. Click the **"Import"** tab at the top
7. Click **"Choose File"** and select `full_database_export.sql` from the project folder
8. Click **"Go"** at the bottom

### 5. Access the Portal
Open your browser and go to:
```
http://localhost/GFM-Attendence-defaulter-portal/
```

---

## Default Login Credentials

| Role    | Email                       | Password      |
|---------|-----------------------------|---------------|
| HOD     | hod@college.edu             | hod123        |
| GFM     | omkar@college.edu           | gfm123        |
| Student | (use student email from DB) | (PRN number)  |

---

## Troubleshooting

### "Redirected to login page after cloning"
This happens because the project uses **PHP sessions** and a **local MySQL database**. Each team member must:
- Run their own XAMPP with Apache + MySQL
- Import the `full_database_export.sql` file into a database named `attendance_db`

### "Database connection failed"
Check that the database name in `api/db.php` matches exactly:
```php
$dbname = 'attendance_db';
$username = 'root';
$password = '';  // leave blank for default XAMPP
```

### Port conflicts
If XAMPP port 80 is busy, change Apache to port 8080 in XAMPP Control Panel, then access via:
```
http://localhost:8080/GFM-Attendence-defaulter-portal/
```
