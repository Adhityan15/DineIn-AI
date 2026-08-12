import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { AppCard, Input, Badge } from '../DesignSystem';

const MenuGrid = ({ menuItems, onAddDirect, onItemClick }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Hardcoded standard categories display as horizontal chips (mapping to database categories)
  const categoryChips = ['All', 'Starters', 'Main Course', 'Pizza', 'Burger', 'Desserts', 'Beverages', 'Combos', 'Popular', 'Favorites'];

  // Filter menu items by search query and horizontal chips category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()));
    
    if (selectedCategory === 'All') return matchesSearch;
    if (selectedCategory === 'Popular') return matchesSearch && item.is_popular;
    if (selectedCategory === 'Favorites') return matchesSearch && item.is_favorite;
    
    // Exact category match (case insensitive)
    const itemCat = (item.category || '').toLowerCase().replace(/_/g, ' ');
    const selCat = selectedCategory.toLowerCase();
    return matchesSearch && itemCat.includes(selCat);
  });

  return (
    <div className="space-y-4">
      {/* Search and Category Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search catalog menu by item name, code, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {categoryChips.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-black rounded-full transition flex-shrink-0 border ${
                selectedCategory === cat
                  ? 'bg-app-primary text-white border-app-primary'
                  : 'bg-app-elevated border-app-border/40 text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards Catalog */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 text-xs text-text-muted">
          No menu items found. Populate F&B inventory in database first.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {filteredItems.map(item => {
            const isOutOfStock = item.available_quantity !== undefined && item.available_quantity <= 0;
            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -2 }}
                onClick={() => {
                  if (isOutOfStock) return;
                  // If item has variants/add-ons, show modifiers customization modal. Otherwise quick add.
                  if (item.has_variants || item.has_modifiers) {
                    onItemClick(item);
                  } else {
                    onAddDirect(item);
                  }
                }}
                className={`cursor-pointer ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <AppCard className="p-3 border border-app-border/40 hover:border-app-primary/30 flex flex-col justify-between h-36">
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                      {item.category || 'Dishes'}
                    </span>
                    <span className="text-xs font-black text-text-primary block line-clamp-2 leading-tight">
                      {item.name}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2 pt-1 border-t border-app-border/30">
                    <div>
                      <span className="text-xs font-black text-text-primary block">
                        ${Number(item.price).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-text-muted block">
                        Prep: {item.prep_time || 15} mins
                      </span>
                    </div>
                    
                    {isOutOfStock ? (
                      <Badge variant="danger" className="text-[8px] px-1.5 py-0.5 uppercase">SOLD OUT</Badge>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddDirect(item);
                        }}
                        className="w-6 h-6 rounded-full bg-app-primary text-white flex items-center justify-center hover:bg-app-primary/95 transition shadow-sm"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                </AppCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MenuGrid;
