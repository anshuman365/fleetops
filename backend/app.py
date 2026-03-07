from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, JWTManager,
    verify_jwt_in_request
)
from flask_mail import Mail, Message
from datetime import datetime, date, timedelta
from functools import wraps
import os, secrets, math, hmac, hashlib
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI']        = os.getenv('DATABASE_URL', 'sqlite:///trucklogs.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY']                     = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-prod')
app.config['JWT_SECRET_KEY']                 = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-prod')
app.config['JWT_ACCESS_TOKEN_EXPIRES']       = timedelta(days=7)
app.config['MAIL_SERVER']                    = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT']                      = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS']                   = True
app.config['MAIL_USERNAME']                  = os.getenv('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD']                  = os.getenv('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER']            = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@fleetops.app')

FRONTEND_URL    = os.getenv('FRONTEND_URL', 'http://localhost:3000')
RAZORPAY_KEY    = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_yourkeyhere')
RAZORPAY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', 'your_razorpay_secret')
PREMIUM_PRICE   = 99900  # paise = Rs 999

CORS(app, supports_credentials=True, origins=[
    "http://localhost:3000", "http://localhost:3001", FRONTEND_URL
])

db   = SQLAlchemy(app)
jwt  = JWTManager(app)
mail = Mail(app)


# ═══════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════

class User(db.Model):
    id               = db.Column(db.Integer, primary_key=True)
    username         = db.Column(db.String(80),  unique=True, nullable=False)
    email            = db.Column(db.String(120), unique=True, nullable=False)
    password_hash    = db.Column(db.String(255), nullable=False)
    package          = db.Column(db.String(20),  default='free')
    full_name        = db.Column(db.String(120))
    company_name     = db.Column(db.String(120))
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    is_active        = db.Column(db.Boolean, default=True)
    email_verified   = db.Column(db.Boolean, default=False)
    verify_token     = db.Column(db.String(128), nullable=True)
    verify_token_exp = db.Column(db.DateTime,    nullable=True)
    payments         = db.relationship('Payment', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id, 'username': self.username, 'email': self.email,
            'package': self.package, 'full_name': self.full_name,
            'company_name': self.company_name,
            'created_at': self.created_at.isoformat(),
            'email_verified': self.email_verified,
        }


class Payment(db.Model):
    id                  = db.Column(db.Integer, primary_key=True)
    user_id             = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    razorpay_order_id   = db.Column(db.String(100), nullable=True)
    razorpay_payment_id = db.Column(db.String(100), nullable=True)
    razorpay_signature  = db.Column(db.String(200), nullable=True)
    amount              = db.Column(db.Integer, nullable=False)
    currency            = db.Column(db.String(10), default='INR')
    status              = db.Column(db.String(20), default='created')
    plan                = db.Column(db.String(20), default='premium')
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)
    paid_at             = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        u = User.query.get(self.user_id)
        return {
            'id': self.id, 'invoice_no': f'FO-{self.id:05d}',
            'razorpay_order_id': self.razorpay_order_id,
            'razorpay_payment_id': self.razorpay_payment_id,
            'amount': self.amount,
            'amount_display': f'Rs {self.amount // 100}',
            'currency': self.currency, 'status': self.status, 'plan': self.plan,
            'created_at': self.created_at.isoformat(),
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'user': u.to_dict() if u else None,
        }


class Driver(db.Model):
    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    name           = db.Column(db.String(100), nullable=False)
    phone          = db.Column(db.String(15),  nullable=False)
    license_no     = db.Column(db.String(50),  nullable=False)
    license_expiry = db.Column(db.Date, nullable=False)
    address        = db.Column(db.String(200))
    status         = db.Column(db.String(20), default='available')
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)
    trips          = db.relationship('Trip', backref='driver', lazy=True)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'phone': self.phone,
            'license_no': self.license_no,
            'license_expiry': self.license_expiry.isoformat(),
            'address': self.address, 'status': self.status,
            'created_at': self.created_at.isoformat(),
            'total_trips': len(self.trips)
        }


