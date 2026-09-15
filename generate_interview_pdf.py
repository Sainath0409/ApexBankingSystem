import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, 760, "Apex Banking System — Backend Architecture & Interview Reference Guide")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(40, 752, 572, 752)
            
        # Footer
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 30, page_text)
        self.drawString(40, 30, "Confidential — Client Technical Interview Preparation Document")
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#0f172a")
    brand_blue = colors.HexColor("#0284c7")
    accent_green = colors.HexColor("#16a34a")
    text_dark = colors.HexColor("#1e293b")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.white,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#cbd5e1"),
        spaceAfter=8
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#94a3b8")
    )
    
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=brand_blue,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=text_dark,
        spaceAfter=6
    )
    
    qa_q_style = ParagraphStyle(
        'QAQuestion',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    
    qa_a_style = ParagraphStyle(
        'QAAnswer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#14532d")
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=text_dark
    )
    
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=primary_color
    )

    story = []

    # 1. Header Banner Box
    header_content = [
        [Paragraph("TECHNICAL INTERVIEW MASTER GUIDE", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#38bdf8")))],
        [Paragraph("Apex Banking Platform — Backend & System Architecture", title_style)],
        [Paragraph("Comprehensive Walkthrough for Fullstack & Frontend Developers", subtitle_style)],
        [Paragraph("<b>Tech Stack:</b> Python Flask, PyMongo, MongoDB, React Vite &bull; <b>Security:</b> JWT (HS256) + Salted Bcrypt", meta_style)]
    ]
    header_table = Table(header_content, colWidths=[532])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0f172a")),
        ('PADDING', (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 14),
        ('CORNERPAD', (0,0), (-1,-1), 8),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 14))

    # 2. Section 1: High-Level Architecture & Request Flow
    story.append(Paragraph("1. High-Level Architecture & End-to-End Request Flow", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=8))
    
    flow_text = """
    The Apex Banking backend is organized as a <b>Layered RESTful Micro-Modular Architecture</b>. When a client performs an operation (e.g., Sarah transfers ₹1,000 to David), the request traverses the following lifecycle:
    """
    story.append(Paragraph(flow_text, body_style))

    steps = [
        "<b>Step 1: Frontend API Dispatch:</b> React UI calls <code>api.post('/transactions/transfer', {...})</code>. The central client attaches the JWT token from localStorage into the <code>Authorization: Bearer &lt;token&gt;</code> header.",
        "<b>Step 2: Flask Routing & Factory:</b> The request hits port 5000. Flask routes it through the <code>transactions_bp</code> Blueprint registered inside <code>app/__init__.py</code>.",
        "<b>Step 3: Security & Expiration Guard:</b> The <code>@token_required</code> decorator decodes the JWT using <code>HS256</code> + <code>JWT_SECRET</code>, validates the 5-minute session timeout, checks if the account is suspended/frozen, and binds <code>request.current_user</code>.",
        "<b>Step 4: Role-Based Authorization:</b> The <code>@role_required(['customer', 'manager'])</code> decorator validates user role permissions.",
        "<b>Step 5: Business Validation & Fees:</b> The controller verifies source balance, checks the ₹100 minimum balance for Savings accounts, applies the ₹1.50 fee for Business accounts, and looks up the destination account.",
        "<b>Step 6: Atomic Database Operations:</b> MongoDB updates both account balances atomically via <code></code>, logs double-entry transaction documents, and logs an immutable audit event in <code>db.audit_logs</code>.",
        "<b>Step 7: Response & UI Sync:</b> Returns <code>200 OK</code> with new balances and transaction ID. The React frontend updates state and displays the official PDF-ready transaction receipt."
    ]

    for s in steps:
        step_table = Table([[Paragraph(s, body_style)]], colWidths=[532])
        step_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LINELEFT', (0,0), (-1,-1), 3, brand_blue),
        ]))
        story.append(step_table)
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))

    # 3. Section 2: Backend Directory & File Architecture
    story.append(Paragraph("2. Backend Directory & Component Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=8))

    file_data = [
        [Paragraph("File / Module", table_cell_bold), Paragraph("Layer", table_cell_bold), Paragraph("Core Purpose & Responsibilities", table_cell_bold)],
        [Paragraph("backend/run.py", table_cell_bold), Paragraph("Server Entry", table_cell), Paragraph("Reads port, creates Flask app instance via create_app(), and launches HTTP server.", table_cell)],
        [Paragraph("app/__init__.py", table_cell_bold), Paragraph("App Factory", table_cell), Paragraph("Initializes CORS, initializes database connection, registers all Blueprints, seeds default data.", table_cell)],
        [Paragraph("app/config.py", table_cell_bold), Paragraph("Configuration", table_cell), Paragraph("Encapsulates environment variables: MongoDB URI, JWT secrets, interest rates (6%/9%), timeouts.", table_cell)],
        [Paragraph("app/database.py", table_cell_bold), Paragraph("Data Layer", table_cell), Paragraph("Manages Singleton MongoDB connection pool via PyMongo, initializes unique indexes, handles fallbacks.", table_cell)],
        [Paragraph("app/middleware.py", table_cell_bold), Paragraph("Security Guard", table_cell), Paragraph("JWT token generation and verification, @token_required and @role_required decorators, audit logging.", table_cell)],
        [Paragraph("app/routes/auth.py", table_cell_bold), Paragraph("Auth Controller", table_cell), Paragraph("Customer/Manager registration, Bcrypt salted password verification, and JWT session token generation.", table_cell)],
        [Paragraph("app/routes/accounts.py", table_cell_bold), Paragraph("Accounts Controller", table_cell), Paragraph("Opening Savings/Business accounts, generating unique 6-digit account numbers, beneficiary lookup.", table_cell)],
        [Paragraph("app/routes/transactions.py", table_cell_bold), Paragraph("Transaction Engine", table_cell), Paragraph("Deposits, withdrawals, self & inter-bank transfers with ₹1.50 fees, and 12-row paginated history.", table_cell)],
        [Paragraph("app/routes/manager.py", table_cell_bold), Paragraph("Manager Portal", table_cell), Paragraph("Bank-wide reserves analytics, account status updates (Active/Frozen/Closed), audit logs, interest runs.", table_cell)],
        [Paragraph("app/utils/seeder.py", table_cell_bold), Paragraph("Data Seeder", table_cell), Paragraph("Seeds initial manager and customer profiles, demo balances, and sample transactions on startup.", table_cell)]
    ]
    file_table = Table(file_data, colWidths=[120, 85, 327])
    file_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(file_table)

    story.append(PageBreak())

    # 4. Section 3: OOP & Design Patterns
    story.append(Paragraph("3. Software Engineering & Object-Oriented Patterns", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=8))

    patterns = [
        ("1. Singleton Pattern (Connection Pool in database.py)",
         "<b>Problem:</b> Opening a new database connection on every request causes high latency, memory bloat, and socket exhaustion.<br/>"
         "<b>Solution:</b> The <code>Database</code> class holds a single static <code>_db</code> and <code>_client</code>. Calling <code>Database.get_db()</code> reuses the live connection pool across all concurrent requests."),
        ("2. Application Factory Pattern (create_app() in app/__init__.py)",
         "<b>Concept:</b> Instead of hardcoding a global Flask instance, the app is created inside a factory function.<br/>"
         "<b>Benefit:</b> Allows dynamically instantiating the app with different configurations (e.g. TestConfig for automated unit tests vs ProductionConfig for deployment)."),
        ("3. Decorator Pattern / Aspect-Oriented Programming (in middleware.py)",
         "<b>Concept:</b> Custom Python decorators (<code>@token_required</code>, <code>@role_required</code>) wrap route functions.<br/>"
         "<b>Benefit:</b> Decouples cross-cutting security, JWT validation, and RBAC authorization from core business logic (DRY principle)."),
        ("4. Encapsulation & Configuration Management (in config.py)",
         "<b>Concept:</b> Sensitive parameters (JWT keys, interest percentages, minimum balance thresholds, database URIs) are encapsulated in the <code>Config</code> class and loaded from environment variables (<code>.env</code>).")
    ]

    for title, desc in patterns:
        p_table = Table([[Paragraph(f"<b>{title}</b>", ParagraphStyle('PatHead', fontName='Helvetica-Bold', fontSize=9, textColor=brand_blue))],
                         [Paragraph(desc, body_style)]], colWidths=[532])
        p_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ffffff")),
            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#e2e8f0")),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(p_table)
        story.append(Spacer(1, 6))

    story.append(Spacer(1, 8))

    # 5. Section 4: MongoDB Schema & Collections
    story.append(Paragraph("4. MongoDB Collections & Indexing Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=8))

    schema_data = [
        [Paragraph("Collection", table_cell_bold), Paragraph("Key Fields & Types", table_cell_bold), Paragraph("Database Indexes & Constraints", table_cell_bold)],
        [Paragraph("users", table_cell_bold), Paragraph("_id, name, email, password_hash, role, phone, status, created_at", table_cell), Paragraph("<b>Unique Index:</b> email (prevents duplicate accounts)", table_cell)],
        [Paragraph("accounts", table_cell_bold), Paragraph("_id, account_number, user_id, owner_name, owner_email, account_type, balance, interest_rate, minimum_balance, transaction_fee, status", table_cell), Paragraph("<b>Unique Index:</b> account_number<br/><b>Index:</b> user_id", table_cell)],
        [Paragraph("transactions", table_cell_bold), Paragraph("_id, transaction_id, account_number, user_id, type, amount, fee, balance_after, reference, timestamp", table_cell), Paragraph("<b>Unique Index:</b> transaction_id<br/><b>Compound Index:</b> timestamp (DESC) for fast pagination", table_cell)],
        [Paragraph("audit_logs", table_cell_bold), Paragraph("_id, action, details (JSON), user_id, user_email, role, ip_address, timestamp", table_cell), Paragraph("<b>Index:</b> timestamp (DESC) for regulatory compliance audit queries", table_cell)]
    ]
    schema_table = Table(schema_data, colWidths=[90, 240, 202])
    schema_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(schema_table)

    story.append(Spacer(1, 10))

    # 6. Section 5: Core Banking Business Rules
    story.append(Paragraph("5. Core Banking Business Rules & Policy Summary", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=8))

    rules_data = [
        [Paragraph("Rule Domain", table_cell_bold), Paragraph("Specification & Policy Enforcement", table_cell_bold)],
        [Paragraph("Savings Account", table_cell_bold), Paragraph("<b>6.0% APY</b> interest. Requires <b>₹100.00</b> minimum initial deposit and balance. Withdrawals dropping balance below ₹100 are rejected. Zero transaction fees.", table_cell)],
        [Paragraph("Business Account", table_cell_bold), Paragraph("<b>9.0% APY</b> interest. No minimum balance required. Flat <b>₹1.50 fee</b> automatically charged per withdrawal and outgoing fund transfer.", table_cell)],
        [Paragraph("Account Statuses", table_cell_bold), Paragraph("<b>Active</b> (Full operations), <b>Frozen</b> (All debits and credits blocked due to compliance/dispute), <b>Closed</b> (Deactivated). Managed strictly by Manager role.", table_cell)],
        [Paragraph("Session Timeout", table_cell_bold), Paragraph("<b>Customer:</b> Strict 5-minute wall-clock session encoded in JWT. Topbar countdown alerts at &le;20s. <b>Manager:</b> 24-hour administrative session.", table_cell)],
        [Paragraph("Audit Trail", table_cell_bold), Paragraph("Every state change (logins, transfers, status modifications) writes an immutable record with IP address, user email, and JSON payload.", table_cell)]
    ]
    rules_table = Table(rules_data, colWidths=[130, 402])
    rules_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(rules_table)

    story.append(PageBreak())

    # 7. Section 6: Interview Cheat Sheet (Top Q&A)
    story.append(Paragraph("6. Client Interview Cheat Sheet — Top Questions & Answers", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=8))

    qas = [
        ("Q1: Can you walk me through the backend architecture of this banking project?",
         "The backend is built with Python Flask using a modular Blueprint REST architecture connected to MongoDB via PyMongo. We implemented the Application Factory pattern for flexibility, a Singleton connection pool for MongoDB, and custom middleware decorators for JWT authentication and Role-Based Access Control (RBAC). It powers multi-tier bank accounts, atomic fund transfers with fee calculations, a 5-minute customer session timeout, and an immutable compliance audit trail."),
        
        ("Q2: How is authentication, password hashing, and session management implemented?",
         "Passwords are encrypted using Bcrypt with 12 salt rounds before database storage. Upon login, we issue signed JSON Web Tokens (HS256) containing the user's role and expiration. Customers have a strict 5-minute session lifetime, while managers receive 24-hour access. On every request, our @token_required decorator extracts the Bearer token, validates the signature, checks for expiration, and verifies the user is not suspended."),
        
        ("Q3: How is MongoDB structured and how do you ensure data integrity?",
         "We use 4 primary collections: users, accounts, transactions, and audit_logs. We enforce unique indexes on emails, account numbers, and transaction IDs to guarantee data consistency. For fund transfers, we perform atomic updates using MongoDB's  operator to ensure balances remain strictly synchronized, followed by creating double-entry ledger records and audit entries."),
         
        ("Q4: What specific banking rules did you implement?",
         "We implemented two specialized account types: Savings Accounts (6.0% APY, ₹100 minimum balance rule) and Business Accounts (9.0% APY, ₹1.50 per-transaction fee). We also built manager controls allowing administrators to update account statuses between Active, Frozen, and Closed, along with an automatic annual interest calculation engine."),
         
        ("Q5: How does the React frontend communicate with this backend?",
         "The frontend uses a centralized API service that automatically attaches the JWT Bearer token to all outgoing requests. If a customer session expires (401 response), the frontend catches it globally, displays a slide-over expiration warning, and safely redirects the user to login.")
    ]

    for q, a in qas:
        qa_table = Table([
            [Paragraph(q, qa_q_style)],
            [Paragraph(a, qa_a_style)]
        ], colWidths=[532])
        qa_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
            ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#f0fdf4")),
            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#cbd5e1")),
            ('LINELEFT', (0,1), (-1,1), 3, accent_green),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(qa_table)
        story.append(Spacer(1, 6))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: PDF generated at {filename}")

if __name__ == "__main__":
    output_path = r"e:\EXL\EXL Code\Fullstack Dev_plan\week one\banking_system_fullstack\Backend_Architecture_Interview_Guide.pdf"
    build_pdf(output_path)
