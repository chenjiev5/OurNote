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
            listEl.innerHTML = '<p class="empty-text">还没有记账本，点击下方按钮创建一个吧</p>';
            return;
        }

        listEl.innerHTML = ledgers.map(ledger => `
            <div class="card ledger-item" data-id="${ledger.id}">
                <div class="ledger-icon">📒</div>
                <div class="ledger-info">
                    <h3>${ledger.name}</h3>
                    <p class="ledger-date">创建于 ${Utils.formatDate(ledger.createdAt)}</p>
                </div>
                <span class="ledger-arrow">›</span>
            </div>
        `).join('');

        // 点击选择记账本
        listEl.querySelectorAll('.ledger-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                // 不响应删除按钮点击
                if (e.target.closest('.btn-delete')) return;
                const ledger = await this.get(item.dataset.id);
                window.app.currentLedger = ledger;
                localStorage.setItem('defaultLedgerId', ledger.id);
                window.app.showMainApp();
            });
        });
    },
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
