import re

with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's extract lucide-react imports from Dashboard.jsx
import_block = re.search(r'import\s*\{(.*?)\}\s*from\s*[\'"]lucide-react[\'"]', content, re.DOTALL)
if import_block:
    imports = [x.strip() for x in import_block.group(1).replace('\n', '').split(',') if x.strip()]
    print("Dashboard lucide imports:", imports)
    
    # Check all references like icon={Name} or <Name
    # or any icon usage
    icon_refs = set(re.findall(r'icon\s*=\s*\{\s*(\w+)\s*\}', content) + re.findall(r'<\s*([A-Z]\w+)', content))
    
    # standard known components in Dashboard.jsx to exclude
    local_components = [
        "React", "Dashboard", "AdminDashboard", "OwnerDashboard", "ManagerDashboard",
        "ReceptionistDashboard", "InventoryManagerDashboard", "KitchenStaffDashboard",
        "CustomerDashboard", "StaffDashboard", "AppCard", "SectionCard", "GlassCard",
        "PrimaryButton", "SecondaryButton", "Badge", "QuickStatCard", "motion",
        "AnimatePresence", "Recharts", "ResponsiveContainer", "AreaChart", "Area",
        "XAxis", "YAxis", "CartesianGrid", "Tooltip", "PieChart", "Pie", "Cell",
        "Link", "User", "Clock", "DollarSign", "Calendar", "Award", "History", "CreditCard", "Inbox"
    ]
    
    lucide_dictionary = [
        "LayoutDashboard", "CalendarDays", "Boxes", "Users", "MessageSquareHeart",
        "LineChart", "FileSpreadsheet", "Settings", "LogOut", "Sun", "Moon", "Bell",
        "UserIcon", "ChevronDown", "Menu", "X", "Search", "MapPin", "ClockIcon", "Eye",
        "UtensilsCrossed", "Send", "Zap", "ShieldCheck", "BrainCircuit", "ChefHat", "Utensils",
        "Calendar", "AlertTriangle", "Clock", "Heart", "TrendingUp", "DollarSign", "Users",
        "Plus", "ArrowRight", "TrendingDown", "Info", "Sparkles", "Activity", "Award", "History",
        "CreditCard", "Inbox", "User"
    ]
    
    for ref in icon_refs:
        if ref in lucide_dictionary and ref not in imports:
            print(f"CRITICAL: Icon {ref} is referenced but NOT imported in Dashboard.jsx!")
else:
    print("Could not find lucide-react imports block in Dashboard.jsx")