class Truck(db.Model):
    id               = db.Column(db.Integer, primary_key=True)
    user_id          = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    number_plate     = db.Column(db.String(20),  nullable=False, unique=True)
    model            = db.Column(db.String(100))
    capacity_tons    = db.Column(db.Float, nullable=False)
    fuel_type        = db.Column(db.String(20), default='diesel')
    status           = db.Column(db.String(20), default='available')
    last_service     = db.Column(db.Date)
    insurance_expiry = db.Column(db.Date)
    permit_expiry    = db.Column(db.Date)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    trips            = db.relationship('Trip', backref='truck', lazy=True)
    locations        = db.relationship('TruckLocation', backref='truck', lazy=True)

    def to_dict(self):
        latest_loc = TruckLocation.query.filter_by(truck_id=self.id).order_by(TruckLocation.timestamp.desc()).first()
        return {
            'id': self.id, 'number_plate': self.number_plate, 'model': self.model,
            'capacity_tons': self.capacity_tons, 'fuel_type': self.fuel_type, 'status': self.status,
            'last_service':     self.last_service.isoformat()     if self.last_service     else None,
            'insurance_expiry': self.insurance_expiry.isoformat() if self.insurance_expiry else None,
            'permit_expiry':    self.permit_expiry.isoformat()    if self.permit_expiry    else None,
            'created_at': self.created_at.isoformat(), 'total_trips': len(self.trips),
            'current_location': latest_loc.to_dict() if latest_loc else None
        }


class Trip(db.Model):
    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    truck_id       = db.Column(db.Integer, db.ForeignKey('truck.id'), nullable=False)
    driver_id      = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)
    origin         = db.Column(db.String(200), nullable=False)
    origin_lat     = db.Column(db.Float)
    origin_lng     = db.Column(db.Float)
    destination    = db.Column(db.String(200), nullable=False)
    dest_lat       = db.Column(db.Float)
    dest_lng       = db.Column(db.Float)
    material       = db.Column(db.String(100))
    load_tons      = db.Column(db.Float)
    status         = db.Column(db.String(20), default='scheduled')
    scheduled_date = db.Column(db.DateTime)
    start_time     = db.Column(db.DateTime)
    end_time       = db.Column(db.DateTime)
    distance_km    = db.Column(db.Float)
    estimated_hrs  = db.Column(db.Float)
    route_polyline = db.Column(db.Text)
    notes          = db.Column(db.Text)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'truck_id': self.truck_id, 'truck_plate': self.truck.number_plate if self.truck else None,
            'driver_id': self.driver_id, 'driver_name': self.driver.name if self.driver else None,
            'origin': self.origin, 'origin_lat': self.origin_lat, 'origin_lng': self.origin_lng,
            'destination': self.destination, 'dest_lat': self.dest_lat, 'dest_lng': self.dest_lng,
            'material': self.material, 'load_tons': self.load_tons, 'status': self.status,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'start_time':     self.start_time.isoformat()     if self.start_time     else None,
            'end_time':       self.end_time.isoformat()       if self.end_time       else None,
            'distance_km': self.distance_km, 'estimated_hrs': self.estimated_hrs,
            'notes': self.notes, 'created_at': self.created_at.isoformat()
        }


class TruckLocation(db.Model):
    id        = db.Column(db.Integer, primary_key=True)
    truck_id  = db.Column(db.Integer, db.ForeignKey('truck.id'), nullable=False)
    trip_id   = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=True)
    lat       = db.Column(db.Float, nullable=False)
    lng       = db.Column(db.Float, nullable=False)
    speed_kmh = db.Column(db.Float, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'truck_id': self.truck_id, 'trip_id': self.trip_id,
            'lat': self.lat, 'lng': self.lng,
            'speed_kmh': self.speed_kmh, 'timestamp': self.timestamp.isoformat()
        }


# ═══════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dl = math.radians(lat2 - lat1)
    dn = math.radians(lon2 - lon1)
    a  = math.sin(dl/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dn/2)**2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


