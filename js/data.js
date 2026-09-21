/**
 * FlowTrack - Production Workflow & Approval Management
 * Seed Data & Domain Models
 */

const SEED_USERS = [
  {
    id: 'USR-001',
    name: 'Siva',
    shortName: 'Siva',
    role: 'creator',
    roleLabel: 'Request Creator',
    department: 'Production Planning',
    email: 'siva@inel.co.in',
    avatar: 'S',
    phone: '+91 98401 23456',
    status: 'Active'
  },
  {
    id: 'USR-002',
    name: 'Kumar Vel',
    shortName: 'Mr. Kumar',
    role: 'executor',
    roleLabel: 'Line Execution Lead',
    department: 'Assembly',
    email: 'kumar.vel@inel.co.in',
    avatar: 'KV',
    phone: '+91 98402 34567',
    status: 'Active'
  },
  {
    id: 'USR-003',
    name: 'Ravi Chandran',
    shortName: 'Mr. Ravi',
    role: 'executor',
    roleLabel: 'Quality & Inspection Lead',
    department: 'Quality Control',
    email: 'ravi.chandran@inel.co.in',
    avatar: 'RC',
    phone: '+91 98403 45678',
    status: 'Active'
  },
  {
    id: 'USR-004',
    name: 'Arjun Das',
    shortName: 'Mr. Arjun',
    role: 'executor',
    roleLabel: 'Packaging Supervisor',
    department: 'Packaging & Warehouse',
    email: 'arjun.das@inel.co.in',
    avatar: 'AD',
    phone: '+91 98404 56789',
    status: 'Active'
  },
  {
    id: 'USR-005',
    name: 'Suresh Menon',
    shortName: 'Mr. Suresh',
    role: 'executor',
    roleLabel: 'Machining Specialist',
    department: 'Machining & Tooling',
    email: 'suresh.menon@inel.co.in',
    avatar: 'SM',
    phone: '+91 98405 67890',
    status: 'Active'
  },
  {
    id: 'USR-006',
    name: 'Raj Sekhar',
    shortName: 'Mr. Raj',
    role: 'approver1',
    roleLabel: 'Approver 1 (Production Manager)',
    department: 'Plant ',
    email: 'raj.sekhar@inel.co.in',
    avatar: 'RS',
    phone: '+91 98406 78901',
    status: 'Active'
  },
  {
    id: 'USR-007',
    name: 'Anand Mohan',
    shortName: 'Mr. Anand',
    role: 'approver2',
    roleLabel: 'Approver 2 (Plant Head / Director)',
    department: 'Executive ',
    email: 'anand.mohan@inel.co.in',
    avatar: 'AM',
    phone: '+91 98407 89012',
    status: 'Active'
  },
  {
    id: 'USR-008',
    name: 'Vikram Joshi',
    shortName: 'Vikram',
    role: 'admin',
    roleLabel: 'System Administrator',
    department: 'Digital  & IT',
    email: 'vikram.joshi@inel.co.in',
    avatar: 'VJ',
    phone: '+91 98408 90123',
    status: 'Active'
  }
];

