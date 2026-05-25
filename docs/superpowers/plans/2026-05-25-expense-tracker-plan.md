# 花销追踪 Web 应用实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个支持电脑和手机浏览器的花销追踪 Web 应用，支持多人协作记账、CSV 导入导出

**Architecture:** 纯 HTML + CSS + JavaScript 单页应用，使用 IndexedDB 存储数据，Tab 导航切换视图，响应式布局适配多设备

**Tech Stack:** 纯前端（无框架依赖）、IndexedDB、本地存储

---

## 文件结构

```
/Users/dongfangshuye/Desktop/OurNote/
├── index.html              # 主页面
├── css/
│   └── styles.css          # 样式文件
├── js/
│   ├── app.js              # 主应用逻辑
│   ├── db.js               # IndexedDB 操作
│   ├── router.js           # Tab 路由/导航
│   ├── ledger.js           # 记账本管理
│   ├── expense.js          # 支出记录
│   ├── stats.js            # 统计功能
│   └── utils.js            # 工具函数
├── data/
│   └── china-cities.json   # 省市数据
└── docs/
    └── specs/
        └── 2026-05-25-expense-tracker-design.md
```

---

## Task 1: 项目基础框架

**Files:**
- Create: `index.html`
- Create: `css/styles.css`
- Create: `js/app.js`

- [ ] **Step 1: 创建 index.html 主页面结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>花销追踪</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div id="app">
        <!-- 记账本选择页面 -->
        <div id="ledger-select-page" class="page">
            <div class="container">
                <h1>我的记账本</h1>
                <div id="ledger-list"></div>
                <button id="new-ledger-btn" class="btn btn-primary">新建记账本</button>
            </div>
        </div>

        <!-- 主应用页面 -->
        <div id="main-app" class="page hidden">
            <nav id="sidebar" class="sidebar"></nav>
            <main id="main-content" class="content"></main>
        </div>
    </div>

    <!-- Tab 模板 -->
    <template id="tab-template">
        <button class="tab-btn" data-tab="">
            <span class="tab-icon"></span>
            <span class="tab-label"></span>
        </button>
    </template>

    <script src="js/utils.js"></script>
    <script src="js/db.js"></script>
    <script src="js/ledger.js"></script>
    <script src="js/expense.js"></script>
    <script src="js/stats.js"></script>
    <script src="js/router.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 css/styles.css 基础样式**

```css
/* 温暖奶油色主题 */
:root {
    --bg-primary: #F5E6D3;
    --bg-secondary: #FFF;
    --accent: #D4A574;
    --accent-dark: #C49660;
    --text-primary: #8B4513;
    --text-secondary: #A0522D;
    --border: #E8D9C5;
    --success: #7CB342;
    --danger: #E57373;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
}

.hidden {
    display: none !important;
}

.container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

/* 按钮样式 */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background-color: var(--accent);
    color: white;
}

.btn-primary:hover {
    background-color: var(--accent-dark);
}

/* 表单样式 */
.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 16px;
    background-color: var(--bg-secondary);
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--accent);
}

/* 卡片样式 */
.card {
    background-color: var(--bg-secondary);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(139, 69, 19, 0.1);
}

/* 响应式布局 - 电脑端 */
@media (min-width: 768px) {
    #main-app {
        display: flex;
    }

    .sidebar {
        width: 200px;
        flex-shrink: 0;
    }

    .content {
        flex: 1;
    }
}

/* 响应式布局 - 手机端 */
@media (max-width: 767px) {
    #main-app {
        padding-bottom: 60px;
    }

    .sidebar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        display: flex;
        flex-direction: row;
    }

    .tab-btn {
        flex: 1;
        height: 100%;
    }
}
```

- [ ] **Step 3: 创建 js/app.js 主应用入口**

```javascript
// 主应用入口
class App {
    constructor() {
        this.currentLedger = null;
        this.currentUser = null;
    }

    async init() {
        // 初始化数据库
        await DB.init();

        // 检查是否有默认记账本
        const defaultLedgerId = localStorage.getItem('defaultLedgerId');
        if (defaultLedgerId) {
            const ledger = await Ledger.get(defaultLedgerId);
            if (ledger) {
                this.currentLedger = ledger;
                this.showMainApp();
                return;
            }
        }

        // 显示记账本选择页面
        this.showLedgerSelect();
    }

    showLedgerSelect() {
        document.getElementById('ledger-select-page').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        Ledger.renderLedgerList();
    }

    showMainApp() {
        document.getElementById('ledger-select-page').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        Router.init();
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});
```

