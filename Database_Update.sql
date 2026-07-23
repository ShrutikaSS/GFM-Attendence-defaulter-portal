-- ============================================================
-- GFM ATTENDANCE DEFAULTER PORTAL - DATABASE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS `attendance_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `attendance_db`;

-- ============================================================
-- DROP EXISTING TABLES
-- ============================================================

DROP TABLE IF EXISTS `attendance_logs`;
DROP TABLE IF EXISTS `attendance_history`;
DROP TABLE IF EXISTS `attendance_summary`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `notices`;
DROP TABLE IF EXISTS `subjects`;
DROP TABLE IF EXISTS `division`;
DROP TABLE IF EXISTS `semester`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `faculty`;
DROP TABLE IF EXISTS `gfm_details`;
DROP TABLE IF EXISTS `student_details`;
DROP TABLE IF EXISTS `users`;

-- ============================================================
-- MASTER DATA TABLES
-- ============================================================

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'gfm', 'hod') NOT NULL,
  `department` VARCHAR(100) DEFAULT 'Artificial Intelligence & Machine Learning',
  `roll_or_emp_id` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `student_details` (
  `user_id` INT PRIMARY KEY,
  `prn` VARCHAR(50) NOT NULL UNIQUE,
  `roll_no` VARCHAR(50) NOT NULL,
  `semester` VARCHAR(20) DEFAULT 'Semester VI',
  `division` VARCHAR(10) DEFAULT 'Div A',
  `phone` VARCHAR(20) DEFAULT NULL,
  `guardian_contact` VARCHAR(100) DEFAULT NULL,
  `academic_year` VARCHAR(20) DEFAULT '2025 - 2026',
  `gfm_name` VARCHAR(100) DEFAULT 'Prof. Aniket Verma',
  `avatar_url` VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `gfm_details` (
  `user_id` INT PRIMARY KEY,
  `division_assigned` VARCHAR(10) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `faculty` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(100) NOT NULL,
  `division` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('Active', 'On Leave') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `code` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `semester` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `division` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50) DEFAULT NULL,
  `department` VARCHAR(150) DEFAULT 'Artificial Intelligence & Machine Learning',
  `semester` VARCHAR(50) DEFAULT 'Semester VI',
  `division` VARCHAR(50) DEFAULT 'Div A',
  `credits` INT DEFAULT 3,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================

CREATE TABLE `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `subject_id` INT DEFAULT NULL,
  `subject` VARCHAR(100) NOT NULL,
  `faculty_id` INT DEFAULT NULL,
  `department_id` INT DEFAULT NULL,
  `semester` VARCHAR(50) DEFAULT 'Semester VI',
  `division` VARCHAR(20) DEFAULT 'Div A',
  `date` DATE NOT NULL,
  `lecture_number` INT DEFAULT 1,
  `status` ENUM('Present', 'Absent', 'Medical Leave', 'Duty Leave') NOT NULL DEFAULT 'Present',
  `remarks` VARCHAR(255) DEFAULT 'Regular',
  `academic_year` VARCHAR(20) DEFAULT '2025 - 2026',
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_attendance` (`student_id`, `subject`, `date`, `lecture_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `attendance_summary` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `subject` VARCHAR(100) NOT NULL,
  `semester` VARCHAR(50) DEFAULT 'Semester VI',
  `division` VARCHAR(20) DEFAULT 'Div A',
  `total_lectures` INT DEFAULT 0,
  `present_count` INT DEFAULT 0,
  `absent_count` INT DEFAULT 0,
  `medical_leave_count` INT DEFAULT 0,
  `duty_leave_count` INT DEFAULT 0,
  `attendance_percentage` DECIMAL(5,2) DEFAULT 0.00,
  `status` ENUM('Regular', 'Warning', 'Defaulter') DEFAULT 'Regular',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_summary` (`student_id`, `subject`, `semester`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `attendance_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attendance_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `old_status` VARCHAR(50) DEFAULT NULL,
  `new_status` VARCHAR(50) DEFAULT NULL,
  `old_remarks` VARCHAR(255) DEFAULT NULL,
  `new_remarks` VARCHAR(255) DEFAULT NULL,
  `edited_by` INT DEFAULT NULL,
  `editor_name` VARCHAR(100) DEFAULT NULL,
  `editor_role` ENUM('gfm', 'hod') DEFAULT 'gfm',
  `reason` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`attendance_id`) REFERENCES `attendance`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `attendance_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL,
  `user_id` INT DEFAULT NULL,
  `user_name` VARCHAR(100) DEFAULT NULL,
  `user_role` ENUM('student', 'gfm', 'hod') DEFAULT 'student',
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `target_role` ENUM('student', 'gfm', 'hod', 'all') DEFAULT 'all',
  `target_division` VARCHAR(50) DEFAULT NULL,
  `type` ENUM('attendance_updated', 'attendance_corrected', 'warning', 'critical_defaulter', 'regular') DEFAULT 'attendance_updated',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `link` VARCHAR(255) DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `notices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `target` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `division` VARCHAR(10) NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `time` VARCHAR(100) NOT NULL,
  `room` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Upcoming'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `department`, `roll_or_emp_id`) VALUES
