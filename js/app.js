// 主应用入口
class App {
    constructor() {
        this.currentLedger = null;
        this.currentUser = null;
    }

    async init() {
        // 初始化数据库
        await DB.init();

        // 尝试从本地存储恢复或初始化数据
        await FileStorage.init();

        // 启动自动备份
        FileStorage.backupToLocalStorage();
        setInterval(() => FileStorage.backupToLocalStorage(), 60000);

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

// 页面关闭前备份数据
window.addEventListener('beforeunload', () => {
    FileStorage.backupToLocalStorage();
});