def send_verification_email(user):
    token = secrets.token_urlsafe(32)
    user.verify_token     = token
    user.verify_token_exp = datetime.utcnow() + timedelta(hours=24)
    db.session.commit()

    verify_url = f"{FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#030911;font-family:Arial,sans-serif">
    <div style="max-width:520px;margin:40px auto;background:#060e17;border:1px solid #1e3a52;border-radius:16px;padding:36px">
      <div style="font-size:26px;font-weight:800;color:#0ea5e9;margin-bottom:2px">🚛 FleetOps</div>
      <div style="color:#64748b;font-size:11px;margin-bottom:32px;letter-spacing:1px;text-transform:uppercase">Truck Logistics Manager</div>

      <h2 style="color:#e2f0ff;font-size:22px;margin:0 0 16px;font-weight:800">Verify your email address</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px">
        Hello <strong style="color:#e2f0ff">{user.full_name or user.username}</strong>,<br><br>
        Thanks for registering on FleetOps! Click the button below to verify your email and activate your account.
      </p>

      <a href="{verify_url}"
         style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1e6fa8,#0ea5e9);color:#ffffff;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px">
        ✅ Verify Email &amp; Activate Account
      </a>

      <div style="margin-top:28px;padding:16px;background:#0a1520;border:1px solid #1e3a5266;border-radius:10px">
        <p style="color:#64748b;font-size:12px;margin:0">
          ⏰ <strong>This link expires in 24 hours.</strong><br>
          If you did not create this account, you can safely ignore this email.
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #1e3a52;margin:28px 0 16px">
      <p style="color:#334155;font-size:11px;margin:0">
        FleetOps · Automated email, please do not reply.<br>
        <a href="{FRONTEND_URL}" style="color:#1e6fa8;text-decoration:none">{FRONTEND_URL}</a>
      </p>
    </div>
    </body></html>
    """
    try:
        msg      = Message("Verify your FleetOps account", recipients=[user.email])
        msg.html = html
        mail.send(msg)
        return True
    except Exception as e:
        app.logger.error(f"Mail send error: {e}")
        return False


def send_invoice_email(payment):
    user = payment.user
    paid_date = payment.paid_at.strftime('%d %B %Y') if payment.paid_at else ''
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#030911;font-family:Arial,sans-serif">
    <div style="max-width:560px;margin:40px auto;background:#060e17;border:1px solid #1e3a52;border-radius:16px;padding:36px">

      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
        <div>
          <div style="font-size:24px;font-weight:800;color:#0ea5e9">🚛 FleetOps</div>
          <div style="color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase">Truck Logistics Manager</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:#a855f7;font-weight:700;letter-spacing:1px;text-transform:uppercase">Invoice</div>
          <div style="font-size:22px;font-weight:800;color:#e2f0ff">#{payment.id:05d}</div>
          <div style="font-size:12px;color:#64748b">{paid_date}</div>
        </div>
      </div>

      <!-- Bill To -->
      <table style="width:100%;margin-bottom:20px">
        <tr>
          <td style="vertical-align:top;width:50%">
            <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Bill To</div>
            <div style="color:#e2f0ff;font-weight:700;font-size:15px">{user.full_name or user.username}</div>
            <div style="color:#94a3b8;font-size:13px">{user.email}</div>
            {f'<div style="color:#94a3b8;font-size:13px">{user.company_name}</div>' if user.company_name else ''}
          </td>
          <td style="vertical-align:top;text-align:right;width:50%">
            <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Payment Details</div>
            <div style="color:#94a3b8;font-size:11px;font-family:monospace">{payment.razorpay_payment_id or 'N/A'}</div>
            <div style="color:#94a3b8;font-size:11px;margin-top:4px">Order: {payment.razorpay_order_id or 'N/A'}</div>
          </td>
        </tr>
      </table>

      <!-- Line Items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr style="background:#0f1923">
            <th style="padding:10px 14px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #1e3a52">Description</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #1e3a52">Qty</th>
            <th style="padding:10px 14px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #1e3a52">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:16px 14px;border-bottom:1px solid #1e3a5233">
              <div style="color:#e2f0ff;font-weight:600;font-size:14px">FleetOps Premium Plan</div>
              <div style="color:#64748b;font-size:12px;margin-top:2px">Monthly subscription · All features unlocked</div>
            </td>
            <td style="padding:16px 14px;text-align:center;color:#94a3b8;border-bottom:1px solid #1e3a5233">1</td>
            <td style="padding:16px 14px;text-align:right;color:#e2f0ff;font-weight:700;border-bottom:1px solid #1e3a5233">Rs {payment.amount // 100}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:10px 14px;text-align:right;color:#64748b;font-size:13px">Subtotal</td>
            <td style="padding:10px 14px;text-align:right;color:#94a3b8;font-size:13px">Rs {payment.amount // 100}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:4px 14px;text-align:right;color:#64748b;font-size:13px">GST (18%)</td>
            <td style="padding:4px 14px;text-align:right;color:#94a3b8;font-size:13px">Included</td>
          </tr>
          <tr style="border-top:2px solid #1e3a52">
            <td colspan="2" style="padding:14px 14px;text-align:right;color:#e2f0ff;font-weight:700;font-size:15px">Total Paid</td>
            <td style="padding:14px 14px;text-align:right;color:#a855f7;font-weight:800;font-size:20px">Rs {payment.amount // 100}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Status Banner -->
      <div style="background:#0d2a0d;border:1px solid #22c55e55;border-radius:12px;padding:18px;text-align:center;margin-bottom:24px">
        <div style="font-size:24px;margin-bottom:6px">✅</div>
        <div style="color:#22c55e;font-weight:700;font-size:15px">Payment Successful</div>
        <div style="color:#64748b;font-size:12px;margin-top:4px">
          Your Premium account is now active. Enjoy all FleetOps features!
        </div>
      </div>

      <hr style="border:none;border-top:1px solid #1e3a52;margin:0 0 16px">
      <p style="color:#334155;font-size:11px;text-align:center;margin:0">
        FleetOps · support@fleetops.app<br>
        This is a computer-generated invoice — no signature required.
      </p>
    </div>
    </body></html>
    """
    try:
        msg      = Message(f"Payment Invoice #{payment.id:05d} – FleetOps Premium Activated", recipients=[user.email])
        msg.html = html
        mail.send(msg)
    except Exception as e:
        app.logger.error(f"Invoice mail error: {e}")


