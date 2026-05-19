package calculator

import (
	"fmt"
	"math"
)

func Calculate(shape string, params map[string]float64) (map[string]float64, error) {
	switch shape {
	case "circle":
		return calcCircle(params)
	case "rectangle":
		return calcRectangle(params)
	case "triangle":
		return calcTriangle(params)
	case "trapezoid":
		return calcTrapezoid(params)
	case "rhombus":
		return calcRhombus(params)
	case "ellipse":
		return calcEllipse(params)
	case "parallelogram":
		return calcParallelogram(params)
	default:
		return nil, fmt.Errorf("неизвестная фигура: %s", shape)
	}
}

// Круг
// params: radius
func calcCircle(p map[string]float64) (map[string]float64, error) {
	r, ok := p["radius"]
	if !ok || r <= 0 {
		return nil, fmt.Errorf("параметр radius должен быть > 0")
	}
	return map[string]float64{
		"area":      math.Pi * r * r,
		"perimeter": 2 * math.Pi * r,
		"diameter":  2 * r,
	}, nil
}

// Прямоугольник
// params: width, height
func calcRectangle(p map[string]float64) (map[string]float64, error) {
	w, ok1 := p["width"]
	h, ok2 := p["height"]
	if !ok1 || !ok2 || w <= 0 || h <= 0 {
		return nil, fmt.Errorf("параметры width и height должны быть > 0")
	}
	diagonal := math.Sqrt(w*w + h*h)
	return map[string]float64{
		"area":             w * h,
		"perimeter":        2 * (w + h),
		"diagonal":         diagonal,
		"inscribed_circle": math.Min(w, h) / 2,
	}, nil
}

// Треугольник
// params: a, b, c
func calcTriangle(p map[string]float64) (map[string]float64, error) {
	a, ok1 := p["a"]
	b, ok2 := p["b"]
	c, ok3 := p["c"]
	if !ok1 || !ok2 || !ok3 || a <= 0 || b <= 0 || c <= 0 {
		return nil, fmt.Errorf("стороны a, b, c должны быть > 0")
	}
	// Неравенство треугольника
	if a+b <= c || a+c <= b || b+c <= a {
		return nil, fmt.Errorf("такой треугольник не существует (нарушено неравенство треугольника)")
	}
	s := (a + b + c) / 2
	area := math.Sqrt(s * (s - a) * (s - b) * (s - c)) // формула Герона
	inRadius := area / s                               // радиус вписанной окружности
	circumRadius := (a * b * c) / (4 * area)           // радиус описанной окружности
	return map[string]float64{
		"area":            area,
		"perimeter":       a + b + c,
		"inscribed_r":     inRadius,
		"circumscribed_r": circumRadius,
	}, nil
}

// Трапеция
// params: a (основание 1), b (основание 2), h (высота)
func calcTrapezoid(p map[string]float64) (map[string]float64, error) {
	a, ok1 := p["a"]
	b, ok2 := p["b"]
	h, ok3 := p["h"]
	if !ok1 || !ok2 || !ok3 || a <= 0 || b <= 0 || h <= 0 {
		return nil, fmt.Errorf("параметры a, b, h должны быть > 0")
	}
	area := (a + b) / 2 * h
	midline := (a + b) / 2
	return map[string]float64{
		"area":    area,
		"midline": midline,
		"height":  h,
	}, nil
}

// Ромб
// params: d1 (диагональ 1), d2 (диагональ 2)
func calcRhombus(p map[string]float64) (map[string]float64, error) {
	d1, ok1 := p["d1"]
	d2, ok2 := p["d2"]
	if !ok1 || !ok2 || d1 <= 0 || d2 <= 0 {
		return nil, fmt.Errorf("диагонали d1 и d2 должны быть > 0")
	}
	side := math.Sqrt((d1/2)*(d1/2) + (d2/2)*(d2/2))
	area := d1 * d2 / 2
	return map[string]float64{
		"area":      area,
		"perimeter": 4 * side,
		"side":      side,
	}, nil
}

// Эллипс
// params: a (полуось a), b (полуось b)
func calcEllipse(p map[string]float64) (map[string]float64, error) {
	a, ok1 := p["a"]
	b, ok2 := p["b"]
	if !ok1 || !ok2 || a <= 0 || b <= 0 {
		return nil, fmt.Errorf("полуоси a и b должны быть > 0")
	}
	area := math.Pi * a * b
	// Приближение Рамануджана для периметра
	h := math.Pow(a-b, 2) / math.Pow(a+b, 2)
	perimeter := math.Pi * (a + b) * (1 + (3*h)/(10+math.Sqrt(4-3*h)))
	return map[string]float64{
		"area":      area,
		"perimeter": perimeter,
	}, nil
}

// Параллелограмм
// params: a (основание), b (сторона), h (высота)
func calcParallelogram(p map[string]float64) (map[string]float64, error) {
	a, ok1 := p["a"]
	b, ok2 := p["b"]
	h, ok3 := p["h"]
	if !ok1 || !ok2 || !ok3 || a <= 0 || b <= 0 || h <= 0 {
		return nil, fmt.Errorf("параметры a, b, h должны быть > 0")
	}
	return map[string]float64{
		"area":      a * h,
		"perimeter": 2 * (a + b),
		"height":    h,
	}, nil
}
