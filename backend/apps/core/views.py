from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status, viewsets
from rest_framework.decorators import action
from apps.core.models import Branch
from apps.core.serializers import BranchSerializer

class HealthCheckView(APIView):
    """
    Standard API health check endpoint.
    Used by docker container health checkers.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response(
            {
                "status": "healthy",
                "service": "dinein-backend-api"
            },
            status=status.HTTP_200_OK
        )

class BranchViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Branch configurations updates.
    """
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        from apps.core.models import Restaurant
        restaurant = Restaurant.objects.first()
        if not restaurant:
            restaurant = Restaurant.objects.create(
                name="DineIn AI Group",
                code="dinein-ai",
                contact_email="group@dinein.ai",
                contact_phone="+15550199",
                address="1 Restaurant Plaza"
            )
        serializer.save(restaurant=restaurant)

    @action(detail=False, methods=['post'], url_path='seed-demo', url_name='seed-demo')
    def seed_demo(self, request):
        from apps.core.demo_seeding import seed_demo_data
        try:
            branch = seed_demo_data()
            return Response({
                "success": True,
                "message": f"Successfully seeded demo datasets for branch: {branch.name} ({branch.branch_code})"
            })
        except Exception as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


from apps.core.models import Invoice
from apps.core.serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        active_branch = self.request.active_branch
        if active_branch:
            qs = qs.filter(branch=active_branch)
        # Customer Role Isolation
        if self.request.user.is_authenticated and hasattr(self.request.user, 'role') and self.request.user.role and self.request.user.role.code == 'customer':
            from django.db.models import Q
            user_phone = getattr(self.request.user, 'phone', None)
            if user_phone:
                qs = qs.filter(Q(reservation__customer=self.request.user) | Q(order__customer_phone=user_phone))
            else:
                qs = qs.filter(reservation__customer=self.request.user)
        return qs

    def build_pdf_file(self, invoice, pdf_path):
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.graphics.shapes import Drawing
        from reportlab.graphics.barcode import qr
        from decimal import Decimal

        doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        story = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#4F46E5'),
            spaceAfter=5
        )
        meta_label_style = ParagraphStyle(
            'MetaLabel',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#64748B'),
            fontName='Helvetica-Bold'
        )
        meta_val_style = ParagraphStyle(
            'MetaValue',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#1E293B')
        )
        
        branch = invoice.branch
        rest_name = branch.restaurant.name if (branch and branch.restaurant) else "DineIn AI Restaurant"
        branch_name = branch.name if branch else "Main Branch"
        gst_num = branch.gst_number if (branch and branch.gst_number) else "GST-PENDING-99"
        receipt_footer = branch.receipt_footer if (branch and branch.receipt_footer) else "Thank you for dining with us!"
        currency_code = branch.currency if branch else "USD"

        story.append(Paragraph(rest_name, title_style))
        story.append(Paragraph(f"Location: {branch_name} | GST: {gst_num}", styles['Normal']))
        story.append(Spacer(1, 15))

        left_meta = [
            [Paragraph("Invoice Number:", meta_label_style), Paragraph(str(invoice.id), meta_val_style)],
            [Paragraph("Order Number:", meta_label_style), Paragraph(str(invoice.order.id if invoice.order else "Direct"), meta_val_style)],
            [Paragraph("Table Number:", meta_label_style), Paragraph(str(invoice.order.table.number if (invoice.order and invoice.order.table) else "N/A"), meta_val_style)],
            [Paragraph("Reservation ID:", meta_label_style), Paragraph(str(invoice.order.reservation.id if (invoice.order and invoice.order.reservation) else "N/A"), meta_val_style)],
        ]
        
        cust_name = invoice.order.customer_name if invoice.order else "Walk-In Customer"
        cust_phone = invoice.order.customer_phone if invoice.order else "N/A"
        waiter_name = invoice.waiter_name or (invoice.waiter.name if invoice.waiter else "N/A")
        cashier_name = invoice.cashier.name if invoice.cashier else "N/A"
        
        right_meta = [
            [Paragraph("Customer Name:", meta_label_style), Paragraph(cust_name, meta_val_style)],
            [Paragraph("Customer Phone:", meta_label_style), Paragraph(cust_phone, meta_val_style)],
            [Paragraph("Assigned Waiter:", meta_label_style), Paragraph(waiter_name, meta_val_style)],
            [Paragraph("Serving Cashier:", meta_label_style), Paragraph(cashier_name, meta_val_style)],
        ]

        meta_data = []
        for i in range(4):
            meta_row = left_meta[i] + [Spacer(1,1)] + right_meta[i]
            meta_data.append(meta_row)

        meta_table = Table(meta_data, colWidths=[100, 150, 20, 100, 150])
        meta_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 20))

        items_data = [["Item Description", "Qty", "Unit Price", "Subtotal"]]
        subtotal_val = Decimal('0.00')
        if invoice.order:
            for item in invoice.order.items.all():
                qty = item.quantity
                u_price = item.unit_price
                row_sub = qty * u_price
                subtotal_val += row_sub
                items_data.append([
                    item.menu_item.name, 
                    str(qty), 
                    f"{currency_code} {u_price:.2f}", 
                    f"{currency_code} {row_sub:.2f}"
                ])
        else:
            subtotal_val = invoice.subtotal
            items_data.append([
                "Direct Order Settlement Charge", 
                "1", 
                f"{currency_code} {invoice.subtotal:.2f}", 
                f"{currency_code} {invoice.subtotal:.2f}"
            ])

        gst_percentage = invoice.gst if invoice.gst else Decimal('5.00')
        gst_amt = subtotal_val * (gst_percentage / Decimal('100.00'))
        service_percentage = branch.service_charge_percentage if branch else Decimal('10.00')
        service_amt = subtotal_val * (service_percentage / Decimal('100.00'))
        discount_amt = invoice.discount if invoice.discount else Decimal('0.00')
        grand_total = subtotal_val + gst_amt + service_amt - discount_amt

        items_data.append(["", "", "Subtotal", f"{currency_code} {subtotal_val:.2f}"])
        if gst_percentage == Decimal('5.00'):
            cgst_val = gst_amt / Decimal('2.0')
            sgst_val = gst_amt / Decimal('2.0')
            items_data.append(["", "", "CGST (2.5%)", f"{currency_code} {cgst_val:.2f}"])
            items_data.append(["", "", "SGST (2.5%)", f"{currency_code} {sgst_val:.2f}"])
        else:
            items_data.append(["", "", f"GST ({gst_percentage}%)", f"{currency_code} {gst_amt:.2f}"])
        items_data.append(["", "", f"Service Charge ({service_percentage}%)", f"{currency_code} {service_amt:.2f}"])
        if discount_amt > 0:
            items_data.append(["", "", "Discount Applied", f"-{currency_code} {discount_amt:.2f}"])
        items_data.append(["", "", "Grand Total", f"{currency_code} {grand_total:.2f}"])

        items_table = Table(items_data, colWidths=[240, 60, 110, 110])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('ALIGN', (2,1), (-1,-1), 'RIGHT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('BACKGROUND', (0,1), (-1,-2), colors.HexColor('#F8FAFC')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('LINEBELOW', (2,-1), (3,-1), 1.5, colors.HexColor('#4F46E5')),
            ('FONTNAME', (2,-1), (3,-1), 'Helvetica-Bold'),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 20))

        txn_ref = invoice.transaction_id if invoice.transaction_id else "N/A"
        pm_method = invoice.payment_method.upper()
        
        info_data = [
            [
                Paragraph(f"<b>Payment Method:</b> {pm_method}<br/><b>Transaction Reference:</b> {txn_ref}<br/><b>Timestamp:</b> {invoice.created_at.strftime('%Y-%m-%d %H:%M:%S')}", meta_val_style),
                Spacer(1,1),
                Paragraph("<b>QR Verification Code:</b>", meta_label_style)
            ]
        ]
        
        qr_code = qr.QrCodeWidget(f"DineInAI_Inv_{invoice.id}_{grand_total:.2f}")
        bounds = qr_code.getBounds()
        w = bounds[2] - bounds[0]
        h = bounds[3] - bounds[1]
        drawing = Drawing(45, 45, transform=[45./w, 0, 0, 45./h, 0, 0])
        drawing.add(qr_code)
        
        info_table = Table([[info_data[0][0], info_data[0][1], drawing]], colWidths=[300, 20, 200])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 25))

        footer_style = ParagraphStyle(
            'FooterStyle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#64748B'),
            alignment=1,
            spaceBefore=10
        )
        story.append(Paragraph(receipt_footer, footer_style))
        story.append(Paragraph("Thank you for your business!", footer_style))

        doc.build(story)

    @action(detail=True, methods=['get'], url_path='pdf', url_name='pdf')
    def get_pdf(self, request, pk=None):
        invoice = self.get_object()
        from django.http import HttpResponse
        from django.conf import settings
        from django.utils import timezone
        import os

        # Establish path inside media root
        pdf_dir = os.path.join(settings.MEDIA_ROOT, "invoices")
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_path = os.path.join(pdf_dir, f"invoice_{invoice.id}.pdf")

        # Compile PDF physically to disk
        self.build_pdf_file(invoice, pdf_path)

        # Update metadata in MySQL
        invoice.pdf_file_path = f"invoices/invoice_{invoice.id}.pdf"
        invoice.pdf_generated_at = timezone.now()
        invoice.save()

        # Read and return stream
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.id}.pdf"'
        with open(pdf_path, 'rb') as f:
            response.write(f.read())
        return response

    @action(detail=True, methods=['post'], url_path='email', url_name='email')
    def email_invoice(self, request, pk=None):
        invoice = self.get_object()
        from rest_framework.response import Response
        import os
        from django.conf import settings
        from django.core.mail import EmailMessage

        email_to = request.data.get('email')
        if not email_to:
            if invoice.reservation and invoice.reservation.guest_email:
                email_to = invoice.reservation.guest_email
            elif invoice.order and invoice.order.reservation and invoice.order.reservation.guest_email:
                email_to = invoice.order.reservation.guest_email
        
        if not email_to:
            return Response({"error": "No email address found for this invoice. Please enter manually."}, status=400)
            
        pdf_dir = os.path.join(settings.MEDIA_ROOT, "invoices")
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_path = os.path.join(pdf_dir, f"invoice_{invoice.id}.pdf")
        
        if not os.path.exists(pdf_path):
            self.build_pdf_file(invoice, pdf_path)
            
        subject = f"Invoice {invoice.id} - DineIn AI"
        body = f"Thank you for dining with us! Please find attached your invoice (ID: {invoice.id}) for your meal.\n\nBest Regards,\nDineIn AI"
        
        email = EmailMessage(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL or 'noreply@dinein.ai',
            [email_to]
        )
        
        if os.path.exists(pdf_path):
            email.attach_file(pdf_path)
            
        try:
            email.send()
            return Response({"message": f"Invoice successfully emailed to {email_to}"})
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=500)

    @action(detail=True, methods=['post'], url_path='refund', url_name='refund')
    def refund(self, request, pk=None):
        """
        Process a complete checkout refund. Reverses inventory depletions, loyalty profile points,
        sets invoice/order status to refunded, and creates an audit trail entry transactionally.
        """
        from apps.core.services import InvoiceService
        invoice = self.get_object()
        
        try:
            InvoiceService.process_refund(
                invoice=invoice,
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({
                "success": True,
                "message": "Invoice and order successfully refunded. Stock restored and loyalty points updated.",
                "data": {
                    "invoice_id": str(invoice.id),
                    "invoice_status": invoice.status,
                    "order_status": invoice.order.status if invoice.order else None
                }
            })
        except ValidationError as e:
            return Response({
                "success": False,
                "message": str(e.detail[0] if isinstance(e.detail, list) else e.detail)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


from apps.core.models import AuditLog
from apps.core.serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