(1, 'Dr. Dipali Shende', 'hod@college.edu', '$2y$10$85QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'hod', 'Artificial Intelligence & Machine Learning', 'HOD-001'),
(2, 'Dr. Dipali Shende', 'dipali.shende@college.edu', '$2y$10$85QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'hod', 'Artificial Intelligence & Machine Learning', 'HOD-001'),
(3, 'Omkar Wadekar', 'omkar@college.edu', '$2y$10$95QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'gfm', 'Artificial Intelligence & Machine Learning', 'GFM-A101'),
(4, 'Pushkaraj Sonalkar', 'pushkaraj@college.edu', '$2y$10$95QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'gfm', 'Artificial Intelligence & Machine Learning', 'GFM-B102'),
(5, 'Shrutika Saudagar', 'shrutika@college.edu', '$2y$10$95QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'gfm', 'Artificial Intelligence & Machine Learning', 'GFM-C103'),
(6, 'Om potarkar', 'om@gmail.com', '$2y$10$75QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'student', 'Artificial Intelligence & Machine Learning', '1'),
(7, 'Akib Momin', 'akib@gmail.com', '$2y$10$75QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'student', 'Artificial Intelligence & Machine Learning', '2'),
(8, 'Sachin tompe', 'sachin@gmail.com', '$2y$10$75QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'student', 'Artificial Intelligence & Machine Learning', '3'),
(9, 'Ram Mutthe', 'ram@gmail.com', '$2y$10$75QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'student', 'Artificial Intelligence & Machine Learning', '1'),
(10, 'Yash lahase', 'yash@gmail.com', '$2y$10$75QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'student', 'Artificial Intelligence & Machine Learning', '2'),
(11, 'Sumit Kulkarni', 'sumit@gmail.com', '$2y$10$75QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'student', 'Artificial Intelligence & Machine Learning', '3'),
(12, 'Mahesh Jadhav', 'mahesh@gmail.com', '$2y$10$75QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'student', 'Artificial Intelligence & Machine Learning', '1'),
(13, 'Pushkar Mali', 'pushkar@gmail.com', '$2y$10$75QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'student', 'Artificial Intelligence & Machine Learning', '2'),
(14, 'rushi mane', 'rushi@gmail.com', '$2y$10$75QGZlFqU2sUqQ5A9GzZVe1n10/Q5.n2h8h8y9.y0.y0.y0.y0.y0', 'student', 'Artificial Intelligence & Machine Learning', '3');

INSERT INTO `gfm_details` (`user_id`, `division_assigned`) VALUES
(3, 'Div A'), (4, 'Div B'), (5, 'Div C');

INSERT INTO `student_details` (`user_id`, `prn`, `roll_no`, `semester`, `division`, `phone`, `guardian_contact`, `academic_year`, `gfm_name`, `avatar_url`) VALUES
(6, '125UAM1001', '1', 'Semester VI', 'Div A', '+91 98765 43201', '+91 98220 11201 (Father)', '2025 - 2026', 'Omkar Wadekar', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250'),
(7, '125UAM1002', '2', 'Semester VI', 'Div A', '+91 98765 43202', '+91 98220 11202 (Father)', '2025 - 2026', 'Omkar Wadekar', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'),
(8, '125UAM1003', '3', 'Semester VI', 'Div A', '+91 98765 43203', '+91 98220 11203 (Father)', '2025 - 2026', 'Omkar Wadekar', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250'),
(9, '125UAM1004', '1', 'Semester VI', 'Div B', '+91 98765 43204', '+91 98220 11204 (Father)', '2025 - 2026', 'Pushkaraj Sonalkar', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250'),
(10, '125UAM1005', '2', 'Semester VI', 'Div B', '+91 98765 43205', '+91 98220 11205 (Father)', '2025 - 2026', 'Pushkaraj Sonalkar', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250'),
(11, '125UAM1006', '3', 'Semester VI', 'Div B', '+91 98765 43206', '+91 98220 11206 (Father)', '2025 - 2026', 'Pushkaraj Sonalkar', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250'),
(12, '125UAM1007', '1', 'Semester VI', 'Div C', '+91 98765 43207', '+91 98220 11207 (Father)', '2025 - 2026', 'Shrutika Saudagar', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250'),
(13, '125UAM1008', '2', 'Semester VI', 'Div C', '+91 98765 43208', '+91 98220 11208 (Father)', '2025 - 2026', 'Shrutika Saudagar', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250'),
(14, '125UAM1009', '3', 'Semester VI', 'Div C', '+91 98765 43209', '+91 98220 11209 (Father)', '2025 - 2026', 'Shrutika Saudagar', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250');

INSERT INTO `faculty` (`name`, `department`, `subject`, `division`, `email`, `phone`, `status`) VALUES
('Prof. D. Shah', 'Artificial Intelligence & Machine Learning', 'Database Systems', 'Div A', 'dipali.shah@college.edu', '+91 98765 43210', 'Active'),
('Prof. N. Joshi', 'Artificial Intelligence & Machine Learning', 'Web Development', 'Div A', 'nidhi.joshi@college.edu', '+91 91234 56789', 'On Leave'),
('Prof. R. Mehta', 'Artificial Intelligence & Machine Learning', 'Computer Networks', 'Div B', 'rohan.mehta@college.edu', '+91 93322 11009', 'Active'),
('Prof. A. V. Kulkarni', 'Artificial Intelligence & Machine Learning', 'Data Structures', 'Div B', 'kulkarni@college.edu', '+91 94433 22110', 'Active'),
('Prof. P. T. Joshi', 'Artificial Intelligence & Machine Learning', 'Software Engineering', 'Div C', 'joshi@college.edu', '+91 98112 23344', 'Active'),
('Prof. S. Rane', 'Artificial Intelligence & Machine Learning', 'Machine Learning', 'Div A', 'rane@college.edu', '+91 97654 32109', 'Active'),
('Prof. K. Desai', 'Artificial Intelligence & Machine Learning', 'Artificial Intelligence', 'Div B', 'desai@college.edu', '+91 96543 21098', 'Active');

INSERT INTO `departments` (`name`, `code`) VALUES
('Artificial Intelligence & Machine Learning', 'AIML'),
('Computer Engineering', 'CE'),
('Information Technology', 'IT'),
('Electronics & Telecommunication', 'EXTC');

INSERT INTO `semester` (`name`, `code`) VALUES
('Semester I', 'SEM1'), ('Semester II', 'SEM2'),
('Semester III', 'SEM3'), ('Semester IV', 'SEM4'),
('Semester V', 'SEM5'), ('Semester VI', 'SEM6'),
('Semester VII', 'SEM7'), ('Semester VIII', 'SEM8');

INSERT INTO `division` (`name`, `code`) VALUES
('Div A', 'A'), ('Div B', 'B'), ('Div C', 'C');

INSERT INTO `subjects` (`name`, `code`, `department`, `semester`, `division`, `credits`) VALUES
('Web Development', 'WD', 'Artificial Intelligence & Machine Learning', 'Semester VI', 'Div A', 3),
('Data Structures', 'DS', 'Artificial Intelligence & Machine Learning', 'Semester VI', 'Div A', 4),
('Database Systems', 'DBMS', 'Artificial Intelligence & Machine Learning', 'Semester VI', 'Div B', 3),
('Computer Networks', 'CN', 'Artificial Intelligence & Machine Learning', 'Semester VI', 'Div B', 3),
('Software Engineering', 'SE', 'Artificial Intelligence & Machine Learning', 'Semester VI', 'Div C', 3),
('Mobile Application Development', 'MAD', 'Artificial Intelligence & Machine Learning', 'Semester VI', 'Div C', 3),
('Machine Learning', 'ML', 'Artificial Intelligence & Machine Learning', 'Semester VI', 'Div A', 4),
('Artificial Intelligence', 'AI', 'Artificial Intelligence & Machine Learning', 'Semester VI', 'Div B', 4);

INSERT INTO `notices` (`title`, `target`, `message`, `created_by`) VALUES
('Mid-Term Attendance Defaulter List Released', 'Div A', 'All students with attendance below 75% are required to submit leave applications with medical certificates by Friday.', 3),
('Parent-Teacher Meeting Scheduled', 'Critical Defaulters', 'Parent-teacher meeting scheduled for all students falling under critical defaulter category (<60%).', 3),
('Urgent Notice: Review Meeting for Division B', 'Div B', 'A feedback session for Division B is scheduled on Thursday to review attendance issues.', 4);

INSERT INTO `schedules` (`division`, `title`, `time`, `room`, `status`) VALUES
('Div A', 'Web Development Lab', '09:30 AM - 11:30 AM', 'Computer Lab 4', 'Completed'),
('Div A', 'Data Structures Lecture', '11:45 AM - 12:45 PM', 'Auditorium Hall B', 'Ongoing'),
('Div A', 'Database Systems', '01:30 PM - 02:30 PM', 'Classroom 302', 'Upcoming'),
('Div B', 'Computer Networks Lab', '09:30 AM - 11:30 AM', 'Computer Lab 2', 'Completed'),
('Div B', 'Data Structures Lab', '11:45 AM - 12:45 PM', 'Computer Lab 3', 'Ongoing'),
('Div B', 'Database Systems', '01:30 PM - 02:30 PM', 'Classroom 303', 'Upcoming'),
('Div C', 'Software Engineering', '09:30 AM - 11:30 AM', 'Classroom 304', 'Completed'),
('Div C', 'Web Development Lab', '11:45 AM - 12:45 PM', 'Computer Lab 4', 'Ongoing'),
('Div C', 'Data Structures', '01:30 PM - 02:30 PM', 'Auditorium Hall B', 'Upcoming');
