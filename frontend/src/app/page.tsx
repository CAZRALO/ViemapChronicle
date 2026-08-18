'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function HomePage() {
  useEffect(() => {
  }, []);

  return (
    <>
      {/* Nav Bar */}
      <div className="navbar">
        <div className="navbar-brand">
          <i className="fas fa-scroll"></i>{' '}
          <span className="navbar-brand-text">Viemap Chronicle</span>
        </div>
        <div className="nav-tabs">
          <div
            className="nav-item active"
            data-tab="map"
            onClick={() => (window as any).switchMainTab?.('map')}
          >
            <i className="fas fa-globe-asia" style={{ marginRight: '8px' }}></i>{' '}
            Bản đồ
          </div>
          <div
            className="nav-item"
            data-tab="merger"
            onClick={() => (window as any).switchMainTab?.('merger')}
          >
            <i className="fas fa-book-atlas" style={{ marginRight: '8px' }}></i>{' '}
            Thông tin Sáp nhập
          </div>
          <div
            className="nav-item"
            data-tab="chat"
            onClick={() => (window as any).switchMainTab?.('chat')}
          >
            <i className="fas fa-robot" style={{ marginRight: '8px' }}></i>{' '}
            Chatbot AI
          </div>
          <div
            className="nav-item"
            data-tab="memory"
            onClick={() => (window as any).switchMainTab?.('memory')}
          >
            <i
              className="fas fa-puzzle-piece"
              style={{ marginRight: '8px' }}
            ></i>{' '}
            Ghi nhớ bản đồ
          </div>
          <div
            className="nav-item"
            data-tab="feedback"
            onClick={() => (window as any).switchMainTab?.('feedback')}
          >
            <i
              className="fas fa-comment-dots"
              style={{ marginRight: '8px' }}
            ></i>{' '}
            <span id="navFeedbackText">Góp ý</span>
          </div>
        </div>
        <div className="navbar-right">
          <button
            type="button"
            id="btnNoticeModalTrigger"
            className="btn-tour-nav"
            onClick={() => (window as any).openNoticeModal?.()}
            title="Lưu ý & Khuyến cáo sử dụng"
          >
            <i className="fas fa-bullhorn"></i>{' '}
            <span id="btnNoticeText"></span>
          </button>
          <button
            type="button"
            id="btnQuickTour"
            className="btn-tour-nav"
            onClick={() => (window as any).startQuickTour?.()}
            title="Giới thiệu trang web"
          >
            <i className="fas fa-circle-info"></i>{' '}
            <span id="btnTourText">Giới thiệu trang web</span>
          </button>
          <button
            type="button"
            id="btnThemeToggle"
            className="btn-theme-toggle"
            title="Chuyển sang chế độ tối"
            aria-label="Chuyển đổi chế độ sáng/tối"
          >
            <i className="fas fa-moon" id="themeIcon"></i>
          </button>
          <div className="language-switch" aria-label="Language">
            <button
              type="button"
              id="btnLangVi"
              className="language-btn active"
            >
              VI
            </button>
            <button type="button" id="btnLangEn" className="language-btn">
              EN
            </button>
          </div>
          <button
            type="button"
            id="btnAdminModal"
            className="btn-admin-nav"
            onClick={() => (window as any).openAdminModal?.()}
            title="Quyền Admin - Thống kê"
          >
            <i className="fas fa-user-shield"></i> <span id="btnAdminText">Admin</span>
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="main-content">
        {/* Map Tab */}
        <div id="tabMap" className="tab-pane active">
          <div id="map"></div>
          <div id="comparePanel" className="compare-panel">
            <div className="compare-header">
              <span>
                <i className="fas fa-columns"></i> So sánh năm
              </span>
              <select
                id="compareYearSelect"
                className="compare-year-select"
              ></select>
              <button
                type="button"
                className="icon-btn"
                onClick={() => (window as any).toggleSplitView?.(false)}
                title="Tắt so sánh"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div id="compareMap"></div>
          </div>

          <div className="map-quick-toolbar">
            <div className="smart-search">
              <i className="fas fa-search"></i>
              <input
                type="text"
                id="smartSearchInput"
                placeholder="Tìm tỉnh, địa danh, tên cũ/mới, English/VN..."
                autoComplete="off"
              />
              <button
                type="button"
                className="icon-btn"
                id="btnClearSearch"
                title="Xóa tìm kiếm"
              >
                <i className="fas fa-times"></i>
              </button>
              <div
                id="smartSearchResults"
                className="smart-search-results"
              ></div>
            </div>
            <button
              type="button"
              className="toolbar-btn"
              id="btnBackView"
              title="Quay lại vị trí/năm/chế độ trước đó"
              disabled
            >
              <i className="fas fa-rotate-left"></i>
            </button>
            <button
              type="button"
              className="toolbar-btn"
              id="btnBookmarkPlace"
              title="Lưu địa phương đang chọn"
              disabled
            >
              <i className="fas fa-bookmark"></i>
            </button>
            <button
              type="button"
              className="toolbar-btn"
              id="btnQuickPlaces"
              title="Bookmark và lịch sử gần đây"
            >
              <i className="fas fa-clock-rotate-left"></i>
            </button>
            <button
              type="button"
              className="toolbar-btn"
              id="btnSplitView"
              title="So sánh 2 mốc năm song song"
            >
              <i className="fas fa-table-columns"></i>
            </button>
            <div
              id="quickPlacesPanel"
              className="quick-places-panel"
            ></div>
          </div>

          <div className="info-box minimized" id="infoBox">
            <div className="info-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>
                <i className="fas fa-map-marker-alt"></i> <span id="txtInfoBoxHeader">Thông tin địa điểm</span>
              </h3>
              <button type="button" className="btn-toggle-info" id="btnToggleInfo" onClick={() => (window as any).toggleInfoBox?.()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}>
                <i className="fas fa-chevron-up"></i>
              </button>
            </div>
            <div id="infoContent">
              <div style={{ color: '#95a5a6', fontStyle: 'italic' }}>
                Chọn một điểm trên bản đồ để xem thông tin chi tiết.
              </div>
            </div>
            <button id="btnShowHistory" className="btn-history" disabled>
              <i className="fas fa-info-circle"></i> Xem chi tiết & Lịch sử
            </button>
          </div>

          <div id="miniChatWidget" className="mini-chat-widget closed">
            {/* Resize Handles for arbitrary resizing */}
            <div className="mini-chat-resizer resizer-top" data-direction="top"></div>
            <div className="mini-chat-resizer resizer-right" data-direction="right"></div>
            <div className="mini-chat-resizer resizer-top-right" data-direction="top-right" title="Kéo để thu phóng kích thước">
              <i className="fas fa-up-right-and-down-left-from-center resizer-corner-icon"></i>
            </div>
            <div className="mini-chat-resizer resizer-bottom" data-direction="bottom"></div>
            <div className="mini-chat-resizer resizer-left" data-direction="left"></div>
            <div className="mini-chat-resizer resizer-top-left" data-direction="top-left"></div>
            <div className="mini-chat-resizer resizer-bottom-right" data-direction="bottom-right"></div>

            <div className="mini-chat-header" id="miniChatHeader">
              <span>
                <i className="fas fa-robot"></i> Trợ lý AI
              </span>
              <div className="mini-chat-actions">
                <button
                  type="button"
                  className="mini-chat-action-btn"
                  id="miniChatResetBtn"
                  onClick={() => (window as any).resetMiniChatSize?.()}
                  title="Đặt lại kích thước mặc định"
                >
                  <i className="fas fa-rotate-left"></i>
                </button>
                <button
                  type="button"
                  className="mini-chat-action-btn"
                  id="miniChatMaximizeBtn"
                  onClick={() => (window as any).toggleMiniChatMaximize?.()}
                  title="Phóng to / Thu nhỏ khung chatbot"
                >
                  <i className="fas fa-expand" id="miniChatMaximizeIcon"></i>
                </button>
                <button
                  type="button"
                  className="mini-chat-close"
                  onClick={() => (window as any).toggleMiniChat?.(false)}
                  title="Đóng"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="mini-chat-body">
              <div
                id="miniChatMapContext"
                className="mini-chat-map-context"
                title="Vùng đang chỉ/chọn trên bản đồ — AI hiểu &quot;đây&quot;, &quot;nơi này&quot;"
              >
                <i className="fas fa-hand-pointer"></i>
                <span id="miniChatMapContextText"></span>
              </div>
              <div id="miniChatMessages" className="mini-chat-messages">
                <div className="mini-chat-message ai">
                  Xin chào! Tôi có thể giải đáp thắc mắc về địa lý và lịch sử
                  của địa phương bạn đang chọn.
                </div>
              </div>
              <div className="mini-chat-input-area">
                <input
                  type="text"
                  id="miniChatInput"
                  className="mini-chat-input"
                  placeholder="Hỏi AI về tỉnh/thành..."
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (window as any).sendMiniChatMessage?.()
                  }
                />
                <button
                  className="btn-send"
                  onClick={() => (window as any).sendMiniChatMessage?.()}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
          <button
            id="miniChatToggle"
            className="mini-chat-toggle"
            onClick={() => (window as any).toggleMiniChat?.(true)}
          >
            <i className="fas fa-robot"></i>
          </button>

          <div className="history-slide-panel" id="historySlidePanel">
            <div className="slide-header">
              <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
                <i className="fas fa-file-alt"></i> Thông tin Địa phương
              </h3>
              <div className="slide-actions">
                <button
                  type="button"
                  className="panel-action-btn"
                  onClick={() => (window as any).exportCurrentReport?.('json')}
                  title="Xuất JSON"
                >
                  <i className="fas fa-code"></i>
                </button>
                <button
                  type="button"
                  className="panel-action-btn"
                  onClick={() => (window as any).exportCurrentReport?.('png')}
                  title="Xuất PNG"
                >
                  <i className="fas fa-image"></i>
                </button>
                <button
                  type="button"
                  className="panel-action-btn"
                  onClick={() => (window as any).exportCurrentReport?.('pdf')}
                  title="Xuất PDF"
                >
                  <i className="fas fa-file-pdf"></i>
                </button>
                <button
                  onClick={() => (window as any).toggleHistorySlide?.(false)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    color: '#666',
                  }}
                >
                  &times;
                </button>
              </div>
            </div>
            <div id="sidePanelContent" className="slide-content">
              <p
                style={{
                  textAlign: 'center',
                  color: '#7f8c8d',
                  marginTop: '20px',
                }}
              >
                Vui lòng chọn một địa điểm trên bản đồ để tải dữ liệu.
              </p>
            </div>
          </div>

          <div className="control-panel">
            <div className="header-info">
              <h2>Dòng thời gian</h2>
              <div className="year-display" id="yearValue">
                ...
              </div>
            </div>
            <div className="timeline-container">
              <input type="range" id="timeline" min="0" max="1" step="1" />
              <div className="timeline-ticks" id="timelineTicks"></div>
            </div>
            <div id="eventTimeline" className="event-timeline"></div>

            <div className="layer-controls">
              <label className="radio-wrapper active" id="lblProvince">
                <input
                  type="radio"
                  name="viewMode"
                  value="province"
                  defaultChecked
                />{' '}
                Xem Tỉnh
              </label>
              <label className="radio-wrapper" id="lblDistrict">
                <input type="radio" name="viewMode" value="district" /> Xem Huyện
              </label>
              <label className="radio-wrapper" id="lblWard">
                <input type="radio" name="viewMode" value="ward" /> Xem Xã
              </label>
            </div>
            <div
              className="guest-en-controls"
              id="guestEnControls2025"
              style={{ display: 'none' }}
            >
              <button
                type="button"
                id="btnGuestEn2025"
                className="btn-guest-en-2025"
                data-label-mode="fun"
                aria-pressed="false"
                title="Phiên âm vui cho tên tỉnh/thành năm 2025"
              >
                Hiện phiên âm tên tỉnh
              </button>
            </div>
          </div>
        </div>

        {/* Merger Tab */}
        <div id="tabMerger" className="tab-pane">
          <div className="merger-container" id="mergerContainer">
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                fontSize: '1.1rem',
                width: '100%',
              }}
            >
              <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu sáp
              nhập...
            </div>
          </div>
        </div>

        {/* Chat Tab */}
        <div id="tabChat" className="tab-pane">
          <div className="chat-header">
            <h2>
              <i className="fas fa-brain"></i> <span id="txtChatHeader">Trợ lý AI Viemacle</span>
            </h2>
            <div className="chat-header-actions">
              <button
                type="button"
                className="btn-history-toggle"
                id="btnToggleHistory"
                onClick={() => (window as any).toggleChatHistory?.()}
                title="Xem lịch sử trò chuyện"
              >
                <i className="fas fa-history"></i> <span id="txtHistoryToggle">Lịch sử chat</span>
              </button>
              <button
                type="button"
                className="btn-new-chat"
                onClick={() => (window as any).resetChat?.()}
              >
                <i className="fas fa-plus"></i> <span id="txtNewChat">Cuộc trò chuyện mới</span>
              </button>
            </div>
          </div>
          <div className="chat-body-container">
            {/* History Sidebar */}
            <div className="chat-sidebar" id="chatSidebar">
              <div className="chat-sidebar-header">
                <h3>
                  <i className="fas fa-history"></i> <span id="txtSidebarHistoryTitle">Lịch sử trò chuyện</span>
                </h3>
                <button
                  type="button"
                  className="btn-clear-all-history"
                  onClick={() => (window as any).clearAllChatHistory?.()}
                  title="Xóa toàn bộ lịch sử"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
              <div className="chat-sidebar-search">
                <input
                  type="text"
                  id="chatHistorySearch"
                  placeholder="Tìm kiếm lịch sử..."
                  onInput={() => (window as any).renderChatHistoryList?.()}
                />
                <i className="fas fa-search search-icon"></i>
              </div>
              <div className="chat-history-list" id="chatHistoryList">
                {/* Loaded dynamically */}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-main-area">
              <div
                id="chatMapContext"
                className="chat-map-context"
                title="Vùng đang chỉ/chọn trên tab Bản đồ"
              >
                <i className="fas fa-map-pin" id="chatMapContextIcon"></i>
                <span>
                  <span id="chatMapContextLabel">Đang chọn trên bản đồ:</span>{' '}
                  <strong id="chatMapContextName"></strong>{' '}
                  <span id="chatMapContextYear"></span>
                </span>
              </div>
              <div className="chat-messages" id="chatMessages">
                <div className="message ai">
                  Xin chào! Tôi là AI hỗ trợ tìm hiểu về Lịch sử và Địa lý Việt Nam.
                  Hãy đặt câu hỏi cho tôi nhé!
                </div>
              </div>
              <div className="chat-input-area">
                <input
                  type="text"
                  id="chatInput"
                  className="chat-input"
                  placeholder="Nhập câu hỏi của bạn (VD: Lịch sử tỉnh Quảng Nam?)..."
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (window as any).sendMessage?.()
                  }
                />
                <button
                  type="button"
                  className="btn-send"
                  onClick={() => (window as any).sendMessage?.()}
                >
                  <i className="fas fa-paper-plane"></i> <span id="txtSendBtn">Gửi</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Map Tab */}
        <div id="tabMemory" className="tab-pane">
          <div className="memory-layout">
            <aside className="memory-panel">
              <h2 className="memory-title">
                <i className="fas fa-puzzle-piece"></i> Ghi nhớ bản đồ
              </h2>
              <div className="memory-card">
                <label className="memory-label" htmlFor="memoryYearSelect">
                  Bộ bản đồ
                </label>
                <select
                  id="memoryYearSelect"
                  className="memory-select"
                ></select>
              </div>
              <div className="memory-card">
                <label
                  className="memory-label"
                  htmlFor="memoryModeSelect"
                  id="memoryModeLabel"
                >
                  Chế độ luyện tập
                </label>
                <select id="memoryModeSelect" className="memory-select">
                  <option value="map">Chọn trên bản đồ</option>
                  <option value="shape">Trắc nghiệm hình dạng tỉnh</option>
                </select>
              </div>
              <div className="memory-card">
                <label
                  className="memory-label"
                  htmlFor="memoryRegionSelect"
                  id="memoryRegionLabel"
                >
                  Bộ câu hỏi
                </label>
                <select id="memoryRegionSelect" className="memory-select">
                  <option value="all">Toàn quốc</option>
                  <option value="north">Miền Bắc</option>
                  <option value="central">Miền Trung</option>
                  <option value="south">Miền Nam</option>
                </select>
              </div>
              <div className="memory-card">
                <span className="memory-label" id="memoryTargetLabel">
                  Hãy tìm địa phương
                </span>
                <div id="memoryTarget" className="memory-target">
                  Bấm bắt đầu
                </div>
                <div id="memoryChoices" className="memory-choices hidden"></div>
              </div>
              <div className="memory-stats">
                <div className="memory-stat">
                  <span>Điểm</span>
                  <strong id="memoryScore">0</strong>
                </div>
                <div className="memory-stat">
                  <span>Câu</span>
                  <strong id="memoryRound">0/0</strong>
                </div>
                <div className="memory-stat">
                  <span>Chuỗi đúng</span>
                  <strong id="memoryStreak">0</strong>
                </div>
                <div className="memory-stat">
                  <span>Kỷ lục</span>
                  <strong id="memoryBest">0</strong>
                </div>
              </div>
              <div className="memory-actions">
                <button
                  className="memory-btn primary"
                  id="memoryStartBtn"
                  onClick={() => (window as any).startMemoryGame?.()}
                >
                  <i className="fas fa-play"></i> Bắt đầu
                </button>
                <button
                  className="memory-btn"
                  id="memoryHintBtn"
                  onClick={() => (window as any).showMemoryHint?.()}
                  disabled
                >
                  <i className="fas fa-lightbulb"></i> Gợi ý
                </button>
                <button
                  className="memory-btn"
                  id="memorySkipBtn"
                  onClick={() => (window as any).skipMemoryQuestion?.()}
                  disabled
                >
                  <i className="fas fa-forward"></i> Bỏ qua
                </button>
                <button
                  className="memory-btn"
                  onClick={() => (window as any).resetMemoryGame?.()}
                >
                  <i className="fas fa-rotate-left"></i> Làm lại
                </button>
              </div>
              <div id="memoryFeedback" className="memory-feedback">
                Chọn năm dữ liệu rồi bắt đầu luyện nhớ vị trí tỉnh/thành.
              </div>
              <div className="memory-card">
                <span className="memory-label">Lịch sử lượt này</span>
                <div id="memoryResults" className="memory-list">
                  <div style={{ color: '#8a988a', fontStyle: 'italic' }}>
                    Chưa có lượt trả lời.
                  </div>
                </div>
              </div>
            </aside>
            <div className="memory-map-wrap">
              <div id="memoryMap"></div>
              <div id="memoryMapIdle" className="memory-map-idle">
                <p>
                  Chọn <strong>năm</strong> ở cột bên trái, rồi nhấn{' '}
                  <strong>Bắt đầu</strong> để luyện ghi nhớ vị trí tỉnh/thành.
                </p>
              </div>
              <div className="memory-map-note hidden" id="memoryMapNote">
                Bấm trực tiếp vào tỉnh/thành trên bản đồ để trả lời.
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Tab */}
        <div id="tabFeedback" className="tab-pane">
          <div className="feedback-container">
            <div className="feedback-card">
              <div className="feedback-icon">
                <i className="fas fa-paper-plane"></i>
              </div>
              <h2 className="feedback-title" id="feedbackTitle">
                Đóng góp ý kiến & Phản hồi
              </h2>
              <p className="feedback-desc" id="feedbackDesc">
                Ý kiến đóng góp của bạn giúp ứng dụng Viemap Chronicle ngày càng hoàn thiện hơn. Hãy gửi phản hồi, góp ý tính năng hoặc báo lỗi cho chúng tôi qua mẫu Google Form dưới đây.
              </p>
              <a
                href="https://forms.gle/MrNmpBhH6BPms2CGA"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-feedback-direct"
              >
                <i className="fas fa-external-link-alt"></i>{' '}
                <span id="btnFeedbackFormText">Mở Form Đóng góp ý kiến (Google Form)</span>
              </a>
              <div className="feedback-frame-wrapper">
                <iframe
                  src="https://docs.google.com/forms/d/e/1FAIpQLSfk1ZIaX3d5TCY04c_oi6_QiB6oPjD_gLhXz0AKJqiVk7nVIA/viewform?embedded=true"
                  className="feedback-iframe"
                  title="Google Form Feedback"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modal for Login & Visitor Statistics */}
      <div id="adminModal" className="admin-modal-overlay hidden">
        <div className="admin-modal-card">
          <div className="admin-modal-header">
            <h3>
              <i className="fas fa-user-shield"></i>{' '}
              <span id="adminModalTitle">Đăng nhập quyền Admin</span>
            </h3>
            <button
              type="button"
              className="admin-modal-close"
              onClick={() => (window as any).closeAdminModal?.()}
            >
              &times;
            </button>
          </div>
          <div className="admin-modal-body">
            {/* Login State */}
            <div id="adminLoginSection">
              <div className="admin-form-group">
                <label htmlFor="adminUsername">
                  <i className="fas fa-user"></i> Tên đăng nhập
                </label>
                <input
                  type="text"
                  id="adminUsername"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="adminPassword">
                  <i className="fas fa-lock"></i> Mật khẩu
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  placeholder="Nhập mật khẩu"
                />
              </div>
              <div id="adminLoginError" className="admin-error-msg hidden"></div>
              <button
                type="button"
                className="admin-btn-login"
                onClick={() => (window as any).handleAdminLogin?.()}
              >
                <i className="fas fa-sign-in-alt"></i> Đăng nhập Admin
              </button>
            </div>

            {/* Dashboard State */}
            <div id="adminDashboardSection" className="hidden">
              <div className="admin-status-badge">
                <span className="status-indicator"></span> Đang hoạt động với quyền{' '}
                <strong>Admin</strong>
              </div>
              <div id="adminDbStatusBadge" style={{ marginTop: '8px', fontSize: '0.8rem', opacity: 0.9 }}>
                <i className="fas fa-database" style={{ marginRight: '4px' }}></i>
                <span id="adminDbStatusText">Đang kiểm tra kết nối CSDL...</span>
              </div>

              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-icon icon-total">
                    <i className="fas fa-eye"></i>
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Tổng lượt truy cập</span>
                    <strong id="adminStatTotalVisits" className="stat-value">
                      0
                    </strong>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-icon icon-today">
                    <i className="fas fa-calendar-day"></i>
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Truy cập hôm nay</span>
                    <strong id="adminStatTodayVisits" className="stat-value">
                      0
                    </strong>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-icon icon-users">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Người dùng duy nhất</span>
                    <strong id="adminStatUniqueVisitors" className="stat-value">
                      0
                    </strong>
                  </div>
                </div>
              </div>

              <div className="admin-recent-section">
                <h4>
                  <i className="fas fa-history"></i> Lịch sử truy cập gần đây
                </h4>
                <div id="adminRecentVisitsList" className="admin-recent-list">
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    Chưa có dữ liệu.
                  </div>
                </div>
              </div>

              <div className="admin-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => (window as any).loadAdminStats?.()}
                >
                  <i className="fas fa-sync-alt"></i> Làm mới dữ liệu
                </button>
                <button
                  type="button"
                  className="admin-btn-logout"
                  onClick={() => (window as any).handleAdminLogout?.()}
                >
                  <i className="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <div className="loading-overlay" id="loading">
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem' }}></i>
        <div>Đang tải dữ liệu bản đồ...</div>
      </div>

      {/* Tour Overlay */}
      <div id="tourOverlay" className="tour-overlay" aria-hidden="true">
        <div id="tourSpotlight" className="tour-spotlight"></div>
        <div id="tourCard" className="tour-card">
          <div className="tour-step-count" id="tourStepCount"></div>
          <h3 id="tourTitle"></h3>
          <p id="tourText"></p>
          <div className="tour-actions">
            <button
              type="button"
              className="tour-btn secondary"
              id="tourSkipBtn"
            >
              Bỏ qua
            </button>
            <button type="button" className="tour-btn" id="tourPrevBtn">
              Trước
            </button>
            <button type="button" className="tour-btn primary" id="tourNextBtn">
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {/* Welcome / Notice Modal */}
      <div id="noticeModal" className="notice-modal-overlay hidden" aria-hidden="true">
        <div className="notice-modal-container">
          <div className="notice-modal-header">
            <div className="notice-modal-title">
              <i className="fas fa-bullhorn title-icon"></i>
              <span id="noticeModalTitle">Lưu Ý & Khuyến Cáo Trải Nghiệm</span>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => (window as any).closeNoticeModal?.()}
              title="Đóng"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="notice-modal-body">
            {/* Card 1: Device Recommendation */}
            <div className="notice-card notice-card-device">
              <div className="notice-card-icon">
                <i className="fas fa-desktop"></i>
              </div>
              <div className="notice-card-content">
                <h4 id="noticeDeviceHeading">Khuyến cáo thiết bị truy cập</h4>
                <p id="noticeDeviceText">
                  Nên sử dụng <strong>máy tính (PC / Laptop)</strong> để có trải nghiệm tốt nhất. Nếu truy cập bằng <strong>điện thoại di động</strong>, vui lòng chuyển trình duyệt sang <strong>"Chế độ máy tính" (Desktop site)</strong>.
                </p>
              </div>
            </div>

            {/* Card 2: Author Disclaimer */}
            <div className="notice-card notice-card-disclaimer">
              <div className="notice-card-icon">
                <i className="fas fa-triangle-exclamation"></i>
              </div>
              <div className="notice-card-content">
                <h4 id="noticeDisclaimerHeading">Nguồn thông tin & Độ chính xác</h4>
                <p id="noticeDisclaimerText">
                  Thông tin sản phẩm do <strong>tác giả tự tổng hợp và đăng tải</strong> nên có thể mắc một số sai sót. Các nội dung mang tính chất tham khảo.
                </p>
              </div>
            </div>

            {/* Card 3: 2008 Map Landmark Recommendation */}
            <div className="notice-card notice-card-feature">
              <div className="notice-card-icon">
                <i className="fas fa-map-location-dot"></i>
              </div>
              <div className="notice-card-content">
                <h4 id="noticeFeatureHeading">Tính năng tra cứu thông tin địa phương</h4>
                <p id="noticeFeatureText">
                  Hoạt động tốt nhất và đầy đủ dữ liệu nhất khi đặt mốc thời gian bản đồ ở <strong>năm 2008</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="notice-modal-footer">
            <label className="notice-dont-show">
              <input type="checkbox" id="chkDontShowNoticeAgain" />
              <span id="chkDontShowText">Không hiển thị lại thông báo này</span>
            </label>
            <button
              type="button"
              className="btn-notice-confirm"
              onClick={() => (window as any).closeNoticeModal?.()}
            >
              <i className="fas fa-check-circle"></i>
              <span id="btnNoticeConfirmText">Đã hiểu & Trải nghiệm ngay</span>
            </button>
          </div>
        </div>
      </div>

      <footer>
        <p className="footer-text">Thông tin chỉ mang tính chất tham khảo</p>
      </footer>

      {/* Execute Client Logic App Script */}
      <Script src="/static/app.js" strategy="afterInteractive" />
    </>
  );
}
