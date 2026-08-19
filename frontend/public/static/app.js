// --- GLOBAL VARIABLES ---
let DATA_SOURCES = { province: [], district: [], ward: [] };
let AVAILABLE_YEARS = [];
let TIMELINE_DATA = null; // Store merger info
let sessionId = localStorage.getItem('chat_session_id') || crypto.randomUUID();
let currentLang = localStorage.getItem('viemap_lang') || 'vi';
const THEME_KEY = 'viemap_theme';
localStorage.setItem('chat_session_id', sessionId);

function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = nextTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    const btn = document.getElementById('btnThemeToggle');
    if (btn) {
        btn.title = nextTheme === 'dark'
            ? (isEnglish() ? 'Switch to light mode' : 'Chuyển sang chế độ sáng')
            : (isEnglish() ? 'Switch to dark mode' : 'Chuyển sang chế độ tối');
        btn.setAttribute(
            'aria-label',
            isEnglish() ? 'Toggle light/dark mode' : 'Chuyển đổi chế độ sáng/tối'
        );
    }
}

function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme === 'dark' ? 'dark' : 'light');
    applyTheme(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
}

applyTheme(getPreferredTheme());

const UI_EN = {
    navMap: 'Map',
    navMerger: 'Merger info',
    navChat: 'AI chatbot',
    navMemory: 'Map memory',
    navFeedback: 'Feedback',
    btnAdmin: 'Admin',
    feedbackTitle: 'User Feedback & Contribution',
    feedbackDesc: 'Your feedback helps Viemap Chronicle continuously improve. Please submit feedback, feature suggestions, or bug reports via the Google Form below.',
    btnFeedbackFormText: 'Open Feedback Form (Google Form)',
    compareYear: 'Compare year',
    closeCompare: 'Turn off compare',
    searchPlaceholder: 'Search provinces, landmarks, old/new names, English/Vietnamese...',
    clearSearch: 'Clear search',
    backView: 'Back to previous position/year/mode',
    bookmark: 'Save selected place',
    quickPlaces: 'Bookmarks and recent places',
    splitView: 'Compare two years side by side',
    quickTour: 'Website Intro',
    placeInfo: 'Place information',
    choosePlace: 'Select a place on the map to view details.',
    detailsHistory: 'View details and history',
    aiAssistant: 'AI assistant',
    miniContextTitle: 'Area hovered/selected on the map',
    miniGreeting: 'Hello. I can answer questions about the geography and history of the selected place.',
    miniPlaceholder: 'Ask AI about a province/city...',
    localInfo: 'Local information',
    exportJson: 'Export JSON',
    exportPng: 'Export PNG',
    exportPdf: 'Export PDF',
    chooseForData: 'Select a place on the map to load data.',
    timeline: 'Timeline',
    viewProvince: 'Province view',
    viewDistrict: 'District view',
    viewWard: 'Commune view',
    showPronunciation: 'Show province pronunciation',
    hidePronunciation: 'Hide province pronunciation',
    mergerLoading: 'Loading merger data...',
    chatTitle: 'Viemacle AI assistant',
    newChat: 'New conversation',
    selectedOnMap: 'Selected on map:',
    hoveringOnMap: 'Hovering on map:',
    chatGreeting: 'Hello. I am an AI assistant for Vietnamese history and geography. Ask me a question.',
    chatPlaceholder: 'Enter your question, for example: What is the history of Quang Nam?',
    send: 'Send',
    memoryTitle: 'Map memory',
    mapDataset: 'Map dataset',
    memoryMode: 'Practice mode',
    memoryModeMap: 'Click on map',
    memoryModeShape: 'Shape quiz',
    questionSet: 'Question set',
    randomNationwide: 'Random nationwide',
    findPlace: 'Find the place',
    identifyShape: 'Which province/city is this shape?',
    pressStart: 'Press start',
    score: 'Score',
    points: 'points',
    round: 'Round',
    streak: 'Streak',
    best: 'Best',
    start: 'Start',
    hint: 'Hint',
    skip: 'Skip',
    reset: 'Reset',
    memoryFeedbackIdle: 'Choose a data year, then start practicing province/city locations.',
    noAnswers: 'No answers yet.',
    noItems: 'No items.',
    noProvinceMapData: 'No province/city data for the selected year.',
    loadingMemoryMap: 'Loading memory map...',
    memoryMapReady: 'The memory map is ready. Press start to practice.',
    playing: 'Playing',
    correct: 'Correct',
    wrong: 'Wrong',
    chooseOnMapPrompt: 'Click the correct province/city on the map.',
    chooseShapePrompt: 'Look at the province/city shape, then choose one answer.',
    noQuestionsForRegion: 'Not enough province/city data for this question set.',
    notCorrect: 'Not quite. The answer is',
    wrongProvinceSelected: 'The province/city you selected is',
    hintShown: 'Hint shown. A correct answer will lose 2 points.',
    skipped: 'Skipped',
    skippedAnswer: 'Skipped. The answer is',
    complete: 'Complete',
    gameFinished: 'Finished',
    pointsOver: 'points over',
    questions: 'questions',
    memoryMapIdle: 'Choose a year on the left, then press Start to practice province/city locations.',
    memoryMapNote: 'Click directly on a province/city on the map to answer.',
    memoryShapeNote: 'Only the province/city shape is shown. Choose one of the four answers.',
    loadingMap: 'Loading map data...',
    mergerSearch: 'Search...',
    tocTitle: 'Contents (by 2025 merger):',
    provinceTimeline: 'Province/city change history',
    communeMerger2025: 'Commune-level administrative mergers (2025)',
    mergerError: 'An error occurred while loading merger data.',
    noProvinceHistory: 'No province history data yet.',
    noCommuneMerger: 'No commune merger data yet.',
    mergeFromUnits: 'Merge:',
    becomes: 'Into',
    newUnit: 'New unit:',
    mergedFrom: 'Merged from:',
    yearBoundaryNote: 'Note: Event and landmark locations below follow the 2008 administrative boundary dataset.',
    historyEvents: 'Historical events',
    landmarks: 'Landmarks and relics',
    all: 'All',
    allEventTypes: 'All event types',
    allAdminLevels: 'All administrative levels',
    provinceCityLevel: 'Province/city level',
    districtLevel: 'District level',
    communeWardLevel: 'Commune/ward level',
    allRegions: 'All regions',
    northRegion: 'Northern Vietnam',
    centralRegion: 'Central Vietnam and Central Highlands',
    southRegion: 'Southern Vietnam',
    allPeriods: 'All periods',
    before1800: 'Before 1800',
    after1975: 'After 1975',
    noEventGroup: 'No events in this group.',
    unknownTime: 'Unknown time',
    noLocalName: 'Could not identify the local name.',
    loadingDetails: 'Loading details...',
    noProvinceName: 'Could not identify the province name.',
    noHistoryForPlace: 'No historical event data for this place.',
    noSitesForPlace: 'No landmark and relic data for this place.',
    noDetailsForPlace: 'No detailed data for this place.',
    mapYear: 'Map year',
    sourceProvince: 'Source province',
    createdAt: 'Created at',
    noReportPlace: 'No selected place to export.',
    noData: 'No data.',
    relatedVideos: 'Suggested videos',
    watchOnYoutube: 'Open on YouTube',
    seeOnGoogleMaps: 'View on Google Maps',
    typeNatural: 'Natural',
    typeHistorical: 'Historical',
    provinceLabel: 'Province/City',
    districtLabel: 'District',
    wardLabel: 'Commune/Ward',
    yearPrefix: 'year',
    currentlyHover: 'Hovering',
    currentlySelect: 'Selected',
    connectionError: 'Connection error.',
    newConversationStarted: 'Started a new conversation.',
    noName: 'Unknown name',
    tourSkip: 'Skip',
    tourPrev: 'Back',
    tourNext: 'Next',
    tourDone: 'Done',
    noticeTitle: 'Notice & Experience Guidelines',
    noticeDeviceHeading: 'Access Device Recommendation',
    noticeDisclaimerHeading: 'Information Source & Accuracy',
    noticeFeatureHeading: 'Local Information Search Feature',
    chkDontShowText: 'Do not show this notice again',
    btnNoticeConfirm: 'Got it & Explore now',
    btnNotice: 'Notice'
};

function isEnglish() {
    return currentLang === 'en';
}

function tr(key, fallback) {
    return isEnglish() ? (UI_EN[key] || fallback || key) : (fallback || key);
}

function getApiUrl(path) {
    let baseUrl = '';
    if (window.NEXT_PUBLIC_API_BASE_URL) {
        baseUrl = window.NEXT_PUBLIC_API_BASE_URL;
    } else if (typeof window !== 'undefined' && (window.location.port === '3000' || window.location.port === '3001')) {
        baseUrl = `${window.location.protocol}//${window.location.hostname}:5050`;
    }
    if (!path) return baseUrl;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/')) return `${baseUrl}${path}`;
    return `${baseUrl}/${path}`;
}

function localizedUrl(url) {
    const fullUrl = getApiUrl(url);
    const sep = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${sep}lang=${encodeURIComponent(currentLang)}`;
}

// --- INITIALIZATION ---
async function initApp() {
    document.getElementById('loading').style.display = 'flex';
    try {
        // Record visitor analytics
        fetch(getApiUrl('/api/visitor/track'), { method: 'POST' }).catch(() => { });

        // Check admin logged in statuskhi
        if (localStorage.getItem('admin_token')) {
            document.getElementById('btnAdminModal')?.classList.add('logged-in');
        }

        const btnAdmin = document.getElementById('btnAdminModal');
        if (btnAdmin) {
            btnAdmin.onclick = function (e) {
                if (e) e.preventDefault();
                openAdminModal();
            };
        }

        applyLanguageToStaticDom();
        getActiveChatSession();
        renderSessionMessages(sessionId);
        renderChatHistoryList();

        // Fetch Config & Timeline Data in parallel
        const [configRes, timelineRes] = await Promise.all([
            fetch(localizedUrl('/api/config')),
            fetch(localizedUrl('/api/history/timeline_index.json'))
        ]);

        const config = await configRes.json();
        AVAILABLE_YEARS = config.years;
        DATA_SOURCES = config.files;

        if (timelineRes.ok) {
            TIMELINE_DATA = await timelineRes.json();
        }

        setupTimeline();
        setupEventTimeline();
        setupCompareYearOptions();
        setupQuickMapTools();
        setupControlPanelObserver();
        setupMemoryTab();
        updateMap();
        loadMergerTab(); // We can pass cached TIMELINE_DATA if we want, or let it handle itself
        toggleInfoBox(false);
        toggleMiniChat(false);

        // Auto show welcome notice modal unless suppressed by user preference
        if (localStorage.getItem('viemap_hide_welcome_notice') !== 'true') {
            openNoticeModal();
        }

    } catch (e) {
        console.error("Init Error:", e);
        alert(tr('connectionError', "Không thể kết nối đến máy chủ. Vui lòng thử lại sau."));
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function setText(selector, key, fallback) {
    const el = document.querySelector(selector);
    if (el) el.textContent = tr(key, fallback);
}

function setHtml(selector, htmlVi, htmlEn) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = isEnglish() ? htmlEn : htmlVi;
}

function setAttr(selector, attr, key, fallback) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, tr(key, fallback));
}

function setRadioLabel(selector, key, fallback) {
    const el = document.querySelector(selector);
    const input = el?.querySelector('input');
    if (!el || !input) return;
    input.checked = viewMode === input.value;
    el.textContent = '';
    el.appendChild(input);
    el.append(` ${tr(key, fallback)}`);
}

function applyLanguageToStaticDom() {
    document.documentElement.lang = currentLang;
    document.body.classList.toggle('lang-en', isEnglish());
    applyTheme(document.documentElement.getAttribute('data-theme') || getPreferredTheme());
    document.getElementById('btnLangVi')?.classList.toggle('active', !isEnglish());
    document.getElementById('btnLangEn')?.classList.toggle('active', isEnglish());

    setHtml('.nav-item[data-tab="map"], .nav-item[onclick*="map"]', '<i class="fas fa-globe-asia" style="margin-right:8px"></i> Bản đồ', '<i class="fas fa-globe-asia" style="margin-right:8px"></i> Map');
    setHtml('.nav-item[data-tab="merger"], .nav-item[onclick*="merger"]', '<i class="fas fa-book-atlas" style="margin-right:8px"></i> Thông tin Sáp nhập', '<i class="fas fa-book-atlas" style="margin-right:8px"></i> Merger info');
    setHtml('.nav-item[data-tab="chat"], .nav-item[onclick*="chat"]', '<i class="fas fa-robot" style="margin-right:8px"></i> Chatbot AI', '<i class="fas fa-robot" style="margin-right:8px"></i> AI chatbot');
    setHtml('.nav-item[data-tab="memory"], .nav-item[onclick*="memory"]', '<i class="fas fa-puzzle-piece" style="margin-right:8px"></i> Ghi nhớ bản đồ', '<i class="fas fa-puzzle-piece" style="margin-right:8px"></i> Map memory');
    setHtml('.nav-item[data-tab="feedback"], .nav-item[onclick*="feedback"]', '<i class="fas fa-comment-dots" style="margin-right:8px"></i> <span id="navFeedbackText">' + tr('navFeedback', 'Góp ý') + '</span>', '<i class="fas fa-comment-dots" style="margin-right:8px"></i> <span id="navFeedbackText">' + tr('navFeedback', 'Feedback') + '</span>');
    setText('#btnAdminText', 'btnAdmin', 'Admin');
    setText('#feedbackTitle', 'feedbackTitle', 'Đóng góp ý kiến & Phản hồi');
    setText('#feedbackDesc', 'feedbackDesc', 'Ý kiến đóng góp của bạn giúp ứng dụng Viemap Chronicle ngày càng hoàn thiện hơn. Hãy gửi phản hồi, góp ý tính năng hoặc báo lỗi cho chúng tôi qua mẫu Google Form dưới đây.');
    setText('#btnFeedbackFormText', 'btnFeedbackFormText', 'Mở Form Đóng góp ý kiến (Google Form)');

    setHtml('#btnToggleHistory', '<i class="fas fa-history"></i> <span id="txtHistoryToggle">' + (isEnglish() ? 'Chat History' : 'Lịch sử chat') + '</span>');
    setHtml('#txtChatHeader', 'Trợ lý AI Viemacle', 'Viemacle AI assistant');
    setHtml('#txtNewChat', 'Cuộc trò chuyện mới', 'New conversation');
    setHtml('#txtSidebarHistoryTitle', 'Lịch sử trò chuyện', 'Chat History');
    setAttr('#chatHistorySearch', 'placeholder', null, isEnglish() ? 'Search history...' : 'Tìm kiếm lịch sử...');
    setHtml('#txtSendBtn', 'Gửi', 'Send');

    setHtml('.compare-header span', '<i class="fas fa-columns"></i> So sánh năm', '<i class="fas fa-columns"></i> Compare year');
    setAttr('.compare-header .icon-btn', 'title', 'closeCompare', 'Tắt so sánh');
    setAttr('#smartSearchInput', 'placeholder', 'searchPlaceholder', 'Tìm tỉnh, địa danh, tên cũ/mới, English/VN...');
    setAttr('#btnClearSearch', 'title', 'clearSearch', 'Xóa tìm kiếm');
    setAttr('#btnBackView', 'title', 'backView', 'Quay lại vị trí/năm/chế độ trước đó');
    setAttr('#btnBookmarkPlace', 'title', 'bookmark', 'Lưu địa phương đang chọn');
    setAttr('#btnQuickPlaces', 'title', 'quickPlaces', 'Bookmark và lịch sử gần đây');
    setAttr('#btnQuickTour', 'title', 'quickTour', 'Trợ giúp');
    setHtml('#btnQuickTour', '<i class="fas fa-circle-info"></i> <span id="btnTourText">' + tr('quickTour', 'Trợ giúp') + '</span>', '<i class="fas fa-circle-info"></i> <span id="btnTourText">' + tr('quickTour', 'Website Intro') + '</span>');
    setHtml('#btnNoticeModalTrigger', '<i class="fas fa-bullhorn"></i>', '<i class="fas fa-bullhorn"></i>');
    setAttr('#btnNoticeModalTrigger', 'title', null, (typeof isEnglish === 'function' && isEnglish()) ? 'Notice & Experience Guidelines' : 'Lưu ý & Khuyến cáo sử dụng');
    
    // Notice Modal translations
    setHtml('#noticeModalTitle', 'Lưu Ý & Khuyến Cáo Trải Nghiệm', 'Notice & Experience Guidelines');
    setText('#noticeDeviceHeading', 'noticeDeviceHeading', 'Khuyến cáo thiết bị truy cập');
    setHtml('#noticeDeviceText',
        'Nên sử dụng <strong>máy tính (PC / Laptop)</strong> để có trải nghiệm tốt nhất. Nếu truy cập bằng <strong>điện thoại di động</strong>, vui lòng chuyển trình duyệt sang <strong>"Chế độ máy tính" (Desktop site)</strong>.',
        'For the best experience, access via a <strong>computer (PC / Laptop)</strong> is recommended. On <strong>mobile devices</strong>, please enable <strong>"Desktop site" mode</strong>.'
    );
    setText('#noticeDisclaimerHeading', 'noticeDisclaimerHeading', 'Nguồn thông tin & Độ chính xác');
    setHtml('#noticeDisclaimerText',
        'Thông tin sản phẩm do <strong>tác giả tự tổng hợp và đăng tải</strong> nên có thể mắc một số sai sót. Các nội dung mang tính chất tham khảo.',
        'Product information is <strong>self-compiled and published by the author</strong>, so errors may exist. All contents are for reference purposes only.'
    );
    setText('#noticeFeatureHeading', 'noticeFeatureHeading', 'Tính năng tra cứu thông tin địa phương');
    setHtml('#noticeFeatureText',
        'Hoạt động tốt nhất và đầy đủ dữ liệu nhất khi đặt mốc thời gian bản đồ ở <strong>năm 2008</strong>.',
        'Works best and has complete data when setting the map timeline to <strong>2008</strong>.'
    );
    setText('#chkDontShowText', 'chkDontShowText', 'Không hiển thị lại thông báo này');
    setHtml('#btnNoticeConfirmText', 'Đã hiểu & Trải nghiệm ngay', 'Got it & Explore now');

    setHtml('#infoBox h3', '<i class="fas fa-map-marker-alt"></i> Thông tin địa điểm', '<i class="fas fa-map-marker-alt"></i> Place information');
    const infoContent = document.getElementById('infoContent');
    if (infoContent && !selectedFeature) {
        infoContent.innerHTML = `<div style="color: #95a5a6; font-style: italic;">${tr('choosePlace', 'Chọn một điểm trên bản đồ để xem thông tin chi tiết.')}</div>`;
    }
    setHtml('#btnShowHistory', '<i class="fas fa-info-circle"></i> Xem chi tiết & Lịch sử', '<i class="fas fa-info-circle"></i> View details and history');
    setHtml('.mini-chat-header span', '<i class="fas fa-robot"></i> Trợ lý AI', '<i class="fas fa-robot"></i> AI assistant');
    setAttr('#miniChatMapContext', 'title', 'miniContextTitle', 'Vùng đang chỉ/chọn trên bản đồ', 'Selected map area');
    setAttr('#miniChatInput', 'placeholder', 'miniPlaceholder', 'Hỏi AI về tỉnh/thành...', 'Ask AI about place...');
    setAttr('#miniChatMaximizeBtn', 'title', null, (typeof isEnglish === 'function' && isEnglish()) ? (miniChatIsMaximized ? 'Restore size' : 'Maximize chat') : (miniChatIsMaximized ? 'Thu nhỏ về kích thước cũ' : 'Phóng to / Thu nhỏ khung chatbot'));
    setAttr('#miniChatResetBtn', 'title', null, (typeof isEnglish === 'function' && isEnglish()) ? 'Reset size' : 'Đặt lại kích thước mặc định');
    const miniMessages = document.getElementById('miniChatMessages');
    if (miniMessages && miniMessages.children.length <= 1) {
        miniMessages.innerHTML = `<div class="mini-chat-message ai">${tr('miniGreeting', 'Xin chào! Tôi có thể giải đáp thắc mắc về địa lý và lịch sử của địa phương bạn đang chọn.')}</div>`;
    }
    setHtml('.slide-header h3', '<i class="fas fa-file-alt"></i> Thông tin Địa phương', '<i class="fas fa-file-alt"></i> Local information');
    const sidePanelContent = document.getElementById('sidePanelContent');
    if (sidePanelContent && !currentDetailReport) {
        sidePanelContent.innerHTML = `<p style="text-align:center; color:#7f8c8d; margin-top:20px;">${tr('chooseForData', 'Vui lòng chọn một địa điểm trên bản đồ để tải dữ liệu.')}</p>`;
    }
    setAttr('.slide-actions .panel-action-btn:nth-child(1)', 'title', 'exportJson', 'Xuất JSON');
    setAttr('.slide-actions .panel-action-btn:nth-child(2)', 'title', 'exportPng', 'Xuất PNG');
    setAttr('.slide-actions .panel-action-btn:nth-child(3)', 'title', 'exportPdf', 'Xuất PDF');
    setText('.header-info h2', 'timeline', 'Dòng thời gian');
    setRadioLabel('#lblProvince', 'viewProvince', 'Xem Tỉnh');
    setRadioLabel('#lblDistrict', 'viewDistrict', 'Xem Huyện');
    setRadioLabel('#lblWard', 'viewWard', 'Xem Xã');
    setHtml('#tabChat .chat-header h2', '<i class="fas fa-brain"></i> Trợ lý AI Viemacle', '<i class="fas fa-brain"></i> Viemacle AI assistant');
    setHtml('.btn-new-chat', '<i class="fas fa-redo"></i> Cuộc trò chuyện mới', '<i class="fas fa-redo"></i> New conversation');
    setText('#chatMapContextLabel', 'selectedOnMap', 'Đang chọn trên bản đồ:');
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages && chatMessages.children.length <= 1) {
        chatMessages.innerHTML = `<div class="message ai">${tr('chatGreeting', 'Xin chào! Tôi là AI hỗ trợ tìm hiểu về Lịch sử và Địa lý Việt Nam. Hãy đặt câu hỏi cho tôi nhé!')}</div>`;
    }
    setAttr('#chatInput', 'placeholder', 'chatPlaceholder', 'Nhập câu hỏi của bạn (VD: Lịch sử tỉnh Quảng Nam?)...');
    setHtml('#tabChat .chat-input-area .btn-send', '<i class="fas fa-paper-plane"></i> Gửi', '<i class="fas fa-paper-plane"></i> Send');
    setHtml('.memory-title', '<i class="fas fa-puzzle-piece"></i> Ghi nhớ bản đồ', '<i class="fas fa-puzzle-piece"></i> Map memory');
    setText('label[for="memoryYearSelect"]', 'mapDataset', 'Bộ bản đồ');
    setText('#memoryModeLabel', 'memoryMode', 'Chế độ luyện tập');
    setText('#memoryRegionLabel', 'questionSet', 'Bộ câu hỏi');
    setText('#memoryTargetLabel', memoryMode === 'shape' ? 'identifyShape' : 'findPlace', memoryMode === 'shape' ? 'Đây là tỉnh/thành nào?' : 'Hãy tìm địa phương');
    const memoryModeSelect = document.getElementById('memoryModeSelect');
    if (memoryModeSelect) {
        const mapOption = memoryModeSelect.querySelector('option[value="map"]');
        const shapeOption = memoryModeSelect.querySelector('option[value="shape"]');
        if (mapOption) mapOption.textContent = tr('memoryModeMap', 'Chọn trên bản đồ');
        if (shapeOption) shapeOption.textContent = tr('memoryModeShape', 'Trắc nghiệm hình dạng tỉnh');
    }
    const memoryRegionSelect = document.getElementById('memoryRegionSelect');
    if (memoryRegionSelect) {
        const labels = {
            all: tr('randomNationwide', 'Toàn quốc'),
            north: tr('northRegion', 'Miền Bắc'),
            central: tr('centralRegion', 'Miền Trung'),
            south: tr('southRegion', 'Miền Nam')
        };
        Array.from(memoryRegionSelect.options).forEach(option => {
            option.textContent = labels[option.value] || option.textContent;
        });
    }
    setText('.memory-stats .memory-stat:nth-child(1) span', 'score', 'Điểm');
    setText('.memory-stats .memory-stat:nth-child(2) span', 'round', 'Câu');
    setText('.memory-stats .memory-stat:nth-child(3) span', 'streak', 'Chuỗi đúng');
    setText('.memory-stats .memory-stat:nth-child(4) span', 'best', 'Kỷ lục');
    setHtml('.memory-actions #memoryStartBtn', '<i class="fas fa-play"></i> Bắt đầu', '<i class="fas fa-play"></i> Start');
    setHtml('.memory-actions #memoryHintBtn', '<i class="fas fa-lightbulb"></i> Gợi ý', '<i class="fas fa-lightbulb"></i> Hint');
    setHtml('.memory-actions #memorySkipBtn', '<i class="fas fa-forward"></i> Bỏ qua', '<i class="fas fa-forward"></i> Skip');
    setHtml('.memory-actions button:nth-child(4)', '<i class="fas fa-rotate-left"></i> Làm lại', '<i class="fas fa-rotate-left"></i> Reset');
    const memoryFeedback = document.getElementById('memoryFeedback');
    if (memoryFeedback && !memoryGameActive) memoryFeedback.textContent = tr('memoryFeedbackIdle', 'Chọn năm dữ liệu rồi bắt đầu luyện nhớ vị trí tỉnh/thành.');
    const memoryResults = document.getElementById('memoryResults');
    if (memoryResults && memoryResults.children.length === 1) {
        memoryResults.innerHTML = `<div style="color:#8a988a; font-style:italic;">${tr('noAnswers', 'Chưa có lượt trả lời.')}</div>`;
    }
    const memoryMapIdle = document.querySelector('#memoryMapIdle p');
    if (memoryMapIdle) memoryMapIdle.textContent = tr('memoryMapIdle', 'Chọn năm ở cột bên trái, rồi nhấn Bắt đầu để luyện ghi nhớ vị trí tỉnh/thành.');
    setText('#memoryMapNote', 'memoryMapNote', 'Bấm trực tiếp vào tỉnh/thành trên bản đồ để trả lời.');
    setText('#btnGuestEn2025', provinceLabelMode2025 === 'fun' ? 'hidePronunciation' : 'showPronunciation', provinceLabelMode2025 === 'fun' ? 'Ẩn phiên âm tên tỉnh' : 'Hiện phiên âm tên tỉnh');
    setAttr('#btnGuestEn2025', 'title', 'showPronunciation', 'Hiện phiên âm vui cho tên tỉnh/thành năm 2025');
    const loadingText = document.querySelector('#loading div');
    if (loadingText) loadingText.textContent = tr('loadingMap', 'Đang tải dữ liệu bản đồ...');
    syncGuestEnButtonVisibility();
}

async function setLanguage(lang) {
    const nextLang = lang === 'en' ? 'en' : 'vi';
    if (currentLang === nextLang) return;
    currentLang = nextLang;
    localStorage.setItem('viemap_lang', currentLang);
    sessionId = crypto.randomUUID();
    localStorage.setItem('chat_session_id', sessionId);
    provinceLabelMode2025 = 'vn';
    localStorage.setItem('province_label_mode_2025', provinceLabelMode2025);
    const chatMessages = document.getElementById('chatMessages');
    const miniMessages = document.getElementById('miniChatMessages');
    if (chatMessages) chatMessages.innerHTML = '';
    if (miniMessages) miniMessages.innerHTML = '';
    applyLanguageToStaticDom();

    document.getElementById('loading').style.display = 'flex';
    try {
        const [configRes, timelineRes] = await Promise.all([
            fetch(localizedUrl('/api/config')),
            fetch(localizedUrl('/api/history/timeline_index.json'))
        ]);
        const config = await configRes.json();
        AVAILABLE_YEARS = config.years;
        DATA_SOURCES = config.files;
        if (timelineRes.ok) TIMELINE_DATA = await timelineRes.json();
        setupTimeline();
        setupEventTimeline();
        setupCompareYearOptions();
        setupMemoryTab();
        await updateMap();
        loadMergerTab();
        if (selectedFeature) updateInfoBox(selectedFeature.feat.properties);
        updateMapContextUI();
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Helper to find constituent provinces for year 2025+
function getConstituentProvinces(provName, year) {
    if (year < 2025 || !TIMELINE_DATA) return [provName];

    // Normalize current province name for comparison
    const normProv = normalizeFileName(provName).replace('.json', '').toLowerCase();

    // Find the 2025 merger event
    const mergerEvent = TIMELINE_DATA.find(item => item.year === 2025);
    if (!mergerEvent || !mergerEvent.changes) return [provName];

    // Look for a change where 'to' contains our province
    const change = mergerEvent.changes.find(c => {
        // Check if any destination name matches the selected province
        return c.to.some(destName => {
            const normDest = normalizeFileName(destName).replace('.json', '').toLowerCase();
            return normDest === normProv;
        });
    });

    if (change) {
        return change.from; // Return list of original provinces (e.g., ["Gia Lai", "Bình Định"])
    }

    return [provName];
}

// --- MERGER TAB LOGIC ---
async function loadMergerTab() {
    const container = document.getElementById('mergerContainer');

    try {
        // Use cached TIMELINE_DATA if available, else fetch
        let timelineData = TIMELINE_DATA;
        if (!timelineData) {
            const res = await fetch(localizedUrl('/api/history/timeline_index.json'));
            timelineData = await res.json();
        }
        const communeRes = await fetch(localizedUrl('/api/merger/communes'));

        // 1. SIDEBAR
        let sidebarHtml = `
                    <div class="merger-sidebar" id="mergerSidebar">
                        <div class="search-container">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" id="mergerSearch" class="search-bar" placeholder="${tr('mergerSearch', 'Tìm kiếm...')}" onkeyup="filterMergerData()">
                        </div>
                        <div id="mergerTOC" class="merger-toc">
                            <div class="toc-title">
                                <div class="toc-header-row">
                                    <span><i class="fas fa-list-ul"></i> ${tr('tocTitle', 'Mục lục (theo lần sáp nhập năm 2025):')}</span>
                                    <button type="button" class="btn-toggle-merger-sidebar" onclick="toggleMergerSidebar(false)" title="${tr('hideToc', 'Ẩn mục lục')}">
                                        <i class="fas fa-times"></i> <span class="btn-hide-label">Ẩn</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

        // 2. MAIN CONTENT
        let mainContentHtml = `<div class="merger-main-content">
            <div class="merger-top-actions">
                <button type="button" id="btnShowMergerSidebar" class="btn-show-merger-toc" onclick="toggleMergerSidebar(true)">
                    <i class="fas fa-list-ul"></i> <span>${tr('showToc', 'Hiện mục lục sáp nhập')}</span>
                </button>
            </div>`;
        let tocItemsHtml = '';

        // --- SECTION: PROVINCIAL TIMELINE ---
        mainContentHtml += `<div class="main-section-title"><i class="fas fa-history"></i> ${tr('provinceTimeline', 'Lịch sử Thay đổi Tỉnh/Thành phố')}</div>`;

        if (timelineData && Array.isArray(timelineData) && timelineData.length > 0) {
            timelineData.forEach(item => {
                let typeStr = item.type || '';
                const tLower = typeStr.toLowerCase();
                const isMerge = tLower.includes('merge') || tLower.includes('nhập');

                if (item.year === 1976 && isMerge) return;

                mainContentHtml += `
                        <div class="timeline-card">
                            <div><span class="timeline-year">${item.year}</span></div>
                            <div class="timeline-title">${item.title}</div>
                            <div class="timeline-desc">${item.description}</div>`;

                if (item.changes && Array.isArray(item.changes) && item.changes.length > 0) {
                    mainContentHtml += `<ul class="change-list">`;
                    item.changes.forEach(change => {
                        if (typeof change === 'object' && change.from && change.to) {
                            mainContentHtml += `<li><strong>${change.from.join(', ')}</strong> &rarr; <strong>${change.to.join(', ')}</strong></li>`;
                        } else {
                            mainContentHtml += `<li>${change}</li>`;
                        }
                    });
                    mainContentHtml += `</ul>`;
                }
                mainContentHtml += `</div>`;
            });
        } else {
            mainContentHtml += `<p style="text-align:center; color:#666;">${tr('noProvinceHistory', 'Chưa có dữ liệu lịch sử tỉnh.')}</p>`;
        }

        // --- SECTION: COMMUNE MERGER 2025 ---
        mainContentHtml += `<div class="main-section-title mt-large"><i class="fas fa-random"></i> ${tr('communeMerger2025', 'Sáp nhập Hành chính Cấp Xã (Năm 2025)')}</div>`;

        if (communeRes.ok) {
            const communeData = await communeRes.json();
            const provinces = Object.keys(communeData).sort((a, b) => a.localeCompare(b, 'vi'));

            if (provinces.length === 0) {
                mainContentHtml += `<p style="text-align:center; color:#666; font-style:italic;">${tr('noCommuneMerger', 'Chưa có dữ liệu sáp nhập xã.')}</p>`;
            } else {
                provinces.forEach((provName, index) => {
                    const provId = `merger-prov-${index}`;
                    tocItemsHtml += `<a href="#${provId}" class="toc-item"><span class="guest-prov-label" data-vn-prov="${escapeHtml(provName)}">${escapeHtml(provName)}</span></a>`;

                    mainContentHtml += `<div id="${provId}" class="merger-province-group">`;
                    mainContentHtml += `<div class="merger-province-header"><i class="fas fa-map-marked-alt"></i> <span class="guest-prov-label" data-vn-prov="${escapeHtml(provName)}">${escapeHtml(provName)}</span></div>`;

                    const changes = communeData[provName];
                    changes.forEach(change => {
                        mainContentHtml += `<div class="commune-change-card"><div class="change-flow">`;
                        mainContentHtml += `<div class="unit-group"><div class="unit-label">${tr('mergeFromUnits', 'Sáp nhập:')}</div>`;
                        change.from.forEach(f => {
                            mainContentHtml += `<div class="unit-badge"><i class="far fa-dot-circle"></i> ${f.commune} <small>(${f.district})</small></div>`;
                        });
                        mainContentHtml += `</div>`;
                        mainContentHtml += `<div class="arrow-section"><div class="arrow-icon"><i class="fas fa-long-arrow-alt-right"></i></div><div class="arrow-text">${tr('becomes', 'Thành')}</div></div>`;
                        mainContentHtml += `<div class="dest-group"><div class="unit-label">${tr('newUnit', 'Đơn vị mới:')}</div>`;
                        mainContentHtml += `<div class="dest-badge">${change.to.commune}</div>`;
                        mainContentHtml += `</div></div></div>`;
                    });
                    mainContentHtml += `</div>`;
                });
            }
        }

        mainContentHtml += `</div>`; // End Main Content Wrapper
        container.innerHTML = sidebarHtml + mainContentHtml;
        document.getElementById('mergerTOC').innerHTML += tocItemsHtml;
        refreshGuestLabelsInMergerDom();

        // Setup click listeners for TOC items on mobile to auto-close drawer after jumping
        const tocItems = document.querySelectorAll('#mergerTOC .toc-item');
        tocItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    toggleMergerSidebar(false);
                }
            });
        });

        // Restore sidebar state or auto-close on mobile screen by default
        try {
            const isClosedSaved = localStorage.getItem('viemap_merger_toc_closed');
            const isMobile = window.innerWidth <= 768;
            if (isClosedSaved === 'true' || (isClosedSaved === null && isMobile)) {
                toggleMergerSidebar(false);
            } else {
                toggleMergerSidebar(true);
            }
        } catch(e) {}

    } catch (e) {
        console.error("Merger Tab Error:", e);
        container.innerHTML = `<p style="text-align:center; color:red; padding:20px;">${tr('mergerError', 'Có lỗi xảy ra khi tải dữ liệu sáp nhập.')}<br>${e.message}</p>`;
    }
}

