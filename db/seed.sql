-- Demo roster + the six requests the prototype shipped with.
-- mysql -u root -p hrmd_kiosk < db/seed.sql
-- Safe to re-run: employees are matched on employee_no, requests on reference.

USE hrmd_kiosk;

INSERT INTO employees
  (employee_no, last_name, first_name, middle_name, suffix, position_title, salary_grade, rate, email, phone, office, employment_status, source)
VALUES
  ('EMP-0001', 'Dela Cruz', 'Maria',  'Perez', NULL, 'Administrative Officer II', 14, 32409.00, 'maria.delacruz@tanjaycity.gov.ph', '09175554821', 'City Treasurer''s Office', 'Permanent', 'seed'),
  ('EMP-0002', 'Ramirez',  'Joel',   'A.',    NULL, 'Engineer II',               16, 41052.00, 'joel.ramirez@tanjaycity.gov.ph',   '09184427710', 'City Engineering Office', 'Permanent', 'seed'),
  ('EMP-0003', 'Lim',      'Angela', 'R.',    NULL, 'Nurse II',                  15, 36619.00, 'angela.lim@tanjaycity.gov.ph',     '09951203344', 'City Health Office', 'Casual', 'seed'),
  ('EMP-0004', 'Villanueva', 'Ramon', 'S.',   NULL, 'Administrative Aide IV',     6, 17899.00, 'ramon.villanueva@tanjaycity.gov.ph', '09218832276', 'City General Services Office', 'Permanent', 'seed'),
  ('EMP-0005', 'Flores',   'Liza',   'M.',    NULL, 'Planning Officer I',        11, 27225.00, 'liza.flores@tanjaycity.gov.ph',    '09172206631', 'Office of the City Mayor', 'Permanent', 'seed'),
  ('EMP-0006', 'Garcia',   'Noel',   'B.',    NULL, 'Budget Analyst I',          12, 29475.00, 'noel.garcia@tanjaycity.gov.ph',    '09367719052', 'City Budget Office', 'Job Order', 'seed'),
  ('EMP-0007', 'Reyes',    'Ana',    'D.',    NULL, 'Human Resource Management Officer III', 18, 51357.00, 'ana.reyes@tanjaycity.gov.ph', '09178840122', 'City Human Resource Management Division', 'Permanent', 'seed'),
  ('EMP-0008', 'Santos',   'Miguel', 'T.',    NULL, 'Records Officer I',         11, 27225.00, 'miguel.santos@tanjaycity.gov.ph',  '09274123508', 'City Civil Registrar''s Office', 'Permanent', 'seed'),
  ('EMP-0009', 'Bautista', 'Karen',  'L.',    NULL, 'Accountant II',             15, 36619.00, 'karen.bautista@tanjaycity.gov.ph', '09193308741', 'City Accounting Office', 'Permanent', 'seed'),
  ('EMP-0010', 'Mendoza',  'Paolo',  'C.',    NULL, 'Information Technology Officer I', 11, 27225.00, 'paolo.mendoza@tanjaycity.gov.ph', '09567712290', 'City Administrator''s Office', 'Contract of Service (COS)', 'seed'),
  ('EMP-0011', 'Aquino',   'Grace',  'P.',    NULL, 'Social Welfare Officer II', 15, 36619.00, 'grace.aquino@tanjaycity.gov.ph',   '09184883019', 'City Social Welfare and Development Office', 'Permanent', 'seed'),
  ('EMP-0012', 'Torres',   'Daniel', 'V.',    NULL, 'Driver I',                   4, 15466.00, 'daniel.torres@tanjaycity.gov.ph',  '09952341766', 'City General Services Office', 'Job Order', 'seed')
ON DUPLICATE KEY UPDATE last_name = VALUES(last_name);

-- ---------------------------------------------------------------- requests
INSERT INTO requests
  (reference, service, option_id, purpose, copies, remarks, others_specified, employee_id,
   emp_first, emp_middle, emp_last, emp_suffix, emp_position, emp_office, emp_status, emp_email, emp_phone,
   submitted_at, status)
