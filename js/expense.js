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

        // 等待数据库操作完成
        await DB.add('expenses', expense);
        Utils.showToast('已保存', 'success');

        // 等待一下确保数据已写入
        await new Promise(resolve => setTimeout(resolve, 100));

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