function toggleMergerSidebar(show) {
    const sidebar = document.getElementById('mergerSidebar') || document.querySelector('.merger-sidebar');
    const btnShow = document.getElementById('btnShowMergerSidebar');
    if (!sidebar) return;

    if (typeof show === 'boolean') {
        if (show) {
            sidebar.classList.remove('closed');
        } else {
            sidebar.classList.add('closed');
        }
    } else {
        sidebar.classList.toggle('closed');
    }

    const isClosed = sidebar.classList.contains('closed');
    const isMobile = window.innerWidth <= 768;
    if (btnShow) {
        btnShow.style.display = (isClosed || isMobile) ? 'inline-flex' : 'none';
    }

    try {
        localStorage.setItem('viemap_merger_toc_closed', isClosed ? 'true' : 'false');
    } catch (e) {}
}

function scrollMergerContentTo(target) {
    const mainContent = document.querySelector('#tabMerger .merger-main-content');
    if (!mainContent || !target) return;

    requestAnimationFrame(() => {
        const containerRect = mainContent.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const targetTop = targetRect.top - containerRect.top + mainContent.scrollTop - 12;
        mainContent.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
        });
    });
}

// Search Function
function filterMergerData() {
    const input = document.getElementById('mergerSearch');
    const rawFilter = input ? input.value.trim() : '';
    const filter = normalizeSmartText(rawFilter);
    const provGroups = document.getElementsByClassName('merger-province-group');
    let firstMatchedElement = null;

    for (let i = 0; i < provGroups.length; i++) {
        const group = provGroups[i];
        const header = group.getElementsByClassName('merger-province-header')[0];
        const headerText = header ? (header.textContent || header.innerText) : '';
        const vnSpan = header ? header.querySelector('[data-vn-prov]') : null;
        const vnProv = vnSpan ? vnSpan.getAttribute('data-vn-prov') : '';
        let headerMatch = !filter || smartTextIncludes(headerText, rawFilter);
        if (!headerMatch && vnProv) {
            const guest = getProvinceGuestDisplayName(vnProv);
            if (guest && guest !== vnProv && smartTextIncludes(guest, rawFilter)) headerMatch = true;
        }

        if (headerMatch) {
            group.style.display = "";
            const cards = group.getElementsByClassName('commune-change-card');
            for (let j = 0; j < cards.length; j++) cards[j].style.display = "";
            if (filter && !firstMatchedElement) firstMatchedElement = group;
            continue;
        }

        let hasMatchInGroup = false;
        const cards = group.getElementsByClassName('commune-change-card');
        for (let j = 0; j < cards.length; j++) {
            const card = cards[j];
            const txtValue = card.textContent || card.innerText;
            if (smartTextIncludes(txtValue, rawFilter)) {
                card.style.display = "";
                hasMatchInGroup = true;
                if (!firstMatchedElement) firstMatchedElement = card;
            } else {
                card.style.display = "none";
            }
        }
        group.style.display = hasMatchInGroup ? "" : "none";
    }

    if (filter && firstMatchedElement) {
        scrollMergerContentTo(firstMatchedElement);
    }
}

// --- MAP LOGIC ---
function setupTimeline() {
    const tl = document.getElementById('timeline');
    const ticks = document.getElementById('timelineTicks');
    const display = document.getElementById('yearValue');

    if (AVAILABLE_YEARS.length === 0) {
        display.innerText = "N/A";
        tl.disabled = true;
        return;
    }

    tl.min = 0;
    tl.max = AVAILABLE_YEARS.length - 1;

    let defaultIndex = AVAILABLE_YEARS.indexOf(2025);
    if (defaultIndex === -1) defaultIndex = AVAILABLE_YEARS.length > 0 ? AVAILABLE_YEARS.length - 1 : 0;
    tl.value = defaultIndex;

    let ticksHtml = '';
    AVAILABLE_YEARS.forEach(y => { ticksHtml += `<span>${y}</span>`; });
    ticks.innerHTML = ticksHtml;
    display.innerText = AVAILABLE_YEARS[defaultIndex];
}

const map = L.map('map', { zoomControl: false }).setView([16.047079, 108.206230], 6);
//L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
//L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://mt0.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}', {
    maxZoom: 21,
    attribution: 'Map data &copy; Google',
    crossOrigin: true
}).addTo(map);

// Thanh tỷ lệ
L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(map);
map.createPane('provincePane'); map.getPane('provincePane').style.zIndex = 350;
map.createPane('districtPane'); map.getPane('districtPane').style.zIndex = 400;
map.createPane('wardPane'); map.getPane('wardPane').style.zIndex = 450;
map.createPane('borderPane'); map.getPane('borderPane').style.zIndex = 500;
map.createPane('highlightPane'); map.getPane('highlightPane').style.zIndex = 600;
map.getContainer().addEventListener('mouseleave', () => {
    if (hoveredFeature) {
        hoveredFeature = null;
        updateMapContextUI();
    }
});

let layers = { province: null, district: null, ward: null, border: null };
let viewMode = 'province';
let selectedFeature = null;
let hoveredFeature = null;
let memoryMap = null;
let memoryProvinceLayer = null;
let memoryFeatures = [];
let memoryQuestions = [];
let memoryCurrent = null;
let memoryGameActive = false;
let memoryAcceptingAnswer = false;
let memoryScore = 0;
let memoryRound = 0;
let memoryStreak = 0;
let memoryTotalRounds = 10;
let memoryHintUsed = false;
let memoryMode = 'map';
let memoryRegion = 'all';
const memoryDataCache = {};
const mapDataCache = {}; // Cache client-side cho tất cả file bản đồ đã tải
let compareMap = null;
let compareLayers = { province: null, district: null, ward: null, border: null };
let splitViewEnabled = false;
let suppressViewHistory = false;
let viewHistoryStack = [];
let searchDebounceTimer = null;
let timelineHighlightedLayers = [];
let activeTimelineIndex = null;
let currentDetailReport = null;
let currentTourIndex = 0;
const BOOKMARKS_KEY = 'viemap_bookmarks';
const RECENT_PLACES_KEY = 'viemap_recent_places';
const MAX_RECENT_PLACES = 10;
const MAX_VIEW_HISTORY = 12;
const PROVINCE_STANDARD_EN_2025 = {};
const PROVINCE_REGION_MAP = {};
const REGION_PROVINCES = {
    north: [
        'Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Bắc Giang', 'Hưng Yên',
        'Hải Dương', 'Thái Bình', 'Nam Định', 'Ninh Bình', 'Hà Nam', 'Vĩnh Phúc',
        'Lào Cai', 'Yên Bái', 'Lai Châu', 'Điện Biên', 'Sơn La', 'Hòa Bình',
        'Phú Thọ', 'Tuyên Quang', 'Hà Giang', 'Thái Nguyên', 'Bắc Kạn',
        'Cao Bằng', 'Lạng Sơn'
    ],
    central: [
        'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Trị', 'Huế', 'Thừa Thiên Huế',
        'Quảng Bình', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định',
        'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận', 'Kon Tum',
        'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng'
    ],
    south: [
        'Đồng Nai', 'Bình Phước', 'Tây Ninh', 'Bình Dương', 'Bà Rịa - Vũng Tàu',
        'Bà Rịa Vũng Tàu', 'Đồng Tháp', 'Long An', 'Tiền Giang', 'Bến Tre',
        'Trà Vinh', 'An Giang', 'Kiên Giang', 'TP. Hồ Chí Minh',
        'Thành phố Hồ Chí Minh', 'Hồ Chí Minh', 'Vĩnh Long', 'Cần Thơ',
        'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau'
    ]
};
const TOUR_STEPS = [
    {
        selector: '.nav-tabs',
        title: { vi: 'Điều hướng chính', en: 'Main navigation' },
        text: {
            vi: 'Bốn tab chính chia website thành bản đồ tương tác, thông tin sáp nhập, chatbot AI và trò luyện ghi nhớ bản đồ.',
            en: 'The four main tabs split the site into the interactive map, merger information, AI chatbot, and map memory practice.'
        }
    },
    {
        tab: 'map',
        selector: '.smart-search',
        title: { vi: 'Tìm kiếm thông minh', en: 'Smart search' },
        text: {
            vi: 'Gõ tên tỉnh, địa danh, tên cũ/tên mới hoặc cách viết tiếng Anh để nhảy nhanh tới vùng liên quan.',
            en: 'Search by province, landmark, old/new name, or English/Vietnamese spelling to jump to matching places.'
        }
    },
    {
        tab: 'map',
        selector: '.map-quick-toolbar',
        title: { vi: 'Công cụ nhanh trên bản đồ', en: 'Quick map tools' },
        text: {
            vi: 'Dùng các nút này để quay lại góc nhìn trước, lưu địa phương, mở bookmark/gần đây, so sánh hai năm hoặc chạy lại tour.',
            en: 'Use these buttons to restore the previous view, save a place, open bookmarks/recent places, compare two years, or rerun this tour.'
        }
    },
    {
        tab: 'map',
        selector: '.control-panel',
        position: 'top',
        title: { vi: 'Dòng thời gian và lớp bản đồ', en: 'Timeline and map layers' },
        text: {
            vi: 'Kéo mốc năm, chọn cấp tỉnh/huyện/xã và bấm các mốc sự kiện để xem thay đổi hành chính theo thời gian.',
            en: 'Move through years, switch province/district/commune layers, and select event chips to inspect administrative changes over time.'
        }
    },
    {
        tab: 'map',
        selector: '#infoBox',
        title: { vi: 'Thông tin địa phương', en: 'Place details' },
        text: {
            vi: 'Khi chọn một vùng trên bản đồ, khung này hiển thị thông tin nhanh và mở phần lịch sử, địa danh, nguồn và xuất báo cáo.',
            en: 'After you select a map area, this panel shows quick facts and opens history, landmarks, sources, and export tools.'
        }
    },
    {
        tab: 'map',
        selector: '#miniChatWidget',
        openMiniChat: true,
        title: { vi: 'Trợ lý AI có ngữ cảnh bản đồ', en: 'Map-aware AI assistant' },
        text: {
            vi: 'Mini chat hiểu vùng bạn đang chỉ hoặc đã chọn, nên có thể hỏi nhanh kiểu "ở đây có gì nổi bật?".',
            en: 'The mini chat understands the area you are hovering or selected, so quick questions like "what stands out here?" have map context.'
        }
    },
    {
        tab: 'merger',
        navTabName: 'merger',
        title: { vi: 'Thông tin sáp nhập', en: 'Merger information' },
        text: {
            vi: 'Tab này tổng hợp lịch sử thay đổi tỉnh/thành và dữ liệu sáp nhập đơn vị hành chính.',
            en: 'This tab summarizes province/city boundary history and administrative merger data.'
        }
    },
    {
        tab: 'merger',
        selector: '#tabMerger .merger-sidebar',
        title: { vi: 'Mục lục sáp nhập năm 2025 theo tỉnh', en: 'Search and jump by province' },
        text: {
            vi: 'Ô tìm kiếm và mục lục giúp lọc nhanh tỉnh/thành trong danh sách sáp nhập.',
            en: 'The search field and table of contents help filter and jump through the merger list quickly.'
        }
    },
    {
        tab: 'merger',
        selector: '#tabMerger .merger-main-content',
        title: { vi: 'Dữ liệu thay đổi hành chính', en: 'Administrative change data' },
        text: {
            vi: 'Khu vực nội dung hiển thị dòng thời gian cấp tỉnh và các cụm thay đổi cấp xã theo từng tỉnh.',
            en: 'The main content shows province-level timelines and commune-level change groups by province.'
        }
    },
    {
        tab: 'chat',
        navTabName: 'chat',
        title: { vi: 'Chatbot AI', en: 'AI chatbot' },
        text: {
            vi: 'Mở không gian chat đầy đủ khi bạn muốn hỏi dài hơn về lịch sử, địa lý hoặc địa phương đang chọn trên bản đồ.',
            en: 'Open the full chat workspace for longer questions about history, geography, or the place selected on the map.'
        }
    },
    {
        tab: 'chat',
        selector: '#tabChat .chat-messages',
        title: { vi: 'Luồng hội thoại', en: 'Conversation thread' },
        text: {
            vi: 'Câu trả lời của AI được giữ trong luồng này; nút cuộc trò chuyện mới sẽ đặt lại phiên hỏi đáp.',
            en: 'AI responses appear in this thread; the new conversation button resets the chat session.'
        }
    },
    {
        tab: 'chat',
        selector: '#tabChat .chat-input-area',
        position: 'top',
        title: { vi: 'Nhập câu hỏi', en: 'Ask a question' },
        text: {
            vi: 'Nhập câu hỏi rồi nhấn Enter hoặc nút gửi. Nếu đã chọn vùng trên bản đồ, chatbot sẽ nhận kèm ngữ cảnh đó.',
            en: 'Type a question and press Enter or Send. If a map area is selected, the chatbot receives that context too.'
        }
    },
    {
        tab: 'memory',
        navTabName: 'memory',
        title: { vi: 'Ghi nhớ bản đồ', en: 'Map memory' },
        text: {
            vi: 'Tab này biến dữ liệu bản đồ thành trò luyện nhận diện vị trí tỉnh/thành theo từng bộ năm.',
            en: 'This tab turns the map data into a practice game for recognizing province/city locations by dataset year.'
        }
    },
    {
        tab: 'memory',
        selector: '.memory-panel',
        title: { vi: 'Thiết lập lượt chơi', en: 'Game setup' },
        text: {
            vi: 'Chọn năm dữ liệu, bắt đầu lượt chơi, dùng gợi ý hoặc bỏ qua khi cần; điểm và chuỗi đúng được cập nhật tại đây.',
            en: 'Choose a data year, start a round, use hints or skip when needed; score and streak stats update here.'
        }
    },
    {
        tab: 'memory',
        selector: '#memoryMap',
        title: { vi: 'Bản đồ luyện nhớ', en: 'Practice map' },
        text: {
            vi: 'Khi lượt chơi bắt đầu, bấm trực tiếp vào tỉnh/thành bạn cho là đáp án để kiểm tra trí nhớ vị trí.',
            en: 'When a round starts, click the province/city you think is the answer to test your location memory.'
        }
    }
];