# ═══════════════════════════════════════════════════════════════════════
# DECORATORS
# ═══════════════════════════════════════════════════════════════════════

def premium_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        uid  = get_jwt_identity()
        user = User.query.get(int(uid))
        if not user or user.package != 'premium':
            return jsonify({'msg': 'Premium feature. Please upgrade.', 'upgrade_required': True}), 403
        return fn(*args, **kwargs)
    return wrapper


# ═══════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ═══════════════════════════════════════════════════════════════════════

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    username     = data.get('username', '').strip()
    email        = data.get('email', '').strip().lower()
    password     = data.get('password', '')
    full_name    = data.get('full_name', '').strip()
    company_name = data.get('company_name', '').strip()

    if not username or not email or not password:
        return jsonify({'msg': 'Username, email and password required'}), 400
    if len(password) < 6:
        return jsonify({'msg': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'msg': 'Username already taken'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'msg': 'Email already registered'}), 400

    user = User(
        username=username, email=email,
        password_hash=generate_password_hash(password),
        full_name=full_name, company_name=company_name,
        package='free', email_verified=False
    )
    db.session.add(user)
    db.session.commit()

    mail_sent = send_verification_email(user)
    return jsonify({
        'msg': 'Account created! Please check your email to verify.',
        'mail_sent': mail_sent, 'user': user.to_dict()
    }), 201


@app.route('/api/verify-email', methods=['POST'])
def verify_email():
    token = (request.json or {}).get('token', '')
    user  = User.query.filter_by(verify_token=token).first()
    if not user or not token:
        return jsonify({'msg': 'Invalid or expired link.'}), 400
    if user.verify_token_exp < datetime.utcnow():
        return jsonify({'msg': 'Link expired. Please request a new one.'}), 400
    user.email_verified   = True
    user.verify_token     = None
    user.verify_token_exp = None
    db.session.commit()
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'msg': 'Email verified! Welcome to FleetOps.', 'access_token': access_token, 'user': user.to_dict()})


@app.route('/api/resend-verification', methods=['POST'])
def resend_verification():
    email = (request.json or {}).get('email', '').strip().lower()
    user  = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'msg': 'No account with that email.'}), 404
    if user.email_verified:
        return jsonify({'msg': 'Email already verified.'}), 400
    send_verification_email(user)
    return jsonify({'msg': 'Verification email resent. Check your inbox.'})


@app.route('/api/login', methods=['POST'])
def login():
    data       = request.json or {}
    identifier = data.get('username', '').strip()
    password   = data.get('password', '')
    user       = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'msg': 'Invalid username or password'}), 401
    if not user.is_active:
        return jsonify({'msg': 'Account disabled'}), 403
    if not user.email_verified:
        return jsonify({'msg': 'Please verify your email first.', 'email_unverified': True, 'email': user.email}), 403
    token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': token, 'user': user.to_dict()}), 200


@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    user = User.query.get(int(get_jwt_identity()))
    return jsonify(user.to_dict()) if user else (jsonify({'msg': 'Not found'}), 404)


@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user = User.query.get(int(get_jwt_identity()))
    data = request.json or {}
    for f in ['full_name', 'company_name']:
        if f in data: setattr(user, f, data[f])
    db.session.commit()
    return jsonify(user.to_dict())


# ═══════════════════════════════════════════════════════════════════════
# RAZORPAY PAYMENT
# ═══════════════════════════════════════════════════════════════════════

