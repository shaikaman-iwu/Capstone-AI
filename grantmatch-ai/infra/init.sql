CREATE TABLE IF NOT EXISTS deployment_notes (
  id SERIAL PRIMARY KEY,
  note TEXT NOT NULL
);

INSERT INTO deployment_notes (note)
VALUES ('GrantMatch AI local PostgreSQL bootstrap initialized.')
ON CONFLICT DO NOTHING;
