-- ============================================================
-- MIGRATE TO FY A / FY B / FY C STRUCTURE
-- ============================================================

-- Add year column to student_details if not exists
ALTER TABLE `student_details`
  ADD COLUMN `year` VARCHAR(10) DEFAULT 'FY' AFTER `division`;

-- Update existing data: map semester to year
UPDATE `student_details` SET `year` = 'FY' WHERE `semester` IN ('Semester I', 'Semester II', 'Semester VI');
UPDATE `student_details` SET `year` = 'SY' WHERE `semester` IN ('Semester III', 'Semester IV');
UPDATE `student_details` SET `year` = 'TY' WHERE `semester` IN ('Semester V', 'Semester VI');
UPDATE `student_details` SET `year` = 'LY' WHERE `semester` IN ('Semester VII', 'Semester VIII');

-- For this specific requirement, set all to FY since user wants FY A, FY B, FY C
UPDATE `student_details` SET `year` = 'FY', `division` = 'A' WHERE `division` = 'Div A';
UPDATE `student_details` SET `year` = 'FY', `division` = 'B' WHERE `division` = 'Div B';
UPDATE `student_details` SET `year` = 'FY', `division` = 'C' WHERE `division` = 'Div C';

-- Create students VIEW matching required schema
CREATE OR REPLACE VIEW `students` AS
SELECT
    u.id AS student_id,
    sd.roll_no,
    sd.prn,
    u.full_name AS student_name,
    u.email,
    u.department,
    sd.year,
    sd.division,
    sd.semester,
    sd.phone,
    sd.guardian_contact,
    sd.academic_year,
    sd.gfm_name,
    sd.avatar_url,
    COALESCE(s.attendance_percentage, 0) AS attendance_percentage
FROM `users` u
JOIN `student_details` sd ON u.id = sd.user_id
LEFT JOIN `attendance_summary` s ON u.id = s.student_id
WHERE u.role = 'student';
