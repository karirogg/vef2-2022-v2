DROP ROLE IF EXISTS "vef2-kari";
CREATE USER "vef2-kari" ENCRYPTED PASSWORD '123';
GRANT ALL PRIVILEGES ON DATABASE eventdb TO "vef2-kari";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "vef2-kari";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "vef2-kari";
