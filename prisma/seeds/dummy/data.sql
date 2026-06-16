
-- =====================================================
-- DUMMY DATA FOR POSTGRESQL (UUID)
-- =====================================================

-- =====================================================
-- 1. USERS (5 users)
-- =====================================================
INSERT INTO users (
    id, username, first_name, last_name, email, password, role, phone,
    profile_pict_url, birth_date, is_email_verified, is_phone_verified,
    status, created_at, updated_at, email_verified_at, phone_verified_at
) VALUES
(gen_random_uuid(), 'johndoe', 'John', 'Doe', 'john.doe@example.com',
 '$2b$10$YourHashedPasswordHere123456789012345678901234567890123',
 'USER', '+628123456001', 'https://i.pravatar.cc/150?img=1',
 '1990-05-15', true, true, 'ACTIVE',
 NOW() - INTERVAL '6 months', NOW() - INTERVAL '1 month',
 NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months'),
(gen_random_uuid(), 'janedoe', 'Jane', 'Smith', 'jane.smith@example.com',
 '$2b$10$YourHashedPasswordHere123456789012345678901234567890123',
 'USER', '+628123456002', 'https://i.pravatar.cc/150?img=2',
 '1992-08-20', true, true, 'ACTIVE',
 NOW() - INTERVAL '5 months', NOW() - INTERVAL '2 weeks',
 NOW() - INTERVAL '5 months', NOW() - INTERVAL '5 months'),
(gen_random_uuid(), 'bobbuilder', 'Bob', 'Builder', 'bob.builder@example.com',
 '$2b$10$YourHashedPasswordHere123456789012345678901234567890123',
 'USER', '+628123456003', 'https://i.pravatar.cc/150?img=3',
 '1988-03-10', true, true, 'ACTIVE',
 NOW() - INTERVAL '4 months', NOW() - INTERVAL '1 week',
 NOW() - INTERVAL '4 months', NOW() - INTERVAL '4 months'),
(gen_random_uuid(), 'alicewonder', 'Alice', 'Wonder', 'alice.wonder@example.com',
 '$2b$10$YourHashedPasswordHere123456789012345678901234567890123',
 'USER', '+628123456004', NULL, '1995-11-25', false, false, 'PENDING_VERIFICATION',
 NOW() - INTERVAL '1 week', NULL, NULL, NULL),
(gen_random_uuid(), 'adminuser', 'Admin', 'System', 'admin@example.com',
 '$2b$10$YourHashedPasswordHere123456789012345678901234567890123',
 'ADMIN', '+628123456005', 'https://i.pravatar.cc/150?img=5',
 '1985-01-01', true, true, 'ACTIVE',
 NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 day',
 NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year');


-- =====================================================
-- TEMP VARS: Simpan UUID users ke variable sementara
-- pakai CTE agar bisa dipakai di INSERT berikutnya
-- =====================================================
DO $$
DECLARE
    v_user1 UUID;
    v_user2 UUID;
    v_user3 UUID;
    v_user4 UUID;

    v_addr1 UUID;
    v_addr2 UUID;
    v_addr3 UUID;
    v_addr4 UUID;
    v_addr5 UUID;
    v_addr6 UUID;

    v_job1  UUID;
    v_job2  UUID;
    v_job3  UUID;
    v_job4  UUID;
    v_job5  UUID;
    v_job6  UUID;
    v_job7  UUID;
    v_job8  UUID;

    v_subdist_id VARCHAR;

    -- loop variables untuk categories mapping
    v_job_ids   UUID[];
    v_intervals TEXT[];
    v_jc_id     VARCHAR;
    i           INT;
BEGIN

    -- Ambil UUID users berdasarkan username
    SELECT id INTO v_user1 FROM users WHERE username = 'johndoe';
    SELECT id INTO v_user2 FROM users WHERE username = 'janedoe';
    SELECT id INTO v_user3 FROM users WHERE username = 'bobbuilder';
    SELECT id INTO v_user4 FROM users WHERE username = 'alicewonder';

    -- Ambil subdistrict pertama (sesuaikan WHERE jika perlu subdistrict spesifik)
    SELECT id INTO v_subdist_id FROM master_subdistricts LIMIT 1;

    -- =================================================
    -- 2. ADDRESSES
    -- =================================================
    v_addr1 := gen_random_uuid();
    v_addr2 := gen_random_uuid();
    v_addr3 := gen_random_uuid();
    v_addr4 := gen_random_uuid();
    v_addr5 := gen_random_uuid();
    v_addr6 := gen_random_uuid();

    INSERT INTO addresses (
        id, street, country, postal_code, locations, benchmark,
        is_primary, mark_as, lat, lng, created_at, updated_at,
        user_id, subdistrict_id
    ) VALUES
    (v_addr1, 'Jl. Merdeka No. 123', 'Indonesia', '60123',
     '{"lat": -7.2575, "lng": 112.7521, "street": "Jl. Merdeka No. 123", "postalCode": "60123", "masterLocations": {"subdistrict": {"name": "Tegalsari"}, "district": {"name": "Tegalsari"}, "city": {"name": "Kota Surabaya"}, "province": {"name": "Jawa Timur"}}}',
     'Dekat Indomaret', true, 'HOME', -7.2575, 112.7521,
     NOW() - INTERVAL '6 months', NOW() - INTERVAL '1 month',
     v_user1, v_subdist_id),

    (v_addr2, 'Jl. Pemuda No. 456', 'Indonesia', '60271',
     '{"lat": -7.2619, "lng": 112.7411, "street": "Jl. Pemuda No. 456", "postalCode": "60271", "masterLocations": {"subdistrict": {"name": "Tegalsari"}, "district": {"name": "Tegalsari"}, "city": {"name": "Kota Surabaya"}, "province": {"name": "Jawa Timur"}}}',
     'Dekat Alfamart', false, 'OFFICE', -7.2619, 112.7411,
     NOW() - INTERVAL '5 months', NULL,
     v_user1, v_subdist_id),

    (v_addr3, 'Jl. Raya Darmo No. 789', 'Indonesia', '60189',
     '{"lat": -7.2754, "lng": 112.7325, "street": "Jl. Raya Darmo No. 789", "postalCode": "60189", "masterLocations": {"subdistrict": {"name": "Tegalsari"}, "district": {"name": "Tegalsari"}, "city": {"name": "Kota Surabaya"}, "province": {"name": "Jawa Timur"}}}',
     'Dekat Bank BCA', true, 'HOME', -7.2754, 112.7325,
     NOW() - INTERVAL '5 months', NOW() - INTERVAL '2 weeks',
     v_user2, v_subdist_id),

    (v_addr4, 'Jl. HR Muhammad No. 321', 'Indonesia', '60243',
     '{"lat": -7.2833, "lng": 112.7519, "street": "Jl. HR Muhammad No. 321", "postalCode": "60243", "masterLocations": {"subdistrict": {"name": "Tegalsari"}, "district": {"name": "Tegalsari"}, "city": {"name": "Kota Surabaya"}, "province": {"name": "Jawa Timur"}}}',
     NULL, false, 'OFFICE', -7.2833, 112.7519,
     NOW() - INTERVAL '4 months', NULL,
     v_user2, v_subdist_id),

    (v_addr5, 'Jl. Diponegoro No. 555', 'Indonesia', '60241',
     '{"lat": -7.2654, "lng": 112.7391, "street": "Jl. Diponegoro No. 555", "postalCode": "60241", "masterLocations": {"subdistrict": {"name": "Tegalsari"}, "district": {"name": "Tegalsari"}, "city": {"name": "Kota Surabaya"}, "province": {"name": "Jawa Timur"}}}',
     'Dekat Taman', true, 'HOME', -7.2654, 112.7391,
     NOW() - INTERVAL '4 months', NOW() - INTERVAL '1 week',
     v_user3, v_subdist_id),

    (v_addr6, 'Jl. Basuki Rahmat No. 999', 'Indonesia', '60271',
     '{"lat": -7.2589, "lng": 112.7431, "street": "Jl. Basuki Rahmat No. 999", "postalCode": "60271", "masterLocations": {"subdistrict": {"name": "Tegalsari"}, "district": {"name": "Tegalsari"}, "city": {"name": "Kota Surabaya"}, "province": {"name": "Jawa Timur"}}}',
     'Dekat Stasiun', true, 'HOME', -7.2589, 112.7431,
     NOW() - INTERVAL '1 week', NULL,
     v_user4, v_subdist_id);

    -- =================================================
    -- 3. JOBS
    -- =================================================
    v_job1 := gen_random_uuid();
    v_job2 := gen_random_uuid();
    v_job3 := gen_random_uuid();
    v_job4 := gen_random_uuid();
    v_job5 := gen_random_uuid();
    v_job6 := gen_random_uuid();
    v_job7 := gen_random_uuid();
    v_job8 := gen_random_uuid();

    INSERT INTO jobs (
        id, title, introduction, description, job_site, budget_min, budget_max,
        budget_type, level, required, status, application_count, start_time,
        end_time, start_date, end_date, locations, is_public, type,
        created_at, updated_at, job_provider_id, address_id
    ) VALUES
    (v_job1, 'Perbaikan Atap Bocor',
     'Butuh tukang berpengalaman untuk memperbaiki atap rumah yang bocor',
     'Atap rumah saya bocor di beberapa titik. Membutuhkan tukang yang berpengalaman dalam perbaikan atap. Pekerjaan harus selesai dalam 2 hari. Material sudah tersedia.',
     'ON_SITE', 1500000, 2000000, 'FIXED',
     ARRAY['INTERMEDIATE','ADVANCED']::"LevelJob"[], 2, 'OPEN', 3,
     '08:00:00', '16:00:00',
     CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days',
     '{"lat": -7.2575, "lng": 112.7521, "city": "Kota Surabaya", "province": "Jawa Timur"}',
     true, 'URGENT',
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',
     v_user1, v_addr1),

    (v_job2, 'General Cleaning Kantor',
     'Mencari cleaning service untuk kantor bulanan',
     'Membutuhkan jasa cleaning service untuk kantor dengan luas 200m2. Pekerjaan dilakukan setiap hari Senin-Jumat. Kontrak bulanan.',
     'ON_SITE', 3000000, 4000000, 'MONTHLY',
     ARRAY['BEGINNER','INTERMEDIATE']::"LevelJob"[], 3, 'OPEN', 1,
     '17:00:00', '21:00:00',
     CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '37 days',
     '{"lat": -7.2619, "lng": 112.7411, "city": "Kota Surabaya", "province": "Jawa Timur"}',
     true, 'NON_URGENT',
     NOW() - INTERVAL '5 days', NULL,
     v_user1, v_addr2),

    (v_job3, 'Service AC Split 2 Unit',
     'Service rutin AC untuk 2 unit AC split',
     'Membutuhkan teknisi AC untuk service rutin 2 unit AC split di rumah. Termasuk cuci evaporator, cek freon, dan pengecekan umum.',
     'ON_SITE', 500000, 700000, 'FIXED',
     ARRAY['INTERMEDIATE']::"LevelJob"[], 1, 'IN_PROGRESS', 5,
     '09:00:00', '12:00:00',
     CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day',
     '{"lat": -7.2575, "lng": 112.7521, "city": "Kota Surabaya", "province": "Jawa Timur"}',
     true, 'NON_URGENT',
     NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day',
     v_user1, v_addr1),

    (v_job4, 'Pembuatan Website Company Profile',
     'Butuh web developer untuk membuat company profile',
     'Membutuhkan web developer untuk membuat website company profile. Stack bebas, yang penting responsive dan modern. Include CMS untuk update konten.',
     'REMOTE', 5000000, 8000000, 'FIXED',
     ARRAY['INTERMEDIATE','ADVANCED','EXPERT']::"LevelJob"[], 1, 'CLOSED', 8,
     NULL, NULL,
     CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '20 days',
     '{"lat": -7.2619, "lng": 112.7411, "city": "Kota Surabaya", "province": "Jawa Timur"}',
     true, 'NON_URGENT',
     NOW() - INTERVAL '40 days', NOW() - INTERVAL '20 days',
     v_user1, v_addr2),

    (v_job5, 'Massage Therapist ke Rumah',
     'Butuh terapis pijat profesional untuk home service',
     'Mencari massage therapist berpengalaman untuk home service. Preferensi yang sudah bersertifikat. Jadwal fleksibel sesuai kesepakatan.',
     'ON_SITE', 300000, 500000, 'HOURLY',
     ARRAY['INTERMEDIATE','ADVANCED']::"LevelJob"[], 1, 'OPEN', 2,
     '18:00:00', '20:00:00',
     CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days',
     '{"lat": -7.2754, "lng": 112.7325, "city": "Kota Surabaya", "province": "Jawa Timur"}',
     true, 'URGENT',
     NOW() - INTERVAL '1 day', NULL,
     v_user2, v_addr3),

    (v_job6, 'Dekorasi Ulang Tahun Anak',
     'Butuh jasa dekorasi untuk pesta ulang tahun anak',
     'Membutuhkan jasa dekorasi untuk pesta ulang tahun anak tema Frozen. Lokasi di rumah, perkiraan tamu 50 orang. Include balon, backdrop, dan meja snack.',
     'ON_SITE', 2000000, 3500000, 'FIXED',
     ARRAY['BEGINNER','INTERMEDIATE']::"LevelJob"[], 2, 'OPEN', 0,
     '07:00:00', '12:00:00',
     CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '14 days',
     '{"lat": -7.2754, "lng": 112.7325, "city": "Kota Surabaya", "province": "Jawa Timur"}',
     true, 'NON_URGENT',
     NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day',
     v_user2, v_addr3),

    (v_job7, 'Les Privat Matematika SMA',
     'Guru les matematika untuk persiapan UTBK',
     'Mencari guru les privat matematika untuk anak SMA kelas 12. Fokus persiapan UTBK. Minimal pengalaman 2 tahun. Jadwal 3x seminggu.',
     'HYBRID', 150000, 250000, 'HOURLY',
     ARRAY['INTERMEDIATE','ADVANCED','EXPERT']::"LevelJob"[], 1, 'OPEN', 4,
     '16:00:00', '18:00:00',
     CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '60 days',
     '{"lat": -7.2833, "lng": 112.7519, "city": "Kota Surabaya", "province": "Jawa Timur"}',
     true, 'URGENT',
     NOW() - INTERVAL '6 hours', NULL,
     v_user2, v_addr4),

    (v_job8, 'Desain Logo & Brand Identity',
     'Butuh graphic designer untuk logo startup',
     'Membutuhkan graphic designer untuk membuat logo dan brand identity untuk startup teknologi. Include logo variations, color palette, typography guide.',
     'REMOTE', 2000000, 4000000, 'FIXED',
     ARRAY['INTERMEDIATE','ADVANCED','EXPERT']::"LevelJob"[], 1, 'CANCELED', 2,
     NULL, NULL,
     CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '10 days',
     '{"lat": -7.2754, "lng": 112.7325, "city": "Kota Surabaya", "province": "Jawa Timur"}',
     true, 'NON_URGENT',
     NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days',
     v_user2, v_addr3);

    -- =================================================
    -- 4. CATEGORIES MAPPING
    -- job_category_id bertipe VARCHAR, job_id bertipe UUID
    -- =================================================
    v_job_ids   := ARRAY[v_job1, v_job2, v_job3, v_job4, v_job4, v_job5, v_job6, v_job7, v_job8];
    v_intervals := ARRAY['2 days','5 days','10 days','40 days','40 days','1 day','3 days','6 hours','20 days'];
    i := 1;

    FOR v_jc_id IN
        SELECT id FROM job_categories ORDER BY created_at LIMIT 9
    LOOP
        INSERT INTO categories_mapping (id, created_at, updated_at, job_category_id, job_id)
        VALUES (
            gen_random_uuid(),
            NOW() - v_intervals[i]::INTERVAL,
            NULL,
            v_jc_id,
            v_job_ids[i]
        );
        i := i + 1;
    END LOOP;

    DO $$
DECLARE
    v_user1 UUID; v_user2 UUID; v_user3 UUID; v_user4 UUID;
    v_addr1 UUID; v_addr2 UUID; v_addr3 UUID;
    v_addr4 UUID; v_addr5 UUID; v_addr6 UUID;
    v_job1  UUID; v_job2  UUID; v_job3  UUID; v_job4  UUID;
    v_job5  UUID; v_job6  UUID; v_job7  UUID; v_job8  UUID;
    v_subdist_id VARCHAR;
    v_job_ids   UUID[];
    v_intervals TEXT[];
    v_jc_id     VARCHAR;
    i           INT;

    -- Job Application IDs
    v_app1  UUID; v_app2  UUID; v_app3  UUID;
    v_app4  UUID; v_app5  UUID; v_app6  UUID;
    v_app7  UUID; v_app8  UUID; v_app9  UUID;
    v_app10 UUID; v_app11 UUID; v_app12 UUID;
    v_app13 UUID; v_app14 UUID; v_app15 UUID;
BEGIN
    -- ... (semua logic sebelumnya tetap sama)

    -- =================================================
    -- 5. JOB APPLICATIONS (dengan RETURNING)
    -- =================================================

    -- Job 1: Perbaikan Atap Bocor
    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Saya memiliki pengalaman 5 tahun dalam perbaikan atap.',
        'ACCEPTED', NOW() - INTERVAL '1 day 8 hours', NOW() - INTERVAL '1 day 6 hours',
        NOW() - INTERVAL '1 day 4 hours', NULL, v_user3, v_job1)
    RETURNING id INTO v_app1;

    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Berpengalaman 3 tahun sebagai tukang atap.',
        'REVIEWED', NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day 4 hours',
        NULL, NULL, v_user4, v_job1)
    RETURNING id INTO v_app2;

    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Siap kerja besok pagi, berpengalaman.',
        'APPLIED', NOW() - INTERVAL '12 hours', NULL,
        NULL, NULL, v_user2, v_job1)
    RETURNING id INTO v_app3;

    -- Job 2: General Cleaning
    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Tim kami terdiri dari 2 orang yang berpengalaman.',
        'APPLIED', NOW() - INTERVAL '1 day 2 hours', NULL,
        NULL, NULL, v_user3, v_job2)
    RETURNING id INTO v_app4;

    -- Job 3: Service AC
    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Teknisi AC bersertifikat, pengalaman 4 tahun.',
        'ACCEPTED', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days 20 hours',
        NOW() - INTERVAL '8 days', NULL, v_user3, v_job3)
    RETURNING id INTO v_app5;

    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Service AC profesional, harga bersaing.',
        'REJECTED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days 20 hours',
        NULL, NOW() - INTERVAL '8 days', v_user4, v_job3)
    RETURNING id INTO v_app6;

    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Teknisi berpengalaman 6 tahun di bidang pendingin udara.',
        'REJECTED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days 20 hours',
        NULL, NOW() - INTERVAL '8 days', v_user2, v_job3)
    RETURNING id INTO v_app7;

    -- Job 4: Website Company Profile
    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Full stack developer dengan 5 tahun pengalaman.',
        'ACCEPTED', NOW() - INTERVAL '38 days', NOW() - INTERVAL '37 days 20 hours',
        NOW() - INTERVAL '37 days', NULL, v_user3, v_job4)
    RETURNING id INTO v_app8;

    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Frontend developer berpengalaman React dan Vue.',
        'REJECTED', NOW() - INTERVAL '37 days', NOW() - INTERVAL '36 days 20 hours',
        NULL, NOW() - INTERVAL '37 days', v_user4, v_job4)
    RETURNING id INTO v_app9;

    -- Job 5: Massage Therapist
    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Terapis pijat bersertifikat, pengalaman 7 tahun home service.',
        'APPLIED', NOW() - INTERVAL '20 hours', NULL,
        NULL, NULL, v_user3, v_job5)
    RETURNING id INTO v_app10;

    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Terapis profesional, sudah lebih dari 200 klien.',
        'APPLIED', NOW() - INTERVAL '18 hours', NULL,
        NULL, NULL, v_user4, v_job5)
    RETURNING id INTO v_app11;

    -- Job 7: Les Privat Matematika
    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Mahasiswa matematika semester 7, nilai UTBK 790.',
        'SHORTLISTED', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 30 minutes',
        NULL, NULL, v_user4, v_job7)
    RETURNING id INTO v_app12;

    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Guru les berpengalaman 3 tahun, lulusan ITS Matematika.',
        'REVIEWED', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 30 minutes',
        NULL, NULL, v_user3, v_job7)
    RETURNING id INTO v_app13;

    -- Job 8: Desain Logo
    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Graphic designer 5 tahun, spesialis brand identity startup.',
        'REJECTED', NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days 20 hours',
        NULL, NOW() - INTERVAL '18 days', v_user3, v_job8)
    RETURNING id INTO v_app14;

    INSERT INTO job_applications (id, cover_letter, status, applied_at, reviewed_at, accepted_at, rejected_at, worker_id, job_id)
    VALUES (gen_random_uuid(), 'Designer dengan portofolio 50+ logo brand lokal.',
        'REJECTED', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days 20 hours',
        NULL, NOW() - INTERVAL '18 days', v_user4, v_job8)
    RETURNING id INTO v_app15;

    -- =================================================
    -- 6. NOTIFICATIONS
    -- Setiap event generate notif ke 2 pihak:
    -- JOB_APPLIED   -> provider (ada lamaran baru) + worker (konfirmasi terkirim)
    -- JOB_REVIEWED  -> worker (lamaran sudah dilihat)
    -- JOB_ACCEPTED  -> worker (diterima)
    -- JOB_REJECTED  -> worker (ditolak)
    -- =================================================

    INSERT INTO notifications (id, type, title, message, is_read, created_at, user_id, job_application_id)
    VALUES

    -- ── APP1: ACCEPTED (job1, user3 apply ke user1) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Perbaikan Atap Bocor',
     true, NOW() - INTERVAL '1 day 8 hours', v_user1, v_app1),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'BOBBUILDER, your application was sent to John Doe',
     true, NOW() - INTERVAL '1 day 8 hours', v_user3, v_app1),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from John Doe',
     'BOBBUILDER, Your application for Perbaikan Atap Bocor has been reviewed by owner',
     true, NOW() - INTERVAL '1 day 6 hours', v_user3, v_app1),

    (gen_random_uuid(), 'JOB_ACCEPTED', 'Application update from John Doe',
     'BOBBUILDER, Your application for Perbaikan Atap Bocor has been accepted',
     true, NOW() - INTERVAL '1 day 4 hours', v_user3, v_app1),

    -- ── APP2: REVIEWED (job1, user4 apply ke user1) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Perbaikan Atap Bocor',
     true, NOW() - INTERVAL '1 day 6 hours', v_user1, v_app2),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'ALICEWONDER, your application was sent to John Doe',
     true, NOW() - INTERVAL '1 day 6 hours', v_user4, v_app2),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from John Doe',
     'ALICEWONDER, Your application for Perbaikan Atap Bocor has been reviewed by owner',
     false, NOW() - INTERVAL '1 day 4 hours', v_user4, v_app2),

    -- ── APP3: APPLIED (job1, user2 apply ke user1) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Perbaikan Atap Bocor',
     false, NOW() - INTERVAL '12 hours', v_user1, v_app3),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'JANEDOE, your application was sent to John Doe',
     false, NOW() - INTERVAL '12 hours', v_user2, v_app3),

    -- ── APP4: APPLIED (job2, user3 apply ke user1) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: General Cleaning Kantor',
     false, NOW() - INTERVAL '1 day 2 hours', v_user1, v_app4),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'BOBBUILDER, your application was sent to John Doe',
     false, NOW() - INTERVAL '1 day 2 hours', v_user3, v_app4),

    -- ── APP5: ACCEPTED (job3, user3 apply ke user1) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Service AC Split 2 Unit',
     true, NOW() - INTERVAL '9 days', v_user1, v_app5),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'BOBBUILDER, your application was sent to John Doe',
     true, NOW() - INTERVAL '9 days', v_user3, v_app5),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from John Doe',
     'BOBBUILDER, Your application for Service AC Split 2 Unit has been reviewed by owner',
     true, NOW() - INTERVAL '8 days 20 hours', v_user3, v_app5),

    (gen_random_uuid(), 'JOB_ACCEPTED', 'Application update from John Doe',
     'BOBBUILDER, Your application for Service AC Split 2 Unit has been accepted',
     true, NOW() - INTERVAL '8 days', v_user3, v_app5),

    -- ── APP6: REJECTED (job3, user4) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Service AC Split 2 Unit',
     true, NOW() - INTERVAL '8 days', v_user1, v_app6),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'ALICEWONDER, your application was sent to John Doe',
     true, NOW() - INTERVAL '8 days', v_user4, v_app6),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from John Doe',
     'ALICEWONDER, Your application for Service AC Split 2 Unit has been reviewed by owner',
     true, NOW() - INTERVAL '7 days 20 hours', v_user4, v_app6),

    (gen_random_uuid(), 'JOB_REJECTED', 'Application update from John Doe',
     'ALICEWONDER, Your application for Service AC Split 2 Unit has been rejected',
     true, NOW() - INTERVAL '8 days', v_user4, v_app6),

    -- ── APP7: REJECTED (job3, user2) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Service AC Split 2 Unit',
     true, NOW() - INTERVAL '7 days', v_user1, v_app7),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'JANEDOE, your application was sent to John Doe',
     true, NOW() - INTERVAL '7 days', v_user2, v_app7),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from John Doe',
     'JANEDOE, Your application for Service AC Split 2 Unit has been reviewed by owner',
     true, NOW() - INTERVAL '6 days 20 hours', v_user2, v_app7),

    (gen_random_uuid(), 'JOB_REJECTED', 'Application update from John Doe',
     'JANEDOE, Your application for Service AC Split 2 Unit has been rejected',
     true, NOW() - INTERVAL '8 days', v_user2, v_app7),

    -- ── APP8: ACCEPTED (job4, user3) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Pembuatan Website Company Profile',
     true, NOW() - INTERVAL '38 days', v_user1, v_app8),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'BOBBUILDER, your application was sent to John Doe',
     true, NOW() - INTERVAL '38 days', v_user3, v_app8),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from John Doe',
     'BOBBUILDER, Your application for Pembuatan Website Company Profile has been reviewed by owner',
     true, NOW() - INTERVAL '37 days 20 hours', v_user3, v_app8),

    (gen_random_uuid(), 'JOB_ACCEPTED', 'Application update from John Doe',
     'BOBBUILDER, Your application for Pembuatan Website Company Profile has been accepted',
     true, NOW() - INTERVAL '37 days', v_user3, v_app8),

    -- ── APP9: REJECTED (job4, user4) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Pembuatan Website Company Profile',
     true, NOW() - INTERVAL '37 days', v_user1, v_app9),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'ALICEWONDER, your application was sent to John Doe',
     true, NOW() - INTERVAL '37 days', v_user4, v_app9),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from John Doe',
     'ALICEWONDER, Your application for Pembuatan Website Company Profile has been reviewed by owner',
     true, NOW() - INTERVAL '36 days 20 hours', v_user4, v_app9),

    (gen_random_uuid(), 'JOB_REJECTED', 'Application update from John Doe',
     'ALICEWONDER, Your application for Pembuatan Website Company Profile has been rejected',
     true, NOW() - INTERVAL '37 days', v_user4, v_app9),

    -- ── APP10: APPLIED (job5, user3) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Massage Therapist ke Rumah',
     false, NOW() - INTERVAL '20 hours', v_user2, v_app10),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'BOBBUILDER, your application was sent to Jane Smith',
     false, NOW() - INTERVAL '20 hours', v_user3, v_app10),

    -- ── APP11: APPLIED (job5, user4) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Massage Therapist ke Rumah',
     false, NOW() - INTERVAL '18 hours', v_user2, v_app11),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'ALICEWONDER, your application was sent to Jane Smith',
     false, NOW() - INTERVAL '18 hours', v_user4, v_app11),

    -- ── APP12: SHORTLISTED (job7, user4) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Les Privat Matematika SMA',
     true, NOW() - INTERVAL '5 hours', v_user2, v_app12),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'ALICEWONDER, your application was sent to Jane Smith',
     true, NOW() - INTERVAL '5 hours', v_user4, v_app12),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from Jane Smith',
     'ALICEWONDER, Your application for Les Privat Matematika SMA has been reviewed by owner',
     false, NOW() - INTERVAL '4 hours 30 minutes', v_user4, v_app12),

    -- ── APP13: REVIEWED (job7, user3) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Les Privat Matematika SMA',
     true, NOW() - INTERVAL '4 hours', v_user2, v_app13),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'BOBBUILDER, your application was sent to Jane Smith',
     true, NOW() - INTERVAL '4 hours', v_user3, v_app13),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from Jane Smith',
     'BOBBUILDER, Your application for Les Privat Matematika SMA has been reviewed by owner',
     false, NOW() - INTERVAL '3 hours 30 minutes', v_user3, v_app13),

    -- ── APP14: REJECTED (job8, user3) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Desain Logo & Brand Identity',
     true, NOW() - INTERVAL '19 days', v_user2, v_app14),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'BOBBUILDER, your application was sent to Jane Smith',
     true, NOW() - INTERVAL '19 days', v_user3, v_app14),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from Jane Smith',
     'BOBBUILDER, Your application for Desain Logo & Brand Identity has been reviewed by owner',
     true, NOW() - INTERVAL '18 days 20 hours', v_user3, v_app14),

    (gen_random_uuid(), 'JOB_REJECTED', 'Application update from Jane Smith',
     'BOBBUILDER, Your application for Desain Logo & Brand Identity has been rejected',
     true, NOW() - INTERVAL '18 days', v_user3, v_app14),

    -- ── APP15: REJECTED (job8, user4) ──
    (gen_random_uuid(), 'JOB_APPLIED', 'New job application',
     'Someone applied to your job: Desain Logo & Brand Identity',
     true, NOW() - INTERVAL '18 days', v_user2, v_app15),

    (gen_random_uuid(), 'JOB_APPLIED', 'Status job application',
     'ALICEWONDER, your application was sent to Jane Smith',
     true, NOW() - INTERVAL '18 days', v_user4, v_app15),

    (gen_random_uuid(), 'JOB_REVIEWED', 'Application update from Jane Smith',
     'ALICEWONDER, Your application for Desain Logo & Brand Identity has been reviewed by owner',
     true, NOW() - INTERVAL '17 days 20 hours', v_user4, v_app15),

    (gen_random_uuid(), 'JOB_REJECTED', 'Application update from Jane Smith',
     'ALICEWONDER, Your application for Desain Logo & Brand Identity has been rejected',
     true, NOW() - INTERVAL '18 days', v_user4, v_app15);

END $$;