const INITIAL_REQUESTS = [
  {
    id: 'REQ-1001',
    sNo: 1,
    issueNo: '01',
    date: '2026-09-03',
    escalationDate: '2026-09-03',
    displayDate: '9/3/2026',
    product: 'FWM',
    model: 'U340',
    processOperation: 'Laser marking',
    shift: 'I',
    repeatedOrNew: 'Repeated',
    resp: 'MAINT',
    observation: '•Inspection gauge clamp NG due to this During inspection Timing angle inspection Accuracy NG...\n•After our inspection clamp restored but not properly tightened.. Used magnest of tightening Support',
    evidenceAttachment: {
      id: 'att-evidence-1',
      name: 'Inspection_Gauge_Clamp_NG.svg',
      path: 'images/evidence_clamp_ng.svg',
      size: '240 KB',
      type: 'image',
      uploadedAt: '03 Sep 2026, 09:30 AM',
      caption: 'Inspection gauge clamp NG - Timing angle inspection accuracy error'
    },
    quantity: '1,250',
    unit: 'Units',
    line: 'Laser marking station',
    stage: 'Laser marking',
    creatorId: 'USR-001',
    creatorName: 'Siva',
    executorId: 'USR-002',
    executorName: 'Mr. Kumar',
    status: 'Pending Execution',
    priority: 'High',
    comments: 'Inspection gauge clamp NG due to this During inspection Timing angle inspection Accuracy NG... After our inspection clamp restored but not properly tightened.. Used magnest of tightening Support',
    attachments: [
      {
        id: 'att-evidence-1',
        name: 'Inspection_Gauge_Clamp_NG.svg',
        path: 'images/evidence_clamp_ng.svg',
        size: '240 KB',
        type: 'image',
        uploadedAt: '03 Sep 2026, 09:30 AM',
        caption: 'Inspection gauge clamp NG'
      },
      {
        id: 'att-1',
        name: 'Assembly_Spec_Sheet_Rev4.pdf',
        size: '1.8 MB',
        type: 'pdf',
        uploadedAt: '03 Sep 2026, 10:14 AM'
      },
      {
        id: 'att-2',
        name: 'Fastener_Torque_Diagram.png',
        size: '850 KB',
        type: 'image',
        uploadedAt: '03 Sep 2026, 10:15 AM'
      }
    ],
    executionDetails: null,
    approvals: {
      approver1: {
        userId: 'USR-006',
        name: 'Mr. Raj',
        title: 'Production Manager',
        status: 'waiting', // waiting, pending, approved, rejected
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
        timestamp: '03 Sep 2026, 10:15 AM',
        title: 'Request Created',
        desc: 'Siva created the request for Assembly (1,250 Units)',
        actor: 'Siva ',
        type: 'create'
      },
      {
        timestamp: '03 Sep 2026, 10:17 AM',
        title: 'Assigned to Executor',
        desc: 'Request assigned to Mr. Kumar for Line A execution',
        actor: 'Siva ',
        type: 'assign'
      },
      {
        timestamp: '03 Sep 2026, 10:18 AM',
        title: 'Notification Dispatched',
        desc: 'System email & in-app alert dispatched to Mr. Kumar',
        actor: 'System',
        type: 'notify'
      }
    ]
  },
  {
    id: 'REQ-1002',
    module: 'ihlr',
    reqNo: 1,
    sNo: 2,
    issueNo: '02',
    date: '2026-09-01',
    escalationDate: '2026-09-01',
    displayDate: '9/1/2026',
    problem: 'Low voltage',
    product: 'OLS LONG ARM',
    model: 'OLS LONG ARM',
    problemDetectedAt: 'Final Testing',
    receivedFrom: 'D3',
    analysisDoneBy: 'GURU',
    actualQty: '1',
    fourM: 'MAN',
    resp: 'PROD',
    whyWhyAnalysis: {
      w1: 'Low voltage',
      w2: 'Sensor improper soldering',
      w3: 'Skipped visual inspection',
      w4: '',
      w5: ''
    },
    defectImage: {
      id: 'att-defect-ihlr-1',
      name: 'Defect_Sensor_Improper_Soldering.svg',
      path: 'images/defect_ihlr_sensor.svg',
      size: '210 KB',
      type: 'image',
      uploadedAt: '01 Sep 2026, 11:20 AM',
      caption: 'Defect Image: OLS LONG ARM Low Voltage (Sensor Improper Soldering)'
    },
    processOperation: 'Final Testing',
    shift: 'i',
    repeatedOrNew: 'New',
    observation: 'W1: Low voltage\nW2: Sensor improper soldering\nW3: Skipped visual inspection',
    quantity: '1',
    unit: 'Units',
    line: 'D3 - Final Testing',
    stage: 'Final Testing',
    creatorId: 'USR-001',
    creatorName: 'Siva',
    executorId: 'USR-003',
    executorName: 'Mr. Ravi',
    status: 'Pending Approval',
    priority: 'Critical',
    comments: 'Problem Cause Why-Why Analysis (QA Team): W1: Low voltage -> W2: Sensor improper soldering -> W3: Skipped visual inspection. 4M: MAN, Resp: PROD.',
    attachments: [
      {
        id: 'att-3',
        name: 'Inspection_Standard_ISO2768.pdf',
        size: '2.4 MB',
        type: 'pdf',
        uploadedAt: '03 Sep 2026, 09:30 AM'
      }
    ],
    executionDetails: {
      executionDate: '2026-09-03',
      displayExecutionDate: '03 Sep 2026',
      startTime: '14:00',
      endTime: '18:15',
      actualProduction: '976 Units (4 rejected at QA stage)',
      executionStatus: 'Completed',
      remarks: 'All 976 passing units marked with green QA serial tags. 4 rejected units segregated in quarantine bin #4 for metallographic testing.',
      proofFiles: [
        {
          id: 'prf-1',
          name: 'Laser_Micrometer_Log_Batch980.pdf',
          size: '3.1 MB',
          type: 'pdf',
          uploadedAt: '03 Sep 2026, 18:20 PM'
        },
        {
          id: 'prf-2',
          name: 'QA_Stamp_Chamber_Photo.jpg',
          size: '1.4 MB',
          type: 'image',
          uploadedAt: '03 Sep 2026, 18:22 PM'
        }
      ]
    },
    approvals: {
      approver1: {
        userId: 'USR-006',
        name: 'Mr. Raj',
        title: 'Production Manager',
        status: 'pending',
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
        timestamp: '03 Sep 2026, 09:30 AM',
        title: 'Request Created',
        desc: 'Siva created inspection request for 980 Units',
        actor: 'Siva ',
        type: 'create'
      },
      {
        timestamp: '03 Sep 2026, 09:35 AM',
        title: 'Assigned to Mr. Ravi',
        desc: 'Assigned for Line C Optical Inspection',
        actor: 'Siva ',
        type: 'assign'
      },
      {
        timestamp: '03 Sep 2026, 14:00 PM',
        title: 'Execution Started',
        desc: 'Mr. Ravi commenced inspection batch run',
        actor: 'Mr. Ravi',
        type: 'execute_start'
      },
      {
        timestamp: '03 Sep 2026, 18:25 PM',
        title: 'Execution Completed & Submitted',
        desc: 'Execution finished with 976 units. Uploaded inspection logs and photos.',
        actor: 'Mr. Ravi',
        type: 'execute_submit'
      },
      {
        timestamp: '03 Sep 2026, 18:26 PM',
        title: 'Approval Level 1 Initiated',
        desc: 'Routed to Mr. Raj for Level 1 Production Approval',
        actor: 'System',
        type: 'approval_req'
      }
    ]
  },
  {
    id: 'REQ-1003',
    sNo: 3,
    issueNo: '03',
    date: '2026-09-02',
    escalationDate: '2026-09-02',
    displayDate: '9/2/2026',
    product: 'Regulator Rectifier',
    model: 'M120',
    processOperation: 'High Speed Pack',
    shift: 'II',
    repeatedOrNew: 'Repeated',
    resp: 'PROD',
    observation: '•Vacuum packaging pouch sealing bar temperature drop causing loose crimp.\n•Heater element recalibrated and seal peel test verified.',
    quantity: '3,400',
    unit: 'Units',
    line: 'Line D - High Speed Pack',
    stage: 'Packaging',
    creatorId: 'USR-001',
    creatorName: 'Siva',
    executorId: 'USR-004',
    executorName: 'Mr. Arjun',
    status: 'Partially Approved',
    priority: 'Medium',
    comments: 'Moisture barrier packaging with nitrogen flush and desiccants for export sea container.',
    attachments: [
      {
        id: 'att-4',
        name: 'Export_Packaging_Diagram.pdf',
        size: '1.2 MB',
        type: 'pdf',
        uploadedAt: '02 Sep 2026, 11:00 AM'
      }
    ],
    executionDetails: {
      executionDate: '2026-09-02',
      displayExecutionDate: '02 Sep 2026',
      startTime: '13:30',
      endTime: '19:45',
      actualProduction: '3,400 Units (68 master cartons)',
      executionStatus: 'Completed',
      remarks: 'All pallets stretch-wrapped with corner guards. Seal integrity tested via vacuum bubble test.',
      proofFiles: [
        {
          id: 'prf-3',
          name: 'Pallet_Sealing_Certificate.pdf',
          size: '980 KB',
          type: 'pdf',
          uploadedAt: '02 Sep 2026, 20:00 PM'
        },
        {
          id: 'prf-4',
          name: 'Finished_Pallet_Stack.jpg',
          size: '2.1 MB',
          type: 'image',
          uploadedAt: '02 Sep 2026, 20:02 PM'
        }
      ]
    },
    approvals: {
      approver1: {
        userId: 'USR-006',
        name: 'Mr. Raj',
        title: 'Production Manager',
        status: 'approved',
        timestamp: '03 Sep 2026, 09:10 AM',
        comments: 'Verified pallet count and vacuum seal certification. Level 1 approved.'
      },
      approver2: {
        userId: 'USR-007',
        name: 'Mr. Anand',
        title: 'Plant Head',
        status: 'pending',
        timestamp: null,
        comments: null
      }
    },
    activityTimeline: [
      {
        timestamp: '02 Sep 2026, 11:00 AM',
        title: 'Request Created',
        desc: 'Siva created packaging request for 3,400 Units',
        actor: 'Siva ',
        type: 'create'
      },
      {
        timestamp: '02 Sep 2026, 20:05 PM',
        title: 'Execution Completed',
        desc: 'Mr. Arjun submitted execution details and proofs',
        actor: 'Mr. Arjun',
        type: 'execute_submit'
      },
      {
        timestamp: '03 Sep 2026, 09:10 AM',
        title: 'Level 1 Approved by Mr. Raj',
        desc: 'Production Manager approved. Escalated to Plant Head (Mr. Anand) for final sign-off.',
        actor: 'Mr. Raj',
        type: 'approve_l1'
      }
    ]
  },
  {
    id: 'REQ-1004',
    sNo: 4,
    issueNo: '04',
    date: '2026-09-01',
    escalationDate: '2026-09-01',
    displayDate: '9/1/2026',
    product: 'FWM',
    model: 'U340',
    processOperation: 'Raw Material Assay',
    shift: 'I',
    repeatedOrNew: 'New',
    resp: 'QA',
    observation: '•Raw aluminum extrusion billets batch #AL-992 spectrometer assay verification.\n•Spectrometer purity conforms to ASTM B221 standard.',
    quantity: '2,500',
    unit: 'Kg',
    line: 'Raw Material Intake Silo 3',
    stage: 'Raw Material',
    creatorId: 'USR-001',
    creatorName: 'Siva',
    executorId: 'USR-005',
    executorName: 'Mr. Suresh',
    status: 'Approved',
    priority: 'Normal',
    comments: 'High-grade aluminum extrusion billets batch #AL-992. Verify spectrometer assay report.',
    attachments: [
      {
        id: 'att-5',
        name: 'Mill_Test_Certificate_AL992.pdf',
        size: '1.9 MB',
        type: 'pdf',
        uploadedAt: '01 Sep 2026, 08:30 AM'
      }
    ],
    executionDetails: {
      executionDate: '2026-09-01',
      displayExecutionDate: '01 Sep 2026',
      startTime: '09:00',
      endTime: '13:00',
      actualProduction: '2,500 Kg accepted',
      executionStatus: 'Completed',
      remarks: 'Spectrometer assay matches purity spec 99.8%. Density checks conform to ASTM B221.',
      proofFiles: [
        {
          id: 'prf-5',
          name: 'Spectrometer_Assay_Printout.pdf',
          size: '1.1 MB',
          type: 'pdf',
          uploadedAt: '01 Sep 2026, 13:15 PM'
        }
      ]
    },
    approvals: {
      approver1: {
        userId: 'USR-006',
        name: 'Mr. Raj',
        title: 'Production Manager',
        status: 'approved',
        timestamp: '01 Sep 2026, 15:30 PM',
        comments: 'Metallurgical assay confirmed compliant.'
      },
      approver2: {
        userId: 'USR-007',
        name: 'Mr. Anand',
        title: 'Plant Head',
        status: 'approved',
        timestamp: '02 Sep 2026, 10:00 AM',
        comments: 'Final sign-off granted. Batch released to melting furnace.'
      }
    },
    activityTimeline: [
      {
        timestamp: '01 Sep 2026, 08:30 AM',
        title: 'Request Created',
        desc: 'Siva created Raw Material Intake request',
        actor: 'Siva ',
        type: 'create'
      },
      {
        timestamp: '01 Sep 2026, 13:20 PM',
        title: 'Execution Completed',
        desc: 'Mr. Suresh recorded spectrometer test results',
        actor: 'Mr. Suresh',
        type: 'execute_submit'
      },
      {
        timestamp: '01 Sep 2026, 15:30 PM',
        title: 'Level 1 Approved by Mr. Raj',
        desc: 'Production Manager approved',
        actor: 'Mr. Raj',
        type: 'approve_l1'
      },
      {
        timestamp: '02 Sep 2026, 10:00 AM',
        title: 'Level 2 Final Approved by Mr. Anand',
        desc: 'Plant Head granted final sign-off. Request Completed.',
        actor: 'Mr. Anand',
        type: 'approve_l2'
      }
    ]
  },
  {
    id: 'REQ-1005',
    sNo: 5,
    issueNo: '05',
    date: '2026-09-02',
    escalationDate: '2026-09-02',
    displayDate: '9/2/2026',
    product: 'Stator Coil',
    model: 'V400',
    processOperation: 'Precision CNC Milling',
    shift: 'III',
    repeatedOrNew: 'Repeated',
    resp: 'MAINT',
    observation: '•Spindle #3 thermal expansion caused dimension drift at cycle 1890.\n•Production halted for spindle recalibration and tooling offset update.',
    quantity: '2,100',
    unit: 'Units',
    line: 'Line B - CNC Milling',
    stage: 'Production',
    creatorId: 'USR-001',
    creatorName: 'Siva',
    executorId: 'USR-005',
    executorName: 'Mr. Suresh',
    status: 'Rejected',
    priority: 'High',
    comments: 'Precision turbine housing machining. Tool wear offsets must be logged every 250 cycles.',
    attachments: [
      {
        id: 'att-6',
        name: 'CNC_Tool_Path_Program_GCode.txt',
        size: '640 KB',
        type: 'doc',
        uploadedAt: '02 Sep 2026, 21:00 PM'
      }
    ],
    executionDetails: {
      executionDate: '2026-09-02',
      displayExecutionDate: '02 Sep 2026',
      startTime: '22:00',
      endTime: '05:30',
      actualProduction: '1,890 Units (210 short)',
      executionStatus: 'Partially Completed',
      remarks: 'Spindle #3 thermal expansion caused dimension drift at cycle 1890. Production halted for spindle recalibration.',
      proofFiles: [
        {
          id: 'prf-6',
          name: 'Spindle3_Error_Telemetry.pdf',
          size: '2.8 MB',
          type: 'pdf',
          uploadedAt: '03 Sep 2026, 05:45 AM'
        }
      ]
    },
    approvals: {
      approver1: {
        userId: 'USR-006',
        name: 'Mr. Raj',
        title: 'Production Manager',
        status: 'rejected',
        timestamp: '03 Sep 2026, 08:30 AM',
        comments: 'Dimensional drift exceeded tolerance by 0.045mm on the last 150 units. Rework order must be generated before release.'
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
        timestamp: '02 Sep 2026, 21:00 PM',
        title: 'Request Created',
        desc: 'Siva created CNC production request',
        actor: 'Siva ',
        type: 'create'
      },
      {
        timestamp: '03 Sep 2026, 05:50 AM',
        title: 'Execution Submitted with Variance',
        desc: 'Mr. Suresh logged 210 units shortfall due to spindle temperature issue',
        actor: 'Mr. Suresh',
        type: 'execute_submit'
      },
      {
        timestamp: '03 Sep 2026, 08:30 AM',
        title: 'Request Rejected by Mr. Raj',
        desc: 'Reason: Dimensional drift exceeded tolerance by 0.045mm on last 150 units. Rework mandatory.',
        actor: 'Mr. Raj',
        type: 'reject'
      }
    ]
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-001',
    forUserRole: 'executor',
    forUserId: 'USR-002',
    title: 'New Request Assigned',
    message: 'Request REQ-1001 created by Siva has been assigned to you for execution.',
    requestId: 'REQ-1001',
    time: '12 mins ago',
    timestamp: '03 Sep 2026, 10:18 AM',
    read: false,
    type: 'assigned'
  },
  {
    id: 'NOTIF-002',
    forUserRole: 'approver1',
    forUserId: 'USR-006',
    title: 'Execution Completed - Review Required',
    message: 'Request REQ-1002 has been executed by Mr. Ravi and is waiting for your Level 1 approval.',
    requestId: 'REQ-1002',
    time: '35 mins ago',
    timestamp: '03 Sep 2026, 18:26 PM',
    read: false,
    type: 'approval_needed'
  },
  {
    id: 'NOTIF-003',
    forUserRole: 'approver2',
    forUserId: 'USR-007',
    title: 'Level 1 Approved - Final Sign-off Needed',
    message: 'Request REQ-1003 has been approved by Mr. Raj and is waiting for your Level 2 final sign-off.',
    requestId: 'REQ-1003',
    time: '1 hour ago',
    timestamp: '03 Sep 2026, 09:10 AM',
    read: false,
    type: 'approval_needed'
  },
  {
    id: 'NOTIF-004',
    forUserRole: 'creator',
    forUserId: 'USR-001',
    title: 'Request Approved Successfully',
    message: 'Request REQ-1004 has received final approval from Plant Head (Mr. Anand) and is completed.',
    requestId: 'REQ-1004',
    time: '3 hours ago',
    timestamp: '02 Sep 2026, 10:00 AM',
    read: true,
    type: 'completed'
  },
  {
    id: 'NOTIF-005',
    forUserRole: 'creator',
    forUserId: 'USR-001',
    title: 'Request Rejected',
    message: 'Request REQ-1005 was rejected by Mr. Raj due to tolerance deviation. View notes for action.',
    requestId: 'REQ-1005',
    time: '4 hours ago',
    timestamp: '03 Sep 2026, 08:30 AM',
    read: true,
    type: 'rejected'
  }
];

const WORKFLOW_CONFIG = [
  { step: 1, name: 'Request Creation', actor: 'Creator (Siva)', description: 'Specify production requirements, quantity, line, shift & upload spec drawings', sla: '4 Hours' },
  { step: 2, name: 'Execution on Floor', actor: 'Executor (Kumar/Ravi/Arjun)', description: 'Execute physical batch, record timings, actual yield & attach execution proof', sla: '8 Hours' },
  { step: 3, name: 'Approval 1 (Technical & Ops)', actor: 'Approver 1 (Mr. Raj - Prod Manager)', description: 'Inspect execution metrics, yield variance, and visual proof for compliance', sla: '2 Hours' },
  { step: 4, name: 'Approval 2 (Executive Sign-off)', actor: 'Approver 2 (Mr. Anand - Plant Head)', description: 'Final release authorization for inventory transfer and warehouse dispatch', sla: '2 Hours' },
  { step: 5, name: 'Completion & Archival', actor: 'System & ERP Sync', description: 'Automated audit stamp, email dispatch to all stakeholders, and ledger update', sla: 'Immediate' }
];
