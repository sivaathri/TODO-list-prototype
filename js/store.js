/**
 * FlowTrack - Production Workflow & Approval Management
 * State Store & Business Logic Engine
 */

class AppStore {
  constructor() {
    this.STORAGE_KEY_REQUESTS = 'inel_flowtrack_requests_v1';
    this.STORAGE_KEY_USERS = 'inel_flowtrack_users_v1';
    this.STORAGE_KEY_NOTIFS = 'inel_flowtrack_notifs_v1';
    this.STORAGE_KEY_CURRENT_USER = 'inel_flowtrack_current_user_v1';
    this.STORAGE_KEY_CURRENT_MODULE = 'inel_flowtrack_current_module_v1';

    this.AVAILABLE_MODULES = [
      {
        id: 'process_audit',
        number: '1',
        name: 'Process Audit Observation',
        tagline: 'Standard Work & Quality Compliance',
        description: 'Line observation audits, 4M compliance checks, non-conformance logging, and floor corrective action tracking.',
        icon: 'audit',
        badge: 'Audit & Compliance',
        accent: '#2563eb'
      },
      {
        id: 'ihlr',
        number: '2',
        name: 'IHLR',
        fullName: 'In-House Line Rejection',
        tagline: 'Floor Defect & Scrap Analysis',
        description: 'Comprehensive in-house line rejection monitoring, defect categorization, scrap reduction, and root cause containment.',
        icon: 'rejection',
        badge: 'Line Quality',
        accent: '#dc2626'
      },
      {
        id: 'try_out',
        number: '3',
        name: 'Try Out Status',
        altName: 'try out satus',
        tagline: 'Tooling, Die & Pilot Trials',
        description: 'Trial run status tracking, pilot batch evaluation, tooling modifications, engineering change approvals, and sign-offs.',
        icon: 'tryout',
        badge: 'Pilot & Engineering',
        accent: '#7c3aed'
      }
    ];

    this.listeners = [];
    this.emailQueue = [];

    this.init();
  }

