-- Hot-path indexes for authentication, account history and Control refreshes.
-- Apply once to the production D1 database after the base tables exist.
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_created_at ON users(role,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_status_role_created_at ON users(status,role,created_at ASC);

CREATE INDEX IF NOT EXISTS idx_submissions_reference ON submissions(reference);
CREATE INDEX IF NOT EXISTS idx_submissions_user_status_submitted ON submissions(user_id,status,submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_created ON subscriptions(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_audience_created ON notifications(audience,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_audience_lower_created ON notifications(lower(audience),created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_sections_type_position ON legal_sections(type,position);
