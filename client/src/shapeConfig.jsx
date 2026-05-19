const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const CircleSvg = ({ radius = 0, svgRef }) => {
  const r = clamp((radius || 60) * 1.2, 10, 88);
  return (
    <svg ref={svgRef} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="100" y1="100" x2={100 + r} y2="100"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="4" />
      <text x={100 + r / 2} y="94" fontSize="12" fill="currentColor"
        textAnchor="middle" fontFamily="monospace">r={radius || '?'}</text>
      <circle cx="100" cy="100" r="3" fill="currentColor" />
    </svg>
  );
};

const RectangleSvg = ({ width = 0, height = 0, svgRef }) => {
  const maxW = 150, maxH = 130;
  const ratio = width && height ? Math.min(maxW / width, maxH / height) : 1;
  const w = clamp((width  || 80) * ratio, 20, maxW);
  const h = clamp((height || 50) * ratio, 20, maxH);
  const x = (200 - w) / 2;
  const y = (200 - h) / 2;
  return (
    <svg ref={svgRef} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1={x} y1={y} x2={x + w} y2={y + h}
        stroke="currentColor" strokeWidth="1" strokeDasharray="5" opacity="0.5" />
      <text x="100" y={y - 7} fontSize="11" fill="currentColor"
        textAnchor="middle" fontFamily="monospace">a={width || '?'}</text>
      <text x={x - 6} y={y + h / 2} fontSize="11" fill="currentColor"
        textAnchor="end" fontFamily="monospace">b={height || '?'}</text>
    </svg>
  );
};

const TriangleSvg = ({ a = 0, b = 0, c = 0, svgRef }) => {
  const valid = a > 0 && b > 0 && c > 0 && (a + b > c) && (a + c > b) && (b + c > a);

  let x1, y1, x2, y2, x3, y3;
  if (valid) {
    const cosB  = Math.min(1, Math.max(-1, (a * a + c * c - b * b) / (2 * a * c)));
    const sinB  = Math.sqrt(1 - cosB * cosB);
    const scale = Math.min(150 / a, 130 / (c * sinB + 0.001));
    const bx = a * scale, cx2 = c * cosB * scale, cy2 = c * sinB * scale;
    const ox = (200 - bx) / 2, oy = (200 - cy2) / 2 + cy2;
    x1 = ox + cx2; y1 = oy - cy2;
    x2 = ox;       y2 = oy;
    x3 = ox + bx;  y3 = oy;
  } else {
    x1 = 100; y1 = 28;
    x2 = 22;  y2 = 168;
    x3 = 178; y3 = 168;
  }

  const midAB = [(x1 + x2) / 2, (y1 + y2) / 2];
  const midAC = [(x1 + x3) / 2, (y1 + y3) / 2];
  const midBC = [(x2 + x3) / 2, (y2 + y3) / 2];

  return (
    <svg ref={svgRef} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <polygon
        points={`${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`}
        fill="none" stroke="currentColor" strokeWidth="2"
      />
      <text x={midBC[0]} y={midBC[1] + 14} fontSize="11" fill="currentColor"
        textAnchor="middle" fontFamily="monospace">a={a || '?'}</text>
      <text x={midAB[0] - 8} y={midAB[1]} fontSize="11" fill="currentColor"
        textAnchor="end" fontFamily="monospace">b={b || '?'}</text>
      <text x={midAC[0] + 8} y={midAC[1]} fontSize="11" fill="currentColor"
        textAnchor="start" fontFamily="monospace">c={c || '?'}</text>
    </svg>
  );
};

const TrapezoidSvg = ({ a = 0, b = 0, h = 0, svgRef }) => {
  const useA = a || 120, useB = b || 70, useH = h || 60;
  const scale = Math.min(160 / Math.max(useA, useB), 110 / useH);
  const sw = useA * scale, tw = useB * scale, sh = useH * scale;
  const bx = (200 - sw) / 2, by = (200 - sh) / 2;
  const tx = (200 - tw) / 2;
  return (
    <svg ref={svgRef} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <polygon
        points={`${tx},${by} ${tx + tw},${by} ${bx + sw},${by + sh} ${bx},${by + sh}`}
        fill="none" stroke="currentColor" strokeWidth="2"
      />
      <line x1="100" y1={by} x2="100" y2={by + sh}
        stroke="currentColor" strokeWidth="1" strokeDasharray="4" opacity="0.6" />
      <text x="100" y={by + sh + 14} fontSize="11" fill="currentColor"
        textAnchor="middle" fontFamily="monospace">a={a || '?'}</text>
      <text x="100" y={by - 6} fontSize="11" fill="currentColor"
        textAnchor="middle" fontFamily="monospace">b={b || '?'}</text>
      <text x="108" y={by + sh / 2 + 4} fontSize="11" fill="currentColor"
        fontFamily="monospace">h={h || '?'}</text>
    </svg>
  );
};

const RhombusSvg = ({ d1 = 0, d2 = 0, svgRef }) => {
  const useD1 = d1 || 120, useD2 = d2 || 80;
  const scale = Math.min(160 / useD1, 150 / useD2);
  const hw = (useD1 * scale) / 2, hh = (useD2 * scale) / 2;
  return (
    <svg ref={svgRef} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <polygon
        points={`100,${100 - hh} ${100 + hw},100 100,${100 + hh} ${100 - hw},100`}
        fill="none" stroke="currentColor" strokeWidth="2"
      />
      <line x1={100 - hw} y1="100" x2={100 + hw} y2="100"
        stroke="currentColor" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
      <line x1="100" y1={100 - hh} x2="100" y2={100 + hh}
        stroke="currentColor" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
      <text x="100" y={100 + 12} fontSize="11" fill="currentColor"
        textAnchor="middle" fontFamily="monospace">d₁={d1 || '?'}</text>
      <text x={100 + hw / 2 + 4} y="96" fontSize="11" fill="currentColor"
        fontFamily="monospace">d₂={d2 || '?'}</text>
      <circle cx="100" cy="100" r="3" fill="currentColor" />
    </svg>
  );
};

