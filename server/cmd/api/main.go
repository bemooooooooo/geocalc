package main

import (
	"context"
	"fmt"
	"geocalc/internal/db"
	"geocalc/internal/handlers"
	"geocalc/internal/logging"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Загружаем .env если есть
	_ = godotenv.Load()

	ctx := context.Background()

	// Подключение к БД
	pool, err := db.New(ctx)
	if err != nil {
		log.Fatalf("не удалось подключиться к БД: %v", err)
	}
	defer pool.Close()

	authSecret := getenv("AUTH_SECRET", "geocalc-dev-secret-change-me")
	if authSecret == "geocalc-dev-secret-change-me" {
		log.Println("AUTH_SECRET не задан, используется dev-секрет")
	}

	h := handlers.New(pool, []byte(authSecret), 24*time.Hour)

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(logging.Middleware)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	}))

	// Роуты
	r.Get("/shapes", h.GetShapes)
	r.Post("/auth/register", h.Register)
	r.Post("/auth/login", h.Login)

	r.Group(func(r chi.Router) {
		r.Use(h.RequireAuth)
		r.Get("/auth/me", h.Me)
		r.Post("/calculate", h.Calculate)
		r.Get("/history", h.GetHistory)
		r.Delete("/history/{id}", h.DeleteHistory)
	})

	port := getenv("PORT", "8080")
	fmt.Printf("Сервер запущен на http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