@app.route('/api/payment/create-order', methods=['POST'])
@jwt_required()
def create_order():
    try:
        import razorpay
    except ImportError:
        return jsonify({'msg': 'Razorpay not installed. Run: pip install razorpay'}), 500

    uid  = get_jwt_identity()
    user = User.query.get(int(uid))
    if user.package == 'premium':
        return jsonify({'msg': 'Already on Premium'}), 400

    client = razorpay.Client(auth=(RAZORPAY_KEY, RAZORPAY_SECRET))
    order  = client.order.create({
        'amount':   PREMIUM_PRICE,
        'currency': 'INR',
        'receipt':  f'fo_{uid}_{int(datetime.utcnow().timestamp())}',
        'notes':    {'user_id': str(uid), 'plan': 'premium'}
    })

    payment = Payment(user_id=int(uid), razorpay_order_id=order['id'],
                      amount=PREMIUM_PRICE, status='created', plan='premium')
    db.session.add(payment)
    db.session.commit()

    return jsonify({
        'order_id': order['id'], 'amount': PREMIUM_PRICE, 'currency': 'INR',
        'key': RAZORPAY_KEY, 'name': 'FleetOps',
        'description': 'Premium Plan — Monthly Subscription',
        'prefill': {'name': user.full_name or user.username, 'email': user.email, 'contact': ''}
    })


