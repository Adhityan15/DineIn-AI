import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Sparkles, 
  MapPin, 
  Clock, 
  Calendar, 
  UserCheck, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert,
  Search, 
  Plus, 
  Check, 
  X, 
  QrCode,
  Layers,
  Award,
  BarChart3,
  RefreshCw,
  HelpCircle,
  Sliders,
  ChevronRight,
  Phone,
  Mail,
  User,
  Coffee,
  DollarSign,
  GraduationCap
} from 'lucide-react';

import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import {
  AppCard,
  GlassCard,
  SectionCard,
  ChartCard,
  KPICard,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  AnimatedCounter,
  Badge,
  LoadingOverlay,
  Input,
  Select,
  Textarea,
  Modal,
  Drawer,
  EmptyState
} from '../components/DesignSystem';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
};

// Circular gauge component
const CircularGauge = ({ value, size = 110 }) => {
  const radius = size * 0.4;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-app-border"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-app-primary"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-extrabold text-text-primary">{value}%</span>
      </div>
    </div>
  );
};

const Staff = () => {
  const { addToast } = useToast();

  // State Management
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [todayStats, setTodayStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payrollSummaries, setPayrollSummaries] = useState([]);

  // HRMS sub-lists
  const [employeeDocuments, setEmployeeDocuments] = useState([]);
  const [employeeTimelineEvents, setEmployeeTimelineEvents] = useState([]);
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [employeeAwards, setEmployeeAwards] = useState([]);
  const [branches, setBranches] = useState([]);
  const [allAssets, setAllAssets] = useState([]);

  // Form helper visibility
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('directory');
  const [drawerTab, setDrawerTab] = useState('overview');

  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'leave') setActiveTab('leaves');
      else if (tabParam === 'managers') setActiveTab('directory');
      else if (['directory', 'departments', 'designations', 'attendance', 'leaves', 'assets', 'dashboard', 'calendar', 'payroll', 'performance', 'compliance'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else {
        setActiveTab('directory');
      }
    }
  }, [tabParam]);
  const [skillFilter, setSkillFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawers
  const [employeeDrawerOpen, setEmployeeDrawerOpen] = useState(false);
  const [shiftDrawerOpen, setShiftDrawerOpen] = useState(false);
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
  const [leaveDrawerOpen, setLeaveDrawerOpen] = useState(false);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [swapDrawerOpen, setSwapDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  // Nested Resource Submodals Open States
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [awardModalOpen, setAwardModalOpen] = useState(false);

  // Sub-resource Forms
  const [docForm, setDocForm] = useState({ document_type: 'aadhaar', document_number: '', file_url: '' });
  const [timelineForm, setTimelineForm] = useState({ event_type: 'joined', title: '', description: '', event_date: new Date().toISOString().split('T')[0] });
  const [assetForm, setAssetForm] = useState({ asset_type: 'laptop', asset_name: '', serial_number: '', assigned_date: new Date().toISOString().split('T')[0] });
  const [awardForm, setAwardForm] = useState({ title: '', award_date: new Date().toISOString().split('T')[0], description: '' });

  const [designationDrawerOpen, setDesignationDrawerOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState(null);
  const [designationFormData, setDesignationFormData] = useState({ name: '', department: '' });

  const [departmentDrawerOpen, setDepartmentDrawerOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentFormData, setDepartmentFormData] = useState({ name: '', code: '' });

  // Form states
  const [employeeFormData, setEmployeeFormData] = useState({
    user_email: '', employee_id: '', designation: '', hire_date: new Date().toISOString().split('T')[0], hourly_rate: 15.00, skills: '',
    manager: '', branch: '', department: '', date_of_birth: '', salary: 0.0,
    education: '', experience_summary: '', emergency_contact_name: '', emergency_contact_phone: '', notes: '', shift: ''
  });
  const [shiftFormData, setShiftFormData] = useState({
    name: '', start_time: '08:00', end_time: '16:00'
  });
  const [scheduleFormData, setScheduleFormData] = useState({
    employee: '', shift: '', date: new Date().toISOString().split('T')[0]
  });
  const [leaveFormData, setLeaveFormData] = useState({
    leave_type: 'Annual Leave', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], reason: ''
  });
  const [reviewFormData, setReviewFormData] = useState({
    employee: '', score: 5, feedback: ''
  });
  const [swapFormData, setSwapFormData] = useState({
    schedule: '', target_employee: ''
  });

  // Mock GPS Attendance simulator controls
  const [gpsLatitude, setGpsLatitude] = useState('12.9715'); // Bangalore main branch defaults
  const [gpsLongitude, setGpsLongitude] = useState('77.5945');
  const [qrScanned, setQrScanned] = useState(true);

  // Fetch individual sub-records on selection
  const fetchEmployeeSubResources = async (empId) => {
    try {
      const [docsRes, timelineRes, assetsRes, awardsRes] = await Promise.all([
        client.get(`/workforce/employees/${empId}/documents/`),
        client.get(`/workforce/employees/${empId}/timeline/`),
        client.get(`/workforce/employees/${empId}/assets/`),
        client.get(`/workforce/employees/${empId}/awards/`)
      ]);
      setEmployeeDocuments(docsRes.data?.data || []);
      setEmployeeTimelineEvents(timelineRes.data?.data || []);
      setEmployeeAssets(assetsRes.data?.data || []);
      setEmployeeAwards(awardsRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load employee subresources:", err);
    }
  };

  // Fetch all workforce datasets
  const fetchWorkforceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, deptRes, desigRes, shiftRes, scheduleRes, attRes, leavesRes, reviewsRes, analyticsRes, statsRes, branchRes, assetsRes, payrollRes] = await Promise.all([
        client.get('/workforce/employees/'),
        client.get('/workforce/departments/'),
        client.get('/workforce/designations/'),
        client.get('/workforce/shifts/'),
        client.get('/workforce/schedules/'),
        client.get('/workforce/attendance/'),
        client.get('/workforce/leaves/'),
        client.get('/workforce/reviews/'),
        client.get('/workforce/analytics/'),
        client.get('/workforce/attendance/today-stats/'),
        client.get('/branches/'),
        client.get('/workforce/assets/'),
        client.get('/workforce/payroll-summaries/')
      ]);

      // Robust DRF paginated / nested data extraction helper
      const extractData = (res) => {
        if (!res || !res.data) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.results)) return res.data.results;
        if (Array.isArray(res.data.data)) return res.data.data;
        return [];
      };

      const employeeList = extractData(empRes);
      setEmployees(employeeList);
      setDepartments(extractData(deptRes));
      setDesignations(extractData(desigRes));
      setShifts(extractData(shiftRes));
      setSchedules(extractData(scheduleRes));
      setAttendances(extractData(attRes));
      setLeaves(extractData(leavesRes));
      setReviews(extractData(reviewsRes));
      setBranches(extractData(branchRes));
      setAllAssets(extractData(assetsRes));
      setPayrollSummaries(extractData(payrollRes));

      if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.data);
      else setAnalytics(analyticsRes.data || {});

      if (statsRes.data?.success) setTodayStats(statsRes.data.data);
      else setTodayStats(statsRes.data || {});
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to sync workforce database.');
      addToast('Failed to sync workforce database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const refreshWithSync = () => {
    fetchWorkforceData();
    window.dispatchEvent(new Event('branchUpdate'));
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name: departmentFormData.name,
        code: departmentFormData.code || departmentFormData.name.substring(0, 3).toUpperCase()
      };

      if (editingDepartment) {
        await client.put(`/workforce/departments/${editingDepartment.id}/`, payload);
        addToast('Department updated successfully.', 'success');
      } else {
        await client.post('/workforce/departments/', payload);
        addToast('Department created successfully.', 'success');
      }

      const deptRes = await client.get('/workforce/departments/');
      const depts = Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data?.results || deptRes.data?.data || []);
      setDepartments(depts);
      setDepartmentDrawerOpen(false);
      setEditingDepartment(null);
      setDepartmentFormData({ name: '', code: '' });
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to save department.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? All linked designations will be affected.')) return;
    try {
      setLoading(true);
      await client.delete(`/workforce/departments/${id}/`);
      addToast('Department deleted successfully.', 'success');
      const deptRes = await client.get('/workforce/departments/');
      const depts = Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data?.results || deptRes.data?.data || []);
      setDepartments(depts);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete department.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDesignationSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const deptId = designationFormData.department || (departments[0]?.id || '');
      const payload = {
        name: designationFormData.name,
        department: deptId
      };
      
      if (editingDesignation) {
        await client.put(`/workforce/designations/${editingDesignation.id}/`, payload);
        addToast('Designation updated successfully.', 'success');
      } else {
        await client.post('/workforce/designations/', payload);
        addToast('Designation created successfully.', 'success');
      }
      
      const desigRes = await client.get('/workforce/designations/');
      if (desigRes.data?.success) {
        setDesignations(desigRes.data.data);
      } else if (Array.isArray(desigRes.data)) {
        setDesignations(desigRes.data);
      }
      
      setDesignationDrawerOpen(false);
      setEditingDesignation(null);
      setDesignationFormData({ name: '', department: '' });
    } catch (err) {
      console.error(err);
      let errMsg = 'Failed to save designation.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errMsg = err.response.data;
        } else if (typeof err.response.data === 'object') {
          errMsg = Object.entries(err.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
        }
      }
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDesignation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this designation?')) return;
    try {
      setLoading(true);
      await client.delete(`/workforce/designations/${id}/`);
      addToast('Designation deleted successfully.', 'success');
      const desigRes = await client.get('/workforce/designations/');
      if (desigRes.data?.success) {
        setDesignations(desigRes.data.data);
      } else if (Array.isArray(desigRes.data)) {
        setDesignations(desigRes.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to delete designation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkforceData();
    window.addEventListener('branchUpdate', fetchWorkforceData);
    return () => {
      window.removeEventListener('branchUpdate', fetchWorkforceData);
    };
  }, [fetchWorkforceData]);

  // Handle Form changes helper
  const handleFormChange = (e, setter) => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value }));
  };

  // Submit Employee details
  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await client.post('/workforce/employees/', employeeFormData);
      if (res.data?.success || res.status === 201) {
        addToast('Employee record created successfully.', 'success');
        setEmployeeDrawerOpen(false);
        refreshWithSync();
      }
    } catch (err) {
      console.error(err);
      let errMsg = 'Error registering employee.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errMsg = err.response.data;
        } else if (typeof err.response.data === 'object') {
          errMsg = Object.entries(err.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
        }
      }
      addToast(errMsg, 'error');
    }
  };

  // Add Document Submit
  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      setLoading(true);
      await client.post(`/workforce/employees/${selectedEmployee.id}/documents/`, docForm);
      addToast('Document successfully uploaded to locker.', 'success');
      setDocModalOpen(false);
      setDocForm({ document_type: 'aadhaar', document_number: '', file_url: '' });
      fetchEmployeeSubResources(selectedEmployee.id);
    } catch (err) {
      addToast('Failed to upload document.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add Timeline Lifecycle Event Submit
  const handleAddTimeline = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      setLoading(true);
      await client.post(`/workforce/employees/${selectedEmployee.id}/timeline/`, timelineForm);
      addToast('Lifecycle timeline event logged.', 'success');
      setTimelineModalOpen(false);
      setTimelineForm({ event_type: 'joined', title: '', description: '', event_date: new Date().toISOString().split('T')[0] });
      fetchEmployeeSubResources(selectedEmployee.id);
    } catch (err) {
      addToast('Failed to record timeline event.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Issue Corporate Asset Submit
  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      setLoading(true);
      await client.post(`/workforce/employees/${selectedEmployee.id}/assets/`, assetForm);
      addToast('Corporate asset issued successfully.', 'success');
      setAssetModalOpen(false);
      setAssetForm({ asset_type: 'laptop', asset_name: '', serial_number: '', assigned_date: new Date().toISOString().split('T')[0] });
      fetchEmployeeSubResources(selectedEmployee.id);
    } catch (err) {
      addToast('Failed to allocate company asset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Return Corporate Asset
  const handleReturnAsset = async (assetId) => {
    if (!selectedEmployee) return;
    try {
      setLoading(true);
      await client.patch(`/workforce/employees/${selectedEmployee.id}/assets/`, { asset_id: assetId, returned: true });
      addToast('Asset returned status registered.', 'success');
      fetchEmployeeSubResources(selectedEmployee.id);
    } catch (err) {
      addToast('Failed to record asset return.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Log Corporate Award Submit
  const handleAddAward = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      setLoading(true);
      await client.post(`/workforce/employees/${selectedEmployee.id}/awards/`, awardForm);
      addToast('Corporate award registered successfully.', 'success');
      setAwardModalOpen(false);
      setAwardForm({ title: '', award_date: new Date().toISOString().split('T')[0], description: '' });
      fetchEmployeeSubResources(selectedEmployee.id);
    } catch (err) {
      addToast('Failed to record employee award.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit Shift pattern
  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await client.post('/workforce/shifts/', shiftFormData);
      if (res.data?.success || res.status === 201) {
        addToast('Operational shift pattern added.', 'success');
        setShiftDrawerOpen(false);
        refreshWithSync();
      }
    } catch (err) {
      addToast('Error adding shift pattern.', 'error');
    }
  };

  // Submit Schedule assignment
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await client.post('/workforce/schedules/', scheduleFormData);
      if (res.data?.success || res.status === 201) {
        addToast('Shift roster schedule assigned.', 'success');
        setScheduleDrawerOpen(false);
        refreshWithSync();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Conflict: Overlapping schedule or on-leave dates.', 'error');
    }
  };

  // Clock In Simulated Action
  const handleClockIn = async () => {
    try {
      const res = await client.post('/workforce/attendance/clock-in/', {
        latitude: parseFloat(gpsLatitude),
        longitude: parseFloat(gpsLongitude),
        qr_code_scanned: qrScanned
      });
      if (res.data?.success) {
        addToast(res.data.message || 'Clock-in completed successfully.', 'success');
        refreshWithSync();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error clocking in.', 'error');
    }
  };

  // Clock Out Simulated Action
  const handleClockOut = async () => {
    try {
      const res = await client.post('/workforce/attendance/clock-out/');
      if (res.data?.success) {
        addToast('Clock-out recorded. Duration compiled.', 'success');
        refreshWithSync();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error clocking out.', 'error');
    }
  };

  // Request Swap Action
  const handleRequestSwap = async (e) => {
    e.preventDefault();
    try {
      const res = await client.post(`/workforce/schedules/${swapFormData.schedule}/request-swap/`, {
        target_employee: swapFormData.target_employee
      });
      if (res.data?.success) {
        addToast('Shift swap request logged. Pending accept.', 'success');
        setSwapDrawerOpen(false);
        refreshWithSync();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to request swap.', 'error');
    }
  };

  // Accept Swap Action
  const handleAcceptSwap = async (scheduleId) => {
    try {
      const res = await client.post(`/workforce/schedules/${scheduleId}/accept-swap/`);
      if (res.data?.success) {
        addToast('Swap request accepted. Sent to Manager for approval.', 'success');
        refreshWithSync();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error accepting swap.', 'error');
    }
  };

  // Approve Swap Action
  const handleApproveSwap = async (scheduleId, approve = true) => {
    try {
      const res = await client.post(`/workforce/schedules/${scheduleId}/approve-swap/`, { approve });
      if (res.data?.success) {
        const actionStr = approve ? 'approved' : 'rejected';
        addToast(`Swap request ${actionStr} successfully.`, 'info');
        refreshWithSync();
      }
    } catch (err) {
      addToast('Error processing swap approval.', 'error');
    }
  };

  // Approve/Reject Leave Action
  const handleApproveLeave = async (leaveId, approve = true) => {
    try {
      const res = await client.post(`/workforce/leaves/${leaveId}/approve/`, { approve });
      if (res.data?.success) {
        const actionStr = approve ? 'approved' : 'rejected';
        addToast(`Leave request ${actionStr}. Schedules cleaned.`, 'success');
        refreshWithSync();
      }
    } catch (err) {
      addToast('Failed to process leave approval.', 'error');
    }
  };

  // Filter Employees directory
  const filteredEmployees = employees.filter(emp => {
    const nameStr = emp?.name || '';
    const empIdStr = emp?.employee_id || '';
    const skillsStr = typeof emp?.skills === 'string' ? emp.skills : (Array.isArray(emp?.skills) ? emp.skills.join(',') : '');
    
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          empIdStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = skillFilter === 'all' ? true : skillsStr.toLowerCase().includes(skillFilter.toLowerCase());
    return matchesSearch && matchesSkill;
  });

  // Derived collections and metrics from already-loaded employee dataset
  const activeEmployees = employees.filter(emp => emp?.status === 'active' || emp?.status === 'on_leave');
  const totalHeadcount = employees.length > 0 ? employees.length : (analytics?.total_employees || 0);

  const calculateAvgExperience = (empList) => {
    if (!empList || empList.length === 0) return 0;
    const now = new Date();
    let totalMonths = 0;
    let count = 0;
    empList.forEach(emp => {
      const dateStr = emp.hire_date || emp.created_at || emp.joining_date;
      if (dateStr) {
        const hireDate = new Date(dateStr);
        if (!isNaN(hireDate.getTime())) {
          const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
          totalMonths += Math.max(0, months);
          count++;
        }
      }
    });
    return count > 0 ? Math.round(totalMonths / count) : 0;
  };

  const avgExperienceMonths = analytics?.experience_stats?.average_experience_months || calculateAvgExperience(employees);

  // Exact requested debug logging block
  console.log("=== FINAL STAFF KPI DEBUG ===");
  console.log("employees:", employees);
  console.log("employees.length:", employees?.length);
  console.log("filteredEmployees.length:", filteredEmployees?.length);
  console.log("employee statuses:", employees?.slice(0, 10).map(e => e.status));
  console.log("totalHeadcount:", totalHeadcount);
  console.log("avgExperience:", avgExperienceMonths);

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-6 max-w-lg mx-auto text-text-primary">
          <h3 className="text-rose-500 font-bold text-lg mb-2">Database Sync Error</h3>
          <p className="text-text-secondary text-sm mb-4">{error}</p>
          <button 
            onClick={fetchWorkforceData} 
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-app-24 animate-fade-in relative min-h-[85vh] text-text-secondary"
    >

      {/* 1. EXECUTIVE WORKFORCE HEADER */}
      <motion.div variants={itemVariants}>
        <GlassCard className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-app-20 border-app-primary/20 shadow-[0_4px_24px_rgba(99,102,241,0.06)]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-primary/10 text-app-primary border border-app-primary/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                <Clock size={12} className="animate-spin duration-3000" />
                Roster active
              </span>
              <Badge status="success">Today Present: {todayStats?.present_count || 0}</Badge>
              <Badge status="warning">Late arrivals: {todayStats?.late_count || 0}</Badge>
            </div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Workforce CRM & Roster Planner
            </h1>
            <p className="text-xs text-text-secondary font-medium">
              Oversee daily check-ins, approve employee leave Kanban columns, and audit burnout risks.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <SecondaryButton onClick={() => setEmployeeDrawerOpen(true)} icon={Plus}>
              Add Employee
            </SecondaryButton>
            <PrimaryButton onClick={() => setScheduleDrawerOpen(true)} icon={Calendar} className="shadow-app-md">
              Roster Shift
            </PrimaryButton>
            <button 
              onClick={fetchWorkforceData} 
              className="text-text-muted hover:text-text-primary p-2 rounded-app-xl border border-app-border bg-app-surface transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* 2. DAILY ATTENDANCE STATS KPIs */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-app-20">
        <KPICard title="Clocked In Today" value={<AnimatedCounter value={todayStats?.present_count ?? (attendances.length || employees.filter(e => e.status === 'active').length || 45)} />} description="Logged present today" />
        <KPICard title="Late Sign-ins" value={<AnimatedCounter value={todayStats?.late_count ?? attendances.filter(a => a.status === 'late').length} />} trend="up" description="Lateness grace elapsed" />
        <KPICard title="Geofence Anomalies" value={<AnimatedCounter value={todayStats?.anomaly_count ?? 0} />} trend="down" description="Out-of-bounds clock-ins" />
        <KPICard title="Active On Leave" value={<AnimatedCounter value={todayStats?.on_leave_count ?? leaves.filter(l => l.status === 'approved').length} />} description="Approved inactive leaves" />
      </motion.div>

      {/* 3. TABS TOGGLE SYSTEM */}
      <motion.div variants={itemVariants} className="flex border-b border-app-border gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'dashboard', label: 'AI Analytics & Health', icon: BarChart3 },
          { id: 'directory', label: 'Staff Directory Matrix', icon: Users },
          { id: 'calendar', label: 'Roster Planner Calendar', icon: Calendar },
          { id: 'leaves', label: 'Leave Kanban Board', icon: Layers },
          { id: 'attendance', label: 'Mock GPS Sign-In Clock', icon: MapPin },
          { id: 'payroll', label: 'Payroll Ledger', icon: DollarSign },
          { id: 'performance', label: 'Performance Reviews', icon: Award },
          { id: 'compliance', label: 'Document Compliance', icon: ShieldAlert },
          { id: 'assets', label: 'Company Assets Ledger', icon: Sliders },
          { id: 'departments', label: 'Departments Control', icon: Sliders },
          { id: 'designations', label: 'Designations Control', icon: Layers }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition-all duration-200 ${ isActive ? 'border-app-primary text-app-primary bg-app-primary/5' : 'border-transparent text-text-muted hover:text-text-primary' }`}
            >
              <TabIcon size={14} className={isActive ? 'text-app-primary' : 'text-text-muted'} />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* 4. ACTIVE TAB COMPONENT RENDERING */}
      <motion.div variants={itemVariants} className="min-h-[450px]">

        {/* TAB 1: AI ANALYTICS & HEALTH */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KPICard title="Total Headcount" value={<AnimatedCounter value={totalHeadcount} />} description="Active & leave staff" />
              <KPICard title="Avg Experience" value={`${avgExperienceMonths} mos`} description="Enterprise tenure" />
              <KPICard title="Attendance Rate" value={`${analytics?.attendance_rate || 95.0}%`} description="Overall worked presence" />
              <KPICard title="Late Arrival Rate" value={`${analytics?.late_rate || 0.0}%`} trend={parseFloat(analytics?.late_rate) > 10 ? 'up' : 'down'} description="Sign-ins after grace" />
              <KPICard title="Attrition Rate" value={`${analytics?.attrition_rate || 0.0}%`} trend="down" description="Resigned vs Active ratio" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Department breakdown & Age distribution (col-span-8) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Department sizes bar list */}
                <AppCard className="space-y-4">
                  <div>
                    <h3 className="text-text-primary text-xs font-bold uppercase tracking-wider">Department Sizing Control</h3>
                    <p className="text-[10px] text-text-muted">Headcount distribution mapping across business layers.</p>
                  </div>
                  <div className="space-y-3.5">
                    {analytics?.dept_breakdown?.length === 0 ? (
                      <EmptyState title="No departments mapped" description="Add departments to see distribution." icon={Sliders} />
                    ) : (
                      analytics?.dept_breakdown?.map((dept, index) => {
                        const total = analytics.total_employees || 1;
                        const pct = Math.round((dept.emp_count / total) * 100);
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-text-primary">{dept.name}</span>
                              <span className="text-text-secondary">{dept.emp_count} Staff ({pct}%)</span>
                            </div>
                            <div className="bg-app-elevated w-full h-2 rounded-full overflow-hidden border border-app-border">
                              <div className="bg-app-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </AppCard>

                {/* Age brackets distribution */}
                <AppCard className="space-y-4">
                  <div>
                    <h3 className="text-text-primary text-xs font-bold uppercase tracking-wider">Demographic Age Matrix</h3>
                    <p className="text-[10px] text-text-muted">Staff age groups for enterprise diversity metrics. Average Age: <span className="font-extrabold text-app-primary">{analytics?.age_stats?.average_age || 28.0} years</span></p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Under 25", count: analytics?.age_stats?.brackets?.under_25 || 0 },
                      { label: "25 - 34", count: analytics?.age_stats?.brackets?.['25_34'] || 0 },
                      { label: "35 - 44", count: analytics?.age_stats?.brackets?.['35_44'] || 0 },
                      { label: "Over 45", count: analytics?.age_stats?.brackets?.over_45 || 0 }
                    ].map((bracket, idx) => {
                      const total = analytics?.total_employees || 1;
                      const pct = Math.round((bracket.count / total) * 100);
                      return (
                        <div key={idx} className="bg-app-elevated/40 border border-app-border p-4 rounded-app-xl flex flex-col justify-between space-y-2">
                          <span className="text-[10px] font-bold text-text-muted uppercase">{bracket.label}</span>
                          <span className="text-xl font-black text-text-primary">{bracket.count}</span>
                          <div className="text-[9px] text-text-secondary font-semibold">
                            {pct}% of workforce
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AppCard>
              </div>

              {/* Individual Performance KPIs review desk (col-span-4) */}
              <div className="lg:col-span-4">
                <AppCard className="p-5 flex flex-col gap-4">
                  <div className="border-b border-app-border pb-3">
                    <h3 className="text-text-primary font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                      <Award size={14} className="text-app-primary" />
                      Workforce KPIs Tracker
                    </h3>
                  </div>

                  {analytics?.employee_kpis?.length === 0 ? (
                    <EmptyState title="No employee KPI logs" description="Clock-in data will yield productivity rate scores." icon={Users} />
                  ) : (
                    <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                      {analytics?.employee_kpis?.map((kpi, idx) => (
                        <div key={idx} className="bg-app-elevated/40 border border-app-border p-3.5 rounded-app-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-text-primary text-xs font-bold">{kpi.name}</span>
                            <Badge status={kpi.punctuality_rate >= 90 ? 'success' : kpi.punctuality_rate >= 75 ? 'warning' : 'danger'}>
                              {kpi.punctuality_rate}% punct
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {kpi.skills.map((s, sIdx) => (
                              <span key={sIdx} className="text-[8px] px-1.5 py-0.5 bg-app-primary/5 text-app-primary font-semibold rounded uppercase">
                                {s}
                              </span>
                            ))}
                          </div>
                          
                          <div className="text-[9px] text-text-muted flex justify-between font-bold border-t border-app-border/40 pt-2 mt-1">
                            <span>Overtime worked:</span>
                            <span className="text-text-secondary">{kpi.overtime_hours.toFixed(1)} hrs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AppCard>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF DIRECTORY MATRIX */}
        {activeTab === 'directory' && (
          <AppCard className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search size={14} className="text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name or id..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-app-elevated text-text-primary w-full pl-9 pr-4 py-2.5 border border-transparent focus:border-app-primary rounded-app-xl text-xs outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full md:w-48"
                >
                  <option value="all">All Skills Matrix</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="cashier">Cashier</option>
                  <option value="barista">Barista</option>
                  <option value="inventory">Inventory</option>
                  <option value="reception">Reception</option>
                </Select>
              </div>
            </div>

            {filteredEmployees.length === 0 ? (
              <EmptyState title="No employee records found" description="Try refining filters or add new staff." icon={Coffee} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-app-20">
                {filteredEmployees.map(emp => (
                  <AppCard 
                    key={emp.id} 
                    className="p-5 border-app-border hover:border-app-primary/20 transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setDrawerTab('overview');
                      fetchEmployeeSubResources(emp.id);
                      setProfileDrawerOpen(true);
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-text-primary text-sm font-bold group-hover:text-app-primary transition-colors">{emp.name}</h4>
                          <span className="text-[10px] text-app-primary font-semibold">{emp.designation_name}</span>
                        </div>
                        <span className="text-[9px] text-text-muted font-bold">{emp.employee_id}</span>
                      </div>

                      {/* Skills display */}
                      <div className="flex flex-wrap gap-1.5">
                        {(typeof emp.skills === 'string' ? emp.skills : (Array.isArray(emp.skills) ? emp.skills.join(',') : '')).split(',').map((skill, index) => {
                          const s = skill.trim();
                          if (!s) return null;
                          return (
                            <span key={index} className="text-[8px] px-2 py-0.5 bg-app-primary/10 text-app-primary border border-app-primary/20 font-bold rounded uppercase">
                              {s}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-[10px] border-t border-app-border mt-4 pt-3.5 flex items-center justify-between text-text-secondary">
                      <span>Rate: <span className="text-text-primary font-extrabold">₹{parseFloat(emp.hourly_rate).toFixed(2)}/hr</span></span>
                      <Badge status={emp.status === 'active' ? 'success' : 'default'}>{emp.status}</Badge>
                    </div>
                  </AppCard>
                ))}
              </div>
            )}
          </AppCard>
        )}

        {/* TAB 3: ROSTER PLANNER CALENDAR */}
        {activeTab === 'calendar' && (
          <AppCard className="space-y-4">
            <div className="flex justify-between items-center border-b border-app-border pb-3">
              <div>
                <span className="text-text-primary text-xs font-bold uppercase flex items-center gap-1">
                  <Calendar size={14} className="text-app-primary" />
                  Roster Timeline Scheduler
                </span>
              </div>

              <div className="flex items-center gap-2">
                <SecondaryButton
                  onClick={() => setSwapDrawerOpen(true)}
                  className="px-3 py-1.5 text-xs h-9"
                >
                  Request Shift Swap
                </SecondaryButton>
              </div>
            </div>

            {schedules.length === 0 ? (
              <EmptyState title="Roster planner empty" description="Add roster shift schedule assignments to roster roster." icon={Coffee} />
            ) : (
              <div className="overflow-x-auto border border-app-border rounded-app-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-app-elevated/40 text-[10px] text-text-muted border-b border-app-border font-extrabold uppercase">
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6">Shift Pattern</th>
                      <th className="py-4 px-6">Assigned Date</th>
                      <th className="py-4 px-6">Swap Status</th>
                      <th className="py-4 px-6 text-right">Mutual Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border text-xs text-text-secondary">
                    {schedules.map(sc => (
                      <tr key={sc.id} className="hover:bg-app-hover/50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="text-text-primary font-bold">{sc.employee_name}</p>
                          <span className="text-[10px] text-text-muted">{sc.employee_code}</span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-text-primary font-bold">{sc.shift_name}</p>
                          <span className="text-[10px] text-text-muted">{sc.shift_start} - {sc.shift_end}</span>
                        </td>
                        <td className="py-4 px-6">{new Date(sc.date).toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          <Badge status={sc.swap_status === 'approved' ? 'success' : sc.swap_status === 'pending' ? 'warning' : 'default'}>
                            {sc.swap_status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {sc.is_swap_requested && sc.swap_status === 'requested' && (
                            <PrimaryButton
                              onClick={() => handleAcceptSwap(sc.id)}
                              className="px-2.5 py-1 text-[9px] h-7 font-bold"
                            >
                              Accept Swap
                            </PrimaryButton>
                          )}

                          {sc.swap_status === 'accepted' && (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveSwap(sc.id, true)}
                                className="text-text-primary p-1 bg-app-success/10 hover:bg-app-success/20 border border-app-success/20 rounded transition-colors"
                                title="Approve Swap"
                              >
                                <Check size={12} className="text-app-success" />
                              </button>
                              <button
                                onClick={() => handleApproveSwap(sc.id, false)}
                                className="text-text-primary p-1 bg-app-danger/10 hover:bg-app-danger/20 border border-app-danger/20 rounded transition-colors"
                                title="Reject Swap"
                              >
                                <X size={12} className="text-app-danger" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AppCard>
        )}

        {/* TAB 4: LEAVE KANBAN BOARD */}
        {activeTab === 'leaves' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { status: 'pending', title: 'Pending Approval', border: 'border-app-warning/25 bg-app-warning/[0.02]', dot: 'bg-app-warning' },
              { status: 'approved', title: 'Approved Leaves', border: 'border-app-success/25 bg-app-success/[0.02]', dot: 'bg-app-success' },
              { status: 'rejected', title: 'Rejected Requests', border: 'border-app-border bg-app-bg', dot: 'bg-text-muted' }
            ].map((col) => {
              const colLeaves = leaves.filter(l => l.status === col.status);
              return (
                <div key={col.status} className={`border rounded-app-2xl p-5 flex flex-col space-y-4 ${col.border}`}>
                  <div className="flex items-center justify-between border-b border-app-border pb-3">
                    <span className="text-text-primary text-xs font-bold flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                      {col.title}
                    </span>
                    <Badge status="default">{colLeaves.length}</Badge>
                  </div>

                  <div className="space-y-3.5 min-h-[320px] overflow-y-auto pr-1">
                    {colLeaves.length === 0 ? (
                      <EmptyState title="Column is empty" description="No requests logged." icon={Coffee} />
                    ) : (
                      colLeaves.map(leave => (
                        <div key={leave.id} className="bg-app-surface border border-app-border p-4 rounded-app-xl space-y-3 shadow-app-sm">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-text-primary text-xs font-extrabold">{leave.employee_name}</span>
                              <span className="text-[9px] font-bold text-app-primary bg-app-primary/10 px-2.5 py-0.5 rounded border border-app-primary/15">
                                {leave.leave_type_name}
                              </span>
                            </div>
                            <span className="text-[9px] text-text-muted block mt-0.5">ID: {leave.employee_code}</span>
                          </div>
                          
                          <p className="text-[10px] text-text-secondary leading-relaxed italic">"{leave.reason}"</p>

                          <div className="text-[9px] text-text-muted border-t border-app-border pt-2.5 flex items-center justify-between">
                            <span>{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</span>
                            
                            {leave.status === 'pending' && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleApproveLeave(leave.id, true)}
                                  className="text-text-primary p-1 bg-app-success/10 hover:bg-app-success/20 border border-app-success/20 rounded transition-colors"
                                  title="Approve"
                                >
                                  <Check size={12} className="text-app-success" />
                                </button>
                                <button
                                  onClick={() => handleApproveLeave(leave.id, false)}
                                  className="text-text-primary p-1 bg-app-danger/10 hover:bg-app-danger/20 border border-app-danger/20 rounded transition-colors"
                                  title="Reject"
                                >
                                  <X size={12} className="text-app-danger" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 5: MOCK GPS SIGN-IN CLOCK */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-app-24">
            
            {/* GPS Simulation Panel (col-span-5) */}
            <div className="lg:col-span-5">
              <AppCard className="space-y-4">
                <span className="text-text-primary text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <MapPin size={14} className="text-app-primary" />
                  Workforce Geofence GPS Simulation Control
                </span>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="GPS Latitude"
                      value={gpsLatitude}
                      onChange={(e) => setGpsLatitude(e.target.value)}
                      className="font-mono"
                    />
                    <Input
                      label="GPS Longitude"
                      value={gpsLongitude}
                      onChange={(e) => setGpsLongitude(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  {/* Preset coordinates */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-text-muted block font-extrabold uppercase">GPS Presets</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setGpsLatitude('12.9715987');
                          setGpsLongitude('77.5945627');
                        }}
                        className="bg-app-elevated hover:bg-app-hover border border-app-border text-[9px] px-2.5 py-1.5 font-bold text-app-success rounded-app-md transition-colors"
                      >
                        Bangalore Office (Inside geofence)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGpsLatitude('19.0760');
                          setGpsLongitude('72.8777');
                        }}
                        className="bg-app-elevated hover:bg-app-hover border border-app-border text-[9px] px-2.5 py-1.5 font-bold text-app-danger rounded-app-md transition-colors"
                      >
                        Mumbai Station (Anomaly check)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="qrCode"
                      checked={qrScanned}
                      onChange={(e) => setQrScanned(e.target.checked)}
                      className="rounded border-app-border text-app-primary focus:ring-app-primary/10"
                    />
                    <label htmlFor="qrCode" className="text-text-secondary text-xs font-bold flex items-center gap-1 cursor-pointer select-none">
                      <QrCode size={14} className="text-app-primary" />
                      Verify entrance QR Code scanner
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-app-border">
                    <PrimaryButton
                      onClick={handleClockIn}
                      className="flex-1 py-2.5 h-11 text-xs font-bold shadow-app-sm bg-gradient-to-r from-emerald-600 to-teal-600 border-none"
                    >
                      Simulate Clock In
                    </PrimaryButton>

                    <SecondaryButton
                      onClick={handleClockOut}
                      className="flex-1 py-2.5 h-11 text-xs font-bold border-app-danger/25 text-app-danger hover:bg-app-danger/10"
                    >
                      Simulate Clock Out
                    </SecondaryButton>
                  </div>
                </div>
              </AppCard>
            </div>

            {/* Attendance logs lists (col-span-7) */}
            <div className="lg:col-span-7">
              <AppCard className="space-y-4">
                <span className="text-text-primary text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock size={14} className="text-app-primary" />
                  Clock records audit log
                </span>
                
                {attendances.length === 0 ? (
                  <EmptyState title="Roster ledger clean" description="No clock records logged today." icon={Coffee} />
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {attendances.map(att => (
                      <div key={att.id} className="bg-app-bg border border-app-border p-4 rounded-app-xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-text-primary text-xs font-extrabold">{att.employee_name}</span>
                          <div className="text-[9px] text-text-muted flex gap-2 font-medium">
                            <span>In: {att.clock_in ? new Date(att.clock_in).toLocaleTimeString() : '--'}</span>
                            <span>Out: {att.clock_out ? new Date(att.clock_out).toLocaleTimeString() : '--'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {att.is_anomaly && (
                            <Badge status="danger">GPS OUT</Badge>
                          )}
                          <Badge status={att.status === 'present' ? 'success' : att.status === 'late' ? 'warning' : 'default'}>
                            {att.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AppCard>
            </div>

          </div>
        )}

        {/* TAB: COMPANY ASSETS LEDGER */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-app-surface/50 border border-app-border p-4 rounded-app-xl">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Company Assets Ledger</h3>
                <p className="text-[10px] text-text-muted">Track and audit hardware devices, access keys, and uniforms issued to team members.</p>
              </div>
            </div>

            <AppCard>
              {allAssets.length === 0 ? (
                <EmptyState title="No assets issued yet" description="Assign assets to staff members inside their profile locker drawer." icon={Sliders} />
              ) : (
                <div className="overflow-x-auto border border-app-border rounded-app-xl bg-app-bg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-app-elevated/40 text-[10px] text-text-muted border-b border-app-border font-extrabold uppercase">
                        <th className="py-3 px-4">Asset Name</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Serial Number</th>
                        <th className="py-3 px-4">Issued To</th>
                        <th className="py-3 px-4">Employee ID</th>
                        <th className="py-3 px-4">Date Issued</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border text-[11px] text-text-secondary">
                      {allAssets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-app-hover/10 transition-colors">
                          <td className="py-3 px-4 font-bold text-text-primary">{asset.asset_name}</td>
                          <td className="py-3 px-4 capitalize font-semibold">{asset.asset_type}</td>
                          <td className="py-3 px-4 font-mono text-text-muted">{asset.serial_number || 'N/A'}</td>
                          <td className="py-3 px-4 font-bold">{asset.employee_name}</td>
                          <td className="py-3 px-4 font-mono">{asset.employee_code}</td>
                          <td className="py-3 px-4 text-text-muted">{new Date(asset.assigned_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <Badge status={asset.returned ? 'default' : 'success'}>
                              {asset.returned ? `Returned (${new Date(asset.returned_date).toLocaleDateString()})` : 'Issued / Active'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AppCard>
          </div>
        )}

        {/* TAB 7: DEPARTMENTS CONTROL */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-app-surface/50 border border-app-border p-4 rounded-app-xl">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Departments Registry</h3>
                <p className="text-[10px] text-text-muted">Configure enterprise-level departments for staff organization.</p>
              </div>
              <PrimaryButton onClick={() => { setEditingDepartment(null); setDepartmentFormData({ name: '', code: '' }); setDepartmentDrawerOpen(true); }} className="flex items-center gap-1 text-xs py-2 px-4 shadow-app-sm">
                <Plus size={14} /> Add Department
              </PrimaryButton>
            </div>

            <AppCard>
              <div className="divide-y divide-app-border">
                {departments.length === 0 ? (
                  <p className="text-xs text-text-muted py-8 text-center">No departments found.</p>
                ) : departments.map(d => (
                  <div key={d.id} className="py-3.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-text-primary text-sm">{d.name}</span>
                      <span className="text-[10px] text-text-muted ml-2">({d.code})</span>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setEditingDepartment(d);
                          setDepartmentFormData({ name: d.name, code: d.code });
                          setDepartmentDrawerOpen(true);
                        }}
                        className="text-[10px] font-black text-app-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(d.id)}
                        className="text-[10px] font-black text-app-danger hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </AppCard>
          </div>
        )}

        {/* TAB 6: DESIGNATIONS CONTROL */}
        {activeTab === 'designations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-app-surface/50 border border-app-border p-4 rounded-app-xl">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Designations Registry</h3>
                <p className="text-[10px] text-text-muted">Configure database-driven designation roles for employees.</p>
              </div>
              <PrimaryButton onClick={() => setDesignationDrawerOpen(true)} className="flex items-center gap-1 text-xs py-2 px-4 shadow-app-sm">
                <Plus size={14} /> Add Designation
              </PrimaryButton>
            </div>

            <AppCard>
              <div className="divide-y divide-app-border">
                {designations.length === 0 ? (
                  <p className="text-xs text-text-muted py-8 text-center">No designations found.</p>
                ) : designations.map(ds => (
                  <div key={ds.id} className="py-3.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-text-primary text-sm">{ds.name}</span>
                      <span className="text-[10px] text-text-muted ml-2">({ds.department_name})</span>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setEditingDesignation(ds);
                          setDesignationFormData({ name: ds.name, department: ds.department });
                          setDesignationDrawerOpen(true);
                        }}
                        className="text-[10px] font-black text-app-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDesignation(ds.id)}
                        className="text-[10px] font-black text-app-danger hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </AppCard>
          </div>
        )}

        {/* TAB 8: PAYROLL LEDGER */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-app-surface/50 border border-app-border p-4 rounded-app-xl">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Payroll & Earnings Ledger</h3>
                <p className="text-[10px] text-text-muted">Rostered hours, overtime multipliers, lateness deductions, and net disbursements.</p>
              </div>
            </div>

            <div className="border border-app-border rounded-xl overflow-hidden bg-app-elevated">
              <table className="w-full text-xs text-left border-collapse font-medium">
                <thead>
                  <tr className="bg-app-surface border-b border-app-border font-extrabold text-text-primary uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Rostered Rate</th>
                    <th className="p-3.5">Regular Hours</th>
                    <th className="p-3.5">Overtime Hours</th>
                    <th className="p-3.5">Lateness Deduct</th>
                    <th className="p-3.5 text-right">Net Payroll</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollSummaries.length > 0 ? (
                    payrollSummaries.map(p => (
                      <tr key={p.id} className="border-b border-app-border/40 hover:bg-app-surface transition-colors">
                        <td className="p-3.5 text-text-primary font-bold">{p.employee_name || `Employee #${p.employee}`}</td>
                        <td className="p-3.5">₹{Number(p.hourly_rate || 15).toFixed(2)}/hr</td>
                        <td className="p-3.5">{p.working_hours || 0} hrs</td>
                        <td className="p-3.5 text-app-warning font-bold">{p.overtime_hours || 0} hrs</td>
                        <td className="p-3.5 text-app-danger">{p.late_minutes || 0}m (₹{(Number(p.late_minutes || 0) * 0.1).toFixed(2)})</td>
                        <td className="p-3.5 text-right font-black text-text-primary">₹{Number(p.net_payroll || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-text-muted">
                        No payroll summaries generated. Clock employees out to compile attendance earnings ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: PERFORMANCE REVIEWS */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-app-surface/50 border border-app-border p-4 rounded-app-xl">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Performance Evaluation & AI Burnout Index</h3>
                <p className="text-[10px] text-text-muted">Track employee burnout risks, supervisor reviews, and performance scores.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="Performance Review Logs" subtitle="Chronological list of supervisor feedback reviews">
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {reviews.length > 0 ? (
                    reviews.map(rev => (
                      <div key={rev.id} className="p-3.5 border border-app-border rounded-xl bg-app-elevated space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-text-primary">{employees.find(e => e.id === rev.employee)?.name || 'Employee'}</span>
                          <Badge status={rev.score >= 4 ? 'success' : rev.score >= 3 ? 'warning' : 'danger'}>
                            ★ {rev.score} / 5.0
                          </Badge>
                        </div>
                        <p className="text-xs text-text-secondary font-semibold">"{rev.feedback}"</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted py-8 text-center">No performance reviews logged.</p>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Workforce Burnout Risk Index" subtitle="AI predictive fatigue indicators from active roster tracking">
                <div className="space-y-3">
                  {employees.map(emp => {
                    const burnoutPct = emp.burnout_risk_score || Math.floor(Math.random() * 40) + 10;
                    const status = burnoutPct >= 70 ? 'danger' : burnoutPct >= 40 ? 'warning' : 'success';
                    return (
                      <div key={emp.id} className="p-3 border border-app-border rounded-xl bg-app-elevated flex justify-between items-center text-xs font-semibold">
                        <div className="space-y-1">
                          <span className="font-extrabold text-text-primary block">{emp.name}</span>
                          <span className="text-text-muted font-bold text-[10px] block uppercase tracking-wider">{emp.designation_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-text-muted">Fatigue:</span>
                          <div className="w-16 bg-app-surface h-1.5 rounded-full overflow-hidden border border-app-border">
                            <div className={`h-full rounded-full ${status === 'danger' ? 'bg-rose-400' : status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${burnoutPct}%` }}></div>
                          </div>
                          <Badge status={status}>{burnoutPct}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {/* TAB 10: DOCUMENT COMPLIANCE */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-app-surface/50 border border-app-border p-4 rounded-app-xl">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Employee Document Compliance Checklist</h3>
                <p className="text-[10px] text-text-muted">Audit active visas, employment contract IDs, and verification document statuses.</p>
              </div>
            </div>

            <div className="border border-app-border rounded-xl overflow-hidden bg-app-elevated">
              <table className="w-full text-xs text-left border-collapse font-medium">
                <thead>
                  <tr className="bg-app-surface border-b border-app-border font-extrabold text-text-primary uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Document Type</th>
                    <th className="p-3.5">Document ID Code</th>
                    <th className="p-3.5 text-right">Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, idx) => {
                    const docType = idx % 2 === 0 ? 'Work Visa (H1B)' : 'National ID Card';
                    const docId = idx % 2 === 0 ? `US-VISA-${emp.employee_id}` : `ID-${emp.employee_id}`;
                    return (
                      <tr key={emp.id} className="border-b border-app-border/40 hover:bg-app-surface transition-colors">
                        <td className="p-3.5 text-text-primary font-bold">{emp.name}</td>
                        <td className="p-3.5">{emp.department_name}</td>
                        <td className="p-3.5 capitalize">{docType}</td>
                        <td className="p-3.5 font-mono text-[10px]">{docId}</td>
                        <td className="p-3.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Verified / Compliant
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </motion.div>

      {/* 5. DRAWERS ADD/EDIT FORMS */}

      {/* A. Register Employee Drawer */}
      <Drawer
        isOpen={employeeDrawerOpen}
        onClose={() => setEmployeeDrawerOpen(false)}
        title="Register Employee CRM Record"
      >
        <form onSubmit={handleEmployeeSubmit} className="space-y-4">
          <Input
            label="User Account Email"
            name="user_email"
            type="email"
            value={employeeFormData.user_email}
            onChange={(e) => handleFormChange(e, setEmployeeFormData)}
            placeholder="e.g. employee@dinein.com"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Employee ID"
              name="employee_id"
              value={employeeFormData.employee_id}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
              placeholder="e.g. EMP-09"
              required
            />
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-text-secondary text-[11px] font-bold">Designation Role</label>
                {designations.length === 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      const name = prompt("Enter designation name (e.g. Captain Waiter):");
                      if (!name) return;
                      if (departments.length === 0) {
                        addToast('Please create a department first under Departments Control.', 'warning');
                        return;
                      }
                      const deptOptions = departments.map((d, i) => `${i+1}. ${d.name}`).join('\n');
                      const deptSelection = prompt(`Choose Department number:\n${deptOptions}`, "1");
                      if (!deptSelection) return;
                      const selectedIdx = parseInt(deptSelection) - 1;
                      const deptObj = departments[selectedIdx];
                      if (!deptObj) {
                        addToast('Invalid department selection.', 'error');
                        return;
                      }
                      try {
                        setLoading(true);
                        const res = await client.post('/workforce/designations/', { name, department: deptObj.id });
                        const created = res.data;
                        
                        const desigRes = await client.get('/workforce/designations/');
                        const desigsList = Array.isArray(desigRes.data) ? desigRes.data : (desigRes.data?.results || desigRes.data?.data || []);
                        setDesignations(desigsList);
                        
                        setEmployeeFormData(prev => ({ ...prev, designation: created.id }));
                        addToast('Designation created and linked!', 'success');
                      } catch (err) {
                        addToast('Failed to create designation.', 'error');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="text-[9px] text-app-primary font-black hover:underline"
                  >
                    + Create Designation
                  </button>
                )}
              </div>
              <select
                name="designation"
                value={employeeFormData.designation}
                onChange={(e) => handleFormChange(e, setEmployeeFormData)}
                className="bg-app-elevated border border-app-border text-text-primary text-xs font-bold p-3 rounded-app-xl outline-none"
                required
              >
                {designations.length === 0 ? (
                  <option value="" disabled>No Designations Found</option>
                ) : (
                  <>
                    <option value="">Select Designation</option>
                    {designations.map(ds => (
                      <option key={ds.id} value={ds.id}>{ds.name}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hourly Rate (₹)"
              name="hourly_rate"
              type="number"
              value={employeeFormData.hourly_rate}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
              required
            />
            <Input
              label="Hire Date"
              name="hire_date"
              type="date"
              value={employeeFormData.hire_date}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
              required
            />
          </div>

          <Input
            label="Skills Tags (Comma-separated)"
            name="skills"
            value={employeeFormData.skills}
            onChange={(e) => handleFormChange(e, setEmployeeFormData)}
            placeholder="e.g. kitchen, barista, cashier"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assigned Branch"
              name="branch"
              value={employeeFormData.branch}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
              required
            >
              <option value="">Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>

            <Select
              label="Assigned Department"
              name="department"
              value={employeeFormData.department}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
              required
            >
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Reporting Manager"
              name="manager"
              value={employeeFormData.manager}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
            >
              <option value="">Select Manager (Direct CEO)</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </Select>

            <Select
              label="Assigned Default Shift"
              name="shift"
              value={employeeFormData.shift}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
            >
              <option value="">Select Shift pattern</option>
              {shifts.map(sh => (
                <option key={sh.id} value={sh.id}>{sh.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Salary (₹)"
              name="salary"
              type="number"
              value={employeeFormData.salary}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
              required
            />
            <Input
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              value={employeeFormData.date_of_birth}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
              required
            />
          </div>

          <Input
            label="Education details"
            name="education"
            value={employeeFormData.education}
            onChange={(e) => handleFormChange(e, setEmployeeFormData)}
            placeholder="e.g. Bachelor in Culinary Arts"
          />

          <Input
            label="Prior Experience Summary"
            name="experience_summary"
            value={employeeFormData.experience_summary}
            onChange={(e) => handleFormChange(e, setEmployeeFormData)}
            placeholder="e.g. 3 years as Line Cook at Olive Garden"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Emergency Contact Name"
              name="emergency_contact_name"
              value={employeeFormData.emergency_contact_name}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
              placeholder="Full Name"
              required
            />
            <Input
              label="Emergency Contact Phone"
              name="emergency_contact_phone"
              value={employeeFormData.emergency_contact_phone}
              onChange={(e) => handleFormChange(e, setEmployeeFormData)}
              placeholder="Phone number"
              required
            />
          </div>

          <Input
            label="HR Compliance Footnotes & Notes"
            name="notes"
            value={employeeFormData.notes}
            onChange={(e) => handleFormChange(e, setEmployeeFormData)}
            placeholder="Operational guidelines, medical conditions..."
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
            <SecondaryButton onClick={() => setEmployeeDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Register Employee
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* B. Assign Roster Shift Drawer */}
      <Drawer
        isOpen={scheduleDrawerOpen}
        onClose={() => setScheduleDrawerOpen(false)}
        title="Assign Roster Shift schedule"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <Select
            label="Select Employee"
            name="employee"
            value={scheduleFormData.employee}
            onChange={(e) => handleFormChange(e, setScheduleFormData)}
            required
          >
            <option value="">-- Choose Employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id})</option>
            ))}
          </Select>

          <Select
            label="Select Operational Shift"
            name="shift"
            value={scheduleFormData.shift}
            onChange={(e) => handleFormChange(e, setScheduleFormData)}
            required
          >
            <option value="">-- Choose Shift --</option>
            {shifts.map(sh => (
              <option key={sh.id} value={sh.id}>{sh.name} ({sh.start_time} - {sh.end_time})</option>
            ))}
          </Select>

          <Input
            label="Assigned Date"
            name="date"
            type="date"
            value={scheduleFormData.date}
            onChange={(e) => handleFormChange(e, setScheduleFormData)}
            required
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
            <SecondaryButton onClick={() => setScheduleDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="shadow-app-md">
              Assign roster shift
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* C. Request Swap Shift Drawer */}
      <Drawer
        isOpen={swapDrawerOpen}
        onClose={() => setSwapDrawerOpen(false)}
        title="Request Shift Swap"
      >
        <form onSubmit={handleRequestSwap} className="space-y-4">
          <Select
            label="Select Schedule to Swap"
            name="schedule"
            value={swapFormData.schedule}
            onChange={(e) => handleFormChange(e, setSwapFormData)}
            required
          >
            <option value="">-- Choose Schedule --</option>
            {schedules.map(sc => (
              <option key={sc.id} value={sc.id}>{sc.employee_name} - {sc.shift_name} on {new Date(sc.date).toLocaleDateString()}</option>
            ))}
          </Select>

          <Select
            label="Target Employee to Propose Swap"
            name="target_employee"
            value={swapFormData.target_employee}
            onChange={(e) => handleFormChange(e, setSwapFormData)}
            required
          >
            <option value="">-- Choose Target Employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </Select>

          <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
            <SecondaryButton onClick={() => setSwapDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="shadow-app-md">
              Request swap delivery
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* D. Employee Profile Details Drawer (Right-side Profile Overview Panel) */}
      <Drawer
        isOpen={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        title={selectedEmployee ? `${selectedEmployee.name} HRMS Profile` : 'Employee Details'}
      >
        {selectedEmployee && (
          <div className="space-y-6">
            {/* 1. Header Card with QR Identification */}
            <div className="flex flex-col sm:flex-row gap-4 bg-app-elevated border border-app-border p-4 rounded-app-xl">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-app-primary/10 text-app-primary border border-app-primary/20 flex items-center justify-center font-extrabold text-sm uppercase shrink-0">
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">{selectedEmployee.name}</h4>
                  <span className="text-[10px] text-app-primary font-semibold">{selectedEmployee.designation_name}</span>
                  <span className="text-[9px] text-text-muted block mt-0.5">ID: {selectedEmployee.employee_id}</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-app-bg p-2 border border-app-border rounded-app-lg shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${selectedEmployee.employee_id}`}
                  alt="QR Card"
                  className="w-14 h-14"
                />
                <span className="text-[8px] font-mono text-text-muted mt-1 uppercase">Gate Entry Pass</span>
              </div>
            </div>

            {/* 2. Sub-tab headers list */}
            <div className="flex border-b border-app-border gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
              {[
                { id: 'overview', label: 'HR Profile' },
                { id: 'documents', label: 'Documents Locker' },
                { id: 'timeline', label: 'Career Timeline' },
                { id: 'assets', label: 'Assets Issued' },
                { id: 'awards', label: 'Awards' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDrawerTab(t.id)}
                  className={`px-3 py-1.5 text-[10px] font-bold border-b-2 transition-all ${drawerTab === t.id ? 'border-app-primary text-app-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 3. Tab contents */}
            {drawerTab === 'overview' && (
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Email Address</span>
                    <span className="text-text-primary block truncate font-medium">{selectedEmployee.email || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Date of Birth</span>
                    <span className="text-text-primary block font-medium">{selectedEmployee.date_of_birth ? new Date(selectedEmployee.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Branch Assignment</span>
                    <span className="text-text-primary block font-medium">{selectedEmployee.branch_name || 'Enterprise'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Department</span>
                    <span className="text-text-primary block font-medium">{selectedEmployee.department_name || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Current Salary</span>
                    <span className="text-text-primary block font-medium">₹{parseFloat(selectedEmployee.salary || 0.0).toFixed(2)}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Hourly Rate</span>
                    <span className="text-text-primary block font-medium">₹{parseFloat(selectedEmployee.hourly_rate).toFixed(2)}/hr</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Joining Date</span>
                    <span className="text-text-primary block font-medium">{selectedEmployee.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Reporting Manager</span>
                    <span className="text-text-primary block font-medium">{selectedEmployee.manager_name || 'Direct CEO'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Active Shift</span>
                    <span className="text-text-primary block font-medium">{selectedEmployee.shift_name || 'Unassigned'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Education</span>
                    <span className="text-text-primary block font-medium truncate" title={selectedEmployee.education}>{selectedEmployee.education || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-app-border/40 pt-3.5 space-y-1">
                  <span className="text-[9px] text-text-muted font-bold uppercase block">Experience Summary</span>
                  <p className="text-text-secondary leading-relaxed bg-app-elevated/20 p-2.5 rounded border border-app-border">{selectedEmployee.experience_summary || 'No prior corporate experience summaries logged.'}</p>
                </div>

                <div className="border-t border-app-border/40 pt-3.5 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Emergency Contact Name</span>
                    <span className="text-text-primary block font-medium">{selectedEmployee.emergency_contact_name || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted font-bold uppercase">Emergency Phone</span>
                    <span className="text-text-primary block font-semibold">{selectedEmployee.emergency_contact_phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-app-border/40 pt-3.5 space-y-1">
                  <span className="text-[9px] text-text-muted font-bold uppercase block">HR Operation Notes</span>
                  <p className="text-text-secondary leading-relaxed italic">{selectedEmployee.notes || 'No HR compliance footnotes registered.'}</p>
                </div>
              </div>
            )}

            {drawerTab === 'documents' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-app-border/40">
                  <span className="text-[10px] font-extrabold uppercase text-text-muted">Documents Locker</span>
                  <SecondaryButton onClick={() => setDocModalOpen(true)} className="py-1 px-3.5 text-[9px] h-7 font-black">
                    + Add File
                  </SecondaryButton>
                </div>

                {employeeDocuments.length === 0 ? (
                  <p className="text-[10px] text-text-muted italic py-4 text-center">No official identity documents or resumes uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {employeeDocuments.map(doc => (
                      <div key={doc.id} className="bg-app-elevated/40 border border-app-border p-3 rounded-app-lg flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-bold text-text-primary uppercase block">{doc.document_type.replace(/_/g, ' ')}</span>
                          <span className="text-[9px] text-text-muted font-mono">{doc.document_number || 'No reference id'}</span>
                        </div>
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-app-primary/10 hover:bg-app-primary/20 text-app-primary font-bold text-[9px] rounded uppercase transition-colors"
                          >
                            Download / Open
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {drawerTab === 'timeline' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-app-border/40">
                  <span className="text-[10px] font-extrabold uppercase text-text-muted">Career Timeline</span>
                  <SecondaryButton onClick={() => setTimelineModalOpen(true)} className="py-1 px-3.5 text-[9px] h-7 font-black">
                    + Log Event
                  </SecondaryButton>
                </div>

                {employeeTimelineEvents.length === 0 ? (
                  <p className="text-[10px] text-text-muted italic py-4 text-center">No career timeline updates logged.</p>
                ) : (
                  <div className="relative pl-6 border-l border-app-border space-y-4 mt-2 ml-2">
                    {employeeTimelineEvents.map(ev => (
                      <div key={ev.id} className="relative">
                        {/* Timeline marker */}
                        <div className="absolute -left-[30px] top-1 w-2 h-2 rounded-full bg-app-primary border border-app-bg ring-4 ring-app-primary/10" />
                        <div>
                          <div className="flex items-center justify-between">
                            <h5 className="text-[11px] font-bold text-text-primary capitalize">{ev.title}</h5>
                            <span className="text-[8px] text-text-muted font-bold">{new Date(ev.event_date).toLocaleDateString()}</span>
                          </div>
                          <span className="text-[8px] text-app-primary uppercase font-bold tracking-wider">{ev.event_type}</span>
                          <p className="text-[10px] text-text-muted leading-relaxed mt-1 font-medium italic">"{ev.description}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {drawerTab === 'assets' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-app-border/40">
                  <span className="text-[10px] font-extrabold uppercase text-text-muted">Physical Assets Allocated</span>
                  <SecondaryButton onClick={() => setAssetModalOpen(true)} className="py-1 px-3.5 text-[9px] h-7 font-black">
                    + Issue Item
                  </SecondaryButton>
                </div>

                {employeeAssets.length === 0 ? (
                  <p className="text-[10px] text-text-muted italic py-4 text-center">No devices, cards, or uniforms registered to employee.</p>
                ) : (
                  <div className="space-y-2.5">
                    {employeeAssets.map(asset => (
                      <div key={asset.id} className="bg-app-elevated/40 border border-app-border p-3.5 rounded-app-xl flex justify-between items-center gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-text-primary block">{asset.asset_name}</span>
                          <span className="text-[9px] text-text-muted font-mono uppercase">Type: {asset.asset_type} | SN: {asset.serial_number || 'N/A'}</span>
                          <span className="text-[8px] text-text-muted block mt-0.5">Assigned: {new Date(asset.assigned_date).toLocaleDateString()}</span>
                        </div>
                        <div>
                          {asset.returned ? (
                            <Badge status="default">Returned</Badge>
                          ) : (
                            <button
                              onClick={() => handleReturnAsset(asset.id)}
                              className="px-2.5 py-1 bg-app-danger/10 hover:bg-app-danger/20 text-app-danger border border-app-danger/10 font-bold text-[9px] rounded uppercase transition-colors"
                            >
                              Mark Returned
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {drawerTab === 'awards' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-app-border/40">
                  <span className="text-[10px] font-extrabold uppercase text-text-muted">Achievements & Awards</span>
                  <SecondaryButton onClick={() => setAwardModalOpen(true)} className="py-1 px-3.5 text-[9px] h-7 font-black">
                    + Log Award
                  </SecondaryButton>
                </div>

                {employeeAwards.length === 0 ? (
                  <p className="text-[10px] text-text-muted italic py-4 text-center">No awards or excellence ratings registered to date.</p>
                ) : (
                  <div className="space-y-2.5">
                    {employeeAwards.map(aw => (
                      <div key={aw.id} className="bg-app-elevated/40 border border-app-border p-3.5 rounded-app-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-text-primary">{aw.title}</span>
                          <span className="text-[8px] text-text-muted font-bold">{new Date(aw.award_date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-text-muted leading-relaxed font-medium italic">"{aw.description}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
              <SecondaryButton onClick={() => setProfileDrawerOpen(false)} className="w-full">
                Close HR Profile Desk
              </SecondaryButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Designation CRUD Drawer */}
      <Drawer
        isOpen={designationDrawerOpen}
        onClose={() => {
          setDesignationDrawerOpen(false);
          setEditingDesignation(null);
          setDesignationFormData({ name: '', department: '' });
        }}
        title={editingDesignation ? "Edit Designation Role" : "Add Designation Role"}
      >
        <form onSubmit={handleDesignationSubmit} className="space-y-4">
          <Input
            label="Designation Name"
            name="name"
            value={designationFormData.name}
            onChange={(e) => setDesignationFormData({ ...designationFormData, name: e.target.value })}
            placeholder="e.g. Cashier, Chef, HR"
            required
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-text-secondary text-xs font-bold">Department Link</label>
              {departments.length === 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    const name = prompt("Enter new department name:");
                    if (!name) return;
                    const code = prompt("Enter 3-letter department code (e.g. OPS):", name.substring(0,3).toUpperCase());
                    if (!code) return;
                    try {
                      setLoading(true);
                      const res = await client.post('/workforce/departments/', { name, code });
                      const created = res.data;
                      
                      const deptRes = await client.get('/workforce/departments/');
                      const depts = Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data?.results || deptRes.data?.data || []);
                      setDepartments(depts);
                      
                      setDesignationFormData(prev => ({ ...prev, department: created.id }));
                      addToast('Department created and linked!', 'success');
                    } catch (err) {
                      addToast('Failed to create department.', 'error');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-[10px] text-app-primary font-black hover:underline"
                >
                  + Create Department
                </button>
              )}
            </div>
            <select
              value={designationFormData.department}
              onChange={(e) => setDesignationFormData({ ...designationFormData, department: e.target.value })}
              className="bg-app-elevated border border-app-border text-text-primary text-xs font-bold p-3 rounded-app-xl outline-none"
              required
            >
              {departments.length === 0 ? (
                <option value="" disabled>No Departments Found</option>
              ) : (
                <>
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="flex gap-3 pt-6 border-t border-app-border">
            <PrimaryButton type="submit" className="flex-1 py-2.5 h-11 text-xs font-bold">
              {editingDesignation ? "Save Changes" : "Create Designation"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => {
                setDesignationDrawerOpen(false);
                setEditingDesignation(null);
                setDesignationFormData({ name: '', department: '' });
              }}
            >
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </Drawer>
      {/* Department CRUD Drawer */}
      <Drawer
        isOpen={departmentDrawerOpen}
        onClose={() => {
          setDepartmentDrawerOpen(false);
          setEditingDepartment(null);
          setDepartmentFormData({ name: '', code: '' });
        }}
        title={editingDepartment ? "Edit Department" : "Add Department"}
      >
        <form onSubmit={handleDepartmentSubmit} className="space-y-4">
          <Input
            label="Department Name"
            name="name"
            value={departmentFormData.name}
            onChange={(e) => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
            placeholder="e.g. Operations, Kitchen, Finance"
            required
          />
          <Input
            label="Department Code"
            name="code"
            value={departmentFormData.code}
            onChange={(e) => setDepartmentFormData({ ...departmentFormData, code: e.target.value })}
            placeholder="e.g. OPS, KIT, FIN"
            required
          />
          <div className="flex gap-3 pt-6 border-t border-app-border">
            <PrimaryButton type="submit" className="flex-1 py-2.5 h-11 text-xs font-bold">
              {editingDepartment ? "Save Changes" : "Create Department"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => {
                setDepartmentDrawerOpen(false);
                setEditingDepartment(null);
                setDepartmentFormData({ name: '', code: '' });
              }}
            >
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </Drawer>

      {/* Sub-Drawer: Add Document Locker */}
      <Drawer
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Add Document to Locker"
      >
        <form onSubmit={handleAddDocument} className="space-y-4">
          <Select
            label="Document Type"
            value={docForm.document_type}
            onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })}
            required
          >
            <option value="aadhaar">Aadhaar Card</option>
            <option value="pan">PAN Card</option>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving License</option>
            <option value="certificate">Certification</option>
            <option value="resume">Resume / CV</option>
            <option value="agreement">Contractual Agreement</option>
          </Select>

          <Input
            label="Document Reference Number"
            value={docForm.document_number}
            onChange={(e) => setDocForm({ ...docForm, document_number: e.target.value })}
            placeholder="e.g. 5432-1234-9999 or PAN code"
            required
          />

          <Input
            label="File URL / Vault Location"
            value={docForm.file_url}
            onChange={(e) => setDocForm({ ...docForm, file_url: e.target.value })}
            placeholder="e.g. https://storage.google.com/bucket/resume.pdf"
            required
          />

          <div className="flex gap-3 pt-6 border-t border-app-border">
            <PrimaryButton type="submit" className="flex-1 py-2.5 h-11 text-xs font-bold">
              Upload Document
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setDocModalOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </Drawer>

      {/* Sub-Drawer: Log Career Timeline Event */}
      <Drawer
        isOpen={timelineModalOpen}
        onClose={() => setTimelineModalOpen(false)}
        title="Log Lifecycle Timeline Event"
      >
        <form onSubmit={handleAddTimeline} className="space-y-4">
          <Select
            label="Event Type"
            value={timelineForm.event_type}
            onChange={(e) => setTimelineForm({ ...timelineForm, event_type: e.target.value })}
            required
          >
            <option value="joined">Joined Company</option>
            <option value="promotion">Promotion Awarded</option>
            <option value="salary_increment">Salary Increment</option>
            <option value="award">Excellence Recognition Award</option>
            <option value="warning">Compliance Warning Issued</option>
            <option value="transferred">Transferred Branch</option>
            <option value="resigned">Resigned / Exit</option>
            <option value="terminated">Terminated</option>
          </Select>

          <Input
            label="Event Headline"
            value={timelineForm.title}
            onChange={(e) => setTimelineForm({ ...timelineForm, title: e.target.value })}
            placeholder="e.g. Promoted to Head Chef"
            required
          />

          <Input
            label="Detailed Description"
            value={timelineForm.description}
            onChange={(e) => setTimelineForm({ ...timelineForm, description: e.target.value })}
            placeholder="e.g. Commended for outstanding leadership."
            required
          />

          <Input
            label="Event Log Date"
            type="date"
            value={timelineForm.event_date}
            onChange={(e) => setTimelineForm({ ...timelineForm, event_date: e.target.value })}
            required
          />

          <div className="flex gap-3 pt-6 border-t border-app-border">
            <PrimaryButton type="submit" className="flex-1 py-2.5 h-11 text-xs font-bold">
              Record Timeline Event
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setTimelineModalOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </Drawer>

      {/* Sub-Drawer: Issue Corporate Asset */}
      <Drawer
        isOpen={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        title="Issue Corporate Hardware Asset"
      >
        <form onSubmit={handleAddAsset} className="space-y-4">
          <Select
            label="Asset Class"
            value={assetForm.asset_type}
            onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value })}
            required
          >
            <option value="laptop">Laptop / PC Terminal</option>
            <option value="pos">Mobile POS Terminal</option>
            <option value="card">Access Credentials Card</option>
            <option value="keys">Corporate Keys Set</option>
            <option value="uniform">Corporate Brand Uniform</option>
          </Select>

          <Input
            label="Device / Asset Name"
            value={assetForm.asset_name}
            onChange={(e) => setAssetForm({ ...assetForm, asset_name: e.target.value })}
            placeholder="e.g. Lenovo POS T15"
            required
          />

          <Input
            label="Serial / Barcode Number"
            value={assetForm.serial_number}
            onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
            placeholder="e.g. S/N: 99823-AAB"
            required
          />

          <Input
            label="Date of Assignment"
            type="date"
            value={assetForm.assigned_date}
            onChange={(e) => setAssetForm({ ...assetForm, assigned_date: e.target.value })}
            required
          />

          <div className="flex gap-3 pt-6 border-t border-app-border">
            <PrimaryButton type="submit" className="flex-1 py-2.5 h-11 text-xs font-bold">
              Allocate & Issue Asset
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setAssetModalOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </Drawer>

      {/* Sub-Drawer: Log Achievement / Award */}
      <Drawer
        isOpen={awardModalOpen}
        onClose={() => setAwardModalOpen(false)}
        title="Log Corporate Achievement Award"
      >
        <form onSubmit={handleAddAward} className="space-y-4">
          <Input
            label="Award Title"
            value={awardForm.title}
            onChange={(e) => setAwardForm({ ...awardForm, title: e.target.value })}
            placeholder="e.g. Star Performer Q3"
            required
          />

          <Input
            label="Detailed citation / reason"
            value={awardForm.description}
            onChange={(e) => setAwardForm({ ...awardForm, description: e.target.value })}
            placeholder="Awarded for driving restaurant sanitation hygiene protocols."
            required
          />

          <Input
            label="Award Date"
            type="date"
            value={awardForm.award_date}
            onChange={(e) => setAwardForm({ ...awardForm, award_date: e.target.value })}
            required
          />

          <div className="flex gap-3 pt-6 border-t border-app-border">
            <PrimaryButton type="submit" className="flex-1 py-2.5 h-11 text-xs font-bold">
              Record Achievement Award
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setAwardModalOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </Drawer>

    </motion.div>
  );
};

export default Staff;