const styles = {
    province: f => ({ fillColor: getColor(f.properties.Name || f.properties.NAME_1), weight: 0, fillOpacity: 0.6, color: 'transparent' }),
    border: { fill: false, color: '#ecf0f1', weight: 2, interactive: false, opacity: 1 },
    district: { fillColor: 'transparent', weight: 1, color: '#2980b9', fillOpacity: 0, opacity: 0.8 },
    ward: { fillColor: 'transparent', weight: 0.5, color: '#555', fillOpacity: 0.1, opacity: 0.6 },
    high: { weight: 4, color: '#e74c3c', fillOpacity: 0.4, opacity: 1 }
};

function getColor(name) {
    if (!name) return '#ccc';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function normalizeFileName(str) {
    let name = str.replace(/^(Tỉnh|Thành phố)\s+/i, "");
    return name.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, '')
        + '.json';
}

function normalizeMemoryName(name) {
    return String(name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/^(tỉnh|thành phố)\s+/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

/** Phiên âm tiếng Anh (khách) cho bản đồ tỉnh 2025 — nguồn: phienamtienganh.txt */
let foreignGuestProvinceLabels2025 = false;
let provinceLabelMode2025 = localStorage.getItem('province_label_mode_2025') || 'vn';
if (!['vn', 'fun'].includes(provinceLabelMode2025)) provinceLabelMode2025 = 'vn';
const PROVINCE_GUEST_EN_2025 = {};

function registerGuestViToEn(variants, english) {
    variants.forEach(v => {
        const k = normalizeMemoryName(v);
        if (k) PROVINCE_GUEST_EN_2025[k] = english;
    });
}

function initProvinceGuestEn2025Map() {
    registerGuestViToEn(['Lai Châu'], 'Lie Chow');
    registerGuestViToEn(['Lào Cai'], 'Loud Kyle');
    registerGuestViToEn(['Tuyên Quang'], 'Too-ian Kwang');
    registerGuestViToEn(['Cao Bằng'], 'Cow (Big) Bang');
    registerGuestViToEn(['Thái Nguyên'], 'Thai(land) Ngoo-ian');
    registerGuestViToEn(['Lạng Sơn'], '(S)lang (Con)cern');
    registerGuestViToEn(['Bắc Ninh'], 'Park (Light)ning');
    registerGuestViToEn(['Quảng Ninh'], 'Kwang (Run)ning');
    registerGuestViToEn(['Điện Biên'], 'De-ian Bee-ian');
    registerGuestViToEn(['Sơn La'], '(Con)cern Lar(ge)');
    registerGuestViToEn(['Phú Thọ'], 'Fool Thor');
    registerGuestViToEn(['Hà Nội', 'Thành phố Hà Nội'], 'Ha(vard) Noi(sy)');
    registerGuestViToEn(['Hải Phòng', 'Thành phố Hải Phòng'], 'Hi Fong');
    registerGuestViToEn(['Hưng Yên'], 'Hmm yian');
    registerGuestViToEn(['Ninh Bình'], '(Run)ning (Club)bing');
    registerGuestViToEn(['Thanh Hóa'], 'Thank Who-are');
    registerGuestViToEn(['Nghệ An'], '(Lo)ng-ear Ant');
    registerGuestViToEn(['Hà Tĩnh'], 'Ha(vard) (S)ting');
    registerGuestViToEn(['Quảng Trị'], 'Kwang Tri(llion)');
    registerGuestViToEn(['Thừa Thiên Huế', 'Thừa Thiên — Huế', 'Huế'], 'Who-ay');
    registerGuestViToEn(['Đà Nẵng', 'Thành phố Đà Nẵng'], 'Dar(ling): None');
    registerGuestViToEn(['Quảng Ngãi'], 'Kwang (Lo)ng-eye');
    registerGuestViToEn(['Gia Lai'], 'Jar Like');
    registerGuestViToEn(['Đắk Lắk'], 'Dark Luck');
    registerGuestViToEn(['Khánh Hòa'], 'Kein(stein) Who-are');
    registerGuestViToEn(['Lâm Đồng'], '(Curricu)lum dawn');
    registerGuestViToEn(['Đồng Nai'], 'Dong(le) Nike');
    registerGuestViToEn(['Tây Ninh'], 'Ta(ble) (run)ning');
    registerGuestViToEn(['Đồng Tháp'], 'Dong(le) Thaep');
    registerGuestViToEn(['An Giang'], 'Ant Gen(der)');
    registerGuestViToEn([
        'TP. Hồ Chí Minh (Sài Gòn)', 'TP Hồ Chí Minh', 'Thành phố Hồ Chí Minh',
        'Hồ Chí Minh', 'Sài Gòn', 'TP.HCM', 'TP. HCM', 'Thành phố HCM'
    ], 'Shy Gone = confident');
    registerGuestViToEn(['Vĩnh Long'], '(Li)ving Long');
    registerGuestViToEn(['Cần Thơ', 'Thành phố Cần Thơ'], 'Con(trol) Ther(mal)');
    registerGuestViToEn(['Cà Mau'], 'Car Moun(tain)');
    registerGuestViToEn(['Đảo Phú Quốc', 'Phú Quốc'], '"Fool Work" Island');
    registerGuestViToEn(['Côn Đảo'], '"Call Down" Island');
    registerGuestViToEn(['Quần đảo Hoàng Sa', 'Hoàng Sa'], 'Hwang (mas)sage (of Vietnam)');
    registerGuestViToEn(['Quần đảo Trường Sa', 'Trường Sa'], '(play) truant (mas)sage (of Vietnam)');
}
initProvinceGuestEn2025Map();

function stripVietnameseAccents(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function registerStandardEn(variants, english) {
    variants.forEach(v => {
        const k = normalizeMemoryName(v);
        if (k) PROVINCE_STANDARD_EN_2025[k] = english;
    });
}

function initProvinceStandardEn2025Map() {
    registerStandardEn(['Hà Nội', 'Thành phố Hà Nội'], 'Hanoi');
    registerStandardEn(['Hồ Chí Minh', 'TP. Hồ Chí Minh', 'TP HCM', 'Sài Gòn'], 'Ho Chi Minh City');
    registerStandardEn(['Đà Nẵng', 'Thành phố Đà Nẵng'], 'Da Nang');
    registerStandardEn(['Huế', 'Thừa Thiên Huế'], 'Hue');
    registerStandardEn(['Hải Phòng', 'Thành phố Hải Phòng'], 'Hai Phong');
    registerStandardEn(['Cần Thơ', 'Thành phố Cần Thơ'], 'Can Tho');
    registerStandardEn(['Bà Rịa - Vũng Tàu', 'Bà Rịa Vũng Tàu'], 'Ba Ria - Vung Tau');
    registerStandardEn(['Đắk Lắk'], 'Dak Lak');
    registerStandardEn(['Đắk Nông'], 'Dak Nong');
    Object.values(REGION_PROVINCES).flat().forEach(name => {
        const key = normalizeMemoryName(name);
        if (key && !PROVINCE_STANDARD_EN_2025[key]) {
            PROVINCE_STANDARD_EN_2025[key] = stripVietnameseAccents(name);
        }
    });
}
initProvinceStandardEn2025Map();

function initProvinceRegionMap() {
    Object.entries(REGION_PROVINCES).forEach(([region, provinces]) => {
        provinces.forEach(name => {
            const key = normalizeMemoryName(name);
            if (key) PROVINCE_REGION_MAP[key] = region;
        });
    });
}
initProvinceRegionMap();

function getProvinceGuestDisplayName(vnName) {
    if (!vnName) return '';
    const key = normalizeMemoryName(vnName);
    return PROVINCE_GUEST_EN_2025[key] || vnName;
}

function getProvinceStandardDisplayName(vnName) {
    if (!vnName) return '';
    const key = normalizeMemoryName(vnName);
    return PROVINCE_STANDARD_EN_2025[key] || stripVietnameseAccents(vnName);
}

function getProvinceDisplayName(vnName) {
    if (!vnName) return '';
    if (shouldShowForeignGuestProvinceLabels()) {
        const guest = getProvinceGuestDisplayName(vnName);
        return guest && guest !== vnName ? `${vnName} (${guest})` : vnName;
    }
    return vnName;
}

function shouldShowForeignGuestProvinceLabels() {
    if (AVAILABLE_YEARS.length === 0) return false;
    const tl = document.getElementById('timeline');
    if (!tl) return false;
    const year = AVAILABLE_YEARS[tl.value];
    return isEnglish() && provinceLabelMode2025 === 'fun' && year === 2025 && viewMode === 'province';
}

function shouldShowStandardEnglishProvinceLabels() {
    return false;
}

function refreshMapLayerGuestTooltips() {
    const pairs = [
        ['province', 'province'],
        ['district', 'district'],
        ['ward', 'ward']
    ];
    pairs.forEach(([key, typ]) => {
        const lyr = layers[key];
        if (!lyr) return;
        lyr.eachLayer(layer => {
            if (!layer.feature) return;
            const html = getMapTooltipContent(layer.feature, typ);
            const tip = layer.getTooltip();
            if (tip) tip.setContent(html);
            else bindMapFeatureTooltip(layer.feature, layer, typ);
        });
    });
}

function refreshGuestLabelsInMergerDom() {
    document.querySelectorAll('.guest-prov-label[data-vn-prov]').forEach(span => {
        const vn = span.getAttribute('data-vn-prov');
        if (!vn) return;
        span.textContent = getProvinceDisplayName(vn);
    });
}

function refreshSidePanelTitleGuest() {
    const el = document.getElementById('sidePanelProvTitle');
    if (!el) return;
    const vn = el.getAttribute('data-vn-prov');
    if (!vn) return;
    el.textContent = getProvinceDisplayName(vn);
}

function refreshAllGuestEnDisplays() {
    refreshMapLayerGuestTooltips();
    refreshGuestLabelsInMergerDom();
    refreshSidePanelTitleGuest();
    if (selectedFeature && selectedFeature.type === 'province') {
        updateInfoBox(selectedFeature.feat.properties);
    }
    updateMapContextUI();
}

function syncGuestEnButtonVisibility() {
    const wrap = document.getElementById('guestEnControls2025');
    const btn = document.getElementById('btnGuestEn2025');
    if (!wrap || !btn) return;
    const year = AVAILABLE_YEARS.length
        ? AVAILABLE_YEARS[document.getElementById('timeline').value]
        : null;
    const showBtn = isEnglish() && year === 2025 && viewMode === 'province';
    wrap.style.display = showBtn ? 'flex' : 'none';
    if (!showBtn && provinceLabelMode2025 !== 'vn') {
        provinceLabelMode2025 = 'vn';
        localStorage.setItem('province_label_mode_2025', provinceLabelMode2025);
    }
    foreignGuestProvinceLabels2025 = provinceLabelMode2025 === 'fun';
    btn.classList.toggle('active', provinceLabelMode2025 === 'fun');
    btn.setAttribute('aria-pressed', provinceLabelMode2025 === 'fun' ? 'true' : 'false');
    btn.textContent = tr(provinceLabelMode2025 === 'fun' ? 'hidePronunciation' : 'showPronunciation', provinceLabelMode2025 === 'fun' ? 'Ẩn phiên âm tên tỉnh' : 'Hiện phiên âm tên tỉnh');
    refreshAllGuestEnDisplays();
}

function mapContextDisplayForUi(ctx) {
    if (!ctx) return '';
    if (!shouldShowForeignGuestProvinceLabels() || !ctx.province) return ctx.display_name || '';
    const pName = getProvinceDisplayName(ctx.province);
    if (ctx.level === 'province') return pName;
    if (ctx.level === 'district') return [ctx.district, pName].filter(Boolean).join(', ');
    if (ctx.level === 'ward') return [ctx.ward, ctx.district, pName].filter(Boolean).join(', ');
    return ctx.display_name;
}

function getFeatureName(feature) {
    const props = feature && feature.properties ? feature.properties : {};
    return getAdminUnit(props, 'province').name || props.name || props.Ten || 'Không rõ tên';
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeSmartText(value) {
    return stripVietnameseAccents(value)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\b(tinh|thanh pho|tp|quan|huyen|thi xa|thi tran|phuong|xa)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function smartTextIncludes(text, query) {
    const haystack = normalizeSmartText(text);
    const needle = normalizeSmartText(query);
    if (!needle) return false;
    return haystack.includes(needle) || needle.split(' ').every(part => part && haystack.includes(part));
}

function getCurrentYear() {
    if (!AVAILABLE_YEARS.length) return null;
    const tl = document.getElementById('timeline');
    return AVAILABLE_YEARS[Number(tl.value || 0)];
}

function getRegionForProvince(provinceName) {
    return PROVINCE_REGION_MAP[normalizeMemoryName(provinceName)] || '';
}

function getSourceMeta(source, fallbackLabel) {
    if (!source || typeof source !== 'object') {
        return {
            label: fallbackLabel || 'Dữ liệu nội bộ',
            url: '#',
            confidence: 'Nội bộ - cần đối chiếu',
            updated_at: null
        };
    }
    return {
        label: source.label || fallbackLabel || 'Dữ liệu nội bộ',
        url: source.url || '#',
        confidence: source.confidence || 'Nội bộ - cần đối chiếu',
        updated_at: source.updated_at || null
    };
}

function renderSourcePills(meta) {
    const source = getSourceMeta(meta);
    const updated = source.updated_at || 'chưa rõ';
    const href = source.url || '#';
    return `
                <span class="source-pill"><i class="fas fa-shield-halved"></i> ${escapeHtml(source.confidence)}</span>
                <a class="source-pill" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-link"></i> ${escapeHtml(source.label)}</a>
                <span class="source-pill"><i class="fas fa-calendar-check"></i> ${escapeHtml(updated)}</span>
            `;
}

function getVideoItems(item) {
    const videos = item && Array.isArray(item.videos) ? item.videos : [];
    return videos.filter(video => video && video.url);
}

function renderVideoLinks(item) {
    const videos = getVideoItems(item);
    if (!videos.length) return '';
    const links = videos.slice(0, 2).map(video => {
        const title = video.title || tr('watchOnYoutube', 'Xem trên YouTube');
        return `
                    <a class="video-link" href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(title)}">
                        <i class="fab fa-youtube"></i>
                        <span>${escapeHtml(tr('watchOnYoutube', 'Xem trên YouTube'))}</span>
                    </a>`;
    }).join('');
    return `
                <div class="video-links">
                    <span class="video-label"><i class="fas fa-play-circle"></i> ${escapeHtml(tr('relatedVideos', 'Video liên quan'))}</span>
                    ${links}
                </div>`;
}

function getStoredList(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(value) ? value : [];
    } catch (e) {
        return [];
    }
}

function setStoredList(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function placeKey(place) {
    return [
        normalizeMemoryName(place.display_name || place.name),
        place.year,
        place.level,
        normalizeMemoryName(place.province || ''),
        normalizeMemoryName(place.district || ''),
        normalizeMemoryName(place.ward || '')
    ].join('|');
}

function placeFromContext(ctx) {
    if (!ctx) return null;
    return {
        display_name: ctx.display_name,
        province: ctx.province,
        district: ctx.district,
        ward: ctx.ward,
        level: ctx.level,
        year: ctx.year,
        saved_at: new Date().toISOString()
    };
}

function addRecentPlace(ctx) {
    const place = placeFromContext(ctx);
    if (!place) return;
    const key = placeKey(place);
    const list = getStoredList(RECENT_PLACES_KEY).filter(item => placeKey(item) !== key);
    list.unshift(place);
    setStoredList(RECENT_PLACES_KEY, list.slice(0, MAX_RECENT_PLACES));
    renderQuickPlacesPanel();
}

function saveCurrentBookmark() {
    const ctx = getMapSelectionContext();
    if (!ctx) return;
    const place = placeFromContext(ctx);
    const key = placeKey(place);
    const list = getStoredList(BOOKMARKS_KEY).filter(item => placeKey(item) !== key);
    list.unshift(place);
    setStoredList(BOOKMARKS_KEY, list);
    renderQuickPlacesPanel(true);
}

function removeBookmark(key) {
    setStoredList(BOOKMARKS_KEY, getStoredList(BOOKMARKS_KEY).filter(item => placeKey(item) !== key));
    renderQuickPlacesPanel(true);
}

function renderPlaceRows(items, removable = false) {
    if (!items || !items.length) return `<div class="history-empty">${tr('noItems', 'Chưa có mục nào.')}</div>`;
    return items.map(item => {
        const name = escapeHtml(item.display_name || item.name || 'Không rõ tên');
        const meta = `${item.year || ''} · ${item.level || 'province'}`;
        const key = escapeHtml(placeKey(item));
        return `
                    <div class="quick-place-row">
                        <div class="quick-place-main" data-place-key="${key}">
                            <div class="quick-place-name">${name}</div>
                            <div class="quick-place-meta">${escapeHtml(meta)}</div>
                        </div>
                        ${removable ? `<button type="button" class="quick-place-remove" data-remove-key="${key}" title="Xóa bookmark"><i class="fas fa-times"></i></button>` : ''}
                    </div>`;
    }).join('');
}

function renderQuickPlacesPanel(forceOpen = false) {
    const panel = document.getElementById('quickPlacesPanel');
    if (!panel) return;
    const bookmarks = getStoredList(BOOKMARKS_KEY);
    const recent = getStoredList(RECENT_PLACES_KEY);
    panel.innerHTML = `
                <div class="quick-section-title"><i class="fas fa-bookmark"></i> Địa phương yêu thích</div>
                ${renderPlaceRows(bookmarks, true)}
                <div class="quick-section-title"><i class="fas fa-clock-rotate-left"></i> Truy cập gần đây</div>
                ${renderPlaceRows(recent, false)}
            `;
    panel.querySelectorAll('.quick-place-main').forEach(row => {
        row.addEventListener('click', () => {
            const allPlaces = [...bookmarks, ...recent];
            const target = allPlaces.find(item => placeKey(item) === row.dataset.placeKey);
            if (target) restorePlace(target);
        });
    });
    panel.querySelectorAll('[data-remove-key]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            removeBookmark(btn.dataset.removeKey);
        });
    });
    if (forceOpen) panel.classList.add('visible');
}

function toggleQuickPlacesPanel() {
    const panel = document.getElementById('quickPlacesPanel');
    if (!panel) return;
    renderQuickPlacesPanel();
    panel.classList.toggle('visible');
}

function captureViewState() {
    const tl = document.getElementById('timeline');
    const ctx = selectedFeature ? buildMapContextFromFeature(selectedFeature.feat, selectedFeature.type) : null;
    return {
        center: map.getCenter(),
        zoom: map.getZoom(),
        yearIndex: Number(tl ? tl.value : 0),
        viewMode,
        selectedContext: ctx
    };
}

function pushViewState() {
    if (suppressViewHistory || !AVAILABLE_YEARS.length) return;
    viewHistoryStack.push(captureViewState());
    if (viewHistoryStack.length > MAX_VIEW_HISTORY) viewHistoryStack.shift();
    updateBackButtonState();
}

function updateBackButtonState() {
    const btn = document.getElementById('btnBackView');
    if (btn) btn.disabled = viewHistoryStack.length === 0;
}

async function restorePreviousView() {
    const state = viewHistoryStack.pop();
    if (!state) return;
    suppressViewHistory = true;
    try {
        const tl = document.getElementById('timeline');
        if (tl) {
            tl.value = state.yearIndex;
            document.getElementById('yearValue').innerText = AVAILABLE_YEARS[state.yearIndex] || '';
        }
        viewMode = state.viewMode || 'province';
        const input = document.querySelector(`input[value="${viewMode}"]`);
        if (input) input.checked = true;
        await updateMap();
        map.setView(state.center, state.zoom);
        if (state.selectedContext) {
            await focusContextOnMap(state.selectedContext, { openPanel: false, addRecent: false });
        }
    } finally {
        suppressViewHistory = false;
        updateBackButtonState();
    }
}

function setupQuickMapTools() {
    const searchInput = document.getElementById('smartSearchInput');
    const clearBtn = document.getElementById('btnClearSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => runSmartSearch(searchInput.value), 180);
        });
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) runSmartSearch(searchInput.value);
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            renderSmartSearchResults([]);
        });
    }
    document.getElementById('btnBackView')?.addEventListener('click', restorePreviousView);
    document.getElementById('btnBookmarkPlace')?.addEventListener('click', saveCurrentBookmark);
    document.getElementById('btnQuickPlaces')?.addEventListener('click', toggleQuickPlacesPanel);
    document.getElementById('btnSplitView')?.addEventListener('click', () => toggleSplitView());
    document.getElementById('btnQuickTour')?.addEventListener('click', () => startQuickTour());
    document.addEventListener('click', e => {
        const toolbar = document.querySelector('.map-quick-toolbar');
        if (!toolbar || toolbar.contains(e.target)) return;
        document.getElementById('smartSearchResults')?.classList.remove('visible');
        document.getElementById('quickPlacesPanel')?.classList.remove('visible');
    });
    renderQuickPlacesPanel();
    updateBackButtonState();
}

