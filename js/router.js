// Tab 导航路由
const Router = {
    tabs: [
        { id: 'home', label: '首页', icon: '🏠' },
        { id: 'add', label: '记一笔', icon: '✏️' },
        { id: 'stats', label: '统计', icon: '📊' },
        { id: 'profile', label: '我的', icon: '👤' }
    ],

    currentTab: null,
    touchStartX: 0,
    touchEndX: 0,
    minSwipeDistance: 50,
    isAnimating: false,

    init() {
        this.renderSidebar();
        // 默认切换到记一笔页面（首页用于切换记账本）
        this.switchTab('add');
        // 初始化滑动手势
        this.initSwipeGesture();
    },

    // 初始化滑动手势
    initSwipeGesture() {
        const content = document.getElementById('main-content');

        content.addEventListener('touchstart', (e) => {
            if (this.isAnimating) return;
            this.touchStartX = e.changedTouches[0].screenX;
            content.style.transition = 'none';
        }, { passive: true });

        content.addEventListener('touchmove', (e) => {
            if (this.isAnimating) return;
            this.touchEndX = e.changedTouches[0].screenX;
            const diff = this.touchStartX - this.touchEndX;
            const percent = (diff / window.innerWidth) * 100;
            // 限制最大滑动距离
            const offset = Math.max(-30, Math.min(30, percent));
            content.style.transform = `translateX(${offset}%)`;
        }, { passive: true });

        content.addEventListener('touchend', (e) => {
            if (this.isAnimating) return;
            this.touchEndX = e.changedTouches[0].screenX;
            content.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            content.style.transform = 'translateX(0)';
            this.handleSwipe();
        }, { passive: true });
    },

    // 处理滑动手势
    handleSwipe() {
        const diff = this.touchStartX - this.touchEndX;
        const currentIndex = this.tabs.findIndex(t => t.id === this.currentTab);

        if (Math.abs(diff) < this.minSwipeDistance) return;

        this.isAnimating = true;

        if (diff > 0) {
            // 向左滑 → 下一个 Tab
            if (currentIndex < this.tabs.length - 1) {
                this.switchTab(this.tabs[currentIndex + 1].id);
            }
        } else {
            // 向右滑 → 上一个 Tab
            if (currentIndex > 0) {
                this.switchTab(this.tabs[currentIndex - 1].id);
            }
        }

        // 重置动画状态
        setTimeout(() => {
            this.isAnimating = false;
        }, 50);
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

    async switchTab(tabId) {
        this.currentTab = tabId;

        // 更新 Tab 状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // 渲染对应页面内容
        const content = document.getElementById('main-content');
        switch (tabId) {
            case 'home':
                // 显示记账本选择页面
                await window.app.showLedgerSelect();
                break;
            case 'add':
                content.innerHTML = await Expense.renderAddForm();
                Expense.initAddForm();
                break;
            case 'stats':
                // 重置统计页面数据，重新渲染
                if (window.Stats) {
                    window.Stats.currentMonth = new Date();
                    window.Stats.cachedExpenses = null;
                    window.Stats.viewMode = 'month';
                }
                content.innerHTML = Stats.renderStats();
                await Stats.initCalendar();
                break;
            case 'profile':
                content.innerHTML = Profile.render();
                Profile.init();
                break;
        }
    }
};