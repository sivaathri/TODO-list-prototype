/**
 * FlowTrack - Production Workflow & Approval Management
 * Application Controller, Router & UI Interactivity
 */

class FlowApp {
  constructor() {
    this.currentView = 'creator-dashboard';
    this.activeRequestId = 'REQ-1001';
    this.createFormFiles = [
      {
        id: 'mock-att-default',
        name: 'Technical_Spec_Sheet_RevB.pdf',
        size: '1.4 MB',
        type: 'pdf',
        uploadedAt: 'Today'
      }
    ];
    this.execProofFiles = [
      {
        id: 'mock-prf-default',
        name: 'Torque_Calibration_Log.pdf',
        size: '1.2 MB',
        type: 'pdf',
        uploadedAt: 'Today'
      }
    ];

    this.trackingFilters = {
      search: '',
      shift: '',
      stage: '',
      executor: '',
      status: ''
    };

    this.init();
  }

  init() {
    // Set initial date fields to today
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('req-field-date');
    if (dateInput) dateInput.value = todayStr;
    const execDateInput = document.getElementById('exec-field-date');
    if (execDateInput) execDateInput.value = todayStr;

    // Listen to store events
    window.flowStore.subscribe((event, payload) => {
      this.handleStoreEvent(event, payload);
    });

    // Close top-module dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const switcher = document.getElementById('top-module-switcher');
      const dropdown = document.getElementById('top-module-dropdown');
      if (dropdown && !dropdown.classList.contains('hidden')) {
        if (switcher && !switcher.contains(e.target)) {
          dropdown.classList.add('hidden');
          const btn = document.getElementById('btn-active-module');
          if (btn) btn.classList.remove('open');
        }
      }
    });

    // Render initial user context & sidebar
    this.syncUserContext();
    this.syncModuleContext();
    this.renderCurrentView();
    this.updateNotificationBadge();

    // Drag and drop setup
    this.setupDragAndDrop();
  }

  // Event listener for store mutations
  handleStoreEvent(event, payload) {
    if (event === 'SIMULATED_EMAIL_SENT') {
      this.showEmailToast(payload);
    } else if (event === 'NOTIFICATION_ADDED' || event === 'NOTIFICATIONS_UPDATED') {
      this.updateNotificationBadge();
      if (this.currentView === 'notifications') {
        this.renderNotificationsView();
      }
    } else if (event === 'MODULE_CHANGED') {
      this.syncModuleContext();
    } else if (event === 'RESET') {
      this.showNotificationToast('System data reset to default demonstration state.', 'info');
      this.syncUserContext();
      this.syncModuleContext();
      this.renderCurrentView();
    } else {
      // Re-render active view on request updates
      this.renderCurrentView();
    }
  }

  // ========================================================================
  // User Authentication & Persona Switching
  // ========================================================================
  loginAs(roleKey) {
    window.flowStore.setCurrentUser(roleKey);
    this.syncUserContext();
    this.syncModuleContext();

    // After login click -> Show the 3 Menu Module Selection screen
    this.showModuleSelector();
  }

  showModuleSelector() {
    const loginView = document.getElementById('view-login');
    const moduleView = document.getElementById('view-module-select');
    const appShell = document.getElementById('app-shell');

    if (loginView) loginView.classList.add('hidden');
    if (appShell) {
      appShell.classList.add('hidden');
      appShell.style.display = 'none';
    }
    if (moduleView) {
      moduleView.classList.remove('hidden');
      moduleView.style.display = 'flex';
    }

    const user = window.flowStore.getCurrentUser();
    const modAvatar = document.getElementById('mod-user-avatar');
    const modName = document.getElementById('mod-user-name');
    const modRole = document.getElementById('mod-user-role');

    if (modAvatar) modAvatar.textContent = user.avatar;
    if (modName) modName.textContent = user.name;
    if (modRole) modRole.textContent = `${user.roleLabel} • ${user.department}`;

    this.syncModuleContext();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectModule(moduleKey) {
    const selected = window.flowStore.setSelectedModule(moduleKey);
    this.syncModuleContext();

    const moduleView = document.getElementById('view-module-select');
    const loginView = document.getElementById('view-login');
    const appShell = document.getElementById('app-shell');

    if (moduleView) {
      moduleView.classList.add('hidden');
      moduleView.style.display = 'none';
    }
    if (loginView) {
      loginView.classList.add('hidden');
    }
    if (appShell) {
      appShell.classList.remove('hidden');
      appShell.style.display = 'flex';
    }

    // Close top dropdown if open
    const dropdown = document.getElementById('top-module-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    const btn = document.getElementById('btn-active-module');
    if (btn) btn.classList.remove('open');

    // Route to appropriate persona dashboard
    const user = window.flowStore.getCurrentUser();
    if (user.role === 'creator') {
      this.navigateTo('creator-dashboard');
    } else if (user.role === 'executor') {
      this.navigateTo('executor-dashboard');
    } else if (user.role === 'approver1' || user.role === 'approver2') {
      this.navigateTo('approver-dashboard');
    } else if (user.role === 'admin') {
      this.navigateTo('admin-dashboard');
    }

    this.showNotificationToast(`Opened: ${selected.name}`, 'info');
  }

  openModuleSelector() {
    const appShell = document.getElementById('app-shell');
    const moduleView = document.getElementById('view-module-select');
    if (appShell) {
      appShell.classList.add('hidden');
      appShell.style.display = 'none';
    }
    if (moduleView) {
      moduleView.classList.remove('hidden');
      moduleView.style.display = 'flex';
    }

    const dropdown = document.getElementById('top-module-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    const btn = document.getElementById('btn-active-module');
    if (btn) btn.classList.remove('open');

    this.syncModuleContext();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleModuleDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('top-module-dropdown');
    const btn = document.getElementById('btn-active-module');
    if (dropdown) {
      const isHidden = dropdown.classList.toggle('hidden');
      if (btn) {
        btn.classList.toggle('open', !isHidden);
      }
    }
  }

  syncModuleContext() {
    const currentMod = window.flowStore.getSelectedModule();
    if (!currentMod) return;

    const topLabel = document.getElementById('top-module-name');
    const topDot = document.getElementById('top-module-dot');
    const sbBadge = document.getElementById('sb-module-badge');
    const sbModName = document.getElementById('sb-mod-current-name');
    const sbModDot = document.getElementById('sb-mod-dot');

    if (topLabel) topLabel.textContent = currentMod.name;
    if (sbBadge) sbBadge.textContent = currentMod.name;
    if (sbModName) sbModName.textContent = currentMod.name;

    // Dot colors
    if (topDot) topDot.style.backgroundColor = currentMod.accent;
    if (sbModDot) sbModDot.style.backgroundColor = currentMod.accent;

    // Active state in dropdown
    ['process_audit', 'ihlr', 'try_out'].forEach(id => {
      const dropItem = document.getElementById(`top-menu-item-${id}`);
      if (dropItem) {
        dropItem.classList.toggle('active', id === currentMod.id);
      }
      const cardId = id === 'process_audit' ? 'card-mod-process-audit' : id === 'try_out' ? 'card-mod-tryout' : 'card-mod-ihlr';
      const cardEl = document.getElementById(cardId);
      if (cardEl) {
        cardEl.classList.toggle('is-active-module', id === currentMod.id);
      }
    });
  }

  handleStandardLogin() {
    const emailInput = document.getElementById('login-email');
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

    // Check if registered user exists in system store
    const users = window.flowStore.getUsers();
    const matched = users.find(u => u.email && u.email.toLowerCase() === email);
    if (matched) {
      this.loginAs(matched.role);
      return;
    }

    if (email.includes('kumar') || email.includes('ravi') || email.includes('arjun') || email.includes('suresh') || email.includes('exec')) {
      this.loginAs('executor');
    } else if (email.includes('raj') || email.includes('appr1')) {
      this.loginAs('approver1');
    } else if (email.includes('anand') || email.includes('head') || email.includes('appr2')) {
      this.loginAs('approver2');
    } else if (email.includes('admin') || email.includes('vikram')) {
      this.loginAs('admin');
    } else {
      this.loginAs('creator');
    }
  }

  togglePasswordVisibility() {
    const pwdInput = document.getElementById('login-password');
    const eyeIcon = document.getElementById('pwd-eye-icon');
    if (!pwdInput) return;
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      if (eyeIcon) {
        eyeIcon.innerHTML = `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`;
      }
    } else {
      pwdInput.type = 'password';
      if (eyeIcon) {
        eyeIcon.innerHTML = `<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>`;
      }
    }
  }

  toggleDemoRoles(btn) {
    const panel = document.getElementById('demo-roles-panel');
    if (panel) {
      panel.classList.toggle('hidden');
      if (btn) btn.classList.toggle('active');
    }
  }

  quickFillRole(roleKey, email) {
    const emailInput = document.getElementById('login-email');
    if (emailInput && email) {
      emailInput.value = email;
    }
    this.loginAs(roleKey);
    this.showNotificationToast(`Logged in as ${window.flowStore.getCurrentUser().name}`, 'info');
  }

  switchRole(roleKey) {
    this.loginAs(roleKey);
    this.showNotificationToast(`Switched active persona to ${window.flowStore.getCurrentUser().name}`, 'info');
  }

  logout() {
    const appShell = document.getElementById('app-shell');
    const moduleView = document.getElementById('view-module-select');
    const loginView = document.getElementById('view-login');
    if (appShell) {
      appShell.classList.add('hidden');
      appShell.style.display = 'none';
    }
    if (moduleView) {
      moduleView.classList.add('hidden');
      moduleView.style.display = 'none';
    }
    if (loginView) {
      loginView.classList.remove('hidden');
    }
    const dropdown = document.getElementById('top-module-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
  }

  syncUserContext() {
    const user = window.flowStore.getCurrentUser();

    // Top Nav
    const topAvatar = document.getElementById('top-user-avatar');
    const topName = document.getElementById('top-user-name');
    const topRole = document.getElementById('top-user-role');
    const roleSelector = document.getElementById('persona-role-selector');

    if (topAvatar) topAvatar.textContent = user.avatar;
    if (topName) topName.textContent = user.name;
    if (topRole) topRole.textContent = user.department;
    if (roleSelector) roleSelector.value = user.role;

    // Sidebar
    const sbAvatar = document.getElementById('sb-user-avatar');
    const sbName = document.getElementById('sb-user-name');
    const sbRole = document.getElementById('sb-user-role');

    if (sbAvatar) sbAvatar.textContent = user.avatar;
    if (sbName) sbName.textContent = user.name;
    if (sbRole) sbRole.textContent = user.roleLabel;

    this.renderSidebarNav(user);
  }

  // ========================================================================
  // Sidebar & Navigation Management
  // ========================================================================
  renderSidebarNav(user) {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    let items = [];

    if (user.role === 'creator') {
      items = [
        { id: 'creator-dashboard', label: 'Dashboard', icon: this.getIcon('dashboard') },
        { id: 'create-request', label: 'Create Request', icon: this.getIcon('plus') },
        { id: 'request-tracking', label: 'My Requests', icon: this.getIcon('list') },
        { id: 'notifications', label: 'Notifications', icon: this.getIcon('bell'), badge: true },
        { id: 'profile', label: 'Profile', icon: this.getIcon('user') }
      ];
    } else if (user.role === 'executor') {
      items = [
        { id: 'executor-dashboard', label: 'Dashboard', icon: this.getIcon('dashboard') },
        { id: 'executor-assigned', label: 'Assigned Requests', icon: this.getIcon('clipboard') },
        { id: 'executor-completed', label: 'Completed Executions', icon: this.getIcon('checkCircle') },
        { id: 'request-tracking', label: 'All Floor Runs', icon: this.getIcon('list') },
        { id: 'notifications', label: 'Notifications', icon: this.getIcon('bell'), badge: true },
        { id: 'profile', label: 'Profile', icon: this.getIcon('user') }
      ];
    } else if (user.role === 'approver1' || user.role === 'approver2') {
      items = [
        { id: 'approver-dashboard', label: 'Dashboard', icon: this.getIcon('dashboard') },
        { id: 'approver-pending', label: 'Pending Approvals', icon: this.getIcon('shield') },
        { id: 'approver-approved', label: 'Approved Requests', icon: this.getIcon('checkCircle') },
        { id: 'approver-rejected', label: 'Rejected Requests', icon: this.getIcon('xCircle') },
        { id: 'request-tracking', label: 'Request Tracking', icon: this.getIcon('list') },
        { id: 'notifications', label: 'Notifications', icon: this.getIcon('bell'), badge: true },
        { id: 'profile', label: 'Profile', icon: this.getIcon('user') }
      ];
    } else if (user.role === 'admin') {
      items = [
        { id: 'admin-dashboard', label: 'Dashboard', icon: this.getIcon('dashboard') },
        { id: 'admin-users', label: 'User Management', icon: this.getIcon('users') },
        { id: 'admin-workflow', label: 'Workflow Configuration', icon: this.getIcon('layers') },
        { id: 'request-tracking', label: 'Global Tracking', icon: this.getIcon('list') },
        { id: 'notifications', label: 'System Logs', icon: this.getIcon('bell'), badge: true },
        { id: 'profile', label: 'Profile', icon: this.getIcon('user') }
      ];
    }

    const unreadCount = window.flowStore.getNotifications(user.role).filter(n => !n.read).length;

    nav.innerHTML = items.map(item => `
      <div class="sidebar-item ${this.currentView === item.id ? 'active' : ''}" 
           onclick="window.flowApp.navigateTo('${item.id}')">
        <div class="sidebar-item-left">
          ${item.icon}
          <span>${item.label}</span>
        </div>
        ${item.badge && unreadCount > 0 ? `<span class="sidebar-badge">${unreadCount}</span>` : ''}
      </div>
    `).join('');
  }

  navigateTo(viewId, payload = null) {
    this.closeModals();
    this.closeMobileSidebar();

    // Map sub-views to major views
    if (viewId === 'executor-assigned' || viewId === 'executor-completed') {
      viewId = 'executor-dashboard';
    } else if (viewId === 'approver-pending' || viewId === 'approver-approved' || viewId === 'approver-rejected') {
      viewId = 'approver-dashboard';
    } else if (viewId === 'admin-users' || viewId === 'admin-workflow') {
      viewId = 'admin-dashboard';
    }

    if (payload && payload.requestId) {
      this.activeRequestId = payload.requestId;
    }

    this.currentView = viewId;

    // Update active breadcrumb
    const activeBc = document.getElementById('top-active-breadcrumb');
    if (activeBc) {
      activeBc.textContent = this.formatViewTitle(viewId);
    }

    // Toggle view containers
    const allViews = [
      'creator-dashboard',
      'create-request',
      'request-details',
      'executor-dashboard',
      'execute-request',
      'approver-dashboard',
      'approval-review',
      'admin-dashboard',
      'request-tracking',
      'notifications',
      'profile'
    ];

    allViews.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) {
        if (v === viewId) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    this.renderSidebarNav(window.flowStore.getCurrentUser());
    this.renderCurrentView();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatViewTitle(viewId) {
    const titles = {
      'creator-dashboard': 'Creator Dashboard',
      'create-request': 'Create Production Request',
      'request-details': `Request Details (${this.activeRequestId})`,
      'executor-dashboard': 'Executor Dashboard',
      'execute-request': `Execute Request (${this.activeRequestId})`,
      'approver-dashboard': 'Approver Dashboard',
      'approval-review': `Review Request (${this.activeRequestId})`,
      'admin-dashboard': 'Admin & Analytics',
      'request-tracking': 'Request Tracking',
      'notifications': 'Notification Center',
      'profile': 'User Profile & Team Management'
    };
    return titles[viewId] || '';
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'creator-dashboard':
        this.renderCreatorDashboard();
        break;
      case 'create-request':
        this.renderCreateRequestPage();
        break;
      case 'request-details':
        this.renderRequestDetailsPage();
        break;
      case 'executor-dashboard':
        this.renderExecutorDashboard();
        break;
      case 'execute-request':
        this.renderExecuteRequestPage();
        break;
      case 'approver-dashboard':
        this.renderApproverDashboard();
        break;
      case 'approval-review':
        this.renderApprovalReviewPage();
        break;
      case 'admin-dashboard':
        this.renderAdminDashboard();
        break;
      case 'request-tracking':
        this.renderRequestTrackingPage();
        break;
      case 'notifications':
        this.renderNotificationsView();
        break;
      case 'profile':
        this.renderProfileView();
        break;
    }
  }

  // ========================================================================
  // VIEW 1: CREATOR DASHBOARD
  // ========================================================================
  renderCreatorDashboard() {
    const metrics = window.flowStore.getMetrics();
    document.getElementById('kpi-creator-total').textContent = metrics.totalRequests;
    document.getElementById('kpi-creator-pending-exec').textContent = metrics.pendingExecution;
    document.getElementById('kpi-creator-in-exec').textContent = metrics.inExecution;
    document.getElementById('kpi-creator-pending-appr').textContent = metrics.pendingApproval;
    document.getElementById('kpi-creator-approved').textContent = metrics.approved;
    document.getElementById('kpi-creator-rejected').textContent = metrics.rejected;

    const tbody = document.getElementById('table-creator-requests');
    if (!tbody) return;

    const requests = window.flowStore.getRequests();

    tbody.innerHTML = requests.map(r => {
      const createdDate = (r.activityTimeline && r.activityTimeline.length > 0)
        ? r.activityTimeline[0].timestamp
        : (r.displayDate || r.date || '03 Sep 2026');
      const productionDisplay = r.quantity ? `${r.quantity} ${r.unit || 'Units'}` : '1,250 Units';

      return `
        <tr>
          <td><span class="table-id-link" onclick="window.flowApp.openDetails('${r.id}')">${r.id}</span></td>
          <td>${r.displayDate || r.date}</td>
          <td><span class="font-medium">${r.shift}</span></td>
          <td>${productionDisplay}</td>
          <td><span class="font-medium">${r.stage || r.processOperation || 'Laser marking'}</span></td>
          <td>${this.renderStatusBadge(r.status)}</td>
          <td class="text-xs text-muted">${createdDate}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.flowApp.openDetails('${r.id}')">View Details</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ========================================================================
  // VIEW 2: CREATE REQUEST (Process Audit Observation & IHLR)
  // ========================================================================
  renderCreateRequestPage() {
    const currentMod = window.flowStore.getSelectedModule();
    const isIHLR = currentMod && currentMod.id === 'ihlr';

    this.switchProductionDetailsModule(isIHLR ? 'ihlr' : 'process_audit');

    const seq = window.flowStore.generateNextAuditSequence();
    const ihlrSeq = window.flowStore.generateNextIHLRSequence();
    const nextId = window.flowStore.generateNextRequestId();

    const snoInput = document.getElementById('req-field-sno');
    if (snoInput && (!snoInput.value || snoInput.value === '1')) {
      snoInput.value = seq.nextSNo;
    }
    const issueInput = document.getElementById('req-field-issueno');
    if (issueInput && (!issueInput.value || issueInput.value === '01')) {
      issueInput.value = seq.nextIssueNo;
    }
    const dateInput = document.getElementById('req-field-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    const idInput = document.getElementById('req-field-id');
    if (idInput) idInput.value = nextId;

    // IHLR sequence defaults
    const ihlrReqNo = document.getElementById('ihlr-field-reqno');
    if (ihlrReqNo && (!ihlrReqNo.value || ihlrReqNo.value === '1')) {
      ihlrReqNo.value = ihlrSeq.nextReqNo;
    }
    const ihlrDate = document.getElementById('ihlr-field-date');
    if (ihlrDate && !ihlrDate.value) {
      ihlrDate.value = new Date().toISOString().split('T')[0];
    }

    this.renderCreateAttachmentsList();
  }

  switchProductionDetailsModule(moduleId) {
    const isIHLR = moduleId === 'ihlr';
    window.flowStore.setSelectedModule(moduleId);
    this.syncModuleContext();

    const auditCard = document.getElementById('form-section-prod-details-process-audit');
    const ihlrCard = document.getElementById('form-section-prod-details-ihlr');
    const tabAudit = document.getElementById('tab-mod-process-audit');
    const tabIhlr = document.getElementById('tab-mod-ihlr');
    const pillText = document.getElementById('module-active-pill-text');

    if (auditCard) auditCard.style.display = isIHLR ? 'none' : 'block';
    if (ihlrCard) ihlrCard.style.display = isIHLR ? 'block' : 'none';

    if (tabAudit) tabAudit.classList.toggle('active', !isIHLR);
    if (tabIhlr) tabIhlr.classList.toggle('active', isIHLR);

    if (pillText) {
      pillText.textContent = isIHLR ? 'IHLR (In-House Line Rejection)' : 'Process Audit Observation';
    }

    if (isIHLR) {
      const seq = window.flowStore.generateNextIHLRSequence();
      const reqInput = document.getElementById('ihlr-field-reqno');
      if (reqInput && (!reqInput.value || reqInput.value === '1')) {
        reqInput.value = seq.nextReqNo;
      }
    }
  }

  loadExcelSampleIHLR() {
    if (document.getElementById('ihlr-field-reqno')) document.getElementById('ihlr-field-reqno').value = '1';
    if (document.getElementById('ihlr-field-date')) document.getElementById('ihlr-field-date').value = '2026-09-01';
    if (document.getElementById('ihlr-field-shift')) document.getElementById('ihlr-field-shift').value = 'i';
    if (document.getElementById('ihlr-field-qty')) document.getElementById('ihlr-field-qty').value = '1';
    if (document.getElementById('ihlr-field-problem')) document.getElementById('ihlr-field-problem').value = 'Low voltage';
    if (document.getElementById('ihlr-field-model')) document.getElementById('ihlr-field-model').value = 'OLS LONG ARM';
    if (document.getElementById('ihlr-field-detected-at')) document.getElementById('ihlr-field-detected-at').value = 'Final Testing';
    if (document.getElementById('ihlr-field-received-from')) document.getElementById('ihlr-field-received-from').value = 'D3/LINE';
    if (document.getElementById('ihlr-field-analysis-by')) document.getElementById('ihlr-field-analysis-by').value = 'GURU';
    if (document.getElementById('ihlr-field-4m')) {
      document.getElementById('ihlr-field-4m').value = 'MAN';
      this.update4MBadge('MAN');
    }
    if (document.getElementById('ihlr-field-resp')) document.getElementById('ihlr-field-resp').value = 'PROD';
    if (document.getElementById('ihlr-field-w1')) document.getElementById('ihlr-field-w1').value = 'Low voltage';
    if (document.getElementById('ihlr-field-w2')) document.getElementById('ihlr-field-w2').value = 'Sensor improper soldering';
    if (document.getElementById('ihlr-field-w3')) document.getElementById('ihlr-field-w3').value = 'Skipped visual inspection';
    if (document.getElementById('ihlr-field-w4')) document.getElementById('ihlr-field-w4').value = '';
    if (document.getElementById('ihlr-field-w5')) document.getElementById('ihlr-field-w5').value = '';

    this.loadSampleIHLRDefectImage();
    this.showNotificationToast('Pre-filled exact IHLR data from Excel (OLS LONG ARM / Low voltage / GURU / 4M: MAN)', 'info');
  }

  update4MBadge(val) {
    const badge = document.getElementById('ihlr-4m-badge-preview');
    if (!badge) return;
    badge.className = `badge-4m badge-4m-${(val || 'man').toLowerCase()}`;
    badge.textContent = val || 'MAN';
  }

  loadSampleIHLRDefectImage() {
    const thumbImg = document.getElementById('ihlr-evidence-thumb-img');
    if (thumbImg) thumbImg.src = 'images/defect_ihlr_sensor.svg';
    const nameLabel = document.getElementById('ihlr-evidence-name-label');
    if (nameLabel) nameLabel.textContent = 'Defect_Sensor_Improper_Soldering.svg';
    const subLabel = document.getElementById('ihlr-evidence-sub-label');
    if (subLabel) subLabel.textContent = 'Visual evidence of sensor cavity solder joint bridge / cold solder causing low voltage at Final Testing.';
    this.showNotificationToast('Sensor improper soldering defect photo attached', 'success');
  }

  handleIHLREvidenceFileSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const thumbImg = document.getElementById('ihlr-evidence-thumb-img');
      if (thumbImg) thumbImg.src = evt.target.result;
      const nameLabel = document.getElementById('ihlr-evidence-name-label');
      if (nameLabel) nameLabel.textContent = file.name;
      const subLabel = document.getElementById('ihlr-evidence-sub-label');
      if (subLabel) subLabel.textContent = `Uploaded file (${(file.size / 1024).toFixed(1)} KB)`;
      this.showNotificationToast(`Uploaded defect photo: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  }

  clearIHLRForm() {
    const seq = window.flowStore.generateNextIHLRSequence();
    if (document.getElementById('ihlr-field-reqno')) document.getElementById('ihlr-field-reqno').value = seq.nextReqNo;
    if (document.getElementById('ihlr-field-problem')) document.getElementById('ihlr-field-problem').value = '';
    if (document.getElementById('ihlr-field-model')) document.getElementById('ihlr-field-model').value = '';
    if (document.getElementById('ihlr-field-detected-at')) document.getElementById('ihlr-field-detected-at').value = '';
    if (document.getElementById('ihlr-field-received-from')) document.getElementById('ihlr-field-received-from').value = '';
    if (document.getElementById('ihlr-field-analysis-by')) document.getElementById('ihlr-field-analysis-by').value = '';
    if (document.getElementById('ihlr-field-w1')) document.getElementById('ihlr-field-w1').value = '';
    if (document.getElementById('ihlr-field-w2')) document.getElementById('ihlr-field-w2').value = '';
    if (document.getElementById('ihlr-field-w3')) document.getElementById('ihlr-field-w3').value = '';
    if (document.getElementById('ihlr-field-w4')) document.getElementById('ihlr-field-w4').value = '';
    if (document.getElementById('ihlr-field-w5')) document.getElementById('ihlr-field-w5').value = '';
    this.showNotificationToast('IHLR form cleared for new entry', 'info');
  }

  setRepeatedType(type) {
    const field = document.getElementById('req-field-repeated-new');
    if (field) field.value = type;

    const btnRepeated = document.getElementById('btn-toggle-repeated');
    const btnNew = document.getElementById('btn-toggle-new');

    if (btnRepeated) {
      btnRepeated.classList.toggle('active', type === 'Repeated');
    }
    if (btnNew) {
      btnNew.classList.toggle('active', type === 'New');
    }
  }

  loadExcelSampleObservation() {
    // Fill the exact inputs from the user's Excel sheet screenshot
    const snoInput = document.getElementById('req-field-sno');
    if (snoInput) snoInput.value = '1';

    const issueInput = document.getElementById('req-field-issueno');
    if (issueInput) issueInput.value = '01';

    const dateInput = document.getElementById('req-field-date');
    if (dateInput) dateInput.value = '2026-09-03';

    const shiftSelect = document.getElementById('req-field-shift');
    if (shiftSelect) shiftSelect.value = 'I';

    const productInput = document.getElementById('req-field-product');
    if (productInput) productInput.value = 'FWM';

    const modelInput = document.getElementById('req-field-model');
    if (modelInput) modelInput.value = 'U340';

    const processInput = document.getElementById('req-field-process');
    if (processInput) processInput.value = 'Laser marking';

    this.setRepeatedType('Repeated');

    const respSelect = document.getElementById('req-field-resp');
    if (respSelect) respSelect.value = 'MAINT';

    const obsTextarea = document.getElementById('req-field-observation');
    if (obsTextarea) {
      obsTextarea.value = '• Inspection gauge clamp NG due to this During inspection Timing angle inspection Accuracy NG...\n• After our inspection clamp restored but not properly tightened.. Used magnest of tightening Support';
    }

    this.loadSampleClampEvidence();
    this.showNotificationToast('Pre-filled exact Process Audit Observation from Excel row #1 (FWM / U340 / Laser marking)', 'info');
  }

  clearAuditForm() {
    const seq = window.flowStore.generateNextAuditSequence();
    if (document.getElementById('req-field-sno')) document.getElementById('req-field-sno').value = seq.nextSNo;
    if (document.getElementById('req-field-issueno')) document.getElementById('req-field-issueno').value = seq.nextIssueNo;
    if (document.getElementById('req-field-product')) document.getElementById('req-field-product').value = '';
    if (document.getElementById('req-field-model')) document.getElementById('req-field-model').value = '';
    if (document.getElementById('req-field-process')) document.getElementById('req-field-process').value = '';
    if (document.getElementById('req-field-observation')) document.getElementById('req-field-observation').value = '';
    this.showNotificationToast('Form cleared for new entry', 'info');
  }

  insertObservationBullet() {
    const obsEl = document.getElementById('req-field-observation');
    if (!obsEl) return;
    const bullet = '• ';
    const val = obsEl.value;
    if (!val || val.endsWith('\n')) {
      obsEl.value = val + bullet;
    } else {
      obsEl.value = val + '\n' + bullet;
    }
    obsEl.focus();
  }

  insertObservationTemplate() {
    const obsEl = document.getElementById('req-field-observation');
    if (!obsEl) return;
    obsEl.value = '• Initial observation: [Describe non-conformance or variance observed at station]\n• Interim floor containment: [Immediate corrective action or clamp adjustment applied]';
    obsEl.focus();
  }

  loadSampleClampEvidence() {
    const thumbImg = document.getElementById('evidence-thumb-img');
    if (thumbImg) thumbImg.src = 'images/evidence_clamp_ng.svg';
    const nameLabel = document.getElementById('evidence-name-label');
    if (nameLabel) nameLabel.textContent = 'Inspection_Gauge_Clamp_NG.svg';
    const subLabel = document.getElementById('evidence-sub-label');
    if (subLabel) subLabel.textContent = 'Inspection gauge clamp NG due to improper tightening. Timing angle inspection accuracy variance.';
    this.showNotificationToast('Clamp NG defect photo attached as visual evidence', 'success');
  }

  handleEvidenceFileSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const thumbImg = document.getElementById('evidence-thumb-img');
      if (thumbImg) thumbImg.src = evt.target.result;
      const nameLabel = document.getElementById('evidence-name-label');
      if (nameLabel) nameLabel.textContent = file.name;
      const subLabel = document.getElementById('evidence-sub-label');
      if (subLabel) subLabel.textContent = `Uploaded file (${(file.size / 1024).toFixed(1)} KB)`;
      this.showNotificationToast(`Uploaded: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  }

  openEvidenceLightbox(imgSrc, title) {
    const modal = document.getElementById('modal-evidence-preview');
    const modalImg = document.getElementById('evidence-modal-image');
    const titleText = document.getElementById('evidence-modal-title-text');
    if (modal) modal.classList.remove('hidden');
    if (modalImg) modalImg.src = imgSrc || 'images/evidence_clamp_ng.svg';
    if (titleText) titleText.textContent = title || 'Evidence: Laser Marking Clamp NG';
  }

  closeEvidenceLightbox(e) {
    if (e && e.target && e.target.closest('.evidence-modal-box') && !e.target.closest('.modal-close-btn') && !e.target.closest('button')) {
      return;
    }
    const modal = document.getElementById('modal-evidence-preview');
    if (modal) modal.classList.add('hidden');
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  renderCreateAttachmentsList() {
    const container = document.getElementById('create-file-list');
    if (!container) return;

    if (this.createFormFiles.length === 0) {
      container.innerHTML = '<div class="text-xs text-muted" style="text-align: center; padding: 8px;">No additional files attached yet.</div>';
      return;
    }

    container.innerHTML = this.createFormFiles.map((file, idx) => `
      <div class="file-card">
        <div class="file-card-left">
          <div class="file-card-icon ${file.type}">${file.type.toUpperCase()}</div>
          <div class="file-card-meta">
            <span class="file-card-name">${file.name}</span>
            <span class="file-card-sub">${file.size} &bull; Uploaded ${file.uploadedAt}</span>
          </div>
        </div>
        <button type="button" class="file-card-remove" onclick="window.flowApp.removeCreateFile(${idx})" title="Remove File">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');
  }

  handleCreateFileUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.name.split('.').pop().toLowerCase();
      let type = 'doc';
      if (['jpg', 'jpeg', 'png', 'svg'].includes(ext)) type = 'image';
      if (['pdf'].includes(ext)) type = 'pdf';

      this.createFormFiles.push({
        id: `att-${Date.now()}-${i}`,
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: type,
        uploadedAt: 'Just now'
      });
    }

    this.renderCreateAttachmentsList();
    this.showNotificationToast(`${files.length} attachment(s) uploaded successfully`, 'success');
  }

  removeCreateFile(idx) {
    this.createFormFiles.splice(idx, 1);
    this.renderCreateAttachmentsList();
  }

  handleCreateRequestSubmit() {
    const ihlrCard = document.getElementById('form-section-prod-details-ihlr');
    const isIHLR = ihlrCard && ihlrCard.style.display !== 'none';

    let newReq;

    if (isIHLR) {
      const reqNoVal = parseInt(document.getElementById('ihlr-field-reqno')?.value, 10) || 1;
      const dateVal = document.getElementById('ihlr-field-date')?.value || new Date().toISOString().split('T')[0];
      const shiftVal = document.getElementById('ihlr-field-shift')?.value || 'i';
      const qtyVal = document.getElementById('ihlr-field-qty')?.value || '1';
      const problemVal = document.getElementById('ihlr-field-problem')?.value || 'Low voltage';
      const modelVal = document.getElementById('ihlr-field-model')?.value || 'OLS LONG ARM';
      const detectedVal = document.getElementById('ihlr-field-detected-at')?.value || 'Final Testing';
      const receivedVal = document.getElementById('ihlr-field-received-from')?.value || 'D3/LINE';
      const analystVal = document.getElementById('ihlr-field-analysis-by')?.value || 'GURU';
      const fourMVal = document.getElementById('ihlr-field-4m')?.value || 'MAN';
      const respVal = document.getElementById('ihlr-field-resp')?.value || 'PROD';
      const w1Val = document.getElementById('ihlr-field-w1')?.value || problemVal;
      const w2Val = document.getElementById('ihlr-field-w2')?.value || '';
      const w3Val = document.getElementById('ihlr-field-w3')?.value || '';
      const w4Val = document.getElementById('ihlr-field-w4')?.value || '';
      const w5Val = document.getElementById('ihlr-field-w5')?.value || '';

      const defectImgSrc = document.getElementById('ihlr-evidence-thumb-img')?.src || 'images/defect_ihlr_sensor.svg';

      newReq = window.flowStore.createRequest({
        id: document.getElementById('req-field-id')?.value,
        module: 'ihlr',
        reqNo: reqNoVal,
        sNo: reqNoVal,
        issueNo: String(reqNoVal).padStart(2, '0'),
        date: dateVal,
        escalationDate: dateVal,
        shift: shiftVal,
        actualQty: qtyVal,
        quantity: qtyVal,
        unit: 'Units',
        problem: problemVal,
        product: modelVal,
        model: modelVal,
        problemDetectedAt: detectedVal,
        receivedFrom: receivedVal,
        analysisDoneBy: analystVal,
        fourM: fourMVal,
        resp: respVal,
        stage: detectedVal,
        line: receivedVal,
        executorId: document.getElementById('req-field-executor')?.value || 'USR-003',
        whyWhyAnalysis: {
          w1: w1Val,
          w2: w2Val,
          w3: w3Val,
          w4: w4Val,
          w5: w5Val
        },
        defectImage: {
          id: `att-defect-ihlr-${Date.now()}`,
          name: 'Defect_Sensor_Improper_Soldering.svg',
          path: defectImgSrc,
          size: '210 KB',
          type: 'image',
          caption: `Defect: ${modelVal} ${problemVal}`
        },
        evidenceAttachment: {
          id: `att-defect-ihlr-${Date.now()}`,
          name: 'Defect_Sensor_Improper_Soldering.svg',
          path: defectImgSrc,
          size: '210 KB',
          type: 'image',
          caption: `Defect: ${modelVal} ${problemVal}`
        },
        observation: `W1: ${w1Val}\nW2: ${w2Val}\nW3: ${w3Val}`,
        comments: `Problem Cause Why-Why Analysis (QA Team): W1: ${w1Val} -> W2: ${w2Val} -> W3: ${w3Val}. 4M: ${fourMVal}, Resp: ${respVal}`,
        attachments: this.createFormFiles
      });

      this.showNotificationToast(`IHLR Rejection Req #${newReq.reqNo} (${newReq.model}) logged successfully! 4M: ${newReq.fourM}, Resp: ${newReq.resp}.`, 'success');
    } else {
      const snoVal = parseInt(document.getElementById('req-field-sno')?.value, 10) || 1;
      const issueNoVal = document.getElementById('req-field-issueno')?.value || '01';
      const dateVal = document.getElementById('req-field-date')?.value || new Date().toISOString().split('T')[0];
      const productVal = document.getElementById('req-field-product')?.value || 'FWM';
      const modelVal = document.getElementById('req-field-model')?.value || 'U340';
      const processVal = document.getElementById('req-field-process')?.value || 'Laser marking';
      const shiftVal = document.getElementById('req-field-shift')?.value || 'I';
      const repeatedVal = document.getElementById('req-field-repeated-new')?.value || 'Repeated';
      const respVal = document.getElementById('req-field-resp')?.value || 'MAINT';
      const priorityVal = document.getElementById('req-field-priority')?.value || 'High';
      const obsVal = document.getElementById('req-field-observation')?.value || '';

      newReq = window.flowStore.createRequest({
        id: document.getElementById('req-field-id')?.value,
        module: 'process_audit',
        sNo: snoVal,
        issueNo: issueNoVal,
        date: dateVal,
        escalationDate: dateVal,
        product: productVal,
        model: modelVal,
        processOperation: processVal,
        shift: shiftVal,
        repeatedOrNew: repeatedVal,
        resp: respVal,
        priority: priorityVal,
        observation: obsVal,
        evidenceAttachment: {
          id: `att-evid-${Date.now()}`,
          name: 'Inspection_Gauge_Clamp_NG.svg',
          path: 'images/evidence_clamp_ng.svg',
          size: '240 KB',
          type: 'image',
          caption: `Evidence - Issue ${issueNoVal} (${productVal} ${modelVal} - ${processVal})`
        },
        stage: processVal,
        line: `${processVal} Station`,
        executorId: document.getElementById('req-field-executor')?.value || 'USR-002',
        attachments: [
          {
            id: 'att-evidence-clamp',
            name: 'Inspection_Gauge_Clamp_NG.svg',
            size: '240 KB',
            type: 'image',
            uploadedAt: 'Today'
          },
          ...this.createFormFiles
        ],
        comments: obsVal
      });

      this.showNotificationToast(`Process Audit Observation Issue ${newReq.issueNo} (${newReq.product}) logged successfully! Escalated to Resp: ${newReq.resp}.`, 'success');
    }

    // Reset attachments
    this.createFormFiles = [
      { id: 'mock-att-default', name: 'Assembly_Spec_Sheet_Rev4.pdf', size: '1.8 MB', type: 'pdf', uploadedAt: 'Today' }
    ];

    // Open Request Details
    this.navigateTo('request-details', { requestId: newReq.id });
  }

  // ========================================================================
  // VIEW 3: REQUEST DETAILS PAGE (Process Audit Observation & IHLR Dossier)
  // ========================================================================
  renderRequestDetailsPage() {
    const req = window.flowStore.getRequestById(this.activeRequestId) || window.flowStore.getRequests()[0];
    if (!req) return;

    this.activeRequestId = req.id;
    const isIHLR = req.module === 'ihlr' || !!req.problem;

    const badgeEl = document.getElementById('det-status-badge');
    if (badgeEl) badgeEl.outerHTML = `<span id="det-status-badge">${this.renderStatusBadge(req.status)}</span>`;

    if (isIHLR) {
      // Header info for IHLR
      const reqNum = req.reqNo || req.issueNo || '1';
      document.getElementById('det-request-id').textContent = `IHLR Rejection: Req ${reqNum} • ${req.model || 'OLS LONG ARM'} (${req.problem || 'Low voltage'})`;

      const detSnoIssue = document.getElementById('det-sno-issue');
      if (detSnoIssue) detSnoIssue.textContent = `Req NO: ${reqNum} • Qty: ${req.actualQty || req.quantity || '1'}`;

      const detDate = document.getElementById('det-date');
      if (detDate) detDate.textContent = req.date || req.escalationDate || req.displayDate;

      const detCreatedDateMeta = document.getElementById('det-created-date-meta');
      if (detCreatedDateMeta) detCreatedDateMeta.textContent = `Rejection Date: ${req.date || req.escalationDate || req.displayDate}`;

      const detProduct = document.getElementById('det-product');
      if (detProduct) detProduct.textContent = req.problem || 'Low voltage';

      const detModel = document.getElementById('det-model');
      if (detModel) detModel.textContent = req.model || 'OLS LONG ARM';

      const detProcess = document.getElementById('det-process');
      if (detProcess) detProcess.textContent = req.problemDetectedAt || req.stage || 'Final Testing';

      const detShift = document.getElementById('det-shift');
      if (detShift) detShift.textContent = req.shift || 'i';

      const fourMVal = req.fourM || 'MAN';
      const detRepeated = document.getElementById('det-repeated-new');
      if (detRepeated) detRepeated.innerHTML = `<span class="badge-4m badge-4m-${fourMVal.toLowerCase()}">${fourMVal}</span>`;

      const detRepeatedTop = document.getElementById('det-repeated-badge-top');
      if (detRepeatedTop) detRepeatedTop.innerHTML = `<span class="badge-4m badge-4m-${fourMVal.toLowerCase()}">${fourMVal}</span>`;

      const respCode = req.resp || 'PROD';
      const detResp = document.getElementById('det-resp');
      if (detResp) detResp.innerHTML = `<span class="badge-resp badge-resp-${respCode.toLowerCase()}">${respCode}</span>`;

      const detPriority = document.getElementById('det-priority');
      if (detPriority) detPriority.innerHTML = `<span class="badge badge-priority-critical">Line Rejection</span>`;

      const detCreator = document.getElementById('det-creator');
      if (detCreator) detCreator.textContent = `${req.analysisDoneBy || 'GURU'} (Analysis By)`;

      const detExecutor = document.getElementById('det-executor');
      if (detExecutor) detExecutor.textContent = `Received From: ${req.receivedFrom || 'D3/LINE'}`;

      const detTrackingId = document.getElementById('det-tracking-id');
      if (detTrackingId) detTrackingId.textContent = req.id;

      // Problem Cause Why-Why Analysis display
      const detComments = document.getElementById('det-comments');
      if (detComments) {
        const why = req.whyWhyAnalysis;
        if (why && (why.w1 || why.w2 || why.w3)) {
          detComments.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${why.w1 ? `<div style="display: flex; align-items: center; gap: 8px;"><span class="w-pill" style="min-width: 36px; height: 26px; font-size: 11px;">W1:</span> <span style="color: #1d4ed8; font-weight: 600;">${this.escapeHtml(why.w1)}</span></div>` : ''}
              ${why.w2 ? `<div style="display: flex; align-items: center; gap: 8px;"><span class="w-pill" style="min-width: 36px; height: 26px; font-size: 11px;">W2:</span> <span style="color: #1d4ed8; font-weight: 600;">${this.escapeHtml(why.w2)}</span></div>` : ''}
              ${why.w3 ? `<div style="display: flex; align-items: center; gap: 8px;"><span class="w-pill" style="min-width: 36px; height: 26px; font-size: 11px;">W3:</span> <span style="color: #1d4ed8; font-weight: 600;">${this.escapeHtml(why.w3)}</span></div>` : ''}
              ${why.w4 ? `<div style="display: flex; align-items: center; gap: 8px;"><span class="w-pill" style="min-width: 36px; height: 26px; font-size: 11px;">W4:</span> <span style="color: #1d4ed8; font-weight: 600;">${this.escapeHtml(why.w4)}</span></div>` : ''}
              ${why.w5 ? `<div style="display: flex; align-items: center; gap: 8px;"><span class="w-pill w-root" style="min-width: 36px; height: 26px; font-size: 11px;">W5:</span> <span style="color: #1d4ed8; font-weight: 600;">${this.escapeHtml(why.w5)}</span></div>` : ''}
            </div>
          `;
        } else {
          detComments.textContent = req.comments || req.observation || 'No Why-Why analysis logged';
        }
      }

      // Defect Image Preview
      const detEvidenceBox = document.getElementById('det-evidence-box');
      const defectImg = req.defectImage?.path || req.evidenceAttachment?.path || 'images/defect_ihlr_sensor.svg';
      const defectCaption = req.defectImage?.caption || `Defect: ${req.model || 'OLS LONG ARM'} ${req.problem || 'Low voltage'}`;
      if (detEvidenceBox) {
        detEvidenceBox.innerHTML = `
          <span class="meta-label" style="font-weight: 700; color: var(--navy-900);">Defect Image</span>
          <div class="evidence-upload-card" style="margin-top: 4px; background: #f8fafc; cursor: pointer;"
            onclick="window.flowApp.openEvidenceLightbox('${defectImg}', '${defectCaption}')">
            <div class="evidence-preview-thumb">
              <img src="${defectImg}" alt="Defect Image">
              <span class="table-evidence-badge">RED MARKUP</span>
            </div>
            <div style="flex: 1;">
              <strong style="font-size: 13px; color: var(--navy-900); display: block;">Defect_Sensor_Improper_Soldering.svg</strong>
              <span class="text-xs text-muted">Click to enlarge sensor defect photo with red solder markup</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm">
              Zoom Preview
            </button>
          </div>
        `;
      }

    } else {
      // Header info for Process Audit Observation
      const issueNum = req.issueNo || '01';
      const sNum = req.sNo || 1;
      document.getElementById('det-request-id').textContent = `Observation: Issue ${issueNum} (${req.product || 'FWM'} - ${req.model || 'U340'})`;

      const detSnoIssue = document.getElementById('det-sno-issue');
      if (detSnoIssue) detSnoIssue.textContent = `S.No: ${sNum} • Issue: ${issueNum}`;

      const detDate = document.getElementById('det-date');
      if (detDate) detDate.textContent = req.escalationDate || req.displayDate || req.date;

      const detCreatedDateMeta = document.getElementById('det-created-date-meta');
      if (detCreatedDateMeta) detCreatedDateMeta.textContent = `Escalation Date: ${req.escalationDate || req.displayDate}`;

      const detProduct = document.getElementById('det-product');
      if (detProduct) detProduct.textContent = req.product || 'FWM';

      const detModel = document.getElementById('det-model');
      if (detModel) detModel.textContent = req.model || 'U340';

      const detProcess = document.getElementById('det-process');
      if (detProcess) detProcess.textContent = req.processOperation || req.stage || 'Laser marking';

      const detShift = document.getElementById('det-shift');
      if (detShift) detShift.textContent = req.shift || 'I';

      const repeatedVal = req.repeatedOrNew || 'Repeated';
      let repeatedHtml;
      if (repeatedVal === 'Repeated') {
        repeatedHtml = `<span class="badge-repeated">Repeated</span>`;
      } else if (repeatedVal === 'New') {
        repeatedHtml = `<span class="badge-new-issue">New</span>`;
      } else if (repeatedVal === 'Critical') {
        repeatedHtml = `<span class="badge badge-priority-critical">Critical</span>`;
      } else if (repeatedVal === 'High') {
        repeatedHtml = `<span class="badge badge-priority-high">High</span>`;
      } else {
        repeatedHtml = `<span class="badge badge-priority-normal">${repeatedVal}</span>`;
      }

      const detRepeated = document.getElementById('det-repeated-new');
      if (detRepeated) detRepeated.innerHTML = repeatedHtml;

      const detRepeatedTop = document.getElementById('det-repeated-badge-top');
      if (detRepeatedTop) detRepeatedTop.innerHTML = repeatedHtml;

      const respCode = req.resp || 'MAINT';
      const detResp = document.getElementById('det-resp');
      if (detResp) detResp.innerHTML = `<span class="badge-resp badge-resp-${respCode.toLowerCase()}">${respCode}</span>`;

      const detPriority = document.getElementById('det-priority');
      if (detPriority) detPriority.innerHTML = `<span class="badge badge-priority-${(req.priority || 'high').toLowerCase()}">${req.priority || 'High'}</span>`;

      const detCreator = document.getElementById('det-creator');
      if (detCreator) detCreator.textContent = `${req.creatorName} (Auditor)`;

      const detExecutor = document.getElementById('det-executor');
      if (detExecutor) detExecutor.textContent = `${req.executorName} (${respCode} Lead)`;

      const detTrackingId = document.getElementById('det-tracking-id');
      if (detTrackingId) detTrackingId.textContent = req.id;

      // Issue / Observation bullet formatting
      const detComments = document.getElementById('det-comments');
      if (detComments) {
        const rawObs = (req.observation || req.comments || '').trim();
        if (rawObs) {
          const lines = rawObs.split('\n').filter(l => l.trim().length > 0);
          detComments.innerHTML = lines.map(line => {
            line = line.trim();
            if (line.startsWith('•') || line.startsWith('-')) {
              return `<div><span style="color: #dc2626; font-weight: bold; margin-right: 4px;">•</span>${this.escapeHtml(line.replace(/^[•\-]\s*/, ''))}</div>`;
            }
            return `<div>${this.escapeHtml(line)}</div>`;
          }).join('');
        } else {
          detComments.textContent = 'None';
        }
      }

      const detEvidenceBox = document.getElementById('det-evidence-box');
      const evidImg = req.evidenceAttachment?.path || 'images/evidence_clamp_ng.svg';
      const evidCap = req.evidenceAttachment?.caption || 'Evidence: Laser Marking Clamp NG';
      if (detEvidenceBox) {
        detEvidenceBox.innerHTML = `
          <span class="meta-label" style="font-weight: 700; color: var(--navy-900);">Evidence / Escalation Attachment</span>
          <div class="evidence-upload-card" style="margin-top: 4px; background: #f8fafc; cursor: pointer;"
            onclick="window.flowApp.openEvidenceLightbox('${evidImg}', '${evidCap}')">
            <div class="evidence-preview-thumb">
              <img src="${evidImg}" alt="Clamp NG defect evidence">
              <span class="table-evidence-badge">RED MARKUP</span>
            </div>
            <div style="flex: 1;">
              <strong style="font-size: 13px; color: var(--navy-900); display: block;">${req.evidenceAttachment?.name || 'Inspection_Gauge_Clamp_NG.svg'}</strong>
              <span class="text-xs text-muted">Click to open high-resolution defect markup preview</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm">
              View Evidence
            </button>
          </div>
        `;
      }
    }

    // Contextual button in header
    const ctxBtn = document.getElementById('det-context-action-btn');
    if (req.status === 'Pending Execution') {
      ctxBtn.innerHTML = `<button class="btn btn-primary btn-sm" onclick="window.flowApp.openExecute('${req.id}')">⚡ Execute Request</button>`;
    } else if (req.status === 'Pending Approval' || req.status === 'Partially Approved') {
      ctxBtn.innerHTML = `<button class="btn btn-primary btn-sm" onclick="window.flowApp.openReview('${req.id}')">🛡️ Review for Approval</button>`;
    } else {
      ctxBtn.innerHTML = '';
    }

    // Workflow Stepper
    this.renderWorkflowStepper(req, 'det-workflow-stepper');

    // Attachments
    const attList = document.getElementById('det-attachments-list');
    const attCount = document.getElementById('det-att-count');
    attCount.textContent = `${req.attachments.length} Files`;

    attList.innerHTML = req.attachments.map(att => `
      <div class="file-card">
        <div class="file-card-left">
          <div class="file-card-icon ${att.type}">${att.type.toUpperCase()}</div>
          <div class="file-card-meta">
            <span class="file-card-name">${att.name}</span>
            <span class="file-card-sub">${att.size} &bull; ${att.uploadedAt}</span>
          </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.flowApp.previewFile('${att.name}', '${att.type}')">
          Preview
        </button>
      </div>
    `).join('');

    // Execution details
    const execCard = document.getElementById('det-execution-card');
    if (req.executionDetails) {
      execCard.classList.remove('hidden');
      document.getElementById('det-exec-date').textContent = req.executionDetails.displayExecutionDate || req.executionDetails.executionDate;
      document.getElementById('det-exec-times').textContent = `${req.executionDetails.startTime} - ${req.executionDetails.endTime}`;
      document.getElementById('det-exec-actual').textContent = req.executionDetails.actualProduction;
      document.getElementById('det-exec-status-text').textContent = req.executionDetails.executionStatus;
      document.getElementById('det-exec-remarks').textContent = req.executionDetails.remarks;

      const proofsList = document.getElementById('det-proof-files-list');
      if (req.executionDetails.proofFiles && req.executionDetails.proofFiles.length > 0) {
        proofsList.innerHTML = req.executionDetails.proofFiles.map(prf => `
          <div class="file-card">
            <div class="file-card-left">
              <div class="file-card-icon ${prf.type}">${prf.type.toUpperCase()}</div>
              <div class="file-card-meta">
                <span class="file-card-name">${prf.name}</span>
                <span class="file-card-sub">${prf.size} &bull; ${prf.uploadedAt}</span>
              </div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.flowApp.previewFile('${prf.name}', '${prf.type}')">
              Inspect Proof
            </button>
          </div>
        `).join('');
      } else {
        proofsList.innerHTML = '<div class="text-xs text-muted">No proof files attached.</div>';
      }
    } else {
      execCard.classList.add('hidden');
    }

    // Two-Level Approvals State
    this.renderApproverCards(req, 'card-appr1-status', 'badge-appr1-state', 'time-appr1-state', 'box-appr1-comment',
      'card-appr2-status', 'badge-appr2-state', 'time-appr2-state', 'box-appr2-comment');

    // Activity Timeline
    const timelineContainer = document.getElementById('det-activity-timeline');
    timelineContainer.innerHTML = req.activityTimeline.map(item => {
      let dotColor = '';
      if (item.type.includes('approve')) dotColor = 'green';
      if (item.type.includes('reject')) dotColor = 'red';
      if (item.type.includes('approval_req')) dotColor = 'purple';

      return `
        <div class="timeline-item">
          <div class="timeline-dot ${dotColor}">●</div>
          <div class="timeline-header">
            <span class="timeline-time">${item.timestamp}</span>
            <span class="timeline-actor">&bull; ${item.actor}</span>
          </div>
          <div class="timeline-title">${item.title}</div>
          <div class="timeline-desc">${item.desc}</div>
        </div>
      `;
    }).join('');
  }

  // ========================================================================
  // VIEW 4: EXECUTOR DASHBOARD
  // ========================================================================
  renderExecutorDashboard() {
    const metrics = window.flowStore.getMetrics();
    document.getElementById('kpi-exec-assigned').textContent = metrics.assignedToMe;
    document.getElementById('kpi-exec-pending').textContent = metrics.myPendingExecution;
    document.getElementById('kpi-exec-completed').textContent = metrics.completedToday;
    document.getElementById('kpi-exec-waiting-appr').textContent = metrics.waitingForApproval;

    const tbody = document.getElementById('table-executor-requests');
    if (!tbody) return;

    const user = window.flowStore.getCurrentUser();
    const requests = window.flowStore.getRequests().filter(r => r.executorId === user.id || user.role === 'admin' || user.role === 'creator');

    tbody.innerHTML = requests.map(r => `
      <tr>
        <td><span class="table-id-link" onclick="window.flowApp.openDetails('${r.id}')">${r.id}</span></td>
        <td>${r.creatorName}</td>
        <td>${r.displayDate}</td>
        <td>${r.shift}</td>
        <td>${r.quantity} ${r.unit}</td>
        <td><span class="font-medium">${r.stage}</span></td>
        <td>${this.renderStatusBadge(r.status)}</td>
        <td>
          ${r.status === 'Pending Execution'
        ? `<button class="btn btn-primary btn-sm" onclick="window.flowApp.openExecute('${r.id}')">⚡ View & Execute</button>`
        : `<button class="btn btn-secondary btn-sm" onclick="window.flowApp.openDetails('${r.id}')">View Details</button>`
      }
        </td>
      </tr>
    `).join('');
  }

  // ========================================================================
  // VIEW 5: EXECUTE REQUEST PAGE
  // ========================================================================
  renderExecuteRequestPage() {
    const req = window.flowStore.getRequestById(this.activeRequestId) || window.flowStore.getRequests()[0];
    if (!req) return;

    this.activeRequestId = req.id;

    document.getElementById('exec-page-title').textContent = `Execute Production Request – ${req.id}`;
    document.getElementById('exec-header-req-id').textContent = req.id;
    document.getElementById('exec-status-badge').textContent = req.status;

    // Read-only specifications
    document.getElementById('exec-ro-creator').textContent = `${req.creatorName} (${req.displayDate})`;
    document.getElementById('exec-ro-date-shift').textContent = `${req.displayDate} (${req.shift} Shift)`;
    document.getElementById('exec-ro-target').textContent = `${req.quantity} ${req.unit} (${req.priority} Priority)`;
    document.getElementById('exec-ro-stage-line').textContent = `${req.stage} &bull; ${req.line}`;
    document.getElementById('exec-ro-comments').textContent = req.comments || 'No special notes specified.';

    const attList = document.getElementById('exec-ro-attachments-list');
    attList.innerHTML = req.attachments.map(att => `
      <div class="file-card" style="padding: 6px 10px;">
        <div class="file-card-left">
          <div class="file-card-icon ${att.type}" style="width: 28px; height: 28px; font-size: 10px;">${att.type.toUpperCase()}</div>
          <span class="file-card-name" style="font-size: 12px;">${att.name} (${att.size})</span>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 11px;" onclick="window.flowApp.previewFile('${att.name}', '${att.type}')">Preview</button>
      </div>
    `).join('');

    // Pre-fill actual output if empty
    document.getElementById('exec-field-actual').value = `${req.quantity} ${req.unit} (100% Target Met)`;

    this.renderExecProofList();
  }

  renderExecProofList() {
    const container = document.getElementById('exec-proof-files-list');
    if (!container) return;

    if (this.execProofFiles.length === 0) {
      container.innerHTML = '<div class="text-xs text-muted" style="text-align: center; padding: 8px;">No execution proof files uploaded yet.</div>';
      return;
    }

    container.innerHTML = this.execProofFiles.map((file, idx) => `
      <div class="file-card">
        <div class="file-card-left">
          <div class="file-card-icon ${file.type}">${file.type.toUpperCase()}</div>
          <div class="file-card-meta">
            <span class="file-card-name">${file.name}</span>
            <span class="file-card-sub">${file.size} &bull; Uploaded ${file.uploadedAt}</span>
          </div>
        </div>
        <button type="button" class="file-card-remove" onclick="window.flowApp.removeExecProofFile(${idx})" title="Remove File">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');
  }

  handleExecProofUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.name.split('.').pop().toLowerCase();
      let type = 'doc';
      if (['jpg', 'jpeg', 'png', 'svg'].includes(ext)) type = 'image';
      if (['pdf'].includes(ext)) type = 'pdf';

      this.execProofFiles.push({
        id: `prf-${Date.now()}-${i}`,
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: type,
        uploadedAt: 'Just now'
      });
    }

    this.renderExecProofList();
    this.showNotificationToast(`${files.length} proof document(s) uploaded`, 'success');
  }

  removeExecProofFile(idx) {
    this.execProofFiles.splice(idx, 1);
    this.renderExecProofList();
  }

  handleExecuteSubmit() {
    const executionData = {
      executionDate: document.getElementById('exec-field-date').value,
      startTime: document.getElementById('exec-field-start').value,
      endTime: document.getElementById('exec-field-end').value,
      executionStatus: document.getElementById('exec-field-status').value,
      actualProduction: document.getElementById('exec-field-actual').value,
      remarks: document.getElementById('exec-field-remarks').value,
      proofFiles: [...this.execProofFiles]
    };

    const updated = window.flowStore.submitExecution(this.activeRequestId, executionData);
    if (updated) {
      this.showNotificationToast(`Execution submitted for ${updated.id}! Status is now 'Pending Approval'. Approver 1 (Mr. Raj) notified via email.`, 'success');
      // Navigate to review or details
      this.navigateTo('request-details', { requestId: updated.id });
    }
  }

  // ========================================================================
  // VIEW 6: APPROVER DASHBOARD
  // ========================================================================
  renderApproverDashboard() {
    const user = window.flowStore.getCurrentUser();
    const metrics = window.flowStore.getMetrics();
    const requests = window.flowStore.getRequests();

    const roleIndicator = document.getElementById('appr-role-badge-indicator');
    if (roleIndicator) {
      if (user.role === 'approver2') {
        roleIndicator.innerHTML = '<span class="badge-dot"></span> Approver 2 (Mr. Anand - Plant Head)';
      } else {
        roleIndicator.innerHTML = '<span class="badge-dot"></span> Approver 1 (Mr. Raj - Production Manager)';
      }
    }

    // Calculate pending for this specific approver
    let pendingCount = 0;
    if (user.role === 'approver1') {
      pendingCount = requests.filter(r => r.approvals.approver1.status === 'pending').length;
    } else if (user.role === 'approver2') {
      pendingCount = requests.filter(r => r.approvals.approver2.status === 'pending').length;
    } else {
      pendingCount = metrics.pendingApproval;
    }

    document.getElementById('kpi-appr-pending').textContent = pendingCount;
    document.getElementById('kpi-appr-approved-today').textContent = metrics.approved;
    document.getElementById('kpi-appr-rejected').textContent = metrics.rejected;
    document.getElementById('kpi-appr-reviewed').textContent = metrics.totalReviewed;

    const tbody = document.getElementById('table-approver-requests');
    if (!tbody) return;

    // Filter requests needing review or recent
    tbody.innerHTML = requests.map(r => {
      const isPendingForMe = (user.role === 'approver1' && r.approvals.approver1.status === 'pending') ||
        (user.role === 'approver2' && r.approvals.approver2.status === 'pending') ||
        (user.role === 'admin' && (r.status === 'Pending Approval' || r.status === 'Partially Approved'));

      return `
        <tr style="${isPendingForMe ? 'background-color: #f8fafc;' : ''}">
          <td><span class="table-id-link" onclick="window.flowApp.openReview('${r.id}')">${r.id}</span></td>
          <td>${r.creatorName}</td>
          <td><span class="font-medium">${r.executorName}</span></td>
          <td>${r.executionDetails ? r.executionDetails.actualProduction : `${r.quantity} ${r.unit}`}</td>
          <td><span class="font-medium">${r.stage}</span></td>
          <td>${r.executionDetails ? r.executionDetails.displayExecutionDate : '-'}</td>
          <td>${this.renderStatusBadge(r.status)}</td>
          <td>
            <button class="btn ${isPendingForMe ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="window.flowApp.openReview('${r.id}')">
              ${isPendingForMe ? '🛡️ Review' : 'View'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ========================================================================
  // VIEW 7: APPROVAL REVIEW PAGE
  // ========================================================================
  renderApprovalReviewPage() {
    const req = window.flowStore.getRequestById(this.activeRequestId) || window.flowStore.getRequests()[1];
    if (!req) return;

    this.activeRequestId = req.id;

    document.getElementById('rev-page-title').textContent = `Review Request – ${req.id}`;
    const badgeEl = document.getElementById('rev-status-badge');
    badgeEl.outerHTML = `<span id="rev-status-badge">${this.renderStatusBadge(req.status)}</span>`;

    // Stepper
    this.renderWorkflowStepper(req, 'rev-workflow-stepper');

    // 1. Original Request
    document.getElementById('rev-orig-date-shift').textContent = `${req.displayDate} (${req.shift} Shift)`;
    document.getElementById('rev-orig-stage-line').textContent = `${req.stage} &bull; ${req.line}`;
    document.getElementById('rev-orig-target').textContent = `${req.quantity} ${req.unit} (${req.priority} Priority)`;
    document.getElementById('rev-orig-creator').textContent = `${req.creatorName} (Planning)`;
    document.getElementById('rev-orig-comments').textContent = req.comments || 'Standard operating instructions.';

    const origAtts = document.getElementById('rev-orig-attachments');
    origAtts.innerHTML = req.attachments.map(att => `
      <div class="file-card" style="padding: 6px 10px;">
        <div class="file-card-left">
          <div class="file-card-icon ${att.type}" style="width: 28px; height: 28px; font-size: 10px;">${att.type.toUpperCase()}</div>
          <span class="file-card-name" style="font-size: 12px;">${att.name}</span>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 11px;" onclick="window.flowApp.previewFile('${att.name}', '${att.type}')">Preview</button>
      </div>
    `).join('');

    // 2. Execution Findings
    if (req.executionDetails) {
      document.getElementById('rev-exec-name').textContent = req.executorName;
      document.getElementById('rev-exec-date').textContent = req.executionDetails.displayExecutionDate || req.executionDetails.executionDate;
      document.getElementById('rev-exec-times').textContent = `${req.executionDetails.startTime} - ${req.executionDetails.endTime}`;
      document.getElementById('rev-exec-yield').textContent = req.executionDetails.actualProduction;
      document.getElementById('rev-exec-remarks').textContent = req.executionDetails.remarks;

      const proofsList = document.getElementById('rev-exec-proofs');
      if (req.executionDetails.proofFiles && req.executionDetails.proofFiles.length > 0) {
        proofsList.innerHTML = req.executionDetails.proofFiles.map(prf => `
          <div class="file-card">
            <div class="file-card-left">
              <div class="file-card-icon ${prf.type}">${prf.type.toUpperCase()}</div>
              <div class="file-card-meta">
                <span class="file-card-name">${prf.name}</span>
                <span class="file-card-sub">${prf.size} &bull; Uploaded by ${req.executorName}</span>
              </div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.flowApp.previewFile('${prf.name}', '${prf.type}')">
              Inspect Proof
            </button>
          </div>
        `).join('');
      } else {
        proofsList.innerHTML = '<div class="text-xs text-muted">No proof documents attached.</div>';
      }
    } else {
      document.getElementById('rev-exec-name').textContent = req.executorName;
      document.getElementById('rev-exec-date').textContent = 'Not yet executed';
      document.getElementById('rev-exec-times').textContent = '-';
      document.getElementById('rev-exec-yield').textContent = 'Awaiting line run';
      document.getElementById('rev-exec-remarks').textContent = 'Batch execution has not commenced.';
      document.getElementById('rev-exec-proofs').innerHTML = '<div class="text-xs text-muted">Awaiting floor execution</div>';
    }

    // Two-Level Approval Cards
    this.renderApproverCards(req, 'rev-card-appr1', 'rev-badge-appr1', 'rev-time-appr1', 'rev-comment-appr1',
      'rev-card-appr2', 'rev-badge-appr2', 'rev-time-appr2', 'rev-comment-appr2');

    // Decision Required action box
    const user = window.flowStore.getCurrentUser();
    const banner = document.getElementById('rev-decision-banner');
    const desc = document.getElementById('rev-decision-desc');

    if (req.status === 'Approved') {
      banner.style.display = 'none';
    } else if (req.status === 'Rejected') {
      banner.style.display = 'none';
    } else {
      banner.style.display = 'flex';
      if (user.role === 'approver1') {
        desc.textContent = 'Acting as Approver 1 (Mr. Raj - Production Manager). Approving will transition request to Partially Approved & escalate to Approver 2.';
      } else if (user.role === 'approver2') {
        desc.textContent = 'Acting as Approver 2 (Mr. Anand - Plant Head). Approving will authorize final batch completion and release to warehouse inventory.';
      } else {
        desc.textContent = 'Select an action to test multi-tier approval authorization.';
      }
    }
  }

  // Helper to render Approver 1 & Approver 2 Cards
  renderApproverCards(req, card1Id, badge1Id, time1Id, comment1Id, card2Id, badge2Id, time2Id, comment2Id) {
    const a1 = req.approvals.approver1;
    const a2 = req.approvals.approver2;

    const c1 = document.getElementById(card1Id);
    const b1 = document.getElementById(badge1Id);
    const t1 = document.getElementById(time1Id);
    const com1 = document.getElementById(comment1Id);

    const c2 = document.getElementById(card2Id);
    const b2 = document.getElementById(badge2Id);
    const t2 = document.getElementById(time2Id);
    const com2 = document.getElementById(comment2Id);

    if (c1) {
      c1.className = `approver-card ${a1.status}`;
      b1.className = `badge badge-${a1.status === 'approved' ? 'approved' : a1.status === 'rejected' ? 'rejected' : a1.status === 'pending' ? 'pending-approval' : 'draft'}`;
      b1.textContent = a1.status.toUpperCase();
      t1.textContent = a1.timestamp ? `Signed off: ${a1.timestamp}` : a1.status === 'pending' ? 'Awaiting Level 1 Sign-off' : 'Pending floor execution';
      if (a1.comments && com1) {
        com1.style.display = 'block';
        com1.textContent = `"${a1.comments}"`;
      } else if (com1) {
        com1.style.display = 'none';
      }
    }

    if (c2) {
      c2.className = `approver-card ${a2.status}`;
      b2.className = `badge badge-${a2.status === 'approved' ? 'approved' : a2.status === 'rejected' ? 'rejected' : a2.status === 'pending' ? 'pending-approval' : 'draft'}`;
      b2.textContent = a2.status.toUpperCase();
      t2.textContent = a2.timestamp ? `Signed off: ${a2.timestamp}` : a2.status === 'pending' ? 'Awaiting Level 2 Executive Sign-off' : 'Waiting for Level 1 completion';
      if (a2.comments && com2) {
        com2.style.display = 'block';
        com2.textContent = `"${a2.comments}"`;
      } else if (com2) {
        com2.style.display = 'none';
      }
    }
  }

  // ========================================================================
  // APPROVAL ACTIONS & MODALS
  // ========================================================================
  openApproveModal() {
    const user = window.flowStore.getCurrentUser();
    const req = window.flowStore.getRequestById(this.activeRequestId);
    if (!req) return;

    document.getElementById('modal-approve-req-id').textContent = req.id;
    const hint = document.getElementById('modal-approve-tier-hint');

    if (user.role === 'approver1') {
      hint.innerHTML = '<strong>Approver 1 (Mr. Raj)</strong> sign-off will advance request to <em>Partially Approved</em> and automatically route to <strong>Approver 2 (Mr. Anand)</strong>.';
    } else if (user.role === 'approver2') {
      hint.innerHTML = '<strong>Approver 2 (Mr. Anand - Plant Head)</strong> final authorization will complete the workflow and release goods to inventory.';
    } else {
      hint.innerHTML = 'Demo Mode: Simulating Level 1 / Level 2 authorization.';
    }

    document.getElementById('modal-approve').classList.add('active');
  }

  executeApproval() {
    const user = window.flowStore.getCurrentUser();
    const comments = document.getElementById('modal-approve-comments').value;
    const approverRole = user.role === 'approver2' ? 'approver2' : 'approver1';

    const updated = window.flowStore.approveRequest(this.activeRequestId, approverRole, comments);
    this.closeModals();

    if (updated) {
      if (updated.status === 'Partially Approved') {
        this.showNotificationToast(`Request ${updated.id} approved by Mr. Raj! Now waiting for Level 2 sign-off from Plant Head (Mr. Anand).`, 'success');
      } else {
        this.showNotificationToast(`Request ${updated.id} fully approved! Workflow completed and batch released.`, 'success');
      }
      this.renderCurrentView();
    }
  }

  openRejectModal() {
    const req = window.flowStore.getRequestById(this.activeRequestId);
    if (!req) return;

    document.getElementById('modal-reject-req-id').textContent = req.id;
    document.getElementById('modal-reject-reason').value = '';
    document.getElementById('modal-reject').classList.add('active');
  }

  executeRejection() {
    const reason = document.getElementById('modal-reject-reason').value.trim();
    if (!reason) {
      alert('Please provide a mandatory reason for rejection.');
      return;
    }

    const user = window.flowStore.getCurrentUser();
    const approverRole = user.role === 'approver2' ? 'approver2' : 'approver1';

    const updated = window.flowStore.rejectRequest(this.activeRequestId, approverRole, reason);
    this.closeModals();

    if (updated) {
      this.showNotificationToast(`Request ${updated.id} has been REJECTED. Rejection reason logged in audit trail.`, 'danger');
      this.renderCurrentView();
    }
  }

  closeModals() {
    const modals = document.querySelectorAll('.modal-backdrop');
    modals.forEach(m => m.classList.remove('active'));
  }

  // ========================================================================
  // VIEW 8: ADMIN DASHBOARD (Charts, Users, Workflow Config)
  // ========================================================================
  renderAdminDashboard() {
    const metrics = window.flowStore.getMetrics();
    const requests = window.flowStore.getRequests();
    const users = window.flowStore.getUsers();

    document.getElementById('kpi-admin-users').textContent = users.length;
    document.getElementById('kpi-admin-active').textContent = metrics.pendingExecution + metrics.inExecution + metrics.pendingApproval;
    document.getElementById('kpi-admin-pending-exec').textContent = metrics.pendingExecution;
    document.getElementById('kpi-admin-pending-appr').textContent = metrics.pendingApproval;
    document.getElementById('kpi-admin-approved').textContent = metrics.approved;
    document.getElementById('kpi-admin-rejected').textContent = metrics.rejected;

    // Chart 1: Requests by Status
    const statusData = [
      { label: 'Pending Exec', count: metrics.pendingExecution, color: '#f59e0b' },
      { label: 'Pending Appr', count: metrics.pendingApproval, color: '#9333ea' },
      { label: 'Approved', count: metrics.approved, color: '#10b981' },
      { label: 'Rejected', count: metrics.rejected, color: '#f43f5e' }
    ];
    this.renderBarChart('chart-status-bars', statusData, requests.length);

    // Chart 2: Requests by Stage
    const stages = ['Assembly', 'Inspection', 'Packaging', 'Raw Material', 'Production'];
    const stageData = stages.map(stg => ({
      label: stg,
      count: requests.filter(r => r.stage === stg).length,
      color: '#3b82f6'
    }));
    this.renderBarChart('chart-stage-bars', stageData, requests.length);

    // Chart 3: Production by Shift
    const shifts = ['Morning', 'Afternoon', 'Night'];
    const shiftData = shifts.map(shf => ({
      label: shf,
      count: requests.filter(r => r.shift === shf).length,
      color: '#06b6d4'
    }));
    this.renderBarChart('chart-shift-bars', shiftData, requests.length);

    // User Management Table
    const userTbody = document.getElementById('table-admin-users');
    if (userTbody) {
      userTbody.innerHTML = users.map(u => `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="user-avatar-small" style="width: 26px; height: 26px; font-size: 11px;">${u.avatar}</div>
              <span class="font-semibold">${u.name}</span>
            </div>
          </td>
          <td><span class="badge badge-draft">${u.roleLabel}</span></td>
          <td>${u.department}</td>
          <td class="text-sm text-muted">${u.email}</td>
          <td><span class="badge badge-approved"><span class="badge-dot"></span> ${u.status}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.flowApp.loginAs('${u.role}')">
              Login As
            </button>
          </td>
        </tr>
      `).join('');
    }

    // Workflow Config Table
    const wfTbody = document.getElementById('table-admin-workflow-config');
    if (wfTbody) {
      wfTbody.innerHTML = WORKFLOW_CONFIG.map(wf => `
        <tr>
          <td><strong style="color: var(--primary);">Stage ${wf.step}</strong></td>
          <td><span class="font-semibold">${wf.name}</span></td>
          <td>${wf.actor}</td>
          <td class="text-sm text-muted">${wf.description}</td>
          <td><span class="badge badge-draft">${wf.sla}</span></td>
        </tr>
      `).join('');
    }
  }

  renderBarChart(containerId, items, total) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const max = Math.max(...items.map(i => i.count), 1);

    el.innerHTML = items.map(item => {
      const pct = Math.round((item.count / max) * 100);
      return `
        <div class="bar-chart-row">
          <span class="bar-chart-label" title="${item.label}">${item.label}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${pct}%; background-color: ${item.color};"></div>
          </div>
          <span class="bar-count">${item.count}</span>
        </div>
      `;
    }).join('');
  }

  // ========================================================================
  // VIEW 9: GLOBAL REQUEST TRACKING (Filterable Master Ledger)
  // ========================================================================
  renderRequestTrackingPage() {
    this.applyTrackingFilters();
  }

  applyTrackingFilters() {
    const searchVal = (document.getElementById('track-filter-search')?.value || '').toLowerCase();
    const shiftVal = document.getElementById('track-filter-shift')?.value || '';
    const stageVal = document.getElementById('track-filter-stage')?.value || '';
    const execVal = document.getElementById('track-filter-executor')?.value || '';
    const statusVal = document.getElementById('track-filter-status')?.value || '';

    const requests = window.flowStore.getRequests();

    const filtered = requests.filter(r => {
      const matchesSearch = !searchVal ||
        r.id.toLowerCase().includes(searchVal) ||
        (r.issueNo && r.issueNo.toLowerCase().includes(searchVal)) ||
        (r.product && r.product.toLowerCase().includes(searchVal)) ||
        (r.model && r.model.toLowerCase().includes(searchVal)) ||
        (r.processOperation && r.processOperation.toLowerCase().includes(searchVal)) ||
        (r.resp && r.resp.toLowerCase().includes(searchVal)) ||
        (r.observation && r.observation.toLowerCase().includes(searchVal)) ||
        (r.comments && r.comments.toLowerCase().includes(searchVal)) ||
        r.creatorName.toLowerCase().includes(searchVal);

      const matchesShift = !shiftVal || r.shift === shiftVal ||
        (shiftVal === 'Morning' && r.shift === 'I') ||
        (shiftVal === 'Afternoon' && r.shift === 'II') ||
        (shiftVal === 'Night' && r.shift === 'III');
      const matchesStage = !stageVal || r.stage === stageVal || r.processOperation === stageVal;
      const matchesExec = !execVal || r.executorName.includes(execVal);
      const matchesStatus = !statusVal || r.status === statusVal;

      return matchesSearch && matchesShift && matchesStage && matchesExec && matchesStatus;
    });

    const tbody = document.getElementById('table-tracking-requests');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 24px; color: var(--text-muted);">No production audit observations match the selected filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => `
      <tr>
        <td><span class="table-id-link font-bold" onclick="window.flowApp.openDetails('${r.id}')">${r.id}</span></td>
        <td>${r.displayDate || r.date}</td>
        <td><span class="font-medium">${r.shift}</span></td>
        <td>${r.quantity ? `${r.quantity} ${r.unit || 'Units'}` : '1,250 Units'}</td>
        <td><span class="font-medium">${r.stage || r.processOperation || 'Laser marking'}</span></td>
        <td>${r.line || 'Station 1'}</td>
        <td>${r.creatorName || 'Siva'}</td>
        <td>${r.executorName || 'Mr. Kumar'}</td>
        <td>${this.renderStatusBadge(r.status)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="window.flowApp.openDetails('${r.id}')">
            View Details
          </button>
        </td>
      </tr>
    `).join('');
  }

  clearTrackingFilters() {
    if (document.getElementById('track-filter-search')) document.getElementById('track-filter-search').value = '';
    if (document.getElementById('track-filter-shift')) document.getElementById('track-filter-shift').value = '';
    if (document.getElementById('track-filter-stage')) document.getElementById('track-filter-stage').value = '';
    if (document.getElementById('track-filter-executor')) document.getElementById('track-filter-executor').value = '';
    if (document.getElementById('track-filter-status')) document.getElementById('track-filter-status').value = '';
    this.applyTrackingFilters();
  }

  exportToCSV() {
    const requests = window.flowStore.getRequests();
    const headers = ['S. no', 'Issue No', 'Escalation Date', 'Product', 'Model', 'Process / Operation', 'shift', 'Priority', 'Issue/Observation', 'Resp', 'Status'];
    const rows = requests.map((r, idx) => [
      r.sNo || (idx + 1),
      r.issueNo || '01',
      r.escalationDate || r.displayDate,
      `"${r.product || 'FWM'}"`,
      `"${r.model || 'U340'}"`,
      `"${r.processOperation || r.stage || 'Laser marking'}"`,
      r.shift || 'I',
      r.repeatedOrNew || 'Repeated',
      `"${(r.observation || r.comments || '').replace(/"/g, '""')}"`,
      r.resp || 'MAINT',
      r.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Process_Audit_Observations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showNotificationToast('Process Audit Observations exported to CSV successfully.', 'info');
  }

  // ========================================================================
  // VIEW 10: NOTIFICATIONS CENTER
  // ========================================================================
  renderNotificationsView() {
    const user = window.flowStore.getCurrentUser();
    const notifs = window.flowStore.getNotifications(user.role);
    const container = document.getElementById('notifications-list-container');
    if (!container) return;

    if (notifs.length === 0) {
      container.innerHTML = '<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted);">No notifications in your feed.</div>';
      return;
    }

    container.innerHTML = notifs.map(n => `
      <div class="notification-card ${n.read ? '' : 'unread'}">
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-msg">${n.message}</div>
          <span class="notification-time">${n.timestamp || n.time}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${n.requestId ? `
            <button class="btn btn-primary btn-sm" onclick="window.flowApp.openDetails('${n.requestId}'); window.flowStore.markNotificationRead('${n.id}');">
              View Request
            </button>
          ` : ''}
          ${!n.read ? `
            <button class="btn btn-secondary btn-sm" onclick="window.flowStore.markNotificationRead('${n.id}')">
              Mark Read
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  updateNotificationBadge() {
    const user = window.flowStore.getCurrentUser();
    const unread = window.flowStore.getNotifications(user.role).filter(n => !n.read).length;
    const topBadge = document.getElementById('top-notif-count');
    const sbBadge = document.getElementById('sb-badge-notifs');

    if (topBadge) {
      topBadge.textContent = unread;
      topBadge.style.display = unread > 0 ? 'flex' : 'none';
    }
    if (sbBadge) {
      sbBadge.textContent = unread;
      sbBadge.style.display = unread > 0 ? 'inline-block' : 'none';
    }
  }

  markAllNotificationsRead() {
    const user = window.flowStore.getCurrentUser();
    window.flowStore.markAllNotificationsRead(user.role);
    this.showNotificationToast('All notifications marked as read', 'info');
  }

  // ========================================================================
  // VIEW 11: USER PROFILE & USER CREATION
  // ========================================================================
  renderProfileView() {
    const user = window.flowStore.getCurrentUser();
    const users = window.flowStore.getUsers();

    const avatarEl = document.getElementById('prof-display-avatar');
    const nameEl = document.getElementById('prof-display-name');
    const badgeEl = document.getElementById('prof-display-badge');
    const idEl = document.getElementById('prof-display-id');
    const deptEl = document.getElementById('prof-display-dept');
    const emailEl = document.getElementById('prof-display-email');
    const countBadge = document.getElementById('prof-users-count-badge');

    if (avatarEl) avatarEl.textContent = user.avatar;
    if (nameEl) nameEl.textContent = user.name;
    if (badgeEl) badgeEl.textContent = user.roleLabel;
    if (idEl) idEl.textContent = user.id;
    if (deptEl) deptEl.textContent = user.department;
    if (emailEl) emailEl.textContent = user.email;
    if (countBadge) countBadge.textContent = `${users.length} Registered Users`;

    const tbody = document.getElementById('table-profile-users');
    if (!tbody) return;

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="user-avatar-small" style="width: 32px; height: 32px; font-size: 13px; font-weight: 600;">${u.avatar}</div>
            <div>
              <div class="font-semibold" style="color: var(--navy-900);">${u.name} ${u.id === user.id ? '<span style="font-size: 11px; color: var(--primary); font-weight: 600;">(Current)</span>' : ''}</div>
              <div class="text-xs text-muted">${u.roleLabel}</div>
            </div>
          </div>
        </td>
        <td><span class="text-xs font-semibold" style="color: var(--navy-700);">${u.id}</span></td>
        <td><span class="badge badge-draft">${u.roleLabel}</span></td>
        <td><span class="text-sm font-medium">${u.department}</span></td>
        <td class="text-sm text-muted">${u.email}</td>
        <td><span class="badge badge-approved"><span class="badge-dot"></span> ${u.status}</span></td>
        <td>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="btn btn-secondary btn-sm" onclick="window.flowApp.loginAs('${u.role}')" title="Switch session to this user">
              Switch
            </button>
            ${u.id !== user.id && !['USR-001', 'USR-002', 'USR-006', 'USR-007'].includes(u.id) ? `
              <button class="btn btn-outline-danger btn-sm" onclick="window.flowApp.deleteUser('${u.id}', '${u.name}')" title="Delete User">
                ✕
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  openCreateUserModal() {
    document.getElementById('newuser-name').value = '';
    document.getElementById('newuser-role').value = 'executor';
    document.getElementById('newuser-dept').value = 'Assembly';
    document.getElementById('newuser-email').value = '';
    const pwdEl = document.getElementById('newuser-password');
    if (pwdEl) pwdEl.value = '123456789';
    document.getElementById('modal-create-user').classList.add('active');
    setTimeout(() => {
      const el = document.getElementById('newuser-name');
      if (el) el.focus();
    }, 100);
  }

  handleNewUserRoleChange(role) {
    const deptInput = document.getElementById('newuser-dept');
    const defaultDepts = {
      'creator': 'Production Planning',
      'executor': 'Assembly',
      'approver1': 'Quality & Production Lead',
      'approver2': 'Plant Operations Leadership',
      'admin': 'Information Technology / Systems'
    };
    if (deptInput && defaultDepts[role]) {
      deptInput.value = defaultDepts[role];
    }
  }

  autoSuggestUserEmail(name) {
    const emailInput = document.getElementById('newuser-email');
    if (!emailInput) return;
    const clean = name.trim().toLowerCase().replace(/\s+/g, '.');
    if (clean) {
      emailInput.value = `${clean}@inel.co.in`;
    }
  }

  handleCreateUserSubmit() {
    const name = document.getElementById('newuser-name').value.trim();
    const role = document.getElementById('newuser-role').value;
    const dept = document.getElementById('newuser-dept').value.trim();
    const email = document.getElementById('newuser-email').value.trim();
    const pwdEl = document.getElementById('newuser-password');
    const password = pwdEl ? pwdEl.value : '123456789';

    if (!name) {
      alert('Please enter employee full name.');
      return;
    }

    const newUser = window.flowStore.addUser({
      name: name,
      role: role,
      department: dept,
      email: email,
      password: password
    });

    this.closeModals();
    this.showNotificationToast(`User "${newUser.name}" (${newUser.roleLabel}) created successfully!`, 'success');

    // Update the Executor select in the Create Request form if executor
    const execSelect = document.getElementById('req-field-executor');
    if (execSelect && newUser.role === 'executor') {
      const opt = document.createElement('option');
      opt.value = newUser.id;
      opt.textContent = `${newUser.name} (${newUser.department})`;
      execSelect.appendChild(opt);
    }

    // Re-render
    if (this.currentView === 'profile') {
      this.renderProfileView();
    }
    if (this.currentView === 'admin-dashboard') {
      this.renderAdminDashboard();
    }
  }

  deleteUser(userId, userName) {
    if (confirm(`Are you sure you want to remove user "${userName}"?`)) {
      window.flowStore.deleteUser(userId);
      this.showNotificationToast(`User "${userName}" removed.`, 'info');
      this.renderProfileView();
      if (this.currentView === 'admin-dashboard') {
        this.renderAdminDashboard();
      }
    }
  }

  // ========================================================================
  // WORKFLOW STEPPER COMPONENT
  // ========================================================================
  renderWorkflowStepper(req, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Steps: 1. Created, 2. Submitted & Assigned, 3. Executed, 4. Approval 1, 5. Approval 2, 6. Completed
    let isCreated = true;
    let isAssigned = true;
    let isExecuted = req.executionDetails !== null;
    let isAppr1 = req.approvals.approver1.status === 'approved';
    let isAppr2 = req.approvals.approver2.status === 'approved';
    let isRejected = req.status === 'Rejected';
    let isCompleted = req.status === 'Approved';

    let progressPct = 20;
    if (isExecuted) progressPct = 40;
    if (isAppr1) progressPct = 65;
    if (isAppr2 || isCompleted) progressPct = 100;
    if (isRejected) progressPct = 80;

    container.innerHTML = `
      <div class="stepper-connector">
        <div class="stepper-progress-fill" style="width: ${progressPct}%;"></div>
      </div>

      <div class="stepper-step completed">
        <div class="step-circle">✓</div>
        <span class="step-label">Created</span>
        <span class="step-subtext">${req.creatorName}</span>
      </div>

      <div class="stepper-step completed">
        <div class="step-circle">✓</div>
        <span class="step-label">Assigned</span>
        <span class="step-subtext">${req.executorName}</span>
      </div>

      <div class="stepper-step ${isExecuted ? 'completed' : req.status === 'Pending Execution' ? 'active' : ''}">
        <div class="step-circle">${isExecuted ? '✓' : '3'}</div>
        <span class="step-label">Executed</span>
        <span class="step-subtext">${isExecuted ? 'Proof Attached' : 'Floor Run'}</span>
      </div>

      <div class="stepper-step ${isAppr1 ? 'completed' : req.approvals.approver1.status === 'pending' ? 'active' : req.approvals.approver1.status === 'rejected' ? 'rejected' : ''}">
        <div class="step-circle">${isAppr1 ? '✓' : req.approvals.approver1.status === 'rejected' ? '✕' : '4'}</div>
        <span class="step-label">Approval 1</span>
        <span class="step-subtext">Mr. Raj (Prod)</span>
      </div>

      <div class="stepper-step ${isAppr2 ? 'completed' : req.approvals.approver2.status === 'pending' ? 'active' : req.approvals.approver2.status === 'rejected' ? 'rejected' : ''}">
        <div class="step-circle">${isAppr2 ? '✓' : req.approvals.approver2.status === 'rejected' ? '✕' : '5'}</div>
        <span class="step-label">Approval 2</span>
        <span class="step-subtext">Mr. Anand (Plant)</span>
      </div>

      <div class="stepper-step ${isCompleted ? 'completed' : isRejected ? 'rejected' : ''}">
        <div class="step-circle">${isCompleted ? '✓' : isRejected ? '✕' : '6'}</div>
        <span class="step-label">${isRejected ? 'Rejected' : 'Completed'}</span>
        <span class="step-subtext">${isCompleted ? 'ERP Released' : isRejected ? 'Audit Rework' : 'Inventory'}</span>
      </div>
    `;
  }

  // ========================================================================
  // DEMO STEPPER TOUR (Presentation Sequence)
  // ========================================================================
  demoStep(stepNum) {
    // Highlight active demo bar button
    for (let i = 1; i <= 5; i++) {
      const b = document.getElementById(`demo-step-${i}`);
      if (b) {
        if (i === stepNum) b.classList.add('current');
        else b.classList.remove('current');
      }
    }

    if (stepNum === 1) {
      // Step 1: Creator (Siva)
      this.loginAs('creator');
      this.navigateTo('create-request');
      this.showNotificationToast('Demo Step 1: Creator (Siva) can define batch parameters and assign line leads.', 'info');
    } else if (stepNum === 2) {
      // Step 2: Executor (Kumar)
      this.loginAs('executor');
      this.navigateTo('execute-request', { requestId: 'REQ-1001' });
      this.showNotificationToast('Demo Step 2: Executor (Mr. Kumar) reviews targets, enters yield, and attaches proof files.', 'info');
    } else if (stepNum === 3) {
      // Step 3: Approver 1 (Raj)
      this.loginAs('approver1');
      this.navigateTo('approval-review', { requestId: 'REQ-1002' });
      this.showNotificationToast('Demo Step 3: Approver 1 (Mr. Raj - Production Mgr) evaluates yield variance and floor proof.', 'info');
    } else if (stepNum === 4) {
      // Step 4: Approver 2 (Anand)
      this.loginAs('approver2');
      this.navigateTo('approval-review', { requestId: 'REQ-1003' });
      this.showNotificationToast('Demo Step 4: Approver 2 (Mr. Anand - Plant Head) reviews Level 1 sign-off for final release.', 'info');
    } else if (stepNum === 5) {
      // Step 5: Master Tracking & Audit
      this.loginAs('admin');
      this.navigateTo('request-tracking');
      this.showNotificationToast('Demo Step 5: Global tracking ledger with tamper-evident audit trail across all production lines.', 'info');
    }
  }

  // ========================================================================
  // UTILITY HELPERS, TOASTS & PREVIEWS
  // ========================================================================
  openDetails(id) {
    this.navigateTo('request-details', { requestId: id });
  }

  openExecute(id) {
    this.loginAs('executor');
    this.navigateTo('execute-request', { requestId: id });
  }

  openReview(id) {
    const user = window.flowStore.getCurrentUser();
    if (user.role !== 'approver1' && user.role !== 'approver2') {
      this.loginAs('approver1');
    }
    this.navigateTo('approval-review', { requestId: id });
  }

  previewFile(fileName, type) {
    const title = document.getElementById('modal-preview-title');
    const body = document.getElementById('modal-preview-body');
    title.textContent = `Document Inspection: ${fileName}`;

    if (type === 'image') {
      body.innerHTML = `
        <div style="background: #0f172a; padding: 20px; border-radius: var(--radius-md); margin-bottom: 12px;">
          <svg width="100%" height="240" viewBox="0 0 500 240" xmlns="http://www.w3.org/2000/svg">
            <rect width="500" height="240" fill="#1e293b" rx="8"/>
            <circle cx="250" cy="110" r="45" fill="#3b82f6" opacity="0.2"/>
            <circle cx="250" cy="110" r="30" fill="#2563eb" opacity="0.6"/>
            <path d="M150,180 L230,120 L280,150 L350,90 L400,180 Z" fill="#059669" opacity="0.3"/>
            <text x="250" y="210" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">SIMULATED PRODUCTION CAMERA CAPTURE</text>
            <text x="250" y="225" fill="#94a3b8" font-size="11" text-anchor="middle">Timestamp: 03 Sep 2026 18:22:10 &bull; Camera ID #CAM-L1-04</text>
          </svg>
        </div>
        <p class="text-sm font-medium" style="color: var(--navy-800);">${fileName}</p>
        <span class="badge badge-approved" style="margin-top: 6px;">✓ QA Stamp Verified</span>
      `;
    } else {
      body.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 30px 20px; border-radius: var(--radius-md); text-align: left; font-family: monospace; font-size: 12.5px; color: var(--navy-800); margin-bottom: 12px; line-height: 1.6;">
          <strong style="color: var(--primary);">================ DOCUMENT TELEMETRY LOG ================</strong><br>
          FILE: ${fileName}<br>
          CHECKSUM SHA-256: 8f4e2b9c71a3014e88d6...<br>
          STATUS: VERIFIED STANDARD CALIBRATION SPECIFICATION<br>
          OPERATOR ID: USR-002 (Kumar Vel)<br>
          TOLERANCE RANGE: 18.0 - 22.0 Nm<br>
          TESTED POINTS: 1,250<br>
          DEFECT RATE: 0.00%<br>
          AUDIT ENCRYPTION: ISO-9001 MANUFACTURING COMPLIANT<br>
          ========================================================
        </div>
        <p class="text-sm font-medium" style="color: var(--navy-800);">${fileName}</p>
        <span class="badge badge-draft" style="margin-top: 6px;">Document Ready for Verification</span>
      `;
    }

    document.getElementById('modal-proof-preview').classList.add('active');
  }

  showEmailToast(email) {
    const stack = document.getElementById('email-toast-stack');
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = 'email-toast';
    toast.innerHTML = `
      <div class="email-toast-top">
        <span class="email-toast-badge">📧 SIMULATED DISPATCH</span>
        <span style="color: #94a3b8; font-size: 11px;">${email.timestamp}</span>
      </div>
      <div class="email-toast-to">To: ${email.to}</div>
      <div class="email-toast-subj">${email.subject}</div>
      <div class="email-toast-body">${email.body}</div>
    `;

    stack.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 6500);
  }

  showNotificationToast(message, type = 'info') {
    const stack = document.getElementById('email-toast-stack');
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = 'email-toast';
    toast.style.borderLeft = `4px solid ${type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#3b82f6'}`;
    toast.innerHTML = `
      <div class="email-toast-top">
        <span style="font-weight: 700; color: ${type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#3b82f6'};">
          ${type === 'success' ? '✓ SUCCESS' : type === 'danger' ? '✕ ALERT' : 'ℹ NOTIFICATION'}
        </span>
        <span style="color: #94a3b8; font-size: 11px;">Just now</span>
      </div>
      <div class="email-toast-body" style="color: white; font-size: 13px;">${message}</div>
    `;

    stack.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }

  saveDraftToast() {
    this.showNotificationToast('Draft saved successfully to local browser state.', 'info');
  }

  resetDataPrompt() {
    if (confirm('Reset prototype data back to original seed records? All newly created requests will be refreshed.')) {
      window.flowStore.resetAll();
    }
  }

  toggleMobileSidebar() {
    const sb = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sb) sb.classList.toggle('mobile-open');
    if (backdrop) backdrop.classList.toggle('hidden');
  }

  closeMobileSidebar() {
    const sb = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sb) sb.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.add('hidden');
  }

  setupDragAndDrop() {
    const setupZone = (zoneId, inputId) => {
      const zone = document.getElementById(zoneId);
      if (!zone) return;

      ['dragenter', 'dragover'].forEach(name => {
        zone.addEventListener(name, e => {
          e.preventDefault();
          zone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        zone.addEventListener(name, e => {
          e.preventDefault();
          zone.classList.remove('dragover');
        });
      });

      zone.addEventListener('drop', e => {
        const input = document.getElementById(inputId);
        if (input) {
          input.files = e.dataTransfer.files;
          const event = new Event('change');
          input.dispatchEvent(event);
        }
      });
    };

    setupZone('req-create-dropzone', 'file-input-create');
    setupZone('exec-proof-dropzone', 'file-input-exec');
  }

  renderStatusBadge(status) {
    const map = {
      'Draft': 'badge-draft',
      'Pending Execution': 'badge-pending-execution',
      'In Execution': 'badge-in-execution',
      'Pending Approval': 'badge-pending-approval',
      'Partially Approved': 'badge-partially-approved',
      'Approved': 'badge-approved',
      'Rejected': 'badge-rejected'
    };
    const cls = map[status] || 'badge-draft';
    return `<span class="badge ${cls}"><span class="badge-dot"></span> ${status}</span>`;
  }

  getIcon(name) {
    const icons = {
      dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
      list: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
      bell: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
      user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      clipboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
      shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      checkCircle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      xCircle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      layers: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`
    };
    return icons[name] || icons.dashboard;
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.flowApp = new FlowApp();
});
