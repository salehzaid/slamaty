--
-- PostgreSQL database dump
--

\restrict guI4ay9APBdPSxmuQxM9upRHtgWajhsC3fbger0ATyJlEdrEeafbHqm8rmdViMz

-- Dumped from database version 16.10 (Homebrew)
-- Dumped by pg_dump version 16.10 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: rounds; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.rounds (id, round_code, title, description, round_type, department, assigned_to, scheduled_date, status, priority, compliance_percentage, notes, created_by_id, created_at, evaluation_items, deadline, completion_percentage, end_date) VALUES (69, 'RND-TEST-20251007112301', 'جولة اختبار النظام المحدث', 'جولة لاختبار حفظ deadline و end_date', 'PATIENT_SAFETY', 'العناية المركزة', '["testuser"]', '2025-10-08 11:23:01.386937+03', 'SCHEDULED', 'medium', 0, 'اختبار النظام المحدث', 24, '2025-10-07 11:23:01.423087+03', '[]', '2025-10-15 11:23:01.386937+03', 0, '2025-10-15 11:23:01.386937+03');
INSERT INTO public.rounds (id, round_code, title, description, round_type, department, assigned_to, scheduled_date, status, priority, compliance_percentage, notes, created_by_id, created_at, evaluation_items, deadline, completion_percentage, end_date) VALUES (71, 'RND-API-TEST-20251007135808', 'جولة اختبار API المحدث', 'جولة لاختبار API مع deadline و end_date', 'PATIENT_SAFETY', 'العناية المركزة', '["amjad"]', '2025-10-08 13:58:08.905658+03', 'SCHEDULED', 'medium', 0, 'اختبار API المحدث', 40, '2025-10-07 13:58:08.934379+03', '[]', '2025-10-11 13:58:08.905658+03', 0, '2025-10-11 13:58:08.905658+03');
INSERT INTO public.rounds (id, round_code, title, description, round_type, department, assigned_to, scheduled_date, status, priority, compliance_percentage, notes, created_by_id, created_at, evaluation_items, deadline, completion_percentage, end_date) VALUES (66, 'RND-MGG852D3', 'الجودة في العناية', 'تعليق للمقيمينتعليق للمقيمينتعليق للمقيمين', 'MEDICATION_SAFETY', 'العناية المركزة', '["\u0646\u0627\u0635\u0631  \u0627\u0644\u0634\u0627\u0626\u0639", "\u0627\u0646\u0641\u0627\u0644 \u0627\u0644\u062f\u062d\u0648\u0645", "New User", "Saleh Alzaid", "\u0645\u062f\u064a\u0631 \u0645\u062d\u062f\u062b \u0627\u0644\u0646\u0638\u0627\u0645", 50, 1, 38, 39]', '2025-10-08 10:00:00+03', 'SCHEDULED', 'medium', 0, 'تعليق للمقيمين', 1, '2025-10-07 10:14:50.386792+03', '[21, 19, 20, 18, 22, 32, 61, 63, 62, 59, 28]', NULL, 0, NULL);
INSERT INTO public.rounds (id, round_code, title, description, round_type, department, assigned_to, scheduled_date, status, priority, compliance_percentage, notes, created_by_id, created_at, evaluation_items, deadline, completion_percentage, end_date) VALUES (65, 'RND-MGG6GMWJ', 'لعنوان', 'لعنوان', 'PATIENT_SAFETY', 'تنويم الباطنية نساء', '["\u0627\u0645\u062c\u0627\u062f \u0627\u0644\u0645\u0644\u062d\u0627\u0646", "\u0627\u0646\u0641\u0627\u0644 \u0627\u0644\u062f\u062d\u0648\u0645", "\u0646\u0627\u0635\u0631  \u0627\u0644\u0634\u0627\u0626\u0639", "\u0645\u062f\u064a\u0631 \u0645\u062d\u062f\u062b \u0627\u0644\u0646\u0638\u0627\u0645", 40, 39, 38]', '2025-10-07 10:00:00+03', 'SCHEDULED', 'high', 0, '', 30, '2025-10-07 09:27:59.788869+03', '[]', NULL, 0, '2025-10-14 10:00:00+03');
INSERT INTO public.rounds (id, round_code, title, description, round_type, department, assigned_to, scheduled_date, status, priority, compliance_percentage, notes, created_by_id, created_at, evaluation_items, deadline, completion_percentage, end_date) VALUES (70, 'RND-API-TEST-20251007113721', 'جولة اختبار API المحدث', 'جولة لاختبار API مع deadline و end_date', 'PATIENT_SAFETY', 'العناية المركزة', '["amjad"]', '2025-10-08 11:37:21.072287+03', 'SCHEDULED', 'medium', 0, 'اختبار API المحدث', 40, '2025-10-07 11:37:21.108996+03', '[]', '2025-10-11 11:37:21.072287+03', 0, '2025-10-11 11:37:21.072287+03');
INSERT INTO public.rounds (id, round_code, title, description, round_type, department, assigned_to, scheduled_date, status, priority, compliance_percentage, notes, created_by_id, created_at, evaluation_items, deadline, completion_percentage, end_date) VALUES (67, 'RND-MGGA30TJ', 'الجودة صالح', 'زيارة ', 'PATIENT_SAFETY', 'النساء والولادة', '["\u0646\u0627\u0635\u0631  \u0627\u0644\u0634\u0627\u0626\u0639", "\u0645\u062f\u064a\u0631 \u0645\u062d\u062f\u062b \u0627\u0644\u0646\u0638\u0627\u0645"]', '2025-10-06 10:00:00+03', 'COMPLETED', 'medium', 50, '', 1, '2025-10-07 11:09:08.684898+03', '[21, 20]', NULL, 100, NULL);


--
-- Name: rounds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rounds_id_seq', 71, true);


--
-- PostgreSQL database dump complete
--

\unrestrict guI4ay9APBdPSxmuQxM9upRHtgWajhsC3fbger0ATyJlEdrEeafbHqm8rmdViMz

