document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggleEditBtn");
    let isEditMode = false;
    const pageKey = "astropulse_page_" + (window.location.pathname.split("/").pop() || "index.html");

    // 1. Восстановление сохранённых правок в существующих блоках
    const savedBlocks = JSON.parse(localStorage.getItem(pageKey + "_blocks") || "{}");
    document.querySelectorAll(".editable-block").forEach((block, index) => {
        const id = block.getAttribute("data-block-id") || "block_" + index;
        block.setAttribute("data-block-id", id);
        if (savedBlocks[id]) {
            block.innerHTML = savedBlocks[id];
        }
    });

    // 2. Восстановление пользовательских заметок/блоков, добавленных на страницу
    const mainContainer = document.querySelector("main.container") || document.querySelector("main");
    const customContainer = document.createElement("div");
    customContainer.id = "customUserBlocks";
    customContainer.style.marginTop = "25px";
    if (mainContainer) {
        mainContainer.appendChild(customContainer);
    }

    function renderCustomBlocks() {
        const customList = JSON.parse(localStorage.getItem(pageKey + "_custom") || "[]");
        customContainer.innerHTML = "";
        customList.forEach((item, idx) => {
            const card = document.createElement("div");
            card.className = "card custom-user-card";
            card.style.borderLeft = "4px solid #ff7a00";
            card.style.position = "relative";
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span class="badge" style="background:#ff7a00; color:#fff;">Авторская заметка</span>
                    <button class="delete-custom-btn" data-idx="${idx}" style="display:${isEditMode ? 'inline-block' : 'none'}; background:#ef4444; color:#fff; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem;">✕ Удалить</button>
                </div>
                <h3 class="custom-editable" data-idx="${idx}" data-field="title" style="color:#0066ff; margin-bottom:10px;">${item.title}</h3>
                <div class="custom-editable" data-idx="${idx}" data-field="body">${item.body}</div>
            `;
            customContainer.appendChild(card);
        });

        // Привязка удаления и редактирования к новым карточкам
        document.querySelectorAll(".delete-custom-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const i = parseInt(e.target.getAttribute("data-idx"));
                const list = JSON.parse(localStorage.getItem(pageKey + "_custom") || "[]");
                list.splice(i, 1);
                localStorage.setItem(pageKey + "_custom", JSON.stringify(list));
                renderCustomBlocks();
                if (isEditMode) enableEditing();
            });
        });
    }

    renderCustomBlocks();

    // 3. Создание плавающей панели инструментов редактора
    const toolbar = document.createElement("div");
    toolbar.id = "astroEditorToolbar";
    toolbar.style.cssText = `
        display: none;
        background: #0f172a;
        color: #ffffff;
        padding: 12px 20px;
        border-bottom: 3px solid #ff7a00;
        position: sticky;
        top: 70px;
        z-index: 99;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    toolbar.innerHTML = `
        <div class="container" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px;">
            <span style="font-size:0.95rem;">✦ <strong>Режим редактора активен:</strong> кликните на любой подсвеченный текст, чтобы изменить его.</span>
            <div style="display:flex; gap:10px;">
                <button id="addNewBlockBtn" style="background:#ff7a00; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;">+ Добавить блок / заметку</button>
                <button id="resetPageBtn" style="background:#334155; color:#fff; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-size:0.85rem;">Сбросить правки</button>
            </div>
        </div>
    `;
    const header = document.querySelector("header");
    if (header) {
        header.insertAdjacentElement("afterend", toolbar);
    }

    // 4. Включение и выключение режима редактирования
    function enableEditing() {
        document.querySelectorAll(".editable-block").forEach(block => {
            block.setAttribute("contenteditable", "true");
            block.style.outline = "2px dashed #ff7a00";
            block.style.outlineOffset = "4px";
            block.style.cursor = "text";
        });
        document.querySelectorAll(".custom-editable").forEach(el => {
            el.setAttribute("contenteditable", "true");
            el.style.outline = "1px dashed #00b4ff";
            el.style.padding = "4px";
        });
        document.querySelectorAll(".delete-custom-btn").forEach(btn => btn.style.display = "inline-block");
    }

    function disableEditing() {
        // Сохраняем изменения стандартных блоков
        const updatedBlocks = {};
        document.querySelectorAll(".editable-block").forEach(block => {
            block.removeAttribute("contenteditable");
            block.style.outline = "none";
            block.style.cursor = "default";
            const id = block.getAttribute("data-block-id");
            updatedBlocks[id] = block.innerHTML;
        });
        localStorage.setItem(pageKey + "_blocks", JSON.stringify(updatedBlocks));

        // Сохраняем изменения пользовательских блоков
        const customList = JSON.parse(localStorage.getItem(pageKey + "_custom") || "[]");
        document.querySelectorAll(".custom-editable").forEach(el => {
            const idx = parseInt(el.getAttribute("data-idx"));
            const field = el.getAttribute("data-field");
            if (customList[idx]) {
                customList[idx][field] = el.innerHTML;
            }
            el.removeAttribute("contenteditable");
            el.style.outline = "none";
        });
        localStorage.setItem(pageKey + "_custom", JSON.stringify(customList));
        document.querySelectorAll(".delete-custom-btn").forEach(btn => btn.style.display = "none");
    }

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            isEditMode = !isEditMode;
            if (isEditMode) {
                toggleBtn.textContent = "✓ Сохранить и выйти";
                toggleBtn.style.background = "#10b981";
                toolbar.style.display = "block";
                enableEditing();
            } else {
                toggleBtn.textContent = "✎ Режим редактора";
                toggleBtn.style.background = "";
                toolbar.style.display = "none";
                disableEditing();
            }
        });
    }

    // 5. Добавление нового блока по кнопке
    document.getElementById("addNewBlockBtn").addEventListener("click", () => {
        const title = prompt("Введите заголовок нового блока или заметки:", "Мой астрологический прогноз");
        if (!title) return;
        const body = prompt("Введите текст заметки:", "Здесь можно записать личные наблюдения о транзитах, снах или лунных днях.");
        if (!body) return;

        const customList = JSON.parse(localStorage.getItem(pageKey + "_custom") || "[]");
        customList.push({ title, body: `<p>${body}</p>` });
        localStorage.setItem(pageKey + "_custom", JSON.stringify(customList));

        renderCustomBlocks();
        if (isEditMode) enableEditing();
    });

    // 6. Сброс всех правок на текущей странице
    document.getElementById("resetPageBtn").addEventListener("click", () => {
        if (confirm("Вернуть исходный текст всех блоков на этой странице и удалить добавленные заметки?")) {
            localStorage.removeItem(pageKey + "_blocks");
            localStorage.removeItem(pageKey + "_custom");
            location.reload();
        }
    });
});
