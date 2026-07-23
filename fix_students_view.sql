-- Drop the view if it exists
DROP VIEW IF EXISTS `students`;

-- Create students VIEW matching required schema
CREATE VIEW `students` AS
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
    COALESCE(
        (SELECT CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) ELSE 0 END
         FROM attendance a
         WHERE a.student_id = u.id),
        0
    ) AS attendance_percentage
FROM `users` u
JOIN `student_details` sd ON u.id = sd.user_id
WHERE u.role = 'student';
