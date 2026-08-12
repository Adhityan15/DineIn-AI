import React, { useState } from 'react';
import {
  Eye,
  SlidersHorizontal,
  Plus,
  Play,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Info,
  Calendar,
  Grid,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  DangerButton,
  AppCard,
  GlassCard,
  SectionCard,
  ChartCard,
  KPICard,
  Input,
  FloatingInput,
  Select,
  Textarea,
  Switch,
  DataTable,
  Tabs,
  Modal,
  Drawer,
  Badge,
  EmptyState,
  Skeleton,
  LoadingOverlay,
  SectionHeader,
  AnimatedCounter
} from '../components/DesignSystem';

const DesignSystemShowcase = () => {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState('components');
  
  // Interactive component states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Form values state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'server',
    notes: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');

  // Trigger form validation mock
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.includes('@')) errors.email = 'Enter a valid email address';
    if (formData.notes.length < 5) errors.notes = 'Notes must contain at least 5 characters';
    
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      alert('Form validated and submitted successfully!');
    }
  };

  // Mock Table data
  const tableData = [
    { id: 1, name: 'Bangalore Central Kitchen', city: 'Bangalore', type: 'Main Hub', status: 'active', rating: 4.8 },
    { id: 2, name: 'Indiranagar Express branch', city: 'Bangalore', type: 'Dine-In', status: 'active', rating: 4.5 },
    { id: 3, name: 'Koramangala Cloud Kitchen', city: 'Bangalore', type: 'Delivery Only', status: 'pending', rating: 4.1 },
    { id: 4, name: 'Whitefield Gourmet Lounge', city: 'Bangalore', type: 'Dine-In', status: 'inactive', rating: 3.9 },
    { id: 5, name: 'Jayanagar Bistro Hub', city: 'Bangalore', type: 'Bistro', status: 'active', rating: 4.7 }
  ];

  const tableColumns = [
    { key: 'name', header: 'Branch Name', render: (row) => <span className="font-extrabold text-text-primary">{row.name}</span> },
    { key: 'type', header: 'Service Type' },
    { key: 'city', header: 'Location' },
    { 
      key: 'rating', 
      header: 'Overall Rating',
      render: (row) => (
        <div className="flex items-center gap-1">
          <span className="text-amber-500">★</span>
          <span>{row.rating}</span>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status Pill',
      render: (row) => {
        const map = {
          active: { label: 'Operational', status: 'success' },
          pending: { label: 'Under Review', status: 'warning' },
          inactive: { label: 'Suspended', status: 'danger' }
        }[row.status];
        return <Badge status={map.status}>{map.label}</Badge>;
      }
    }
  ];

  // Filter & search logic mock
  const filteredData = tableData.filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterValue === 'all' || row.status === filterValue;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-app-32 animate-fade-in relative">
      <LoadingOverlay active={showOverlay} />
      
      {/* Page Header */}
      <SectionHeader
        title="Design System Showcase & Reference"
        description="Unified commercial SaaS UI component showcase validating typography hierarchy, spacing scale, interactive buttons, inputs, tables, overlays, and color palettes."
        icon={SlidersHorizontal}
        action={
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => {
              setShowOverlay(true);
              setTimeout(() => setShowOverlay(false), 2000);
            }}>
              Test Loading Overlay
            </SecondaryButton>
            <PrimaryButton onClick={() => setIsModalOpen(true)} icon={Plus}>
              Launch Modal
            </PrimaryButton>
          </div>
        }
      />

      {/* Tabs Selector */}
      <Tabs
        tabs={[
          { id: 'components', label: 'Reusable Components', icon: Grid },
          { id: 'typography', label: 'Typography & Colors', icon: Award },
          { id: 'spacing', label: 'Spacing & Radii', icon: Calendar }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 1. COMPONENTS TAB VIEW */}
      {activeTab === 'components' && (
        <div className="space-y-app-32">
          
          {/* KPI Dashboard Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-app-20">
            <KPICard
              title="Today's Reservations"
              value={<AnimatedCounter value={42} />}
              change="15%"
              trend="up"
              icon={Calendar}
              description="Confirmed bookings active today"
            />
            <KPICard
              title="Workforce Burnout Risk"
              value="12%"
              change="4%"
              trend="down"
              icon={AlertTriangle}
              description="Aggregated risk metrics"
            />
            <KPICard
              title="NPS Customer Rating"
              value="4.8"
              change="0.2"
              trend="up"
              icon={Award}
              description="Composite platform score"
            />
            <KPICard
              title="Total Revenue Audit"
              value="₹4,250.80"
              icon={TrendingUp}
              description="Daily synced sales"
            />
          </div>

          {/* Core Buttons and Elevation Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-app-24">
            
            {/* Buttons Showcase Card */}
            <SectionCard title="Buttons Catalog" subtitle="Supports hover springs, Tap scaling, and loading state locks">
              <div className="flex flex-wrap gap-3 items-center">
                <PrimaryButton onClick={() => alert('Clicked!')}>
                  Primary Button
                </PrimaryButton>
                <SecondaryButton onClick={() => alert('Clicked!')}>
                  Secondary Button
                </SecondaryButton>
                <GhostButton onClick={() => alert('Clicked!')}>
                  Ghost Button
                </GhostButton>
                <DangerButton onClick={() => alert('Clicked!')}>
                  Danger Button
                </DangerButton>
              </div>
              <div className="flex flex-wrap gap-3 items-center mt-app-16 border-t border-app-border pt-4">
                <PrimaryButton loading>Loading State</PrimaryButton>
                <SecondaryButton disabled>Disabled State</SecondaryButton>
                <DangerButton icon={Play}>Icon Left</DangerButton>
                <GhostButton icon={Info}>Info Label</GhostButton>
              </div>
            </SectionCard>

            {/* Cards Showcase Card */}
            <SectionCard title="Cards & Elevation Panels" subtitle="Standard borders, glass effects, and spring hover animations">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AppCard hoverEffect className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-text-primary">Interactive Hover Card</h4>
                  <p className="text-[10px] text-text-secondary">Lifts dynamically on cursor focus and updates drop shadow weights.</p>
                </AppCard>
                <GlassCard className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-text-primary">Premium Glass Card</h4>
                  <p className="text-[10px] text-text-secondary">Vibrant backdrop-blur overlay filtering content behind the panel.</p>
                </GlassCard>
              </div>
            </SectionCard>
          </div>

          {/* Form Control Suite Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-app-24">
            
            {/* Standard Input Fields Card */}
            <SectionCard title="Input Forms Catalog" subtitle="Standard fields, error validations, and switch toggles">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <Input
                  label="Guest Full Name"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={formErrors.name}
                  placeholder="Enter guest name..."
                />
                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={formErrors.email}
                  placeholder="Enter email address..."
                />
                <Select
                  label="Employee Roster Role"
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  options={[
                    { value: 'server', label: 'Floor Service Server' },
                    { value: 'chef', label: 'Main Kitchen Chef' },
                    { value: 'manager', label: 'Shift Duty Manager' }
                  ]}
                />
                <Textarea
                  label="Operational Notes / Alerts"
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  error={formErrors.notes}
                  placeholder="Input operational details..."
                />
                <div className="flex items-center justify-between border-t border-app-border pt-4">
                  <Switch
                    label="Toggle Account Status"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <PrimaryButton type="submit">Verify Form</PrimaryButton>
                </div>
              </form>
            </SectionCard>

            {/* Premium Floating Inputs Showcase */}
            <SectionCard title="Floating Labels Inputs" subtitle="Linear-style animated labels with focus bounds">
              <div className="space-y-6 pt-3">
                <FloatingInput
                  label="Enter Branch Code"
                  id="branch-code"
                  placeholder=""
                />
                <FloatingInput
                  label="Enter Latitude Coordinate"
                  id="latitude"
                  placeholder=""
                />
                <FloatingInput
                  label="Enter Radius Limit (meters)"
                  id="radius"
                  placeholder=""
                />
              </div>
            </SectionCard>

            {/* Overlays, Skeletons, and States Preview */}
            <SectionCard title="State Indicators Showcase" subtitle="Badges catalog, skeleton shimmer cards, and drawers triggers">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge status="default">DEFAULT Badge</Badge>
                  <Badge status="success">SUCCESS Badge</Badge>
                  <Badge status="warning">WARNING Badge</Badge>
                  <Badge status="danger">DANGER Badge</Badge>
                  <Badge status="info">INFO Badge</Badge>
                </div>
                
                <div className="border-t border-app-border pt-4 space-y-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Skeleton Loader Blocks</span>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-8 w-1/3" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-app-border pt-4 flex gap-3">
                  <SecondaryButton onClick={() => setIsDrawerOpen(true)}>
                    Slide Out Drawer
                  </SecondaryButton>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Unified DataTable Component Showcase */}
          <SectionCard title="Reusable DataTable Grid" subtitle="Supports sticky headers, pagination rows, column rendering, and loading toggles">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Mock Branch Network Registry</span>
              <Switch
                label="Toggle Table Load State"
                checked={tableLoading}
                onChange={(e) => setTableLoading(e.target.checked)}
              />
            </div>
            
            <DataTable
              columns={tableColumns}
              data={filteredData}
              loading={tableLoading}
              searchPlaceholder="Filter branches by name..."
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterValue={filterValue}
              onFilterChange={setFilterValue}
              filterOptions={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Operational' },
                { value: 'pending', label: 'Under Review' },
                { value: 'inactive', label: 'Suspended' }
              ]}
              totalPages={2}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </SectionCard>

        </div>
      )}

      {/* 2. TYPOGRAPHY TAB VIEW */}
      {activeTab === 'typography' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-app-24">
          
          {/* Typography Hierarchy Card */}
          <SectionCard title="Typography Standard Scale" subtitle="Standardizes font weight scaling, leading bounds, and text sizes">
            <div className="space-y-6">
              <div className="border-b border-app-border pb-3">
                <span className="text-[9px] font-bold text-text-muted block">H1 Page Title Header (text-2xl font-extrabold tracking-tight)</span>
                <h1 className="text-2xl font-extrabold tracking-tight mt-1">DineIn Hospitality SaaS</h1>
              </div>
              <div className="border-b border-app-border pb-3">
                <span className="text-[9px] font-bold text-text-muted block">H2 Section Subtitle (text-lg font-bold tracking-tight)</span>
                <h2 className="text-lg font-bold tracking-tight mt-1">Branch Geofence Boundaries</h2>
              </div>
              <div className="border-b border-app-border pb-3">
                <span className="text-[9px] font-bold text-text-muted block">H3 Inner Component Title (text-sm font-semibold)</span>
                <h3 className="text-sm font-semibold mt-1">Active Seated Table Count</h3>
              </div>
              <div className="border-b border-app-border pb-3">
                <span className="text-[9px] font-bold text-text-muted block">Subtitle Class (text-xs font-semibold)</span>
                <p className="text-xs font-semibold text-text-secondary mt-1">Tracks kitchen wastage logs logs weight</p>
              </div>
              <div className="border-b border-app-border pb-3">
                <span className="text-[9px] font-bold text-text-muted block">Body copy text (text-xs leading-normal)</span>
                <p className="text-xs leading-normal text-text-secondary mt-1">
                  Gemini sales trend analysis, wastage cost projection models, and automated menu recommendation pipelines are planned.
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-text-muted block">Caption / Small Label (text-[10px] font-medium)</span>
                <span className="text-[10px] font-medium text-text-muted mt-1 block">👤 Party of 4 • ⏳ 15m est wait time</span>
              </div>
            </div>
          </SectionCard>

          {/* Color Palette Grid */}
          <SectionCard title="Semantic Color Palette swatches" subtitle="Bound directly to root CSS variables for perfect light/dark mapping">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-app-bg border border-app-border rounded-app-lg flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-text-primary">Background Base</span>
                  <p className="text-[10px] text-text-muted">bg-app-bg</p>
                </div>
                <div className="w-6 h-6 rounded-full border border-app-border bg-app-bg" />
              </div>
              <div className="p-4 bg-app-surface border border-app-border rounded-app-lg flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-text-primary">Card Surface</span>
                  <p className="text-[10px] text-text-muted">bg-app-surface</p>
                </div>
                <div className="w-6 h-6 rounded-full border border-app-border bg-app-surface" />
              </div>
              <div className="p-4 bg-app-elevated border border-app-border rounded-app-lg flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-text-primary">Input Elevated</span>
                  <p className="text-[10px] text-text-muted">bg-app-elevated</p>
                </div>
                <div className="w-6 h-6 rounded-full border border-app-border bg-app-elevated" />
              </div>
              <div className="p-4 bg-app-primary border border-app-border rounded-app-lg flex items-center justify-between text-white">
                <div className="space-y-1">
                  <span className="text-xs font-bold">Brand Primary</span>
                  <p className="text-[10px] opacity-80">bg-app-primary</p>
                </div>
                <div className="w-6 h-6 rounded-full border border-white/20 bg-app-primary" />
              </div>
              <div className="p-4 bg-app-success/10 border border-app-success/20 rounded-app-lg flex items-center justify-between text-app-success">
                <div className="space-y-1">
                  <span className="text-xs font-bold">Success Green</span>
                  <p className="text-[10px] opacity-80">bg-app-success</p>
                </div>
                <div className="w-6 h-6 rounded-full border border-app-success bg-app-success" />
              </div>
              <div className="p-4 bg-app-danger/10 border border-app-danger/20 rounded-app-lg flex items-center justify-between text-app-danger">
                <div className="space-y-1">
                  <span className="text-xs font-bold">Danger Red</span>
                  <p className="text-[10px] opacity-80">bg-app-danger</p>
                </div>
                <div className="w-6 h-6 rounded-full border border-app-danger bg-app-danger" />
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* 3. SPACING TAB VIEW */}
      {activeTab === 'spacing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-app-24">
          
          {/* Spacing Scale Card */}
          <SectionCard title="Spacing Scale Matrix" subtitle="Standardizes element gaps, margins, paddings, and column offsets">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-16 text-xs text-text-muted font-bold">8px (0.5rem)</span>
                <div className="h-4 bg-app-primary rounded-app-sm w-8" />
                <span className="text-[10px] text-text-secondary font-medium">spacing-app-8</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-16 text-xs text-text-muted font-bold">12px (0.75rem)</span>
                <div className="h-4 bg-app-primary rounded-app-sm w-12" />
                <span className="text-[10px] text-text-secondary font-medium">spacing-app-12</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-16 text-xs text-text-muted font-bold">16px (1.0rem)</span>
                <div className="h-4 bg-app-primary rounded-app-sm w-16" />
                <span className="text-[10px] text-text-secondary font-medium">spacing-app-16</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-16 text-xs text-text-muted font-bold">20px (1.25rem)</span>
                <div className="h-4 bg-app-primary rounded-app-sm w-20" />
                <span className="text-[10px] text-text-secondary font-medium">spacing-app-20</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-16 text-xs text-text-muted font-bold">24px (1.5rem)</span>
                <div className="h-4 bg-app-primary rounded-app-sm w-24" />
                <span className="text-[10px] text-text-secondary font-medium">spacing-app-24</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-16 text-xs text-text-muted font-bold">32px (2.0rem)</span>
                <div className="h-4 bg-app-primary rounded-app-sm w-32" />
                <span className="text-[10px] text-text-secondary font-medium">spacing-app-32</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-16 text-xs text-text-muted font-bold">40px (2.5rem)</span>
                <div className="h-4 bg-app-primary rounded-app-sm w-40" />
                <span className="text-[10px] text-text-secondary font-medium">spacing-app-40</span>
              </div>
            </div>
          </SectionCard>

          {/* Border Radius Card */}
          <SectionCard title="Border Radius Index" subtitle="Standardizes corner curves across buttons, inputs, panels, and modals">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-app-border rounded-app-sm flex flex-col justify-between h-20 bg-app-surface">
                <span className="text-[10px] text-text-muted font-bold">SM Radius (0.375rem)</span>
                <span className="text-xs font-bold text-text-primary">rounded-app-sm</span>
              </div>
              <div className="p-4 border border-app-border rounded-app-md flex flex-col justify-between h-20 bg-app-surface">
                <span className="text-[10px] text-text-muted font-bold">MD Radius (0.5rem)</span>
                <span className="text-xs font-bold text-text-primary">rounded-app-md</span>
              </div>
              <div className="p-4 border border-app-border rounded-app-lg flex flex-col justify-between h-20 bg-app-surface">
                <span className="text-[10px] text-text-muted font-bold">LG Radius (0.75rem)</span>
                <span className="text-xs font-bold text-text-primary">rounded-app-lg</span>
              </div>
              <div className="p-4 border border-app-border rounded-app-xl flex flex-col justify-between h-20 bg-app-surface">
                <span className="text-[10px] text-text-muted font-bold">XL Radius (1.0rem)</span>
                <span className="text-xs font-bold text-text-primary">rounded-app-xl</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* OVERLAY VIEWS DEMO */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Design System Interactive Modal">
        <div className="space-y-4 text-xs font-medium">
          <p className="text-text-secondary leading-relaxed">
            This modal features Framer Motion spring transitions. Clicking the backdrop closes the overlay window cleanly.
          </p>
          <div className="flex justify-end gap-3 border-t border-app-border pt-4">
            <SecondaryButton onClick={() => setIsModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={() => {
              setIsModalOpen(false);
              alert('Action verified!');
            }}>
              Confirm Action
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Design System Slide-Out Drawer">
        <div className="space-y-6 text-xs font-medium">
          <p className="text-text-secondary leading-relaxed">
            This drawer slides out dynamically from the right border and matches height bounds perfectly.
          </p>
          <div className="space-y-2 border-t border-app-border pt-4">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Branch Contact Info</span>
            <p className="text-text-primary font-bold">Main Office Desk</p>
            <p className="text-text-muted">+91 98765 43210</p>
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={() => setIsDrawerOpen(false)} className="w-full">
              Dismiss Drawer
            </PrimaryButton>
          </div>
        </div>
      </Drawer>

    </div>
  );
};

export default DesignSystemShowcase;