function updateControlPanelHeight() {
    const cp = document.querySelector('.control-panel');
    if (cp && cp.offsetHeight > 0) {
        document.documentElement.style.setProperty('--control-panel-height', cp.offsetHeight + 'px');
    } else {
        document.documentElement.style.setProperty('--control-panel-height', '155px');
    }
}

function setupControlPanelObserver() {
    updateControlPanelHeight();
    const cp = document.querySelector('.control-panel');
    if (cp && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
            updateControlPanelHeight();
        });
        ro.observe(cp);
    }
    window.addEventListener('resize', updateControlPanelHeight);
}

function toggleInfoBox(forceState) {
    const infoBox = document.getElementById('infoBox');
    const toggleBtn = document.getElementById('btnToggleInfo');
    if (!infoBox) return;

    let isMinimized;
    if (forceState !== undefined) {
        isMinimized = !forceState;
    } else {
        isMinimized = !infoBox.classList.contains('minimized');
    }

    if (isMinimized) {
        infoBox.classList.add('minimized');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    } else {
        infoBox.classList.remove('minimized');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }
}

function getFeatureSearchBlob(feature, type) {
    const props = feature.properties || {};
    const province = getAdminUnit(props, 'province');
    const district = getAdminUnit(props, 'district');
    const ward = getAdminUnit(props, 'ward');
    const pieces = [
        province.name,
        district.name,
        ward.name,
        province.label,
        district.label,
        ward.label,
        getProvinceStandardDisplayName(province.name),
        getProvinceGuestDisplayName(province.name)
    ];
    if (type === 'province') pieces.push(getConstituentProvinces(province.name, getCurrentYear()).join(' '));
    return pieces.filter(Boolean).join(' ');
}

function collectLayerSearchResults(query) {
    const currentYear = getCurrentYear();
    const layerOrder = (currentYear && currentYear < 2008) ? ['province'] : ['province', 'district', 'ward'];
    const results = [];
    layerOrder.forEach(type => {
        const layerGroup = layers[type];
        if (!layerGroup) return;
        layerGroup.eachLayer(layer => {
            if (!layer.feature || !smartTextIncludes(getFeatureSearchBlob(layer.feature, type), query)) return;
            const ctx = buildMapContextFromFeature(layer.feature, type);
            if (!ctx) return;
            results.push({
                title: mapContextDisplayForUi(ctx) || ctx.display_name,
                kind: 'map_feature',
                kind_label: type === 'province' ? 'Bản đồ tỉnh/thành' : type === 'district' ? 'Bản đồ huyện/quận' : 'Bản đồ xã/phường',
                province: ctx.province,
                district: ctx.district,
                commune: ctx.ward,
                year: ctx.year,
                context: ctx,
                score: 100
            });
        });
    });
    return results.slice(0, 8);
}