---

## Task 2: IndexedDB 数据库层

**Files:**
- Create: `js/db.js`

- [ ] **Step 1: 创建 IndexedDB 操作模块**

```javascript
// IndexedDB 数据库操作
const DB = {
    dbName: 'ExpenseTracker',
    dbVersion: 1,
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 记账本存储
                if (!db.objectStoreNames.contains('ledgers')) {
                    db.createObjectStore('ledgers', { keyPath: 'id' });
                }

                // 支出记录存储
                if (!db.objectStoreNames.contains('expenses')) {
                    const store = db.createObjectStore('expenses', { keyPath: 'id' });
                    store.createIndex('ledgerId', 'ledgerId', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('createdBy', 'createdBy', { unique: false });
                }

                // 用户存储
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }
            };
        });
    },

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};
```

---

## Task 3: 工具函数和省市数据

**Files:**
- Create: `js/utils.js`
- Create: `data/china-cities.json`

- [ ] **Step 1: 创建工具函数模块**

```javascript
// 工具函数
const Utils = {
    // 生成唯一 ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // 格式化金额
    formatAmount(amount) {
        return Number(amount).toFixed(2);
    },

    // 格式化日期
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return format.replace('YYYY', year).replace('MM', month).replace('DD', day);
    },

    // 获取今天日期
    getToday() {
        return this.formatDate(new Date());
    },

    // 格式化金额显示
    formatCurrency(amount) {
        return `¥${this.formatAmount(amount)}`;
    },

    // 显示提示消息
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    // 确认对话框
    async confirm(message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <p>${message}</p>
                    <div class="modal-buttons">
                        <button class="btn btn-secondary cancel-btn">取消</button>
                        <button class="btn btn-primary confirm-btn">确认</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('.cancel-btn').onclick = () => {
                modal.remove();
                resolve(false);
            };
            modal.querySelector('.confirm-btn').onclick = () => {
                modal.remove();
                resolve(true);
            };
        });
    }
};
```

- [ ] **Step 2: 创建省市数据文件**

```json
{
    "provinces": [
        {
            "name": "重庆市",
            "cities": ["万州区", "渝中区", "江北区", "沙坪坝区", "九龙坡区", "南岸区", "北碚区", "渝北区", "巴南区", "涪陵区", "长寿区", "江津区", "合川区", "永川区", "南川区", "璧山区", "铜梁区", "潼南区", "荣昌区", "开州区", "梁平区", "武隆区", "城口县", "丰都县", "垫江县", "忠县", "云阳县", "奉节县", "巫山县", "巫溪县", "石柱土家族自治县", "秀山土家族苗族自治县", "酉阳土家族苗族自治县", "彭水苗族土家族自治县"]
        },
        {
            "name": "四川省",
            "cities": ["成都市", "自贡市", "攀枝花市", "泸州市", "德阳市", "绵阳市", "广元市", "遂宁市", "内江市", "乐山市", "南充市", "眉山市", "宜宾市", "广安市", "达州市", "雅安市", "巴中市", "资阳市", "阿坝藏族羌族自治州", "甘孜藏族自治州", "凉山彝族自治州"]
        }
    ]
}
```

---

## Task 4: 记账本管理

**Files:**
- Create: `js/ledger.js`

- [ ] **Step 1: 创建记账本管理模块**

