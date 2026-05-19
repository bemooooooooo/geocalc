CREATE TABLE IF NOT EXISTS shapes (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    label_ru VARCHAR(100) NOT NULL
);

INSERT INTO shapes (name, label_ru) VALUES
    ('circle',        'Круг'),
    ('rectangle',     'Прямоугольник'),
    ('triangle',      'Треугольник'),
    ('trapezoid',     'Трапеция'),
    ('rhombus',       'Ромб'),
    ('ellipse',       'Эллипс'),
    ('parallelogram', 'Параллелограмм')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculations (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER      REFERENCES users(id) ON DELETE CASCADE,
    shape_name VARCHAR(50)  NOT NULL REFERENCES shapes(name),
    params     JSONB        NOT NULL,
    results    JSONB        NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calculations_shape ON calculations(shape_name);
CREATE INDEX IF NOT EXISTS idx_calculations_created ON calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_user_created ON calculations(user_id, created_at DESC);