async function runSmartSearch(query) {
    const q = query.trim();
    if (!q) {
        renderSmartSearchResults([]);
        return;
    }
    const localResults = collectLayerSearchResults(q);
    let remoteResults = [];
    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8&lang=${encodeURIComponent(currentLang)}`);
        if (res.ok) {
            const data = await res.json();
            remoteResults = Array.isArray(data.results) ? data.results : [];
        }
    } catch (e) {
        console.warn('Search API error', e);
    }
    const seen = new Set();
    const merged = [...localResults, ...remoteResults].filter(item => {
        const key = [item.kind, item.title, item.province, item.district, item.commune, item.year].map(normalizeSmartText).join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, 12);
    renderSmartSearchResults(merged);
}

function renderSmartSearchResults(results) {
    const box = document.getElementById('smartSearchResults');
    if (!box) return;
    if (!results.length) {
        box.innerHTML = '';
        box.classList.remove('visible');
        return;
    }
    box.innerHTML = results.map((item, idx) => {
        const metaParts = [item.kind_label, item.year ? `${tr('yearPrefix', 'năm')} ${item.year}` : '', item.province].filter(Boolean);
        const icon = item.kind === 'geo_site' ? 'fa-landmark' : item.kind === 'history_event' ? 'fa-scroll' : item.kind === 'province_admin_change' ? 'fa-timeline' : 'fa-map-location-dot';
        return `
                    <button type="button" class="search-result-item" data-search-index="${idx}">
                        <div class="search-result-title"><span><i class="fas ${icon}"></i> ${escapeHtml(item.title || tr('noName', 'Không rõ tên'))}</span><small>${Math.round(item.score || 0)}</small></div>
                        <div class="search-result-meta">${escapeHtml(metaParts.join(' · '))}</div>
                    </button>`;
    }).join('');
    box.querySelectorAll('[data-search-index]').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = results[Number(btn.dataset.searchIndex)];
            selectSearchResult(item);
        });
    });
    box.classList.add('visible');
}

async function selectSearchResult(item) {
    document.getElementById('smartSearchResults')?.classList.remove('visible');
    const input = document.getElementById('smartSearchInput');
    if (input) input.value = item.title || '';
    if (item.context) {
        await focusContextOnMap(item.context, { openPanel: false, addRecent: true });
        return;
    }
    const ctx = {
        year: item.year || getCurrentYear(),
        level: item.commune ? 'ward' : item.district ? 'district' : 'province',
        display_name: [item.commune, item.district, item.province].filter(Boolean).join(', ') || item.title,
        province: item.province || item.title,
        district: item.district || null,
        ward: item.commune || null
    };
    await focusContextOnMap(ctx, { openPanel: false, addRecent: true });
}

async function restorePlace(place) {
    await focusContextOnMap(place, { openPanel: false, addRecent: true });
    document.getElementById('quickPlacesPanel')?.classList.remove('visible');
}

function setViewMode(mode) {
    const currentYear = getCurrentYear();
    if (currentYear && currentYear < 2008) {
        viewMode = 'province';
    } else {
        viewMode = mode || 'province';
    }
    const input = document.querySelector(`input[value="${viewMode}"]`);
    if (input) input.checked = true;
}

async function focusContextOnMap(ctx, options = {}) {
    if (!ctx) return false;
    const year = Number(ctx.year || getCurrentYear());
    const yearIndex = AVAILABLE_YEARS.indexOf(year);
    let targetMode = ctx.level || (ctx.ward ? 'ward' : ctx.district ? 'district' : 'province');
    if (year < 2008) {
        targetMode = 'province';
    } else if (year >= 2025 && targetMode === 'district') {
        targetMode = 'province';
    }
    const tl = document.getElementById('timeline');
    const needsMapUpdate = (yearIndex >= 0 && Number(tl.value) !== yearIndex) || viewMode !== targetMode;
    if (needsMapUpdate) {
        if (!options.skipHistory) pushViewState();
        if (yearIndex >= 0) {
            tl.value = yearIndex;
            document.getElementById('yearValue').innerText = AVAILABLE_YEARS[yearIndex];
        }
        setViewMode(targetMode);
        await updateMap();
    }
    const matched = findLayerByContext(ctx, targetMode) || findLayerByContext(ctx, 'province');
    if (!matched) return false;
    resetHighlight();
    matched.layer.setStyle(styles.high);
    if (matched.layer.bringToFront) matched.layer.bringToFront();
    selectedFeature = { layer: matched.layer, feat: matched.layer.feature, type: matched.type };
    updateInfoBox(matched.layer.feature.properties);
    document.getElementById('btnShowHistory').disabled = false;
    document.getElementById('btnBookmarkPlace').disabled = false;
    updateMapContextUI();
    if (matched.layer.getBounds && matched.layer.getBounds().isValid()) {
        map.fitBounds(matched.layer.getBounds(), { padding: [40, 40], maxZoom: matched.type === 'province' ? 8 : 11 });
    }
    const selectedCtx = buildMapContextFromFeature(matched.layer.feature, matched.type);
    if (options.addRecent !== false) addRecentPlace(selectedCtx);
    if (options.openPanel) document.getElementById('btnShowHistory').click();
    return true;
}

function findLayerByContext(ctx, preferredType) {
    const order = preferredType ? [preferredType, 'ward', 'district', 'province'] : ['ward', 'district', 'province'];
    const uniqueOrder = [...new Set(order)];
    for (const type of uniqueOrder) {
        const group = layers[type];
        if (!group) continue;
        let match = null;
        group.eachLayer(layer => {
            if (match || !layer.feature) return;
            if (featureMatchesContext(layer.feature, type, ctx)) match = { layer, type };
        });
        if (match) return match;
    }
    return null;
}

function featureMatchesContext(feature, type, ctx) {
    const props = feature.properties || {};
    const province = getAdminUnit(props, 'province').name;
    const district = getAdminUnit(props, 'district').name;
    const ward = getAdminUnit(props, 'ward').name;
    const provinceOk = !ctx.province || normalizeMemoryName(province) === normalizeMemoryName(ctx.province) || smartTextIncludes(province, ctx.province);
    const districtOk = !ctx.district || normalizeMemoryName(district) === normalizeMemoryName(ctx.district) || smartTextIncludes(district, ctx.district);
    const wardOk = !ctx.ward || normalizeMemoryName(ward) === normalizeMemoryName(ctx.ward) || smartTextIncludes(ward, ctx.ward);
    if (type === 'province') return provinceOk;
    if (type === 'district') return provinceOk && districtOk;
    return provinceOk && districtOk && wardOk;
}

function setupCompareYearOptions() {
    const select = document.getElementById('compareYearSelect');
    if (!select) return;
    select.innerHTML = AVAILABLE_YEARS.map(year => `<option value="${year}">${year}</option>`).join('');
    if (AVAILABLE_YEARS.length > 1) select.value = AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1];
    select.addEventListener('change', updateCompareMap);
}

function ensureCompareMap() {
    if (compareMap) return;
    compareMap = L.map('compareMap', { zoomControl: false }).setView(map.getCenter(), map.getZoom());
    L.tileLayer('https://mt0.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}', {
        maxZoom: 21,
        attribution: 'Map data &copy; Google',
        crossOrigin: true
    }).addTo(compareMap);
    L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(compareMap);
    compareMap.createPane('compareProvincePane'); compareMap.getPane('compareProvincePane').style.zIndex = 350;
    compareMap.createPane('compareDistrictPane'); compareMap.getPane('compareDistrictPane').style.zIndex = 400;
    compareMap.createPane('compareWardPane'); compareMap.getPane('compareWardPane').style.zIndex = 450;
    compareMap.createPane('compareBorderPane'); compareMap.getPane('compareBorderPane').style.zIndex = 500;
    let syncing = false;
    map.on('moveend zoomend', () => {
        if (!splitViewEnabled || syncing) return;
        syncing = true;
        compareMap.setView(map.getCenter(), map.getZoom(), { animate: false });
        syncing = false;
    });
    compareMap.on('moveend zoomend', () => {
        if (!splitViewEnabled || syncing) return;
        syncing = true;
        map.setView(compareMap.getCenter(), compareMap.getZoom(), { animate: false });
        syncing = false;
    });
}

async function toggleSplitView(force) {
    splitViewEnabled = typeof force === 'boolean' ? force : !splitViewEnabled;
    const tab = document.getElementById('tabMap');
    const panel = document.getElementById('comparePanel');
    const btn = document.getElementById('btnSplitView');
    tab.classList.toggle('split-mode', splitViewEnabled);
    panel.classList.toggle('active', splitViewEnabled);
    btn.classList.toggle('active', splitViewEnabled);
    map.invalidateSize();
    if (splitViewEnabled) {
        ensureCompareMap();
        setTimeout(() => {
            compareMap.invalidateSize();
            compareMap.setView(map.getCenter(), map.getZoom(), { animate: false });
        }, 80);
        await updateCompareMap();
    }
}

function clearCompareLayers() {
    Object.keys(compareLayers).forEach(key => {
        if (compareLayers[key]) compareMap.removeLayer(compareLayers[key]);
        compareLayers[key] = null;
    });
}

async function updateCompareMap() {
    if (!splitViewEnabled || !compareMap) return;
    const year = Number(document.getElementById('compareYearSelect').value || getCurrentYear());
    clearCompareLayers();
    const pEntry = DATA_SOURCES.province.find(x => x.year === year);
    if (pEntry) {
        const data = await loadMapData(pEntry.file);
        compareLayers.province = L.geoJSON(data, {
            style: styles.province,
            pane: 'compareProvincePane',
            onEachFeature: (f, l) => bindMapFeatureTooltip(f, l, 'province')
        }).addTo(compareMap);
        compareLayers.border = L.geoJSON(data, { style: styles.border, pane: 'compareBorderPane' }).addTo(compareMap);
    }
    if (viewMode === 'district' && year >= 2008) {
        const dEntry = DATA_SOURCES.district.find(x => x.year === year);
        if (dEntry) {
            const data = await loadMapData(dEntry.file);
            compareLayers.district = L.geoJSON(data, { style: styles.district, pane: 'compareDistrictPane' }).addTo(compareMap);
        }
    } else if (viewMode === 'ward' && year >= 2008) {
        const wEntry = DATA_SOURCES.ward.find(x => x.year === year);
        if (wEntry) {
            const data = await loadMapData(wEntry.file);
            compareLayers.ward = L.geoJSON(data, { style: styles.ward, pane: 'compareWardPane' }).addTo(compareMap);
        }
    }
    compareMap.setView(map.getCenter(), map.getZoom(), { animate: false });
}

function setupEventTimeline() {
    const container = document.getElementById('eventTimeline');
    if (!container || !Array.isArray(TIMELINE_DATA)) return;

    let html = '';
    TIMELINE_DATA.forEach((item, idx) => {
        let typeStr = item.type || '';
        const tLower = typeStr.toLowerCase();
        const isMerge = tLower.includes('merge') || tLower.includes('nhập');
        const isSplit = tLower.includes('split') || tLower.includes('tách');

        if (item.year === 1976 && isMerge) return;

        if (isEnglish()) {
            if (isMerge) typeStr = 'merge';
            else if (isSplit) typeStr = 'split';
        } else {
            if (isMerge) typeStr = 'nhập';
            else if (isSplit) typeStr = 'tách';
        }

        html += `
                <button type="button" class="event-timeline-btn" data-timeline-index="${idx}" title="${escapeHtml(item.title || '')}">
                    ${escapeHtml(item.year || '')} ${escapeHtml(typeStr)}
                </button>
                `;
    });
    container.innerHTML = html;

    container.querySelectorAll('[data-timeline-index]').forEach(btn => {
        btn.addEventListener('click', () => focusTimelineEvent(Number(btn.dataset.timelineIndex)));
    });
}

function nearestAvailableYearIndex(year) {
    if (!AVAILABLE_YEARS.length) return 0;
    let bestIdx = 0;
    let bestDistance = Infinity;
    AVAILABLE_YEARS.forEach((candidate, idx) => {
        const distance = Math.abs(Number(candidate) - Number(year));
        if (distance < bestDistance) {
            bestDistance = distance;
            bestIdx = idx;
        }
    });
    return bestIdx;
}

async function focusTimelineEvent(index) {
    if (!Array.isArray(TIMELINE_DATA) || !TIMELINE_DATA[index]) return;
    const event = TIMELINE_DATA[index];

    if (activeTimelineIndex === index) {
        activeTimelineIndex = null;
        document.querySelectorAll('.event-timeline-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        clearTimelineHighlights();
        return;
    }

    activeTimelineIndex = index;
    document.querySelectorAll('.event-timeline-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.timelineIndex) === index);
    });
    pushViewState();
    const tl = document.getElementById('timeline');
    tl.value = nearestAvailableYearIndex(event.year);
    document.getElementById('yearValue').innerText = AVAILABLE_YEARS[tl.value];
    viewMode = 'province';
    document.querySelector('input[value="province"]').checked = true;
    await updateMap(true);
    highlightTimelineRegions(event);
}

function clearTimelineHighlights(keepActiveState = false) {
    timelineHighlightedLayers.forEach(({ layer, feature, type }) => {
        if (!layer || !feature) return;
        if (layer.getElement) L.DomUtil.removeClass(layer.getElement(), 'timeline-highlighted');
        if (type === 'province') layer.setStyle(styles.province(feature));
        else layer.setStyle(styles[type]);
    });
    timelineHighlightedLayers = [];
    if (!keepActiveState) {
        activeTimelineIndex = null;
        document.querySelectorAll('.event-timeline-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
}

function highlightTimelineRegions(event) {
    clearTimelineHighlights(true);
    if (!layers.province || !event || !Array.isArray(event.changes)) return;
    const names = new Set();
    event.changes.forEach(change => {
        if (!change || typeof change !== 'object') return;
        [...(change.from || []), ...(change.to || [])].forEach(name => {
            if (name) names.add(normalizeMemoryName(name));
        });
    });
    const bounds = [];
    layers.province.eachLayer(layer => {
        if (!layer.feature) return;
        const name = getAdminUnit(layer.feature.properties, 'province').name;
        const normName = normalizeMemoryName(name);
        const matched = [...names].some(target => normName === target || normName.includes(target) || target.includes(normName));
        if (!matched) return;
        layer.setStyle({ weight: 4, color: '#ffc107', fillOpacity: 0.72, opacity: 1 });
        if (layer.getElement) L.DomUtil.addClass(layer.getElement(), 'timeline-highlighted');
        timelineHighlightedLayers.push({ layer, feature: layer.feature, type: 'province' });
        if (layer.getBounds && layer.getBounds().isValid()) bounds.push(layer.getBounds());
    });
    if (bounds.length) {
        const combined = bounds.reduce((acc, b) => acc ? acc.extend(b) : b, null);
        map.fitBounds(combined, { padding: [40, 40], maxZoom: 7 });
    }
}

const HISTORY_TAG_FILTERS = [
    { key: 'military', label: '🛡 Quân sự', aliases: ['quân sự', 'chiến tranh', 'kháng chiến', 'trận', 'mặt trận', 'khởi nghĩa', 'cách mạng', 'giành chính quyền', 'tập kết'] },
    { key: 'administrative', label: '🏛 Hành chính', aliases: ['hành chính', 'thành lập', 'sáp nhập', 'chia tách', 'địa giới', 'tỉnh', 'huyện', 'phủ', 'dinh', 'trấn'] },
    { key: 'culture', label: '📜 Văn hóa', aliases: ['văn hóa', 'di sản', 'di tích', 'lễ hội', 'tín ngưỡng', 'giáo dục', 'nghệ thuật', 'biểu tượng'] }
];

function normalizeHistoryTag(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase();
}

function getHistoryFiltersFromPanel() {
    return {
        type: document.getElementById('historyTypeFilter')?.value || 'all',
        admin: document.getElementById('historyAdminFilter')?.value || 'all',
        region: document.getElementById('historyRegionFilter')?.value || 'all',
        period: document.getElementById('historyPeriodFilter')?.value || 'all'
    };
}

function eventPeriodKey(year) {
    const y = Number(year);
    if (!Number.isFinite(y)) return 'unknown';
    if (y < 1800) return 'pre1800';
    if (y < 1945) return '1800_1945';
    if (y < 1976) return '1945_1975';
    return 'post1975';
}

function eventAdminLevel(eventItem) {
    const loc = eventItem.location || {};
    if (loc.commune && loc.commune !== 'null') return 'ward';
    if (loc.district && loc.district !== 'null') return 'district';
    return 'province';
}

function eventRegionKey(eventItem) {
    const province = eventItem.location && eventItem.location.province ? eventItem.location.province : eventItem.sourceProv;
    return getRegionForProvince(province);
}

function eventMatchesHistoryFilter(eventItem, filterKey) {
    if (filterKey === 'all') return true;
    const filter = HISTORY_TAG_FILTERS.find(item => item.key === filterKey);
    if (!filter) return true;

    const tagsText = Array.isArray(eventItem.tags) ? eventItem.tags.join(' ') : String(eventItem.tags || '');
    const fallbackText = [eventItem.title, eventItem.description, eventItem.desc, eventItem.content].join(' ');
    const searchableText = normalizeHistoryTag(tagsText.trim() ? tagsText : fallbackText);

    return filter.aliases.some(alias => searchableText.includes(normalizeHistoryTag(alias)));
}

function eventMatchesAdvancedFilters(eventItem, filters) {
    const active = typeof filters === 'object' ? filters : { type: filters || 'all' };
    if (!eventMatchesHistoryFilter(eventItem, active.type || 'all')) return false;
    if (active.admin && active.admin !== 'all' && eventAdminLevel(eventItem) !== active.admin) return false;
    if (active.region && active.region !== 'all' && eventRegionKey(eventItem) !== active.region) return false;
    if (active.period && active.period !== 'all' && eventPeriodKey(eventItem.year) !== active.period) return false;
    return true;
}

function renderHistoryEvents(events, sourceProvinces, filters = { type: 'all', admin: 'all', region: 'all', period: 'all' }) {
    const filteredEvents = events.filter(ev => eventMatchesAdvancedFilters(ev, filters));
    if (filteredEvents.length === 0) {
        return `<div class="history-empty">${tr('noEventGroup', 'Không có sự kiện nào thuộc nhóm này.')}</div>`;
    }

    return filteredEvents.map(ev => {
        const desc = ev.desc || ev.description || ev.content || "";
        let timeDisplay = ev.date || ev.time || ev.year || tr('unknownTime', "Không rõ thời gian");
        let locDisplay = "";

        if (ev.location) {
            if (typeof ev.location === 'string') locDisplay = ev.location;
            else if (typeof ev.location === 'object') {
                const parts = [];
                if (ev.location.commune) parts.push(ev.location.commune);
                if (ev.location.district) parts.push(ev.location.district);
                locDisplay = parts.join(", ");
            }
        }

        const sourceBadge = sourceProvinces.length > 1 ? `<span class="merged-source-badge">${escapeHtml(ev.sourceProv)}</span>` : '';
        const tagHtml = Array.isArray(ev.tags) && ev.tags.length
            ? `<div class="event-tags">${ev.tags.map(tag => `<span class="event-tag">${escapeHtml(tag)}</span>`).join('')}</div>`
            : '';
        const videoHtml = renderVideoLinks(ev);
        return `
                    <div class="event-item">
                        <div class="event-year">${escapeHtml(timeDisplay)} ${sourceBadge}</div>
                        <div class="event-title">${escapeHtml(ev.title)}</div>
                        ${locDisplay ? `<div class="event-loc"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(locDisplay)}</div>` : ''}
                        ${desc ? `<div class="event-desc">${escapeHtml(desc)}</div>` : ''}
                        ${tagHtml}
                        ${videoHtml}
                    </div>`;
    }).join('');
}

function firstTextValue(props, keys) {
    for (const key of keys) {
        const value = props[key];
        if (value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== 'NA') {
            return String(value).trim();
        }
    }
    return '';
}

function findProvinceTypeFromCurrentMap(provinceName) {
    if (!layers.province || !provinceName) return '';
    const targetName = normalizeMemoryName(provinceName);
    let foundType = '';

    layers.province.eachLayer(layer => {
        if (foundType || !layer.feature || !layer.feature.properties) return;
        const props = layer.feature.properties;
        const name = firstTextValue(props, ['ten_tinh', 'Name', 'NAME_1', 'PROV_NAME', 'province']);
        if (normalizeMemoryName(name) !== targetName) return;

        foundType = firstTextValue(props, ['TYPE_1', 'type_1']) ||
            (String(props.cap || '') === '1' ? firstTextValue(props, ['loai']) : '');
    });

    return foundType;
}

function findDistrictTypeFromCurrentMap(provinceName, districtName) {
    if (!layers.district || !districtName) return '';
    const targetProvince = normalizeMemoryName(provinceName);
    const targetDistrict = normalizeMemoryName(districtName);
    let foundType = '';

    layers.district.eachLayer(layer => {
        if (foundType || !layer.feature || !layer.feature.properties) return;
        const props = layer.feature.properties;
        const province = firstTextValue(props, ['ten_tinh', 'Name', 'NAME_1', 'PROV_NAME', 'province']);
        const district = firstTextValue(props, ['ten_huyen', 'NAME_2', 'DIST_NAME', 'district']);
        const sameProvince = !targetProvince || normalizeMemoryName(province) === targetProvince;
        const sameDistrict = normalizeMemoryName(district) === targetDistrict;

        if (sameProvince && sameDistrict) {
            foundType = firstTextValue(props, ['TYPE_2', 'type_2']);
        }
    });

    return foundType;
}

function normalizeAdminType(value, fallback) {
    const type = String(value || '').trim();
    return type && type !== 'NA' ? type : fallback;
}

function getAdminUnit(props, level) {
    const safeProps = props || {};

    if (level === 'province') {
        const name = firstTextValue(safeProps, ['ten_tinh', 'Name', 'NAME_1', 'PROV_NAME', 'province']);
        const type = firstTextValue(safeProps, ['TYPE_1', 'type_1']) ||
            (String(safeProps.cap || '') === '1' ? firstTextValue(safeProps, ['loai']) : '') ||
            findProvinceTypeFromCurrentMap(name);
        return { label: normalizeAdminType(type, 'Tỉnh'), name };
    }

    if (level === 'district') {
        const provinceName = firstTextValue(safeProps, ['ten_tinh', 'Name', 'NAME_1', 'PROV_NAME', 'province']);
        const name = firstTextValue(safeProps, ['ten_huyen', 'NAME_2', 'DIST_NAME', 'district']);
        const type = firstTextValue(safeProps, ['TYPE_2', 'type_2']) ||
            findDistrictTypeFromCurrentMap(provinceName, name);
        return { label: normalizeAdminType(type, 'Huyện'), name };
    }

    const name = firstTextValue(safeProps, ['ten_xa', 'NAME_3', 'WARD_NAME', 'ward']);
    const type = firstTextValue(safeProps, ['TYPE_3', 'type_3']) ||
        (String(safeProps.cap || '') === '2' ? firstTextValue(safeProps, ['loai']) : '');
    return { label: normalizeAdminType(type, 'Xã'), name };
}

function renderAdminRow(unit) {
    if (!unit || !unit.name) return '';
    const label = translateAdminLabel(unit.label);
    return `<div class="info-row"><span class="info-label">${escapeHtml(label)}:</span> <span class="info-value">${escapeHtml(unit.name)}</span></div>`;
}

function translateAdminLabel(label) {
    if (!isEnglish()) return label;
    const norm = normalizeMemoryName(label);
    if (norm.includes('tinh') || norm.includes('thanh pho')) return UI_EN.provinceLabel;
    if (norm.includes('huyen') || norm.includes('quan') || norm.includes('thi xa')) return UI_EN.districtLabel;
    if (norm.includes('xa') || norm.includes('phuong') || norm.includes('thi tran')) return UI_EN.wardLabel;
    return label;
}

function getMapTooltipContent(feature, type) {
    const props = feature && feature.properties ? feature.properties : {};
    let province = getAdminUnit(props, 'province');
    if (shouldShowForeignGuestProvinceLabels() && province.name) {
        const alt = getProvinceDisplayName(province.name);
        if (alt !== province.name) province = { ...province, name: alt };
    }
    const district = getAdminUnit(props, 'district');
    const ward = getAdminUnit(props, 'ward');
    const currentYear = getCurrentYear();
    const rows = [];

    if (province.name) rows.push(`<strong>${escapeHtml(translateAdminLabel(province.label))}:</strong> ${escapeHtml(province.name)}`);
    if (currentYear && currentYear >= 2008) {
        if ((type === 'district' || type === 'ward') && district.name) rows.push(`<strong>${escapeHtml(translateAdminLabel(district.label))}:</strong> ${escapeHtml(district.name)}`);
        if (type === 'ward' && ward.name) rows.push(`<strong>${escapeHtml(translateAdminLabel(ward.label))}:</strong> ${escapeHtml(ward.name)}`);
    }

    return rows.length ? rows.join('<br>') : escapeHtml(getFeatureName(feature));
}

function bindMapFeatureTooltip(feature, layer, type) {
    layer.bindTooltip(getMapTooltipContent(feature, type), {
        sticky: true,
        direction: 'top',
        opacity: 0.95
    });
}

function bindMapFeatureEvents(feature, layer, type) {
    bindMapFeatureTooltip(feature, layer, type);
    layer.on({
        mouseover: () => {
            hoveredFeature = { feat: feature, type, layer };
            updateMapContextUI();
        },
        mouseout: () => {
            if (hoveredFeature && hoveredFeature.layer === layer) {
                hoveredFeature = null;
                updateMapContextUI();
            }
        },
        click: (e) => onFeatureClick(e, feature, layer, type)
    });
}

function disableMemoryFeatureTooltip(layer) {
    if (layer.closeTooltip) layer.closeTooltip();
    if (layer.unbindTooltip) layer.unbindTooltip();
}

function topoJsonToGeoJson(data, fileName) {
    if (!window.topojson) {
        throw new Error('topojson-client chưa được tải.');
    }

    const objectKeys = Object.keys(data.objects || {});
    if (objectKeys.length === 0) {
        throw new Error(`TopoJSON ${fileName} không có object dữ liệu.`);
    }

    const objectKey = data.objects.map ? 'map' : objectKeys[0];
    return topojson.feature(data, data.objects[objectKey]);
}

async function loadMapData(fileName) {
    // Trả ngay từ cache nếu đã tải trước đó (0ms)
    if (mapDataCache[fileName]) {
        return mapDataCache[fileName];
    }

    const res = await fetch(`/api/map/${encodeURIComponent(fileName)}`);
    if (!res.ok) {
        throw new Error(`Không tải được dữ liệu bản đồ: ${fileName}`);
    }

    const data = await res.json();
    const geoData = (data && data.type === 'Topology')
        ? topoJsonToGeoJson(data, fileName)
        : data;

    mapDataCache[fileName] = geoData; // Lưu vào cache để dùng lại
    return geoData;
}

function getMemoryYear() {
    const select = document.getElementById('memoryYearSelect');
    return Number(select.value || AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]);
}

function getMemoryBestKey() {
    return `memory_best_score_${getMemoryYear()}_${memoryMode}_${memoryRegion}`;
}

function setupMemoryTab() {
    const select = document.getElementById('memoryYearSelect');
    const modeSelect = document.getElementById('memoryModeSelect');
    const regionSelect = document.getElementById('memoryRegionSelect');
    const provinceYears = DATA_SOURCES.province.map(x => x.year).sort((a, b) => a - b);
    select.innerHTML = provinceYears.map(year => `<option value="${year}">${year}</option>`).join('');
    if (provinceYears.length > 0) select.value = provinceYears[provinceYears.length - 1];
    if (modeSelect) {
        modeSelect.value = memoryMode;
        modeSelect.onchange = () => {
            memoryMode = modeSelect.value === 'shape' ? 'shape' : 'map';
            resetMemoryGame();
            refreshMemoryMapViewport({ fit: memoryMode === 'map' });
            applyLanguageToStaticDom();
            updateMemoryStats();
        };
    }
    if (regionSelect) {
        regionSelect.value = memoryRegion;
        regionSelect.onchange = () => {
            memoryRegion = ['north', 'central', 'south'].includes(regionSelect.value) ? regionSelect.value : 'all';
            resetMemoryGame();
            updateMemoryStats();
        };
    }
    select.onchange = () => {
        resetMemoryGame();
        loadMemoryMap(getMemoryYear());
    };
    updateMemoryStats();
    setMemoryMapIdleOverlay(true);
    loadMemoryMap(getMemoryYear());
}

function ensureMemoryMap() {
    if (memoryMap) return;
    memoryMap = L.map('memoryMap', { zoomControl: true }).setView([16.047079, 108.206230], 5);
    L.tileLayer('https://mt0.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}', {
        maxZoom: 21,
        attribution: 'Map data &copy; Google',
        crossOrigin: true
    }).addTo(memoryMap);
    memoryMap.on('tooltipopen', e => {
        if (e.tooltip) memoryMap.closeTooltip(e.tooltip);
    });
}

function memoryDefaultStyle(feature) {
    return {
        fillColor: getColor(getFeatureName(feature)),
        weight: 1,
        color: '#ffffff',
        fillOpacity: 0.62,
        opacity: 0.9
    };
}

function memoryHoverStyle() {
    return { weight: 3, color: '#fdd835', fillOpacity: 0.78 };
}

function memoryHiddenShapeStyle() {
    return { fillOpacity: 0, opacity: 0, weight: 0, color: 'transparent', interactive: false };
}

function memoryShapeTargetStyle() {
    return {
        fillColor: '#6fa96f',
        fillOpacity: 0.78,
        color: '#255b2d',
        weight: 2,
        opacity: 1
    };
}

async function loadMemoryMap(year) {
    ensureMemoryMap();
    const feedback = document.getElementById('memoryFeedback');
    const pEntry = DATA_SOURCES.province.find(x => x.year === Number(year));
    if (!pEntry) {
        feedback.className = 'memory-feedback wrong';
        feedback.textContent = tr('noProvinceMapData', 'Không có dữ liệu tỉnh/thành cho năm đã chọn.');
        return;
    }

    feedback.className = 'memory-feedback';
    feedback.textContent = tr('loadingMemoryMap', 'Đang tải bản đồ luyện nhớ...');

    try {
        if (!memoryDataCache[year]) {
            memoryDataCache[year] = await loadMapData(pEntry.file);
        }
        if (memoryProvinceLayer) memoryMap.removeLayer(memoryProvinceLayer);
        memoryFeatures = [];

        memoryProvinceLayer = L.geoJSON(memoryDataCache[year], {
            style: memoryDefaultStyle,
            onEachFeature: (feature, layer) => {
                const name = getFeatureName(feature);
                feature.__memoryName = name;
                feature.__memoryNorm = normalizeMemoryName(name);
                feature.__memoryLayer = layer;
                memoryFeatures.push(feature);
                disableMemoryFeatureTooltip(layer);

                layer.on({
                    mouseover: () => {
                        if (memoryMode === 'shape' || !memoryGameActive || !memoryAcceptingAnswer) return;
                        layer.setStyle(memoryHoverStyle());
                    },
                    mouseout: () => {
                        if (memoryMode === 'shape') return;
                        if (!memoryGameActive || !memoryCurrent || memoryCurrent.feature !== feature) {
                            layer.setStyle(memoryDefaultStyle(feature));
                        }
                    },
                    click: () => {
                        if (memoryMode === 'map') handleMemoryGuess(feature, layer);
                    }
                });
            }
        }).addTo(memoryMap);

        if (memoryProvinceLayer.getBounds().isValid()) {
            memoryMap.fitBounds(memoryProvinceLayer.getBounds(), { padding: [20, 20] });
        }
        memoryMap.invalidateSize();
        feedback.textContent = tr('memoryMapReady', 'Bản đồ đã sẵn sàng. Bấm bắt đầu để luyện nhớ.');
    } catch (err) {
        console.error('Memory map error:', err);
        feedback.className = 'memory-feedback wrong';
        feedback.textContent = 'Không tải được dữ liệu bản đồ luyện nhớ.';
    }
}

function updateMemoryStats() {
    document.getElementById('memoryScore').textContent = memoryScore;
    document.getElementById('memoryRound').textContent = `${memoryRound}/${memoryTotalRounds}`;
    document.getElementById('memoryStreak').textContent = memoryStreak;
    document.getElementById('memoryBest').textContent = localStorage.getItem(getMemoryBestKey()) || '0';
}

function setMemoryMapIdleOverlay(show) {
    document.getElementById('memoryMapIdle').classList.toggle('hidden', !show);
    document.getElementById('memoryMapNote').classList.toggle('hidden', show);
}

function setMemoryShapeModeClass(active) {
    document.getElementById('memoryMap')?.classList.toggle('shape-quiz-mode', Boolean(active));
}

function refreshMemoryMapViewport(options = {}) {
    if (!memoryMap) return;
    memoryMap.invalidateSize();
    if (options.fit && memoryProvinceLayer && memoryProvinceLayer.getBounds().isValid()) {
        memoryMap.fitBounds(memoryProvinceLayer.getBounds(), { padding: [20, 20] });
    }
}

function setMemoryControls(active) {
    document.getElementById('memoryHintBtn').disabled = !active || memoryMode === 'shape';
    document.getElementById('memorySkipBtn').disabled = !active;
    document.getElementById('memoryStartBtn').innerHTML = active ? `<i class="fas fa-hourglass-half"></i> ${tr('playing', 'Đang chơi')}` : `<i class="fas fa-play"></i> ${tr('start', 'Bắt đầu')}`;
    document.getElementById('memoryStartBtn').disabled = active;
    document.getElementById('memoryYearSelect').disabled = active;
    document.getElementById('memoryModeSelect').disabled = active;
    document.getElementById('memoryRegionSelect').disabled = active;
    const note = document.getElementById('memoryMapNote');
    if (note) {
        note.textContent = memoryMode === 'shape'
            ? tr('memoryShapeNote', 'Chỉ hiện hình dạng tỉnh/thành. Hãy chọn một trong bốn đáp án.')
            : tr('memoryMapNote', 'Bấm trực tiếp vào tỉnh/thành trên bản đồ để trả lời.');
    }
    setMemoryMapIdleOverlay(!active);
    setMemoryShapeModeClass(active && memoryMode === 'shape');
}

function resetMemoryStyles() {
    if (!memoryProvinceLayer) return;
    memoryProvinceLayer.eachLayer(layer => {
        if (!layer.feature) return;
        if (memoryMode === 'shape' && memoryGameActive) {
            const isCurrent = memoryCurrent && memoryCurrent.feature === layer.feature;
            layer.setStyle(isCurrent ? memoryShapeTargetStyle() : memoryHiddenShapeStyle());
        } else {
            layer.setStyle(memoryDefaultStyle(layer.feature));
        }
    });
}

function shuffleMemoryFeatures(features) {
    const list = [...features];
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function getMemoryQuestionPool() {
    if (memoryRegion === 'all') return memoryFeatures;
    return memoryFeatures.filter(feature => getRegionForProvince(getFeatureName(feature)) === memoryRegion);
}

function getMemoryQuestionSetLabel() {
    const labels = {
        all: tr('randomNationwide', 'Random cả nước'),
        north: tr('northRegion', 'Miền Bắc'),
        central: tr('centralRegion', 'Miền Trung'),
        south: tr('southRegion', 'Miền Nam')
    };
    return labels[memoryRegion] || labels.all;
}

function buildMemoryChoiceOptions(answerFeature, pool) {
    const expected = answerFeature.__memoryNorm;
    const seen = new Set([expected]);
    const options = [answerFeature];
    const addCandidates = candidates => {
        for (const feature of shuffleMemoryFeatures(candidates)) {
            if (!feature.__memoryNorm || seen.has(feature.__memoryNorm)) continue;
            seen.add(feature.__memoryNorm);
            options.push(feature);
            if (options.length >= 4) break;
        }
    };
    addCandidates(pool);
    if (options.length < 4) addCandidates(memoryFeatures);
    return shuffleMemoryFeatures(options);
}

function renderMemoryChoices() {
    const choices = document.getElementById('memoryChoices');
    if (!choices) return;
    choices.innerHTML = '';
    choices.classList.toggle('hidden', memoryMode !== 'shape' || !memoryGameActive || !memoryCurrent);
    if (memoryMode !== 'shape' || !memoryCurrent) return;

    memoryCurrent.options.forEach((feature, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'memory-choice-btn';
        btn.dataset.answer = feature.__memoryNorm;
        btn.textContent = `${String.fromCharCode(65 + index)}. ${getFeatureName(feature)}`;
        btn.onclick = () => handleMemoryChoice(feature, btn);
        choices.appendChild(btn);
    });
}

function revealMemoryChoices(selectedNorm) {
    const choices = document.getElementById('memoryChoices');
    if (!choices || !memoryCurrent) return;
    const expected = memoryCurrent.feature.__memoryNorm;
    choices.querySelectorAll('.memory-choice-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.answer === expected) btn.classList.add('correct');
        if (selectedNorm && btn.dataset.answer === selectedNorm && selectedNorm !== expected) btn.classList.add('wrong');
    });
}

function finalizeMemoryAnswer(ok, guessedName, expectedName, delay = 1100) {
    addMemoryResult(ok, guessedName, expectedName);
    memoryRound += 1;
    updateMemoryStats();
    setTimeout(nextMemoryQuestion, delay);
}

async function startMemoryGame() {
    if (!memoryMap) await loadMemoryMap(getMemoryYear());
    if (memoryFeatures.length === 0) return;

    memoryMode = document.getElementById('memoryModeSelect')?.value === 'shape' ? 'shape' : 'map';
    const selectedRegion = document.getElementById('memoryRegionSelect')?.value || 'all';
    memoryRegion = ['north', 'central', 'south'].includes(selectedRegion) ? selectedRegion : 'all';
    const questionPool = getMemoryQuestionPool();
    if (questionPool.length < 1 || (memoryMode === 'shape' && memoryFeatures.length < 4)) {
        document.getElementById('memoryFeedback').className = 'memory-feedback wrong';
        document.getElementById('memoryFeedback').textContent = tr('noQuestionsForRegion', 'Không đủ dữ liệu tỉnh/thành cho bộ câu hỏi này.');
        return;
    }

    memoryTotalRounds = Math.min(10, questionPool.length);
    memoryQuestions = shuffleMemoryFeatures(questionPool).slice(0, memoryTotalRounds);
    memoryScore = 0;
    memoryRound = 0;
    memoryStreak = 0;
    memoryGameActive = true;
    memoryAcceptingAnswer = true;
    memoryHintUsed = false;
    document.getElementById('memoryResults').innerHTML = '';
    document.getElementById('memoryFeedback').className = 'memory-feedback';
    document.getElementById('memoryFeedback').textContent = memoryMode === 'shape'
        ? tr('chooseShapePrompt', 'Quan sát hình dạng tỉnh/thành rồi chọn một đáp án.')
        : tr('chooseOnMapPrompt', 'Hãy bấm vào tỉnh/thành đúng trên bản đồ.');
    setMemoryControls(true);
    updateMemoryStats();
    nextMemoryQuestion();
}

function nextMemoryQuestion() {
    resetMemoryStyles();
    if (memoryRound >= memoryTotalRounds) {
        finishMemoryGame();
        return;
    }
    const feature = memoryQuestions[memoryRound];
    memoryCurrent = {
        feature,
        attempts: 0,
        options: memoryMode === 'shape' ? buildMemoryChoiceOptions(feature, getMemoryQuestionPool()) : []
    };
    memoryHintUsed = false;
    memoryAcceptingAnswer = true;
    document.getElementById('memoryHintBtn').disabled = memoryMode === 'shape';
    document.getElementById('memoryTargetLabel').textContent = memoryMode === 'shape'
        ? tr('identifyShape', 'Đây là tỉnh/thành nào?')
        : tr('findPlace', 'Hãy tìm địa phương');
    document.getElementById('memoryTarget').textContent = memoryMode === 'shape'
        ? `${tr('questions', 'Câu')} ${memoryRound + 1}: ${getMemoryQuestionSetLabel()}`
        : getFeatureName(memoryCurrent.feature);
    resetMemoryStyles();
    if (memoryMode === 'shape') {
        renderMemoryChoices();
        const layer = memoryCurrent.feature.__memoryLayer;
        if (layer && layer.getBounds) {
            memoryMap.fitBounds(layer.getBounds(), { padding: [90, 90], maxZoom: 7 });
        }
    } else {
        document.getElementById('memoryChoices')?.classList.add('hidden');
    }
    updateMemoryStats();
}

function handleMemoryGuess(feature, layer) {
    if (memoryMode !== 'map' || !memoryGameActive || !memoryAcceptingAnswer || !memoryCurrent) return;

    const expected = memoryCurrent.feature.__memoryNorm;
    const guessed = feature.__memoryNorm;
    const feedback = document.getElementById('memoryFeedback');
    memoryAcceptingAnswer = false;

    if (guessed === expected) {
        memoryStreak += 1;
        const bonus = Math.min(memoryStreak - 1, 5);
        const hintPenalty = memoryHintUsed ? 2 : 0;
        const gained = Math.max(5, 10 + bonus - hintPenalty);
        memoryScore += gained;
        layer.setStyle({ weight: 4, color: '#1b5e20', fillOpacity: 0.86 });
        feedback.className = 'memory-feedback correct';
        feedback.textContent = `${tr('correct', 'Đúng')}: ${getFeatureName(feature)}. +${gained} ${tr('points', 'điểm')}.`;
        finalizeMemoryAnswer(true, getFeatureName(feature), getFeatureName(memoryCurrent.feature));
    } else {
        memoryStreak = 0;
        layer.setStyle({ weight: 4, color: '#b71c1c', fillOpacity: 0.82 });
        memoryCurrent.feature.__memoryLayer.setStyle({ weight: 4, color: '#1b5e20', fillOpacity: 0.86 });
        feedback.className = 'memory-feedback wrong';
        feedback.textContent = `${tr('wrongProvinceSelected', 'Tỉnh/TP mà bạn đang chọn là')} ${getFeatureName(feature)}.`;
        finalizeMemoryAnswer(false, getFeatureName(feature), getFeatureName(memoryCurrent.feature));
    }
}

function handleMemoryChoice(feature, button) {
    if (memoryMode !== 'shape' || !memoryGameActive || !memoryAcceptingAnswer || !memoryCurrent) return;

    const expected = memoryCurrent.feature.__memoryNorm;
    const guessed = feature.__memoryNorm;
    const feedback = document.getElementById('memoryFeedback');
    memoryAcceptingAnswer = false;
    revealMemoryChoices(guessed);

    if (guessed === expected) {
        memoryStreak += 1;
        const bonus = Math.min(memoryStreak - 1, 5);
        const gained = 10 + bonus;
        memoryScore += gained;
        memoryCurrent.feature.__memoryLayer.setStyle({ ...memoryShapeTargetStyle(), color: '#1b5e20', fillOpacity: 0.86 });
        feedback.className = 'memory-feedback correct';
        feedback.textContent = `${tr('correct', 'Đúng')}: ${getFeatureName(feature)}. +${gained} ${tr('points', 'điểm')}.`;
        finalizeMemoryAnswer(true, getFeatureName(feature), getFeatureName(memoryCurrent.feature));
    } else {
        memoryStreak = 0;
        if (button) button.classList.add('wrong');
        memoryCurrent.feature.__memoryLayer.setStyle({ ...memoryShapeTargetStyle(), color: '#1b5e20', fillOpacity: 0.86 });
        feedback.className = 'memory-feedback wrong';
        feedback.textContent = `${tr('wrongProvinceSelected', 'Tỉnh/TP mà bạn đang chọn là')} ${getFeatureName(feature)}.`;
        finalizeMemoryAnswer(false, getFeatureName(feature), getFeatureName(memoryCurrent.feature));
    }
}

function addMemoryResult(ok, guessed, expected) {
    const list = document.getElementById('memoryResults');
    const item = document.createElement('div');
    item.className = `memory-result ${ok ? 'ok' : 'miss'}`;
    item.innerHTML = `<span>${ok ? tr('correct', 'Đúng') : tr('wrong', 'Sai')}</span><strong>${expected}</strong>`;
    if (!ok) item.title = `Bạn chọn: ${guessed}`;
    list.prepend(item);
}

function showMemoryHint() {
    if (!memoryGameActive || !memoryCurrent || memoryHintUsed) return;
    memoryHintUsed = true;
    document.getElementById('memoryHintBtn').disabled = true;
    const layer = memoryCurrent.feature.__memoryLayer;
    if (layer && layer.getBounds) {
        memoryMap.fitBounds(layer.getBounds(), { padding: [80, 80], maxZoom: 8 });
        layer.setStyle({ weight: 4, color: '#fdd835', fillOpacity: 0.8 });
    }
    document.getElementById('memoryFeedback').className = 'memory-feedback';
    document.getElementById('memoryFeedback').textContent = tr('hintShown', 'Gợi ý đã khoanh vùng đáp án. Trả lời đúng sẽ bị trừ 2 điểm.');
}

function skipMemoryQuestion() {
    if (!memoryGameActive || !memoryAcceptingAnswer || !memoryCurrent) return;
    memoryAcceptingAnswer = false;
    memoryStreak = 0;
    if (memoryMode === 'shape') {
        revealMemoryChoices(null);
        memoryCurrent.feature.__memoryLayer.setStyle({ ...memoryShapeTargetStyle(), color: '#1b5e20', fillOpacity: 0.86 });
    } else {
        memoryCurrent.feature.__memoryLayer.setStyle({ weight: 4, color: '#1b5e20', fillOpacity: 0.86 });
    }
    document.getElementById('memoryFeedback').className = 'memory-feedback wrong';
    document.getElementById('memoryFeedback').textContent = `${tr('skippedAnswer', 'Đã bỏ qua. Đáp án là')} ${getFeatureName(memoryCurrent.feature)}.`;
    finalizeMemoryAnswer(false, tr('skipped', 'Bỏ qua'), getFeatureName(memoryCurrent.feature), 900);
}

function finishMemoryGame() {
    memoryGameActive = false;
    memoryAcceptingAnswer = false;
    setMemoryControls(false);
    resetMemoryStyles();
    document.getElementById('memoryChoices')?.classList.add('hidden');
    setMemoryShapeModeClass(false);
    document.getElementById('memoryTarget').textContent = tr('complete', 'Hoàn thành');
    refreshMemoryMapViewport({ fit: memoryMode === 'map' });
    const bestKey = getMemoryBestKey();
    const best = Number(localStorage.getItem(bestKey) || 0);
    if (memoryScore > best) localStorage.setItem(bestKey, String(memoryScore));
    updateMemoryStats();
    document.getElementById('memoryFeedback').className = 'memory-feedback correct';
    document.getElementById('memoryFeedback').textContent = `${tr('gameFinished', 'Kết thúc lượt chơi')}: ${memoryScore} ${tr('pointsOver', 'điểm trên')} ${memoryTotalRounds} ${tr('questions', 'câu')}.`;
}

function resetMemoryGame() {
    memoryGameActive = false;
    memoryAcceptingAnswer = false;
    memoryQuestions = [];
    memoryCurrent = null;
    memoryScore = 0;
    memoryRound = 0;
    memoryStreak = 0;
    setMemoryControls(false);
    resetMemoryStyles();
    document.getElementById('memoryTargetLabel').textContent = memoryMode === 'shape'
        ? tr('identifyShape', 'Đây là tỉnh/thành nào?')
        : tr('findPlace', 'Hãy tìm địa phương');
    document.getElementById('memoryTarget').textContent = tr('pressStart', 'Bấm bắt đầu');
    document.getElementById('memoryChoices')?.classList.add('hidden');
    const choices = document.getElementById('memoryChoices');
    if (choices) choices.innerHTML = '';
    setMemoryShapeModeClass(false);
    refreshMemoryMapViewport({ fit: memoryMode === 'map' });
    document.getElementById('memoryFeedback').className = 'memory-feedback';
    document.getElementById('memoryFeedback').textContent = tr('memoryFeedbackIdle', 'Chọn năm dữ liệu rồi bắt đầu luyện nhớ vị trí tỉnh/thành.');
    document.getElementById('memoryResults').innerHTML = `<div style="color:#8a988a; font-style:italic;">${tr('noAnswers', 'Chưa có lượt trả lời.')}</div>`;
    updateMemoryStats();
}

async function updateMap(keepActiveTimelineState = false) {
    if (AVAILABLE_YEARS.length === 0) return;
    const year = AVAILABLE_YEARS[document.getElementById('timeline').value];
    document.getElementById('yearValue').innerText = year;
    updateUIControls(year);
    document.getElementById('loading').style.display = 'flex';
    clearTimelineHighlights(keepActiveTimelineState);

    if (layers.province) map.removeLayer(layers.province);
    if (layers.border) map.removeLayer(layers.border);
    if (layers.district) map.removeLayer(layers.district);
    if (layers.ward) map.removeLayer(layers.ward);

    try {
        const pEntry = DATA_SOURCES.province.find(x => x.year === year);
        if (pEntry) {
            const data = await loadMapData(pEntry.file);
            layers.province = L.geoJSON(data, {
                style: styles.province, pane: 'provincePane',
                onEachFeature: (f, l) => bindMapFeatureEvents(f, l, 'province')
            }).addTo(map);
            layers.border = L.geoJSON(data, { style: styles.border, pane: 'borderPane' }).addTo(map);
        }

        if (viewMode === 'district' && year >= 2008) {
            const dEntry = DATA_SOURCES.district.find(x => x.year === year);
            if (dEntry) {
                const data = await loadMapData(dEntry.file);
                layers.district = L.geoJSON(data, {
                    style: styles.district, pane: 'districtPane',
                    onEachFeature: (f, l) => bindMapFeatureEvents(f, l, 'district')
                }).addTo(map);
            }
        } else if (viewMode === 'ward' && year >= 2008) {
            if (year < 2025) {
                const dEntry = DATA_SOURCES.district.find(x => x.year === year);
                if (dEntry) {
                    const dData = await loadMapData(dEntry.file);
                    layers.district = L.geoJSON(dData, { style: { ...styles.district, interactive: false }, pane: 'districtPane' }).addTo(map);
                }
            }
            const wEntry = DATA_SOURCES.ward.find(x => x.year === year);
            if (wEntry) {
                const data = await loadMapData(wEntry.file);
                layers.ward = L.geoJSON(data, {
                    style: styles.ward, pane: 'wardPane',
                    onEachFeature: (f, l) => bindMapFeatureEvents(f, l, 'ward')
                }).addTo(map);
            }
        }
        if (selectedFeature) resetHighlight();
        hoveredFeature = null;
        updateMapContextUI();
    } catch (err) { console.warn("Map Update Error:", err); }
    finally {
        document.getElementById('loading').style.display = 'none';
        syncGuestEnButtonVisibility();
        if (splitViewEnabled) updateCompareMap();
    }
}

function buildMapContextFromFeature(feature, type) {
    const props = feature.properties;
    const province = getAdminUnit(props, 'province');
    const district = getAdminUnit(props, 'district');
    const ward = getAdminUnit(props, 'ward');
    const year = AVAILABLE_YEARS[document.getElementById('timeline').value];

    let displayName = province.name || '';
    if (year && year >= 2008) {
        if (type === 'district' && district.name) {
            displayName = [district.name, province.name].filter(Boolean).join(', ');
        } else if (type === 'ward' && ward.name) {
            displayName = [ward.name, district.name, province.name].filter(Boolean).join(', ');
        }
    }

    if (!displayName) return null;

    return {
        year,
        level: (year && year < 2008) ? 'province' : type,
        display_name: displayName,
        province: province.name || null,
        province_type: province.label || null,
        district: (year && year < 2008) ? null : (district.name || null),
        district_type: (year && year < 2008) ? null : (district.label || null),
        ward: (year && year < 2008) ? null : (ward.name || null),
        ward_type: (year && year < 2008) ? null : (ward.label || null)
    };
}

function getMapSelectionContext() {
    const source = hoveredFeature || selectedFeature;
    if (!source) return null;
    const ctx = buildMapContextFromFeature(source.feat, source.type);
    if (!ctx) return null;
    ctx.interaction = hoveredFeature ? 'hover' : 'click';
    return ctx;
}

function updateMapContextUI() {
    const ctx = getMapSelectionContext();
    const isHover = ctx && ctx.interaction === 'hover';

    const bar = document.getElementById('chatMapContext');
    if (bar) {
        if (!ctx) {
            bar.classList.remove('visible');
        } else {
            const labelEl = document.getElementById('chatMapContextLabel');
            const iconEl = document.getElementById('chatMapContextIcon');
            if (labelEl) labelEl.textContent = isHover ? tr('hoveringOnMap', 'Đang chỉ vào trên bản đồ:') : tr('selectedOnMap', 'Đang chọn trên bản đồ:');
            if (iconEl) iconEl.className = isHover ? 'fas fa-hand-pointer' : 'fas fa-map-pin';
            document.getElementById('chatMapContextName').textContent = mapContextDisplayForUi(ctx);
            document.getElementById('chatMapContextYear').textContent = ctx.year ? `(${tr('yearPrefix', 'năm')} ${ctx.year})` : '';
            bar.classList.add('visible');
        }
    }

    const miniBar = document.getElementById('miniChatMapContext');
    const miniText = document.getElementById('miniChatMapContextText');
    if (miniBar && miniText) {
        if (!ctx) {
            miniBar.classList.remove('visible');
        } else {
            const yearStr = ctx.year ? ` (${tr('yearPrefix', 'năm')} ${ctx.year})` : '';
            miniText.innerHTML = `${isHover ? tr('currentlyHover', 'Đang chỉ vào') : tr('currentlySelect', 'Đang chọn')}: <strong>${escapeHtml(mapContextDisplayForUi(ctx))}</strong>${yearStr}`;
            miniBar.classList.add('visible');
        }
    }
}

function sanitizeChatResponse(text) {
    if (!text || typeof text !== 'string') return text;
    let cleaned = text.replace(/\[[^\]]*\]\(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\)]+\)/gi, '');
    cleaned = cleaned.replace(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s\)]+/gi, '');
    const lines = cleaned.split('\n');
    const filtered = lines.filter(line => {
        const lower = line.toLowerCase();
        return !['video gợi ý', 'xem video', 'video liên quan', 'suggested video', 'watch on youtube', 'video youtube', 'gợi ý video'].some(term => lower.includes(term));
    });
    return filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function appendChatMessage(message, sender, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cleanedMessage = sender === 'ai' ? sanitizeChatResponse(message) : message;
    let messageHtml;
    if (containerId === 'chatMessages') {
        messageHtml = sender === 'user'
            ? `<div class="message user">${escapeHtml(message)}</div>`
            : `<div class="message ai">${marked.parse(cleanedMessage)}</div>`;
    } else {
        messageHtml = sender === 'user'
            ? `<div class="mini-chat-message user">${escapeHtml(message)}</div>`
            : `<div class="mini-chat-message ai">${marked.parse(cleanedMessage)}</div>`;
    }
    container.innerHTML += messageHtml;
    container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const isMainChat = containerId === 'chatMessages';
    container.innerHTML += isMainChat ? `
                <div class="message ai typing-indicator" id="typingIndicator-${containerId}">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>` : `
                <div class="mini-chat-message typing-indicator" id="typingIndicator-${containerId}">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>`;
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator(containerId) {
    const indicator = document.getElementById(`typingIndicator-${containerId}`);
    if (indicator) indicator.remove();
}

// --- MINI CHAT RESIZING, ZOOMING & EXPAND SYSTEM ---
const MINI_CHAT_SIZE_KEY = 'viemap_mini_chat_size';
let miniChatIsMaximized = false;
let miniChatPreviousSize = null;

function applyMiniChatSize(width, height, save = true) {
    const widget = document.getElementById('miniChatWidget');
    if (!widget) return;
    if (width !== undefined && width !== null) {
        widget.style.width = typeof width === 'number' ? `${Math.round(width)}px` : width;
    }
    if (height !== undefined && height !== null) {
        widget.style.height = typeof height === 'number' ? `${Math.round(height)}px` : height;
    }
    if (save && !miniChatIsMaximized) {
        try {
            localStorage.setItem(MINI_CHAT_SIZE_KEY, JSON.stringify({
                width: widget.style.width,
                height: widget.style.height
            }));
        } catch (_) {}
    }
}

function toggleMiniChatMaximize() {
    const widget = document.getElementById('miniChatWidget');
    const maxIcon = document.getElementById('miniChatMaximizeIcon');
    const maxBtn = document.getElementById('miniChatMaximizeBtn');
    if (!widget) return;

    miniChatIsMaximized = !miniChatIsMaximized;
    if (miniChatIsMaximized) {
        // Save current custom dimensions before maximizing
        miniChatPreviousSize = {
            width: widget.style.width || '',
            height: widget.style.height || ''
        };
        widget.classList.add('maximized');
        if (maxIcon) maxIcon.className = 'fas fa-compress';
        if (maxBtn) maxBtn.title = (typeof isEnglish === 'function' && isEnglish()) ? 'Restore size' : 'Thu nhỏ về kích thước cũ';
    } else {
        widget.classList.remove('maximized');
        if (maxIcon) maxIcon.className = 'fas fa-expand';
        if (maxBtn) maxBtn.title = (typeof isEnglish === 'function' && isEnglish()) ? 'Maximize chat' : 'Phóng to / Thu nhỏ khung chatbot';
        if (miniChatPreviousSize) {
            widget.style.width = miniChatPreviousSize.width;
            widget.style.height = miniChatPreviousSize.height;
        }
    }
}

function resetMiniChatSize() {
    const widget = document.getElementById('miniChatWidget');
    const maxIcon = document.getElementById('miniChatMaximizeIcon');
    const maxBtn = document.getElementById('miniChatMaximizeBtn');
    if (!widget) return;

    miniChatIsMaximized = false;
    miniChatPreviousSize = null;
    widget.classList.remove('maximized');
    widget.style.width = '';
    widget.style.height = '';
    widget.style.left = '';
    widget.style.bottom = '';
    widget.style.top = '';
    widget.style.right = '';

    if (maxIcon) maxIcon.className = 'fas fa-expand';
    if (maxBtn) maxBtn.title = (typeof isEnglish === 'function' && isEnglish()) ? 'Maximize chat' : 'Phóng to / Thu nhỏ khung chatbot';

    try {
        localStorage.removeItem(MINI_CHAT_SIZE_KEY);
    } catch (_) {}
}

function initMiniChatResizeAndDrag() {
    const widget = document.getElementById('miniChatWidget');
    if (!widget || widget.dataset.resizerReady) return;
    widget.dataset.resizerReady = 'true';

    // Restore saved size if available
    try {
        const saved = localStorage.getItem(MINI_CHAT_SIZE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.width && parsed.height) {
                applyMiniChatSize(parsed.width, parsed.height, false);
            }
        }
    } catch (e) {
        console.warn("Could not load saved mini chat size:", e);
    }

    // Attach pointer listeners to resizers
    const resizers = widget.querySelectorAll('.mini-chat-resizer');
    resizers.forEach(resizer => {
        resizer.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (miniChatIsMaximized) return;

            const direction = this.dataset.direction;
            const startX = e.clientX;
            const startY = e.clientY;
            const rect = widget.getBoundingClientRect();
            const startWidth = rect.width;
            const startHeight = rect.height;

            widget.classList.add('is-resizing');
            try {
                this.setPointerCapture(e.pointerId);
            } catch (_) {}

            const onPointerMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;

                let newWidth = startWidth;
                let newHeight = startHeight;

                const minW = 280;
                const maxW = Math.min(window.innerWidth - 32, 1100);
                const minH = 220;
                const maxH = Math.min(window.innerHeight - 80, 950);

                if (direction === 'top' || direction === 'top-right' || direction === 'top-left') {
                    newHeight = Math.max(minH, Math.min(maxH, startHeight - deltaY));
                }
                if (direction === 'bottom' || direction === 'bottom-right' || direction === 'bottom-left') {
                    newHeight = Math.max(minH, Math.min(maxH, startHeight + deltaY));
                }
                if (direction === 'right' || direction === 'top-right' || direction === 'bottom-right') {
                    newWidth = Math.max(minW, Math.min(maxW, startWidth + deltaX));
                }
                if (direction === 'left' || direction === 'top-left' || direction === 'bottom-left') {
                    newWidth = Math.max(minW, Math.min(maxW, startWidth - deltaX));
                }

                applyMiniChatSize(newWidth, newHeight, true);
            };

            const onPointerUp = (upEvent) => {
                widget.classList.remove('is-resizing');
                try {
                    resizer.releasePointerCapture(upEvent.pointerId);
                } catch (_) {}
                resizer.removeEventListener('pointermove', onPointerMove);
                resizer.removeEventListener('pointerup', onPointerUp);
                resizer.removeEventListener('pointercancel', onPointerUp);
            };

            resizer.addEventListener('pointermove', onPointerMove);
            resizer.addEventListener('pointerup', onPointerUp);
            resizer.addEventListener('pointercancel', onPointerUp);
        });
    });

    // Double-click header to toggle maximize / restore
    const header = widget.querySelector('.mini-chat-header');
    if (header) {
        header.addEventListener('dblclick', (e) => {
            if (e.target.closest('.mini-chat-actions') || e.target.closest('button')) return;
            toggleMiniChatMaximize();
        });
    }
}

function toggleMiniChat(open) {
    const widget = document.getElementById('miniChatWidget');
    const toggleBtn = document.getElementById('miniChatToggle');
    if (!widget || !toggleBtn) return;
    if (open) {
        initMiniChatResizeAndDrag();
        widget.classList.remove('closed');
        widget.classList.add('open');
        toggleBtn.style.display = 'none';
        const input = document.getElementById('miniChatInput');
        if (input) input.focus();
    } else {
        widget.classList.add('closed');
        widget.classList.remove('open');
        toggleBtn.style.display = 'grid';
    }
}

// --- CHAT HISTORY STORAGE & MANAGEMENT ---
const CHAT_SESSIONS_KEY = 'viemap_chat_sessions';

function loadAllChatSessions() {
    try {
        const raw = localStorage.getItem(CHAT_SESSIONS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Error loading chat sessions:", e);
        return [];
    }
}

function saveAllChatSessions(sessions) {
    try {
        localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error("Error saving chat sessions:", e);
    }
}

function getActiveChatSession() {
    let sessions = loadAllChatSessions();
    let currentId = localStorage.getItem('chat_session_id') || sessionId;
    let session = sessions.find(s => s.id === currentId);

    if (!session) {
        currentId = sessionId || crypto.randomUUID();
        sessionId = currentId;
        localStorage.setItem('chat_session_id', currentId);
        session = {
            id: currentId,
            title: isEnglish() ? 'New conversation' : 'Cuộc trò chuyện mới',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: []
        };
        sessions.unshift(session);
        saveAllChatSessions(sessions);
    }
    return session;
}

function saveChatMessageToHistory(sender, text) {
    if (!text) return;
    let sessions = loadAllChatSessions();
    let currentId = localStorage.getItem('chat_session_id') || sessionId;
    let idx = sessions.findIndex(s => s.id === currentId);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const msgObj = {
        id: crypto.randomUUID(),
        sender,
        text,
        timestamp: timeStr
    };

    if (idx !== -1) {
        sessions[idx].messages.push(msgObj);
        sessions[idx].updatedAt = now.toISOString();

        const defaultTitles = ['Cuộc trò chuyện mới', 'New conversation', 'Trợ lý AI Viemacle', 'Viemacle AI assistant'];
        if (sender === 'user' && (defaultTitles.includes(sessions[idx].title) || !sessions[idx].title)) {
            sessions[idx].title = text.length > 32 ? text.substring(0, 32) + '...' : text;
        }
    } else {
        const title = sender === 'user' ? (text.length > 32 ? text.substring(0, 32) + '...' : text) : (isEnglish() ? 'New conversation' : 'Cuộc trò chuyện mới');
        sessions.unshift({
            id: currentId,
            title,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            messages: [msgObj]
        });
    }

    saveAllChatSessions(sessions);
    renderChatHistoryList();
}

function renderSessionMessages(sessionIdToLoad) {
    const sessions = loadAllChatSessions();
    const session = sessions.find(s => s.id === sessionIdToLoad);

    const messagesDiv = document.getElementById('chatMessages');
    const miniMessages = document.getElementById('miniChatMessages');

    const defaultGreeting = tr('chatGreeting', 'Xin chào! Tôi là AI hỗ trợ tìm hiểu về Lịch sử và Địa lý Việt Nam. Hãy đặt câu hỏi cho tôi nhé!');

    if (!messagesDiv) return;
    messagesDiv.innerHTML = '';
    if (miniMessages) miniMessages.innerHTML = '';

    if (!session || !session.messages || session.messages.length === 0) {
        messagesDiv.innerHTML = `<div class="message ai">${escapeHtml(defaultGreeting)}</div>`;
        if (miniMessages) miniMessages.innerHTML = `<div class="mini-chat-message ai">${escapeHtml(defaultGreeting)}</div>`;
        return;
    }

    session.messages.forEach(msg => {
        const cleaned = msg.sender === 'ai' ? sanitizeChatResponse(msg.text) : msg.text;
        const mainHtml = msg.sender === 'user'
            ? `<div class="message user">${escapeHtml(msg.text)}</div>`
            : `<div class="message ai">${marked.parse(cleaned)}</div>`;
        messagesDiv.innerHTML += mainHtml;

        if (miniMessages) {
            const miniHtml = msg.sender === 'user'
                ? `<div class="mini-chat-message user">${escapeHtml(msg.text)}</div>`
                : `<div class="mini-chat-message ai">${marked.parse(cleaned)}</div>`;
            miniMessages.innerHTML += miniHtml;
        }
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    if (miniMessages) miniMessages.scrollTop = miniMessages.scrollHeight;
}

function switchChatSession(targetSessionId) {
    sessionId = targetSessionId;
    localStorage.setItem('chat_session_id', sessionId);
    renderSessionMessages(sessionId);
    renderChatHistoryList();
}

function createNewChatSession() {
    let sessions = loadAllChatSessions();
    const currentId = localStorage.getItem('chat_session_id') || sessionId;
    const currentSession = sessions.find(s => s.id === currentId);

    // If current session is already brand new (0 messages), just keep using it
    if (currentSession && (!currentSession.messages || currentSession.messages.length === 0)) {
        renderSessionMessages(currentId);
        renderChatHistoryList();
        const chatInput = document.getElementById('chatInput');
        if (chatInput) chatInput.focus();
        return;
    }

    // Filter out any invalid empty sessions from history before creating a new one
    sessions = sessions.filter(s => s.messages && s.messages.length > 0);

    // Create new session ID
    sessionId = crypto.randomUUID();
    localStorage.setItem('chat_session_id', sessionId);

    const defaultTitle = isEnglish() ? 'Cuộc trò chuyện mới' : 'Cuộc trò chuyện mới';
    const newSession = {
        id: sessionId,
        title: defaultTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
    };
    sessions.unshift(newSession);
    saveAllChatSessions(sessions);

    renderSessionMessages(sessionId);
    renderChatHistoryList();

    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.focus();
}

function deleteChatSession(targetSessionId, e) {
    if (e) e.stopPropagation();
    const confirmMsg = isEnglish() ? "Delete this conversation history?" : "Bạn có chắc chắn muốn xóa cuộc trò chuyện này?";
    if (!confirm(confirmMsg)) return;

    let sessions = loadAllChatSessions().filter(s => s.id !== targetSessionId);
    saveAllChatSessions(sessions);

    if (sessionId === targetSessionId) {
        if (sessions.length > 0) {
            sessionId = sessions[0].id;
        } else {
            sessionId = crypto.randomUUID();
            sessions.push({
                id: sessionId,
                title: isEnglish() ? 'New conversation' : 'Cuộc trò chuyện mới',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: []
            });
            saveAllChatSessions(sessions);
        }
        localStorage.setItem('chat_session_id', sessionId);
        renderSessionMessages(sessionId);
    }
    renderChatHistoryList();
}

function clearAllChatHistory() {
    const confirmMsg = isEnglish() ? "Clear all chat history?" : "Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?";
    if (!confirm(confirmMsg)) return;

    localStorage.removeItem(CHAT_SESSIONS_KEY);
    createNewChatSession();
}

function toggleChatHistory() {
    const sidebar = document.getElementById('chatSidebar');
    const toggleBtn = document.getElementById('btnToggleHistory');
    if (!sidebar) return;

    sidebar.classList.toggle('closed');
    if (toggleBtn) {
        toggleBtn.classList.toggle('active', !sidebar.classList.contains('closed'));
    }
}

function renderChatHistoryList() {
    const listEl = document.getElementById('chatHistoryList');
    if (!listEl) return;

    const sessions = loadAllChatSessions();
    const searchVal = (document.getElementById('chatHistorySearch')?.value || '').toLowerCase().trim();

    const filtered = sessions.filter(s => {
        if (!searchVal) return true;
        const matchTitle = (s.title || '').toLowerCase().includes(searchVal);
        const matchMsg = (s.messages || []).some(m => (m.text || '').toLowerCase().includes(searchVal));
        return matchTitle || matchMsg;
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="chat-history-empty">${isEnglish() ? 'No chat history found.' : 'Chưa có lịch sử trò chuyện nào.'}</div>`;
        return;
    }

    let html = '';
    filtered.forEach(s => {
        const isActive = s.id === sessionId ? 'active' : '';
        const d = new Date(s.updatedAt || s.createdAt);
        const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        const count = (s.messages || []).length;
        const displayTitle = s.title || (isEnglish() ? 'New conversation' : 'Cuộc trò chuyện mới');

        html += `
            <div class="history-item ${isActive}" onclick="switchChatSession('${s.id}')">
                <div class="history-item-content">
                    <div class="history-item-title"><i class="far fa-comments"></i> ${escapeHtml(displayTitle)}</div>
                    <div class="history-item-meta">${dateStr} • ${count} ${isEnglish() ? 'tin nhắn' : 'tin nhắn'}</div>
                </div>
                <button type="button" class="btn-delete-history" onclick="deleteChatSession('${s.id}', event)" title="${isEnglish() ? 'Delete' : 'Xóa'}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    });

    listEl.innerHTML = html;
}

async function sendMiniChatMessage() {
    const input = document.getElementById('miniChatInput');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    saveChatMessageToHistory('user', msg);

    appendChatMessage(msg, 'user', 'miniChatMessages');
    appendChatMessage(msg, 'user', 'chatMessages');
    appendTypingIndicator('miniChatMessages');
    appendTypingIndicator('chatMessages');

    try {
        const payload = { message: msg, session_id: sessionId, lang: currentLang };
        const mapContext = getMapSelectionContext();
        if (mapContext) payload.map_context = mapContext;
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        removeTypingIndicator('miniChatMessages');
        removeTypingIndicator('chatMessages');

        const cleanResp = sanitizeChatResponse(data.response);
        saveChatMessageToHistory('ai', cleanResp);

        appendChatMessage(cleanResp, 'ai', 'miniChatMessages');
        appendChatMessage(cleanResp, 'ai', 'chatMessages');
    } catch (e) {
        removeTypingIndicator('miniChatMessages');
        removeTypingIndicator('chatMessages');
        appendChatMessage(tr('connectionError', 'Lỗi kết nối.'), 'ai', 'miniChatMessages');
        appendChatMessage(tr('connectionError', 'Lỗi kết nối.'), 'ai', 'chatMessages');
    }
}

async function onFullChatResponse(message) {
    appendChatMessage(message, 'ai', 'chatMessages');
    const miniContainer = document.getElementById('miniChatMessages');
    if (miniContainer) appendChatMessage(message, 'ai', 'miniChatMessages');
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    saveChatMessageToHistory('user', msg);

    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML += `<div class="message user">${escapeHtml(msg)}</div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    const miniMessages = document.getElementById('miniChatMessages');
    if (miniMessages) miniMessages.innerHTML += `<div class="mini-chat-message user">${escapeHtml(msg)}</div>`;
    if (miniMessages) miniMessages.scrollTop = miniMessages.scrollHeight;

    const typingHtml = `
                <div class="message ai typing-indicator" id="typingIndicator">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>`;
    messagesDiv.innerHTML += typingHtml;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    if (miniMessages) miniMessages.innerHTML += `<div class="mini-chat-message typing-indicator" id="miniTypingIndicator-miniChatMessages"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    if (miniMessages) miniMessages.scrollTop = miniMessages.scrollHeight;

    (async () => {
        try {
            const payload = { message: msg, session_id: sessionId, lang: currentLang };
            const mapContext = getMapSelectionContext();
            if (mapContext) payload.map_context = mapContext;
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            const indicator = document.getElementById('typingIndicator');
            if (indicator) indicator.remove();
            const miniIndicator = document.getElementById('miniTypingIndicator-miniChatMessages');
            if (miniIndicator) miniIndicator.remove();
            const cleanResp = sanitizeChatResponse(data.response);

            saveChatMessageToHistory('ai', cleanResp);

            messagesDiv.innerHTML += `<div class="message ai">${marked.parse(cleanResp)}</div>`;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            if (miniMessages) {
                miniMessages.innerHTML += `<div class="mini-chat-message ai">${marked.parse(cleanResp)}</div>`;
                miniMessages.scrollTop = miniMessages.scrollHeight;
            }
        } catch (e) {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) indicator.remove();
            const miniIndicator = document.getElementById('miniTypingIndicator-miniChatMessages');
            if (miniIndicator) miniIndicator.remove();
            messagesDiv.innerHTML += `<div class="message ai" style="color:red;">${tr('connectionError', 'Lỗi kết nối.')}</div>`;
            if (miniMessages) miniMessages.innerHTML += `<div class="mini-chat-message ai" style="color:red;">${tr('connectionError', 'Lỗi kết nối.')}</div>`;
        }
    })();
}

function resetChat() {
    createNewChatSession();
}

function onFeatureClick(e, feature, layer, type) {
    L.DomEvent.stopPropagation(e);
    if (selectedFeature && selectedFeature.layer === layer) {
        resetHighlight();
    } else {
        resetHighlight();
        layer.setStyle(styles.high);
        if (layer.bringToFront) layer.bringToFront(); /* Đưa vùng được chọn lên trên cùng để bóng không bị che */
        if (layer.getElement) L.DomUtil.addClass(layer.getElement(), 'highlight-pop'); /* Thêm class CSS đổ bóng */
        selectedFeature = { layer: layer, feat: feature, type: type };
        updateInfoBox(feature.properties);
        document.getElementById('btnShowHistory').disabled = false;
        document.getElementById('btnBookmarkPlace').disabled = false;
        addRecentPlace(buildMapContextFromFeature(feature, type));
        updateMapContextUI();
    }
}

function resetHighlight() {
    if (selectedFeature) {
        const { layer, feat, type } = selectedFeature;
        if (layer.getElement) L.DomUtil.removeClass(layer.getElement(), 'highlight-pop'); /* Xóa class CSS đổ bóng */
        if (type === 'province') layer.setStyle(styles.province(feat));
        else layer.setStyle(styles[type]);
    }
    selectedFeature = null;
    document.getElementById('infoContent').innerHTML = `<div style="color: #95a5a6; font-style: italic;">${tr('choosePlace', 'Chọn một điểm trên bản đồ...')}</div>`;
    document.getElementById('btnShowHistory').disabled = true;
    document.getElementById('btnBookmarkPlace').disabled = true;
    updateMapContextUI();
}

function updateInfoBox(props) {
    let html = '';
    let province = getAdminUnit(props, 'province');
    if (shouldShowForeignGuestProvinceLabels() && province.name) {
        const alt = getProvinceDisplayName(province.name);
        province = { ...province, name: alt };
    }
    const district = getAdminUnit(props, 'district');
    const ward = getAdminUnit(props, 'ward');
    const currentYear = AVAILABLE_YEARS[document.getElementById('timeline').value];

    html += renderAdminRow(province);
    if (currentYear < 2008) {
        // Pre-2008: only show province
    } else if (currentYear >= 2025) {
        html += renderAdminRow(ward);
    } else {
        html += renderAdminRow(district);
        html += renderAdminRow(ward);
    }
    document.getElementById('infoContent').innerHTML = html || `<div style="color: #95a5a6; font-style: italic;">${tr('noLocalName', 'Không xác định được tên địa phương.')}</div>`;
    toggleInfoBox(true);
}

function updateUIControls(year) {
    const lblDist = document.getElementById('lblDistrict');
    const inpDist = lblDist.querySelector('input');
    const lblWard = document.getElementById('lblWard');
    const inpWard = lblWard.querySelector('input');

    const hasDistrict = year >= 2008 && DATA_SOURCES.district.some(x => x.year === year);
    const hasWard = year >= 2008 && DATA_SOURCES.ward.some(x => x.year === year);

    if (year < 2008 || year >= 2025 || !hasDistrict) {
        lblDist.classList.add('disabled');
        inpDist.disabled = true;
        if (viewMode === 'district') {
            viewMode = 'province';
            document.querySelector('input[value="province"]').checked = true;
            document.getElementById('lblProvince').classList.add('active');
        }
    } else {
        lblDist.classList.remove('disabled');
        inpDist.disabled = false;
    }

    if (year < 2008 || !hasWard) {
        lblWard.classList.add('disabled');
        inpWard.disabled = true;
        if (viewMode === 'ward') {
            viewMode = (!inpDist.disabled) ? 'district' : 'province';
            document.querySelector(`input[value="${viewMode}"]`).checked = true;
            document.getElementById(viewMode === 'district' ? 'lblDistrict' : 'lblProvince').classList.add('active');
        }
    } else {
        lblWard.classList.remove('disabled');
        inpWard.disabled = false;
    }

    document.querySelectorAll('.radio-wrapper').forEach(el => el.classList.remove('active'));
    document.querySelector(`input[value="${viewMode}"]`).parentElement.classList.add('active');
}

function reportFileBase() {
    const name = currentDetailReport?.province || 'viemap-report';
    return `viemap-${normalizeSmartText(name).replace(/\s+/g, '-') || 'report'}-${Date.now()}`;
}

function downloadBlob(filename, mimeType, content) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function buildReportPlainText(report) {
    const lines = [
        `Viemap report: ${report.display_province || report.province}`,
        `${tr('mapYear', 'Năm bản đồ')}: ${report.map_year || ''}`,
        `${tr('sourceProvince', 'Tỉnh nguồn')}: ${(report.source_provinces || []).join(', ')}`,
        `${tr('createdAt', 'Tạo lúc')}: ${report.generated_at}`,
        '',
        `${tr('historyEvents', 'Sự kiện')} (${report.events?.length || 0})`
    ];
    (report.events || []).slice(0, 18).forEach(ev => {
        lines.push(`- ${ev.year || ''}: ${ev.title || ''}`);
    });
    lines.push('', `${tr('landmarks', 'Địa danh')} (${report.sites?.length || 0})`);
    (report.sites || []).slice(0, 18).forEach(site => {
        lines.push(`- ${site.name || ''}: ${site.type_of_place || ''}`);
    });
    return lines.join('\n');
}

function exportCurrentReport(format) {
    if (!currentDetailReport) {
        alert(tr('noReportPlace', 'Chưa có địa phương để xuất báo cáo.'));
        return;
    }
    const base = reportFileBase();
    if (format === 'json') {
        downloadBlob(`${base}.json`, 'application/json;charset=utf-8', JSON.stringify(currentDetailReport, null, 2));
        return;
    }
    if (format === 'png') {
        const text = buildReportPlainText(currentDetailReport);
        const lines = text.split('\n');
        const canvas = document.createElement('canvas');
        const width = 1200;
        const lineHeight = 28;
        canvas.width = width;
        canvas.height = Math.max(640, 80 + lines.length * lineHeight);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#2E7D32';
        ctx.font = 'bold 28px Segoe UI, Arial';
        ctx.fillText(`Viemap Chronicle`, 40, 44);
        ctx.fillStyle = '#243824';
        ctx.font = '18px Segoe UI, Arial';
        lines.forEach((line, idx) => ctx.fillText(line.slice(0, 140), 40, 86 + idx * lineHeight));
        canvas.toBlob(blob => {
            if (blob) downloadBlob(`${base}.png`, 'image/png', blob);
        });
        return;
    }
    if (format === 'pdf') {
        const report = currentDetailReport;
        const win = window.open('', '_blank');
        if (!win) return;
        const eventRows = (report.events || []).map(ev => `<li><strong>${escapeHtml(ev.year || '')}</strong> ${escapeHtml(ev.title || '')}</li>`).join('');
        const siteRows = (report.sites || []).map(site => `<li><strong>${escapeHtml(site.name || '')}</strong> ${escapeHtml(site.type_of_place || '')}</li>`).join('');
        win.document.write(`
                    <html><head><title>${escapeHtml(report.province)} - Viemap</title>
                    <style>body{font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#243824;padding:28px}h1{color:#2E7D32}li{margin:6px 0}</style>
                    </head><body>
                    <h1>${escapeHtml(report.display_province || report.province)}</h1>
                    <p><strong>${tr('mapYear', 'Năm bản đồ')}:</strong> ${escapeHtml(report.map_year || '')}</p>
                    <p><strong>${tr('sourceProvince', 'Tỉnh nguồn')}:</strong> ${escapeHtml((report.source_provinces || []).join(', '))}</p>
                    <p><strong>Tạo lúc:</strong> ${escapeHtml(report.generated_at)}</p>
                    <h2>${tr('historyEvents', 'Sự kiện lịch sử')}</h2><ul>${eventRows || `<li>${tr('noData', 'Không có dữ liệu.')}</li>`}</ul>
                    <h2>${tr('landmarks', 'Địa danh & di tích')}</h2><ul>${siteRows || `<li>${tr('noData', 'Không có dữ liệu.')}</li>`}</ul>
                    </body></html>
                `);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 200);
    }
}

function getTourCopy(value) {
    if (!value || typeof value === 'string') return value || '';
    return isEnglish() ? (value.en || value.vi || '') : (value.vi || value.en || '');
}

function startQuickTour(startIndex = 0) {
    const requestedIndex = Number.isInteger(startIndex) ? startIndex : 0;
    currentTourIndex = Math.max(0, Math.min(requestedIndex, TOUR_STEPS.length - 1));
    const overlay = document.getElementById('tourOverlay');
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    document.body.classList.add('tour-running');
    renderTourStep();
}

function closeQuickTour() {
    const overlay = document.getElementById('tourOverlay');
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tour-running');
}

function getNavTabElement(tabName) {
    const navItems = document.querySelectorAll('.nav-item');
    for (const item of navItems) {
        const onclick = item.getAttribute('onclick') || '';
        if (onclick.includes(`switchMainTab('${tabName}')`) || onclick.includes(`switchMainTab("${tabName}")`)) {
            return item;
        }
    }
    return null;
}

function prepareTourStep(step) {
    if (step.tab) {
        switchMainTab(step.tab);
        if (step.tab === 'memory') {
            ensureMemoryMap();
            setTimeout(() => memoryMap?.invalidateSize(), 60);
        }
        if (step.tab === 'map') {
            setTimeout(() => map?.invalidateSize(), 60);
        }
    }
    if (step.openMiniChat) toggleMiniChat(true);
    document.getElementById('smartSearchResults')?.classList.remove('visible');
    document.getElementById('quickPlacesPanel')?.classList.remove('visible');
}

function getTourTarget(step) {
    if (step.navTabName) return getNavTabElement(step.navTabName);
    if (step.selector) return document.querySelector(step.selector);
    return null;
}

function getFallbackTourRect() {
    return {
        left: window.innerWidth / 2 - 100,
        right: window.innerWidth / 2 + 100,
        top: window.innerHeight / 2 - 50,
        bottom: window.innerHeight / 2 + 50,
        width: 200,
        height: 100
    };
}

function isUsableTourRect(rect) {
    return rect && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
}

function positionTourElements(step) {
    const spotlight = document.getElementById('tourSpotlight');
    const card = document.getElementById('tourCard');
    const target = getTourTarget(step);
    if (target && !step.navTabName && target.scrollIntoView) {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    }

    let rect = target ? target.getBoundingClientRect() : null;
    if (!isUsableTourRect(rect)) rect = getFallbackTourRect();

    document.getElementById('tourStepCount').textContent = `${currentTourIndex + 1}/${TOUR_STEPS.length}`;
    document.getElementById('tourTitle').textContent = getTourCopy(step.title);
    document.getElementById('tourText').textContent = getTourCopy(step.text);

    const prevBtn = document.getElementById('tourPrevBtn');
    const nextBtn = document.getElementById('tourNextBtn');
    const skipBtn = document.getElementById('tourSkipBtn');
    prevBtn.textContent = tr('tourPrev', 'Trước');
    prevBtn.disabled = currentTourIndex === 0;
    nextBtn.textContent = currentTourIndex === TOUR_STEPS.length - 1 ? tr('tourDone', 'Xong') : tr('tourNext', 'Tiếp');
    skipBtn.textContent = tr('tourSkip', 'Bỏ qua');

    const margin = 8;
    const spotLeft = Math.max(8, Math.min(rect.left - margin, window.innerWidth - 36));
    const spotTop = Math.max(8, Math.min(rect.top - margin, window.innerHeight - 36));
    const spotRight = Math.min(window.innerWidth - 8, Math.max(spotLeft + 28, rect.right + margin));
    const spotBottom = Math.min(window.innerHeight - 8, Math.max(spotTop + 28, rect.bottom + margin));
    spotlight.style.left = `${spotLeft}px`;
    spotlight.style.top = `${spotTop}px`;
    spotlight.style.width = `${spotRight - spotLeft}px`;
    spotlight.style.height = `${spotBottom - spotTop}px`;

    const cardWidth = Math.min(380, window.innerWidth - 28);
    card.style.width = `${cardWidth}px`;
    const cardHeight = Math.min(card.offsetHeight || 220, window.innerHeight - 24);
    let left = Math.min(Math.max(rect.left, 14), window.innerWidth - cardWidth - 14);
    let top = rect.bottom + 16;
    if (step.position === 'top' || top + cardHeight > window.innerHeight - 12) top = rect.top - cardHeight - 16;
    if (top < 12) top = Math.min(window.innerHeight - cardHeight - 12, 12);
    if (top < 12) top = 12;
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
}

function renderTourStep() {
    const step = TOUR_STEPS[currentTourIndex];
    if (!step) {
        closeQuickTour();
        return;
    }
    prepareTourStep(step);
    const renderIndex = currentTourIndex;
    requestAnimationFrame(() => {
        if (renderIndex === currentTourIndex && document.getElementById('tourOverlay')?.classList.contains('visible')) {
            positionTourElements(step);
        }
    });
}

document.getElementById('tourSkipBtn')?.addEventListener('click', closeQuickTour);
document.getElementById('tourPrevBtn')?.addEventListener('click', () => {
    currentTourIndex = Math.max(0, currentTourIndex - 1);
    renderTourStep();
});
document.getElementById('tourNextBtn')?.addEventListener('click', () => {
    currentTourIndex += 1;
    renderTourStep();
});
document.addEventListener('keydown', e => {
    if (!document.getElementById('tourOverlay')?.classList.contains('visible')) return;
    if (!['Escape', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Escape') closeQuickTour();
    if (e.key === 'ArrowLeft') {
        currentTourIndex = Math.max(0, currentTourIndex - 1);
        renderTourStep();
    }
    if (e.key === 'ArrowRight') {
        currentTourIndex += 1;
        renderTourStep();
    }
});
window.addEventListener('resize', () => {
    if (document.getElementById('tourOverlay')?.classList.contains('visible')) renderTourStep();
});

function toggleHistorySlide(show) {
    const panel = document.getElementById('historySlidePanel');
    show ? panel.classList.add('active') : panel.classList.remove('active');
}

// --- FETCH & DISPLAY DETAIL LOGIC ---
document.getElementById('btnShowHistory').addEventListener('click', async () => {
    if (!selectedFeature) return;
    toggleHistorySlide(true);
    const contentDiv = document.getElementById('sidePanelContent');
    contentDiv.innerHTML = `<div style="text-align:center; margin-top:30px;"><i class="fas fa-spinner fa-spin"></i> ${tr('loadingDetails', 'Đang tải thông tin chi tiết...')}</div>`;

    const props = selectedFeature.feat.properties;
    const provName = getAdminUnit(props, 'province').name;

    if (!provName) {
        contentDiv.innerHTML = `<p>${tr('noProvinceName', 'Không xác định được tên tỉnh.')}</p>`;
        return;
    }

    // Get current year to check for merger logic
    const currentYear = AVAILABLE_YEARS[document.getElementById('timeline').value];

    // Get constituent provinces if in 2025+
    const sourceProvinces = getConstituentProvinces(provName, currentYear);

    let htmlContent = `<h2 style="color:var(--primary-color); border-bottom:1px solid #eee; padding-bottom:10px;"><span id="sidePanelProvTitle" data-vn-prov="${escapeHtml(provName)}">${escapeHtml(provName)}</span></h2>`;

    // Show note if it's a merged province
    if (sourceProvinces.length > 1) {
        htmlContent += `<div style="font-size: 0.9rem; color: #555; margin-bottom: 10px;">
                    <i class="fas fa-layer-group"></i> <strong>${tr('mergedFrom', 'Sáp nhập từ:')}</strong> ${sourceProvinces.join(', ')}
                </div>`;
    }

    htmlContent += `<div style="font-size: 0.8rem; background: #fff3e0; padding: 8px; border-radius: 4px; color: #e65100; margin-bottom: 15px; border: 1px solid #ffe0b2;">
                <i class="fas fa-info-circle"></i> <em>${tr('yearBoundaryNote', 'Lưu ý: Địa chỉ sự kiện và địa danh dưới đây áp dụng theo địa giới hành chính mốc năm 2008.')}</em>
            </div>`;

    htmlContent += `
                <div class="local-info-tabs">
                    <button class="local-info-tab active" data-tab="historyTab">${tr('historyEvents', 'Sự kiện Lịch sử')}</button>
                    <button class="local-info-tab" data-tab="sitesTab">${tr('landmarks', 'Địa danh & Di tích')}</button>
                </div>
                <div id="historyTab" class="local-info-tab-panel active"></div>
                <div id="sitesTab" class="local-info-tab-panel"></div>
            `;

    contentDiv.innerHTML = htmlContent;
    refreshSidePanelTitleGuest();

    let aggregatedEvents = [];
    let aggregatedSites = [];
    let hasData = false;

    // Loop through all source provinces and fetch data
    for (const sourceProv of sourceProvinces) {
        const fileName = normalizeFileName(sourceProv);

        try {
            // Fetch History
            const historyRes = await fetch(localizedUrl(`/api/history/${fileName}`));
            if (historyRes.ok) {
                const hData = await historyRes.json();
                if (hData.events && hData.events.length > 0) {
                    // Add source info if merged
                    const historySource = getSourceMeta(hData.source, `HistoryData/${fileName}`);
                    const events = hData.events.map((ev, idx) => ({
                        ...ev,
                        sourceProv: sourceProv,
                        sourceMeta: {
                            ...historySource,
                            url: `${historySource.url || `/api/history/${fileName}`}#${ev.id || idx}`
                        }
                    }));
                    aggregatedEvents = aggregatedEvents.concat(events);
                    hasData = true;
                }
            }

            // Fetch Geo
            const geoRes = await fetch(localizedUrl(`/api/geodata/${fileName}`));
            if (geoRes.ok) {
                const gData = await geoRes.json();
                if (gData.sites && gData.sites.length > 0) {
                    const geoSource = getSourceMeta(gData.source, `GeoData/${fileName}`);
                    const sites = gData.sites.map((s, idx) => ({
                        ...s,
                        sourceProv: sourceProv,
                        sourceMeta: {
                            ...geoSource,
                            url: `${geoSource.url || `/api/geodata/${fileName}`}#site-${idx}`
                        }
                    }));
                    aggregatedSites = aggregatedSites.concat(sites);
                    hasData = true;
                }
            }
        } catch (e) {
            console.error(`Fetch Error for ${sourceProv}:`, e);
        }
    }

    // RENDER EVENTS
    if (aggregatedEvents.length > 0) {
        // Sort by year
        aggregatedEvents.sort((a, b) => (a.year || 0) - (b.year || 0));
        const filterButtons = [
            `<button class="history-filter-btn active" data-history-filter="all">${tr('all', 'Tất cả')}</button>`,
            ...HISTORY_TAG_FILTERS.map(filter => `<button class="history-filter-btn" data-history-filter="${filter.key}">${filter.label}</button>`)
        ].join('');

        const advancedFiltersHtml = `
                    <div class="advanced-filter-grid">
                        <select id="historyTypeFilter" aria-label="Loại sự kiện">
                            <option value="all">${tr('allEventTypes', 'Mọi loại sự kiện')}</option>
                            ${HISTORY_TAG_FILTERS.map(filter => `<option value="${filter.key}">${filter.label}</option>`).join('')}
                        </select>
                        <select id="historyAdminFilter" aria-label="Cấp hành chính">
                            <option value="all">${tr('allAdminLevels', 'Mọi cấp hành chính')}</option>
                            <option value="province">${tr('provinceCityLevel', 'Cấp tỉnh/thành')}</option>
                            <option value="district">${tr('districtLevel', 'Cấp huyện/quận')}</option>
                            <option value="ward">${tr('communeWardLevel', 'Cấp xã/phường')}</option>
                        </select>
                        <select id="historyRegionFilter" aria-label="Vùng miền">
                            <option value="all">${tr('allRegions', 'Mọi vùng miền')}</option>
                            <option value="north">${tr('northRegion', 'Miền Bắc')}</option>
                            <option value="central">${tr('centralRegion', 'Miền Trung - Tây Nguyên')}</option>
                            <option value="south">${tr('southRegion', 'Miền Nam')}</option>
                        </select>
                        <select id="historyPeriodFilter" aria-label="Giai đoạn">
                            <option value="all">${tr('allPeriods', 'Mọi giai đoạn')}</option>
                            <option value="pre1800">${tr('before1800', 'Trước 1800')}</option>
                            <option value="1800_1945">1800-1945</option>
                            <option value="1945_1975">1945-1975</option>
                            <option value="post1975">${tr('after1975', 'Sau 1975')}</option>
                        </select>
                    </div>`;

        const historyHtml = `
                    <div class="section-header"><i class="fas fa-history"></i> ${tr('historyEvents', 'Sự kiện Lịch sử')}</div>
                    <div class="history-filter-bar">${filterButtons}</div>
                    ${advancedFiltersHtml}
                    <div id="historyEventsList">${renderHistoryEvents(aggregatedEvents, sourceProvinces)}</div>
                `;
        document.getElementById('historyTab').innerHTML = historyHtml;
    } else {
        document.getElementById('historyTab').innerHTML = `<div class="section-header"><i class="fas fa-history"></i> ${tr('historyEvents', 'Sự kiện Lịch sử')}</div><p class="history-empty">${tr('noHistoryForPlace', 'Chưa có dữ liệu sự kiện lịch sử cho địa phương này.')}</p>`;
    }

    // RENDER SITES
    if (aggregatedSites.length > 0) {
        let sitesHtml = `<div class="section-header"><i class="fas fa-landmark"></i> ${tr('landmarks', 'Địa danh & Di tích')}</div>`;
        aggregatedSites.forEach(site => {
            let typeDisplay = site.type_of_place;
            if (typeDisplay && typeDisplay.toLowerCase() === 'natural') typeDisplay = tr('typeNatural', "Thiên nhiên");
            else if (typeDisplay && typeDisplay.toLowerCase() === 'historical') typeDisplay = tr('typeHistorical', "Lịch sử");

            let descHtml = '';
            if (site.event && site.event !== 'null') {
                descHtml = `<div class="site-desc">${escapeHtml(site.event)}</div>`;
            }

            const sourceBadge = sourceProvinces.length > 1 ? `<span class="merged-source-badge" style="float:right; margin-top: -2px;">${escapeHtml(site.sourceProv)}</span>` : '';

            const placeParts = [];
            if (site.place) {
                if (site.place.commune && site.place.commune !== 'null') placeParts.push(site.place.commune);
                if (site.place.district && site.place.district !== 'null') placeParts.push(site.place.district);
                if (site.place.province && site.place.province !== 'null') placeParts.push(site.place.province);
            }
            const googleSearchQuery = encodeURIComponent(`${site.name} ${placeParts.join(' ')}`.trim());
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleSearchQuery}`;
            const videoHtml = renderVideoLinks(site);
            sitesHtml += `
                    <div class="site-item">
                        <div class="site-name">${escapeHtml(site.name)} ${sourceBadge}</div>
                        <div class="site-type">${escapeHtml(typeDisplay || '')}</div>
                        ${descHtml}
                        <div class="site-loc"><i class="fas fa-map-pin"></i> ${escapeHtml(placeParts.join(', '))}</div>
                        ${videoHtml}
                        <a class="site-map-link" href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-location-dot"></i> ${tr('seeOnGoogleMaps', 'Xem trên Google Maps')}
                        </a>
                    </div>`;
        });
        document.getElementById('sitesTab').innerHTML = sitesHtml;
    } else {
        document.getElementById('sitesTab').innerHTML = `<div class="section-header"><i class="fas fa-landmark"></i> ${tr('landmarks', 'Địa danh & Di tích')}</div><p class="history-empty">${tr('noSitesForPlace', 'Chưa có dữ liệu địa danh và di tích cho địa phương này.')}</p>`;
    }

    if (!hasData) {
        const notice = document.createElement('p');
        notice.style.cssText = 'margin-top:20px; font-style:italic; color:#777;';
        notice.textContent = tr('noDetailsForPlace', 'Chưa có dữ liệu chi tiết cho địa phương này.');
        document.getElementById('sitesTab').insertAdjacentElement('afterend', notice);
    }

    currentDetailReport = {
        province: provName,
        display_province: getProvinceDisplayName(provName),
        map_year: currentYear,
        source_provinces: sourceProvinces,
        generated_at: new Date().toISOString(),
        events: aggregatedEvents,
        sites: aggregatedSites
    };

    // Tab switching for local details
    contentDiv.querySelectorAll('.local-info-tab').forEach(tabButton => {
        tabButton.addEventListener('click', () => {
            contentDiv.querySelectorAll('.local-info-tab').forEach(btn => btn.classList.remove('active'));
            contentDiv.querySelectorAll('.local-info-tab-panel').forEach(panel => panel.classList.remove('active'));
            tabButton.classList.add('active');
            const targetId = tabButton.dataset.tab;
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    const eventsList = document.getElementById('historyEventsList');
    if (eventsList) {
        contentDiv.querySelectorAll('.history-filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                contentDiv.querySelectorAll('.history-filter-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const typeFilter = document.getElementById('historyTypeFilter');
                if (typeFilter) typeFilter.value = button.dataset.historyFilter;
                eventsList.innerHTML = renderHistoryEvents(aggregatedEvents, sourceProvinces, getHistoryFiltersFromPanel());
            });
        });
        contentDiv.querySelectorAll('#historyTypeFilter, #historyAdminFilter, #historyRegionFilter, #historyPeriodFilter').forEach(select => {
            select.addEventListener('change', () => {
                if (select.id === 'historyTypeFilter') {
                    contentDiv.querySelectorAll('.history-filter-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.historyFilter === select.value);
                    });
                }
                eventsList.innerHTML = renderHistoryEvents(aggregatedEvents, sourceProvinces, getHistoryFiltersFromPanel());
            });
        });
    }
});

// Events
const tlInput = document.getElementById('timeline');
tlInput.addEventListener('input', function () { document.getElementById('yearValue').innerText = AVAILABLE_YEARS[this.value]; });
tlInput.addEventListener('change', function () {
    pushViewState();
    updateMap();
});

document.querySelectorAll('input[name="viewMode"]').forEach(radio => {
    radio.addEventListener('change', function () {
        if (this.checked) {
            const currentYear = getCurrentYear();
            if (currentYear && currentYear < 2008 && this.value !== 'province') {
                viewMode = 'province';
                document.querySelector('input[value="province"]').checked = true;
            } else {
                viewMode = this.value;
            }
            pushViewState();
            updateMap();
        }
    });
});

document.getElementById('btnLangVi')?.addEventListener('click', () => setLanguage('vi'));
document.getElementById('btnLangEn')?.addEventListener('click', () => setLanguage('en'));
document.getElementById('btnThemeToggle')?.addEventListener('click', toggleTheme);

document.getElementById('btnGuestEn2025').addEventListener('click', function () {
    provinceLabelMode2025 = provinceLabelMode2025 === 'fun' ? 'vn' : 'fun';
    foreignGuestProvinceLabels2025 = provinceLabelMode2025 === 'fun';
    localStorage.setItem('province_label_mode_2025', provinceLabelMode2025);
    syncGuestEnButtonVisibility();
    refreshAllGuestEnDisplays();
});

function switchMainTab(tabName) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (tabName === 'map') {
        document.getElementById('tabMap')?.classList.add('active');
        if (window.map) map.invalidateSize();
        // Hide mini chat on mobile map tab
        updateMobileChatVisibility('map');
    }
    else if (tabName === 'merger') {
        document.getElementById('tabMerger')?.classList.add('active');
        updateMobileChatVisibility('merger');
    }
    else if (tabName === 'chat') {
        document.getElementById('tabChat')?.classList.add('active');
        updateMapContextUI();
        updateMobileChatVisibility('chat');
    }
    else if (tabName === 'memory') {
        document.getElementById('tabMemory')?.classList.add('active');
        ensureMemoryMap();
        setTimeout(() => refreshMemoryMapViewport({ fit: !memoryGameActive || memoryMode === 'map' }), 50);
        updateMobileChatVisibility('memory');
    }
    else if (tabName === 'feedback') {
        document.getElementById('tabFeedback')?.classList.add('active');
        updateMobileChatVisibility('feedback');
    }
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`) ||
        document.querySelector(`.nav-item[onclick*="${tabName}"]`);
    targetNav?.classList.add('active');
    targetNav?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

/* Hide mini-chat on mobile map tab, keep it accessible on other tabs */
function updateMobileChatVisibility(tabName) {
    if (window.innerWidth > 768) return; // Only on mobile
    const widget = document.getElementById('miniChatWidget');
    const toggleBtn = document.getElementById('miniChatToggle');
    if (!widget && !toggleBtn) return;
    
    if (tabName === 'map') {
        // Always hide chatbot on map tab on mobile
        if (widget) widget.classList.remove('mobile-chat-visible');
        if (toggleBtn) toggleBtn.classList.remove('mobile-chat-visible');
    } else {
        // Don't auto-show; the existing toggleMiniChat handles open/close state
        // Just remove the mobile-specific visibility class so CSS default (hidden) applies
        if (widget) widget.classList.remove('mobile-chat-visible');
        if (toggleBtn) toggleBtn.classList.remove('mobile-chat-visible');
    }
}


// --- ADMIN & VISITOR ANALYTICS LOGIC ---
function openAdminModal() {
    window.location.href = '/admin';
}

function closeAdminModal() {
    document.getElementById('adminModal')?.classList.add('hidden');
}

async function handleAdminLogin() {
    const usernameInput = document.getElementById('adminUsername');
    const passwordInput = document.getElementById('adminPassword');
    const errorDiv = document.getElementById('adminLoginError');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (errorDiv) errorDiv.classList.add('hidden');

    if (!username || !password) {
        if (errorDiv) {
            errorDiv.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.';
            errorDiv.classList.remove('hidden');
        }
        return;
    }

    try {
        const res = await fetch(getApiUrl('/api/admin/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        let data = {};
        try {
            data = await res.json();
        } catch (e) {
            // Non-JSON response (e.g. 404 or 500 HTML)
        }

        if (res.ok && data.token) {
            localStorage.setItem('admin_token', data.token);
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            window.location.href = '/admin';
        } else {
            if (errorDiv) {
                errorDiv.textContent = data.message || (res.status === 404 ? 'Không tìm thấy API đăng nhập (404).' : `Đăng nhập không thành công (mã ${res.status}).`);
                errorDiv.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (errorDiv) {
            errorDiv.textContent = 'Lỗi kết nối máy chủ.';
            errorDiv.classList.remove('hidden');
        }
    }
}

function handleAdminLogout() {
    localStorage.removeItem('admin_token');
    document.getElementById('btnAdminModal')?.classList.remove('logged-in');
    document.getElementById('adminDashboardSection')?.classList.add('hidden');
    document.getElementById('adminLoginSection')?.classList.remove('hidden');
}

async function loadAdminStats() {
    try {
        const res = await fetch(getApiUrl('/api/admin/stats?t=' + Date.now()), { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        const totalEl = document.getElementById('adminStatTotalVisits');
        const todayEl = document.getElementById('adminStatTodayVisits');
        const uniqueEl = document.getElementById('adminStatUniqueVisitors');
        const recentListEl = document.getElementById('adminRecentVisitsList');
        const dbStatusTextEl = document.getElementById('adminDbStatusText');

        if (dbStatusTextEl) {
            if (data.db_connected) {
                dbStatusTextEl.innerHTML = '<span style="color: #4ade80;">🟢 Kết nối MongoDB Atlas (Realtime Data)</span>';
            } else {
                dbStatusTextEl.innerHTML = '<span style="color: #f87171;">⚠️ Chưa kết nối MongoDB (Đang dùng file local - Cần kiểm tra MONGO_URI)</span>';
            }
        }

        if (totalEl) totalEl.textContent = (data.total_visits || 0).toLocaleString();
        if (todayEl) todayEl.textContent = (data.today_visits || 0).toLocaleString();
        if (uniqueEl) uniqueEl.textContent = (data.unique_visitors || 0).toLocaleString();

        if (recentListEl) {
            if (data.recent_visits && data.recent_visits.length > 0) {
                let html = '';
                data.recent_visits.forEach(item => {
                    html += `
                                <div class="admin-recent-item">
                                    <span><i class="fas fa-clock" style="margin-right: 4px;"></i> ${item.timestamp || ''}</span>
                                    <span>IP: ${item.ip || 'Local'}</span>
                                </div>
                            `;
                });
                recentListEl.innerHTML = html;
            } else {
                recentListEl.innerHTML = '<div style="color: #94a3b8; font-style: italic; font-size: 0.85rem;">Chưa có dữ liệu.</div>';
            }
        }
    } catch (err) {
        console.error('Error loading admin stats:', err);
    }
}

function openNoticeModal() {
    const modal = document.getElementById('noticeModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeNoticeModal() {
    const modal = document.getElementById('noticeModal');
    const chk = document.getElementById('chkDontShowNoticeAgain');
    if (chk && chk.checked) {
        localStorage.setItem('viemap_hide_welcome_notice', 'true');
    }
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
}

window.openNoticeModal = openNoticeModal;
window.closeNoticeModal = closeNoticeModal;
window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
window.handleAdminLogin = handleAdminLogin;
window.handleAdminLogout = handleAdminLogout;
window.loadAdminStats = loadAdminStats;
window.switchMainTab = switchMainTab;
window.toggleChatHistory = toggleChatHistory;
window.switchChatSession = switchChatSession;
window.deleteChatSession = deleteChatSession;
window.clearAllChatHistory = clearAllChatHistory;
window.renderChatHistoryList = renderChatHistoryList;
window.resetChat = resetChat;
window.toggleInfoBox = toggleInfoBox;
window.updateControlPanelHeight = updateControlPanelHeight;
window.toggleMiniChatMaximize = toggleMiniChatMaximize;
window.resetMiniChatSize = resetMiniChatSize;
window.initMiniChatResizeAndDrag = initMiniChatResizeAndDrag;

function initNavTabsScroll() {
    const navTabs = document.querySelector('.nav-tabs');
    if (!navTabs || navTabs.dataset.scrollInitialized === 'true') return;
    navTabs.dataset.scrollInitialized = 'true';

    // Horizontal wheel scrolling when hovering over nav tabs
    navTabs.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0 && navTabs.scrollWidth > navTabs.clientWidth) {
            e.preventDefault();
            navTabs.scrollLeft += e.deltaY;
        }
    }, { passive: false });

    // Drag-to-scroll (mouse gesture)
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;

    navTabs.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDown = true;
        hasDragged = false;
        startX = e.pageX - navTabs.offsetLeft;
        scrollLeft = navTabs.scrollLeft;
    });

    const stopDrag = () => {
        if (!isDown) return;
        isDown = false;
        navTabs.classList.remove('is-dragging');
    };

    window.addEventListener('mouseup', stopDrag);
    navTabs.addEventListener('mouseleave', stopDrag);

    navTabs.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - navTabs.offsetLeft;
        const walk = (x - startX);
        if (Math.abs(walk) > 4) {
            hasDragged = true;
            navTabs.classList.add('is-dragging');
            navTabs.scrollLeft = scrollLeft - walk;
        }
    });

    // Prevent accidental click when dragging tabs
    navTabs.addEventListener('click', (e) => {
        if (hasDragged) {
            e.preventDefault();
            e.stopPropagation();
            hasDragged = false;
        }
    }, true);
}

window.initNavTabsScroll = initNavTabsScroll;

initApp();
setTimeout(initMiniChatResizeAndDrag, 200);
setTimeout(initNavTabsScroll, 100);