const EllipseSvg = ({ a = 0, b = 0, svgRef }) => {
  const useA = a || 80, useB = b || 45;
  const scale = Math.min(90 / useA, 90 / useB);
  const rx = clamp(useA * scale, 8, 90);
  const ry = clamp(useB * scale, 8, 90);
  return (
    <svg ref={svgRef} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <ellipse cx="100" cy="100" rx={rx} ry={ry} fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="100" y1="100" x2={100 + rx} y2="100"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="4" />
      <line x1="100" y1="100" x2="100" y2={100 - ry}
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="4" />
      <text x={100 + rx / 2} y="93" fontSize="11" fill="currentColor"
        textAnchor="middle" fontFamily="monospace">a={a || '?'}</text>
      <text x="106" y={100 - ry / 2} fontSize="11" fill="currentColor"
        fontFamily="monospace">b={b || '?'}</text>
      <circle cx="100" cy="100" r="3" fill="currentColor" />
    </svg>
  );
};

const ParallelogramSvg = ({ a = 0, b = 0, h = 0, svgRef }) => {
  const useA = a || 110, useH = h || 70;
  const scale = Math.min(140 / useA, 110 / useH);
  const sw = useA * scale, sh = useH * scale;
  const offset = 30;
  const bx = (200 - sw - offset) / 2;
  const by = (200 - sh) / 2;
  return (
    <svg ref={svgRef} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <polygon
        points={`${bx + offset},${by} ${bx + offset + sw},${by} ${bx + sw},${by + sh} ${bx},${by + sh}`}
        fill="none" stroke="currentColor" strokeWidth="2"
      />
      <line x1={bx + offset} y1={by} x2={bx + offset} y2={by + sh}
        stroke="currentColor" strokeWidth="1" strokeDasharray="4" opacity="0.6" />
      <text x={bx + offset + sw / 2} y={by + sh + 14} fontSize="11" fill="currentColor"
        textAnchor="middle" fontFamily="monospace">a={a || '?'}</text>
      <text x={bx + offset + sw + 6} y={by + sh / 2 + 4} fontSize="11" fill="currentColor"
        fontFamily="monospace">b={b || '?'}</text>
      <text x={bx + offset + 6} y={by + sh / 2 + 4} fontSize="11" fill="currentColor"
        fontFamily="monospace">h={h || '?'}</text>
    </svg>
  );
};

export const SHAPE_CONFIG = {
  circle: {
    label: "Круг",
    SvgComponent: CircleSvg,
    params: [{ key: "radius", label: "Радиус (r)" }],
    resultLabels: { area: "Площадь", perimeter: "Длина окружности", diameter: "Диаметр" },
  },
  rectangle: {
    label: "Прямоугольник",
    SvgComponent: RectangleSvg,
    params: [
      { key: "width",  label: "Ширина (a)" },
      { key: "height", label: "Высота (b)" },
    ],
    resultLabels: { area: "Площадь", perimeter: "Периметр", diagonal: "Диагональ", inscribed_circle: "Радиус вписанной окружности" },
  },
  triangle: {
    label: "Треугольник",
    SvgComponent: TriangleSvg,
    params: [
      { key: "a", label: "Сторона a (нижняя)" },
      { key: "b", label: "Сторона b (левая)"  },
      { key: "c", label: "Сторона c (правая)" },
    ],
    resultLabels: { area: "Площадь", perimeter: "Периметр", inscribed_r: "Радиус вписанной окружности", circumscribed_r: "Радиус описанной окружности" },
  },
  trapezoid: {
    label: "Трапеция",
    SvgComponent: TrapezoidSvg,
    params: [
      { key: "a", label: "Основание a (нижнее)"  },
      { key: "b", label: "Основание b (верхнее)" },
      { key: "h", label: "Высота h" },
    ],
    resultLabels: { area: "Площадь", midline: "Средняя линия", height: "Высота" },
  },
  rhombus: {
    label: "Ромб",
    SvgComponent: RhombusSvg,
    params: [
      { key: "d1", label: "Диагональ d₁ (горизонтальная)" },
      { key: "d2", label: "Диагональ d₂ (вертикальная)"   },
    ],
    resultLabels: { area: "Площадь", perimeter: "Периметр", side: "Длина стороны" },
  },
  ellipse: {
    label: "Эллипс",
    SvgComponent: EllipseSvg,
    params: [
      { key: "a", label: "Полуось a (горизонтальная)" },
      { key: "b", label: "Полуось b (вертикальная)"   },
    ],
    resultLabels: { area: "Площадь", perimeter: "Периметр (приближение)" },
  },
  parallelogram: {
    label: "Параллелограмм",
    SvgComponent: ParallelogramSvg,
    params: [
      { key: "a", label: "Основание a" },
      { key: "b", label: "Боковая сторона b" },
      { key: "h", label: "Высота h" },
    ],
    resultLabels: { area: "Площадь", perimeter: "Периметр", height: "Высота" },
  },
};