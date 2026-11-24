```javascript
document.addEventListener("DOMContentLoaded", () => {
    renderHeaderAndFooter();
    initEditMode();
    setupCityInputs();
});

// 1. Единая шапка с полным меню всех разделов и подвал
function renderHeaderAndFooter() {
    const headerEl = document.getElementById("site-header");
    const footerEl = document.getElementById("site-footer");

    if (headerEl) {
        const natalLinks = AstroDB.natalSubsections.map(s => `<li><a href="natal.html#${s.id}">${s.title}</a></li>`).join("");
        const predLinks = AstroDB.predictiveSubsections.map(s => `<li><a href="predictive.html#${s.id}">${s.title}</a></li>`).join("");
        const lunarLinks = AstroDB.lunarSubsections.map(s => `<li><a href="lunar.html#${s.id}">${s.title}</a></li>`).join("");

        headerEl.innerHTML = `
        <div class="container">
            <div class="top-bar">
                <div class="brand">
                    <a href="index.html" class="brand-title">Астро <span>Пульс</span></a>
                    <span class="brand-subtitle">Астро Пульс — твой астрологический сценарий</span>
                </div>
                <div class="cms-controls">
                    <button id="toggleEditBtn" class="btn btn-outline" style="padding:7px 14px; font-size:0.85rem;">✎ Редактор сайта</button>
                    <button id="addBlockBtn" class="btn btn-orange" style="padding:7px 14px; font-size:0.85rem; display:none;">+ Добавить блок</button>
                </div>
            </div>
        </div>
        <nav>
            <div class="container">
                <ul class="main-menu">
                    <li class="menu-item"><a href="index.html">Главная</a></li>
                    <li class="menu-item">
                        <a href="natal.html">Натальная карта ▾</a>
                        <ul class="dropdown">${natalLinks}</ul>
                    </li>
                    <li class="menu-item">
                        <a href="predictive.html">Пред
сказательная астрология ▾
${predLinks}
• 
${lunarLinks}
• 
Камни по знакам
• 
Частые вопросы
• 
Обсуждения
• 
Обратная связь
`;
}
if (footerEl) {
footerEl.innerHTML = `



Астро Пульс
Астро Пульс — твой астрологический сценарий. Профессиональные онлайн-калькуляторы и разборы для женщин от 20 до 75 лет.
Натальная карта
Онлайн расчёт натальной карты
Карта релокации
Деньги и богатство в карте
Асцендент и Управитель


Прогнозы и Луна
Транзиты и Соляр
Синастрия (совместимость)
Лунный календарь стрижек
Луна без курса


Сообщество
Камни-талисманы
Частые вопросы (FAQ)
Форум и обсуждения
Задать вопрос астрологу



© 2026 «Астро Пульс» — твой астрологический сценарий. Все права защищены.

`;
}
}
// 2. Встроенный редактор контента (CMS) с сохранением в localStorage
function initEditMode() {
const toggleBtn = document.getElementById("toggleEditBtn");
const addBtn = document.getElementById("addBlockBtn");
const pageKey = "astro_pulse_edits_" + window.location.pathname;
const blocksKey = "astro_pulse_blocks_" + window.location.pathname;
// Восстановление отредактированных текстов
const savedEdits = JSON.parse(localStorage.getItem(pageKey) || "{}");
document.querySelectorAll("[data-editable]").forEach((el, idx) => {
const id = el.getAttribute("data-editable") || ed_${idx};
if (savedEdits[id]) el.innerHTML = savedEdits[id];
});
// Восстановление добавленных пользователем блоков
const customContainer = document.getElementById("custom-blocks-zone");
if (customContainer) {
const savedBlocks = JSON.parse(localStorage.getItem(blocksKey) || "[]");
savedBlocks.forEach(b => renderCustomBlock(customContainer, b.title, b.text));
}
if (!toggleBtn) return;
let isEditing = false;
toggleBtn.addEventListener("click", () => {
isEditing = !isEditing;
document.body.classList.toggle("edit-mode", isEditing);
toggleBtn.textContent = isEditing ? "✓ Сохранить изменения" : "✎ Редактор сайта";
addBtn.style.display = isEditing ? "inline-block" : "none";
document.querySelectorAll("[data-editable]").forEach((el, idx) => {
el.contentEditable = isEditing;
if (!isEditing) {
const id = el.getAttribute("data-editable") || ed_${idx};
savedEdits[id] = el.innerHTML;
}
});
if (!isEditing) {
localStorage.setItem(pageKey, JSON.stringify(savedEdits));
}
});
if (addBtn) {
addBtn.addEventListener("click", () => {
const title = prompt("Введите заголовок нового блока:");
if (!title) return;
const text = prompt("Введите текст или астрологическую заметку для блока:");
if (!text) return;
const target = document.getElementById("custom-blocks-zone") || document.querySelector("main .container");
renderCustomBlock(target, title, text);
const savedBlocks = JSON.parse(localStorage.getItem(blocksKey) || "[]");
savedBlocks.push({ title, text });
localStorage.setItem(blocksKey, JSON.stringify(savedBlocks));
});
}
}
function renderCustomBlock(container, title, text) {
const div = document.createElement("div");
div.className = "card custom-block-item";
div.innerHTML = <h3 style="color:var(--blue); margin-bottom:10px;">${title}</h3><p data-editable>${text}</p>;
container.appendChild(div);
}
// 3. Поиск по всем городам мира (Локальная база + онлайн поиск Nominatim OpenStreetMap)
function setupCityInputs() {
document.querySelectorAll(".city-search-input").forEach(input => {
const wrapper = input.closest(".city-wrapper");
const list = wrapper.querySelector(".city-suggestions");
input.addEventListener("input", async () => {
const q = input.value.trim().toLowerCase();
if (q.length < 2) {
list.style.display = "none";
return;
}
// Сначала ищем в быстром справочнике
let matches = AstroDB.cities.filter(c => c.name.toLowerCase().includes(q));
// Если в локальной базе мало совпадений — запрашиваем любой город мира через OpenStreetMap API
if (matches.length < 3) {
try {
const resp = await fetch(https://openstreetmap.org{encodeURIComponent(q)}&limit=5&accept-language=ru);
const data = await resp.json();
data.forEach(item => {
matches.push({
name: item.display_name.split(",").slice(0, 3).join(","),
lat: parseFloat(item.lat),
lon: parseFloat(item.lon)
});
});
} catch (e) { /* работаем на локальной базе при отсутствии сети */ }
}
list.innerHTML = "";
matches.slice(0, 8).forEach(city => {
const div = document.createElement("div");
div.textContent = ${city.name} (${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°);
div.addEventListener("click", () => {
input.value = city.name;
input.dataset.lat = city.lat;
input.dataset.lon = city.lon;
list.style.display = "none";
});
list.appendChild(div);
});
list.style.display = matches.length ? "block" : "none";
});
});
}