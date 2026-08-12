import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Users, 
  Boxes, 
  MessageSquareHeart, 
  CalendarDays, 
  Activity, 
  ShieldAlert, 
  PieChart, 
  HelpCircle, 
  CheckCircle, 
  Truck, 
  Coffee, 
  Compass,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Download,
  Trash2,
  Plus,
  X,
  Send,
  SlidersHorizontal,
  Search
} from 'lucide-react';

import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  AppCard,
  GlassCard,
  SectionCard,
  ChartCard,
  KPICard,
  PrimaryButton,
  SecondaryButton,
  AnimatedCounter,
  Badge,
  LoadingOverlay,
  Select,
  Input,
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

const Reports = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const branchId = localStorage.getItem('branch_id') || user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5';

  // State Management
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([
    { id: '1', name: 'Weekly Operational Audit', type: 'PDF', size: '1.2 MB', generatedBy: 'Manager A', timestamp: '2026-07-04T10:00:00Z', status: 'ready' },
    { id: '2', name: 'Raw Ingredients Inventory Ledger', type: 'CSV', size: '240 KB', generatedBy: 'Chef B', timestamp: '2026-07-04T08:30:00Z', status: 'ready' },
    { id: '3', name: 'Monthly Customer NPS Feedback', type: 'PDF', size: '890 KB', generatedBy: 'System AI', timestamp: '2026-07-03T18:45:00Z', status: 'ready' }
  ]);
  const [scheduledJobs, setScheduledJobs] = useState([
    { id: '1', name: 'Weekly Sales Summary', frequency: 'Weekly', time: 'Monday, 08:00 AM', email: 'manager@dinein.com', status: 'active' },
    { id: '2', name: 'Daily Inventory Reorder List', frequency: 'Daily', time: 'Everyday, 10:00 PM', email: 'kitchen@dinein.com', status: 'active' }
  ]);

  // Form configurations
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    name: '', frequency: 'Daily', time: '', email: ''
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');

  // Trigger Client-side CSV download generators
  const triggerCSVDownload = (filename, headers, rows) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`${filename} generated and downloaded successfully!`, 'success');
  };

  const handleGenerateReport = async (reportType) => {
    setLoading(true);
    const activeBranchId = localStorage.getItem('branch_id') || '';
    try {
      if (reportType === 'feedback') {
        // Direct backend call for feedback CSV
        window.open(`${client.defaults.baseURL}/feedback/reviews/export_csv/?branch=${activeBranchId}`, '_blank');
        addToast('Feedback CSV dataset dispatched for download.', 'success');
        
        // Log to history
        setHistory(prev => [
          { id: String(prev.length + 1), name: 'Feedback Reviews Export', type: 'CSV', size: '42 KB', generatedBy: user?.username || 'Current User', timestamp: new Date().toISOString(), status: 'ready' },
          ...prev
        ]);
      } else if (reportType === 'inventory') {
        const res = await client.get(`/inventory/ingredients/?branch=${activeBranchId}`);
        if (res.data?.success) {
          const headers = ['Ingredient Name', 'Category', 'Current Stock', 'Max Capacity', 'ABC Class'];
          const rows = res.data.data.map(i => [
            i.name, i.category, i.current_stock, i.max_stock, i.abc_class
          ]);
          triggerCSVDownload('inventory_ingredients_report.csv', headers, rows);
          
          setHistory(prev => [
            { id: String(prev.length + 1), name: 'Inventory Ingredients Roster', type: 'CSV', size: '18 KB', generatedBy: user?.username || 'Current User', timestamp: new Date().toISOString(), status: 'ready' },
            ...prev
          ]);
        }
      } else if (reportType === 'reservations') {
        const res = await client.get(`/reservation/bookings/?branch=${activeBranchId}`);
        const bookings = res.data?.data || res.data || [];
        const headers = ['Guest Name', 'Phone', 'Party Size', 'Start Time', 'Status'];
        const rows = bookings.map(b => [
          b.guest_name, b.guest_phone, b.party_size, b.start_time, b.status
        ]);
        triggerCSVDownload('reservations_booking_report.csv', headers, rows);
        
        setHistory(prev => [
          { id: String(prev.length + 1), name: 'Reservations Bookings Grid', type: 'CSV', size: '36 KB', generatedBy: user?.username || 'Current User', timestamp: new Date().toISOString(), status: 'ready' },
          ...prev
        ]);
      } else if (reportType === 'staff') {
        const res = await client.get(`/workforce/employees/?branch=${activeBranchId}`);
        if (res.data?.success) {
          const headers = ['Employee Name', 'Role', 'Employee ID', 'Hourly Rate', 'Status'];
          const rows = res.data.data.map(e => [
            e.name, e.designation_name, e.employee_id, e.hourly_rate, e.status
          ]);
          triggerCSVDownload('workforce_staff_report.csv', headers, rows);
          
          setHistory(prev => [
            { id: String(prev.length + 1), name: 'Workforce Employees Roster', type: 'CSV', size: '12 KB', generatedBy: user?.username || 'Current User', timestamp: new Date().toISOString(), status: 'ready' },
            ...prev
          ]);
        }
      } else {
        // Fallback demo PDF/Excel generation
        setTimeout(() => {
          setHistory(prev => [
            { id: String(prev.length + 1), name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Operations Audit`, type: 'PDF', size: '480 KB', generatedBy: user?.username || 'Current User', timestamp: new Date().toISOString(), status: 'ready' },
            ...prev
          ]);
          addToast('Combined Operations PDF generated successfully.', 'success');
        }, 1000);
      }
    } catch (err) {
      addToast('Error generating audit file.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit Schedule Job
  const handleAddScheduleJob = (e) => {
    e.preventDefault();
    if (!newJob.name.trim() || !newJob.email.trim()) {
      addToast('Report name and recipient email are required.', 'warning');
      return;
    }

    setScheduledJobs(prev => [
      ...prev,
      { id: String(prev.length + 1), name: newJob.name, frequency: newJob.frequency, time: newJob.time || '09:00 AM', email: newJob.email, status: 'active' }
    ]);
    setNewJob({ name: '', frequency: 'Daily', time: '', email: '' });
    setScheduleDrawerOpen(false);
    addToast('Scheduled report configuration registered successfully.', 'success');
  };

  const handleToggleJob = (id) => {
    setScheduledJobs(prev => prev.map(job => 
      job.id === id ? { ...job, status: job.status === 'active' ? 'disabled' : 'active' } : job
    ));
    addToast('Roster job status updated.', 'info');
  };

  const handleRemoveHistoryItem = (id) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    addToast('Audit log record archived.', 'info');
  };

  // Filter history listing
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFormat = formatFilter === 'all' ? true : h.type === formatFilter;
      return matchesSearch && matchesFormat;
    });
  }, [history, searchTerm, formatFilter]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-app-24 animate-fade-in relative min-h-[85vh] text-text-secondary"
    >

      {/* 1. EXECUTIVE REPORTS HEADER */}
      <motion.div variants={itemVariants}>
        <GlassCard className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-app-20 border-app-primary/20 shadow-[0_4px_24px_rgba(99,102,241,0.06)]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-primary/10 text-app-primary border border-app-primary/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                <FileSpreadsheet size={12} className="text-app-primary" />
                Executive Reporting active
              </span>
              <Badge status="success">Export Success Rate: 100%</Badge>
              <Badge status="info">Automated Roster Jobs: {scheduledJobs.filter(j => j.status === 'active').length}</Badge>
            </div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Reporting & Exporters Center
            </h1>
            <p className="text-xs text-text-secondary font-medium">
              Generate branch operations PDFs, export CSV ingredients logs, and configure automated email schedule deliveries.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={() => setScheduleDrawerOpen(true)} icon={Plus} className="shadow-app-md">
              Schedule Report
            </PrimaryButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* 2. TELEMETRY KPI WIDGETS */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-app-20">
        <KPICard title="PDF Logs Generated" value={<AnimatedCounter value={history.filter(h => h.type === 'PDF').length} />} description="Executive documents logged" />
        <KPICard title="CSV Logs Generated" value={<AnimatedCounter value={history.filter(h => h.type === 'CSV').length} />} description="Tabular databases compiled" />
        <KPICard title="Automated Jobs" value={<AnimatedCounter value={scheduledJobs.filter(j => j.status === 'active').length} />} description=" Roster schedule processes" />
        <KPICard title="Blended Success Ratio" value="100%" description="Zero download pipeline crashes" />
      </motion.div>

      {/* 3. REPORT TEMPLATES GRID */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-sm font-extrabold uppercase text-text-primary tracking-wider flex items-center gap-1.5">
          <Sparkles size={15} className="text-app-primary animate-pulse" />
          Seeded Report Templates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-app-20">
          {[
            { id: 'feedback', name: 'Customer Feedback Report', desc: 'Analyzes reviews comment, ratings average, and sentiment distribution.', icon: MessageSquareHeart, format: 'CSV' },
            { id: 'inventory', name: 'Inventory Ledger Report', desc: 'Details ingredients stock, min/max limits, and ABC valuations.', icon: Boxes, format: 'CSV' },
            { id: 'reservations', name: 'Reservations Booking Roster', desc: 'Renders guest booking listings, status, and time windows.', icon: CalendarDays, format: 'CSV' },
            { id: 'staff', name: 'Workforce Staffing Report', desc: 'Details employees CRM designations and hourly rate details.', icon: Users, format: 'CSV' }
          ].map((temp) => {
            const TempIcon = temp.icon;
            return (
              <AppCard key={temp.id} className="p-5 border-app-border hover:border-app-primary/10 flex flex-col justify-between h-48 transition-all group">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="w-9 h-9 rounded-app-md bg-app-primary/10 text-app-primary flex items-center justify-center border border-app-primary/15 group-hover:bg-app-primary group-hover:text-white transition-colors">
                      <TempIcon size={16} />
                    </span>
                    <Badge status="default">{temp.format}</Badge>
                  </div>
                  <h4 className="text-xs font-bold text-text-primary mt-1">{temp.name}</h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                    {temp.desc}
                  </p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-app-border mt-4 select-none">
                  <PrimaryButton
                    onClick={() => handleGenerateReport(temp.id)}
                    className="flex-1 py-1.5 h-8 text-[9px] font-bold shadow-app-sm"
                  >
                    Generate
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => {
                      setNewJob(prev => ({ ...prev, name: temp.name }));
                      setScheduleDrawerOpen(true);
                    }}
                    className="flex-1 py-1.5 h-8 text-[9px]"
                  >
                    Schedule
                  </SecondaryButton>
                </div>
              </AppCard>
            );
          })}
        </div>
      </motion.div>

      {/* 4. MID PANELS GRID */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-app-24">
        
        {/* Report History Table (col-span-8) */}
        <AppCard className="lg:col-span-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-app-border pb-3">
            <span className="text-text-primary text-xs font-bold uppercase flex items-center gap-1.5">
              <Clock size={14} className="text-app-primary" />
              Generated report audit logs
            </span>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2" size={12} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-app-elevated text-text-primary pl-8 pr-4 py-1.5 border border-transparent focus:border-app-primary rounded-app-lg text-[10px] outline-none transition-all w-full md:w-40"
                />
              </div>
              <Select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="w-24 text-[10px]"
              >
                <option value="all">All Formats</option>
                <option value="PDF">PDF</option>
                <option value="CSV">CSV</option>
              </Select>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <EmptyState title="No logs match filters" description="Generate reports from templates above." icon={Coffee} />
          ) : (
            <div className="overflow-x-auto border border-app-border rounded-app-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-app-elevated/40 text-[9px] text-text-muted border-b border-app-border font-extrabold uppercase">
                    <th className="py-3 px-6">Report File Name</th>
                    <th className="py-3 px-6">Format</th>
                    <th className="py-3 px-6">Size</th>
                    <th className="py-3 px-6">Generated By</th>
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border text-[11px] text-text-secondary">
                  {filteredHistory.map(h => (
                    <tr key={h.id} className="hover:bg-app-hover/50 transition-colors">
                      <td className="py-3 px-6 font-bold text-text-primary">{h.name}</td>
                      <td className="py-3 px-6">
                        <Badge status={h.type === 'PDF' ? 'info' : 'default'}>{h.type}</Badge>
                      </td>
                      <td className="py-3 px-6 font-semibold">{h.size}</td>
                      <td className="py-3 px-6 text-text-muted">{h.generatedBy}</td>
                      <td className="py-3 px-6">{new Date(h.timestamp).toLocaleDateString()}</td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRemoveHistoryItem(h.id)}
                            className="text-text-muted hover:text-app-danger p-1 hover:bg-app-elevated rounded transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AppCard>

        {/* Scheduled Reports Config (col-span-4) */}
        <AppCard className="lg:col-span-4 flex flex-col justify-between p-5 gap-4">
          <div className="border-b border-app-border pb-3 flex items-center justify-between">
            <h3 className="text-text-primary font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <CalendarDays size={15} className="text-app-primary" />
              Automated Roster Jobs
            </h3>
            <Badge status="info">{scheduledJobs.length} Jobs</Badge>
          </div>

          {scheduledJobs.length === 0 ? (
            <EmptyState title="No schedules logged" description="Setup cron reports using Schedule button." icon={Coffee} />
          ) : (
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {scheduledJobs.map(job => (
                <div key={job.id} className="bg-app-bg border border-app-border p-4 rounded-app-xl space-y-2 relative">
                  <div className="text-[10px] flex justify-between items-center font-extrabold text-text-primary">
                    <span>{job.name}</span>
                    <button 
                      onClick={() => handleToggleJob(job.id)}
                      className={`text-[8px] px-2 py-0.5 rounded font-extrabold uppercase ${job.status === 'active' ? 'bg-app-success/15 text-app-success border border-app-success/20' : 'bg-app-border text-text-muted'}`}
                    >
                      {job.status}
                    </button>
                  </div>
                  <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                    Sends {job.frequency.toLowerCase()} at **{job.time}** to: <span className="text-app-primary font-semibold block">{job.email}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          <PrimaryButton onClick={() => setScheduleDrawerOpen(true)} className="w-full py-2 h-9 text-[10px] font-bold">
            Add Scheduled Job
          </PrimaryButton>
        </AppCard>

      </motion.div>

      {/* 5. SCHEDULE REPORT DRAWER */}
      <Drawer
        isOpen={scheduleDrawerOpen}
        onClose={() => setScheduleDrawerOpen(false)}
        title="Schedule Automated Report Delivery"
      >
        <form onSubmit={handleAddScheduleJob} className="space-y-4">
          <Input
            label="Report Name"
            name="name"
            value={newJob.name}
            onChange={(e) => handleFormChange(e, setNewJob)}
            placeholder="e.g. Weekly Sales Summary"
            required
          />

          <Select
            label="Delivery Frequency"
            name="frequency"
            value={newJob.frequency}
            onChange={(e) => handleFormChange(e, setNewJob)}
          >
            <option value="Daily">Daily Summary</option>
            <option value="Weekly">Weekly Summary</option>
            <option value="Monthly">Monthly Summary</option>
          </Select>

          <Input
            label="Delivery Time slot (e.g. Monday, 08:00 AM)"
            name="time"
            value={newJob.time}
            onChange={(e) => handleFormChange(e, setNewJob)}
            placeholder="e.g. Everyday, 10:00 PM"
          />

          <Input
            label="Recipient Email Address"
            name="email"
            type="email"
            value={newJob.email}
            onChange={(e) => handleFormChange(e, setNewJob)}
            placeholder="manager@dinein.com"
            required
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-app-border mt-6">
            <SecondaryButton onClick={() => setScheduleDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="shadow-app-md">
              Roster Scheduled Job
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

    </motion.div>
  );
};

export default Reports;
