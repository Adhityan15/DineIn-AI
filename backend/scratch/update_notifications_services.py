file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\apps\notifications\services.py'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Inject table_ready template layout in EmailService.get_template_layout
old_template_target = "        elif template_type == 'check_in_success':"
new_template_injection = """        elif template_type == 'table_ready':
            body = \"\"\"
            <h2 style="margin-top: 0; color: #4f46e5;">Your Table is Ready!</h2>
            <p>Dear {{guest_name}},</p>
            <p>We are excited to inform you that your dining table is ready. Please proceed to the host desk to be seated.</p>
            
            <div class="details-box">
                <div class="details-row"><span>Assigned Table:</span><strong>{{table_number}}</strong></div>
                <div class="details-row"><span>Party Size:</span><strong>{{party_size}} Diners</strong></div>
                <div class="details-row"><span>Branch:</span><strong>{{branch_name}}</strong></div>
            </div>
            \"\"\"
            subject = "Your table is ready at {{restaurant_name}}!"

        elif template_type == 'check_in_success':"""

code = code.replace(old_template_target, new_template_injection)

# 2. Add NotificationService methods and aliases
old_methods_target = """    @classmethod
    def send_welcome_email(cls, reservation):"""

new_methods_injection = """    @classmethod
    def send_reservation_welcome(cls, reservation):
        return cls.send_welcome_email(reservation)

    @classmethod
    def send_reservation_thank_you(cls, reservation):
        return cls.send_thank_you_email(reservation)

    @classmethod
    def send_reservation_table_ready(cls, reservation):
        table_nums = [str(rt.table.number) for rt in reservation.reservation_tables.all()]
        context = {
            'booking_id': str(reservation.id),
            'guest_name': reservation.guest_name,
            'party_size': reservation.party_size,
            'start_time': reservation.start_time.strftime('%Y-%m-%d %H:%M'),
            'table_number': ', '.join(table_nums) if table_nums else 'Auto-assigned',
            'branch_name': reservation.branch.name if reservation.branch else 'DineIn AI Branch',
            'contact_phone': reservation.branch.restaurant.contact_phone if reservation.branch and reservation.branch.restaurant else '+91 98765 43210',
            'map_link': 'https://maps.google.com'
        }
        return CommunicationDispatchService.send_email(
            recipient=reservation.guest_email,
            template_type='table_ready',
            context=context,
            branch_id=reservation.branch_id,
            customer_user=reservation.customer
        )

    @classmethod
    def send_welcome_email(cls, reservation):"""

code = code.replace(old_methods_target, new_methods_injection)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("notifications/services.py updated successfully with table_ready templates and welcome/thank you aliases.")
