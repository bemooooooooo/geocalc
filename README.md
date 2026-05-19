# GeoCalc — Калькулятор геометрических фигур

Клиент-серверное приложение для вычисления характеристик геометрических фигур.

## Стек
- **Frontend**: React 18 + Vite
- **Backend**: Go 1.22 + chi router
- **БД**: PostgreSQL 16
- **Деплой**: Docker + docker-compose

---

## Структура проекта

```
geocalc/
├── docker-compose.yml
├── server/                     # Go backend
│   ├── cmd/api/main.go         # Точка входа, роутер
│   ├── internal/
│   │   ├── db/db.go            # Подключение к PostgreSQL
│   │   ├── models/models.go    # Структуры данных
│   │   ├── calculator/         # Формулы для всех фигур
│   │   └── handlers/           # HTTP обработчики
│   ├── migrations/
│   │   └── 001_init.sql        # Схема БД
│   ├── Dockerfile
│   ├── go.mod
│   └── .env.example
└── client/                     # React frontend
    ├── src/
    │   ├── App.jsx             # Главный компонент
    │   ├── App.css             # Стили
    │   ├── shapeConfig.js      # Конфиг фигур + SVG
    │   └── api/api.js          # HTTP клиент
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    └── package.json
```

---

## API эндпоинты

| Метод    | URL             | Описание                          |
|----------|-----------------|-----------------------------------|
| `GET`    | `/shapes`       | Список всех фигур из БД           |
| `POST`   | `/auth/register`| Регистрация пользователя          |
| `POST`   | `/auth/login`   | Вход и получение токена           |
| `GET`    | `/auth/me`      | Текущий пользователь              |
| `POST`   | `/calculate`    | Вычислить характеристики фигуры   |
| `GET`    | `/history`      | История вычислений (последние 50) |
| `DELETE` | `/history/{id}` | Удалить запись из истории         |

Для `/auth/me`, `/calculate`, `/history` и `/history/{id}` нужен заголовок
`Authorization: Bearer <token>`.

### POST /calculate — пример запроса
```json
{
  "shape": "circle",
  "params": { "radius": 5 }
}
```

### POST /calculate — пример ответа
```json
{
  "shape": "circle",
  "params": { "radius": 5 },
  "results": {
    "area": 78.5398,
    "perimeter": 31.4159,
    "diameter": 10
  }
}
```

---

## Поддерживаемые фигуры

| Фигура           | Параметры              | Результаты                                        |
|------------------|------------------------|---------------------------------------------------|
| `circle`         | radius                 | area, perimeter, diameter                         |
| `rectangle`      | width, height          | area, perimeter, diagonal, inscribed_circle       |
| `triangle`       | a, b, c                | area, perimeter, inscribed_r, circumscribed_r     |
| `trapezoid`      | a, b, h                | area, midline, height                             |
| `rhombus`        | d1, d2                 | area, perimeter, side                             |
| `ellipse`        | a, b                   | area, perimeter                                   |
| `parallelogram`  | a, b, h                | area, perimeter, height                           |

---

## Запуск через Docker

```bash
# Клонируй репозиторий и запусти одной командой
docker-compose up --build

# Приложение будет доступно:
# Фронтенд:  http://localhost:3000
# API:       http://localhost:8080
# БД:        localhost:5432
```

## Запуск локально (без Docker)

### БД
```bash
psql -U postgres -c "CREATE DATABASE geocalc;"
psql -U postgres -d geocalc -f server/migrations/001_init.sql
```

### Backend
```bash
cd server
cp .env.example .env
# Укажите свой AUTH_SECRET в .env перед запуском
go mod tidy
go run ./cmd/api
```

### Frontend
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

---

## Схема БД

```sql
-- Справочник фигур
shapes (id, name, label_ru)

-- Пользователи
users (id, username, password_hash, created_at)

-- История вычислений
calculations (id, user_id, shape_name, params JSONB, results JSONB, created_at)
```
