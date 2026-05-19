package db

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func New(ctx context.Context) (*pgxpool.Pool, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getenv("DB_HOST", "localhost"),
		getenv("DB_PORT", "5432"),
		getenv("DB_USER", "postgres"),
		getenv("DB_PASSWORD", "postgres"),
		getenv("DB_NAME", "geocalc"),
	)

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("pgxpool.New: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("db ping: %w", err)
	}

	if err := ensureSchema(ctx, pool); err != nil {
		return nil, fmt.Errorf("ensure schema: %w", err)
	}

	return pool, nil
}

func ensureSchema(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `
CREATE TABLE IF NOT EXISTS shapes (
	id SERIAL PRIMARY KEY,
	name VARCHAR(50) NOT NULL UNIQUE,
	label_ru VARCHAR(100) NOT NULL
);

INSERT INTO shapes (name, label_ru) VALUES
	('circle', 'Круг'),
	('rectangle', 'Прямоугольник'),
	('triangle', 'Треугольник'),
	('trapezoid', 'Трапеция'),
	('rhombus', 'Ромб'),
	('ellipse', 'Эллипс'),
	('parallelogram', 'Параллелограмм')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	username VARCHAR(50) NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculations (
	id SERIAL PRIMARY KEY,
	shape_name VARCHAR(50) NOT NULL REFERENCES shapes(name),
	params JSONB NOT NULL,
	results JSONB NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calculations
	ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_calculations_shape ON calculations(shape_name);
CREATE INDEX IF NOT EXISTS idx_calculations_created ON calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_user_created ON calculations(user_id, created_at DESC);
`)
	return err
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
