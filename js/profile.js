// 个人设置
const Profile = {
    // 渲染页面
    render() {
        return `
            <div class="container">
                <h2>我的</h2>

                <div class="card">
                    <h3>当前记账本</h3>
                    <div class="current-ledger-info">
                        <p class="ledger-name-display">${window.app.currentLedger?.name || ''}</p>
                        <button class="btn btn-secondary btn-small" id="rename-ledger-btn">修改名称</button>
                    </div>
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
                    <h3>管理记录人</h3>
                    <div id="user-manage-list"></div>
                    <button class="btn btn-secondary" id="add-user-btn" style="margin-top: 12px; width: 100%;">+ 添加记录人</button>
                </div>

                <div class="card">
                    <h3>数据管理</h3>
                    <div class="btn-group">
                        <button class="btn btn-secondary" id="import-btn">导入数据</button>
                        <button class="btn btn-secondary" id="export-all-btn">导出数据</button>
                    </div>
                    <p class="data-tip">数据将保存为 JSON 文件，方便备份和迁移</p>
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
        this.renderUserManageList();

        document.getElementById('create-ledger-btn')?.addEventListener('click', () => this.createLedger());
        document.getElementById('delete-ledger-btn')?.addEventListener('click', () => this.deleteLedger());
        document.getElementById('rename-ledger-btn')?.addEventListener('click', () => this.renameLedger());
        document.getElementById('add-user-btn')?.addEventListener('click', () => this.addUser());
        document.getElementById('import-btn')?.addEventListener('click', () => this.importFromFile());
        document.getElementById('export-all-btn')?.addEventListener('click', () => this.exportToFile());
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

    // 渲染用户管理列表
    renderUserManageList() {
        const container = document.getElementById('user-manage-list');
        const users = this.getUserList();

        container.innerHTML = users.map(u => `
            <div class="user-manage-item" data-user="${u}">
                <span class="user-name">${u}</span>
                <div class="user-manage-actions">
                    <button class="btn btn-secondary" onclick="Profile.editUser('${u}')">编辑</button>
                    ${users.length > 1 ? `<button class="btn btn-danger" onclick="Profile.deleteUser('${u}')">删除</button>` : ''}
                </div>
            </div>
        `).join('');
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

    // 添加用户
    addUser() {
        const name = prompt('请输入新的记录人名称：');
        if (name && name.trim()) {
            const users = this.getUserList();
            const newUser = name.trim();
            if (!users.includes(newUser)) {
                users.push(newUser);
                this.saveUserList(users);
                this.renderUserManageList();
                Utils.showToast('已添加记录人', 'success');
            } else {
                Utils.showToast('该记录人已存在', 'error');
            }
        }
    },

    // 编辑用户
    editUser(oldName) {
        const newName = prompt('请输入新的记录人名称：', oldName);
        if (newName && newName.trim() && newName.trim() !== oldName) {
            const users = this.getUserList();
            const index = users.indexOf(oldName);
            if (index > -1 && !users.includes(newName.trim())) {
                users[index] = newName.trim();
                this.saveUserList(users);
                // 更新当前用户
                if (localStorage.getItem('currentUser') === oldName) {
                    localStorage.setItem('currentUser', newName.trim());
                }
                this.renderUserManageList();
                Utils.showToast('已修改记录人', 'success');
            } else {
                Utils.showToast('该记录人已存在或名称无效', 'error');
            }
        }
    },

    // 删除用户
    async deleteUser(name) {
        if (name === '我') {
            Utils.showToast('默认记录人不能删除', 'error');
            return;
        }
        const confirmed = await Utils.confirm(`确定要删除记录人"${name}"吗？`);
        if (confirmed) {
            let users = this.getUserList();
            users = users.filter(u => u !== name);
            this.saveUserList(users);
            // 如果删除的是当前用户，切换到"我"
            if (localStorage.getItem('currentUser') === name) {
                localStorage.setItem('currentUser', '我');
            }
            this.renderUserManageList();
            Utils.showToast('已删除记录人', 'success');
        }
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

    // 修改记账本名称
    async renameLedger() {
        const newName = prompt('请输入新的记账本名称：', window.app.currentLedger?.name || '');
        if (newName && newName.trim() && newName.trim() !== window.app.currentLedger.name) {
            await Ledger.update(window.app.currentLedger.id, { name: newName.trim() });
            window.app.currentLedger.name = newName.trim();
            // 更新本地存储
            localStorage.setItem('defaultLedgerId', window.app.currentLedger.id);
            // 刷新页面显示
            document.querySelector('.ledger-name-display').textContent = newName.trim();
            document.querySelector('.ledger-name').textContent = newName.trim();
            Utils.showToast('已修改记账本名称', 'success');
        }
    },

    // 导出全部数据到 JSON 文件
    async exportToFile() {
        await FileStorage.exportToFile();
    },

    // 从 JSON 文件导入数据
    async importFromFile() {
        const success = await FileStorage.importFromFile();
        if (success) {
            // 刷新页面
            location.reload();
        }
    }
};

// 确保全局可访问
window.Profile = Profile;