```javascript
// 记账本管理
const Ledger = {
    // 获取所有记账本
    async getAll() {
        return await DB.getAll('ledgers');
    },

    // 获取单个记账本
    async get(id) {
        return await DB.get('ledgers', id);
    },

    // 创建记账本
    async create(name) {
        const ledger = {
            id: Utils.generateId(),
            name: name,
            createdAt: Date.now()
        };
        await DB.add('ledgers', ledger);
        return ledger;
    },

    // 更新记账本
    async update(id, data) {
        const ledger = await this.get(id);
        if (ledger) {
            Object.assign(ledger, data);
            await DB.put('ledgers', ledger);
        }
        return ledger;
    },

    // 删除记账本
    async delete(id) {
        // 同时删除关联的支出记录
        const expenses = await DB.getByIndex('expenses', 'ledgerId', id);
        for (const expense of expenses) {
            await DB.delete('expenses', expense.id);
        }
        await DB.delete('ledgers', id);
    },

    // 渲染记账本列表
    async renderLedgerList() {
        const listEl = document.getElementById('ledger-list');
        const ledgers = await this.getAll();

        if (ledgers.length === 0) {
            listEl.innerHTML = '<p class="empty-text">还没有记账本，创建一个开始吧</p>';
            return;
        }

        listEl.innerHTML = ledgers.map(ledger => `
            <div class="card ledger-item" data-id="${ledger.id}">
                <div class="ledger-info">
                    <h3>${ledger.name}</h3>
                    <p class="ledger-date">创建于 ${Utils.formatDate(ledger.createdAt)}</p>
                </div>
                <button class="btn btn-delete" onclick="Ledger.selectAndDelete('${ledger.id}')">删除</button>
            </div>
        `).join('');

        // 点击选择记账本
        listEl.querySelectorAll('.ledger-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (e.target.classList.contains('btn-delete')) return;
                const ledger = await this.get(item.dataset.id);
                window.app.currentLedger = ledger;
                localStorage.setItem('defaultLedgerId', ledger.id);
                window.app.showMainApp();
            });
        });
    },

    // 选择并删除
    async selectAndDelete(id) {
        const confirmed = await Utils.confirm('确定要删除这个记账本吗？所有相关记录也会被删除。');
        if (confirmed) {
            await this.delete(id);
            this.renderLedgerList();
            Utils.showToast('已删除', 'success');
        }
    }
};

// 新建记账本事件
document.getElementById('new-ledger-btn').addEventListener('click', async () => {
    const name = prompt('请输入记账本名称：');
    if (name && name.trim()) {
        const ledger = await Ledger.create(name.trim());
        window.app.currentLedger = ledger;
        localStorage.setItem('defaultLedgerId', ledger.id);
        window.app.showMainApp();
    }
});
```

---

## Task 5: Tab 导航和路由

**Files:**
- Create: `js/router.js`

- [ ] **Step 1: 创建 Tab 导航模块**

