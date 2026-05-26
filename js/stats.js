// 统计功能
const Stats = {
    currentMonth: new Date(),
    selectedDate: null,
    viewMode: 'month', // 'month' 或 'year'
    // 缓存的支出数据
    cachedExpenses: null,

    // 辅助函数：从日期字符串获取年月字符串
    getYearMonth(dateStr) {
        if (!dateStr) return '';
        return dateStr.substring(0, 7);
    },

    // 辅助函数：从日期字符串获取年
    getYear(dateStr) {
        if (!dateStr) return '';
        return dateStr.substring(0, 4);
    },

    // 渲染统计页面
    renderStats() {
        if (this.viewMode === 'month') {
            return this.renderMonthView();
        } else {
            return this.renderYearView();
        }
    },

    // 渲染月视图
    renderMonthView() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        return `
            <div class="container">
                <h2>统计</h2>

                <div class="view-switch">
                    <button class="view-btn active" onclick="Stats.switchView('month')">月</button>
                    <button class="view-btn" onclick="Stats.switchView('year')">年</button>
                </div>

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

    // 渲染年视图
    renderYearView() {
        const year = this.currentMonth.getFullYear();

        return `
            <div class="container">
                <h2>年度统计</h2>

                <div class="view-switch">
                    <button class="view-btn" onclick="Stats.switchView('month')">月</button>
                    <button class="view-btn active" onclick="Stats.switchView('year')">年</button>
                </div>

                <div class="year-header">
                    <button class="btn btn-nav" id="prev-year">◀</button>
                    <span class="year-title">${year}年</span>
                    <button class="btn btn-nav" id="next-year">▶</button>
                </div>

                <div class="year-summary">
                    <div class="summary-item highlight">
                        <span class="summary-label">年度支出</span>
                        <span class="summary-value" id="year-total">¥0.00</span>
                    </div>
                </div>

                <div class="year-months" id="year-months"></div>

                <div class="export-section">
                    <button class="btn btn-secondary" id="export-csv-btn">导出 CSV</button>
                </div>
            </div>
        `;
    },

    // 初始化统计页面
    async initCalendar() {
        await this.loadData();
        this.updateCalendarDisplay();
        this.bindEvents();
    },

    // 加载数据
    async loadData() {
        if (!this.cachedExpenses) {
            this.cachedExpenses = await Expense.getAll(window.app.currentLedger.id);
        }
    },

    // 绑定事件
    bindEvents() {
        if (this.viewMode === 'month') {
            document.getElementById('prev-month')?.addEventListener('click', () => this.prevMonth());
            document.getElementById('next-month')?.addEventListener('click', () => this.nextMonth());
        } else {
            document.getElementById('prev-year')?.addEventListener('click', () => this.prevYear());
            document.getElementById('next-year')?.addEventListener('click', () => this.nextYear());
        }
        document.getElementById('export-csv-btn')?.addEventListener('click', () => this.exportCSV());
    },

    // 切换视图
    switchView(mode) {
        this.viewMode = mode;
        document.getElementById('main-content').innerHTML = this.renderStats();
        this.bindEvents();
        this.updateCalendarDisplay();
    },

    // 上一年
    prevYear() {
        const year = this.currentMonth.getFullYear();
        this.currentMonth = new Date(year - 1, 0, 1);
        document.getElementById('main-content').innerHTML = this.renderStats();
        this.bindEvents();
        this.updateCalendarDisplay();
    },

    // 下一年
    nextYear() {
        const year = this.currentMonth.getFullYear();
        this.currentMonth = new Date(year + 1, 0, 1);
        document.getElementById('main-content').innerHTML = this.renderStats();
        this.bindEvents();
        this.updateCalendarDisplay();
    },

    // 更新日历显示
    updateCalendarDisplay() {
        if (this.viewMode === 'month') {
            this.updateMonthView();
        } else {
            this.updateYearView();
        }
    },

    // 更新月视图
    updateMonthView() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const targetYearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const expenses = this.cachedExpenses;
        const monthExpenses = expenses.filter(e => this.getYearMonth(e.date) === targetYearMonth);

        const dailyTotals = {};
        monthExpenses.forEach(e => {
            dailyTotals[e.date] = (dailyTotals[e.date] || 0) + Number(e.amount);
        });

        // 计算本周和本月汇总
        const today = new Date();
        const todayStr = today.toISOString().substring(0, 10);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        const weekStartStr = weekStart.toISOString().substring(0, 10);

        const weekTotal = expenses
            .filter(e => e.date >= weekStartStr && e.date <= todayStr)
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        document.getElementById('week-total').textContent = Utils.formatCurrency(weekTotal);
        document.getElementById('month-total').textContent = Utils.formatCurrency(monthTotal);

        // 渲染日期格子
        const daysContainer = document.getElementById('calendar-days');
        let html = '';

        const startWeekday = firstDay.getDay() || 7;
        for (let i = 1; i < startWeekday; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const amount = dailyTotals[dateStr] || 0;
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

    // 更新年视图
    updateYearView() {
        const year = this.currentMonth.getFullYear();
        const expenses = this.cachedExpenses;

        // 计算12个月的支出
        const monthTotals = [];
        let yearTotal = 0;

        for (let month = 0; month < 12; month++) {
            const targetYearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
            const monthExpenses = expenses.filter(e => this.getYearMonth(e.date) === targetYearMonth);
            const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
            monthTotals.push(total);
            yearTotal += total;
        }

        document.getElementById('year-total').textContent = Utils.formatCurrency(yearTotal);

        // 渲染月份列表
        const monthsContainer = document.getElementById('year-months');
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const maxAmount = Math.max(...monthTotals, 1);

        let html = '<div class="month-list">';
        for (let month = 0; month < 12; month++) {
            const amount = monthTotals[month];
            const barWidth = (amount / maxAmount * 100).toFixed(1);
            const isCurrentMonth = new Date().getFullYear() === year && new Date().getMonth() === month;

            html += `
                <div class="month-item ${amount > 0 ? 'has-expense' : ''} ${isCurrentMonth ? 'current' : ''}">
                    <span class="month-name">${monthNames[month]}</span>
                    <div class="month-bar-container">
                        <div class="month-bar" style="width: ${barWidth}%"></div>
                    </div>
                    <span class="month-amount">${amount > 0 ? Utils.formatCurrency(amount) : '-'}</span>
                </div>
            `;
        }
        html += '</div>';

        monthsContainer.innerHTML = html;
    },

    // 上个月
    prevMonth() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        this.currentMonth = new Date(year, month - 1, 1);
        document.getElementById('main-content').innerHTML = this.renderStats();
        this.bindEvents();
        this.updateCalendarDisplay();
    },

    // 下个月
    nextMonth() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        this.currentMonth = new Date(year, month + 1, 1);
        document.getElementById('main-content').innerHTML = this.renderStats();
        this.bindEvents();
        this.updateCalendarDisplay();
    },

    // 刷新数据
    async refresh() {
        this.cachedExpenses = null;
        this.cachedExpenses = await Expense.getAll(window.app.currentLedger.id);
        if (document.getElementById('calendar-days') || document.getElementById('year-months')) {
            document.getElementById('main-content').innerHTML = this.renderStats();
            this.bindEvents();
            this.updateCalendarDisplay();
        }
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
                    <div class="day-detail-add">
                        <button class="btn btn-primary btn-block" onclick="Stats.addExpenseFromPopup('${date}')">
                            + 新增记录
                        </button>
                    </div>
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
                                <div class="expense-actions">
                                    <button class="btn btn-small" onclick="Stats.editExpense('${e.id}')">编辑</button>
                                    <button class="btn btn-danger btn-small" onclick="Stats.deleteExpense('${e.id}', '${date}')">删除</button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 点击弹窗背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // ESC 键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    },

    // 删除支出记录
    async deleteExpense(id, date) {
        if (!confirm('确定要删除这条记录吗？')) return;

        await Expense.delete(id);
        Utils.showToast('已删除', 'success');

        // 关闭当前弹窗
        document.querySelector('.modal-overlay')?.remove();

        // 刷新统计数据
        this.cachedExpenses = null;
        this.cachedExpenses = await Expense.getAll(window.app.currentLedger.id);
        this.updateCalendarDisplay();

        // 重新显示当天详情（如果有记录）
        await this.showDayDetail(date);
    },

    // 编辑支出记录
    async editExpense(id) {
        const expense = await DB.get('expenses', id);
        if (!expense) {
            Utils.showToast('记录不存在', 'error');
            return;
        }

        await Expense.loadChinaCities();
        const savedUser = localStorage.getItem('currentUser') || '我';
        const users = Expense.getUserList();
        const usersHtml = users.map(u => `<option value="${u}" ${u === expense.createdBy ? 'selected' : ''}>${u}</option>`).join('');

        const provincesHtml = window.chinaCities?.provinces?.map(p =>
            `<option value="${p.name}" ${p.name === expense.province ? 'selected' : ''}>${p.name}</option>`
        ).join('') || '';

        const citiesHtml = (() => {
            const province = window.chinaCities?.provinces?.find(p => p.name === expense.province);
            if (province) {
                return province.cities.map(c => `<option value="${c}" ${c === expense.city ? 'selected' : ''}>${c}</option>`).join('');
            }
            return '';
        })();

        const categoriesHtml = Expense.categories.map(c => `<option value="${c}" ${c === expense.category ? 'selected' : ''}>${c}</option>`).join('');

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>编辑记录</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <form id="edit-expense-form" class="card">
                    <div class="form-group">
                        <label>记录人</label>
                        <div class="user-select-row">
                            <select name="createdBy" id="edit-user-select" class="user-select">
                                ${usersHtml}
                            </select>
                            <button type="button" class="btn btn-secondary btn-small" onclick="Expense.addNewUser()">+新建</button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>内容 *</label>
                        <input type="text" name="content" required value="${expense.content}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>金额(元) *</label>
                            <input type="number" name="amount" step="0.01" min="0" required value="${expense.amount}">
                        </div>
                        <div class="form-group">
                            <label>分类 *</label>
                            <select name="category" required>
                                ${categoriesHtml}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>日期 *</label>
                        <input type="date" name="date" required value="${expense.date}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>省份</label>
                            <select name="province" id="edit-province-select">
                                ${provincesHtml}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>城市/区县</label>
                            <select name="city" id="edit-city-select">
                                ${citiesHtml}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>备注</label>
                        <textarea name="note" rows="2">${expense.note || ''}</textarea>
                    </div>

                    <div class="btn-group">
                        <button type="submit" class="btn btn-primary">保存</button>
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // ESC 键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 绑定省份切换事件
        const provinceSelect = document.getElementById('edit-province-select');
        const citySelect = document.getElementById('edit-city-select');

        provinceSelect?.addEventListener('change', () => {
            const province = window.chinaCities.provinces.find(p => p.name === provinceSelect.value);
            if (province) {
                citySelect.innerHTML = province.cities.map(c => `<option value="${c}">${c}</option>`).join('');
            }
        });

        // 表单提交
        document.getElementById('edit-expense-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                content: formData.get('content'),
                amount: Utils.formatAmount(formData.get('amount')),
                category: formData.get('category'),
                date: formData.get('date'),
                province: formData.get('province'),
                city: formData.get('city'),
                note: formData.get('note'),
                createdBy: formData.get('createdBy')
            };

            await Expense.update(id, data);
            Utils.showToast('已更新', 'success');

            // 关闭编辑弹窗
            modal.remove();

            // 刷新数据
            this.cachedExpenses = null;
            this.cachedExpenses = await Expense.getAll(window.app.currentLedger.id);
            this.updateCalendarDisplay();

            // 重新显示当天详情
            await this.showDayDetail(expense.date);
        });
    },

    // 从弹窗新增记录
    async addExpenseFromPopup(date) {
        // 关闭当前弹窗
        document.querySelector('.modal-overlay')?.remove();

        // 切换到记一笔页面，并设置日期
        if (window.app && window.app.navigate) {
            await window.app.navigate('add');
            // 等待表单渲染完成后设置日期
            setTimeout(() => {
                const dateInput = document.querySelector('input[name="date"]');
                if (dateInput) {
                    dateInput.value = date;
                }
            }, 100);
        }
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

// 确保全局可访问
window.Stats = Stats;
