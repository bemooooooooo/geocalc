package handlers

import (
	"encoding/json"
	"errors"
	"geocalc/internal/auth"
	"geocalc/internal/calculator"
	"geocalc/internal/models"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db       *pgxpool.Pool
	tokenKey []byte
	tokenTTL time.Duration
}

func New(db *pgxpool.Pool, tokenKey []byte, tokenTTL time.Duration) *Handler {
	return &Handler{
		db:       db,
		tokenKey: tokenKey,
		tokenTTL: tokenTTL,
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, models.ErrorResponse{Error: msg})
}

func normalizeUsername(username string) string {
	return strings.ToLower(strings.TrimSpace(username))
}

func currentUser(r *http.Request) (auth.Claims, bool) {
	return auth.UserFromContext(r.Context())
}

func (h *Handler) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := auth.BearerToken(r)
		if token == "" {
			writeError(w, http.StatusUnauthorized, "требуется авторизация")
			return
		}

		claims, err := auth.ParseToken(h.tokenKey, token)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "сессия недействительна или истекла")
			return
		}

		next.ServeHTTP(w, r.WithContext(auth.WithUser(r.Context(), claims)))
	})
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "неверный формат JSON")
		return
	}

	username := normalizeUsername(req.Username)
	if len(username) < 3 {
		writeError(w, http.StatusBadRequest, "логин должен быть не короче 3 символов")
		return
	}
	if len(req.Password) < 6 {
		writeError(w, http.StatusBadRequest, "пароль должен быть не короче 6 символов")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		log.Printf("password_hash_error username=%s error=%v", username, err)
		writeError(w, http.StatusInternalServerError, "ошибка создания пользователя")
		return
	}

	var user models.User
	err = h.db.QueryRow(r.Context(),
		`INSERT INTO users (username, password_hash)
		 VALUES ($1, $2)
		 RETURNING id, username, created_at`,
		username, hash,
	).Scan(&user.ID, &user.Username, &user.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") {
			writeError(w, http.StatusConflict, "пользователь с таким логином уже существует")
			return
		}
		log.Printf("register_error username=%s error=%v", username, err)
		writeError(w, http.StatusInternalServerError, "ошибка создания пользователя")
		return
	}

	token, err := auth.GenerateToken(h.tokenKey, user.ID, user.Username, h.tokenTTL)
	if err != nil {
		log.Printf("token_generate_error username=%s error=%v", username, err)
		writeError(w, http.StatusInternalServerError, "ошибка создания сессии")
		return
	}

	log.Printf("auth_register user_id=%d username=%s", user.ID, user.Username)
	writeJSON(w, http.StatusCreated, models.AuthResponse{Token: token, User: user})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "неверный формат JSON")
		return
	}

	username := normalizeUsername(req.Username)
	var user models.User
	var passwordHash string
	err := h.db.QueryRow(r.Context(),
		`SELECT id, username, password_hash, created_at
		 FROM users
		 WHERE username = $1`,
		username,
	).Scan(&user.ID, &user.Username, &passwordHash, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		log.Printf("auth_login_failed username=%s", username)
		writeError(w, http.StatusUnauthorized, "неверный логин или пароль")
		return
	}
	if err != nil {
		log.Printf("login_error username=%s error=%v", username, err)
		writeError(w, http.StatusInternalServerError, "ошибка входа")
		return
	}
	if !auth.CheckPassword(passwordHash, req.Password) {
		log.Printf("auth_login_failed username=%s", username)
		writeError(w, http.StatusUnauthorized, "неверный логин или пароль")
		return
	}

	token, err := auth.GenerateToken(h.tokenKey, user.ID, user.Username, h.tokenTTL)
	if err != nil {
		log.Printf("token_generate_error username=%s error=%v", username, err)
		writeError(w, http.StatusInternalServerError, "ошибка создания сессии")
		return
	}

	log.Printf("auth_login user_id=%d username=%s", user.ID, user.Username)
	writeJSON(w, http.StatusOK, models.AuthResponse{Token: token, User: user})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := currentUser(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}

	var user models.User
	err := h.db.QueryRow(r.Context(),
		`SELECT id, username, created_at
		 FROM users
		 WHERE id = $1`,
		claims.UserID,
	).Scan(&user.ID, &user.Username, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusUnauthorized, "пользователь не найден")
		return
	}
	if err != nil {
		log.Printf("me_error user_id=%d error=%v", claims.UserID, err)
		writeError(w, http.StatusInternalServerError, "ошибка загрузки пользователя")
		return
	}

	writeJSON(w, http.StatusOK, user)
}

// GET /shapes
func (h *Handler) GetShapes(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(),
		`SELECT name, label_ru FROM shapes ORDER BY id`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ошибка БД")
		return
	}
	defer rows.Close()

	shapes := []models.Shape{}
	for rows.Next() {
		var s models.Shape
		if err := rows.Scan(&s.Name, &s.LabelRu); err != nil {
			writeError(w, http.StatusInternalServerError, "ошибка чтения")
			return
		}
		shapes = append(shapes, s)
	}
	writeJSON(w, http.StatusOK, shapes)
}

// POST /calculate
func (h *Handler) Calculate(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUser(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}

	var req models.CalculateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "неверный формат JSON")
		return
	}

	if req.Shape == "" {
		writeError(w, http.StatusBadRequest, "поле shape обязательно")
		return
	}

	results, err := calculator.Calculate(req.Shape, req.Params)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	paramsJSON, _ := json.Marshal(req.Params)
	resultsJSON, _ := json.Marshal(results)

	_, err = h.db.Exec(r.Context(),
		`INSERT INTO calculations (user_id, shape_name, params, results) VALUES ($1, $2, $3, $4)`,
		user.UserID, req.Shape, paramsJSON, resultsJSON,
	)
	if err != nil {
		log.Printf("calculate_save_error user_id=%d shape=%s error=%v", user.UserID, req.Shape, err)
		writeError(w, http.StatusInternalServerError, "ошибка сохранения в БД")
		return
	}

	log.Printf("calculate user_id=%d shape=%s", user.UserID, req.Shape)

	writeJSON(w, http.StatusOK, models.CalculateResponse{
		Shape:   req.Shape,
		Params:  req.Params,
		Results: results,
	})
}

// GET /history
func (h *Handler) GetHistory(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUser(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}

	rows, err := h.db.Query(r.Context(),
		`SELECT id, user_id, shape_name, params, results, created_at
		 FROM calculations
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT 50`,
		user.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ошибка БД")
		return
	}
	defer rows.Close()

	history := []models.Calculation{}
	for rows.Next() {
		var c models.Calculation
		var paramsRaw, resultsRaw []byte
		if err := rows.Scan(&c.ID, &c.UserID, &c.ShapeName, &paramsRaw, &resultsRaw, &c.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "ошибка чтения")
			return
		}
		json.Unmarshal(paramsRaw, &c.Params)
		json.Unmarshal(resultsRaw, &c.Results)
		history = append(history, c)
	}
	writeJSON(w, http.StatusOK, history)
}

// DELETE /history/{id}
func (h *Handler) DeleteHistory(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUser(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "неверный id")
		return
	}

	tag, err := h.db.Exec(r.Context(),
		`DELETE FROM calculations WHERE id = $1 AND user_id = $2`, id, user.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ошибка БД")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "запись не найдена")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
