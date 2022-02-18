CREATE TABLE IF NOT EXISTS public.events (
  id serial primary key,
  name varchar(64) not null,
  slug varchar(64) not null,
  description text,
  created timestamp with time zone not null default current_timestamp,
  updated timestamp with time zone not null default current_timestamp
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id serial primary key,
  name varchar(64) not null,
  comment text,
  event SERIAL NOT NULL,
  CONSTRAINT event FOREIGN KEY (event)
    REFERENCES public.events (id),
  created timestamp with time zone not null default current_timestamp
);

CREATE TABLE IF NOT EXISTS users (
  id serial primary key,
  username character varying(64) NOT NULL unique,
  password character varying(256) NOT NULL
);

INSERT INTO users (username, password) VALUES ('admin', '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii');
