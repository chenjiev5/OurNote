// Tab 导航路由
const Router = {
    tabs: [
        { id: 'home', label: '首页', icon: '🏠' },
        { id: 'add', label: '记一笔', icon: '✏️' },
        { id: 'stats', label: '统计', icon: '📊' },
        { id: 'profile', label: '我的', icon: '👤' }
    ],

    // 可滑动的 Tab（排除首页）
    swipeableTabs: [
        { id: 'add', label: '记一笔', icon: '✏️' },
        { id: 'stats', label: '统计', icon: '📊' },
        { id: 'profile', label: '我的', icon: '👤' }
    ],

    currentTab: null,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,
    isHorizontalSwipe: null,
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
        // 监听内容区域的滑动
        const content = document.getElementById('main-content');

        content.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
            this.touchEndX = this.touchStartX;
            this.touchEndY = this.touchStartY;
            this.isHorizontalSwipe = null;
            content.style.transition = 'none';
        }, { passive: true });

        content.addEventListener('touchmove', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;

            // 判断滑动方向
            if (this.isHorizontalSwipe === null) {
                const diffX = Math.abs(this.touchEndX - this.touchStartX);
                const diffY = Math.abs(this.touchEndY - this.touchStartY);
                // 只有水平滑动距离大于垂直距离时才认为是水平滑动
                this.isHorizontalSwipe = diffX > diffY && diffX > 10;
            }

            // 只有水平滑动才移动内容
            if (this.isHorizontalSwipe) {
                const diff = this.touchStartX - this.touchEndX;
                const percent = (diff / window.innerWidth) * 100;
                // 限制最大滑动距离
                const offset = Math.max(-30, Math.min(30, percent));
                content.style.transform = `translateX(${offset}%)`;
            }
        }, { passive: true });

        content.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            content.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            content.style.transform = 'translateX(0)';

            // 只有水平滑动才切换 Tab
            if (this.isHorizontalSwipe) {
                this.handleSwipe();
            }
            this.isHorizontalSwipe = null;
        }, { passive: true });
    },

    // 处理滑动手势
    handleSwipe() {
        const diff = this.touchStartX - this.touchEndX;
        const currentIndex = this.swipeableTabs.findIndex(t => t.id === this.currentTab);

        if (Math.abs(diff) < this.minSwipeDistance) return;

        this.isAnimating = true;

        if (diff > 0) {
            // 向左滑 → 下一个 Tab
            if (currentIndex < this.swipeableTabs.length - 1) {
                this.switchTab(this.swipeableTabs[currentIndex + 1].id);
            } else {
                // 循环回到第一个
                this.switchTab(this.swipeableTabs[0].id);
            }
        } else {
            // 向右滑 → 上一个 Tab
            if (currentIndex > 0) {
                this.switchTab(this.swipeableTabs[currentIndex - 1].id);
            } else {
                // 循环回到最后一个
                this.switchTab(this.swipeableTabs[this.swipeableTabs.length - 1].id);
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

// 确保全局可访问
window.Router = Router;