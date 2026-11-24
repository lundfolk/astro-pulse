const AstroEngine = {
    signs: [
        { name: "Овен", symbol: "♈", element: "Огонь", ruler: "Марс" },
        { name: "Телец", symbol: "♉", element: "Земля", ruler: "Венера" },
        { name: "Близнецы", symbol: "♊", element: "Воздух", ruler: "Меркурий" },
        { name: "Рак", symbol: "♋", element: "Вода", ruler: "Луна" },
        { name: "Лев", symbol: "♌", element: "Огонь", ruler: "Солнце" },
        { name: "Дева", symbol: "♍", element: "Земля", ruler: "Меркурий" },
        { name: "Весы", symbol: "♎", element: "Воздух", ruler: "Венера" },
        { name: "Скорпион", symbol: "♏", element: "Вода", ruler: "Плутон" },
        { name: "Стрелец", symbol: "♐", element: "Огонь", ruler: "Юпитер" },
        { name: "Козерог", symbol: "♑", element: "Земля", ruler: "Сатурн" },
        { name: "Водолей", symbol: "♒", element: "Воздух", ruler: "Уран" },
        { name: "Рыбы", symbol: "♓", element: "Вода", ruler: "Нептун" }
    ],

    // Юлианская дата
    toJulianDay(dateObj) {
        return (dateObj.getTime() / 86400000) + 2440587.5;
    },

    // Расчёт эклиптических долгот основных точек (0..360)
    calculatePositions(dateStr, timeStr, lat = 55.75, lon = 37.61) {
        const dt = new Date(`${dateStr}T${timeStr || '12:00'}:00Z`);
        const jd = this.toJulianDay(dt);
        const d = jd - 2451545.0; // Дни от эпохи J2000.0

        const norm = (deg) => ((deg % 360) + 360) % 360;

        // Средние долготы с поправками на эксцентриситет
        const sun = norm(280.460 + 0.9856474 * d + 1.915 * Math.sin((357.528 + 0.9856003 * d) * Math.PI / 180));
        const moon = norm(218.316 + 13.176396 * d + 6.289 * Math.sin((134.963 + 13.064993 * d) * Math.PI / 180));
        const mercury = norm(sun + 22 * Math.sin((174.795 + 4.09233445 * d) * Math.PI / 180));
        const venus = norm(sun + 44 * Math.sin((50.416 + 1.60213034 * d) * Math.PI / 180));
        const mars = norm(355.433 + 0.52402068 * d + 10.691 * Math.sin((19.373 + 0.52402068 * d) * Math.PI / 180));
        const jupiter = norm(34.351 + 0.08309121 * d + 5.555 * Math.sin((20.020 + 0.08308529 * d) * Math.PI / 180));
        const saturn = norm(50.077 + 0.03345965 * d + 6.358 * Math.sin((317.020 + 0.03344414 * d) * Math.PI / 180));
        const uranus = norm(314.055 + 0.01173129 * d);
        const neptune = norm(304.348 + 0.00598103 * d);
        const pluto = norm(238.958 + 0.00396878 * d);

        // Чёрная Луна (Средний апогей Луны - Лилит, период 8.85 лет)
        const lilith = norm(83.353 + 0.11140353 * d);
        // Белая Луна (Селена, период 7 лет)
        const selena = norm(212.0 + 0.140801 * d);
        // Северный Узел (Раху)
        const northNode = norm(125.0445 - 0.05295377 * d);

        // Звёздное время и Асцендент / Середина Неба (MC)
        const gmst = norm(280.46061837 + 360.98564736629 * d);
        const lst = norm(gmst + parseFloat(lon));
        const eps = 23.4393 * Math.PI / 180;
        const lstRad = lst * Math.PI / 180;
        const latRad = parseFloat(lat) * Math.PI / 180;

        const mc = norm(Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(eps)) * 180 / Math.PI);
        const asc = norm(Math.atan2(Math.cos(lstRad), -(Math.sin(lstRad) * Math.cos(eps) + Math.tan(latRad) * Math.sin(eps))) * 180 / Math.PI);

        // Парс Фортуны (Дневное/Ночное рождение)
        const isDay = norm(sun - asc) > 180;
        const parsFortunae = isDay ? norm(asc + moon - sun) : norm(asc + sun - moon);

        const formatPos = (deg) => {
            const signIdx = Math.floor(deg / 30);
            const degreeInSign = Math.floor(deg % 30);
            const minutes = Math.floor((deg % 1) * 60);
            const house = Math.floor(norm(deg - asc) / 30) + 1;
            return {
                deg,
                signIdx,
                sign: this.signs[signIdx],
                formatted: `${degreeInSign}°${minutes.toString().padStart(2, '0')}' ${this.signs[signIdx].symbol} ${this.signs[signIdx].name}`,
                house
            };
        };

        return {
            sun: formatPos(sun),
            moon: formatPos(moon),
            mercury: formatPos(mercury),
            venus: formatPos(venus),
            mars: formatPos(mars),
            jupiter: formatPos(jupiter),
            saturn: formatPos(saturn),
            uranus: formatPos(uranus),
            neptune: formatPos(neptune),
            pluto: formatPos(pluto),
            lilith: formatPos(lilith),
            selena: formatPos(selena),
            northNode: formatPos(northNode),
            asc: formatPos(asc),
            mc: formatPos(mc),
            parsFortunae: formatPos(parsFortunae)
        };
    },

    // Отрисовка SVG Натальной карты
    renderNatalSVG(positions) {
        const size = 350;
        const cx = size / 2;
        const cy = size / 2;
        const rOuter = 160;
        const rZodiac = 130;
        const rInner = 75;

        let svg = `<svg viewBox="0 0 ${size} ${size}" width="100%" style="background:#07090e; border-radius:50%; border:3px solid #f97316;">`;

        // Сектора знаков зодиака
        for (let i = 0; i < 12; i++) {
            const startAngle = (i * 30 - positions.asc.deg + 180) * Math.PI / 180;
            const endAngle = ((i + 1) * 30 - positions.asc.deg + 180) * Math.PI / 180;
            const midAngle = (startAngle + endAngle) / 2;

            const x1 = cx + rOuter * Math.cos(startAngle);
            const y1 = cy - rOuter * Math.sin(startAngle);
            const x2 = cx + rInner * Math.cos(startAngle);
            const y2 = cy - rInner * Math.sin(startAngle);

            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1e293b" stroke-width="1"/>`;

            const tx = cx + ((rOuter + rZodiac) / 2) * Math.cos(midAngle);
            const ty = cy - ((rOuter + rZodiac) / 2) * Math.sin(midAngle);
            const color = i % 2 === 0 ? "#38bdf8" : "#f97316";
            svg += `<text x="${tx}" y="${ty}" fill="${color}" font-size="14" text-anchor="middle" dominant-baseline="central">${this.signs[i].symbol}</text>`;
        }

        svg += `<circle cx="${cx}" cy="${cy}" r="${rZodiac}" fill="none" stroke="#1d4ed8" stroke-width="1.5"/>`;
        svg += `<circle cx="${cx}" cy="${cy}" r="${rInner}" fill="#0d1526" stroke="#38bdf8" stroke-width="1.5"/>`;

        // Ось ASC-DSC и MC-IC
        svg += `<line x1="${cx - rOuter}" y1="${cy}" x2="${cx + rOuter}" y2="${cy}" stroke="#f97316" stroke-width="2"/>`;
        svg += `<text x="14" y="${cy - 6}" fill="#f97316" font-size="11" font-weight="bold">ASC</text>`;

        // Планеты на круге
        const planetSymbols = [
            { key: 'sun', sym: '☉', col: '#f97316' },
            { key: 'moon', sym: '☽', col: '#ffffff' },
            { key: 'mercury', sym: '☿', col: '#38bdf8' },
            { key: 'venus', sym: '♀', col: '#f472b6' },
            { key: 'mars', sym: '♂', col: '#ef4444' },
            { key: 'jupiter', sym: '♃', col: '#a855f7' },
            { key: 'saturn', sym: '♄', col: '#94a3b8' },
            { key: 'lilith', sym: '⚸', col: '#ec4899' }
        ];

        planetSymbols.forEach((p, idx) => {
            const deg = positions[p.key].deg;
            const angle = (deg - positions.asc.deg + 180) * Math.PI / 180;
            const radius = rZodiac - 18 - (idx % 3) * 12;
            const px = cx + radius * Math.cos(angle);
            const py = cy - radius * Math.sin(angle);
            svg += `<text x="${px}" y="${py}" fill="${p.col}" font-size="15" font-weight="bold" text-anchor="middle" dominant-baseline="central">${p.sym}</text>`;
        });

        svg += `</svg>`;
        return svg;
    },

    // Расчёт Лунного дня, Фазы Луны и рекомендаций
    calculateLunarInfo(dateStr) {
        const pos = this.calculatePositions(dateStr, "12:00");
        const diff = ((pos.moon.deg - pos.sun.deg) + 360) % 360;
        const lunarDay = Math.floor(diff / 12) + 1;
        const illumination = Math.round(((1 - Math.cos(diff * Math.PI / 180)) / 2) * 100);

        let phase = "";
        let phaseAdvice = "";
        if (diff < 45) {
            phase = "Новолуние и начало роста";
            phaseAdvice = "Время закладки намерений, мягкого планирования и бережного отношения к ресурсам тела.";
        } else if (diff < 135) {
            phase = "Первая четверть (Растущая Луна)";
            phaseAdvice = "Период активного набора энергии. Идеально для косметологических процедур на питание, стрижки для быстрого роста волос и старта проектов.";
        } else if (diff < 225) {
            phase = "Полнолуние и пик энергии";
            phaseAdvice = "Максимальная эмоциональная чувствительность. Отличный момент для фиксации финансовых результатов, но стоит избегать хирургических вмешательств и импульсивных споров.";
        } else {
            phase = "Убывающая Луна";
            phaseAdvice = "Время очищения, детокса, завершения старых обязательств, лечения зубов и стрижки для укрепления корней.";
        }

        // Расчёт периодов Луны без курса (VOC) для выбранной даты
        const degLeftInSign = 30 - (pos.moon.deg % 30);
        const hoursToSignChange = (degLeftInSign / 0.55).toFixed(1);

        return {
            lunarDay,
            illumination,
            phase,
            phaseAdvice,
            moonSign: pos.moon.sign,
            hoursToSignChange,
            haircutGood: ![9, 15, 23, 29].includes(lunarDay),
            dentalGood: diff > 190 && diff < 345 && ![9, 15, 29].includes(lunarDay)
        };
    },

    // Расчёт планетарного часа
    calculatePlanetaryHour(dateStr, timeStr) {
        const dt = new Date(`${dateStr}T${timeStr || '12:00'}:00`);
        const dayOfWeek = dt.getDay(); // 0 - Вс, 1 - Пн...
        const chaldeanOrder = ["Сатурн", "Юпитер", "Марс", "Солнце", "Венера", "Меркурий", "Луна"];
const dayRulers = ["Солнце", "Луна", "Марс", "Меркурий", "Юпитер", "Венера", "Сатурн"];
const firstRuler = dayRulers[dayOfWeek];
const startIdx = chaldeanOrder.indexOf(firstRuler);
const hour = dt.getHours();
const currentRuler = chaldeanOrder[(startIdx + hour) % 7];
const hourMeanings = {
"Солнце": "Час личного авторитета, переговоров с руководством, публичных выступлений и презентации талантов.",
"Луна": "Час заботы о семье, домашнего уюта, интуитивных решений и душевного общения с близкими.",
"Марс": "Час решительных действий, спорта, преодоления препятствий. Важно контролировать резкость в словах.",
"Меркурий": "Идеальный час для писем, звонков, обучения, оформления документов, поездок и интеллектуальной работы.",
"Юпитер": "Самый удачный час для финансовых вложений, юридических вопросов, масштабирования и обращения к покровителям.",
"Венера": "Час красоты, свиданий, покупок для гардероба и дома, творчества и гармонизации отношений.",
"Сатурн": "Час дисциплины, наведения порядка, долгосрочного планирования и работы с недвижимостью."
};
return { dayRuler: firstRuler, currentRuler, meaning: hourMeanings[currentRuler] };
}
};