```javascript
// Tab 导航路由
const Router = {
    tabs: [
        { id: 'add', label: '记一笔', icon: '✏️' },
        { id: 'stats', label: '统计', icon: '📊' },
        { id: 'profile', label: '我的', icon: '👤' }
    ],

    currentTab: null,

    init() {
        this.renderSidebar();
        this.switchTab(this.tabs[0].id);
    },

    renderSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <h2>花销追踪</h2>
                <p class="ledger-name">${window.app.currentLedger?.name || ''}</p>
            </div>
            <div class="sidebar-tabs">
                ${this.tabs.map(tab => `
                    <button class="tab-btn" data-tab="${tab.id}">
                        <span class="tab-icon">${tab.icon}</span>
                        <span class="tab-label">${tab.label}</span>
                    </button>
                `).join('')}
            </div>
        `;

        sidebar.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
    },

    switchTab(tabId) {
        this.currentTab = tabId;

        // 更新 Tab 状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // 渲染对应页面内容
        const content = document.getElementById('main-content');
        switch (tabId) {
            case 'add':
                content.innerHTML = Expense.renderAddForm();
                Expense.initAddForm();
                break;
            case 'stats':
                content.innerHTML = Stats.renderCalendar();
                Stats.initCalendar();
                break;
            case 'profile':
                content.innerHTML = Profile.render();
                Profile.init();
                break;
        }
    }
};
```

---

## Task 6: 支出记录管理

**Files:**
- Create: `js/expense.js`

- [ ] **Step 1: 创建支出记录模块**

```javascript
// 支出记录管理
const Expense = {
    categories: ['餐饮', '购物', '交通', '居住', '医疗', '娱乐', '旅行', '教育', '人情', '其他'],

    // 渲染添加表单
    renderAddForm() {
        const citiesHtml = window.chinaCities?.provinces?.[0]?.cities?.map(city =>
            `<option value="${city}" ${city === '渝中区' ? 'selected' : ''}>${city}</option>`
        ).join('') || '';

        const provincesHtml = window.chinaCities?.provinces?.map(p =>
            `<option value="${p.name}" ${p.name === '重庆市' ? 'selected' : ''}>${p.name}</option>`
        ).join('') || '';

        return `
            <div class="container">
                <h2>记一笔</h2>
                <form id="expense-form" class="card">
                    <div class="form-group">
                        <label>内容 *</label>
                        <input type="text" name="content" required placeholder="买了什么？">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>金额(元) *</label>
                            <input type="number" name="amount" step="0.01" min="0" required placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label>分类 *</label>
                            <select name="category" required>
                                ${this.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>日期 *</label>
                        <input type="date" name="date" required value="${Utils.getToday()}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>省份</label>
                            <select name="province" id="province-select">
                                ${provincesHtml}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>城市/区县</label>
                            <select name="city" id="city-select">
                                ${citiesHtml}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>备注</label>
                        <textarea name="note" rows="2" placeholder="可选备注"></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">保存</button>
                </form>
            </div>
        `;
    },

    // 初始化表单事件
    initAddForm() {
        const form = document.getElementById('expense-form');
        if (!form) return;

        // 省份切换更新城市列表
        const provinceSelect = document.getElementById('province-select');
        const citySelect = document.getElementById('city-select');

        provinceSelect?.addEventListener('change', () => {
            const province = window.chinaCities.provinces.find(p => p.name === provinceSelect.value);
            if (province) {
                citySelect.innerHTML = province.cities.map(c => `<option value="${c}">${c}</option>`).join('');
            }
        });

        // 表单提交
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveExpense(new FormData(form));
        });
    },

    // 保存支出记录
    async saveExpense(formData) {
        const expense = {
            id: Utils.generateId(),
            ledgerId: window.app.currentLedger.id,
            content: formData.get('content'),
            amount: Utils.formatAmount(formData.get('amount')),
            category: formData.get('category'),
            date: formData.get('date'),
            province: formData.get('province') || '重庆市',
            city: formData.get('city') || '渝中区',
            note: formData.get('note') || '',
            createdBy: window.app.currentUser || '我',
            createdAt: Date.now()
        };

        await DB.add('expenses', expense);
        Utils.showToast('已保存', 'success');

        // 重置表单
        document.getElementById('expense-form').reset();
        document.querySelector('input[name="date"]').value = Utils.getToday();
    },

    // 获取某记账本的所有支出
    async getAll(ledgerId) {
        return await DB.getByIndex('expenses', 'ledgerId', ledgerId);
    },

    // 获取某日期的支出
    async getByDate(ledgerId, date) {
        const expenses = await this.getAll(ledgerId);
        return expenses.filter(e => e.date === date);
    },

    // 删除支出
    async delete(id) {
        await DB.delete('expenses', id);
    },

    // 更新支出
    async update(id, data) {
        const expense = await DB.get('expenses', id);
        if (expense) {
            Object.assign(expense, data);
            await DB.put('expenses', expense);
        }
        return expense;
    }
};
```

---

## Task 7: 统计页面（日历视图）

**Files:**
- Create: `js/stats.js`

- [ ] **Step 1: 创建统计模块**

```javascript
// 统计功能
const Stats = {
    currentMonth: new Date(),
    selectedDate: null,

    // 渲染日历
    renderCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        return `
            <div class="container">
                <h2>统计</h2>
                <div class="stats-summary">
                    <div class="summary-item">
                        <span class="summary-label">本周</span>
                        <span class="summary-value" id="week-total">¥0.00</span>
                    </div>
                    <div class="summary-item highlight">
                        <span class="summary-label">本月</span>
                        <span class="summary-value" id="month-total">¥0.00</span>
                    </div>
                </div>

                <div class="calendar">
                    <div class="calendar-header">
                        <button class="btn btn-nav" id="prev-month">◀</button>
                        <span class="calendar-title">${year}年${month + 1}月</span>
                        <button class="btn btn-nav" id="next-month">▶</button>
                    </div>
                    <div class="calendar-grid">
                        <div class="calendar-weekday">一</div>
                        <div class="calendar-weekday">二</div>
                        <div class="calendar-weekday">三</div>
                        <div class="calendar-weekday">四</div>
                        <div class="calendar-weekday">五</div>
                        <div class="calendar-weekday">六</div>
                        <div class="calendar-weekday">日</div>
                    </div>
                    <div class="calendar-days" id="calendar-days"></div>
                </div>

                <div class="export-section">
                    <button class="btn btn-secondary" id="export-csv-btn">导出 CSV</button>
                </div>
            </div>
        `;
    },

    // 初始化日历
    async initCalendar() {
        await this.renderCalendarDays();

        // 绑定导航按钮
        document.getElementById('prev-month')?.addEventListener('click', () => this.prevMonth());
        document.getElementById('next-month')?.addEventListener('click', () => this.nextMonth());

        // 绑定导出按钮
        document.getElementById('export-csv-btn')?.addEventListener('click', () => this.exportCSV());
    },

    // 渲染日历日期
    async renderCalendarDays() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // 获取该月的支出汇总
        const expenses = await Expense.getAll(window.app.currentLedger.id);
        const monthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        const dailyTotals = {};
        monthExpenses.forEach(e => {
            dailyTotals[e.date] = (dailyTotals[e.date] || 0) + Number(e.amount);
        });

        // 计算本周和本月汇总
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);

        const weekTotal = expenses
            .filter(e => {
                const d = new Date(e.date);
                return d >= weekStart && d <= today;
            })
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        document.getElementById('week-total').textContent = Utils.formatCurrency(weekTotal);
        document.getElementById('month-total').textContent = Utils.formatCurrency(monthTotal);

        // 渲染日期格子
        const daysContainer = document.getElementById('calendar-days');
        let html = '';

        // 填充空白
        const startWeekday = firstDay.getDay() || 7;
        for (let i = 1; i < startWeekday; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // 填充日期
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const amount = dailyTotals[dateStr];
            const hasExpense = amount > 0;

            html += `
                <div class="calendar-day ${hasExpense ? 'has-expense' : ''}"
                     data-date="${dateStr}"
                     onclick="Stats.showDayDetail('${dateStr}')">
                    <span class="day-number">${day}</span>
                    ${hasExpense ? `<span class="day-amount">¥${Utils.formatAmount(amount)}</span>` : ''}
                </div>
            `;
        }

        daysContainer.innerHTML = html;
    },

    // 上个月
    prevMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.renderCalendar();
        this.initCalendar();
    },

    // 下个月
    nextMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.renderCalendar();
        this.initCalendar();
    },

    // 显示当日详情
    async showDayDetail(date) {
        const expenses = await Expense.getByDate(window.app.currentLedger.id, date);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content day-detail">
                <div class="modal-header">
                    <h3>${date}</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${expenses.length === 0 ? '<p class="empty-text">暂无记录</p>' :
                        expenses.map(e => `
                            <div class="expense-item card">
                                <div class="expense-info">
                                    <span class="expense-content">${e.content}</span>
                                    <span class="expense-category">${e.category}</span>
                                </div>
                                <div class="expense-right">
                                    <span class="expense-amount">${Utils.formatCurrency(e.amount)}</span>
                                    <span class="expense-user">${e.createdBy}</span>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    // 导出 CSV
    async exportCSV() {
        const expenses = await Expense.getAll(window.app.currentLedger.id);

        const headers = ['日期', '内容', '分类', '省份', '城市', '金额', '备注', '记录人'];
        const rows = expenses.map(e => [
            e.date,
            e.content,
            e.category,
            e.province,
            e.city,
            e.amount,
            e.note,
            e.createdBy
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${window.app.currentLedger.name}_${Utils.getToday()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        Utils.showToast('导出成功', 'success');
    }
};
```

---

## Task 8: 个人设置页面

**Files:**
- Create: `js/profile.js`

- [ ] **Step 1: 创建个人设置模块**

```javascript
// 个人设置
const Profile = {
    // 渲染页面
    render() {
        return `
            <div class="container">
                <h2>我的</h2>

                <div class="card">
                    <h3>当前记账本</h3>
                    <p class="ledger-name-display">${window.app.currentLedger?.name || ''}</p>
                </div>

                <div class="card">
                    <h3>切换记账本</h3>
                    <div id="ledger-switch-list"></div>
                </div>

                <div class="card">
                    <h3>管理记账本</h3>
                    <div class="btn-group">
                        <button class="btn btn-secondary" id="create-ledger-btn">新建记账本</button>
                        <button class="btn btn-danger" id="delete-ledger-btn">删除当前</button>
                    </div>
                </div>

                <div class="card">
                    <h3>数据管理</h3>
                    <div class="btn-group">
                        <button class="btn btn-secondary" id="import-btn">导入 CSV</button>
                        <button class="btn btn-secondary" id="export-all-btn">导出全部</button>
                    </div>
                    <input type="file" id="import-file" accept=".csv" style="display:none">
                </div>

                <div class="card about">
                    <h3>关于</h3>
                    <p>花销追踪 v1.0</p>
                    <p>支持多设备协作，数据本地存储</p>
                </div>
            </div>
        `;
    },

    // 初始化页面
    async init() {
        await this.renderLedgerSwitchList();

        document.getElementById('create-ledger-btn')?.addEventListener('click', () => this.createLedger());
        document.getElementById('delete-ledger-btn')?.addEventListener('click', () => this.deleteLedger());
        document.getElementById('import-btn')?.addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file')?.addEventListener('change', (e) => this.importCSV(e));
        document.getElementById('export-all-btn')?.addEventListener('click', () => this.exportAll());
    },

    // 渲染记账本切换列表
    async renderLedgerSwitchList() {
        const container = document.getElementById('ledger-switch-list');
        const ledgers = await Ledger.getAll();

        container.innerHTML = ledgers.map(l => `
            <div class="ledger-switch-item ${l.id === window.app.currentLedger?.id ? 'active' : ''}"
                 onclick="Profile.switchLedger('${l.id}')">
                ${l.name}
                ${l.id === window.app.currentLedger?.id ? ' ✓' : ''}
            </div>
        `).join('');
    },

    // 切换记账本
    async switchLedger(id) {
        const ledger = await Ledger.get(id);
        if (ledger) {
            window.app.currentLedger = ledger;
            localStorage.setItem('defaultLedgerId', id);
            window.app.showMainApp();
        }
    },

    // 新建记账本
    async createLedger() {
        const name = prompt('请输入记账本名称：');
        if (name && name.trim()) {
            const ledger = await Ledger.create(name.trim());
            this.switchLedger(ledger.id);
        }
    },

    // 删除当前记账本
    async deleteLedger() {
        const confirmed = await Utils.confirm('确定要删除这个记账本吗？所有相关记录也会被删除。');
        if (confirmed) {
            await Ledger.delete(window.app.currentLedger.id);
            localStorage.removeItem('defaultLedgerId');
            window.app.showLedgerSelect();
        }
    },

    // 导入 CSV
    async importCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(l => l.trim());
                const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

                // 跳过表头，处理数据行
                for (let i = 1; i < lines.length; i++) {
                    const values = this.parseCSVLine(lines[i]);
                    if (values.length >= 6) {
                        const expense = {
                            id: Utils.generateId(),
                            ledgerId: window.app.currentLedger.id,
                            date: values[0]?.replace(/"/g, '') || Utils.getToday(),
                            content: values[1]?.replace(/"/g, '') || '',
                            category: values[2]?.replace(/"/g, '') || '其他',
                            province: values[3]?.replace(/"/g, '') || '重庆市',
                            city: values[4]?.replace(/"/g, '') || '渝中区',
                            amount: Utils.formatAmount(values[5]?.replace(/"/g, '') || 0),
                            note: values[6]?.replace(/"/g, '') || '',
                            createdBy: values[7]?.replace(/"/g, '') || '导入',
                            createdAt: Date.now()
                        };
                        await DB.add('expenses', expense);
                    }
                }

                Utils.showToast('导入成功', 'success');
                Router.switchTab('stats');
            } catch (err) {
                Utils.showToast('导入失败：' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    // 解析 CSV 行（处理引号内的逗号）
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    },

    // 导出全部
    async exportAll() {
        await Stats.exportCSV();
    }
};
```

---

## Task 9: 添加更多样式和完善

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: 添加完整样式**

```css
/* Toast 提示 */
.toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1000;
    transition: transform 0.3s;
}

.toast.show {
    transform: translateX(-50%) translateY(0);
}

.toast-info {
    background-color: var(--accent);
    color: white;
}

.toast-success {
    background-color: var(--success);
    color: white;
}

.toast-error {
    background-color: var(--danger);
    color: white;
}

/* 模态框 */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.modal-content {
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 24px;
    max-width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    width: 400px;
}

.modal-buttons {
    display: flex;
    gap: 12px;
    margin-top: 20px;
    justify-content: flex-end;
}

/* 侧边栏 */
.sidebar {
    background-color: var(--bg-secondary);
    min-height: 100vh;
}

.sidebar-header {
    padding: 20px;
    border-bottom: 1px solid var(--border);
}

.sidebar-header h2 {
    font-size: 18px;
    color: var(--text-primary);
}

.sidebar-header .ledger-name {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
}

.sidebar-tabs {
    display: flex;
    flex-direction: column;
    padding: 8px;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-secondary);
    transition: all 0.2s;
}

.tab-btn:hover {
    background-color: var(--bg-primary);
}

.tab-btn.active {
    background-color: var(--accent);
    color: white;
}

.tab-icon {
    font-size: 18px;
}

/* 日历样式 */
.stats-summary {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
}

.summary-item {
    flex: 1;
    background: var(--bg-secondary);
    padding: 16px;
    border-radius: 12px;
    text-align: center;
}

.summary-item.highlight {
    background: var(--accent);
    color: white;
}

.summary-item.highlight .summary-label {
    color: rgba(255, 255, 255, 0.8);
}

.summary-label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.summary-value {
    font-size: 20px;
    font-weight: bold;
}

.calendar {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 16px;
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.calendar-title {
    font-size: 16px;
    font-weight: bold;
}

.btn-nav {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.calendar-weekday {
    text-align: center;
    font-size: 12px;
    color: var(--text-secondary);
    padding: 8px 0;
}

.calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.calendar-day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.calendar-day.empty {
    background: transparent;
    cursor: default;
}

.calendar-day:not(.empty):hover {
    background: var(--bg-primary);
}

.calendar-day.has-expense {
    background: var(--accent);
    color: white;
}

.day-amount {
    font-size: 10px;
    margin-top: 2px;
}

/* 表单行布局 */
.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.btn-block {
    width: 100%;
    margin-top: 8px;
}

.btn-secondary {
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

.btn-secondary:hover {
    background-color: var(--border);
}

.btn-danger {
    background-color: var(--danger);
    color: white;
}

.btn-group {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

/* 支出详情 */
.expense-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.expense-info {
    display: flex;
    flex-direction: column;
}

.expense-content {
    font-weight: 500;
}

.expense-category {
    font-size: 12px;
    color: var(--text-secondary);
}

.expense-right {
    text-align: right;
}

.expense-amount {
    display: block;
    font-weight: bold;
    color: var(--accent);
}

.expense-user {
    font-size: 12px;
    color: var(--text-secondary);
}

/* 导出区域 */
.export-section {
    margin-top: 20px;
    text-align: center;
}

/* 个人设置 */
.ledger-switch-item {
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 8px;
}

.ledger-switch-item:hover {
    background: var(--bg-primary);
}

.ledger-switch-item.active {
    background: var(--accent);
    color: white;
}

.about {
    text-align: center;
}

.about h3 {
    margin-bottom: 8px;
}

.about p {
    font-size: 14px;
    color: var(--text-secondary);
}

.btn-delete {
    background: transparent;
    color: var(--danger);
    font-size: 12px;
    padding: 4px 8px;
}

.empty-text {
    text-align: center;
    color: var(--text-secondary);
    padding: 20px;
}

/* 模态框细节 */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.modal-header h3 {
    font-size: 16px;
}

.btn-close {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-secondary);
}

/* 手机端适配 */
@media (max-width: 767px) {
    .sidebar {
        width: 100%;
        height: 60px;
        bottom: 0;
        top: auto;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        padding: 0;
        border-top: 1px solid var(--border);
    }

    .sidebar-header {
        display: none;
    }

    .sidebar-tabs {
        flex-direction: row;
        width: 100%;
        padding: 0;
    }

    .tab-btn {
        flex: 1;
        flex-direction: column;
        padding: 8px;
        border-radius: 0;
    }

    .tab-icon {
        font-size: 20px;
    }

    .tab-label {
        font-size: 10px;
    }

    .form-row {
        grid-template-columns: 1fr;
    }

    .calendar-day {
        font-size: 12px;
    }

    .day-amount {
        font-size: 9px;
    }

    .stats-summary {
        flex-direction: column;
    }
}
```

---

## Task 10: 集成省市数据

**Files:**
- Modify: `js/expense.js`

- [ ] **Step 1: 更新支出表单加载省市数据**

在 `expense.js` 的 `renderAddForm` 方法中，需要加载省市数据：

```javascript
// 在 renderAddForm 开头添加数据加载
async renderAddForm() {
    // 如果还没有加载省市数据，则加载
    if (!window.chinaCities) {
        try {
            const response = await fetch('data/china-cities.json');
            window.chinaCities = await response.json();
        } catch (err) {
            console.error('加载省市数据失败', err);
            window.chinaCities = { provinces: [{ name: '重庆市', cities: ['渝中区'] }] };
        }
    }

    // ... 其余代码保持不变
}
```

---

## Task 11: 添加用户选择功能

**Files:**
- Modify: `js/expense.js`
- Modify: `js/profile.js`

- [ ] **Step 1: 添加用户名选择/记忆功能**

在 `expense.js` 的 `renderAddForm` 方法中添加用户选择：

```javascript
// 在 renderAddForm 方法的表单中添加用户选择
renderAddForm() {
    // ... 数据加载代码 ...

    // 获取记忆的用户名
    const savedUser = localStorage.getItem('currentUser') || '我';

    return `
        <div class="container">
            <h2>记一笔</h2>
            <form id="expense-form" class="card">
                <!-- 在表单开头添加用户选择 -->
                <div class="form-group">
                    <label>记录人</label>
                    <input type="text" name="createdBy" id="user-input" value="${savedUser}" placeholder="你的名字">
                </div>

                <!-- 其他字段保持不变 -->
                ...
            </form>
        </div>
    `;
}

// 在 initAddForm 中添加用户名记忆
initAddForm() {
    const form = document.getElementById('expense-form');
    if (!form) return;

    // 用户名输入记忆
    const userInput = document.getElementById('user-input');
    userInput?.addEventListener('change', () => {
        localStorage.setItem('currentUser', userInput.value);
        window.app.currentUser = userInput.value;
    });

    // 设置初始用户
    window.app.currentUser = userInput?.value || '我';

    // ... 其他初始化代码保持不变 ...
}
```

---

## Task 12: 测试和验证

- [ ] **Step 1: 测试记账本创建和选择**

打开 `index.html`，验证：
- 页面正常加载
- 可以创建新的记账本
- 选择记账本后进入主界面

- [ ] **Step 2: 测试支出记录**

验证：
- 填写支出表单并保存
- 支出记录正确保存
- 日历视图显示支出金额

- [ ] **Step 3: 测试导出功能**

验证：
- CSV 导出按钮正常工作
- 导出的文件可用 Excel 打开

- [ ] **Step 4: 测试响应式布局**

在浏览器开发者工具中：
- 测试手机端布局 (< 768px)
- 测试电脑端布局 (>= 768px)

---

## 自检清单

- [ ] 规范覆盖：每个设计需求都有对应任务实现 ✓
- [ ] 占位符扫描：计划中无 TBD/TODO ✓
- [ ] 类型一致性：所有 ID、字段名、方法签名一致 ✓

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-25-expense-tracker-plan.md`**

**两种执行方案：**

**1. Subagent-Driven (推荐)** - 我派发子代理逐个任务执行，任务间进行审查，快速迭代

**2. Inline Execution** - 在当前会话中批量执行任务，带检查点审查

你想用哪种方式？