  init() {
    // Load or seed requests
    let storedReqs = null;
    try {
      storedReqs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_REQUESTS));
    } catch (e) {}

    if (!storedReqs || !Array.isArray(storedReqs) || !storedReqs[0] || !storedReqs[0].product || !storedReqs.some(r => r.module === 'ihlr' || r.problem)) {
      localStorage.setItem(this.STORAGE_KEY_REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    }
    // Load or seed users
    let storedUsers = null;
    try {
      storedUsers = JSON.parse(localStorage.getItem(this.STORAGE_KEY_USERS));
    } catch (e) {}

    if (!storedUsers || !Array.isArray(storedUsers)) {
      localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(SEED_USERS));
    } else {
      // Always ensure USR-001 has clean name 'Siva' and avatar 'S'
      let updated = false;
      storedUsers = storedUsers.map(u => {
        if (u.id === 'USR-001') {
          if (u.name !== 'Siva' || u.avatar !== 'S') {
            u.name = 'Siva';
            u.shortName = 'Siva';
            u.avatar = 'S';
            u.email = 'siva@inel.co.in';
            updated = true;
          }
        }
        if (u.id === 'USR-002' && (u.department.includes('Shopfloor') || u.department.startsWith(' '))) {
          u.department = 'Assembly';
          updated = true;
        }
        return u;
      });
      if (updated) {
        localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(storedUsers));
      }
    }
    // Load or seed notifications
    if (!localStorage.getItem(this.STORAGE_KEY_NOTIFS)) {
      localStorage.setItem(this.STORAGE_KEY_NOTIFS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }

    // Default user: Siva (Creator)
    const savedUserRole = localStorage.getItem(this.STORAGE_KEY_CURRENT_USER) || 'creator';
    this.currentUser = this.getUserByRole(savedUserRole) || SEED_USERS[0];
    if (this.currentUser && this.currentUser.id === 'USR-001') {
      this.currentUser.name = 'Siva';
      this.currentUser.shortName = 'Siva';
      this.currentUser.avatar = 'S';
    }

    // Active module
    const savedModule = localStorage.getItem(this.STORAGE_KEY_CURRENT_MODULE);
    this.currentModule = this.AVAILABLE_MODULES.find(m => m.id === savedModule) || this.AVAILABLE_MODULES[0];
  }

  // Modules API
  getModules() {
    return this.AVAILABLE_MODULES;
  }

  getSelectedModule() {
    return this.currentModule || this.AVAILABLE_MODULES[0];
  }

  setSelectedModule(moduleId) {
    const mod = this.AVAILABLE_MODULES.find(m => m.id === moduleId);
    if (mod) {
      this.currentModule = mod;
      localStorage.setItem(this.STORAGE_KEY_CURRENT_MODULE, moduleId);
      this.notify('MODULE_CHANGED', mod);
    }
    return this.currentModule;
  }

  // Subscribe to changes
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notify(event, payload) {
    this.listeners.forEach(fn => {
      try {
        fn(event, payload);
      } catch (err) {
        console.error('Listener error:', err);
      }
    });
  }

  // Reset demo data
  resetAll() {
    localStorage.removeItem(this.STORAGE_KEY_REQUESTS);
    localStorage.removeItem(this.STORAGE_KEY_USERS);
    localStorage.removeItem(this.STORAGE_KEY_NOTIFS);
    localStorage.removeItem(this.STORAGE_KEY_CURRENT_USER);
    this.init();
    this.notify('RESET', null);
  }

  // Current User
  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(roleKey) {
    const user = this.getUserByRole(roleKey);
    if (user) {
      this.currentUser = user;
      localStorage.setItem(this.STORAGE_KEY_CURRENT_USER, roleKey);
      this.notify('USER_CHANGED', user);
    }
  }

  getUserByRole(roleKey) {
    const users = this.getUsers();
    return users.find(u => u.role === roleKey) || users[0];
  }

  getUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id);
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY_USERS)) || SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  }

  addUser(userData) {
    const users = this.getUsers();
    const nextNum = users.length + 1;
    const newId = `USR-${String(nextNum).padStart(3, '0')}`;

    let avatar = 'U';
    if (userData.name) {
      const parts = userData.name.trim().split(/\s+/);
      if (parts.length > 1) {
        avatar = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else {
        avatar = parts[0].substring(0, 2).toUpperCase();
      }
    }

    const roleLabels = {
      'creator': 'Request Creator',
      'executor': 'Line Execution Lead',
      'approver1': 'Approver 1 (Prod Lead)',
      'approver2': 'Approver 2 (Plant Head)',
      'admin': 'System Administrator'
    };

    const newUser = {
      id: newId,
      name: userData.name.trim(),
      shortName: userData.name.trim().split(/\s+/)[0],
      role: userData.role || 'creator',
      roleLabel: roleLabels[userData.role] || 'Team Member',
      department: userData.department || 'Production Planning',
      email: userData.email || `${userData.name.toLowerCase().replace(/\s+/g, '.')}@inel.co.in`,
      password: userData.password || '123456789',
      avatar: avatar,
      status: 'Active'
    };

    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
    this.notify('USER_ADDED', newUser);
    return newUser;
  }

  deleteUser(userId) {
    let users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return false;
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
    this.notify('USER_DELETED', userId);
    return true;
  }

  // Requests
  getRequests() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY_REQUESTS)) || INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  }

  saveRequests(requests) {
    localStorage.setItem(this.STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  }

  getRequestById(id) {
    const requests = this.getRequests();
    return requests.find(r => r.id === id);
  }

  generateNextRequestId() {
    const requests = this.getRequests();
    const numbers = requests
      .map(r => parseInt(r.id.replace('REQ-', ''), 10))
      .filter(n => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 1000;
    return `REQ-${maxNum + 1}`;
  }

  generateNextAuditSequence() {
    const requests = this.getRequests();
    const sNos = requests.map(r => parseInt(r.sNo, 10)).filter(n => !isNaN(n));
    const nextSNo = sNos.length > 0 ? Math.max(...sNos) + 1 : requests.length + 1;
    const nextIssueNo = String(nextSNo).padStart(2, '0');
    return { nextSNo, nextIssueNo };
  }

  generateNextIHLRSequence() {
    const requests = this.getRequests().filter(r => r.module === 'ihlr');
    const reqNos = requests.map(r => parseInt(r.reqNo, 10)).filter(n => !isNaN(n));
    const nextReqNo = reqNos.length > 0 ? Math.max(...reqNos) + 1 : 1;
    return { nextReqNo };
  }

  // Action: Create Production Request / Process Audit Observation / IHLR
  createRequest(data) {
    const requests = this.getRequests();
    const newId = data.id || this.generateNextRequestId();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timestampStr = `${formattedDate}, ${formattedTime}`;

    const executor = this.getUserById(data.executorId) || { name: 'Mr. Kumar', id: 'USR-002' };

    const sNos = requests.map(r => parseInt(r.sNo, 10)).filter(n => !isNaN(n));
    const nextSNo = data.sNo || (sNos.length > 0 ? Math.max(...sNos) + 1 : requests.length + 1);
    const nextIssueNo = data.issueNo || String(nextSNo).padStart(2, '0');

    const activeModule = data.module || this.getSelectedModule().id;
    const reqNos = requests.filter(r => r.module === 'ihlr').map(r => parseInt(r.reqNo, 10)).filter(n => !isNaN(n));
    const nextReqNo = data.reqNo || (reqNos.length > 0 ? Math.max(...reqNos) + 1 : 1);

    const newRequest = {
      id: newId,
      module: activeModule,
      reqNo: nextReqNo,
      sNo: nextSNo,
      issueNo: nextIssueNo,
      date: data.date || data.escalationDate || now.toISOString().split('T')[0],
      escalationDate: data.escalationDate || data.date || now.toISOString().split('T')[0],
      displayDate: formattedDate,
      problem: data.problem || '',
      product: data.product || (activeModule === 'ihlr' ? (data.model || 'OLS LONG ARM') : 'FWM'),
      model: data.model || (activeModule === 'ihlr' ? 'OLS LONG ARM' : 'U340'),
      problemDetectedAt: data.problemDetectedAt || '',
      receivedFrom: data.receivedFrom || '',
      analysisDoneBy: data.analysisDoneBy || '',
      actualQty: data.actualQty || data.quantity || '1',
      fourM: data.fourM || 'MAN',
      whyWhyAnalysis: data.whyWhyAnalysis || null,
      defectImage: data.defectImage || null,
      processOperation: data.processOperation || data.stage || (activeModule === 'ihlr' ? (data.problemDetectedAt || 'Final Testing') : 'Laser marking'),
      shift: data.shift || (activeModule === 'ihlr' ? 'i' : 'I'),
      repeatedOrNew: data.repeatedOrNew || 'Repeated',
      resp: data.resp || (activeModule === 'ihlr' ? 'PROD' : 'MAINT'),
      observation: data.observation || data.comments || (data.whyWhyAnalysis ? `W1: ${data.whyWhyAnalysis.w1}\nW2: ${data.whyWhyAnalysis.w2}\nW3: ${data.whyWhyAnalysis.w3}` : ''),
      evidenceAttachment: data.evidenceAttachment || (data.attachments && data.attachments.find(a => a.type === 'image')) || null,
      quantity: data.actualQty || data.quantity || '1,000',
      unit: data.unit || 'Units',
      line: data.receivedFrom || data.line || `${data.processOperation || 'Laser marking'} Station`,
      stage: data.problemDetectedAt || data.processOperation || data.stage || 'Laser marking',
      creatorId: this.currentUser.id,
      creatorName: this.currentUser.shortName,
      executorId: executor.id,
      executorName: executor.shortName,
      status: 'Pending Execution',
      priority: data.priority || 'High',
      comments: data.observation || data.comments || '',
      attachments: data.attachments || [],
      executionDetails: null,
      approvals: {
        approver1: {
          userId: 'USR-006',
          name: 'Mr. Raj',
          title: 'Production Manager',
          status: 'waiting',
          timestamp: null,
          comments: null
        },
        approver2: {
          userId: 'USR-007',
          name: 'Mr. Anand',
          title: 'Plant Head',
          status: 'waiting',
          timestamp: null,
          comments: null
        }
      },
      activityTimeline: [
        {
          timestamp: timestampStr,
          title: 'Observation Logged',
          desc: `${this.currentUser.shortName} logged audit observation for ${data.product || 'FWM'} (${data.model || 'U340'} - ${data.processOperation || 'Laser marking'})`,
          actor: this.currentUser.name,
          type: 'create'
        },
        {
          timestamp: timestampStr,
          title: `Escalated to Resp: ${data.resp || 'MAINT'} (${executor.shortName})`,
          desc: `Action assigned to ${executor.shortName} for containment and rectification`,
          actor: this.currentUser.name,
          type: 'assign'
        },
        {
          timestamp: timestampStr,
          title: 'Notification Dispatched',
          desc: `Alert dispatched to ${data.resp || 'MAINT'} Lead (${executor.name})`,
          actor: 'System',
          type: 'notify'
        }
      ]
    };

    requests.unshift(newRequest);
    this.saveRequests(requests);

    // Create In-App Notification for Executor
    this.addNotification({
      forUserRole: 'executor',
      forUserId: executor.id,
      title: 'New Request Assigned',
      message: `Request ${newId} created by ${this.currentUser.shortName} has been assigned to you for execution.`,
      requestId: newId,
      time: 'Just now',
      timestamp: timestampStr,
      read: false,
      type: 'assigned'
    });

    // Simulate Email Dispatch
    this.dispatchSimulatedEmail({
      to: `${executor.name} <${executor.email}>`,
      subject: `[Action Required] Production Request ${newId} Assigned to You`,
      body: `A new production request has been initiated by ${this.currentUser.name} for ${data.stage} on ${data.line}. Quantity: ${data.quantity} ${data.unit || 'Units'}. Please proceed to floor execution.`
    });

    this.notify('REQUEST_CREATED', newRequest);
    return newRequest;
  }

  // Action: Submit Execution
  submitExecution(requestId, executionData) {
    const requests = this.getRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return null;

    const req = requests[reqIndex];
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timestampStr = `${formattedDate}, ${formattedTime}`;

    req.executionDetails = {
      executionDate: executionData.executionDate || formattedDate,
      displayExecutionDate: formattedDate,
      startTime: executionData.startTime || '08:00',
      endTime: executionData.endTime || '16:30',
      actualProduction: executionData.actualProduction || req.quantity,
      executionStatus: executionData.executionStatus || 'Completed',
      remarks: executionData.remarks || 'Production executed per standard SOP tolerances.',
      proofFiles: executionData.proofFiles || []
    };

    req.status = 'Pending Approval';
    req.approvals.approver1.status = 'pending';
    req.approvals.approver2.status = 'waiting';

    // Append timeline logs
    req.activityTimeline.push({
      timestamp: timestampStr,
      title: 'Execution Completed & Submitted',
      desc: `${this.currentUser.shortName} completed production run: ${req.executionDetails.actualProduction}. Proofs attached.`,
      actor: this.currentUser.name,
      type: 'execute_submit'
    });

    req.activityTimeline.push({
      timestamp: timestampStr,
      title: 'Routing to Approver 1',
      desc: `Automated routing to Mr. Raj (Production Manager) for Level 1 compliance sign-off`,
      actor: 'System',
      type: 'approval_req'
    });

    requests[reqIndex] = req;
    this.saveRequests(requests);

    // Notify Approver 1 (Mr. Raj)
    this.addNotification({
      forUserRole: 'approver1',
      forUserId: 'USR-006',
      title: 'Execution Completed - Review Required',
      message: `Request ${req.id} has been executed by ${this.currentUser.shortName} and is waiting for your Level 1 approval.`,
      requestId: req.id,
      time: 'Just now',
      timestamp: timestampStr,
      read: false,
      type: 'approval_needed'
    });

    // Notify Creator (Siva) that execution is done
    this.addNotification({
      forUserRole: 'creator',
      forUserId: req.creatorId,
      title: 'Execution Completed by Floor Team',
      message: `Request ${req.id} execution was completed by ${this.currentUser.shortName} and routed for approval.`,
      requestId: req.id,
      time: 'Just now',
      timestamp: timestampStr,
      read: false,
      type: 'status_update'
    });

    // Simulate Email Dispatch to Approver 1
    this.dispatchSimulatedEmail({
      to: 'Mr. Raj (Production Manager) <raj.sekhar@inel.co.in>',
      subject: `[Approval Required] Level 1 Sign-off for ${req.id} - ${req.stage}`,
      body: `Line execution for request ${req.id} has finished with yield ${req.executionDetails.actualProduction}. Execution logs and QA proof files are ready for your review.`
    });

    this.notify('EXECUTION_SUBMITTED', req);
    return req;
  }

  // Action: Approve Request (Handles Two-Level Approval)
  approveRequest(requestId, approverRole, comments) {
    const requests = this.getRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return null;

    const req = requests[reqIndex];
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timestampStr = `${formattedDate}, ${formattedTime}`;

    if (approverRole === 'approver1') {
      // Approver 1 signs off -> transitions to Partially Approved & pending Approver 2
      req.approvals.approver1.status = 'approved';
      req.approvals.approver1.timestamp = timestampStr;
      req.approvals.approver1.comments = comments || 'Verified production metrics and floor proof. Compliant.';

      req.approvals.approver2.status = 'pending';
      req.status = 'Partially Approved';

      req.activityTimeline.push({
        timestamp: timestampStr,
        title: 'Level 1 Approved by Mr. Raj',
        desc: `Production Manager signed off: "${req.approvals.approver1.comments}". Escalated to Mr. Anand for final sign-off.`,
        actor: 'Mr. Raj',
        type: 'approve_l1'
      });

      // Notify Approver 2 (Mr. Anand)
      this.addNotification({
        forUserRole: 'approver2',
        forUserId: 'USR-007',
        title: 'Level 1 Approved - Final Sign-off Needed',
        message: `Request ${req.id} has been approved by Mr. Raj and is waiting for your Level 2 final sign-off.`,
        requestId: req.id,
        time: 'Just now',
        timestamp: timestampStr,
        read: false,
        type: 'approval_needed'
      });

      // Email to Approver 2
      this.dispatchSimulatedEmail({
        to: 'Mr. Anand (Plant Head) <anand.mohan@inel.co.in>',
        subject: `[Final Approval Required] Sign-off for ${req.id} (Level 1 Passed)`,
        body: `Production Manager Mr. Raj has verified and approved batch ${req.id}. Please provide executive authorization to close the production cycle.`
      });

    } else if (approverRole === 'approver2') {
      // Approver 2 signs off -> request is fully Approved / Completed!
      req.approvals.approver2.status = 'approved';
      req.approvals.approver2.timestamp = timestampStr;
      req.approvals.approver2.comments = comments || 'Executive sign-off granted. Batch released to inventory.';

      req.status = 'Approved';

      req.activityTimeline.push({
        timestamp: timestampStr,
        title: 'Level 2 Final Approved by Mr. Anand',
        desc: `Plant Head signed off: "${req.approvals.approver2.comments}". Production workflow completed successfully.`,
        actor: 'Mr. Anand',
        type: 'approve_l2'
      });

      // Notify Creator & Executor
      this.addNotification({
        forUserRole: 'creator',
        forUserId: req.creatorId,
        title: 'Request Approved Successfully',
        message: `Request ${req.id} has received final sign-off from Plant Head (Mr. Anand) and is marked Approved.`,
        requestId: req.id,
        time: 'Just now',
        timestamp: timestampStr,
        read: false,
        type: 'completed'
      });

      this.addNotification({
        forUserRole: 'executor',
        forUserId: req.executorId,
        title: 'Request Approved & Completed',
        message: `Request ${req.id} executed by you was fully approved by plant leadership.`,
        requestId: req.id,
        time: 'Just now',
        timestamp: timestampStr,
        read: false,
        type: 'completed'
      });

      // Email to Creator & Executor
      this.dispatchSimulatedEmail({
        to: `Siva <siva@inel.co.in>, Kumar Vel <kumar.vel@inel.co.in>`,
        subject: `[Completed] Production Request ${req.id} Approved by Plant Leadership`,
        body: `Production request ${req.id} (${req.stage}, ${req.quantity}) has cleared both Level 1 and Level 2 approvals. The batch is officially released.`
      });
    }

    requests[reqIndex] = req;
    this.saveRequests(requests);
    this.notify('REQUEST_APPROVED', req);
    return req;
  }

  // Action: Reject Request
  rejectRequest(requestId, approverRole, reason) {
    const requests = this.getRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return null;

    const req = requests[reqIndex];
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timestampStr = `${formattedDate}, ${formattedTime}`;

    const rejector = this.currentUser;

    if (approverRole === 'approver1') {
      req.approvals.approver1.status = 'rejected';
      req.approvals.approver1.timestamp = timestampStr;
      req.approvals.approver1.comments = reason;
    } else {
      req.approvals.approver2.status = 'rejected';
      req.approvals.approver2.timestamp = timestampStr;
      req.approvals.approver2.comments = reason;
    }

    req.status = 'Rejected';
    req.rejectionReason = reason;
    req.rejectedBy = rejector.shortName;

    req.activityTimeline.push({
      timestamp: timestampStr,
      title: `Request Rejected by ${rejector.shortName}`,
      desc: `Rejection Reason: ${reason}`,
      actor: rejector.name,
      type: 'reject'
    });

    requests[reqIndex] = req;
    this.saveRequests(requests);

    // Notify Creator & Executor
    this.addNotification({
      forUserRole: 'creator',
      forUserId: req.creatorId,
      title: 'Production Request Rejected',
      message: `Request ${req.id} was rejected by ${rejector.shortName}. Reason: ${reason}`,
      requestId: req.id,
      time: 'Just now',
      timestamp: timestampStr,
      read: false,
      type: 'rejected'
    });

    this.addNotification({
      forUserRole: 'executor',
      forUserId: req.executorId,
      title: 'Request Rejected During Approval',
      message: `Request ${req.id} executed by you was rejected by ${rejector.shortName}. Reason: ${reason}`,
      requestId: req.id,
      time: 'Just now',
      timestamp: timestampStr,
      read: false,
      type: 'rejected'
    });

    // Email alert
    this.dispatchSimulatedEmail({
      to: `Siva <siva@inel.co.in>, Kumar Vel <kumar.vel@inel.co.in>`,
      subject: `[Action Required] Production Request ${req.id} REJECTED`,
      body: `Request ${req.id} has been rejected by ${rejector.name}. Stated Reason: "${reason}". Please consult the activity log for corrective action.`
    });

    this.notify('REQUEST_REJECTED', req);
    return req;
  }

  // Notifications Management
  getNotifications(role = null) {
    try {
      const notifs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_NOTIFS)) || INITIAL_NOTIFICATIONS;
      if (!role) return notifs;
      return notifs.filter(n => n.forUserRole === role || n.forUserRole === 'all');
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  addNotification(notif) {
    const notifs = this.getNotifications();
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      ...notif
    };
    notifs.unshift(newNotif);
    localStorage.setItem(this.STORAGE_KEY_NOTIFS, JSON.stringify(notifs));
    this.notify('NOTIFICATION_ADDED', newNotif);
    return newNotif;
  }

  markNotificationRead(id) {
    const notifs = this.getNotifications();
    const n = notifs.find(item => item.id === id);
    if (n) {
      n.read = true;
      localStorage.setItem(this.STORAGE_KEY_NOTIFS, JSON.stringify(notifs));
      this.notify('NOTIFICATIONS_UPDATED', notifs);
    }
  }

  markAllNotificationsRead(role = null) {
    const notifs = this.getNotifications();
    notifs.forEach(n => {
      if (!role || n.forUserRole === role || n.forUserRole === 'all') {
        n.read = true;
      }
    });
    localStorage.setItem(this.STORAGE_KEY_NOTIFS, JSON.stringify(notifs));
    this.notify('NOTIFICATIONS_UPDATED', notifs);
  }

  // Email Simulation Queue & Toast Broadcast
  dispatchSimulatedEmail(emailPayload) {
    const emailItem = {
      id: `EMAIL-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ...emailPayload
    };
    this.emailQueue.unshift(emailItem);
    this.notify('SIMULATED_EMAIL_SENT', emailItem);
  }

  getEmailQueue() {
    return this.emailQueue;
  }

  // Helper Stats Calculation for Dashboards
  getMetrics() {
    const requests = this.getRequests();
    const currentUserId = this.currentUser.id;
    const currentUserRole = this.currentUser.role;

    return {
      totalRequests: requests.length,
      pendingExecution: requests.filter(r => r.status === 'Pending Execution').length,
      inExecution: requests.filter(r => r.status === 'In Execution').length,
      pendingApproval: requests.filter(r => r.status === 'Pending Approval' || r.status === 'Partially Approved').length,
      approved: requests.filter(r => r.status === 'Approved').length,
      rejected: requests.filter(r => r.status === 'Rejected').length,

      // Executor specific
      assignedToMe: requests.filter(r => r.executorId === currentUserId).length,
      myPendingExecution: requests.filter(r => r.executorId === currentUserId && r.status === 'Pending Execution').length,
      completedToday: requests.filter(r => r.executionDetails !== null).length,
      waitingForApproval: requests.filter(r => r.executorId === currentUserId && (r.status === 'Pending Approval' || r.status === 'Partially Approved')).length,

      // Approver specific
      approver1Pending: requests.filter(r => r.approvals.approver1.status === 'pending').length,
      approver2Pending: requests.filter(r => r.approvals.approver2.status === 'pending').length,
      totalReviewed: requests.filter(r => r.approvals.approver1.status === 'approved' || r.approvals.approver2.status === 'approved' || r.status === 'Rejected').length
    };
  }
}

// Global singleton instance
window.flowStore = new AppStore();
