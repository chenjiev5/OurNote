// 文件存储模块 - 使用 File System Access API 或传统下载/上传方式
const FileStorage = {
    // 数据文件结构
    dataFile: {
        version: '1.0',
        exportDate: null,
        ledgers: [],
        expenses: [],
        settings: {
            users: ['我'],
            currentUser: '我'
        }
    },

    // 是否支持 File System Access API
    isFileSystemAccessSupported() {
        return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
    },

    // 获取默认文件名
    getDefaultFileName() {
        const date = new Date().toISOString().substring(0, 10);
        return `花销数据_${date}.json`;
    },

    // 导出数据到文件（使用 File System Access API）
    async exportToFile() {
        try {
            // 收集所有数据
            const ledgers = await DB.getAll('ledgers');
            const expenses = await DB.getAll('expenses');
            const users = JSON.parse(localStorage.getItem('userList') || '["我"]');
            const currentUser = localStorage.getItem('currentUser') || '我';

            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                ledgers: ledgers,
                expenses: expenses,
                settings: {
                    users: users,
                    currentUser: currentUser
                }
            };

            if (this.isFileSystemAccessSupported()) {
                // 使用 File System Access API
                const options = {
                    suggestedName: this.getDefaultFileName(),
                    types: [{
                        description: 'JSON 文件',
                        accept: { 'application/json': ['.json'] }
                    }]
                };

                const handle = await window.showSaveFilePicker(options);
                const writable = await handle.createWritable();
                await writable.write(JSON.stringify(exportData, null, 2));
                await writable.close();
                Utils.showToast('已保存到文件', 'success');
            } else {
                // 传统方式：下载文件
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = this.getDefaultFileName();
                a.click();
                URL.revokeObjectURL(url);
                Utils.showToast('已开始下载', 'success');
            }
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('导出失败:', err);
                Utils.showToast('导出失败', 'error');
            }
            return false;
        }
    },

    // 从文件导入数据（使用 File System Access API）
    async importFromFile() {
        try {
            let importData;

            if (this.isFileSystemAccessSupported()) {
                const options = {
                    types: [{
                        description: 'JSON 文件',
                        accept: { 'application/json': ['.json'] }
                    }]
                };

                const [handle] = await window.showOpenFilePicker(options);
                const file = await handle.getFile();
                const text = await file.text();
                importData = JSON.parse(text);
            } else {
                // 传统方式：通过文件选择器
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,application/json';

                importData = await new Promise((resolve, reject) => {
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (!file) {
                            reject(new Error('未选择文件'));
                            return;
                        }
                        try {
                            const text = await file.text();
                            resolve(JSON.parse(text));
                        } catch (err) {
                            reject(err);
                        }
                    };
                    input.click();
                });
            }

            // 验证数据格式
            if (!importData.ledgers || !importData.expenses) {
                throw new Error('文件格式不正确');
            }

            // 导入数据
            const confirmed = await Utils.confirm(
                `确定要导入数据吗？\n\n` +
                `记账本: ${importData.ledgers.length} 个\n` +
                `支出记录: ${importData.expenses.length} 条\n\n` +
                `注意：这将替换现有数据！`
            );

            if (!confirmed) return false;

            // 清空现有数据
            await this.clearAllData();

            // 导入记账本
            for (const ledger of importData.ledgers) {
                await DB.add('ledgers', ledger);
            }

            // 导入支出记录
            for (const expense of importData.expenses) {
                await DB.add('expenses', expense);
            }

            // 导入设置
            if (importData.settings) {
                if (importData.settings.users) {
                    localStorage.setItem('userList', JSON.stringify(importData.settings.users));
                }
                if (importData.settings.currentUser) {
                    localStorage.setItem('currentUser', importData.settings.currentUser);
                }
            }

            Utils.showToast('导入成功', 'success');
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('导入失败:', err);
                Utils.showToast('导入失败: ' + err.message, 'error');
            }
            return false;
        }
    },

    // 清空所有数据
    async clearAllData() {
        const ledgers = await DB.getAll('ledgers');
        const expenses = await DB.getAll('expenses');

        for (const ledger of ledgers) {
            await DB.delete('ledgers', ledger.id);
        }
        for (const expense of expenses) {
            await DB.delete('expenses', expense.id);
        }
    },

    // 备份数据到 localStorage（自动保存）
    async backupToLocalStorage() {
        try {
            const ledgers = await DB.getAll('ledgers');
            const expenses = await DB.getAll('expenses');
            const users = localStorage.getItem('userList') || '["我"]';
            const currentUser = localStorage.getItem('currentUser') || '我';

            const backup = {
                version: '1.0',
                backupDate: new Date().toISOString(),
                ledgers: ledgers,
                expenses: expenses,
                settings: {
                    users: JSON.parse(users),
                    currentUser: currentUser
                }
            };

            localStorage.setItem('dataBackup', JSON.stringify(backup));
            return true;
        } catch (err) {
            console.error('备份失败:', err);
            return false;
        }
    },

    // 从 localStorage 恢复数据
    async restoreFromLocalStorage() {
        try {
            const backupStr = localStorage.getItem('dataBackup');
            if (!backupStr) return false;

            const backup = JSON.parse(backupStr);

            // 检查是否有数据
            if (!backup.ledgers || backup.ledgers.length === 0) {
                return false;
            }

            const confirmed = await Utils.confirm(
                `发现本地备份数据\n\n` +
                `记账本: ${backup.ledgers.length} 个\n` +
                `支出记录: ${backup.expenses.length} 条\n\n` +
                `是否恢复这些数据？`
            );

            if (!confirmed) return false;

            // 清空现有数据
            await this.clearAllData();

            // 恢复记账本
            for (const ledger of backup.ledgers) {
                await DB.add('ledgers', ledger);
            }

            // 恢复支出记录
            for (const expense of backup.expenses) {
                await DB.add('expenses', expense);
            }

            // 恢复设置
            if (backup.settings) {
                if (backup.settings.users) {
                    localStorage.setItem('userList', JSON.stringify(backup.settings.users));
                }
                if (backup.settings.currentUser) {
                    localStorage.setItem('currentUser', backup.settings.currentUser);
                }
            }

            Utils.showToast('已恢复备份数据', 'success');
            return true;
        } catch (err) {
            console.error('恢复失败:', err);
            return false;
        }
    },

    // 初始化：尝试恢复备份
    async init() {
        const restored = await this.restoreFromLocalStorage();
        if (restored) {
            return true;
        }

        // 尝试加载现有数据
        const ledgers = await DB.getAll('ledgers');
        if (ledgers.length === 0) {
            // 没有数据，创建一个默认记账本
            const defaultLedger = await Ledger.create('我的账本');
            localStorage.setItem('defaultLedgerId', defaultLedger.id);
        }

        return false;
    }
};

// 自动备份定时器（每分钟备份一次）
let backupInterval = null;
function startAutoBackup() {
    if (backupInterval) clearInterval(backupInterval);
    backupInterval = setInterval(() => {
        FileStorage.backupToLocalStorage();
    }, 60000); // 每分钟
}
