import os

components = [
    "Login", "Register", "ForgotPassword", "ResetPassword", "Profile",
    "Dashboard", "Reservations", "Inventory", "Menu", "Staff",
    "Feedback", "Analytics", "Reports", "Communication", "Settings",
    "DesignSystemShowcase", "POS", "KDS", "PublicTableMenu"
]

for comp in components:
    path1 = f"c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/{comp}.jsx"
    path2 = f"c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/{comp}.js"
    if not os.path.exists(path1) and not os.path.exists(path2):
        print(f"CRITICAL: Component file for {comp} does NOT exist!")
    else:
        print(f"Verified: {comp} exists.")
