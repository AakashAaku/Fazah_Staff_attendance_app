import { useState, useEffect } from 'react';
import { Users, Clock, Plus, LogOut, Wrench, Package, Car, FileText, Printer, MessageSquare, Save, ShieldCheck, RefreshCw, Calendar, Search, ShoppingBag, Edit, Trash2 } from 'lucide-react';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'jobcards' | 'inspections' | 'staff' | 'worklogs' | 'attendance' | 'inventory' | 'labor' | 'reopened'>('jobcards');
  const [employees, setEmployees] = useState<any[]>([]);
  const [punches, setPunches] = useState<any[]>([]);
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [inventoryParts, setInventoryParts] = useState<any[]>([]);
  const [laborCatalog, setLaborCatalog] = useState<any[]>([]);
  const [selectedJobCard, setSelectedJobCard] = useState<any>(null);

  // JOB CARD MULTI-FILTERS STATE
  const [jobSearchQuery, setJobSearchQuery] = useState<string>('');
  const [jobDateFilter, setJobDateFilter] = useState<string>('ALL'); // ALL, TODAY, or YYYY-MM-DD
  const [jobStaffFilter, setJobStaffFilter] = useState<string>('ALL');
  const [jobSectionFilter, setJobSectionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // WORK TIMELINE & TASK TIME LOGS STATE
  const [workTimelines, setWorkTimelines] = useState<any[]>([]);
  const [selectedTimelineDate, setSelectedTimelineDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedAuditLogsModal, setSelectedAuditLogsModal] = useState<any>(null);
  const [workLogStatusFilter, setWorkLogStatusFilter] = useState<string>('ALL');
  const [workLogStaffSearch, setWorkLogStaffSearch] = useState<string>('');
  const [workLogSectionFilter, setWorkLogSectionFilter] = useState<string>('ALL');
  const [showQuickAssignModal, setShowQuickAssignModal] = useState<boolean>(false);
  const [assignTargetEmployee, setAssignTargetEmployee] = useState<any>(null);
  const [selectedLaborToAssign, setSelectedLaborToAssign] = useState<string>('');
  const [assigningTask, setAssigningTask] = useState<boolean>(false);

  // ATTENDANCE & REOPENED TASKS REPORT STATE
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reopenedReport, setReopenedReport] = useState<any[]>([]);
  const [reopenedReportDate, setReopenedReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [taskToReopen, setTaskToReopen] = useState<any>(null);
  const [reopenReasonInput, setReopenReasonInput] = useState('');

  // Page Title
  useEffect(() => {
    document.title = "Fazah - Admin";
  }, []);

  // Job Card Creation Modal
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    customerName: '',
    customerPhone: '',
    vehiclePlateNumber: '',
    vehicleMake: 'Toyota',
    vehicleModel: '',
    vehicleYear: '2022',
    mileage: 50000,
    assignedSection: 'Mechanical',
    assignedMechanicId: '',
    complaintsText: '',
  });

  // SMART INTAKE INSPECTION MODAL STATE
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionStep, setInspectionStep] = useState<number>(1);
  const [newInspection, setNewInspection] = useState({
    customerName: '',
    customerPhone: '',
    vehiclePlateNumber: '',
    vehicleMake: 'Toyota',
    vehicleModel: '',
    vehicleYear: '2022',
    mileage: 50000,
    fuelLevel: 'half',
    warningLights: [] as string[],
    valuablesChecklist: ['Spare Tire', 'Jack & Wheel Wrench', 'Floor Mats'],
    extraFaults: [] as string[],
    damageMarkers: [] as { id: string; x: number; y: number; view: string; type: string; label: string }[],
    customerSignature: 'Customer Signed Electronically',
    assignedMechanicId: '',
    assignedSection: 'Mechanical',
  });

  const [activeCarView, setActiveCarView] = useState<'front' | 'rear' | 'left' | 'right'>('left');
  const [selectedDamageType, setSelectedDamageType] = useState<'scratch' | 'dent' | 'crack' | 'glass'>('scratch');

  // Advisor Remarks / Notes State
  const [advisorNotes, setAdvisorNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Add Parts/Labor Modals with Vendor Purchase Support
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [partSource, setPartSource] = useState<'inventory' | 'vendor'>('inventory');
  const [showAddLaborModal, setShowAddLaborModal] = useState(false);
  const [showEditLaborModal, setShowEditLaborModal] = useState(false);
  const [laborToEdit, setLaborToEdit] = useState<any>(null);
  const [selectedJobViewTab, setSelectedJobViewTab] = useState<'tasks' | 'timesheet' | 'parts' | 'notes'>('tasks');

  const [newPartItem, setNewPartItem] = useState({
    partName: '',
    partNumber: 'GENERIC',
    quantity: 1,
    unitPrice: 50,
    isVendorPurchase: false,
    vendorName: '',
    vendorInvoiceNumber: '',
    purchaseCost: 0,
  });
  const [newLaborItem, setNewLaborItem] = useState({
    operationName: '',
    section: 'Mechanical',
    estimatedHours: 1,
    hourlyRate: 100,
    assignedMechanicId: ''
  });

  // ERP SYNC / IMPORT JOB CARD MODAL STATE
  const [showErpSyncModal, setShowErpSyncModal] = useState(false);
  const [erpSyncForm, setErpSyncForm] = useState({
    externalErpId: '',
    customerName: '',
    customerPhone: '',
    vehiclePlateNumber: '',
    vehicleMake: 'Toyota',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear().toString(),
    complaintsText: '',
    notes: 'Synced from External ERP',
    tasks: [] as { operationName: string; section: string; stepOrder: number; assignedMechanicId: string; estimatedHours: number; hourlyRate: number }[],
    parts: [] as { partName: string; partNumber: string; quantity: number; unitPrice: number }[],
  });

  const openErpSyncModal = () => {
    setErpSyncForm({
      externalErpId: '',
      customerName: '',
      customerPhone: '',
      vehiclePlateNumber: '',
      vehicleMake: 'Toyota',
      vehicleModel: '',
      vehicleYear: new Date().getFullYear().toString(),
      complaintsText: '',
      notes: 'Synced from External ERP',
      tasks: [],
      parts: [],
    });
    setShowErpSyncModal(true);
  };

  const addErpTaskStep = () => {
    const newStepNum = erpSyncForm.tasks.length + 1;
    setErpSyncForm(prev => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          operationName: '',
          section: 'Denting & Painting',
          stepOrder: newStepNum,
          assignedMechanicId: '',
          estimatedHours: 1,
          hourlyRate: 100,
        }
      ]
    }));
  };

  const removeErpTaskStep = (index: number) => {
    setErpSyncForm(prev => {
      const updated = prev.tasks.filter((_, i) => i !== index).map((t, i) => ({ ...t, stepOrder: i + 1 }));
      return { ...prev, tasks: updated };
    });
  };

  const moveErpTaskStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= erpSyncForm.tasks.length) return;

    setErpSyncForm(prev => {
      const tasksCopy = [...prev.tasks];
      const temp = tasksCopy[index];
      tasksCopy[index] = tasksCopy[targetIndex];
      tasksCopy[targetIndex] = temp;

      const reindexed = tasksCopy.map((t, i) => ({ ...t, stepOrder: i + 1 }));
      return { ...prev, tasks: reindexed };
    });
  };

  // SUPERVISOR QA VERIFICATION MODAL STATE
  const [showQaVerifyModal, setShowQaVerifyModal] = useState(false);
  const [selectedQaLabor, setSelectedQaLabor] = useState<any>(null);
  const [qaNotesInput, setQaNotesInput] = useState('');

  // JOB CARD REOPEN FOR REWORK MODAL STATE
  const [showReopenJobModal, setShowReopenJobModal] = useState(false);
  const [reopenReasonText, setReopenReasonText] = useState('');

  // Add & Edit Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ fullName: '', employeeCode: '', pin: '', branchId: '', jobTitle: 'Mechanic' });

  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [editStaffForm, setEditStaffForm] = useState({
    fullName: '',
    employeeCode: '',
    jobTitle: 'Mechanic',
    status: 'active',
    pin: '',
  });

  const CAR_MAKES = ['Toyota', 'Nissan', 'Honda', 'Lexus', 'Ford', 'Hyundai', 'Kia', 'Mercedes', 'BMW', 'Audi', 'Chevrolet', 'Mitsubishi'];
  const SECTIONS = ['Mechanical', 'Denting & Painting', 'Electrical', 'Tinting', 'Floor Cleaning', 'Service Advisor', 'Sales Advisor', 'Accountant'];
  const JOB_TITLES = ['Mechanic', 'Electrician', 'Denting & Painting Technician', 'Tinter', 'Floor Cleaner', 'Service Advisor', 'Sales Advisor', 'Accountant', 'Parts Specialist', 'Workshop Manager'];
  
  const WARNING_LIGHT_OPTIONS = ['Check Engine', 'ABS Light', 'Airbag Light', 'TPMS Pressure', 'Low Oil Light', 'Brake Warning'];
  const VALUABLE_OPTIONS = ['Spare Tire', 'Jack & Wheel Wrench', 'Floor Mats', 'Personal Belongings Removed', 'Dash Cam / Screen'];
  const EXTRA_FAULT_OPTIONS = ['Front Brake Pads Worn (Below 3mm)', 'Engine Oil Leak Under Chassis', 'Battery Low Voltage Output', 'AC Cabin Filter Clogged', 'Tire Tread Worn Out'];

  const DAMAGE_TYPES = [
    { type: 'scratch', label: '🟡 Scratch', color: 'bg-amber-400 border-amber-600 text-slate-900' },
    { type: 'dent', label: '🔴 Dent', color: 'bg-red-500 border-red-700 text-white' },
    { type: 'crack', label: '🟠 Paint Crack', color: 'bg-orange-500 border-orange-700 text-white' },
    { type: 'glass', label: '🔵 Windshield Chip', color: 'bg-blue-500 border-blue-700 text-white' },
  ];

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, activeTab, selectedTimelineDate, selectedAttendanceDate, reopenedReportDate]);

  const fetchData = async () => {
    try {
      if (activeTab === 'jobcards') {
        const res = await fetch('/api/job-cards');
        if (res.ok) setJobCards(await res.json());
        const empRes = await fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } });
        if (empRes.ok) setEmployees(await empRes.ok ? await empRes.json() : []);
      } else if (activeTab === 'inspections') {
        const res = await fetch('/api/job-cards/inspections');
        if (res.ok) setInspections(await res.json());
      } else if (activeTab === 'staff') {
        const res = await fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Unauthorized');
        setEmployees(await res.json());
      } else if (activeTab === 'worklogs') {
        const res = await fetch(`/api/kiosk/admin/work-timeline?date=${selectedTimelineDate}`);
        if (res.ok) setWorkTimelines(await res.json());
        const jcRes = await fetch('/api/job-cards');
        if (jcRes.ok) setJobCards(await jcRes.json());
        const empRes = await fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } });
        if (empRes.ok) setEmployees(await empRes.json());
      } else if (activeTab === 'attendance') {
        const res = await fetch(`/api/kiosk/admin/punches?date=${selectedAttendanceDate}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setPunches(await res.json());
      } else if (activeTab === 'reopened') {
        const res = await fetch(`/api/kiosk/admin/reopened-tasks-report?date=${reopenedReportDate}`);
        if (res.ok) setReopenedReport(await res.json());
      } else if (activeTab === 'inventory') {
        const res = await fetch('/api/job-cards/inventory-parts');
        if (res.ok) setInventoryParts(await res.json());
      } else if (activeTab === 'labor') {
        const res = await fetch('/api/job-cards/labor-catalog');
        if (res.ok) setLaborCatalog(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      if (err instanceof Error && err.message === 'Unauthorized') handleLogout();
    }
  };

  const handleReopenTaskSubmit = async () => {
    if (!taskToReopen || !reopenReasonInput.trim()) return;
    try {
      const res = await fetch(`/api/kiosk/admin/tasks/${taskToReopen.id}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reopenReasonInput.trim() })
      });
      if (res.ok) {
        setShowReopenModal(false);
        setTaskToReopen(null);
        setReopenReasonInput('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem('adminToken', data.access_token);
    } catch (err) {
      setLoginError('Login failed. Please check your credentials.');
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('adminToken');
  };

  const formatMinutes = (mins: number) => {
    if (!mins || mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const handleCarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const damageObj = DAMAGE_TYPES.find(d => d.type === selectedDamageType);
    const newMarker = {
      id: Math.random().toString(36).substring(7),
      x,
      y,
      view: activeCarView,
      type: selectedDamageType,
      label: damageObj?.label || selectedDamageType,
    };

    setNewInspection(prev => ({
      ...prev,
      damageMarkers: [...prev.damageMarkers, newMarker],
    }));
  };

  const removeDamageMarker = (id: string) => {
    setNewInspection(prev => ({
      ...prev,
      damageMarkers: prev.damageMarkers.filter(m => m.id !== id),
    }));
  };

  const toggleArrayItem = (key: 'warningLights' | 'valuablesChecklist' | 'extraFaults', value: string) => {
    setNewInspection(prev => {
      const list = prev[key] || [];
      const updated = list.includes(value) ? list.filter(i => i !== value) : [...list, value];
      return { ...prev, [key]: updated };
    });
  };

  const handleSaveAndConvertInspection = async () => {
    try {
      const resInsp = await fetch('/api/job-cards/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInspection)
      });

      if (!resInsp.ok) throw new Error('Failed to create inspection');
      const createdInsp = await resInsp.json();

      if (createdInsp) {
        const resConvert = await fetch(`/api/job-cards/inspections/${createdInsp.id}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignedMechanicId: newInspection.assignedMechanicId || null,
            assignedSection: newInspection.assignedSection || 'Mechanical'
          })
        });

        if (resConvert.ok) {
          setShowInspectionModal(false);
          setActiveTab('jobcards');
          fetchData();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSingleJobCard = async (jobId: string) => {
    try {
      const res = await fetch(`/api/job-cards/${jobId}`);
      if (res.ok) {
        setSelectedJobCard(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleErpSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const complaints = erpSyncForm.complaintsText
        ? erpSyncForm.complaintsText.split('\n').filter(Boolean)
        : ['Scheduled Repair Work'];
      const res = await fetch('/api/job-cards/sync-erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...erpSyncForm,
          complaints,
        })
      });
      if (res.ok) {
        setShowErpSyncModal(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQaVerifySubmit = async (qaPassed: boolean) => {
    if (!selectedQaLabor) return;
    try {
      const res = await fetch(`/api/job-cards/labors/${selectedQaLabor.id}/qa-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qaPassed,
          qaNotes: qaNotesInput,
        })
      });
      if (res.ok) {
        setShowQaVerifyModal(false);
        setSelectedQaLabor(null);
        setQaNotesInput('');
        if (selectedJobCard) fetchSingleJobCard(selectedJobCard.id);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReopenJobSubmit = async () => {
    if (!selectedJobCard) return;
    try {
      const res = await fetch(`/api/job-cards/${selectedJobCard.id}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reopenReason: reopenReasonText })
      });
      if (res.ok) {
        setShowReopenJobModal(false);
        setReopenReasonText('');
        fetchSingleJobCard(selectedJobCard.id);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFastJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/job-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newJob,
          complaints: newJob.complaintsText ? [newJob.complaintsText] : ['General Vehicle Service']
        })
      });
      if (res.ok) {
        setShowAddJobModal(false);
        setNewJob({
          customerName: '', customerPhone: '', vehiclePlateNumber: '', vehicleMake: 'Toyota',
          vehicleModel: '', vehicleYear: '2022', mileage: 50000, assignedSection: 'Mechanical',
          assignedMechanicId: '', complaintsText: ''
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSingleJobDetails = async (jobId: string) => {
    try {
      const res = await fetch(`/api/job-cards/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedJobCard(data);
        setAdvisorNotes(data.notes || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedJobCard) return;
    setSavingNotes(true);
    try {
      await fetch(`/api/job-cards/${selectedJobCard.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: advisorNotes, advisorName: 'Sales Advisor' })
      });
      fetchSingleJobDetails(selectedJobCard.id);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAddPartToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobCard) return;
    try {
      await fetch(`/api/job-cards/${selectedJobCard.id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPartItem,
          isVendorPurchase: partSource === 'vendor'
        })
      });
      setShowAddPartModal(false);
      setNewPartItem({
        partName: '', partNumber: 'GENERIC', quantity: 1, unitPrice: 50,
        isVendorPurchase: false, vendorName: '', vendorInvoiceNumber: '', purchaseCost: 0
      });
      fetchSingleJobDetails(selectedJobCard.id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLaborToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobCard) return;
    try {
      const res = await fetch(`/api/job-cards/${selectedJobCard.id}/labors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLaborItem)
      });
      if (res.ok) {
        setShowAddLaborModal(false);
        setNewLaborItem({ operationName: '', section: 'Mechanical', estimatedHours: 1, hourlyRate: 100, assignedMechanicId: '' });
        fetchSingleJobDetails(selectedJobCard.id);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInlineAssignLabor = async (laborId: string, employeeId: string) => {
    try {
      const res = await fetch(`/api/job-cards/labors/${laborId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      if (res.ok) {
        if (selectedJobCard) fetchSingleJobDetails(selectedJobCard.id);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLabor = async (laborId: string) => {
    if (!confirm('Are you sure you want to remove this labor task?')) return;
    try {
      const res = await fetch(`/api/job-cards/labors/${laborId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedJobCard) fetchSingleJobDetails(selectedJobCard.id);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLaborSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!laborToEdit) return;
    try {
      const res = await fetch(`/api/job-cards/labors/${laborToEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: laborToEdit.operationName,
          section: laborToEdit.section,
          assignedMechanicId: laborToEdit.assignedMechanicId || null,
          estimatedHours: parseFloat(laborToEdit.estimatedHours) || 1,
          hourlyRate: parseFloat(laborToEdit.hourlyRate) || 0,
        })
      });
      if (res.ok) {
        setShowEditLaborModal(false);
        setLaborToEdit(null);
        if (selectedJobCard) fetchSingleJobDetails(selectedJobCard.id);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newStaff,
          branchId: '22222222-2222-2222-2222-222222222222'
        })
      });
      if (res.ok) {
        setShowAddStaffModal(false);
        setNewStaff({ fullName: '', employeeCode: '', pin: '', branchId: '', jobTitle: 'Mechanic' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditStaffModal = (emp: any) => {
    setEditingStaff(emp);
    setEditStaffForm({
      fullName: emp.fullName || '',
      employeeCode: emp.employeeCode || '',
      jobTitle: emp.jobTitle || 'Mechanic',
      status: emp.status || 'active',
      pin: '',
    });
    setShowEditStaffModal(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      const bodyPayload: any = {
        fullName: editStaffForm.fullName,
        employeeCode: editStaffForm.employeeCode,
        jobTitle: editStaffForm.jobTitle,
        status: editStaffForm.status,
      };
      if (editStaffForm.pin && editStaffForm.pin.trim().length > 0) {
        bodyPayload.pin = editStaffForm.pin.trim();
      }

      const res = await fetch(`/api/employees/${editingStaff.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        setShowEditStaffModal(false);
        setEditingStaff(null);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to update employee details');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // JOB CARDS ADVANCED FILTERING
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredJobCards = jobCards.filter(j => {
    // Status Filter
    if (statusFilter === 'COMPLETED' && !(j.status === 'COMPLETED' || j.status === 'READY')) return false;
    if (statusFilter === 'IN_PROGRESS' && j.status !== 'IN_PROGRESS') return false;
    if (statusFilter === 'PAUSED' && j.status !== 'PAUSED') return false;

    // Staff Filter
    if (jobStaffFilter !== 'ALL' && j.assignedMechanicId !== jobStaffFilter) return false;

    // Section Filter
    if (jobSectionFilter !== 'ALL' && j.assignedSection !== jobSectionFilter) return false;

    // Date Filter
    if (jobDateFilter === 'TODAY') {
      const createdDate = new Date(j.createdAt).toISOString().split('T')[0];
      if (createdDate !== todayStr) return false;
    } else if (jobDateFilter !== 'ALL') {
      const createdDate = new Date(j.createdAt).toISOString().split('T')[0];
      if (createdDate !== jobDateFilter) return false;
    }

    // Search Query
    if (jobSearchQuery) {
      const q = jobSearchQuery.toLowerCase();
      const matchNum = j.jobNumber?.toLowerCase().includes(q);
      const matchPlate = j.vehiclePlateNumber?.toLowerCase().includes(q);
      const matchCust = j.customerName?.toLowerCase().includes(q);
      const matchModel = j.vehicleModel?.toLowerCase().includes(q);
      if (!matchNum && !matchPlate && !matchCust && !matchModel) return false;
    }

    return true;
  });

  // KPI Calculations for Job Cards
  const activeJobsCount = jobCards.filter(j => j.status === 'IN_PROGRESS').length;
  const pausedJobsCount = jobCards.filter(j => j.status === 'PAUSED').length;
  const completedTodayCount = jobCards.filter(j => {
    const isCompleted = j.status === 'COMPLETED' || j.status === 'READY';
    const cDate = j.completedAt ? new Date(j.completedAt).toISOString().split('T')[0] : null;
    return isCompleted && (cDate === todayStr || !cDate);
  }).length;
  const totalRevenueToday = jobCards.reduce((sum, j) => sum + (j.grandTotal || 0), 0);

  // Work Log KPIs & Filters
  const workingCount = workTimelines.filter(w => w.liveStatus?.state === 'WORKING').length;
  const pausedCount = workTimelines.filter(w => w.liveStatus?.state === 'PAUSED').length;
  const freeCount = workTimelines.filter(w => w.liveStatus?.state === 'FREE').length;
  const offCount = workTimelines.filter(w => w.liveStatus?.state === 'CLOCKED_OUT' || w.liveStatus?.state === 'NOT_CLOCKED_IN').length;
  const totalTaskMinsToday = workTimelines.reduce((sum, w) => sum + (w.stats?.activeTaskMinutes || 0), 0);

  const openLaborOperations = jobCards.flatMap(jc => {
    if (!jc.labors || !Array.isArray(jc.labors)) return [];
    return jc.labors
      .filter((l: any) => l.status === 'PENDING' || l.status === 'HANDOVER_PENDING' || l.status === 'UNASSIGNED' || !l.assignedMechanicId)
      .map((l: any) => ({
        ...l,
        jobCardNumber: jc.jobNumber,
        externalErpId: jc.externalErpId,
        customerName: jc.customerName,
        vehiclePlateNumber: jc.vehiclePlateNumber,
        vehicleModel: jc.vehicleModel,
        jobCardId: jc.id
      }));
  });

  const handleQuickAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLaborToAssign || !assignTargetEmployee) return;
    setAssigningTask(true);
    try {
      const res = await fetch(`/api/job-cards/labors/${selectedLaborToAssign}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: assignTargetEmployee.id })
      });
      if (res.ok) {
        setShowQuickAssignModal(false);
        setAssignTargetEmployee(null);
        setSelectedLaborToAssign('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to assign task', err);
    } finally {
      setAssigningTask(false);
    }
  };

  const filteredWorkTimelines = workTimelines.filter(w => {
    if (workLogStatusFilter === 'WORKING' && w.liveStatus?.state !== 'WORKING') return false;
    if (workLogStatusFilter === 'FREE' && w.liveStatus?.state !== 'FREE') return false;
    if (workLogStatusFilter === 'PAUSED' && w.liveStatus?.state !== 'PAUSED') return false;
    if (workLogStatusFilter === 'CLOCKED_OUT' && w.liveStatus?.state !== 'CLOCKED_OUT' && w.liveStatus?.state !== 'NOT_CLOCKED_IN') return false;

    if (workLogSectionFilter !== 'ALL') {
      const title = (w.employee?.jobTitle || '').toLowerCase();
      const sec = workLogSectionFilter.toLowerCase();
      if (!title.includes(sec)) return false;
    }

    if (workLogStaffSearch) {
      const q = workLogStaffSearch.toLowerCase();
      const matchName = w.employee?.fullName?.toLowerCase().includes(q);
      const matchCode = w.employee?.employeeCode?.toLowerCase().includes(q);
      const matchRole = w.employee?.jobTitle?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchRole) return false;
    }

    return true;
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 text-slate-800 font-sans">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl w-full max-w-md flex flex-col items-center">
          <img src="/logo.png" alt="FAZAH AUTO GARAGE" className="w-24 h-24 object-contain mb-4" />
          <h2 className="text-2xl font-black text-slate-900 text-center">
            FAZAH <span className="text-lime-600">GARAGE</span> <span className="text-blue-600">ADMIN</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1 mb-6 text-center">Service Advisor & Manager Console</p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 focus:outline-none focus:border-blue-500 font-medium"
                required
                placeholder="admin@fazahgarage.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>
            {loginError && <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-200 font-semibold">{loginError}</div>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-md transition-transform active:scale-95 text-base">
              Access Admin Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="FAZAH Logo" className="h-11 w-11 object-contain" />
          <div>
            <h1 className="text-xl font-black tracking-wide text-slate-900 leading-tight">
              FAZAH <span className="text-lime-600">AUTO</span> <span className="text-blue-600">GARAGE</span>
            </h1>
            <span className="text-xs text-slate-500 font-semibold">Service Advisor & Manager Console</span>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Navigation Tabs - Responsive Compact Segmented Control Bar */}
        <div className="bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 shadow-inner">
          {[
            { id: 'jobcards', label: 'Job Cards', icon: Wrench, count: jobCards.length },
            { id: 'inspections', label: 'Inspections', icon: ShieldCheck, count: inspections.length },
            { id: 'worklogs', label: 'Work & Free Staff', icon: Clock, count: workTimelines.length },
            { id: 'staff', label: 'Staff Roster', icon: Users, count: employees.length },
            { id: 'attendance', label: 'Attendance', icon: Clock, count: punches.length },
            { id: 'reopened', label: 'Reopens', icon: RefreshCw, count: reopenedReport.length },
            { id: 'inventory', label: 'Parts Stock', icon: Package, count: inventoryParts.length },
            { id: 'labor', label: 'Labor Rates', icon: FileText, count: laborCatalog.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedJobCard(null); }}
                className={`py-2.5 px-2 rounded-xl font-bold text-xs flex items-center justify-between gap-1 transition-all w-full ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400'
                    : 'bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/60 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon size={14} className={`shrink-0 ${isActive ? 'text-lime-300' : 'text-slate-500'}`} />
                  <span className="truncate font-bold tracking-tight">{tab.label}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                  isActive ? 'bg-blue-700/90 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: JOB CARDS & REPAIR BAYS */}
        {activeTab === 'jobcards' && !selectedJobCard && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Car className="text-blue-600" /> Active Job Cards & Workshop Queue
                </h3>
                <p className="text-xs text-slate-500 font-medium">Create job cards, track active repairs, vendor purchases, and detailed reports</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={openErpSyncModal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-3 rounded-2xl shadow-md flex items-center gap-2 transition-transform active:scale-95 text-sm"
                >
                  <RefreshCw size={18} /> Sync / Copy ERP Job Card
                </button>
                <button 
                  onClick={() => setShowInspectionModal(true)}
                  className="bg-lime-600 hover:bg-lime-700 text-white font-black px-4 py-3 rounded-2xl shadow-md flex items-center gap-2 transition-transform active:scale-95 text-sm"
                >
                  <ShieldCheck size={18} /> Smart Vehicle Intake & Inspection
                </button>
                <button 
                  onClick={() => setShowAddJobModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-3 rounded-2xl shadow-md flex items-center gap-2 transition-transform active:scale-95 text-sm"
                >
                  <Plus size={18} /> Fast Job Card
                </button>
              </div>
            </div>

            {/* JOB CARDS KPI METRICS COUNTER BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                <span className="text-xs text-slate-500 font-bold uppercase block">Total Job Cards</span>
                <span className="text-2xl font-black text-slate-900">{jobCards.length}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
                <span className="text-xs text-emerald-700 font-bold uppercase block">🟢 Active Repairing</span>
                <span className="text-2xl font-black text-emerald-800">{activeJobsCount}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center">
                <span className="text-xs text-amber-700 font-bold uppercase block">⏸️ Paused / Waiting</span>
                <span className="text-2xl font-black text-amber-800">{pausedJobsCount}</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-center">
                <span className="text-xs text-blue-700 font-bold uppercase block">✅ Completed Today</span>
                <span className="text-2xl font-black text-blue-800">{completedTodayCount}</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl text-center">
                <span className="text-xs text-purple-700 font-bold uppercase block">💰 Total Value</span>
                <span className="text-2xl font-black text-purple-900 font-mono">{totalRevenueToday} AED</span>
              </div>
            </div>

            {/* ADVANCED MULTI-FILTER TOOLBAR */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                {/* Search Bar */}
                <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-2 rounded-xl w-full md:w-72">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={jobSearchQuery}
                    onChange={e => setJobSearchQuery(e.target.value)}
                    placeholder="Search Job #, Plate, Customer..."
                    className="w-full text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* Filter Selectors */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
                  {/* Date Filter */}
                  <select
                    value={jobDateFilter}
                    onChange={e => setJobDateFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                  >
                    <option value="ALL">📅 All Dates</option>
                    <option value="TODAY">📅 Today Only</option>
                  </select>

                  {/* Staff Filter */}
                  <select
                    value={jobStaffFilter}
                    onChange={e => setJobStaffFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                  >
                    <option value="ALL">👤 All Assigned Staff</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
                    ))}
                  </select>

                  {/* Section Filter */}
                  <select
                    value={jobSectionFilter}
                    onChange={e => setJobSectionFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                  >
                    <option value="ALL">🔧 All Sections</option>
                    {SECTIONS.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  >
                    <option value="ALL">Status: All</option>
                    <option value="IN_PROGRESS">Status: In Progress</option>
                    <option value="PAUSED">Status: Paused</option>
                    <option value="COMPLETED">Status: Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* JOB CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobCards.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 font-medium">No job cards match your filter criteria.</div>
              ) : filteredJobCards.map(job => {
                const partsCount = job.parts?.length || 0;
                const vendorParts = job.parts?.filter((part: any) => part.isVendorPurchase) || [];
                const laborsCount = job.labors?.length || 0;
                const totalMinutes = job.labors?.reduce((sum: number, l: any) => sum + (l.actualMinutes || 0), 0) || 0;
                const unassignedLabors = job.labors?.filter((l: any) => !l.assignedMechanicId) || [];

                return (
                  <div key={job.id} className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 p-5 rounded-3xl transition-all flex flex-col justify-between gap-4 shadow-sm hover:shadow-md group">
                    <div>
                      {/* Job Header: Prominent Job ID & Status */}
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl font-black text-sm">
                          {job.jobNumber}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          job.status === 'IN_PROGRESS' ? 'bg-lime-100 text-lime-800 border border-lime-300' :
                          job.status === 'PAUSED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          job.status === 'COMPLETED' || job.status === 'READY' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {job.status}
                        </span>
                      </div>

                      {/* Vehicle Details */}
                      <div className="flex items-center justify-between mt-1">
                        <h4 className="text-base font-black text-slate-900 group-hover:text-blue-600">
                          {job.vehicleMake} {job.vehicleModel}
                        </h4>
                        <span className="text-xs text-lime-700 font-mono font-bold bg-lime-50 px-2 py-0.5 rounded-md border border-lime-200">
                          {job.vehiclePlateNumber}
                        </span>
                      </div>

                      {/* Total Logged Work Time Banner */}
                      <div className="mt-2.5 flex items-center justify-between text-xs bg-slate-100 p-2 rounded-xl text-slate-700 font-semibold border border-slate-200/80">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock size={13} className="text-blue-600" /> Tracked Time:
                        </span>
                        <span className="font-mono font-bold text-blue-700">{formatMinutes(totalMinutes)}</span>
                      </div>

                      {/* Job Operations Summary with Staff Assignment */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                          <span>🔧 Department Tasks ({laborsCount}):</span>
                          {unassignedLabors.length > 0 && (
                            <span className="text-amber-600 font-bold">⚠️ {unassignedLabors.length} Unassigned</span>
                          )}
                        </div>

                        {(!job.labors || job.labors.length === 0) ? (
                          <div className="text-[11px] text-slate-400 italic bg-white p-2 rounded-xl border border-dashed border-slate-200 text-center">
                            No tasks added. Click "Manage Details" to add jobs.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {job.labors.map((l: any, idx: number) => (
                              <div key={l.id} className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center text-[11px]">
                                <div className="flex items-center gap-1.5 truncate mr-2">
                                  <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-mono text-[9px] flex items-center justify-center shrink-0">
                                    {l.stepOrder || idx + 1}
                                  </span>
                                  <span className="font-bold text-slate-800 truncate">{l.operationName}</span>
                                  <span className="text-[10px] text-slate-500 font-medium shrink-0">({l.section})</span>
                                </div>

                                <div className="shrink-0 flex items-center gap-1">
                                  {l.assignedMechanic ? (
                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded border border-blue-200">
                                      👤 {l.assignedMechanic.fullName}
                                    </span>
                                  ) : (
                                    <select
                                      value=""
                                      onClick={e => e.stopPropagation()}
                                      onChange={e => handleInlineAssignLabor(l.id, e.target.value)}
                                      className="text-[10px] bg-amber-50 text-amber-900 border border-amber-300 rounded font-bold px-1.5 py-0.5 cursor-pointer"
                                    >
                                      <option value="">⚠️ Assign Staff</option>
                                      {employees.filter(emp => emp.status === 'active').map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Parts Summary Badge */}
                      <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
                        <span className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-bold">
                          📦 {partsCount} Parts Used
                        </span>
                        {vendorParts.length > 0 && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <ShoppingBag size={10} /> {vendorParts.length} Vendor Purchase
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-xs">
                      <span className="font-mono font-bold text-slate-900 text-sm">{job.grandTotal || 0} AED</span>
                      <button
                        type="button"
                        onClick={() => fetchSingleJobDetails(job.id)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                      >
                        Manage & Details ➔
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SELECTED JOB CARD DETAILS VIEW */}
        {activeTab === 'jobcards' && selectedJobCard && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
            {/* Header: Job Card ID, Vehicle, Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
              <div>
                <button onClick={() => setSelectedJobCard(null)} className="text-xs font-bold text-blue-600 hover:underline mb-1 flex items-center gap-1">
                  ← Back to Job Cards List
                </button>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    Job Card: <span className="font-mono text-indigo-700">{selectedJobCard.jobNumber}</span>
                  </h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedJobCard.status === 'IN_PROGRESS' ? 'bg-lime-100 text-lime-800 border border-lime-300' :
                    selectedJobCard.status === 'PAUSED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    selectedJobCard.status === 'COMPLETED' || selectedJobCard.status === 'READY' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedJobCard.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Vehicle: <strong className="text-slate-800">{selectedJobCard.vehicleMake} {selectedJobCard.vehicleModel}</strong> • Plate #: <strong className="text-lime-700 font-mono">{selectedJobCard.vehiclePlateNumber}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedJobViewTab('timesheet')}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Clock size={15} /> View Timesheet
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-300 transition-all"
                >
                  <Printer size={15} /> Print Invoice
                </button>
              </div>
            </div>

            {/* TAB SELECTOR INSIDE JOB CARD */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedJobViewTab('tasks')}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedJobViewTab === 'tasks' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <Wrench size={14} /> Job Tasks & Assignment ({selectedJobCard.labors?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setSelectedJobViewTab('timesheet')}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedJobViewTab === 'timesheet' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <Clock size={14} /> ⏱️ Timesheet & Work Logs ({selectedJobCard.logs?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setSelectedJobViewTab('parts')}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedJobViewTab === 'parts' ? 'bg-lime-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <Package size={14} /> Parts & Materials ({selectedJobCard.parts?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setSelectedJobViewTab('notes')}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedJobViewTab === 'notes' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <MessageSquare size={14} /> Advisor Notes & Totals
              </button>
            </div>

            {/* INNER TAB 1: JOB OPERATIONS & ASSIGNMENT */}
            {selectedJobViewTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <Wrench className="text-blue-600" /> Sequential Department Job Tasks
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">Assign staff members to each task. Ground staff will track time & complete inter-department QWC handovers.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddLaborModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                  >
                    <Plus size={15} /> Add New Job Task
                  </button>
                </div>

                {(!selectedJobCard.labors || selectedJobCard.labors.length === 0) ? (
                  <div className="py-12 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    No job operations added yet. Click <strong>'➕ Add New Job Task'</strong> above to assign work.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedJobCard.labors.map((l: any, idx: number) => (
                      <div key={l.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 transition-all">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {l.stepOrder || idx + 1}
                            </span>
                            <h5 className="font-black text-slate-900 text-sm truncate">{l.operationName}</h5>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold rounded-md text-[10px]">
                              {l.section}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                              l.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              l.status === 'PAUSED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              l.status === 'QA_PENDING' ? 'bg-purple-100 text-purple-800 border border-purple-300 animate-pulse' :
                              l.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {l.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pl-8">
                            <span><strong>Est. Hours:</strong> {l.estimatedHours}h</span>
                            <span>• <strong>Actual Logged:</strong> <span className="font-mono font-bold text-blue-700">{formatMinutes(l.actualMinutes)}</span></span>
                            <span>• <strong>Rate:</strong> {l.hourlyRate} AED/h</span>
                            <span>• <strong>Total Price:</strong> <span className="font-bold text-slate-900">{l.totalPrice} AED</span></span>
                            {l.pauseReason && <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">⏸️ {l.pauseReason}</span>}
                          </div>
                        </div>

                        {/* Direct Technician Assignment Dropdown & Actions */}
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pl-8 md:pl-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Assign Staff:</span>
                            <select
                              value={l.assignedMechanicId || ''}
                              onChange={e => handleInlineAssignLabor(l.id, e.target.value)}
                              className={`text-xs font-bold rounded-xl px-3 py-2 border transition-all ${
                                l.assignedMechanicId
                                  ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-2xs'
                                  : 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-300/40 animate-pulse'
                              }`}
                            >
                              <option value="">⚠️ Unassigned - Select Staff</option>
                              {employees.filter(emp => emp.status === 'active').map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.fullName} ({emp.employeeCode} - {emp.jobTitle})
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => { setLaborToEdit(l); setShowEditLaborModal(true); }}
                            className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-300 rounded-xl transition-all"
                            title="Edit Job Task Details"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLabor(l.id)}
                            className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-300 rounded-xl transition-all"
                            title="Delete Task"
                          >
                            <Trash2 size={14} />
                          </button>

                          {l.status === 'QA_PENDING' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQaLabor(l);
                                setQaNotesInput('');
                                setShowQaVerifyModal(true);
                              }}
                              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                            >
                              <ShieldCheck size={14} /> Verify QA
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INNER TAB 2: JOB CARD TIMESHEET & ACTIVITY LOGS */}
            {selectedJobViewTab === 'timesheet' && (
              <div className="space-y-6">
                {/* Summary KPI Metrics */}
                {(() => {
                  const totalMins = selectedJobCard.labors?.reduce((sum: number, l: any) => sum + (l.actualMinutes || 0), 0) || 0;
                  const totalEst = selectedJobCard.labors?.reduce((sum: number, l: any) => sum + (l.estimatedHours || 0), 0) || 0;
                  const completedCount = selectedJobCard.labors?.filter((l: any) => l.status === 'COMPLETED').length || 0;
                  const totalCount = selectedJobCard.labors?.length || 0;
                  const uniqueStaff = new Set(selectedJobCard.labors?.filter((l: any) => l.assignedMechanicId).map((l: any) => l.assignedMechanicId)).size;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl text-center">
                        <span className="text-xs text-indigo-700 font-bold uppercase block">⏱️ Total Worked Time</span>
                        <span className="text-2xl font-black font-mono text-indigo-900">{formatMinutes(totalMins)}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">Est. Total: {totalEst}h</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
                        <span className="text-xs text-emerald-700 font-bold uppercase block">✅ Task Progress</span>
                        <span className="text-2xl font-black text-emerald-900">{completedCount} / {totalCount}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% Completed</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-center">
                        <span className="text-xs text-blue-700 font-bold uppercase block">👥 Staff Assigned</span>
                        <span className="text-2xl font-black text-blue-900">{uniqueStaff}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">Technicians</span>
                      </div>
                      <div className="bg-slate-100 border border-slate-300 p-4 rounded-2xl text-center">
                        <span className="text-xs text-slate-600 font-bold uppercase block">📅 Start Date & Time</span>
                        <span className="text-xs font-mono font-bold text-slate-800 block mt-2">
                          {selectedJobCard.startedAt ? new Date(selectedJobCard.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Not Started'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Timesheet Breakdown Table */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <Clock size={16} className="text-indigo-600" /> Job Card Detailed Timesheet Breakdown
                    </h4>
                    <span className="text-xs text-slate-500">Live duration tracked per department operation</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px]">
                        <tr>
                          <th className="p-3">Step #</th>
                          <th className="p-3">Operation Task</th>
                          <th className="p-3">Department</th>
                          <th className="p-3">Assigned Staff</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Est. Time</th>
                          <th className="p-3">Actual Spent</th>
                          <th className="p-3">Started At</th>
                          <th className="p-3">Completed At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!selectedJobCard.labors || selectedJobCard.labors.length === 0) ? (
                          <tr>
                            <td colSpan={9} className="p-6 text-center text-slate-400 italic">No tasks added to timesheet yet.</td>
                          </tr>
                        ) : selectedJobCard.labors.map((l: any, idx: number) => (
                          <tr key={l.id} className="hover:bg-slate-50 font-medium">
                            <td className="p-3 font-mono font-bold text-slate-900">#{l.stepOrder || idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{l.operationName}</td>
                            <td className="p-3 text-slate-600">{l.section}</td>
                            <td className="p-3">
                              {l.assignedMechanic ? (
                                <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {l.assignedMechanic.fullName} ({l.assignedMechanic.employeeCode})
                                </span>
                              ) : (
                                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">Unassigned</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                l.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-800' :
                                l.status === 'PAUSED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono">{l.estimatedHours}h</td>
                            <td className="p-3 font-mono font-bold text-indigo-700">{formatMinutes(l.actualMinutes)}</td>
                            <td className="p-3 font-mono text-slate-500 text-[11px]">
                              {l.startedAt ? new Date(l.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="p-3 font-mono text-slate-500 text-[11px]">
                              {l.completedAt ? new Date(l.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit Activity Trail */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <FileText size={16} className="text-blue-600" /> Action Event Log & Audit Trail
                  </h4>
                  {(!selectedJobCard.logs || selectedJobCard.logs.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No action logs recorded yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {selectedJobCard.logs.map((log: any) => (
                        <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{log.action}</span>
                              {log.employee && (
                                <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                                  by {log.employee.fullName}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-600 block mt-0.5">{log.note || 'Status updated'}</span>
                            {log.reason && <span className="text-amber-700 font-semibold block mt-0.5">Reason: {log.reason}</span>}
                          </div>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* INNER TAB 3: PARTS & INVENTORY */}
            {selectedJobViewTab === 'parts' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Package size={16} className="text-lime-600" /> Issued Parts & Vendor Purchases
                  </h4>
                  <button onClick={() => setShowAddPartModal(true)} className="px-3.5 py-1.5 bg-lime-600 hover:bg-lime-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm">
                    <Plus size={14} /> Add / Purchase Part
                  </button>
                </div>
                {(!selectedJobCard.parts || selectedJobCard.parts.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No parts issued or added to this job card yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedJobCard.parts.map((p: any) => (
                      <div key={p.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-sm">{p.partName}</span>
                            {p.isVendorPurchase && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                                <ShoppingBag size={10} /> Vendor Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 font-mono block mt-0.5">
                            {p.isVendorPurchase 
                              ? `Vendor: ${p.vendorName || 'Outside Vendor'} (Bill #${p.vendorInvoiceNumber || 'N/A'}, Cost: ${p.purchaseCost || 0} AED)` 
                              : `PN: ${p.partNumber} • Qty: ${p.quantity}`}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-lime-700 text-sm">{p.totalPrice} AED</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INNER TAB 4: ADVISOR REMARKS & SUMMARY */}
            {selectedJobViewTab === 'notes' && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <label className="block font-bold text-xs uppercase text-slate-700 flex items-center gap-1">
                    <MessageSquare size={14} className="text-blue-600" /> Sales Advisor Remarks & Notes
                  </label>
                  <textarea
                    value={advisorNotes}
                    onChange={e => setAdvisorNotes(e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                    placeholder="Enter customer special requests, advisor notes..."
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Save size={14} /> {savingNotes ? 'Saving...' : 'Save Advisor Remarks'}
                  </button>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block">Grand Total Invoice Amount (inc. VAT)</span>
                    <span className="text-3xl font-black font-mono text-lime-400">{selectedJobCard.grandTotal || 0} AED</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700">
                      Status: {selectedJobCard.status}
                    </span>

                    {(selectedJobCard.status === 'COMPLETED' || selectedJobCard.status === 'READY') && (
                      <button
                        onClick={() => {
                          setReopenReasonText('');
                          setShowReopenJobModal(true);
                        }}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                      >
                        <RefreshCw size={14} /> Reopen for Customer Rework
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SMART INSPECTIONS */}
        {activeTab === 'inspections' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-lime-600" /> Smart Vehicle Intake Certificates
                </h3>
                <p className="text-xs text-slate-500">View and print 360° pre-existing vehicle damage intake certificates</p>
              </div>
              <button 
                onClick={() => setShowInspectionModal(true)} 
                className="bg-lime-600 hover:bg-lime-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5"
              >
                <Plus size={16} /> New Smart Inspection
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inspections.length === 0 ? (
                <p className="col-span-2 py-8 text-center text-slate-400 italic">No inspection reports generated yet.</p>
              ) : inspections.map(insp => (
                <div key={insp.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-lime-700 text-xs">{insp.inspectionNumber}</span>
                    <span className="px-2 py-0.5 bg-lime-100 text-lime-800 text-[10px] font-bold rounded-md">{insp.status}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{insp.vehicleMake} {insp.vehicleModel} ({insp.vehiclePlateNumber})</h4>
                  <p className="text-xs text-slate-500">Customer: {insp.customerName} ({insp.customerPhone})</p>
                  <p className="text-xs text-slate-600 font-medium">Pre-Existing Damage Markers: {insp.damageMarkers?.length || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STAFF WORK LOG & TIME TRACKING REPORT */}
        {activeTab === 'worklogs' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Clock className="text-blue-600" /> Daily Staff Time Card & Allocation Roster
                </h3>
                <p className="text-xs text-slate-500 font-medium">Real-time attendance & task status per employee with 1-click job assignment for free staff</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 p-2 rounded-2xl">
                  <Calendar size={16} className="text-slate-500" />
                  <input
                    type="date"
                    value={selectedTimelineDate}
                    onChange={e => setSelectedTimelineDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => setSelectedTimelineDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl text-slate-700"
                >
                  Today
                </button>

                <button
                  onClick={() => fetchData()}
                  className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl border border-blue-200"
                  title="Refresh Timeline Data"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* LIVE KPI METRICS HEADER */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center shadow-xs">
                <span className="text-xs text-emerald-700 font-bold uppercase block">🟢 Working Now</span>
                <span className="text-2xl font-black text-emerald-800">{workingCount}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center shadow-xs">
                <span className="text-xs text-amber-700 font-bold uppercase block">⏸️ Currently Paused</span>
                <span className="text-2xl font-black text-amber-800">{pausedCount}</span>
              </div>
              <div className="bg-blue-50 border-2 border-blue-400 p-4 rounded-2xl text-center shadow-sm">
                <span className="text-xs text-blue-800 font-bold uppercase block">🆓 Free / Idle Staff</span>
                <span className="text-2xl font-black text-blue-900">{freeCount}</span>
              </div>
              <div className="bg-slate-100 border border-slate-300 p-4 rounded-2xl text-center shadow-xs">
                <span className="text-xs text-slate-600 font-bold uppercase block">🔴 Off / Clocked Out</span>
                <span className="text-2xl font-black text-slate-700">{offCount}</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl text-center shadow-xs">
                <span className="text-xs text-purple-700 font-bold uppercase block">⌛ Total Task Hours</span>
                <span className="text-2xl font-black text-purple-900 font-mono">{formatMinutes(totalTaskMinsToday)}</span>
              </div>
            </div>

            {/* TOOLBAR: SEARCH, STATUS & SECTION FILTERS */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-2 rounded-xl w-full md:w-72 shadow-xs">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={workLogStaffSearch}
                  onChange={e => setWorkLogStaffSearch(e.target.value)}
                  placeholder="Search staff by name, code or section..."
                  className="w-full text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1 overflow-x-auto">
                  <span className="text-[11px] font-bold text-slate-500 px-1 whitespace-nowrap">Status:</span>
                  {['ALL', 'WORKING', 'FREE', 'PAUSED', 'CLOCKED_OUT'].map(st => (
                    <button
                      key={st}
                      onClick={() => setWorkLogStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        workLogStatusFilter === st
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'CLOCKED_OUT' ? 'CLOCKED OUT' : st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pl-2 border-l border-slate-300">
                  <span className="text-[11px] font-bold text-slate-500 px-1 whitespace-nowrap">Department:</span>
                  {['ALL', 'Mechanical', 'Denting', 'Painting', 'Electrical'].map(sec => (
                    <button
                      key={sec}
                      onClick={() => setWorkLogSectionFilter(sec)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        workLogSectionFilter === sec
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STAFF WORK TIMELINE CARDS - SMOOTH PAGE SCROLL */}
            <div className="flex flex-col gap-6">
              {filteredWorkTimelines.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No staff members match the selected date and filters.
                </div>
              ) : filteredWorkTimelines.map(item => {
                const isFree = item.liveStatus?.state === 'FREE';
                const isWorking = item.liveStatus?.state === 'WORKING';
                const isPaused = item.liveStatus?.state === 'PAUSED';

                return (
                  <div
                    key={item.employee.id}
                    className={`bg-slate-50 border rounded-3xl p-5 shadow-sm space-y-4 transition-all ${
                      isFree
                        ? 'border-l-8 border-l-blue-500 border-blue-200 bg-blue-50/20'
                        : isWorking
                        ? 'border-l-8 border-l-emerald-500 border-slate-200'
                        : isPaused
                        ? 'border-l-8 border-l-amber-500 border-slate-200'
                        : 'border-l-8 border-l-slate-400 border-slate-200 opacity-90'
                    }`}
                  >
                    {/* STAFF HEADER CARD */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm ${
                          isWorking ? 'bg-emerald-600' : isFree ? 'bg-blue-600' : isPaused ? 'bg-amber-600' : 'bg-slate-600'
                        }`}>
                          {item.employee.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900">{item.employee.fullName}</h4>
                            <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                              {item.employee.employeeCode}
                            </span>
                            <span className="text-xs text-slate-600 font-bold px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                              {item.employee.jobTitle || 'Technician'}
                            </span>
                          </div>

                          {item.clockInTime ? (
                            <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                              ⏰ Shift Clock In: {new Date(item.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {item.clockOutTime && ` → Clock Out: ${new Date(item.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic mt-0.5 block">🔴 Not Clocked In Today</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase border shadow-sm ${item.liveStatus?.color}`}>
                          {item.liveStatus?.label}
                        </span>

                        {/* QUICK TASK ASSIGNMENT BUTTON */}
                        <button
                          onClick={() => {
                            setAssignTargetEmployee(item.employee);
                            setShowQuickAssignModal(true);
                          }}
                          className={`px-3.5 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all ${
                            isFree
                              ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                              : 'bg-white border border-blue-300 hover:bg-blue-50 text-blue-700'
                          }`}
                        >
                          <Plus size={14} /> Assign Job Task
                        </button>

                        {item.rawLogs && item.rawLogs.length > 0 && (
                          <button
                            onClick={() => setSelectedAuditLogsModal(item)}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
                          >
                            📜 Audit Trail ({item.rawLogs.length})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* TIMECARD STATS ROW */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">Shift Duration</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{formatMinutes(item.stats?.shiftMinutes)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 font-bold block">Active Work Time</span>
                        <span className="font-mono font-bold text-emerald-700 text-sm">{formatMinutes(item.stats?.activeTaskMinutes)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-700 font-bold block">Paused Time</span>
                        <span className="font-mono font-bold text-amber-700 text-sm">{formatMinutes(item.stats?.pausedMinutes)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-blue-200">
                        <span className="text-[10px] text-blue-700 font-bold block">Free / Idle Time</span>
                        <span className="font-mono font-bold text-blue-700 text-sm">{formatMinutes(item.stats?.freeMinutes)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">Utilization Efficiency</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{item.stats?.efficiencyPercent || 0}%</span>
                      </div>
                    </div>

                    {/* TIMELINE SEGMENTS TABLE */}
                    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Time Range</th>
                            <th className="py-2.5 px-3">Activity / Task Title</th>
                            <th className="py-2.5 px-3">Duration</th>
                            <th className="py-2.5 px-3">Status / Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(!item.segments || item.segments.length === 0) ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-slate-400 italic">No task activity logged for this shift.</td>
                            </tr>
                          ) : (
                            item.segments.map((seg: any) => (
                              <tr key={seg.id} className={`border-b border-slate-100 ${seg.type === 'FREE_TIME' ? 'bg-blue-50/40' : ''}`}>
                                <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                                  {new Date(seg.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {seg.endTime && ` - ${new Date(seg.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">
                                  {seg.title}
                                  {seg.subtitle && <span className="text-[11px] text-slate-500 block font-normal">{seg.subtitle}</span>}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                  {formatMinutes(seg.durationMinutes)}
                                </td>
                                <td className="py-2.5 px-3">
                                  {seg.status === 'FREE' ? (
                                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-[10px]">🆓 Free / Unassigned</span>
                                  ) : seg.status === 'PAUSED' ? (
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-[10px]">⏸️ {seg.pauseReason || 'Paused'}</span>
                                  ) : seg.status === 'COMPLETED' ? (
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-[10px]">✅ Completed</span>
                                      {seg.taskId && (
                                        <button
                                          onClick={() => {
                                            setTaskToReopen({ id: seg.taskId, title: seg.title });
                                            setShowReopenModal(true);
                                          }}
                                          className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-[10px] rounded-md flex items-center gap-1 shadow-xs"
                                        >
                                          <RefreshCw size={11} /> Reopen
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">🟢 In Progress</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: STAFF & SECTIONS */}
        {activeTab === 'staff' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Users className="text-lime-600" /> Garage Staff & Technicians
                </h3>
                <p className="text-xs text-slate-500 font-medium">Manage mechanics, electricians, tinters, denting & painting technicians, service advisors, sales advisors, accountants</p>
              </div>

              <button 
                onClick={() => setShowAddStaffModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2.5 rounded-2xl shadow-md flex items-center gap-2 text-sm"
              >
                <Plus size={18} /> Add New Staff Member
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {employees.map(emp => (
                <div key={emp.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center shadow-xs hover:border-slate-300 transition-all">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{emp.fullName}</h4>
                    <span className="text-xs text-blue-700 font-bold block mt-0.5">
                      {emp.jobTitle || 'Technician'} • Code: <span className="font-mono">{emp.employeeCode}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                      emp.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                      {emp.status}
                    </span>
                    <button
                      onClick={() => openEditStaffModal(emp)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1"
                      title="Edit Staff Member"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ATTENDANCE LOGS (WITH DEFAULT CURRENT DATE & OUT-OF-GRACE HIGHLIGHTING) */}
        {activeTab === 'attendance' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Clock className="text-lime-600" /> Kiosk Attendance Punch Records
                </h3>
                <p className="text-xs text-slate-500 font-medium">Shows current day punches by default. Out of grace time check-ins highlighted in warning color.</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <Calendar size={16} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Date Filter:</span>
                <input
                  type="date"
                  value={selectedAttendanceDate}
                  onChange={e => setSelectedAttendanceDate(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-xl focus:outline-none"
                />
                <button
                  onClick={() => setSelectedAttendanceDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 border-b border-slate-200 text-xs uppercase font-bold">
                  <tr>
                    <th className="py-3 px-3">Employee Name</th>
                    <th className="py-3 px-3">Punch Type & Grace Status</th>
                    <th className="py-3 px-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {punches.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 font-medium italic">
                        No punches recorded for selected date ({selectedAttendanceDate}).
                      </td>
                    </tr>
                  ) : punches.map(p => {
                    const isLate = p.isLate || false;
                    const isDefaultPunchout = p.isDefaultPunchout || false;
                    return (
                      <tr key={p.id} className={`border-b border-slate-100 text-xs ${isLate ? 'bg-amber-50/80 border-l-4 border-l-amber-500' : isDefaultPunchout ? 'bg-blue-50/60 border-l-4 border-l-blue-400' : ''}`}>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {p.employee?.fullName ? (
                            <span>{p.employee.fullName} <span className="text-slate-400 font-mono text-[10px]">({p.employee.employeeCode})</span></span>
                          ) : (
                            p.employeeId
                          )}
                        </td>
                        <td className="py-3 px-3 flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                            p.type === 'IN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-lime-100 text-lime-800 border border-lime-200'
                          }`}>
                            {p.type}
                          </span>
                          {isLate && (
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] rounded-md flex items-center gap-1 shadow-xs">
                              ⚠️ Out of Grace (After 9:10 AM, +{p.lateMinutes}m)
                            </span>
                          )}
                          {isDefaultPunchout && (
                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 font-bold text-[10px] rounded-md flex items-center gap-1 shadow-xs">
                              🌙 Default Punchout (Auto 9:00 PM)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{new Date(p.serverTs).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: REOPENED TASKS REPORT */}
        {activeTab === 'reopened' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <RefreshCw className="text-amber-600" /> Reopened Tasks Audit & Reason Report
                </h3>
                <p className="text-xs text-slate-500 font-medium">Day-wise log of all completed tasks reopened by management along with required admin comments</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <Calendar size={16} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Filter Date:</span>
                <input
                  type="date"
                  value={reopenedReportDate}
                  onChange={e => setSelectedAttendanceDate(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-xl focus:outline-none"
                />
                <button
                  onClick={() => setReopenedReportDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Reopened Date & Time</th>
                    <th className="py-3 px-3">Task Details</th>
                    <th className="py-3 px-3">Assigned Staff</th>
                    <th className="py-3 px-3">Admin Reopen Reason / Remark</th>
                    <th className="py-3 px-3">Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reopenedReport.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium italic">
                        No reopened tasks logged for selected date ({reopenedReportDate}).
                      </td>
                    </tr>
                  ) : (
                    reopenedReport.map(log => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {log.task?.title || 'Shop Floor Task'}
                          {log.task?.description && <span className="block text-[10px] text-slate-500 font-normal">{log.task.description}</span>}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {log.employee?.fullName || log.task?.assignedTo?.fullName || 'Technician'}
                        </td>
                        <td className="py-3 px-3 text-amber-900 bg-amber-50 font-medium rounded-lg border border-amber-200">
                          💬 "{log.note || log.reason || 'Admin Reopen'}"
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px] uppercase">
                            {log.task?.status || 'IN_PROGRESS'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: PARTS INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <Package className="text-lime-600" /> Spare Parts & Oils Master Catalog
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventoryParts.map(part => (
                <div key={part.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{part.name}</h4>
                    <span className="text-xs text-slate-500 font-mono">PN: {part.partNumber} • Category: {part.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-lime-700 text-base block">{part.unitPrice} AED</span>
                    <span className="text-xs text-slate-500">In Stock: {part.stockQuantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: LABOR CATALOG */}
        {activeTab === 'labor' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="text-blue-600" /> Standard Labor Operations & Rates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {laborCatalog.map(labor => (
                <div key={labor.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{labor.name}</h4>
                    <span className="text-xs text-slate-500">Section: {labor.section} • Est: {labor.standardHours} hrs</span>
                  </div>
                  <span className="font-mono font-bold text-blue-600 text-lg">{labor.standardRate} AED</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* SMART INTAKE VEHICLE INSPECTION MODAL */}
      {showInspectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-lime-600" /> Smart Vehicle Intake Certificate
                </h4>
                <p className="text-xs text-slate-500">Step {inspectionStep} of 3: Pre-existing damage photo proof & inventory checklist</p>
              </div>
              <button onClick={() => setShowInspectionModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            </div>

            {inspectionStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name</label>
                    <input type="text" value={newInspection.customerName} onChange={e => setNewInspection({...newInspection, customerName: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium" required placeholder="e.g. Mohammed Salem" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                    <input type="text" value={newInspection.customerPhone} onChange={e => setNewInspection({...newInspection, customerPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium" required placeholder="0501234567" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Vehicle Plate #</label>
                    <input type="text" value={newInspection.vehiclePlateNumber} onChange={e => setNewInspection({...newInspection, vehiclePlateNumber: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-lime-700 font-mono font-bold text-base" required placeholder="A-12345" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Model & Year</label>
                    <input type="text" value={newInspection.vehicleModel} onChange={e => setNewInspection({...newInspection, vehicleModel: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium" required placeholder="Camry 2022" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Car Make</label>
                  <div className="flex flex-wrap gap-2">
                    {CAR_MAKES.map(make => (
                      <button type="button" key={make} onClick={() => setNewInspection({...newInspection, vehicleMake: make})} className={`px-3 py-1.5 rounded-lg border font-bold ${newInspection.vehicleMake === make ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`}>
                        {make}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="button" onClick={() => setInspectionStep(2)} className="w-full py-3.5 bg-blue-600 text-white font-black text-sm rounded-xl shadow-md mt-4">
                  Next: 360° Body Damage Inspector ➔
                </button>
              </div>
            )}

            {inspectionStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 uppercase">Select View & Tap Blueprint to Drop Damage Marker:</span>
                  <div className="flex gap-1">
                    {(['left', 'right', 'front', 'rear'] as const).map(view => (
                      <button key={view} type="button" onClick={() => setActiveCarView(view)} className={`px-3 py-1 rounded-lg font-bold text-xs uppercase ${activeCarView === view ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {view}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {DAMAGE_TYPES.map(dt => (
                    <button type="button" key={dt.type} onClick={() => setSelectedDamageType(dt.type as any)} className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${selectedDamageType === dt.type ? 'ring-2 ring-blue-600 shadow-sm' : 'opacity-70'} ${dt.color}`}>
                      {dt.label}
                    </button>
                  ))}
                </div>

                <div 
                  onClick={handleCarClick}
                  className="relative w-full h-48 bg-slate-900 rounded-2xl border-2 border-slate-300 cursor-crosshair flex items-center justify-center overflow-hidden shadow-inner"
                >
                  <div className="text-slate-500 font-black text-3xl opacity-30 select-none uppercase tracking-widest">
                    🚘 {activeCarView} view car outline
                  </div>

                  {newInspection.damageMarkers.filter(m => m.view === activeCarView).map(marker => (
                    <div 
                      key={marker.id}
                      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center border-2 border-white shadow-lg animate-bounce"
                      title={marker.label}
                    >
                      !
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-2">Recorded Pre-Existing Damage Markers ({newInspection.damageMarkers.length}):</span>
                  {newInspection.damageMarkers.length === 0 ? (
                    <span className="text-slate-400 italic">No scratches/dents dropped. Tap on the car blueprint to mark.</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {newInspection.damageMarkers.map(m => (
                        <span key={m.id} className="bg-white border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1">
                          {m.label} ({m.view}) <button type="button" onClick={() => removeDamageMarker(m.id)} className="text-red-600 font-bold ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setInspectionStep(1)} className="w-1/3 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">← Back</button>
                  <button type="button" onClick={() => setInspectionStep(3)} className="w-2/3 py-3 bg-blue-600 text-white font-black rounded-xl">Next: Fuel, Checklist & Extra Faults ➔</button>
                </div>
              </div>
            )}

            {inspectionStep === 3 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Fuel Level Gauge</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['empty', 'quarter', 'half', 'full'].map(level => (
                      <button type="button" key={level} onClick={() => setNewInspection({...newInspection, fuelLevel: level})} className={`py-2 rounded-xl border font-bold uppercase ${newInspection.fuelLevel === level ? 'bg-lime-600 text-white border-lime-600' : 'bg-slate-50 border-slate-300 text-slate-700'}`}>
                        ⛽ {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pre-Existing Dashboard Warning Lights On</label>
                  <div className="flex flex-wrap gap-2">
                    {WARNING_LIGHT_OPTIONS.map(w => {
                      const active = newInspection.warningLights.includes(w);
                      return (
                        <button type="button" key={w} onClick={() => toggleArrayItem('warningLights', w)} className={`px-3 py-1.5 rounded-xl border font-bold ${active ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-700'}`}>
                          ⚠️ {w} {active ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Valuables & Inventory Checklist</label>
                  <div className="flex flex-wrap gap-2">
                    {VALUABLE_OPTIONS.map(v => {
                      const active = newInspection.valuablesChecklist.includes(v);
                      return (
                        <button type="button" key={v} onClick={() => toggleArrayItem('valuablesChecklist', v)} className={`px-3 py-1.5 rounded-xl border font-bold ${active ? 'bg-lime-600 text-white border-lime-600' : 'bg-slate-50 border-slate-300 text-slate-700'}`}>
                          {v} {active ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-blue-700 uppercase">
                    🔍 Extra Faults Noticed During Intake (Auto-Converts to Job Card Labor)
                  </label>
                  <div className="space-y-1">
                    {EXTRA_FAULT_OPTIONS.map(ef => {
                      const active = newInspection.extraFaults.includes(ef);
                      return (
                        <button type="button" key={ef} onClick={() => toggleArrayItem('extraFaults', ef)} className={`w-full p-2.5 rounded-xl border text-left font-bold transition-all flex justify-between items-center ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 text-slate-700'}`}>
                          <span>{ef}</span>
                          {active && <span className="font-black">✓ Added</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setInspectionStep(2)} className="w-1/3 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">← Back</button>
                  <button type="button" onClick={handleSaveAndConvertInspection} className="w-2/3 py-3 bg-gradient-to-r from-blue-600 to-lime-600 text-white font-black text-sm rounded-xl shadow-lg">
                    🚀 Save & Auto-Convert to Active Job Card
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAST JOB CARD MODAL */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-xl shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Car className="text-blue-600" /> Create Fast Job Card
              </h4>
              <button onClick={() => setShowAddJobModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateFastJobCard} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name</label>
                  <input type="text" value={newJob.customerName} onChange={e => setNewJob({...newJob, customerName: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium" required placeholder="e.g. Mohammed Salem" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input type="text" value={newJob.customerPhone} onChange={e => setNewJob({...newJob, customerPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium" required placeholder="0501234567" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Vehicle Plate #</label>
                  <input type="text" value={newJob.vehiclePlateNumber} onChange={e => setNewJob({...newJob, vehiclePlateNumber: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-lime-700 font-mono font-bold text-base" required placeholder="A-12345" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Vehicle Model</label>
                  <input type="text" value={newJob.vehicleModel} onChange={e => setNewJob({...newJob, vehicleModel: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium" required placeholder="Camry / Patrol / Civic" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Service / Complaint Remarks</label>
                <textarea value={newJob.complaintsText} onChange={e => setNewJob({...newJob, complaintsText: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium" rows={2} placeholder="e.g. Engine noise on acceleration, AC not cooling" />
              </div>

              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black text-base rounded-xl shadow-md">
                Create & Dispatch Job Card
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD PART MODAL WITH VENDOR PURCHASE TOGGLE */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="text-lime-600" /> Add Part to Job Card
            </h4>

            {/* Source Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => { setPartSource('inventory'); setNewPartItem({ ...newPartItem, isVendorPurchase: false }); }}
                className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  partSource === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                <Package size={14} /> In-Stock Inventory
              </button>
              <button
                type="button"
                onClick={() => { setPartSource('vendor'); setNewPartItem({ ...newPartItem, isVendorPurchase: true }); }}
                className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  partSource === 'vendor' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                <ShoppingBag size={14} /> Vendor Purchase
              </button>
            </div>

            <form onSubmit={handleAddPartToJob} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Part Name</label>
                <input 
                  type="text" 
                  value={newPartItem.partName} 
                  onChange={e => setNewPartItem({...newPartItem, partName: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium" 
                  required 
                  placeholder="e.g. Engine Oil 5W30 / Alternator" 
                />
              </div>

              {partSource === 'vendor' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Vendor / Shop Name</label>
                      <input 
                        type="text" 
                        value={newPartItem.vendorName} 
                        onChange={e => setNewPartItem({...newPartItem, vendorName: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900" 
                        placeholder="e.g. Al Futtaim Auto Parts" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bill / Invoice #</label>
                      <input 
                        type="text" 
                        value={newPartItem.vendorInvoiceNumber} 
                        onChange={e => setNewPartItem({...newPartItem, vendorInvoiceNumber: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900" 
                        placeholder="INV-8849" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Purchase Cost Paid to Vendor (AED)</label>
                    <input 
                      type="number" 
                      step="0.5"
                      value={newPartItem.purchaseCost} 
                      onChange={e => setNewPartItem({...newPartItem, purchaseCost: parseFloat(e.target.value) || 0})} 
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900" 
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                  <input type="number" min="1" value={newPartItem.quantity} onChange={e => setNewPartItem({...newPartItem, quantity: parseInt(e.target.value) || 1})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Selling Price (AED)</label>
                  <input type="number" min="0" value={newPartItem.unitPrice} onChange={e => setNewPartItem({...newPartItem, unitPrice: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900" required />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddPartModal(false)} className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="w-1/2 py-3 bg-lime-600 text-white font-black rounded-xl">Save Part</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD LABOR MODAL */}
      {showAddLaborModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Plus className="text-blue-600" /> Add Labor Operation
            </h4>
            <form onSubmit={handleAddLaborToJob} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service / Operation Name *</label>
                <input
                  type="text"
                  value={newLaborItem.operationName}
                  onChange={e => setNewLaborItem({...newLaborItem, operationName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold"
                  required
                  placeholder="e.g. Brake Pad Replacement"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department Section</label>
                  <select
                    value={newLaborItem.section}
                    onChange={e => setNewLaborItem({...newLaborItem, section: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 font-bold"
                  >
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Technician</label>
                  <select
                    value={newLaborItem.assignedMechanicId}
                    onChange={e => setNewLaborItem({...newLaborItem, assignedMechanicId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 font-bold"
                  >
                    <option value="">Unassigned (Queue)</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.jobTitle})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newLaborItem.estimatedHours}
                    onChange={e => setNewLaborItem({...newLaborItem, estimatedHours: parseFloat(e.target.value) || 1})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hourly Rate (AED)</label>
                  <input
                    type="number"
                    value={newLaborItem.hourlyRate}
                    onChange={e => setNewLaborItem({...newLaborItem, hourlyRate: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddLaborModal(false)} className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md">Add Operation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LABOR OPERATION & ASSIGNMENT MODAL */}
      {showEditLaborModal && laborToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit className="text-blue-600" size={18} /> Edit Operation & Assign Staff
              </h4>
              <button onClick={() => setShowEditLaborModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleUpdateLaborSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service / Operation Name *</label>
                <input
                  type="text"
                  value={laborToEdit.operationName}
                  onChange={e => setLaborToEdit({...laborToEdit, operationName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department Section</label>
                  <select
                    value={laborToEdit.section}
                    onChange={e => setLaborToEdit({...laborToEdit, section: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 font-bold"
                  >
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Technician</label>
                  <select
                    value={laborToEdit.assignedMechanicId || ''}
                    onChange={e => setLaborToEdit({...laborToEdit, assignedMechanicId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 font-bold"
                  >
                    <option value="">Unassigned (Queue)</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.jobTitle})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={laborToEdit.estimatedHours}
                    onChange={e => setLaborToEdit({...laborToEdit, estimatedHours: parseFloat(e.target.value) || 1})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hourly Rate (AED)</label>
                  <input
                    type="number"
                    value={laborToEdit.hourlyRate}
                    onChange={e => setLaborToEdit({...laborToEdit, hourlyRate: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowEditLaborModal(false)} className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md">Update & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <h4 className="text-lg font-black text-slate-900">Add New Staff Member</h4>
            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Full Name *</label>
                <input type="text" value={newStaff.fullName} onChange={e => setNewStaff({...newStaff, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium" required placeholder="e.g. Rashid Kumar" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Employee Code *</label>
                <input type="text" value={newStaff.employeeCode} onChange={e => setNewStaff({...newStaff, employeeCode: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono font-bold" required placeholder="MCH05" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">6-Digit Kiosk PIN *</label>
                <input type="password" maxLength={6} value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-center tracking-widest" required placeholder="123456" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Role / Job Title *</label>
                <select value={newStaff.jobTitle} onChange={e => setNewStaff({...newStaff, jobTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium">
                  {JOB_TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddStaffModal(false)} className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md">Create Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {showEditStaffModal && editingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                ✏️ Edit Staff Member Details
              </h4>
              <button onClick={() => setShowEditStaffModal(false)} className="text-slate-400 hover:text-slate-800 font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Full Name *</label>
                <input
                  type="text"
                  value={editStaffForm.fullName}
                  onChange={e => setEditStaffForm({ ...editStaffForm, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Employee Code *</label>
                  <input
                    type="text"
                    value={editStaffForm.employeeCode}
                    onChange={e => setEditStaffForm({ ...editStaffForm, employeeCode: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Account Status</label>
                  <select
                    value={editStaffForm.status}
                    onChange={e => setEditStaffForm({ ...editStaffForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Designation / Role *</label>
                <select
                  value={editStaffForm.jobTitle}
                  onChange={e => setEditStaffForm({ ...editStaffForm, jobTitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                >
                  {JOB_TITLES.map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">
                  Reset Kiosk PIN <span className="text-slate-400 font-normal lowercase">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={editStaffForm.pin}
                  onChange={e => setEditStaffForm({ ...editStaffForm, pin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-center tracking-widest"
                  placeholder="******"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditStaffModal(false)}
                  className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT LOG TRAIL MODAL FOR ADMIN */}
      {selectedAuditLogsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-xl font-black text-slate-900">
                  Audit Log Trail: {selectedAuditLogsModal.employee?.fullName}
                </h4>
                <p className="text-xs text-slate-500 font-mono">Date: {selectedAuditLogsModal.date}</p>
              </div>
              <button onClick={() => setSelectedAuditLogsModal(null)} className="text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              {selectedAuditLogsModal.rawLogs.map((log: any) => (
                <div key={log.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">{log.title}</span>
                    <span className="text-slate-500 block mt-0.5">{log.note || 'No additional remarks'}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold rounded-md block mb-0.5">{log.action}</span>
                    <span className="font-mono text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN REOPEN TASK MODAL */}
      {showReopenModal && taskToReopen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <RefreshCw className="text-amber-600" /> Reopen Task Verification
              </h4>
              <button onClick={() => setShowReopenModal(false)} className="text-slate-400 hover:text-slate-800 font-bold">✕</button>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block mb-1">Task Title: {taskToReopen.title}</span>
              Management verification: Please specify mandatory reason/comments why this task is being reopened.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admin Reopen Reason / Remark *</label>
              <textarea
                rows={3}
                value={reopenReasonInput}
                onChange={e => setReopenReasonInput(e.target.value)}
                placeholder="e.g. Customer requested additional inspection, rework required on brake pad bleeding..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopenTaskSubmit}
                disabled={!reopenReasonInput.trim()}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <RefreshCw size={14} /> Confirm & Reopen Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYNC / COPY JOB CARD FROM EXTERNAL GARAGE ERP MODAL */}
      {showErpSyncModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <RefreshCw className="text-indigo-600 animate-spin" /> Sync / Copy Job Card from Garage ERP
                </h4>
                <p className="text-xs text-slate-500">Track multi-department tasks, time logs, and QA handovers in ground app</p>
              </div>
              <button onClick={() => setShowErpSyncModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleErpSyncSubmit} className="space-y-4 text-xs">
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl text-indigo-900 font-medium">
                💡 Enter external ERP Job Ref #. You can specify ordered tasks (e.g. Denting ➔ Painting ➔ Electrical ➔ Mechanical) with assigned staff. Ground staff will track time & perform QWC handovers here.
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">External ERP Job # *</label>
                  <input
                    type="text"
                    value={erpSyncForm.externalErpId}
                    onChange={e => setErpSyncForm({ ...erpSyncForm, externalErpId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono font-bold text-indigo-700"
                    placeholder="ERP-JC-9982"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={erpSyncForm.customerName}
                    onChange={e => setErpSyncForm({ ...erpSyncForm, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                    placeholder="Customer Name"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Phone *</label>
                  <input
                    type="text"
                    value={erpSyncForm.customerPhone}
                    onChange={e => setErpSyncForm({ ...erpSyncForm, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                    placeholder="0501234567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Plate Number *</label>
                  <input
                    type="text"
                    value={erpSyncForm.vehiclePlateNumber}
                    onChange={e => setErpSyncForm({ ...erpSyncForm, vehiclePlateNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-lime-700 font-mono font-bold"
                    placeholder="A-12345"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Make</label>
                  <select
                    value={erpSyncForm.vehicleMake}
                    onChange={e => setErpSyncForm({ ...erpSyncForm, vehicleMake: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold"
                  >
                    {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Model</label>
                  <input
                    type="text"
                    value={erpSyncForm.vehicleModel}
                    onChange={e => setErpSyncForm({ ...erpSyncForm, vehicleModel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-medium"
                    placeholder="Camry / Patrol"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Year</label>
                  <input
                    type="text"
                    value={erpSyncForm.vehicleYear}
                    onChange={e => setErpSyncForm({ ...erpSyncForm, vehicleYear: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-medium"
                  />
                </div>
              </div>

              {/* SEQUENTIAL DEPARTMENT TASKS SELECTION */}
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="font-black text-slate-900 uppercase block">Sequential Department Task Workflow:</label>
                    <span className="text-[11px] text-slate-500 font-medium">Add task steps in exact execution order (e.g. Step 1: Denting & Painting ➔ Step 2: Electrical ➔ Step 3: Mechanical)</span>
                  </div>
                  <button
                    type="button"
                    onClick={addErpTaskStep}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Plus size={14} /> Add Task Step
                  </button>
                </div>

                {erpSyncForm.tasks.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-slate-500 font-medium">
                    No task steps added yet. Click <strong>'➕ Add Task Step'</strong> above to build the exact workflow order for this ERP Job Card.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {erpSyncForm.tasks.map((task, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-slate-200/80 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900">Workflow Step #{idx + 1}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveErpTaskStep(idx, 'up')}
                              className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 text-slate-700 font-bold rounded-md text-[10px]"
                              title="Move Step Up"
                            >
                              🔼 Up
                            </button>
                            <button
                              type="button"
                              disabled={idx === erpSyncForm.tasks.length - 1}
                              onClick={() => moveErpTaskStep(idx, 'down')}
                              className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 text-slate-700 font-bold rounded-md text-[10px]"
                              title="Move Step Down"
                            >
                              🔽 Down
                            </button>
                            <button
                              type="button"
                              onClick={() => removeErpTaskStep(idx)}
                              className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 font-bold rounded-md text-[10px]"
                              title="Remove Step"
                            >
                              🗑️ Delete Step
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Operation Name *</label>
                            <input
                              type="text"
                              value={task.operationName}
                              onChange={e => {
                                const updated = [...erpSyncForm.tasks];
                                updated[idx].operationName = e.target.value;
                                setErpSyncForm({ ...erpSyncForm, tasks: updated });
                              }}
                              placeholder="e.g. Denting & Painting Repair"
                              className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
                              required
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Department Section</label>
                            <select
                              value={task.section}
                              onChange={e => {
                                const updated = [...erpSyncForm.tasks];
                                updated[idx].section = e.target.value;
                                setErpSyncForm({ ...erpSyncForm, tasks: updated });
                              }}
                              className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-800"
                            >
                              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Assigned Technician</label>
                            <select
                              value={task.assignedMechanicId}
                              onChange={e => {
                                const updated = [...erpSyncForm.tasks];
                                updated[idx].assignedMechanicId = e.target.value;
                                setErpSyncForm({ ...erpSyncForm, tasks: updated });
                              }}
                              className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-800"
                            >
                              <option value="">Unassigned (Open Queue)</option>
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.jobTitle})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Complaints / Notes</label>
                <textarea
                  rows={2}
                  value={erpSyncForm.complaintsText}
                  onChange={e => setErpSyncForm({ ...erpSyncForm, complaintsText: e.target.value })}
                  placeholder="Paste or enter customer complaints from ERP..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowErpSyncModal(false)}
                  className="px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Import ERP Job Card & Build Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPERVISOR QA VERIFICATION MODAL */}
      {showQaVerifyModal && selectedQaLabor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-purple-600" /> Supervisor QA/QC Inspection
              </h4>
              <button onClick={() => setShowQaVerifyModal(false)} className="text-slate-400 hover:text-slate-800 font-bold">✕</button>
            </div>

            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-xs text-purple-900">
              <span className="font-bold block mb-1">Task: {selectedQaLabor.operationName}</span>
              Department: <strong>{selectedQaLabor.section}</strong> • Tech: <strong>{selectedQaLabor.assignedMechanic?.fullName || 'N/A'}</strong>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">QA Inspection Notes / Remarks</label>
              <textarea
                rows={3}
                value={qaNotesInput}
                onChange={e => setQaNotesInput(e.target.value)}
                placeholder="e.g. Paint finish clear and smooth, ready for handover to electrical section."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleQaVerifySubmit(false)}
                className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                ❌ Reject & Flag Rework
              </button>
              <button
                type="button"
                onClick={() => handleQaVerifySubmit(true)}
                className="py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={16} /> Approve & Trigger Next Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOB CARD REOPEN FOR CUSTOMER REWORK MODAL */}
      {showReopenJobModal && selectedJobCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <RefreshCw className="text-amber-600" /> Reopen Job Card for Customer Rework
              </h4>
              <button onClick={() => setShowReopenJobModal(false)} className="text-slate-400 hover:text-slate-800 font-bold">✕</button>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block mb-1">Job Card #{selectedJobCard.jobNumber}</span>
              Customer returned for rework. Reopening will reactivate task tracking and allow staff to log additional rework time.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Rework Reason *</label>
              <textarea
                rows={3}
                value={reopenReasonText}
                onChange={e => setReopenReasonText(e.target.value)}
                placeholder="e.g. Customer reported slight vibration in front left brake at 80 km/h..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReopenJobModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopenJobSubmit}
                disabled={!reopenReasonText.trim()}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <RefreshCw size={14} /> Reopen Job Card for Rework
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK TASK ASSIGNMENT MODAL FOR FREE STAFF */}
      {showQuickAssignModal && assignTargetEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Wrench className="text-blue-600" /> Assign Job Task to Staff Member
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Assigning to: <strong>{assignTargetEmployee.fullName}</strong> ({assignTargetEmployee.employeeCode} • {assignTargetEmployee.jobTitle || 'Technician'})
                </p>
              </div>
              <button onClick={() => setShowQuickAssignModal(false)} className="text-slate-400 hover:text-slate-800 font-bold">✕</button>
            </div>

            <form onSubmit={handleQuickAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Open ERP Job Card Task *</label>
                {openLaborOperations.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-center font-medium">
                    No unassigned or pending labor tasks found in current Job Cards. Create or sync an ERP Job Card first.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {openLaborOperations.map(op => (
                      <label
                        key={op.id}
                        className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedLaborToAssign === op.id
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name="laborOperation"
                            value={op.id}
                            checked={selectedLaborToAssign === op.id}
                            onChange={() => setSelectedLaborToAssign(op.id)}
                            className="mt-1 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-slate-900">{op.operationName}</span>
                              <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                                {op.jobCardNumber}
                              </span>
                            </div>
                            <div className="text-slate-600 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                              <span><strong>Vehicle:</strong> {op.vehiclePlateNumber} ({op.vehicleModel})</span>
                              <span>• <strong>Cust:</strong> {op.customerName}</span>
                              <span>• <strong>Section:</strong> {op.section}</span>
                              <span>• <strong>Est:</strong> {op.estimatedHours}h</span>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuickAssignModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedLaborToAssign || assigningTask}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Save size={14} /> {assigningTask ? 'Assigning...' : 'Assign Task Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
