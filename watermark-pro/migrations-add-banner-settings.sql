ALTER TABLE settings ADD COLUMN auth_banners TEXT NOT NULL DEFAULT '[]';
ALTER TABLE settings ADD COLUMN overview_banners TEXT NOT NULL DEFAULT '[]';
