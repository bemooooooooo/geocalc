import { useState, useEffect, useRef } from "react";
import {
  calculate,
  fetchHistory,
  deleteHistory,
  login,
  register,
  fetchCurrentUser,
  clearToken,
  getToken,
} from "./api/api";
import { SHAPE_CONFIG } from "./shapeConfig";
import "./App.css";

const SHAPES = Object.keys(SHAPE_CONFIG);

function round(v) {
  return typeof v === "number" ? +v.toFixed(4) : v;
}

// Экспорт фигур
function ExportShape(svgRef, shapeName, params, format="png") {
  const svgEl = svgRef.current;
  if(!svgEl){
    throw new Error("Ошибка выбора фигуры");
  }
  const size = 400;

  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", size);
  clone.setAttribute("hight", size);
  clone.setAttribute("viewBox", "0 0 200 200");

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width",  "200");
  bg.setAttribute("height", "200");
  bg.setAttribute("fill",   "#13151a");
  clone.insertBefore(bg, clone.firstChild);

  const paramStr = Object.entries(params)
    .filter(([, v]) => v !== "" && v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join("   ");
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x",           "100");
  label.setAttribute("y",           "194");
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("fill",        "#6b7280");
  label.setAttribute("font-size",   "9");
  label.setAttribute("font-family", "monospace");
  label.textContent = `${SHAPE_CONFIG[shapeName]?.label || shapeName}  |  ${paramStr}`;
  clone.appendChild(label);

  const svgStr  = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });

  if (format === "svg") {
    const url = URL.createObjectURL(svgBlob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = `${shapeName}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas  = document.createElement("canvas");
    canvas.width  = size;
    canvas.height = size;
    const ctx     = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      const a   = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = `${shapeName}.png`;
      a.click();
    }, "image/png");
  };
  img.src = url;
}

export default function App() {
  const [selectedShape, setSelectedShape] = useState("circle");
  const [params, setParams] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("calc"); // "calc" | "history"
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("geocalc_theme") || "dark");

  const svgRef = useRef(null);
  const config = SHAPE_CONFIG[selectedShape];
  const SvgComponent = config.SvgComponent;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("geocalc_theme", theme);
  }, [theme]);

  useEffect(() => {
    let ignore = false;

    async function restoreSession() {
      if (!getToken()) {
        setAuthReady(true);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (!ignore) {
          setUser(currentUser);
          await loadHistory();
        }
      } catch (e) {
        clearToken();
        if (!ignore) {
          setHistory([]);
        }
      } finally {
        if (!ignore) {
          setAuthReady(true);
        }
      }
    }

    restoreSession();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setParams({});
    setResults(null);
    setError("");
  }, [selectedShape]);

  async function loadHistory() {
    try {
      const data = await fetchHistory();
      setHistory(data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCalculate() {
    setError("");
    setResults(null);

    if (!user) {
      setError("Войдите в аккаунт, чтобы сохранять расчеты");
      return;
    }

    const filledParams = {};
    for (const p of config.params) {
      const val = parseFloat(params[p.key]);
      if (isNaN(val)) {
        setError(`Заполните поле «${p.label}»`);
        return;
      }
      filledParams[p.key] = val;
    }

    setLoading(true);
    try {
      const data = await calculate(selectedShape, filledParams);
      setResults(data.results);
      await loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    await deleteHistory(id);
    await loadHistory();
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const nextUser = authMode === "login"
        ? await login(authForm.username, authForm.password)
        : await register(authForm.username, authForm.password);
      setUser(nextUser);
      setAuthForm({ username: "", password: "" });
      await loadHistory();
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setHistory([]);
    setResults(null);
    setError("");
    setActiveTab("calc");
  }

  function switchAuthMode(mode) {
    setAuthMode(mode);
    setAuthError("");
  }

  const numericParams = Object.fromEntries(
    config.params.map((p) => [p.key, parseFloat(params[p.key]) || 0])
  );

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">◆</span>
            <span className="logo-text">GeoCalc</span>
          </div>
          <div className="header-actions">
            {user && (
              <nav className="tabs">
                <button
                  className={`tab ${activeTab === "calc" ? "active" : ""}`}
                  onClick={() => setActiveTab("calc")}
                >
                  Калькулятор
                </button>
                <button
                  className={`tab ${activeTab === "history" ? "active" : ""}`}
                  onClick={() => { setActiveTab("history"); loadHistory(); }}
                >
                  История
                  {history.length > 0 && (
                    <span className="badge">{history.length}</span>
                  )}
                </button>
              </nav>
            )}

            <div className="theme-switch" aria-label="Тема оформления">
              <button
                type="button"
                className={theme === "light" ? "active" : ""}
                onClick={() => setTheme("light")}
                title="Светлая тема"
              >
                Светлая
              </button>
              <button
                type="button"
                className={theme === "dark" ? "active" : ""}
                onClick={() => setTheme("dark")}
                title="Темная тема"
              >
                Темная
              </button>
            </div>

            {user && (
              <div className="user-menu">
                <span className="user-name">{user.username}</span>
                <button className="btn-ghost" type="button" onClick={handleLogout}>
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        {!authReady ? (
          <section className="auth-panel">
            <p className="empty">Загрузка сессии...</p>
          </section>
        ) : !user ? (
          <section className="auth-panel">
            <div className="auth-copy">
              <h1>GeoCalc</h1>
              <p>Войдите, чтобы считать фигуры и хранить личную историю вычислений.</p>
            </div>
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="auth-tabs">
                <button
                  type="button"
                  className={authMode === "login" ? "active" : ""}
                  onClick={() => switchAuthMode("login")}
                >
                  Вход
                </button>
                <button
                  type="button"
                  className={authMode === "register" ? "active" : ""}
                  onClick={() => switchAuthMode("register")}
                >
                  Регистрация
                </button>
              </div>

              <label className="input-group">
                <span className="input-label">Логин</span>
                <input
                  type="text"
                  minLength="3"
                  autoComplete="username"
                  value={authForm.username}
                  onChange={(e) =>
                    setAuthForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                />
              </label>
              <label className="input-group">
                <span className="input-label">Пароль</span>
                <input
                  type="password"
                  minLength="6"
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
              </label>

              {authError && <p className="error">{authError}</p>}

              <button className="btn-calc" type="submit" disabled={authLoading}>
                {authLoading
                  ? "Проверяю..."
                  : authMode === "login"
                    ? "Войти"
                    : "Создать аккаунт"}
              </button>
            </form>
          </section>
        ) : activeTab === "calc" ? (
          <div className="calc-layout">
            {/* Выбор фигуры */}
            <section className="shape-picker">
              <h2 className="section-title">Фигура</h2>
              <div className="shape-grid">
                {SHAPES.map((s) => (
                  <button
                    key={s}
                    className={`shape-btn ${selectedShape === s ? "active" : ""}`}
                    onClick={() => setSelectedShape(s)}
                  >
                    <ShapeIcon shape={s} />
                    <span>{SHAPE_CONFIG[s].label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Центральная колонка: SVG + ввод */}
            <section className="calc-panel">
              <div className="svg-preview-wrap">
                <div className="svg-preview">
                  <SvgComponent {...numericParams} svgRef={svgRef} />
                </div>
                <div className="export-btns">
                  <button
                    className="btn-export"
                    onClick={() => ExportShape(svgRef, selectedShape, params, "png")}
                  >
                    ↓ PNG
                  </button>
                  <button
                    className="btn-export"
                    onClick={() => ExportShape(svgRef, selectedShape, params, "svg")}
                  >
                    ↓ SVG
                  </button>
                </div>
              </div>
 
              {/* Поля ввода */}
              <div className="inputs">
                <h2 className="section-title">{config.label}</h2>
                {config.params.map((p) => (
                  <label key={p.key} className="input-group">
                    <span className="input-label">{p.label}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={params[p.key] ?? ""}
                      onChange={(e) =>
                        setParams((prev) => ({ ...prev, [p.key]: e.target.value }))
                      }
                    />
                  </label>
                ))}

                {error && <p className="error">{error}</p>}

                <button
                  className="btn-calc"
                  onClick={handleCalculate}
                  disabled={loading}
                >
                  {loading ? "Считаю..." : "Вычислить"}
                </button>
              </div>

              {/* Результаты */}
              {results && (
                <div className="results">
                  <h3 className="results-title">Результаты</h3>
                  <div className="results-grid">
                    {Object.entries(results).map(([key, value]) => (
                      <div key={key} className="result-item">
                        <span className="result-label">
                          {config.resultLabels?.[key] || key}
                        </span>
                        <span className="result-value">{round(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* История */
          <section className="history-panel">
            <h2 className="section-title">История вычислений</h2>
            {history.length === 0 ? (
              <p className="empty">История пуста</p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-meta">
                      <span className="history-shape">
                        {SHAPE_CONFIG[item.shape_name]?.label || item.shape_name}
                      </span>
                      <span className="history-date">
                        {new Date(item.created_at).toLocaleString("ru-RU")}
                      </span>
                    </div>
                    <div className="history-params">
                      {Object.entries(item.params).map(([k, v]) => (
                        <span key={k} className="param-chip">{k}: {round(v)}</span>
                      ))}
                    </div>
                    <div className="history-results">
                      {Object.entries(item.results).map(([k, v]) => (
                        <span key={k} className="result-chip">
                          {SHAPE_CONFIG[item.shape_name]?.resultLabels?.[k] || k}: <b>{round(v)}</b>
                        </span>
                      ))}
                    </div>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function ShapeIcon({ shape }) {
  const icons = {
    circle: <circle cx="12" cy="12" r="8" />,
    rectangle: <rect x="3" y="6" width="18" height="12" />,
    triangle: <polygon points="12,3 21,19 3,19" />,
    trapezoid: <polygon points="6,19 18,19 15,7 9,7" />,
    rhombus: <polygon points="12,3 21,12 12,21 3,12" />,
    ellipse: <ellipse cx="12" cy="12" rx="9" ry="5" />,
    parallelogram: <polygon points="6,19 18,19 16,7 4,7" />,
  };
  return (
    <svg className="shape-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5">
      {icons[shape]}
    </svg>
  );
}
