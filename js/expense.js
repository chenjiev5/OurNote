// 支出记录管理
const Expense = {
    categories: ['餐饮', '购物', '交通', '居住', '医疗', '娱乐', '旅行', '教育', '人情', '其他'],

    // 默认省市数据（当 JSON 加载失败时使用）
    defaultChinaCities: {
        provinces: [
            { name: "重庆市", cities: ["万州区", "渝中区", "江北区", "沙坪坝区", "九龙坡区", "南岸区", "北碚区", "渝北区", "巴南区", "涪陵区", "长寿区", "江津区", "合川区", "永川区", "南川区"] },
            { name: "四川省", cities: ["成都市", "自贡市", "攀枝花市", "泸州市", "德阳市", "绵阳市", "广元市", "遂宁市", "内江市", "乐山市", "南充市", "眉山市", "宜宾市", "广安市", "达州市"] },
            { name: "北京市", cities: ["东城区", "西城区", "朝阳区", "丰台区", "石景山区", "海淀区", "门头沟区", "房山区", "通州区", "顺义区", "昌平区", "大兴区"] },
            { name: "上海市", cities: ["黄浦区", "徐汇区", "长宁区", "静安区", "普陀区", "虹口区", "杨浦区", "闵行区", "宝山区", "嘉定区", "浦东新区", "金山区"] },
            { name: "广东省", cities: ["广州市", "深圳市", "珠海市", "汕头市", "佛山市", "韶关市", "湛江市", "肇庆市", "江门市", "茂名市", "惠州市", "梅州市"] },
            { name: "浙江省", cities: ["杭州市", "宁波市", "温州市", "嘉兴市", "湖州市", "绍兴市", "金华市", "衢州市", "舟山市", "台州市", "丽水市"] },
            { name: "江苏省", cities: ["南京市", "无锡市", "徐州市", "常州市", "苏州市", "南通市", "连云港市", "淮安市", "盐城市", "扬州市", "镇江市", "泰州市"] },
            { name: "湖北省", cities: ["武汉市", "黄石市", "十堰市", "宜昌市", "襄阳市", "鄂州市", "荆门市", "孝感市", "荆州市", "黄冈市", "咸宁市", "随州市"] },
            { name: "湖南省", cities: ["长沙市", "株洲市", "湘潭市", "衡阳市", "邵阳市", "岳阳市", "常德市", "张家界市", "益阳市", "郴州市", "永州市", "怀化市"] }
        ]
    },

    // 加载省市数据
    async loadChinaCities() {
        if (!window.chinaCities) {
            try {
                const response = await fetch('data/china-cities.json');
                if (response.ok) {
                    window.chinaCities = await response.json();
                } else {
                    throw new Error('HTTP ' + response.status);
                }
            } catch (err) {
                console.log('使用内置省市数据', err);
                window.chinaCities = this.defaultChinaCities;
            }
        }
    },

    // 渲染添加表单
    async renderAddForm() {
        await this.loadChinaCities();

        const citiesHtml = window.chinaCities?.provinces?.[0]?.cities?.map(city =>
            `<option value="${city}" ${city === '渝中区' ? 'selected' : ''}>${city}</option>`
        ).join('') || '';

        const provincesHtml = window.chinaCities?.provinces?.map(p =>
            `<option value="${p.name}" ${p.name === '重庆市' ? 'selected' : ''}>${p.name}</option>`
        ).join('') || '';

        // 获取用户列表
        const savedUser = localStorage.getItem('currentUser') || '我';
        const users = this.getUserList();
        const usersHtml = users.map(u => `<option value="${u}" ${u === savedUser ? 'selected' : ''}>${u}</option>`).join('');

        const today = Utils.getToday();

        return `
            <div class="container">
                <h2>记一笔</h2>
                <form id="expense-form" class="card">
                    <div class="form-group">
                        <label>记录人</label>
                        <div class="user-select-row">
                            <select name="createdBy" id="user-select" class="user-select">
                                ${usersHtml}
                            </select>
                            <button type="button" class="btn btn-secondary btn-small" onclick="Expense.addNewUser()">+新建</button>
                        </div>
                    </div>

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
                        <label>
                            日期 *
                            <button type="button" class="btn-multi-toggle" id="multi-date-toggle" onclick="Expense.toggleMultiDate()">
                                <span id="multi-date-icon">○</span> 多日
                            </button>
                        </label>
                        <div id="single-date-section">
                            <input type="date" name="date" required value="${today}">
                        </div>
                        <div id="multi-date-section" class="multi-date-section hidden">
                            <div class="date-range-input">
                                <input type="date" id="date-start" value="${today}">
                                <span>至</span>
                                <input type="date" id="date-end" value="${today}">
                                <button type="button" class="btn btn-secondary btn-small" onclick="Expense.selectDateRange()">选择区间</button>
                            </div>
                            <div class="selected-dates" id="selected-dates">
                                <div class="selected-date-chip" data-date="${today}">${today} <span class="remove-date" onclick="Expense.removeDate('${today}')">×</span></div>
                            </div>
                        </div>
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

    // 获取用户列表
    getUserList() {
        const stored = localStorage.getItem('userList');
        return stored ? JSON.parse(stored) : ['我'];
    },

    // 保存用户列表
    saveUserList(users) {
        localStorage.setItem('userList', JSON.stringify(users));
    },

    // 添加新用户
    addNewUser() {
        const name = prompt('请输入新的记录人名称：');
        if (name && name.trim()) {
            const users = this.getUserList();
            const newUser = name.trim();
            if (!users.includes(newUser)) {
                users.push(newUser);
                this.saveUserList(users);
                // 更新下拉框
                const select = document.getElementById('user-select');
                if (select) {
                    const option = document.createElement('option');
                    option.value = newUser;
                    option.textContent = newUser;
                    select.appendChild(option);
                    select.value = newUser;
                }
                Utils.showToast('已添加记录人', 'success');
            }
        }
    },

    // 多日模式状态
    multiDateMode: false,
    selectedDates: [],

    // 切换多日模式
    toggleMultiDate() {
        this.multiDateMode = !this.multiDateMode;
        const icon = document.getElementById('multi-date-icon');
        const singleSection = document.getElementById('single-date-section');
        const multiSection = document.getElementById('multi-date-section');

        if (this.multiDateMode) {
            icon.textContent = '●';
            singleSection.classList.add('hidden');
            multiSection.classList.remove('hidden');
        } else {
            icon.textContent = '○';
            singleSection.classList.remove('hidden');
            multiSection.classList.add('hidden');
            this.selectedDates = [];
        }
    },

    // 选择日期区间
    selectDateRange() {
        const startInput = document.getElementById('date-start');
        const endInput = document.getElementById('date-end');
        const start = new Date(startInput.value);
        const end = new Date(endInput.value);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            Utils.showToast('请选择有效的日期范围', 'error');
            return;
        }

        if (start > end) {
            Utils.showToast('开始日期不能晚于结束日期', 'error');
            return;
        }

        // 生成区间内所有日期
        const dates = [];
        const current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().substring(0, 10);
            if (!this.selectedDates.includes(dateStr)) {
                dates.push(dateStr);
            }
            current.setDate(current.getDate() + 1);
        }

        this.selectedDates = [...this.selectedDates, ...dates].sort();
        this.renderSelectedDates();
        Utils.showToast(`已添加 ${dates.length} 个日期`, 'success');
    },

    // 移除单个日期
    removeDate(date) {
        this.selectedDates = this.selectedDates.filter(d => d !== date);
        this.renderSelectedDates();
    },

    // 渲染已选日期
    renderSelectedDates() {
        const container = document.getElementById('selected-dates');
        container.innerHTML = this.selectedDates.map(date => `
            <div class="selected-date-chip" data-date="${date}">${date} <span class="remove-date" onclick="Expense.removeDate('${date}')">×</span></div>
        `).join('') || '<span class="empty-dates">请选择日期</span>';
    },

    // 初始化表单事件
    initAddForm() {
        const form = document.getElementById('expense-form');
        if (!form) return;

        // 用户选择记忆
        const userSelect = document.getElementById('user-select');
        userSelect?.addEventListener('change', () => {
            localStorage.setItem('currentUser', userSelect.value);
            window.app.currentUser = userSelect.value;
        });
        window.app.currentUser = userSelect?.value || '我';

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
            await this.saveExpenseWithDates(new FormData(form));
        });
    },

    // 保存支出记录（单条）
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
        return expense;
    },

    // 保存支出记录（处理多日模式）
    async saveExpenseWithDates(formData) {
        let dates = [];

        if (this.multiDateMode && this.selectedDates.length > 0) {
            dates = [...this.selectedDates];
        } else {
            dates = [formData.get('date')];
        }

        const baseExpense = {
            ledgerId: window.app.currentLedger.id,
            content: formData.get('content'),
            amount: Utils.formatAmount(formData.get('amount')),
            category: formData.get('category'),
            province: formData.get('province') || '重庆市',
            city: formData.get('city') || '渝中区',
            note: formData.get('note') || '',
            createdBy: window.app.currentUser || '我',
            createdAt: Date.now()
        };

        // 为每个日期创建一条记录
        for (const date of dates) {
            const expense = {
                ...baseExpense,
                id: Utils.generateId(),
                date: date
            };
            await DB.add('expenses', expense);
        }

        Utils.showToast(`已保存 ${dates.length} 条记录`, 'success');

        // 重置
        this.selectedDates = [];
        this.multiDateMode = false;

        // 刷新统计页面数据
        if (window.Stats && window.Stats.refresh) {
            await window.Stats.refresh();
        }

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

// 确保全局可访问
window.Expense = Expense;
