package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidToken = errors.New("invalid token")

type Claims struct {
	UserID    int    `json:"user_id"`
	Username  string `json:"username"`
	ExpiresAt int64  `json:"exp"`
}

type contextKey string

const userContextKey contextKey = "auth_user"

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func GenerateToken(secret []byte, userID int, username string, ttl time.Duration) (string, error) {
	claims := Claims{
		UserID:    userID,
		Username:  username,
		ExpiresAt: time.Now().Add(ttl).Unix(),
	}
	payloadBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	payload := base64.RawURLEncoding.EncodeToString(payloadBytes)
	return payload + "." + sign(payload, secret), nil
}

func ParseToken(secret []byte, token string) (Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return Claims{}, ErrInvalidToken
	}

	expected := sign(parts[0], secret)
	if !hmac.Equal([]byte(parts[1]), []byte(expected)) {
		return Claims{}, ErrInvalidToken
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return Claims{}, ErrInvalidToken
	}

	var claims Claims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return Claims{}, ErrInvalidToken
	}
	if claims.UserID <= 0 || claims.Username == "" || time.Now().Unix() > claims.ExpiresAt {
		return Claims{}, ErrInvalidToken
	}

	return claims, nil
}

func BearerToken(r *http.Request) string {
	header := strings.TrimSpace(r.Header.Get("Authorization"))
	if header == "" {
		return ""
	}

	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

func WithUser(ctx context.Context, claims Claims) context.Context {
	return context.WithValue(ctx, userContextKey, claims)
}

func UserFromContext(ctx context.Context) (Claims, bool) {
	claims, ok := ctx.Value(userContextKey).(Claims)
	return claims, ok
}

func sign(payload string, secret []byte) string {
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