@app.route('/api/payment/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    uid  = get_jwt_identity()
    data = request.json or {}
    rzp_order_id   = data.get('razorpay_order_id', '')
    rzp_payment_id = data.get('razorpay_payment_id', '')
    rzp_signature  = data.get('razorpay_signature', '')

    # Verify HMAC signature
    body     = f"{rzp_order_id}|{rzp_payment_id}"
    expected = hmac.new(RAZORPAY_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, rzp_signature):
        return jsonify({'msg': 'Payment verification failed. Invalid signature.'}), 400

    payment = Payment.query.filter_by(razorpay_order_id=rzp_order_id).first()
    if not payment:
        return jsonify({'msg': 'Payment record not found'}), 404

    payment.razorpay_payment_id = rzp_payment_id
    payment.razorpay_signature  = rzp_signature
    payment.status              = 'paid'
    payment.paid_at             = datetime.utcnow()

    user         = User.query.get(int(uid))
    user.package = 'premium'
    db.session.commit()

    send_invoice_email(payment)
    return jsonify({'msg': 'Payment verified! Premium activated.', 'user': user.to_dict(), 'payment': payment.to_dict()})


@app.route('/api/payment/history', methods=['GET'])
@jwt_required()
def payment_history():
    uid      = get_jwt_identity()
    payments = Payment.query.filter_by(user_id=int(uid)).order_by(Payment.created_at.desc()).all()
    return jsonify([p.to_dict() for p in payments])


@app.route('/api/payment/invoice/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_invoice(payment_id):
    uid     = get_jwt_identity()
    payment = Payment.query.get_or_404(payment_id)
    if payment.user_id != int(uid):
        return jsonify({'msg': 'Forbidden'}), 403
    return jsonify(payment.to_dict())


@app.route('/api/packages', methods=['GET'])
def get_packages():
    return jsonify({'packages': [
        {'id': 'free', 'name': 'Free', 'price': 0, 'currency': 'INR',
         'features': ['Up to 5 trucks', 'Up to 10 drivers', 'Trip management', 'Dashboard', 'Expiry alerts']},
        {'id': 'premium', 'name': 'Premium', 'price': 999, 'currency': 'INR', 'period': 'month',
         'features': ['Unlimited trucks & drivers', 'Advanced route planner with live map', 'Multi-route comparison',
                      'Fleet map tracking', 'Analytics', 'Priority support', 'Invoice on payment']}
    ]})


# ═══════════════════════════════════════════════════════════════════════
# ROUTE CALCULATION (OSRM)
# ═══════════════════════════════════════════════════════════════════════

@app.route('/api/route/calculate', methods=['POST'])
@jwt_required()
def calculate_route():
    import requests as req
    data = request.json or {}
    lat1 = data.get('origin_lat')
    lon1 = data.get('origin_lng')
    lat2 = data.get('dest_lat')
    lon2 = data.get('dest_lng')

    if None in (lat1, lon1, lat2, lon2):
        return jsonify({'msg': 'All four coordinates required'}), 400

    routes = []
    try:
        url = (f"http://router.project-osrm.org/route/v1/driving/"
               f"{lon1},{lat1};{lon2},{lat2}"
               f"?overview=full&geometries=geojson&alternatives=true&steps=true")
        r = req.get(url, timeout=12)
        if r.status_code == 200:
            osrm = r.json()
            labels = ['Fastest Route', 'Alternative Route 1', 'Alternative Route 2']
            colors = ['#0ea5e9', '#f59e0b', '#a855f7']
            for i, route in enumerate(osrm.get('routes', [])[:3]):
                dist_km  = round(route['distance'] / 1000, 1)
                dur_sec  = route['duration']
                dur_hrs  = round(dur_sec / 3600, 1)
                dur_min  = int(dur_sec / 60)
                routes.append({
                    'index': i,
                    'label': labels[i] if i < len(labels) else f'Route {i+1}',
                    'color': colors[i] if i < len(colors) else '#64748b',
                    'distance_km':  dist_km,
                    'duration_hrs': dur_hrs,
                    'duration_min': dur_min,
                    'duration_text': f"{int(dur_hrs)}h {dur_min % 60}m" if dur_hrs >= 1 else f"{dur_min}m",
                    'geometry': route['geometry'],
                    'steps': [
                        {
                            'instruction': s.get('maneuver', {}).get('type', '').replace('_', ' ').title()
                                           + (f" onto {s['name']}" if s.get('name') else ''),
                            'name': s.get('name', ''),
                            'distance_km': round(s.get('distance', 0) / 1000, 2),
                            'duration_min': round(s.get('duration', 0) / 60, 1),
                            'type': s.get('maneuver', {}).get('type', '')
                        }
                        for leg in route.get('legs', [])
                        for s in leg.get('steps', [])
                        if s.get('distance', 0) > 100
                    ]
                })
    except Exception as e:
        app.logger.warning(f"OSRM error: {e}")

    if not routes:
        dist = haversine(lat1, lon1, lat2, lon2)
        hrs  = round(dist * 1.3 / 55, 1)
        routes = [{
            'index': 0, 'label': 'Estimated (Straight-line)',
            'color': '#64748b', 'distance_km': dist,
            'duration_hrs': hrs, 'duration_min': int(hrs * 60),
            'duration_text': f"{int(hrs)}h {int((hrs % 1) * 60)}m",
            'geometry': None, 'steps': [], 'fallback': True
        }]

    return jsonify({
        'routes': routes,
        'origin': {'lat': lat1, 'lng': lon1},
        'destination': {'lat': lat2, 'lng': lon2}
    })


# Quick distance estimate for trip form (no auth needed)
@app.route('/api/route/estimate', methods=['POST'])
@jwt_required()
def estimate_route():
    data = request.json or {}
    lat1 = data.get('origin_lat'); lon1 = data.get('origin_lng')
    lat2 = data.get('dest_lat');   lon2 = data.get('dest_lng')
    if None in (lat1, lon1, lat2, lon2):
        return jsonify({'msg': 'Coords required'}), 400
    straight = haversine(lat1, lon1, lat2, lon2)
    road     = round(straight * 1.3, 1)
    hrs      = round(road / 55, 1)
    return jsonify({
        'straight_km': straight, 'estimated_road_km': road,
        'estimated_hrs': hrs,
        'duration_text': f"{int(hrs)}h {int((hrs % 1)*60)}m"
    })


# ═══════════════════════════════════════════════════════════════════════
# DRIVERS, TRUCKS, TRIPS, DASHBOARD (unchanged logic)
# ═══════════════════════════════════════════════════════════════════════

@app.route('/api/drivers', methods=['GET'])
@jwt_required()
def get_drivers():
    uid = int(get_jwt_identity())
    return jsonify([d.to_dict() for d in Driver.query.filter((Driver.user_id == uid) | (Driver.user_id == None)).all()])

@app.route('/api/drivers', methods=['POST'])
@jwt_required()
def create_driver():
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.package == 'free' and Driver.query.filter_by(user_id=uid).count() >= 10:
        return jsonify({'msg': 'Free plan: max 10 drivers. Upgrade to Premium.', 'upgrade_required': True}), 403
    data = request.json
    d    = Driver(user_id=uid, name=data['name'], phone=data['phone'],
                  license_no=data['license_no'], license_expiry=date.fromisoformat(data['license_expiry']),
                  address=data.get('address',''), status='available')
    db.session.add(d); db.session.commit()
    return jsonify(d.to_dict()), 201

@app.route('/api/drivers/<int:id>', methods=['PUT'])
@jwt_required()
def update_driver(id):
    driver = Driver.query.get_or_404(id); data = request.json
    for k in ['name','phone','license_no','address','status']:
        if k in data: setattr(driver, k, data[k])
    if 'license_expiry' in data: driver.license_expiry = date.fromisoformat(data['license_expiry'])
    db.session.commit(); return jsonify(driver.to_dict())

@app.route('/api/drivers/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_driver(id):
    d = Driver.query.get_or_404(id); db.session.delete(d); db.session.commit()
    return jsonify({'message': 'Deleted'})

@app.route('/api/trucks', methods=['GET'])
@jwt_required()
def get_trucks():
    uid = int(get_jwt_identity())
    return jsonify([t.to_dict() for t in Truck.query.filter((Truck.user_id == uid) | (Truck.user_id == None)).all()])

@app.route('/api/trucks', methods=['POST'])
@jwt_required()
def create_truck():
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.package == 'free' and Truck.query.filter_by(user_id=uid).count() >= 5:
        return jsonify({'msg': 'Free plan: max 5 trucks. Upgrade to Premium.', 'upgrade_required': True}), 403
    data  = request.json
    truck = Truck(user_id=uid, number_plate=data['number_plate'].upper(), model=data.get('model',''),
                  capacity_tons=data['capacity_tons'], fuel_type=data.get('fuel_type','diesel'),
                  last_service    =date.fromisoformat(data['last_service'])     if data.get('last_service')     else None,
                  insurance_expiry=date.fromisoformat(data['insurance_expiry']) if data.get('insurance_expiry') else None,
                  permit_expiry   =date.fromisoformat(data['permit_expiry'])    if data.get('permit_expiry')    else None)
    db.session.add(truck); db.session.commit()
    return jsonify(truck.to_dict()), 201

@app.route('/api/trucks/<int:id>', methods=['PUT'])
@jwt_required()
def update_truck(id):
    truck = Truck.query.get_or_404(id); data = request.json
    for k in ['model','capacity_tons','fuel_type','status']:
        if k in data: setattr(truck, k, data[k])
    for df in ['last_service','insurance_expiry','permit_expiry']:
        if df in data and data[df]: setattr(truck, df, date.fromisoformat(data[df]))
    db.session.commit(); return jsonify(truck.to_dict())

@app.route('/api/trucks/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_truck(id):
    t = Truck.query.get_or_404(id); db.session.delete(t); db.session.commit()
    return jsonify({'message': 'Deleted'})

@app.route('/api/trucks/<int:id>/location', methods=['POST'])
@jwt_required()
def update_truck_location(id):
    Truck.query.get_or_404(id); data = request.json
    loc = TruckLocation(truck_id=id, trip_id=data.get('trip_id'),
                        lat=data['lat'], lng=data['lng'], speed_kmh=data.get('speed_kmh',0))
    db.session.add(loc); db.session.commit()
    return jsonify(loc.to_dict()), 201

@app.route('/api/trips', methods=['GET'])
@jwt_required()
def get_trips():
    uid = int(get_jwt_identity()); st = request.args.get('status')
    q = Trip.query.filter((Trip.user_id == uid) | (Trip.user_id == None))
    if st: q = q.filter_by(status=st)
    return jsonify([t.to_dict() for t in q.order_by(Trip.created_at.desc()).all()])

@app.route('/api/trips', methods=['POST'])
@jwt_required()
def create_trip():
    uid  = int(get_jwt_identity()); data = request.json
    def fon(v):
        try: return float(v) if v not in (None,'') else None
        except: return None
    o_lat=fon(data.get('origin_lat')); o_lng=fon(data.get('origin_lng'))
    d_lat=fon(data.get('dest_lat'));   d_lng=fon(data.get('dest_lng'))
    dist = fon(data.get('distance_km')); hrs = fon(data.get('estimated_hrs'))
    if o_lat and o_lng and d_lat and d_lng and not dist:
        dist = haversine(o_lat, o_lng, d_lat, d_lng)
        hrs  = round(dist * 1.3 / 55, 1)
    trip = Trip(user_id=uid, truck_id=data['truck_id'], driver_id=data['driver_id'],
                origin=data['origin'], origin_lat=o_lat, origin_lng=o_lng,
                destination=data['destination'], dest_lat=d_lat, dest_lng=d_lng,
                material=data.get('material',''), load_tons=fon(data.get('load_tons')),
                status='scheduled',
                scheduled_date=datetime.fromisoformat(data['scheduled_date']) if data.get('scheduled_date') else datetime.utcnow(),
                distance_km=dist, estimated_hrs=hrs, notes=data.get('notes',''))
    tk = Truck.query.get(data['truck_id']); dr = Driver.query.get(data['driver_id'])
    if tk: tk.status = 'on_trip'
    if dr: dr.status = 'on_trip'
    db.session.add(trip); db.session.commit()
    return jsonify(trip.to_dict()), 201

@app.route('/api/trips/<int:id>', methods=['GET'])
@jwt_required()
def get_trip(id): return jsonify(Trip.query.get_or_404(id).to_dict())

@app.route('/api/trips/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_trip_status(id):
    trip=Trip.query.get_or_404(id); data=request.json
    trip.status=data['status']
    if data['status']=='in_progress' and not trip.start_time: trip.start_time=datetime.utcnow()
    if data['status']=='completed':
        trip.end_time=datetime.utcnow()
        tk=Truck.query.get(trip.truck_id); dr=Driver.query.get(trip.driver_id)
        if tk: tk.status='available'
        if dr: dr.status='available'
    db.session.commit(); return jsonify(trip.to_dict())

@app.route('/api/trips/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_trip(id):
    trip=Trip.query.get_or_404(id)
    tk=Truck.query.get(trip.truck_id); dr=Driver.query.get(trip.driver_id)
    if tk and tk.status=='on_trip': tk.status='available'
    if dr and dr.status=='on_trip': dr.status='available'
    db.session.delete(trip); db.session.commit()
    return jsonify({'message':'Deleted'})

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    uid=int(get_jwt_identity())
    def qb(M): return M.query.filter((M.user_id==uid)|(M.user_id==None))
    today=date.today(); soon=today+timedelta(days=30)
    return jsonify({
        'trucks':  {'total': qb(Truck).count(),  'active': qb(Truck).filter(Truck.status=='on_trip').count()},
        'drivers': {'total': qb(Driver).count(), 'active': qb(Driver).filter(Driver.status=='on_trip').count()},
        'trips':   {'total': qb(Trip).count(),   'active': qb(Trip).filter(Trip.status=='in_progress').count(),
                    'completed': qb(Trip).filter(Trip.status=='completed').count()},
        'alerts':  {
            'expiring_insurance': qb(Truck).filter(Truck.insurance_expiry!=None,Truck.insurance_expiry<=soon).count(),
            'expiring_permits':   qb(Truck).filter(Truck.permit_expiry!=None,   Truck.permit_expiry<=soon).count(),
            'expiring_licenses':  qb(Driver).filter(Driver.license_expiry!=None,Driver.license_expiry<=soon).count()
        },
        'recent_trips': [t.to_dict() for t in qb(Trip).order_by(Trip.created_at.desc()).limit(5).all()]
    })

@app.route('/api/fleet/locations', methods=['GET'])
@premium_required
def get_fleet_locations():
    uid=int(get_jwt_identity())
    trucks=Truck.query.filter(((Truck.user_id==uid)|(Truck.user_id==None)),Truck.status=='on_trip').all()
    result=[]
    for t in trucks:
        loc=TruckLocation.query.filter_by(truck_id=t.id).order_by(TruckLocation.timestamp.desc()).first()
        if loc: result.append({'truck_id':t.id,'number_plate':t.number_plate,'lat':loc.lat,'lng':loc.lng,'speed_kmh':loc.speed_kmh,'timestamp':loc.timestamp.isoformat()})
    return jsonify(result)

@app.route('/api/seed', methods=['POST'])
@jwt_required()
def seed_data():
    uid=int(get_jwt_identity())
    for d in [
        dict(name='Ramesh Kumar',phone='9876543210',license_no='HR26-20180012345',license_expiry=date(2026,8,15),address='Rohtak, Haryana'),
        dict(name='Suresh Yadav',phone='9812345678',license_no='UP14-20190056789',license_expiry=date(2025,3,20),address='Meerut, UP'),
        dict(name='Mahesh Singh',phone='9898989898',license_no='RJ14-20170034567',license_expiry=date(2027,1,10),address='Jaipur, Rajasthan'),
    ]:
        if not Driver.query.filter_by(phone=d['phone']).first(): db.session.add(Driver(user_id=uid,**d,status='available'))
    for t in [
        dict(number_plate='HR26CA1234',model='Tata 2518',capacity_tons=15,last_service=date(2024,11,1),insurance_expiry=date(2025,6,30),permit_expiry=date(2025,4,15)),
        dict(number_plate='UP14BT5678',model='Ashok Leyland 2523',capacity_tons=20,last_service=date(2024,10,15),insurance_expiry=date(2026,2,28),permit_expiry=date(2025,9,30)),
        dict(number_plate='RJ14GH9012',model='Eicher Pro 6031',capacity_tons=12,last_service=date(2025,1,20),insurance_expiry=date(2025,5,10),permit_expiry=date(2026,3,1)),
    ]:
        if not Truck.query.filter_by(number_plate=t['number_plate']).first(): db.session.add(Truck(user_id=uid,**t,status='available'))
    db.session.commit(); return jsonify({'message':'Sample data added!'})

@app.route('/api/health', methods=['GET'])
def health(): return jsonify({'status':'ok','version':'3.0.0'})

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