VALUES
  ('HR-2026-0006', 'coe', 'coe', 'Bank loan application requirement', 2, NULL, NULL,
   (SELECT id FROM employees WHERE employee_no = 'EMP-0001'),
   'Maria', 'Perez', 'Dela Cruz', '', 'Administrative Officer II', 'City Treasurer''s Office', 'Permanent',
   'maria.delacruz@tanjaycity.gov.ph', '09175554821', '2026-11-10 01:14:00', 'Under Review'),

  ('HR-2026-0005', 'leave_review', 'vacation', 'Verification of leave records', NULL,
   'Credits carried over from last year appear short.', NULL,
   (SELECT id FROM employees WHERE employee_no = 'EMP-0002'),
   'Joel', 'A.', 'Ramirez', '', 'Engineer II', 'City Engineering Office', 'Permanent',
   'joel.ramirez@tanjaycity.gov.ph', '09184427710', '2026-11-10 00:40:00', 'Pending'),

  ('HR-2026-0004', 'leave_balance', 'both_balances', 'Personal record inquiry', NULL, NULL, NULL,
   (SELECT id FROM employees WHERE employee_no = 'EMP-0003'),
   'Angela', 'R.', 'Lim', '', 'Nurse II', 'City Health Office', 'Casual',
   'angela.lim@tanjaycity.gov.ph', '09951203344', '2026-11-09 06:05:00', 'Response Sent via Email'),

  ('HR-2026-0003', 'service_record', 'service_record', 'GSIS records update', 1, NULL, NULL,
   (SELECT id FROM employees WHERE employee_no = 'EMP-0004'),
   'Ramon', 'S.', 'Villanueva', '', 'Administrative Aide IV', 'City General Services Office', 'Permanent',
   'ramon.villanueva@tanjaycity.gov.ph', '09218832276', '2026-11-09 02:22:00', 'Completed'),

  ('HR-2026-0002', 'leave_review', 'sick', 'Record reconciliation', NULL, NULL, NULL,
   (SELECT id FROM employees WHERE employee_no = 'EMP-0005'),
   'Liza', 'M.', 'Flores', '', 'Planning Officer I', 'Office of the City Mayor', 'Permanent',
   'liza.flores@tanjaycity.gov.ph', '09172206631', '2026-11-06 07:48:00', 'Completed'),

  ('HR-2026-0001', 'loan', 'gsis', 'Inquiry on salary loan requirements', NULL,
   'Asking which documents to prepare before applying.', NULL,
   (SELECT id FROM employees WHERE employee_no = 'EMP-0006'),
   'Noel', 'B.', 'Garcia', '', 'Budget Analyst I', 'City Budget Office', 'Job Order',
   'noel.garcia@tanjaycity.gov.ph', '09367719052', '2026-11-05 03:03:00', 'Unable to Process')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ---------------------------------------------------------- request history
-- Guarded so re-running the seed does not duplicate the audit trail.
INSERT INTO request_history (request_id, status, note, actor, occurred_at)
SELECT r.id, h.status, h.note, h.actor, h.occurred_at
FROM requests r
JOIN (
  SELECT 'HR-2026-0006' AS ref, 'Under Review' AS status, 'Verifying appointment records before issuing the certificate.' AS note, 'Ana D. Reyes' AS actor, '2026-11-10 02:32:00' AS occurred_at
  UNION ALL SELECT 'HR-2026-0006', 'Pending', NULL, 'Kiosk', '2026-11-10 01:14:00'
  UNION ALL SELECT 'HR-2026-0005', 'Pending', NULL, 'Kiosk', '2026-11-10 00:40:00'
  UNION ALL SELECT 'HR-2026-0004', 'Response Sent via Email', 'Leave balance statement emailed to the employee.', 'Ana D. Reyes', '2026-11-10 00:02:00'
  UNION ALL SELECT 'HR-2026-0004', 'Under Review', NULL, 'Ana D. Reyes', '2026-11-09 07:20:00'
  UNION ALL SELECT 'HR-2026-0004', 'Pending', NULL, 'Kiosk', '2026-11-09 06:05:00'
  UNION ALL SELECT 'HR-2026-0003', 'Completed', 'Printed copy released and emailed to the employee.', 'Ana D. Reyes', '2026-11-09 08:45:00'
  UNION ALL SELECT 'HR-2026-0003', 'Under Review', NULL, 'Ana D. Reyes', '2026-11-09 03:10:00'
  UNION ALL SELECT 'HR-2026-0003', 'Pending', NULL, 'Kiosk', '2026-11-09 02:22:00'
  UNION ALL SELECT 'HR-2026-0002', 'Completed', 'Reconciled with attendance records; employee notified.', 'Ana D. Reyes', '2026-11-09 01:30:00'
  UNION ALL SELECT 'HR-2026-0002', 'Under Review', NULL, 'Ana D. Reyes', '2026-11-06 08:20:00'
  UNION ALL SELECT 'HR-2026-0002', 'Pending', NULL, 'Kiosk', '2026-11-06 07:48:00'
  UNION ALL SELECT 'HR-2026-0001', 'Unable to Process', 'Job Order personnel have no GSIS loan entitlement; referred to HRMO.', 'Ana D. Reyes', '2026-11-05 05:40:00'
  UNION ALL SELECT 'HR-2026-0001', 'Pending', NULL, 'Kiosk', '2026-11-05 03:03:00'
) AS h ON h.ref = r.reference
WHERE NOT EXISTS (
  SELECT 1 FROM request_history existing WHERE existing.request_id = r.id
);

-- ---------------------------------------------------------------- staff
-- Demo HRMD administrator. The password is the prototype's documented demo
-- credential; rotate it after first sign-in (see db/README.md).
INSERT INTO staff (username, display_name, role, password_hash)
VALUES ('hrmdadmin', 'Ana D. Reyes', 'admin', 'scrypt$16384$8$1$06fabc32b52e009692eb4611dd859bcf$1da7adb751f0ef9f3a8466ec9c6a6447f7862f38fce7d0be7ac6d91197fcf6095bf81ba95b0bf6547f1ee7552d68d871db9e1ed40ee1691dcd4bde17cc9456a3')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);
