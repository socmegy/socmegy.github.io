CREATE TABLE IF NOT EXISTS notification_reads (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
 read_at TEXT NOT NULL,
 PRIMARY KEY(user_id, notification_id)
);
