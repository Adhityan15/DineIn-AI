import re

with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/PublicTableMenu.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# find all Capitalized tags or values starting with uppercase (often icons)
# like <Search ... or icon={Search}
icon_names = set(re.findall(r'icon=\{(\w+)\}', content) + re.findall(r'<(\w+)\s', content))

# let's look at the imports
import_match = re.search(r'import\s+\{\s*([^}]+)\s*\}\s+from\s+[\'"]lucide-react[\'"]', content)
if import_match:
    imports = [x.strip() for x in import_match.group(1).split(",")]
    print("Imports from lucide-react:", imports)
    
    # check if any used icon is a lucide icon but not imported
    lucide_candidates = ["ShoppingBag", "Search", "Sparkles", "AlertTriangle", "Utensils", "CheckCircle", "Clock", "ChefHat", "Play", "ArrowLeft", "ShoppingCart", "User", "Plus", "Minus", "X", "Calendar", "ChevronRight", "CreditCard", "Inbox", "History", "MapPin", "Sun", "Moon", "Bell", "UserIcon", "ChevronDown", "Menu", "LogOut", "X", "Search", "MapPin", "ClockIcon", "Eye", "UtensilsCrossed", "Send", "DollarSign", "InboxIcon"]
    
    for icon in icon_names:
        if icon in lucide_candidates and icon not in imports:
            print(f"Icon {icon} is used but NOT imported!")
else:
    print("Could not parse lucide imports.")
