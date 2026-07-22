--
-- PostgreSQL database dump
--

\restrict sJV1GnOt7kIFjWxortvg8lPhRVkNWaII7YU9uiys6nAkN4BcDhsDq8zuJhvm9gY

-- Dumped from database version 18.4 (2773af8)
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: super_admins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.super_admins (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) FROM stdin;
5d20e444-f03a-4bd7-9b1d-e79da458f89b	bodipro@bodigroup.mn	$2a$10$G0m.yEaGZ33r/8hG5.P8ReVREpD55b/yK.a0G8H7mF9tXz8rD.K7y	Bodi	Properties	super_admin	t	2026-07-03 03:20:36.316574+00	2026-07-03 03:20:36.316574+00
\.


--
-- PostgreSQL database dump complete
--

\unrestrict sJV1GnOt7kIFjWxortvg8lPhRVkNWaII7YU9uiys6nAkN4BcDhsDq8zuJhvm9gY

