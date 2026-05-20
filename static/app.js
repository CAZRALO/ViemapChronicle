// --- GLOBAL VARIABLES ---
        let DATA_SOURCES = { province: [], district: [], ward: [] };
        let AVAILABLE_YEARS = [];
        let TIMELINE_DATA = null; // Store merger info
        let sessionId = localStorage.getItem('chat_session_id') || crypto.randomUUID();
        localStorage.setItem('chat_session_id', sessionId);

        // --- INITIALIZATION ---
        async function initApp() {
            document.getElementById('loading').style.display = 'flex';
            try {
                // Fetch Config & Timeline Data in parallel
                const [configRes, timelineRes] = await Promise.all([
                    fetch('/api/config'),
                    fetch('/api/history/timeline_index.json')
                ]);
                
                const config = await configRes.json();
                AVAILABLE_YEARS = config.years;
                DATA_SOURCES = config.files;

                if (timelineRes.ok) {
                    TIMELINE_DATA = await timelineRes.json();
                }
                
                setupTimeline();
                setupMemoryTab();
                updateMap();
                loadMergerTab(); // We can pass cached TIMELINE_DATA if we want, or let it handle itself

            } catch (e) {
                console.error("Init Error:", e);
                alert("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
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
                    const res = await fetch('/api/history/timeline_index.json');
                    timelineData = await res.json();
                }
                const communeRes = await fetch('/api/merger/communes');

                // 1. SIDEBAR
                let sidebarHtml = `
                    <div class="merger-sidebar">
                        <div class="search-container">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" id="mergerSearch" class="search-bar" placeholder="Tìm kiếm..." onkeyup="filterMergerData()">
                        </div>
                        <div id="mergerTOC" class="merger-toc">
                            <div class="toc-title"><i class="fas fa-list-ul"></i> Mục lục (theo lần sáp nhập năm 2025):</div>
                        </div>
                    </div>
                `;

                // 2. MAIN CONTENT
                let mainContentHtml = `<div class="merger-main-content">`;
                let tocItemsHtml = '';
                
                // --- SECTION: PROVINCIAL TIMELINE ---
                mainContentHtml += `<div class="main-section-title"><i class="fas fa-history"></i> Lịch sử Thay đổi Tỉnh/Thành phố</div>`;
                
                if (timelineData && Array.isArray(timelineData) && timelineData.length > 0) {
                    timelineData.forEach(item => {
                        mainContentHtml += `
                        <div class="timeline-card">
                            <div><span class="timeline-year">${item.year}</span></div>
                            <div class="timeline-title">${item.title}</div>
                            <div class="timeline-desc">${item.description}</div>`;
                        
                        if(item.changes && Array.isArray(item.changes) && item.changes.length > 0) {
                            mainContentHtml += `<ul class="change-list">`;
                            item.changes.forEach(change => {
                                if(typeof change === 'object' && change.from && change.to) {
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
                    mainContentHtml += `<p style="text-align:center; color:#666;">Chưa có dữ liệu lịch sử tỉnh.</p>`;
                }

                // --- SECTION: COMMUNE MERGER 2025 ---
                mainContentHtml += `<div class="main-section-title mt-large"><i class="fas fa-random"></i> Sáp nhập Hành chính Cấp Xã (Năm 2025)</div>`;
                
                if (communeRes.ok) {
                    const communeData = await communeRes.json();
                    const provinces = Object.keys(communeData).sort((a, b) => a.localeCompare(b, 'vi')); 
                    
                    if (provinces.length === 0) {
                        mainContentHtml += `<p style="text-align:center; color:#666; font-style:italic;">Chưa có dữ liệu sáp nhập xã.</p>`;
                    } else {
                        provinces.forEach((provName, index) => {
                            const provId = `merger-prov-${index}`;
                            tocItemsHtml += `<a href="#${provId}" class="toc-item"><span class="guest-prov-label" data-vn-prov="${escapeHtml(provName)}">${escapeHtml(provName)}</span></a>`;

                            mainContentHtml += `<div id="${provId}" class="merger-province-group">`;
                            mainContentHtml += `<div class="merger-province-header"><i class="fas fa-map-marked-alt"></i> <span class="guest-prov-label" data-vn-prov="${escapeHtml(provName)}">${escapeHtml(provName)}</span></div>`;
                            
                            const changes = communeData[provName];
                            changes.forEach(change => {
                                mainContentHtml += `<div class="commune-change-card"><div class="change-flow">`;
                                mainContentHtml += `<div class="unit-group"><div class="unit-label">Sáp nhập:</div>`;
                                change.from.forEach(f => {
                                    mainContentHtml += `<div class="unit-badge"><i class="far fa-dot-circle"></i> ${f.commune} <small>(${f.district})</small></div>`;
                                });
                                mainContentHtml += `</div>`;
                                mainContentHtml += `<div class="arrow-section"><div class="arrow-icon"><i class="fas fa-long-arrow-alt-right"></i></div><div class="arrow-text">Thành</div></div>`;
                                mainContentHtml += `<div class="dest-group"><div class="unit-label">Đơn vị mới:</div>`;
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

            } catch (e) {
                console.error("Merger Tab Error:", e);
                container.innerHTML = `<p style="text-align:center; color:red; padding:20px;">Có lỗi xảy ra khi tải dữ liệu sáp nhập.<br>${e.message}</p>`;
            }
        }

        // Search Function
        function filterMergerData() {
            const input = document.getElementById('mergerSearch');
            const filter = input.value.toUpperCase();
            const provGroups = document.getElementsByClassName('merger-province-group');
            
            for (let i = 0; i < provGroups.length; i++) {
                const group = provGroups[i];
                const header = group.getElementsByClassName('merger-province-header')[0];
                const headerText = header ? (header.textContent || header.innerText) : '';
                const vnSpan = header ? header.querySelector('[data-vn-prov]') : null;
                const vnProv = vnSpan ? vnSpan.getAttribute('data-vn-prov') : '';
                let headerMatch = headerText.toUpperCase().indexOf(filter) > -1;
                if (!headerMatch && vnProv) {
                    const guest = getProvinceGuestDisplayName(vnProv);
                    if (guest && guest !== vnProv && guest.toUpperCase().indexOf(filter) > -1) headerMatch = true;
                }

                if (headerMatch) {
                    group.style.display = "";
                    const cards = group.getElementsByClassName('commune-change-card');
                    for (let j = 0; j < cards.length; j++) cards[j].style.display = "";
                    continue; 
                }
                
                let hasMatchInGroup = false;
                const cards = group.getElementsByClassName('commune-change-card');
                for (let j = 0; j < cards.length; j++) {
                    const card = cards[j];
                    const txtValue = card.textContent || card.innerText;
                    if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        card.style.display = "";
                        hasMatchInGroup = true;
                    } else {
                        card.style.display = "none";
                    }
                }
                group.style.display = hasMatchInGroup ? "" : "none";
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
            tl.value = 0;
            
            let ticksHtml = '';
            AVAILABLE_YEARS.forEach(y => { ticksHtml += `<span>${y}</span>`; });
            ticks.innerHTML = ticksHtml;
            display.innerText = AVAILABLE_YEARS[0];
        }

        const map = L.map('map', { zoomControl: false }).setView([16.047079, 108.206230], 6);
        //L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
        //L.control.zoom({ position: 'bottomright' }).addTo(map);
        L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}', {
            maxZoom: 21,
            attribution: 'Map data &copy; Google',
            crossOrigin: true
        }).addTo(map);

        // Thanh tỷ lệ
        L.control.scale({metric: true, imperial: false, position: 'bottomright'}).addTo(map);
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
        const memoryDataCache = {};

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

        function getProvinceGuestDisplayName(vnName) {
            if (!vnName) return '';
            const key = normalizeMemoryName(vnName);
            return PROVINCE_GUEST_EN_2025[key] || vnName;
        }

        function shouldShowForeignGuestProvinceLabels() {
            if (AVAILABLE_YEARS.length === 0) return false;
            const tl = document.getElementById('timeline');
            if (!tl) return false;
            const year = AVAILABLE_YEARS[tl.value];
            return foreignGuestProvinceLabels2025 && year === 2025 && viewMode === 'province';
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
                span.textContent = shouldShowForeignGuestProvinceLabels()
                    ? getProvinceGuestDisplayName(vn)
                    : vn;
            });
        }

        function refreshSidePanelTitleGuest() {
            const el = document.getElementById('sidePanelProvTitle');
            if (!el) return;
            const vn = el.getAttribute('data-vn-prov');
            if (!vn) return;
            el.textContent = shouldShowForeignGuestProvinceLabels()
                ? getProvinceGuestDisplayName(vn)
                : vn;
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
            const showBtn = year === 2025 && viewMode === 'province';
            wrap.style.display = showBtn ? 'flex' : 'none';
            if (!showBtn && foreignGuestProvinceLabels2025) {
                foreignGuestProvinceLabels2025 = false;
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
            refreshAllGuestEnDisplays();
        }

        function mapContextDisplayForUi(ctx) {
            if (!ctx) return '';
            if (!shouldShowForeignGuestProvinceLabels() || !ctx.province) return ctx.display_name || '';
            const pGuest = getProvinceGuestDisplayName(ctx.province);
            if (ctx.level === 'province') return pGuest;
            if (ctx.level === 'district') return [ctx.district, pGuest].filter(Boolean).join(', ');
            if (ctx.level === 'ward') return [ctx.ward, ctx.district, pGuest].filter(Boolean).join(', ');
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

        function eventMatchesHistoryFilter(eventItem, filterKey) {
            if (filterKey === 'all') return true;
            const filter = HISTORY_TAG_FILTERS.find(item => item.key === filterKey);
            if (!filter) return true;

            const tagsText = Array.isArray(eventItem.tags) ? eventItem.tags.join(' ') : String(eventItem.tags || '');
            const fallbackText = [eventItem.title, eventItem.description, eventItem.desc, eventItem.content].join(' ');
            const searchableText = normalizeHistoryTag(tagsText.trim() ? tagsText : fallbackText);

            return filter.aliases.some(alias => searchableText.includes(normalizeHistoryTag(alias)));
        }

        function renderHistoryEvents(events, sourceProvinces, filterKey = 'all') {
            const filteredEvents = events.filter(ev => eventMatchesHistoryFilter(ev, filterKey));
            if (filteredEvents.length === 0) {
                return '<div class="history-empty">Không có sự kiện nào thuộc nhóm này.</div>';
            }

            return filteredEvents.map(ev => {
                const desc = ev.desc || ev.description || ev.content || "";
                let timeDisplay = ev.date || ev.time || ev.year || "Không rõ thời gian";
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

                return `
                    <div class="event-item">
                        <div class="event-year">${escapeHtml(timeDisplay)} ${sourceBadge}</div>
                        <div class="event-title">${escapeHtml(ev.title)}</div>
                        ${locDisplay ? `<div class="event-loc"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(locDisplay)}</div>` : ''}
                        ${desc ? `<div class="event-desc">${escapeHtml(desc)}</div>` : ''}
                        ${tagHtml}
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
            return `<div class="info-row"><span class="info-label">${escapeHtml(unit.label)}:</span> <span class="info-value">${escapeHtml(unit.name)}</span></div>`;
        }

        function getMapTooltipContent(feature, type) {
            const props = feature && feature.properties ? feature.properties : {};
            let province = getAdminUnit(props, 'province');
            if (shouldShowForeignGuestProvinceLabels() && province.name) {
                const alt = getProvinceGuestDisplayName(province.name);
                if (alt !== province.name) province = { ...province, name: alt };
            }
            const district = getAdminUnit(props, 'district');
            const ward = getAdminUnit(props, 'ward');
            const rows = [];

            if (province.name) rows.push(`<strong>${escapeHtml(province.label)}:</strong> ${escapeHtml(province.name)}`);
            if ((type === 'district' || type === 'ward') && district.name) rows.push(`<strong>${escapeHtml(district.label)}:</strong> ${escapeHtml(district.name)}`);
            if (type === 'ward' && ward.name) rows.push(`<strong>${escapeHtml(ward.label)}:</strong> ${escapeHtml(ward.name)}`);

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
            const res = await fetch(`/api/map/${encodeURIComponent(fileName)}`);
            if (!res.ok) {
                throw new Error(`Không tải được dữ liệu bản đồ: ${fileName}`);
            }

            const data = await res.json();
            if (data && data.type === 'Topology') {
                return topoJsonToGeoJson(data, fileName);
            }
            return data;
        }

        function getMemoryYear() {
            const select = document.getElementById('memoryYearSelect');
            return Number(select.value || AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]);
        }

        function getMemoryBestKey() {
            return `memory_best_score_${getMemoryYear()}`;
        }

        function setupMemoryTab() {
            const select = document.getElementById('memoryYearSelect');
            const provinceYears = DATA_SOURCES.province.map(x => x.year).sort((a, b) => a - b);
            select.innerHTML = provinceYears.map(year => `<option value="${year}">${year}</option>`).join('');
            if (provinceYears.length > 0) select.value = provinceYears[provinceYears.length - 1];
            select.addEventListener('change', () => {
                resetMemoryGame();
                loadMemoryMap(getMemoryYear());
            });
            updateMemoryStats();
            setMemoryMapIdleOverlay(true);
            loadMemoryMap(getMemoryYear());
        }

        function ensureMemoryMap() {
            if (memoryMap) return;
            memoryMap = L.map('memoryMap', { zoomControl: true }).setView([16.047079, 108.206230], 5);
            L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}', {
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

        async function loadMemoryMap(year) {
            ensureMemoryMap();
            const feedback = document.getElementById('memoryFeedback');
            const pEntry = DATA_SOURCES.province.find(x => x.year === Number(year));
            if (!pEntry) {
                feedback.className = 'memory-feedback wrong';
                feedback.textContent = 'Không có dữ liệu tỉnh/thành cho năm đã chọn.';
                return;
            }

            feedback.className = 'memory-feedback';
            feedback.textContent = 'Đang tải bản đồ luyện nhớ...';

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
                                if (!memoryGameActive || !memoryAcceptingAnswer) return;
                                layer.setStyle(memoryHoverStyle());
                            },
                            mouseout: () => {
                                if (!memoryGameActive || !memoryCurrent || memoryCurrent.feature !== feature) {
                                    layer.setStyle(memoryDefaultStyle(feature));
                                }
                            },
                            click: () => handleMemoryGuess(feature, layer)
                        });
                    }
                }).addTo(memoryMap);

                if (memoryProvinceLayer.getBounds().isValid()) {
                    memoryMap.fitBounds(memoryProvinceLayer.getBounds(), { padding: [20, 20] });
                }
                memoryMap.invalidateSize();
                feedback.textContent = 'Bản đồ đã sẵn sàng. Bấm bắt đầu để luyện nhớ.';
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

        function setMemoryControls(active) {
            document.getElementById('memoryHintBtn').disabled = !active;
            document.getElementById('memorySkipBtn').disabled = !active;
            document.getElementById('memoryStartBtn').innerHTML = active ? '<i class="fas fa-hourglass-half"></i> Đang chơi' : '<i class="fas fa-play"></i> Bắt đầu';
            document.getElementById('memoryStartBtn').disabled = active;
            document.getElementById('memoryYearSelect').disabled = active;
            setMemoryMapIdleOverlay(!active);
        }

        function resetMemoryStyles() {
            if (!memoryProvinceLayer) return;
            memoryProvinceLayer.eachLayer(layer => {
                if (layer.feature) layer.setStyle(memoryDefaultStyle(layer.feature));
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

        async function startMemoryGame() {
            if (!memoryMap) await loadMemoryMap(getMemoryYear());
            if (memoryFeatures.length === 0) return;

            memoryTotalRounds = Math.min(10, memoryFeatures.length);
            memoryQuestions = shuffleMemoryFeatures(memoryFeatures).slice(0, memoryTotalRounds);
            memoryScore = 0;
            memoryRound = 0;
            memoryStreak = 0;
            memoryGameActive = true;
            memoryAcceptingAnswer = true;
            memoryHintUsed = false;
            document.getElementById('memoryResults').innerHTML = '';
            document.getElementById('memoryFeedback').className = 'memory-feedback';
            document.getElementById('memoryFeedback').textContent = 'Hãy bấm vào tỉnh/thành đúng trên bản đồ.';
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
            memoryCurrent = { feature: memoryQuestions[memoryRound], attempts: 0 };
            memoryHintUsed = false;
            memoryAcceptingAnswer = true;
            document.getElementById('memoryHintBtn').disabled = false;
            document.getElementById('memoryTarget').textContent = getFeatureName(memoryCurrent.feature);
            updateMemoryStats();
        }

        function handleMemoryGuess(feature, layer) {
            if (!memoryGameActive || !memoryAcceptingAnswer || !memoryCurrent) return;

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
                feedback.textContent = `Đúng: ${getFeatureName(feature)}. +${gained} điểm.`;
                addMemoryResult(true, getFeatureName(feature), getFeatureName(memoryCurrent.feature));
            } else {
                memoryStreak = 0;
                layer.setStyle({ weight: 4, color: '#b71c1c', fillOpacity: 0.82 });
                memoryCurrent.feature.__memoryLayer.setStyle({ weight: 4, color: '#1b5e20', fillOpacity: 0.86 });
                feedback.className = 'memory-feedback wrong';
                feedback.textContent = `Chưa đúng. Đáp án là ${getFeatureName(memoryCurrent.feature)}.`;
                addMemoryResult(false, getFeatureName(feature), getFeatureName(memoryCurrent.feature));
            }

            memoryRound += 1;
            updateMemoryStats();
            setTimeout(nextMemoryQuestion, 1100);
        }

        function addMemoryResult(ok, guessed, expected) {
            const list = document.getElementById('memoryResults');
            const item = document.createElement('div');
            item.className = `memory-result ${ok ? 'ok' : 'miss'}`;
            item.innerHTML = `<span>${ok ? 'Đúng' : 'Sai'}</span><strong>${expected}</strong>`;
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
            document.getElementById('memoryFeedback').textContent = 'Gợi ý đã khoanh vùng đáp án. Trả lời đúng sẽ bị trừ 2 điểm.';
        }

        function skipMemoryQuestion() {
            if (!memoryGameActive || !memoryAcceptingAnswer || !memoryCurrent) return;
            memoryAcceptingAnswer = false;
            memoryStreak = 0;
            memoryCurrent.feature.__memoryLayer.setStyle({ weight: 4, color: '#1b5e20', fillOpacity: 0.86 });
            addMemoryResult(false, 'Bỏ qua', getFeatureName(memoryCurrent.feature));
            document.getElementById('memoryFeedback').className = 'memory-feedback wrong';
            document.getElementById('memoryFeedback').textContent = `Đã bỏ qua. Đáp án là ${getFeatureName(memoryCurrent.feature)}.`;
            memoryRound += 1;
            updateMemoryStats();
            setTimeout(nextMemoryQuestion, 900);
        }

        function finishMemoryGame() {
            memoryGameActive = false;
            memoryAcceptingAnswer = false;
            setMemoryControls(false);
            resetMemoryStyles();
            document.getElementById('memoryTarget').textContent = 'Hoàn thành';
            const bestKey = getMemoryBestKey();
            const best = Number(localStorage.getItem(bestKey) || 0);
            if (memoryScore > best) localStorage.setItem(bestKey, String(memoryScore));
            updateMemoryStats();
            document.getElementById('memoryFeedback').className = 'memory-feedback correct';
            document.getElementById('memoryFeedback').textContent = `Kết thúc lượt chơi: ${memoryScore} điểm trên ${memoryTotalRounds} câu.`;
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
            document.getElementById('memoryTarget').textContent = 'Bấm bắt đầu';
            document.getElementById('memoryFeedback').className = 'memory-feedback';
            document.getElementById('memoryFeedback').textContent = 'Chọn năm dữ liệu rồi bắt đầu luyện nhớ vị trí tỉnh/thành.';
            document.getElementById('memoryResults').innerHTML = '<div style="color:#8a988a; font-style:italic;">Chưa có lượt trả lời.</div>';
            updateMemoryStats();
        }

        async function updateMap() {
            if (AVAILABLE_YEARS.length === 0) return;
            const year = AVAILABLE_YEARS[document.getElementById('timeline').value];
            document.getElementById('yearValue').innerText = year;
            updateUIControls(year);
            document.getElementById('loading').style.display = 'flex';

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

                if (viewMode === 'district') {
                    const dEntry = DATA_SOURCES.district.find(x => x.year === year);
                    if (dEntry) {
                        const data = await loadMapData(dEntry.file);
                        layers.district = L.geoJSON(data, {
                            style: styles.district, pane: 'districtPane',
                            onEachFeature: (f, l) => bindMapFeatureEvents(f, l, 'district')
                        }).addTo(map);
                    }
                } else if (viewMode === 'ward') {
                    if (year < 2025) {
                        const dEntry = DATA_SOURCES.district.find(x => x.year === year);
                        if (dEntry) {
                            const dData = await loadMapData(dEntry.file);
                            layers.district = L.geoJSON(dData, { style: {...styles.district, interactive:false}, pane: 'districtPane' }).addTo(map);
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
            }
        }

        function buildMapContextFromFeature(feature, type) {
            const props = feature.properties;
            const province = getAdminUnit(props, 'province');
            const district = getAdminUnit(props, 'district');
            const ward = getAdminUnit(props, 'ward');
            const year = AVAILABLE_YEARS[document.getElementById('timeline').value];

            let displayName = province.name || '';
            if (type === 'district' && district.name) {
                displayName = [district.name, province.name].filter(Boolean).join(', ');
            } else if (type === 'ward' && ward.name) {
                displayName = [ward.name, district.name, province.name].filter(Boolean).join(', ');
            }

            if (!displayName) return null;

            return {
                year,
                level: type,
                display_name: displayName,
                province: province.name || null,
                province_type: province.label || null,
                district: district.name || null,
                district_type: district.label || null,
                ward: ward.name || null,
                ward_type: ward.label || null
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
                    if (labelEl) labelEl.textContent = isHover ? 'Đang chỉ vào trên bản đồ:' : 'Đang chọn trên bản đồ:';
                    if (iconEl) iconEl.className = isHover ? 'fas fa-hand-pointer' : 'fas fa-map-pin';
                    document.getElementById('chatMapContextName').textContent = mapContextDisplayForUi(ctx);
                    document.getElementById('chatMapContextYear').textContent = ctx.year ? `(năm ${ctx.year})` : '';
                    bar.classList.add('visible');
                }
            }

            const miniBar = document.getElementById('miniChatMapContext');
            const miniText = document.getElementById('miniChatMapContextText');
            if (miniBar && miniText) {
                if (!ctx) {
                    miniBar.classList.remove('visible');
                } else {
                    const yearStr = ctx.year ? ` (năm ${ctx.year})` : '';
                    miniText.innerHTML = `${isHover ? 'Đang chỉ vào' : 'Đang chọn'}: <strong>${escapeHtml(mapContextDisplayForUi(ctx))}</strong>${yearStr}`;
                    miniBar.classList.add('visible');
                }
            }
        }

        function appendChatMessage(message, sender, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            let messageHtml;
            if (containerId === 'chatMessages') {
                messageHtml = sender === 'user'
                    ? `<div class="message user">${escapeHtml(message)}</div>`
                    : `<div class="message ai">${marked.parse(message)}</div>`;
            } else {
                messageHtml = sender === 'user'
                    ? `<div class="mini-chat-message user">${escapeHtml(message)}</div>`
                    : `<div class="mini-chat-message ai">${marked.parse(message)}</div>`;
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

        function toggleMiniChat(open) {
            const widget = document.getElementById('miniChatWidget');
            const toggleBtn = document.getElementById('miniChatToggle');
            if (!widget || !toggleBtn) return;
            if (open) {
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

        async function sendMiniChatMessage() {
            const input = document.getElementById('miniChatInput');
            if (!input) return;
            const msg = input.value.trim();
            if (!msg) return;
            input.value = '';

            appendChatMessage(msg, 'user', 'miniChatMessages');
            appendChatMessage(msg, 'user', 'chatMessages');
            appendTypingIndicator('miniChatMessages');
            appendTypingIndicator('chatMessages');

            try {
                const payload = { message: msg, session_id: sessionId };
                const mapContext = getMapSelectionContext();
                if (mapContext) payload.map_context = mapContext;
                const res = await fetch('/api/chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
                const data = await res.json();
                removeTypingIndicator('miniChatMessages');
                removeTypingIndicator('chatMessages');
                appendChatMessage(data.response, 'ai', 'miniChatMessages');
                appendChatMessage(data.response, 'ai', 'chatMessages');
            } catch (e) {
                removeTypingIndicator('miniChatMessages');
                removeTypingIndicator('chatMessages');
                appendChatMessage('Lỗi kết nối.', 'ai', 'miniChatMessages');
                appendChatMessage('Lỗi kết nối.', 'ai', 'chatMessages');
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
                    const payload = { message: msg, session_id: sessionId };
                    const mapContext = getMapSelectionContext();
                    if (mapContext) payload.map_context = mapContext;
                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    const indicator = document.getElementById('typingIndicator');
                    if (indicator) indicator.remove();
                    const miniIndicator = document.getElementById('miniTypingIndicator-miniChatMessages');
                    if (miniIndicator) miniIndicator.remove();
                    messagesDiv.innerHTML += `<div class="message ai">${marked.parse(data.response)}</div>`;
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                    if (miniMessages) {
                        miniMessages.innerHTML += `<div class="mini-chat-message ai">${marked.parse(data.response)}</div>`;
                        miniMessages.scrollTop = miniMessages.scrollHeight;
                    }
                } catch (e) {
                    const indicator = document.getElementById('typingIndicator');
                    if (indicator) indicator.remove();
                    const miniIndicator = document.getElementById('miniTypingIndicator-miniChatMessages');
                    if (miniIndicator) miniIndicator.remove();
                    messagesDiv.innerHTML += `<div class="message ai" style="color:red;">Lỗi kết nối.</div>`;
                    if (miniMessages) miniMessages.innerHTML += `<div class="mini-chat-message ai" style="color:red;">Lỗi kết nối.</div>`;
                }
            })();
        }

        async function resetChat() {
            if (!confirm("Xóa lịch sử?")) return;
            try {
                sessionId = crypto.randomUUID(); localStorage.setItem('chat_session_id', sessionId);
                const res = await fetch('/api/chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ session_id: sessionId, reset: true }) });
                const data = await res.json();
                document.getElementById('chatMessages').innerHTML = `<div class="message ai">${data.response}</div>`;
                const miniMessages = document.getElementById('miniChatMessages');
                if (miniMessages) miniMessages.innerHTML = `<div class="mini-chat-message ai">${escapeHtml(data.response)}</div>`;
            } catch (e) { alert("Lỗi."); }
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
            document.getElementById('infoContent').innerHTML = '<div style="color: #95a5a6; font-style: italic;">Chọn một điểm trên bản đồ...</div>';
            document.getElementById('btnShowHistory').disabled = true;
            updateMapContextUI();
        }

        function updateInfoBox(props) {
            let html = '';
            let province = getAdminUnit(props, 'province');
            if (shouldShowForeignGuestProvinceLabels() && province.name) {
                const alt = getProvinceGuestDisplayName(province.name);
                province = { ...province, name: alt };
            }
            const district = getAdminUnit(props, 'district');
            const ward = getAdminUnit(props, 'ward');
            const currentYear = AVAILABLE_YEARS[document.getElementById('timeline').value];

            html += renderAdminRow(province);
            if (currentYear >= 2025) {
                html += renderAdminRow(ward);
            } else {
                html += renderAdminRow(district);
                html += renderAdminRow(ward);
            }
            document.getElementById('infoContent').innerHTML = html || '<div style="color: #95a5a6; font-style: italic;">Không xác định được tên địa phương.</div>';
        }

        function updateUIControls(year) {
            const lblDist = document.getElementById('lblDistrict');
            const inpDist = lblDist.querySelector('input');
            const lblWard = document.getElementById('lblWard');
            const inpWard = lblWard.querySelector('input');
            
            const hasDistrict = DATA_SOURCES.district.some(x => x.year === year);
            const hasWard = DATA_SOURCES.ward.some(x => x.year === year);
            
            if (year >= 2025 || !hasDistrict) {
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

            if (!hasWard) {
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

        function toggleHistorySlide(show) {
            const panel = document.getElementById('historySlidePanel');
            show ? panel.classList.add('active') : panel.classList.remove('active');
        }

        // --- FETCH & DISPLAY DETAIL LOGIC ---
        document.getElementById('btnShowHistory').addEventListener('click', async () => {
            if (!selectedFeature) return;
            toggleHistorySlide(true);
            const contentDiv = document.getElementById('sidePanelContent');
            contentDiv.innerHTML = '<div style="text-align:center; margin-top:30px;"><i class="fas fa-spinner fa-spin"></i> Đang tải thông tin chi tiết...</div>';
            
            const props = selectedFeature.feat.properties;
            const provName = getAdminUnit(props, 'province').name; 
            
            if (!provName) {
                contentDiv.innerHTML = "<p>Không xác định được tên tỉnh.</p>";
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
                    <i class="fas fa-layer-group"></i> <strong>Sáp nhập từ:</strong> ${sourceProvinces.join(', ')}
                </div>`;
            }

            htmlContent += `<div style="font-size: 0.8rem; background: #fff3e0; padding: 8px; border-radius: 4px; color: #e65100; margin-bottom: 15px; border: 1px solid #ffe0b2;">
                <i class="fas fa-info-circle"></i> <em>Lưu ý: Địa chỉ sự kiện và địa danh dưới đây áp dụng theo địa giới hành chính mốc năm 2008.</em>
            </div>`;

            htmlContent += `
                <div class="local-info-tabs">
                    <button class="local-info-tab active" data-tab="historyTab">Sự kiện Lịch sử</button>
                    <button class="local-info-tab" data-tab="sitesTab">Địa danh & Di tích</button>
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
                    const historyRes = await fetch(`/api/history/${fileName}`);
                    if (historyRes.ok) {
                        const hData = await historyRes.json();
                        if (hData.events && hData.events.length > 0) {
                            // Add source info if merged
                            const events = hData.events.map(ev => ({...ev, sourceProv: sourceProv}));
                            aggregatedEvents = aggregatedEvents.concat(events);
                            hasData = true;
                        }
                    }

                    // Fetch Geo
                    const geoRes = await fetch(`/api/geodata/${fileName}`);
                    if (geoRes.ok) {
                        const gData = await geoRes.json();
                        if (gData.sites && gData.sites.length > 0) {
                            const sites = gData.sites.map(s => ({...s, sourceProv: sourceProv}));
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
                    '<button class="history-filter-btn active" data-history-filter="all">Tất cả</button>',
                    ...HISTORY_TAG_FILTERS.map(filter => `<button class="history-filter-btn" data-history-filter="${filter.key}">${filter.label}</button>`)
                ].join('');
                
                const historyHtml = `
                    <div class="section-header"><i class="fas fa-history"></i> Sự kiện Lịch sử</div>
                    <div class="history-filter-bar">${filterButtons}</div>
                    <div id="historyEventsList">${renderHistoryEvents(aggregatedEvents, sourceProvinces)}</div>
                `;
                document.getElementById('historyTab').innerHTML = historyHtml;
            } else {
                document.getElementById('historyTab').innerHTML = `<div class="section-header"><i class="fas fa-history"></i> Sự kiện Lịch sử</div><p class="history-empty">Chưa có dữ liệu sự kiện lịch sử cho địa phương này.</p>`;
            }

            // RENDER SITES
            if (aggregatedSites.length > 0) {
                let sitesHtml = `<div class="section-header"><i class="fas fa-landmark"></i> Địa danh & Di tích</div>`;
                aggregatedSites.forEach(site => {
                    let typeDisplay = site.type_of_place;
                    if(typeDisplay && typeDisplay.toLowerCase() === 'natural') typeDisplay = "Thiên nhiên";
                    else if(typeDisplay && typeDisplay.toLowerCase() === 'historical') typeDisplay = "Lịch sử";

                    let descHtml = '';
                    if (site.event && site.event !== 'null') {
                        descHtml = `<div class="site-desc">${site.event}</div>`;
                    }

                    const sourceBadge = sourceProvinces.length > 1 ? `<span class="merged-source-badge" style="float:right; margin-top: -2px;">${site.sourceProv}</span>` : '';

                    const placeParts = [];
                    if (site.place) {
                        if (site.place.commune && site.place.commune !== 'null') placeParts.push(site.place.commune);
                        if (site.place.district && site.place.district !== 'null') placeParts.push(site.place.district);
                        if (site.place.province && site.place.province !== 'null') placeParts.push(site.place.province);
                    }
                    const googleSearchQuery = encodeURIComponent(`${site.name} ${placeParts.join(' ')}`.trim());
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleSearchQuery}`;

                    sitesHtml += `
                    <div class="site-item">
                        <div class="site-name">${site.name} ${sourceBadge}</div>
                        <div class="site-type">${typeDisplay}</div>
                        ${descHtml}
                        <div class="site-loc"><i class="fas fa-map-pin"></i> ${placeParts.join(', ')}</div>
                        <a class="site-map-link" href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-location-dot"></i> Xem trên Google Maps
                        </a>
                    </div>`;
                });
                document.getElementById('sitesTab').innerHTML = sitesHtml;
            } else {
                document.getElementById('sitesTab').innerHTML = `<div class="section-header"><i class="fas fa-landmark"></i> Địa danh & Di tích</div><p class="history-empty">Chưa có dữ liệu địa danh và di tích cho địa phương này.</p>`;
            }

            if (!hasData) {
                const notice = document.createElement('p');
                notice.style.cssText = 'margin-top:20px; font-style:italic; color:#777;';
                notice.textContent = 'Chưa có dữ liệu chi tiết cho địa phương này.';
                document.getElementById('sitesTab').insertAdjacentElement('afterend', notice);
            }

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
                        eventsList.innerHTML = renderHistoryEvents(aggregatedEvents, sourceProvinces, button.dataset.historyFilter);
                    });
                });
            }
        });

        // Events
        const tlInput = document.getElementById('timeline');
        tlInput.addEventListener('input', function() { document.getElementById('yearValue').innerText = AVAILABLE_YEARS[this.value]; });
        tlInput.addEventListener('change', updateMap);

        document.querySelectorAll('input[name="viewMode"]').forEach(radio => {
            radio.addEventListener('change', function() { if (this.checked) { viewMode = this.value; updateMap(); } });
        });

        document.getElementById('btnGuestEn2025').addEventListener('click', function () {
            foreignGuestProvinceLabels2025 = !foreignGuestProvinceLabels2025;
            this.classList.toggle('active', foreignGuestProvinceLabels2025);
            this.setAttribute('aria-pressed', foreignGuestProvinceLabels2025 ? 'true' : 'false');
            refreshAllGuestEnDisplays();
        });

        function switchMainTab(tabName) {
            document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            if (tabName === 'map') { document.getElementById('tabMap').classList.add('active'); map.invalidateSize(); } 
            else if (tabName === 'merger') { document.getElementById('tabMerger').classList.add('active'); } 
            else if (tabName === 'chat') {
                document.getElementById('tabChat').classList.add('active');
                updateMapContextUI();
            }
            else if (tabName === 'memory') {
                document.getElementById('tabMemory').classList.add('active');
                ensureMemoryMap();
                setTimeout(() => memoryMap.invalidateSize(), 50);
            }
            document.querySelector(`.nav-item[onclick="switchMainTab('${tabName}')"]`).classList.add('active');
        }

        initApp();
