import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Sparkles, 
  Plus, 
  Sliders, 
  Clock, 
  Settings as SettingsIcon,
  Search,
  Eye,
  Trash2,
  Bell,
  Cpu,
  Copy,
  Check,
  Laptop,
  Smartphone,
  Tablet,
  Moon,
  Sun,
  History,
  TrendingUp,
  TrendingDown,
  Gift
} from 'lucide-react';

import { useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useBranch } from '../contexts/BranchContext';
import {
  AppCard,
  GlassCard,
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
  EmptyState,
  KPICard
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

const Communication = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const { branches } = useBranch();
  
  // Data States
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [settings, setSettings] = useState(null);
  const [analytics, setAnalytics] = useState({
    total: 0,
    delivery_rate: 100,
    open_rate: 0,
    click_rate: 0,
    failed_count: 0
  });

  // Announcement states
  const [announcements, setAnnouncements] = useState([]);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [acknowledgments, setAcknowledgments] = useState([]);
  const [selectedAnnouncementForReport, setSelectedAnnouncementForReport] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    status: 'immediate',
    branch_id: '',
    target_audience: 'all',
    scheduled_time: ''
  });

  // Notification History states & filters
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [historyTimeFilter, setHistoryTimeFilter] = useState('');
  const [historyBranchFilter, setHistoryBranchFilter] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('');
  const [historyPriorityFilter, setHistoryPriorityFilter] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');
  const [historyRecipientFilter, setHistoryRecipientFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'templates', 'campaigns', 'logs', 'settings'
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'sms-logs' || tabParam === 'whatsapp-logs' || tabParam === 'history') {
        setActiveTab('logs');
      } else if (['dashboard', 'templates', 'campaigns', 'settings', 'announcements'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam]);


  // Filtering Outbox Logs
  const [searchTerm, setSearchTerm] = useState('');
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  
  // Modals / Drawers State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop', 'mobile', 'tablet'
  const [previewTheme, setPreviewTheme] = useState('light'); // 'light', 'dark'
  
  // AI assistant state
  const [aiPromptType, setAiPromptType] = useState('weekend_promo');
  const [aiLoading, setAiLoading] = useState(false);

  // Forms State
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    content_html: '',
    audience_type: 'all',
    coupon_code: '',
    scheduled_time: ''
  });
  
  const [smtpForm, setSmtpForm] = useState({
    smtp_host: 'localhost',
    smtp_port: 1025,
    smtp_username: '',
    smtp_password: '',
    smtp_use_tls: false,
    smtp_use_ssl: false,
    smtp_sender_name: 'DineIn AI',
    smtp_reply_email: 'no-reply@dinein.com',
    sms_provider: 'demo',
    sms_api_key: '',
    sms_api_secret: '',
    sms_sender_id: '',
    gateway_url: '',
    gateway_api_key: '',
    gateway_timeout: 5,
    whatsapp_meta_token: '',
    whatsapp_phone_number_id: '',
    whatsapp_business_account_id: '',
    whatsapp_recipient_number: ''
  });

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: 'birthday_wishes',
    subject: '',
    body_html: '',
    body_text: '',
    is_system: false
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailForm, setTestEmailForm] = useState({
    recipient: '',
    subject: 'SMTP Connection Check',
    message: 'This is a verification test email dispatched from DineIn AI.'
  });

  const [testingGateway, setTestingGateway] = useState(false);
  const [sendingTestSms, setSendingTestSms] = useState(false);
  const [testSmsForm, setTestSmsForm] = useState({
    recipient: '',
    message: 'DineIn AI Connection Check SMS Verification.'
  });

  useEffect(() => {
    if (smtpForm.whatsapp_recipient_number) {
      setTestSmsForm(prev => ({
        ...prev,
        recipient: smtpForm.whatsapp_recipient_number
      }));
    }
  }, [smtpForm.whatsapp_recipient_number]);

  // Sync Hub Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesRes, campaignsRes, logsRes, analyticsRes, settingsRes] = await Promise.all([
        client.get('/communication/templates/'),
        client.get('/communication/campaigns/'),
        client.get('/communication/logs/'),
        client.get('/communication/logs/analytics/'),
        client.get('/communication/settings/')
      ]);

      const normalizeList = (res) => {
        if (!res || !res.data) return [];
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        if (data && data.data && Array.isArray(data.data)) return data.data;
        if (data && data.data && Array.isArray(data.data.results)) return data.data.results;
        return [];
      };

      setTemplates(normalizeList(templatesRes));
      setCampaigns(normalizeList(campaignsRes));
      setLogs(normalizeList(logsRes));
      
      if (analyticsRes.data) {
        setAnalytics(analyticsRes.data.data || analyticsRes.data);
      }
      
      const settingsList = normalizeList(settingsRes);
      if (settingsList.length > 0) {
        setSettings(settingsList[0]);
        setSmtpForm(settingsList[0]);
      }
    } catch (error) {
      console.error('Error fetching communications datasets:', error);
      const errMsg = error.response?.data?.message || 'Failed to sync settings or templates from server.';
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await client.get('/communication/announcements/');
      const data = res.data;
      if (Array.isArray(data)) setAnnouncements(data);
      else if (data && Array.isArray(data.results)) setAnnouncements(data.results);
      else if (data && data.data && Array.isArray(data.data)) setAnnouncements(data.data);
      else setAnnouncements([]);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  }, []);

  const fetchNotificationHistory = useCallback(async () => {
    try {
      let url = '/communication/notifications/?';
      if (historyTimeFilter) url += `time_filter=${historyTimeFilter}&`;
      if (historyBranchFilter) url += `branch_id=${historyBranchFilter}&`;
      if (historyTypeFilter) url += `type=${historyTypeFilter}&`;
      if (historyPriorityFilter) url += `priority=${historyPriorityFilter}&`;
      if (historyStatusFilter) url += `status=${historyStatusFilter}&`;
      if (historyRecipientFilter) url += `recipient=${historyRecipientFilter}&`;
      
      const res = await client.get(url);
      const data = res.data;
      if (Array.isArray(data)) setNotificationHistory(data);
      else if (data && Array.isArray(data.results)) setNotificationHistory(data.results);
      else if (data && data.data && Array.isArray(data.data)) setNotificationHistory(data.data);
      else setNotificationHistory([]);
    } catch (err) {
      console.error('Failed to load notification history:', err);
    }
  }, [
    historyTimeFilter,
    historyBranchFilter,
    historyTypeFilter,
    historyPriorityFilter,
    historyStatusFilter,
    historyRecipientFilter
  ]);

  useEffect(() => {
    fetchData();
    fetchAnnouncements();
  }, [fetchData, fetchAnnouncements]);

  useEffect(() => {
    fetchNotificationHistory();
  }, [fetchNotificationHistory]);

  // AI Content Generator Call
  const handleAIGeneration = async () => {
    setAiLoading(true);
    try {
      const res = await client.post('/communication/campaigns/ai-generate/', {
        prompt_type: aiPromptType,
        guest_name: 'Diner'
      });
      if (res.data?.success) {
        const data = res.data.data;
        setCampaignForm(prev => ({
          ...prev,
          subject: data.subject,
          content_html: data.body
        }));
        addToast('AI copy generated successfully!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to get Gemini recommendations.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Test SMTP connection parameters
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await client.post('/communication/settings/test-connection/', smtpForm);
      if (res.data?.success) {
        addToast('SMTP Server validation completed successfully!', 'success');
      } else {
        addToast(res.data?.message || 'SMTP Connection failed.', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Host connection timeout.', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestGateway = async () => {
    if (!smtpForm.whatsapp_meta_token || !smtpForm.whatsapp_phone_number_id) {
      addToast('Please enter the Meta Access Token and Phone Number ID to check connection.', 'warning');
      return;
    }
    const phoneId = smtpForm.whatsapp_phone_number_id.trim();
    if (phoneId.length <= 12 || phoneId.startsWith('91') || phoneId.startsWith('+')) {
      addToast('Validation failed: Please enter a valid Meta Phone Number ID (e.g., 1299623069891131), not a mobile recipient number.', 'warning');
      return;
    }
    setTestingGateway(true);
    try {
      const res = await client.post('/communication/settings/test-gateway/', {
        whatsapp_meta_token: smtpForm.whatsapp_meta_token,
        whatsapp_phone_number_id: smtpForm.whatsapp_phone_number_id
      });
      if (res.data?.success) {
        addToast(`WhatsApp Gateway reached! Connection verified.`, 'success');
      } else {
        addToast(res.data?.message || 'WhatsApp API test failed.', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Connection to Meta Graph API failed.', 'error');
    } finally {
      setTestingGateway(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!testSmsForm.recipient) {
      addToast('Recipient phone number is required.', 'warning');
      return;
    }
    setSendingTestSms(true);
    try {
      const res = await client.post('/communication/settings/send-test-whatsapp/', {
        recipient: testSmsForm.recipient,
        message: testSmsForm.message,
        branch: settings?.branch || localStorage.getItem('branch_id') || ''
      });
      if (res.data?.success) {
        addToast('Test WhatsApp message sent successfully!', 'success');
      } else {
        addToast(res.data?.message || 'Failed to dispatch test WhatsApp message.', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send test WhatsApp message.', 'error');
    } finally {
      setSendingTestSms(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      let res;
      if (settings?.id) {
        res = await client.put(`/communication/settings/${settings.id}/`, smtpForm);
      } else {
        res = await client.post('/communication/settings/', smtpForm);
      }
      if (res.data) {
        addToast('Communication settings updated.', 'success');
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Announcement Handlers
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) {
      addToast('Please provide a title and content.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: announcementForm.title,
        content: announcementForm.content,
        status: announcementForm.status,
        target_audience: announcementForm.target_audience,
        scheduled_time: announcementForm.scheduled_time || null,
        branch: announcementForm.branch_id || null
      };
      await client.post('/communication/announcements/', payload);
      addToast('Announcement posted successfully!', 'success');
      setAnnouncementModalOpen(false);
      setAnnouncementForm({
        title: '',
        content: '',
        status: 'immediate',
        branch_id: '',
        target_audience: 'all',
        scheduled_time: ''
      });
      fetchAnnouncements();
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to post announcement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAnnouncement = async (id) => {
    try {
      await client.post(`/communication/announcements/${id}/acknowledge/`);
      addToast('Announcement acknowledged.', 'success');
      fetchAnnouncements();
    } catch (err) {
      addToast('Failed to acknowledge announcement.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete/cancel this announcement?')) return;
    setLoading(true);
    try {
      await client.delete(`/communication/announcements/${id}/`);
      addToast('Announcement deleted successfully.', 'success');
      fetchAnnouncements();
      fetchData();
    } catch (err) {
      addToast('Failed to delete announcement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewDeliveryReport = async (ann) => {
    setSelectedAnnouncementForReport(ann);
    setReportModalOpen(true);
    try {
      const res = await client.get(`/communication/announcements/${ann.id}/delivery-report/`);
      if (res.data?.success) {
        setAcknowledgments(res.data.acknowledgments || []);
      }
    } catch (err) {
      addToast('Failed to load delivery report.', 'error');
    }
  };

  // Template CRUD Handlers
  const handleEditTemplate = (tpl) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      name: tpl.name,
      subject: tpl.subject,
      body_html: tpl.body_html,
      body_text: tpl.body_text || '',
      is_system: tpl.is_system
    });
    setTemplateModalOpen(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: 'birthday_wishes',
      subject: '',
      body_html: '',
      body_text: '',
      is_system: false
    });
    setTemplateModalOpen(true);
  };

  const handleSaveTemplateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingTemplate?.id) {
        await client.put(`/communication/templates/${editingTemplate.id}/`, templateForm);
        addToast('Template updated successfully.', 'success');
      } else {
        await client.post('/communication/templates/', templateForm);
        addToast('Template created successfully.', 'success');
      }
      setTemplateModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save template.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    setLoading(true);
    try {
      await client.delete(`/communication/templates/${templateId}/`);
      addToast('Template deleted successfully.', 'success');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete template.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const templateMetadata = {
    reservation_confirmation: {
      name: 'Reservation Confirmation',
      desc: 'Sent instantly upon logging booking requests.'
    },
    reservation_approved: {
      name: 'Reservation Approved',
      desc: 'Dispatched when managers approve slot table bookings.'
    },
    reservation_rejected: {
      name: 'Reservation Rejected',
      desc: 'Sent when capacity or business boundaries are met.'
    },
    reservation_reminder: {
      name: 'Reservation Reminder',
      desc: 'Auto reminders sent 24h, 2h, and 30m before arrival.'
    },
    dining_completed: {
      name: 'Thank You & Dining Completed',
      desc: 'Dispatched on host checkout, includes BOGO coupons.'
    },
    feedback_request: {
      name: 'Feedback Review Request',
      desc: 'Sent 30 mins post dining, NPS rating checks.'
    },
    check_in_success: {
      name: 'Check In Success',
      desc: 'Sent when guests are checked in successfully.'
    },
    table_ready: {
      name: 'Table Ready',
      desc: 'Sent when table is assigned and ready.'
    }
  };

  const templateTypesOptions = [
    { value: 'reservation_confirmation', label: 'Reservation Confirmation' },
    { value: 'reservation_approved', label: 'Reservation Approved' },
    { value: 'reservation_rejected', label: 'Reservation Rejected' },
    { value: 'reservation_reminder', label: 'Reservation Reminder' },
    { value: 'table_ready', label: 'Table Ready' },
    { value: 'check_in_success', label: 'Check In Success' },
    { value: 'dining_completed', label: 'Dining Completed / Thank You' },
    { value: 'feedback_request', label: 'Feedback Request' },
    { value: 'birthday_wishes', label: 'Birthday Wishes' },
    { value: 'anniversary_wishes', label: 'Anniversary Wishes' },
    { value: 'coupon_campaign', label: 'Coupon Campaign' },
    { value: 'festival_greetings', label: 'Festival Greetings' },
    { value: 'custom_broadcast', label: 'Custom Broadcast' }
  ];

  // Send Test Transactional Email
  const handleSendTestEmail = async () => {
    if (!testEmailForm.recipient) {
      addToast('Please enter a recipient email address.', 'warning');
      return;
    }
    setSendingTestEmail(true);
    try {
      const res = await client.post('/communication/settings/send-test-email/', testEmailForm);
      if (res.data?.success) {
        addToast(res.data?.message || 'Test email dispatched successfully!', 'success');
        setTestEmailForm(prev => ({ ...prev, recipient: '' }));
        fetchData();
      } else {
        addToast(res.data?.message || 'SMTP Connection check failed.', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'SMTP Connection check failed.', 'error');
    } finally {
      setSendingTestEmail(false);
    }
  };

    // Create & Trigger Campaign
    const handleCreateCampaignSubmit = async (e) => {
      e.preventDefault();
      if (!campaignForm.name || !campaignForm.subject || !campaignForm.content_html) {
        addToast('Please complete name, subject, and campaign body.', 'warning');
        return;
      }
  
      console.log("[Campaign Studio] Frontend submission payload:", campaignForm);
  
      setLoading(true);
      try {
        const res = await client.post('/communication/campaigns/', campaignForm);
        if (res.data) {
          addToast('Campaign draft logged successfully.', 'success');
          setCampaignModalOpen(false);
          // Reset form
          setCampaignForm({
            name: '',
            subject: '',
            content_html: '',
            audience_type: 'all',
            coupon_code: '',
            scheduled_time: ''
          });
          
          // Auto trigger send
          try {
            await client.post(`/communication/campaigns/${res.data.id}/send/`);
            addToast('Campaign successfully dispatched to target lists!', 'success');
          } catch (sendErr) {
            console.error('Failed campaign dispatch:', sendErr);
            addToast('Campaign saved successfully, but dispatch failed: ' + (sendErr.response?.data?.message || sendErr.message), 'warning');
          }
          fetchData();
        }
      } catch (err) {
        console.error('Failed campaign creation response error details:', err.response?.data);
        const data = err.response?.data;
        if (data && typeof data === 'object') {
          // If detailed field errors exist
          const errorMsg = Object.entries(data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`)
            .join(' | ');
          addToast(`Failed to log campaign: ${errorMsg}`, 'error');
        } else {
          addToast(err.response?.data?.message || 'Failed to log campaign details.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

  const handleSendCampaignNow = async (campaignId) => {
    setLoading(true);
    try {
      const res = await client.post(`/communication/campaigns/${campaignId}/send/`);
      if (res.data?.success) {
        addToast('Campaign triggered manually.', 'success');
        fetchData();
      }
    } catch (err) {
      addToast('Send trigger failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter outbox logs
  const safeLogs = Array.isArray(logs) ? logs : [];
  const filteredLogs = safeLogs.filter(l => {
    const matchesSearch = (l.recipient || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (l.subject && l.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFailed = showFailedOnly ? l.status === 'failed' : true;
    return matchesSearch && matchesFailed;
  });

  // Template HTML visual mock builder
  const getRenderedHTMLPreview = (templateCode) => {
    const tpl = templates.find(t => t.name === templateCode);
    if (!tpl) return `<div style="padding: 20px; text-align: center;">Template not found.</div>`;
    
    let html = tpl.body_html || '';
    
    // Inject mock preview values for tags
    const mockContext = {
      guest_name: 'John Doe',
      booking_id: 'res_8f93a11b-c6b7-440f-90bf-657be50a3cfc',
      party_size: '4',
      start_time: '2026-07-05 19:30',
      table_number: 'Table T-4',
      restaurant_name: 'DineIn AI',
      branch_name: 'Bangalore Main Branch',
      contact_phone: '+91 98765 43210',
      qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=res_8f93a11b-c6b7-440f-90bf-657be50a3cfc',
      cancel_link: '#',
      map_link: 'https://maps.google.com',
      feedback_link: '#',
      rejection_reason: 'Fully booked at the requested time.',
      message_body: 'This is a sample custom campaign broadcast.'
    };
    
    for (const [k, v] of Object.entries(mockContext)) {
      html = html.replaceAll(`{{${k}}}`, v);
    }
    
    return html;
  };

  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'sent': return 'success';
      case 'delivered': return 'success';
      case 'queued': return 'warning';
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-app-24 animate-fade-in relative text-text-secondary"
    >

      {/* 1. EXECUTIVE OPERATIONAL HEADER */}
      <motion.div variants={itemVariants}>
        <GlassCard className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-app-20 border-app-primary/20 shadow-[0_4px_24px_rgba(99,102,241,0.06)]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-primary/10 text-app-primary border border-app-primary/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                <Send size={12} className="animate-pulse" />
                Live Notification Center
              </span>
              <Badge status="success">Delivery Rate: {analytics.delivery_rate}%</Badge>
              <Badge status="info">Open Rate: {analytics.open_rate}%</Badge>
            </div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Communication Hub
            </h1>
            <p className="text-xs text-text-secondary font-medium">
              Manage templates, scheduled campaigns, emails/SMS outbox logs, SMTP servers, and AI copywriting.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={() => setCampaignModalOpen(true)} icon={Plus}>
              Create Campaign
            </PrimaryButton>
            <SecondaryButton onClick={fetchData} icon={RefreshCw}>
              Refresh
            </SecondaryButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* 2. STATS KPI GROUPS */}
      <motion.div variants={itemVariants} className="space-y-6">
        {/* In-App Alerts */}
        <div>
          <h4 className="text-[11px] font-black text-app-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-app-primary"></span>
            In-App Notification Alert Stats
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-app-16">
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Total Alerts</span>
              <h3 className="text-xl font-extrabold text-text-primary">
                <AnimatedCounter value={analytics.total_notifications || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Unread Alerts</span>
              <h3 className="text-xl font-extrabold text-app-primary">
                <AnimatedCounter value={analytics.unread || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Read Alerts</span>
              <h3 className="text-xl font-extrabold text-app-success">
                <AnimatedCounter value={analytics.read || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Today's Alerts</span>
              <h3 className="text-xl font-extrabold text-text-primary">
                <AnimatedCounter value={analytics.today_notifications || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Weekly Alerts</span>
              <h3 className="text-xl font-extrabold text-text-primary">
                <AnimatedCounter value={analytics.weekly_notifications || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Monthly Alerts</span>
              <h3 className="text-xl font-extrabold text-text-primary">
                <AnimatedCounter value={analytics.monthly_notifications || 0} />
              </h3>
            </AppCard>
          </div>
        </div>

        {/* Announcement Metrics */}
        <div>
          <h4 className="text-[11px] font-black text-app-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-app-primary"></span>
            Owner Bulletin & Announcement Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-app-16">
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Total Bulletins</span>
              <h3 className="text-xl font-extrabold text-text-primary">
                <AnimatedCounter value={analytics.announcements || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Scheduled</span>
              <h3 className="text-xl font-extrabold text-text-primary">
                <AnimatedCounter value={analytics.scheduled || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Delivered</span>
              <h3 className="text-xl font-extrabold text-app-success">
                <AnimatedCounter value={analytics.delivered || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Pending Drafts</span>
              <h3 className="text-xl font-extrabold text-text-muted">
                <AnimatedCounter value={analytics.pending || 0} />
              </h3>
            </AppCard>
          </div>
        </div>

        {/* Outbox & Channel Delivery */}
        <div>
          <h4 className="text-[11px] font-black text-app-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-app-primary"></span>
            Outbox Channel Delivery Rates
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-app-16">
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Emails Sent</span>
              <h3 className="text-xl font-extrabold text-text-primary">
                <AnimatedCounter value={analytics.emails_sent || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">WhatsApp Sent</span>
              <h3 className="text-xl font-extrabold text-text-primary">
                <AnimatedCounter value={analytics.whatsapp_sent || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">WhatsApp Failed</span>
              <h3 className={`text-xl font-extrabold ${analytics.whatsapp_failed > 0 ? 'text-app-danger' : 'text-text-primary'}`}>
                <AnimatedCounter value={analytics.whatsapp_failed || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Push Broadcasts</span>
              <h3 className="text-xl font-extrabold text-text-primary">
                <AnimatedCounter value={analytics.push_notifications || 0} />
              </h3>
            </AppCard>
            <AppCard className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Total Failures</span>
              <h3 className={`text-xl font-extrabold ${analytics.failed > 0 ? 'text-app-danger' : 'text-text-primary'}`}>
                <AnimatedCounter value={analytics.failed || 0} />
              </h3>
            </AppCard>
          </div>
        </div>
      </motion.div>

      {/* 3. TABS TOGGLE BAR */}
      <motion.div variants={itemVariants} className="flex border-b border-app-border gap-2 overflow-x-auto pb-1">
        {[
          { id: 'dashboard', label: 'Notification Statistics', icon: TrendingUp },
          { id: 'announcements', label: 'Announcement Portal', icon: Bell },
          { id: 'templates', label: 'HTML System Templates', icon: Mail },
          { id: 'campaigns', label: 'Campaigns Studio', icon: Gift },
          { id: 'logs', label: 'Notification History', icon: History },
          { id: 'settings', label: 'Communications Settings', icon: Sliders }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 whitespace-nowrap transition-all duration-200 ${ isActive ? 'border-app-primary text-app-primary bg-app-primary/5' : 'border-transparent text-text-muted hover:text-text-primary' }`}
            >
              <TabIcon size={14} className={isActive ? 'text-app-primary' : 'text-text-muted'} />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* 4. ACTIVE TAB PANELS */}
      <motion.div variants={itemVariants} className="min-h-[400px]">

        {/* TAB 0: NOTIFICATION DASHBOARD & STATISTICS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-app-24">
              <KPICard title="Total Sent Alerts" value={<AnimatedCounter value={analytics.total || logs.length} />} description="All time notifications" />
              <KPICard title="Delivery Success Rate" value={`${analytics.delivery_rate || 100}%`} trend="up" description="Average success percentage" />
              <KPICard title="Failed Notifications" value={<AnimatedCounter value={analytics.failed_count || logs.filter(l => l.status === 'failed').length} />} description="Undelivered requests" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-app-24">
              <AppCard className="p-6 space-y-4">
                <h3 className="text-text-primary text-xs font-bold border-b border-app-border pb-3">Supported Alert Channels</h3>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary font-medium">Reservation Confirmation</span>
                    <Badge status="success">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary font-medium">Automatic Reminders</span>
                    <Badge status="success">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary font-medium">Table Ready Alerts</span>
                    <Badge status="success">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary font-medium">Walk-In Created</span>
                    <Badge status="success">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary font-medium">Low Stock warnings</span>
                    <Badge status="warning">Pending Configuration</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary font-medium">Daily Sales Summary Reports</span>
                    <Badge status="success">Active</Badge>
                  </div>
                </div>
              </AppCard>

              <AppCard className="p-6 space-y-4">
                <h3 className="text-text-primary text-xs font-bold border-b border-app-border pb-3">Active SMS Gateway Status</h3>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Provider:</span>
                    <span className="font-bold text-app-primary uppercase">{smtpForm.sms_provider || 'demo'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Android Gateway URL:</span>
                    <span className="font-mono text-[10px] truncate max-w-[200px] text-text-primary">{smtpForm.gateway_url || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Timeout Limits:</span>
                    <span className="font-bold text-text-primary">{smtpForm.gateway_timeout || 5}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Connection Health:</span>
                    <Badge status={smtpForm.sms_provider === 'disabled' ? 'danger' : 'success'}>
                      {smtpForm.sms_provider === 'disabled' ? 'Disabled' : 'Ready'}
                    </Badge>
                  </div>
                </div>
              </AppCard>
            </div>
          </div>
        )}

        {/* TAB: ANNOUNCEMENT PORTAL */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-app-surface/40 p-4 border border-app-border rounded-app-xl">
              <div>
                <h3 className="text-xs font-bold text-text-primary">Corporate Announcements</h3>
                <p className="text-[10px] text-text-muted">Broadcast official updates to employees, managers, or branches.</p>
              </div>
              {(user?.role?.code === 'owner' || user?.role?.code === 'admin') && (
                <PrimaryButton onClick={() => setAnnouncementModalOpen(true)} icon={Plus}>
                  Post Announcement
                </PrimaryButton>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {announcements.length === 0 ? (
                <EmptyState title="No announcements found" description="Official company bulletins will appear here." icon={Bell} />
              ) : (
                announcements.map((ann) => (
                  <AppCard key={ann.id} className="p-5 space-y-3 border-l-4 border-app-primary">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-text-primary">{ann.title}</h4>
                        <div className="flex flex-wrap gap-2 text-[10px] text-text-muted">
                          <span>By: {ann.sender_name || 'Owner'}</span>
                          <span>•</span>
                          <span>Target: {ann.target_audience === 'all' ? 'All Staff' : ann.target_audience === 'managers' ? 'Managers Only' : 'Employees Only'}</span>
                          <span>•</span>
                          <span>Branch: {ann.branch_name || 'All Branches'}</span>
                          <span>•</span>
                          <span>Status: <span className="font-bold text-app-primary capitalize">{ann.status}</span></span>
                          {ann.scheduled_time && (
                            <>
                              <span>•</span>
                              <span>Scheduled: {new Date(ann.scheduled_time).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 animate-fade-in">
                        {ann.acknowledged ? (
                          <Badge status="success">Read Acknowledged</Badge>
                        ) : (
                          (user?.role?.code === 'manager' || user?.role?.code === 'employee') && (
                            <button
                              onClick={() => handleAcknowledgeAnnouncement(ann.id)}
                              className="px-3 py-1 bg-app-primary/10 hover:bg-app-primary/20 text-app-primary font-bold text-[10px] rounded-full border border-app-primary/20 transition-colors"
                            >
                              Acknowledge / Mark as Read
                            </button>
                          )
                        )}

                        {(user?.role?.code === 'owner' || user?.role?.code === 'admin') && (
                          <>
                            <SecondaryButton 
                              onClick={() => viewDeliveryReport(ann)} 
                              className="px-3 py-1 h-7 text-[10px] font-bold"
                            >
                              Read Report ({ann.read_count || 0})
                            </SecondaryButton>
                            <DangerButton 
                              onClick={() => handleDeleteAnnouncement(ann.id)} 
                              className="px-3 py-1 h-7 text-[10px] font-bold"
                            >
                              Cancel / Delete
                            </DangerButton>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed bg-app-elevated/20 p-3 rounded-app-lg border border-app-border/40">
                      {ann.content}
                    </p>
                  </AppCard>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 1: HTML SYSTEM TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-app-surface/40 p-4 border border-app-border rounded-app-xl">
              <div>
                <h3 className="text-xs font-bold text-text-primary">System Email Templates</h3>
                <p className="text-[10px] text-text-muted">Branded, responsive email layouts dispatched dynamically on events.</p>
              </div>
              <PrimaryButton onClick={handleCreateTemplate} icon={Plus} className="text-[10px] h-8 font-bold">
                Add Template
              </PrimaryButton>
            </div>
            
            {templates.length === 0 ? (
              <EmptyState title="No templates registered" description="Templates will automatically seed on view list from core renderers." icon={Mail} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-app-20">
                {templates.map((tpl) => {
                  const meta = templateMetadata[tpl.name] || {
                    name: tpl.name.replace(/_/g, ' ').toUpperCase(),
                    desc: 'User registered campaign layout block.'
                  };
                  return (
                    <AppCard key={tpl.id} className="p-5 flex flex-col justify-between border-app-border hover:border-app-primary/20 transition-all">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="bg-app-primary/10 text-app-primary text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                            {tpl.is_system ? 'System Template' : 'Custom'}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge status="success">Active</Badge>
                            {!tpl.is_system && (
                              <button 
                                onClick={() => handleDeleteTemplate(tpl.id)}
                                disabled={loading}
                                className="text-text-muted hover:text-app-danger transition-colors p-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary">{meta.name}</h3>
                        <p className="text-[10px] text-text-muted leading-relaxed font-medium">
                          {meta.desc}
                        </p>
                        <p className="text-[9px] font-semibold text-text-secondary truncate mt-1">
                          Subject: {tpl.subject}
                        </p>
                      </div>
                      
                      <div className="flex gap-2 mt-5 pt-3 border-t border-app-border">
                        <PrimaryButton 
                          onClick={() => {
                            setPreviewTemplate(tpl.name);
                            setPreviewDrawerOpen(true);
                          }}
                          icon={Eye}
                          className="flex-1 py-1.5 h-8 text-[10px] font-bold"
                        >
                          Preview
                        </PrimaryButton>
                        
                        <SecondaryButton 
                          onClick={() => handleEditTemplate(tpl)}
                          className="flex-1 py-1.5 h-8 text-[10px] font-bold"
                        >
                          Edit Layout
                        </SecondaryButton>
                      </div>
                    </AppCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CAMPAIGNS STUDIO */}
        {activeTab === 'campaigns' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-app-24">
            
            {/* AI Copywriting Sidebar */}
            <AppCard className="lg:col-span-1 p-5 space-y-4">
              <span className="flex items-center gap-1.5 text-app-primary font-bold text-[10px] uppercase tracking-wider">
                <Sparkles size={13} className="animate-pulse" />
                AI copywriting assistant
              </span>
              <p className="text-[10px] text-text-secondary leading-normal font-medium">
                Draft professional newsletter copies, promotional codes, and announcement subjects using Gemini.
              </p>

              <Select
                label="Campaign Objective"
                value={aiPromptType}
                onChange={(e) => setAiPromptType(e.target.value)}
              >
                <option value="weekend_promo">Weekend Flat Discount</option>
                <option value="birthday_wishes">Birthday Celebration Dessert</option>
                <option value="anniversary_wishes">Anniversary Wine Treat</option>
                <option value="coupon_campaign">Flash Double Points Offer</option>
              </Select>

              <PrimaryButton 
                onClick={handleAIGeneration} 
                loading={aiLoading}
                className="w-full text-[10px] h-9 font-bold"
              >
                Generate Copy Outline
              </PrimaryButton>
            </AppCard>

            {/* Campaign Logs and triggering */}
            <div className="lg:col-span-3 space-y-4">
              <AppCard className="p-5">
                <h3 className="text-text-primary text-xs font-bold mb-4 flex items-center gap-2">
                  <Gift size={15} className="text-app-warning" />
                  Recent Promotional Campaigns
                </h3>

                {(() => {
                  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
                  if (safeCampaigns.length === 0) {
                    return <EmptyState title="No campaigns logged" description="Start a new seasonal campaign using the wizard." icon={Mail} />;
                  }
                  return (
                    <div className="space-y-4">
                      {safeCampaigns.map((c) => (
                        <div key={c.id} className="bg-app-elevated border border-app-border rounded-app-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-text-primary">{c.name}</h4>
                              <Badge status={c.status === 'completed' ? 'success' : 'warning'}>{c.status}</Badge>
                            </div>
                            <p className="text-[10px] text-text-muted">Subject: "{c.subject}"</p>
                            <div className="text-[9px] text-text-muted flex gap-4 mt-1 font-bold">
                              <span>👤 Target: {c.audience_type ? String(c.audience_type).toUpperCase() : 'ALL'}</span>
                              {c.coupon_code && <span>🎟️ Coupon: {c.coupon_code}</span>}
                              <span>Dispatched count: {c.sent_count || 0}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <SecondaryButton 
                              onClick={() => {
                                setPreviewTemplate('custom_broadcast');
                                // Mock content_html into custom_broadcast template representation
                                setTemplates(prev => {
                                  return prev.map(t => {
                                    if (t.name === 'custom_broadcast') {
                                      return { ...t, body_html: c.content_html, subject: c.subject };
                                    }
                                    return t;
                                  });
                                });
                                setPreviewDrawerOpen(true);
                              }}
                              icon={Eye}
                              className="px-3 py-1.5 h-8 text-[10px] font-bold"
                            >
                              Preview
                            </SecondaryButton>

                            <SecondaryButton 
                              onClick={async () => {
                                const testRecipient = prompt("Enter recipient email address for test newsletter campaign copy:", user?.email || "");
                                if (!testRecipient) return;
                                try {
                                  setLoading(true);
                                  const res = await client.post(`/communication/campaigns/${c.id}/send-test/`, { recipient: testRecipient });
                                  if (res.data?.success) {
                                    addToast(`Test copy successfully sent to ${testRecipient}!`, 'success');
                                  }
                                } catch (err) {
                                  addToast(err.response?.data?.message || 'Failed to dispatch test copy.', 'error');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              icon={Send}
                              className="px-3 py-1.5 h-8 text-[10px] font-bold"
                            >
                              Send Test
                            </SecondaryButton>

                            {c.status !== 'completed' && (
                              <PrimaryButton 
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to broadcast this campaign to the entire targeted group?")) {
                                    handleSendCampaignNow(c.id);
                                  }
                                }}
                                className="px-4 py-1.5 h-8 text-[10px] font-bold"
                              >
                                Send Broadcast
                              </PrimaryButton>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </AppCard>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATION HISTORY */}
        {activeTab === 'logs' && (
          <AppCard className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pb-2 border-b border-app-border">
              {/* Recipient Search */}
              <div className="relative">
                <Search size={12} className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Recipient search..."
                  value={historyRecipientFilter}
                  onChange={(e) => setHistoryRecipientFilter(e.target.value)}
                  className="bg-app-elevated text-text-primary w-full pl-8 pr-2 py-1.5 border border-transparent focus:border-app-primary rounded-app-lg text-[11px] outline-none transition-all"
                />
              </div>

              {/* Time Filter */}
              <select
                value={historyTimeFilter}
                onChange={(e) => setHistoryTimeFilter(e.target.value)}
                className="bg-app-elevated text-text-primary px-3 py-1.5 border border-transparent focus:border-app-primary rounded-app-lg text-[11px] outline-none transition-all"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              {/* Branch Filter */}
              <select
                value={historyBranchFilter}
                onChange={(e) => setHistoryBranchFilter(e.target.value)}
                className="bg-app-elevated text-text-primary px-3 py-1.5 border border-transparent focus:border-app-primary rounded-app-lg text-[11px] outline-none transition-all"
              >
                <option value="">All Branches</option>
                {(branches || []).map(b => b ? (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ) : null)}
              </select>

              {/* Notification Type */}
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                className="bg-app-elevated text-text-primary px-3 py-1.5 border border-transparent focus:border-app-primary rounded-app-lg text-[11px] outline-none transition-all"
              >
                <option value="">All Types</option>
                <option value="reservation">Reservation</option>
                <option value="order">Order</option>
                <option value="inventory">Inventory</option>
                <option value="workforce">Workforce</option>
                <option value="system">System</option>
                <option value="auth">Auth</option>
              </select>

              {/* Priority */}
              <select
                value={historyPriorityFilter}
                onChange={(e) => setHistoryPriorityFilter(e.target.value)}
                className="bg-app-elevated text-text-primary px-3 py-1.5 border border-transparent focus:border-app-primary rounded-app-lg text-[11px] outline-none transition-all"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              {/* Status */}
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="bg-app-elevated text-text-primary px-3 py-1.5 border border-transparent focus:border-app-primary rounded-app-lg text-[11px] outline-none transition-all"
              >
                <option value="">All Statuses</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="archived">Archived</option>
              </select>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setHistoryRecipientFilter('');
                  setHistoryTimeFilter('');
                  setHistoryBranchFilter('');
                  setHistoryTypeFilter('');
                  setHistoryPriorityFilter('');
                  setHistoryStatusFilter('');
                }}
                className="bg-app-elevated text-text-primary hover:bg-app-hover hover:text-text-primary transition-all px-3 py-1.5 rounded-app-lg text-[11px] font-bold"
              >
                Clear Filters
              </button>
            </div>

            {notificationHistory.length === 0 ? (
              <EmptyState title="No notifications match filters" description="Alerts logs will populate dynamically on real system events." icon={History} />
            ) : (
              <div className="overflow-x-auto border border-app-border rounded-app-xl bg-app-bg">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-app-elevated/40 text-[10px] text-text-muted border-b border-app-border font-extrabold uppercase">
                      <th className="py-3.5 px-4">Title</th>
                      <th className="py-3.5 px-4">Message</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Sender</th>
                      <th className="py-3.5 px-4">Recipient</th>
                      <th className="py-3.5 px-4">Module</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Created Time</th>
                      <th className="py-3.5 px-4">Read Time</th>
                      <th className="py-3.5 px-4">Delivery Status</th>
                      <th className="py-3.5 px-4">Branch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border text-[11px] text-text-secondary">
                    {(notificationHistory || []).map((n) => n ? (
                      <tr key={n.id} className="hover:bg-app-hover/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-text-primary">{n.title}</td>
                        <td className="py-3 px-4 max-w-[200px] truncate" title={n.message}>{n.message}</td>
                        <td className="py-3 px-4 capitalize font-semibold">{n.notification_type}</td>
                        <td className="py-3 px-4 capitalize">
                          <span className={`font-bold ${n.priority === 'high' ? 'text-app-danger' : n.priority === 'medium' ? 'text-app-warning' : 'text-text-muted'}`}>
                            {n.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-muted font-mono">{n.sender || 'system'}</td>
                        <td className="py-3 px-4 font-semibold">{n.user_username || n.recipient || 'System / Manager'}</td>
                        <td className="py-3 px-4 capitalize text-text-muted font-mono">{n.module || 'core'}</td>
                        <td className="py-3 px-4 capitalize">
                          <Badge status={n.is_read ? 'success' : 'warning'}>{n.status || (n.is_read ? 'read' : 'unread')}</Badge>
                        </td>
                        <td className="py-3 px-4 text-text-muted">
                          {n.created_at ? new Date(n.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-text-muted">
                          {n.read_time ? new Date(n.read_time).toLocaleString() : 'Unread'}
                        </td>
                        <td className="py-3 px-4 capitalize font-semibold">{n.delivery_status || 'delivered'}</td>
                        <td className="py-3 px-4 text-text-muted">{n.branch_name || 'Enterprise / All'}</td>
                      </tr>
                    ) : null)}
                  </tbody>
                </table>
              </div>
            )}
          </AppCard>
        )}

        {/* TAB 4: COMMUNICATIONS CREDENTIALS SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <AppCard className="p-6 space-y-6">
              <h3 className="text-text-primary text-xs font-bold border-b border-app-border pb-3 flex items-center gap-1.5">
                <Sliders size={15} className="text-app-primary" />
                SMTP Connection Server Credentials
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="SMTP Server Host"
                  value={smtpForm.smtp_host}
                  onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_host: e.target.value }))}
                  placeholder="e.g. mail.privateemail.com"
                />
                <Input
                  label="SMTP Port"
                  type="number"
                  value={smtpForm.smtp_port}
                  onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                  placeholder="e.g. 587"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="SMTP Username"
                  value={smtpForm.smtp_username || ''}
                  onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_username: e.target.value }))}
                  placeholder="username@domain.com"
                />
                <Input
                  label="SMTP Password"
                  type="password"
                  value={smtpForm.smtp_password || ''}
                  onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_password: e.target.value }))}
                  placeholder="••••••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Sender Name Display"
                  value={smtpForm.smtp_sender_name}
                  onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_sender_name: e.target.value }))}
                  placeholder="e.g. DineIn AI Team"
                />
                <Input
                  label="Sender reply-to email"
                  type="email"
                  value={smtpForm.smtp_reply_email}
                  onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_reply_email: e.target.value }))}
                  placeholder="e.g. support@dinein.ai"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="smtp_use_tls" 
                    checked={smtpForm.smtp_use_tls} 
                    onChange={(e) => setSmtpForm(prev => ({ 
                      ...prev, 
                      smtp_use_tls: e.target.checked,
                      smtp_use_ssl: e.target.checked ? false : prev.smtp_use_ssl
                    }))} 
                    className="rounded border-app-border text-app-primary focus:ring-app-primary/10" 
                  />
                  <label htmlFor="smtp_use_tls" className="text-[10px] font-bold text-text-secondary uppercase">Use TLS Secure Channel</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="smtp_use_ssl" 
                    checked={smtpForm.smtp_use_ssl} 
                    onChange={(e) => setSmtpForm(prev => ({ 
                      ...prev, 
                      smtp_use_ssl: e.target.checked,
                      smtp_use_tls: e.target.checked ? false : prev.smtp_use_tls
                    }))} 
                    className="rounded border-app-border text-app-primary focus:ring-app-primary/10" 
                  />
                  <label htmlFor="smtp_use_ssl" className="text-[10px] font-bold text-text-secondary uppercase">Use SSL Secure Channel</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-app-border">
                <SecondaryButton 
                  onClick={handleTestConnection} 
                  loading={testingConnection}
                  className="font-bold text-[10px] h-9"
                >
                  Test Connection
                </SecondaryButton>
                <PrimaryButton 
                  onClick={handleSaveSettings}
                  className="font-bold text-[10px] h-9 shadow-app-md"
                >
                  Save Settings
                </PrimaryButton>
              </div>
            </AppCard>

            <AppCard className="p-6 space-y-6">
              <h3 className="text-text-primary text-xs font-bold border-b border-app-border pb-3 flex items-center gap-1.5">
                <MessageSquare size={15} className="text-app-primary" />
                WhatsApp Notification Provider Settings
              </h3>

              <Select
                label="Active WhatsApp Gateway Provider"
                value={smtpForm.sms_provider}
                onChange={(e) => setSmtpForm(prev => ({ ...prev, sms_provider: e.target.value }))}
              >
                <option value="demo">Demo Provider (Console Output Log)</option>
                <option value="android_gateway">Meta WhatsApp Business Cloud API</option>
                <option value="disabled">Disabled Provider</option>
              </Select>

              {smtpForm.sms_provider === 'android_gateway' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Input
                    label="Meta Access Token"
                    type="password"
                    value={smtpForm.whatsapp_meta_token || ''}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, whatsapp_meta_token: e.target.value }))}
                    placeholder="EAA..."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Phone Number ID (Meta Graph ID)"
                      value={smtpForm.whatsapp_phone_number_id || ''}
                      onChange={(e) => setSmtpForm(prev => ({ ...prev, whatsapp_phone_number_id: e.target.value }))}
                      placeholder="e.g. 1299623069891131"
                    />
                    <Input
                      label="Business Account ID"
                      value={smtpForm.whatsapp_business_account_id || ''}
                      onChange={(e) => setSmtpForm(prev => ({ ...prev, whatsapp_business_account_id: e.target.value }))}
                      placeholder="e.g. 1345291451115571"
                    />
                  </div>
                  <Input
                    label="Customer WhatsApp Recipient Number"
                    value={smtpForm.whatsapp_recipient_number || ''}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, whatsapp_recipient_number: e.target.value }))}
                    placeholder="e.g. 919994795959"
                  />

                  <div className="flex justify-end pt-2">
                    <SecondaryButton
                      onClick={handleTestGateway}
                      loading={testingGateway}
                      className="font-bold text-[10px] h-8"
                    >
                      🔗 Verify WhatsApp Connection
                    </SecondaryButton>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-app-border">
                <PrimaryButton 
                  onClick={handleSaveSettings}
                  className="font-bold text-[10px] h-9 shadow-app-md"
                >
                  Save WhatsApp Settings
                </PrimaryButton>
              </div>
            </AppCard>

            {/* Send Test WhatsApp Card */}
            <AppCard className="p-6 space-y-4">
              <h3 className="text-text-primary text-xs font-bold border-b border-app-border pb-3 flex items-center gap-1.5">
                <MessageSquare size={15} className="text-app-success animate-pulse" />
                Send Test WhatsApp Alert
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Recipient Phone Number"
                  value={testSmsForm.recipient}
                  onChange={(e) => setTestSmsForm(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="e.g. +91 98765 43210"
                  required
                />
                <Input
                  label="WhatsApp Message Body"
                  value={testSmsForm.message}
                  onChange={(e) => setTestSmsForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Test notification message..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <PrimaryButton 
                  onClick={handleSendTestSms} 
                  loading={sendingTestSms}
                  className="font-bold text-[10px] h-9 shadow-app-md"
                >
                  Dispatch Test WhatsApp
                </PrimaryButton>
              </div>
            </AppCard>

            {/* Send Test Email Card */}
            <AppCard className="p-6 space-y-4">
              <h3 className="text-text-primary text-xs font-bold border-b border-app-border pb-3 flex items-center gap-1.5">
                <Send size={15} className="text-app-warning animate-pulse" />
                Send Test Transactional Email
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Recipient Email"
                  type="email"
                  value={testEmailForm.recipient}
                  onChange={(e) => setTestEmailForm(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="name@domain.com"
                  required
                />
                <Input
                  label="Email Subject"
                  value={testEmailForm.subject}
                  onChange={(e) => setTestEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. SMTP Connection Check"
                />
              </div>

              <Textarea
                label="Optional Message Body"
                value={testEmailForm.message}
                onChange={(e) => setTestEmailForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Write an optional message to verify html tags body substitution..."
                className="min-h-[80px]"
              />

              <div className="flex justify-end pt-2">
                <PrimaryButton 
                  onClick={handleSendTestEmail} 
                  loading={sendingTestEmail}
                  className="font-bold text-[10px] h-9 shadow-app-md bg-gradient-to-r from-app-warning to-app-warning/80 hover:from-app-warning/90 hover:to-app-warning"
                >
                  Dispatch Test Email
                </PrimaryButton>
              </div>
            </AppCard>
          </div>
        )}

      </motion.div>

      {/* 5. CREATE CAMPAIGN WIZARD MODAL */}
      <Modal
        isOpen={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        title="Create Promotional Newsletter Campaign"
      >
        <form onSubmit={handleCreateCampaignSubmit} className="space-y-4">
          <Input
            label="Campaign Name"
            value={campaignForm.name}
            onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Weekend Biryani BOGO Festival"
            required
          />

          <Input
            label="Email Subject Line"
            value={campaignForm.subject}
            onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="e.g. Get a Free Appetizer this weekend! 🎟️"
            required
          />

          <Select
            label="Target Audience Group"
            value={campaignForm.audience_type}
            onChange={(e) => setCampaignForm(prev => ({ ...prev, audience_type: e.target.value }))}
          >
            <option value="all">All Registered Customers</option>
            <option value="vip">VIP Only</option>
            <option value="frequent">Frequent Diners (3+ visits)</option>
            <option value="inactive">Inactive Customers (No visits in 30 days)</option>
          </Select>

          <Input
            label="Promo Coupon Code (Optional)"
            value={campaignForm.coupon_code}
            onChange={(e) => setCampaignForm(prev => ({ ...prev, coupon_code: e.target.value }))}
            placeholder="e.g. FESTIVAL50"
          />

          <Textarea
            label="HTML Content Body"
            value={campaignForm.content_html}
            onChange={(e) => setCampaignForm(prev => ({ ...prev, content_html: e.target.value }))}
            placeholder="<p>Write your HTML campaign content body here...</p>"
            className="min-h-[140px] font-mono text-xs"
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
            <SecondaryButton onClick={() => setCampaignModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="shadow-app-md">
              Confirm & Dispatch
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 6. DRAWER TEMPLATES PREVIEW SIMULATOR */}
      <Drawer
        isOpen={previewDrawerOpen}
        onClose={() => setPreviewDrawerOpen(false)}
        title={previewTemplate ? `Preview: ${previewTemplate.replace(/_/g, ' ').toUpperCase()}` : 'Template Preview'}
      >
        {previewTemplate && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">
                Responsive Preview Simulator
              </span>
              
              <div className="flex gap-1 bg-app-elevated border border-app-border p-1 rounded-app-lg text-text-muted">
                <button 
                  onClick={() => setPreviewMode('desktop')} 
                  className={`p-1 rounded transition-colors ${previewMode === 'desktop' ? 'bg-app-primary/10 text-app-primary' : 'hover:text-text-primary'}`}
                >
                  <Laptop size={14} />
                </button>
                <button 
                  onClick={() => setPreviewMode('tablet')} 
                  className={`p-1 rounded transition-colors ${previewMode === 'tablet' ? 'bg-app-primary/10 text-app-primary' : 'hover:text-text-primary'}`}
                >
                  <Tablet size={14} />
                </button>
                <button 
                  onClick={() => setPreviewMode('mobile')} 
                  className={`p-1 rounded transition-colors ${previewMode === 'mobile' ? 'bg-app-primary/10 text-app-primary' : 'hover:text-text-primary'}`}
                >
                  <Smartphone size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-secondary">Theme Simulation Mode</span>
              <SecondaryButton 
                onClick={() => setPreviewTheme(prev => prev === 'light' ? 'dark' : 'light')}
                icon={previewTheme === 'light' ? Moon : Sun}
                className="px-3.5 py-1 text-[10px] h-8"
              >
                {previewTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </SecondaryButton>
            </div>

            {/* Responsive simulator containing multiple preview settings */}
            <div 
              className={`mx-auto border rounded-app-xl overflow-hidden shadow-app-md transition-all duration-300 ${previewTheme === 'dark' ? 'bg-[#0f172a] text-[#ffffff] border-[#334155]' : 'bg-[#ffffff] text-[#000000] border-[#e2e8f0]'}`}
              style={{
                width: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '100%',
                minHeight: '500px'
              }}
            >
              {/* Simulator Header / Email Client chrome mock */}
              <div className={`px-4 py-2 border-b flex items-center justify-between text-[10px] font-semibold ${previewTheme === 'dark' ? 'bg-[#1e293b] border-[#334155] text-[#94a3b8]' : 'bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]'}`}>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] inline-block" />
                  <span className="ml-2 font-mono">DineIn Mail client preview simulator ({previewMode.toUpperCase()})</span>
                </div>
                <div className="font-mono text-[9px] uppercase">{previewTheme} mode</div>
              </div>

              {/* Subject box */}
              <div className={`px-4 py-2 border-b text-[10px] font-bold ${previewTheme === 'dark' ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                Subject: <span className="font-normal font-mono">{templates.find(t => t.name === previewTemplate)?.subject || 'Promotional Update'}</span>
              </div>

              {/* Content Body Iframe content simulation container */}
              <div 
                dangerouslySetInnerHTML={{ __html: getRenderedHTMLPreview(previewTemplate) }}
                className={`w-full h-full p-6 overflow-y-auto ${previewTheme === 'dark' ? 'bg-[#0f172a]' : 'bg-[#ffffff]'}`}
                style={{
                  color: previewTheme === 'dark' ? '#f8fafc' : '#0f172a'
                }}
              />
            </div>

            <div className="pt-2 border-t border-app-border">
              <PrimaryButton onClick={() => setPreviewDrawerOpen(false)} className="w-full">
                Close Preview
              </PrimaryButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* 7. TEMPLATE CREATION / EDIT MODAL */}
      <Modal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title={editingTemplate ? "Edit Template Layout" : "Create Email Template"}
      >
        <form onSubmit={handleSaveTemplateSubmit} className="space-y-4">
          <Select
            label="Template Purpose / Name"
            value={templateForm.name}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
            disabled={!!editingTemplate}
            required
          >
            {templateTypesOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>

          <Input
            label="Email Subject Line"
            value={templateForm.subject}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="e.g. Rate your dining experience!"
            required
          />

          <Textarea
            label="HTML Body Content"
            value={templateForm.body_html}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, body_html: e.target.value }))}
            placeholder="<html><body><h1>Hi {{guest_name}}</h1></body></html>"
            className="min-h-[220px] font-mono text-xs"
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
            <SecondaryButton onClick={() => setTemplateModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={loading} className="shadow-app-md">
              Save Template
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 8. ANNOUNCEMENT CREATION MODAL */}
      <Modal
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        title="Post Corporate Announcement"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <Input
            label="Announcement Title"
            value={announcementForm.title}
            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. New Health and Safety Protocols"
            required
          />

          <Textarea
            label="Announcement Content"
            value={announcementForm.content}
            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Write official company update details here..."
            className="min-h-[140px]"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Target Branch"
              value={announcementForm.branch_id}
              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, branch_id: e.target.value }))}
            >
              <option value="">Broadcast to All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>

            <Select
              label="Target Audience"
              value={announcementForm.target_audience}
              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target_audience: e.target.value }))}
            >
              <option value="all">All Employees</option>
              <option value="managers">Branch Managers Only</option>
              <option value="employees">Staff / Employees Only</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Publish Status"
              value={announcementForm.status}
              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="immediate">Publish Immediately</option>
              <option value="scheduled">Schedule Publish</option>
              <option value="draft">Save as Draft</option>
            </Select>

            {announcementForm.status === 'scheduled' && (
              <Input
                label="Scheduled Date & Time"
                type="datetime-local"
                value={announcementForm.scheduled_time}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                required
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
            <SecondaryButton onClick={() => setAnnouncementModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={loading} className="shadow-app-md">
              Publish Announcement
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 9. ANNOUNCEMENT READ REPORT MODAL */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={`Delivery & Read Report: ${selectedAnnouncementForReport?.title || ''}`}
      >
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          <div className="flex justify-between items-center text-xs border-b border-app-border pb-2">
            <span className="text-text-secondary">Read Count:</span>
            <Badge status="success">{acknowledgments.length} acknowledged</Badge>
          </div>

          {acknowledgments.length === 0 ? (
            <p className="text-[11px] text-text-muted text-center py-6">No employee has acknowledged this bulletin yet.</p>
          ) : (
            <div className="overflow-x-auto border border-app-border rounded-app-xl bg-app-bg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-app-elevated/40 text-[10px] text-text-muted border-b border-app-border font-extrabold uppercase">
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Acknowledged/Read Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border text-[11px] text-text-secondary">
                  {(acknowledgments || []).map(ack => ack ? (
                    <tr key={ack.id} className="hover:bg-app-hover/10 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-text-primary">{ack.username}</td>
                      <td className="py-2.5 px-4 capitalize">{ack.role_name}</td>
                      <td className="py-2.5 px-4 text-text-muted">
                        {new Date(ack.read_at).toLocaleString()}
                      </td>
                    </tr>
                  ) : null)}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-3">
            <PrimaryButton onClick={() => setReportModalOpen(false)}>
              Close Report
            </PrimaryButton>
          </div>
        </div>
      </Modal>

    </motion.div>
  );
};

export default Communication;
