package models

import "time"

// POST /calculate
type CalculateRequest struct {
	Shape  string             `json:"shape"`
	Params map[string]float64 `json:"params"`
}

// POST /calculate
type CalculateResponse struct {
	Shape   string             `json:"shape"`
	Params  map[string]float64 `json:"params"`
	Results map[string]float64 `json:"results"`
}

// запись из БД
type Calculation struct {
	ID        int                `json:"id"`
	UserID    int                `json:"user_id,omitempty"`
	ShapeName string             `json:"shape_name"`
	Params    map[string]float64 `json:"params"`
	Results   map[string]float64 `json:"results"`
	CreatedAt time.Time          `json:"created_at"`
}

// справочник фигур
type Shape struct {
	Name    string `json:"name"`
	LabelRu string `json:"label_ru"`
}

// стандартная ошибка API
type ErrorResponse struct {
	Error string `json:"error"`
}

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}

type AuthRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
