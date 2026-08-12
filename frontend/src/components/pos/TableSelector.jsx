import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, UserCheck, ShoppingBag, Truck } from 'lucide-react';
import { GlassCard, Badge, PrimaryButton, SecondaryButton } from '../DesignSystem';

const TableSelector = ({ 
  diningMode, 
  setDiningMode, 
  selectedTable, 
  onSelectTable, 
  tables, 
  onResetMode 
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const serviceModes = [
    { id: 'table', label: 'Table Service', icon: Utensils, desc: 'Dine-In seating orders', color: 'text-app-primary' },
    { id: 'walk_in', label: 'Walk-In Customer', icon: UserCheck, desc: 'Counter / Quick bill', color: 'text-app-success' },
    { id: 'takeaway', label: 'Takeaway Order', icon: ShoppingBag, desc: 'Self pick-up queue', color: 'text-app-warning' },
    { id: 'delivery', label: 'Delivery Service', icon: Truck, desc: 'Home dispatch delivery', color: 'text-app-danger' }
  ];

  if (!diningMode) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <div className="text-center py-6">
          <h2 className="text-lg font-black text-text-primary">Start New Dining Session</h2>
          <p className="text-xs text-text-muted mt-1">Select service type to proceed to POS catalog</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviceModes.map(mode => {
            const Icon = mode.icon;
            return (
              <motion.div 
                key={mode.id} 
                variants={itemVariants}
                whileHover={{ y: -3, scale: 1.02 }}
                onClick={() => setDiningMode(mode.id)}
                className="cursor-pointer"
              >
                <GlassCard className="p-5 h-full border border-app-border/40 hover:border-app-primary/30 flex flex-col items-center text-center justify-between transition gap-4">
                  <div className="p-3 bg-app-elevated rounded-full">
                    <Icon className={`w-8 h-8 ${mode.color}`} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-text-primary">{mode.label}</h3>
                    <p className="text-[10px] text-text-muted">{mode.desc}</p>
                  </div>
                  <Badge variant="primary" className="text-[9px] uppercase px-2.5 py-0.5 mt-2">Open Mode</Badge>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (diningMode === 'table' && !selectedTable) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Visual Table Seating Map</h2>
            <p className="text-[10px] text-text-muted">Select an active occupied table or seat a walk-in guest</p>
          </div>
          <SecondaryButton onClick={onResetMode} className="text-xs py-1 px-3">
            Change Mode
          </SecondaryButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 pt-2">
          {tables.map(table => {
            const statusVal = table.status || 'available';
            let cardStyle = "border-app-border/40 hover:border-app-primary/30";
            let badgeStatus = "success";

            if (statusVal === 'occupied' || statusVal === 'dining') {
              cardStyle = "border-app-danger/50 bg-app-danger/5 hover:border-app-danger";
              badgeStatus = "danger";
            } else if (statusVal === 'reserved') {
              cardStyle = "border-app-warning/50 bg-app-warning/5 hover:border-app-warning";
              badgeStatus = "warning";
            } else if (statusVal === 'cleaning') {
              cardStyle = "border-app-primary/50 bg-app-primary/5 hover:border-app-primary";
              badgeStatus = "info";
            }

            return (
              <motion.div
                key={table.id}
                variants={itemVariants}
                whileHover={{ y: -2 }}
                onClick={() => onSelectTable(table.number)}
                className="cursor-pointer"
              >
                <GlassCard 
                  className={`p-4 text-center border transition flex flex-col justify-between h-28 ${cardStyle}`}
                >
                  <span className="text-[10px] text-text-muted font-bold block">TABLE</span>
                  <span className="text-2xl font-black text-text-primary block my-1">{table.number}</span>
                  <div>
                    <Badge 
                      status={badgeStatus}
                      className="text-[9px] uppercase font-black px-2 py-0.5"
                    >
                      {statusVal.toUpperCase()}
                    </Badge>
                    <span className="text-[9px] text-text-muted block mt-1">Cap: {table.capacity} pax</span>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return null;
};

export default TableSelector;
