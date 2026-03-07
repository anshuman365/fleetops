from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, JWTManager,
    get_jwt, verify_jwt_in_request
)
from datetime import datetime, date, timedelta
from functools import wraps
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///trucklogs.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-prod')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-prod')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

CORS(app, supports_credentials=True, origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    os.getenv('FRONTEND_URL', 'https://yourfrontend.onrender.com')
])

db = SQLAlchemy(app)
jwt = JWTManager(app)

# ─── MODELS ─────────────────────────────────────────────────────────────────

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    package = db.Column(db.String(20), default='free')  # 'free' | 'premium'
    full_name = db.Column(db.String(120))
    company_name = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'package': self.package,
            'full_name': self.full_name,
            'company_name': self.company_name,
            'created_at': self.created_at.isoformat(),
        }


class Driver(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    license_no = db.Column(db.String(50), nullable=False)
    license_expiry = db.Column(db.Date, nullable=False)
    address = db.Column(db.String(200))
    status = db.Column(db.String(20), default='available')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    trips = db.relationship('Trip', backref='driver', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'license_no': self.license_no,
            'license_expiry': self.license_expiry.isoformat(),
            'address': self.address,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'total_trips': len(self.trips)
        }


class Truck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    number_plate = db.Column(db.String(20), nullable=False, unique=True)
    model = db.Column(db.String(100))
    capacity_tons = db.Column(db.Float, nullable=False)
    fuel_type = db.Column(db.String(20), default='diesel')
    status = db.Column(db.String(20), default='available')
    last_service = db.Column(db.Date)
    insurance_expiry = db.Column(db.Date)
    permit_expiry = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    trips = db.relationship('Trip', backref='truck', lazy=True)
    locations = db.relationship('TruckLocation', backref='truck', lazy=True)

    def to_dict(self):
        latest_loc = TruckLocation.query.filter_by(truck_id=self.id).order_by(TruckLocation.timestamp.desc()).first()
        return {
            'id': self.id,
            'number_plate': self.number_plate,
            'model': self.model,
            'capacity_tons': self.capacity_tons,
            'fuel_type': self.fuel_type,
            'status': self.status,
            'last_service': self.last_service.isoformat() if self.last_service else None,
            'insurance_expiry': self.insurance_expiry.isoformat() if self.insurance_expiry else None,
            'permit_expiry': self.permit_expiry.isoformat() if self.permit_expiry else None,
            'created_at': self.created_at.isoformat(),
            'total_trips': len(self.trips),
            'current_location': latest_loc.to_dict() if latest_loc else None
        }


class Trip(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    truck_id = db.Column(db.Integer, db.ForeignKey('truck.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)
    origin = db.Column(db.String(200), nullable=False)
    origin_lat = db.Column(db.Float)
    origin_lng = db.Column(db.Float)
    destination = db.Column(db.String(200), nullable=False)
    dest_lat = db.Column(db.Float)
    dest_lng = db.Column(db.Float)
    material = db.Column(db.String(100))
    load_tons = db.Column(db.Float)
    status = db.Column(db.String(20), default='scheduled')
    scheduled_date = db.Column(db.DateTime)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    distance_km = db.Column(db.Float)
    route_polyline = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'truck_id': self.truck_id,
            'truck_plate': self.truck.number_plate if self.truck else None,
            'driver_id': self.driver_id,
            'driver_name': self.driver.name if self.driver else None,
            'origin': self.origin,
            'origin_lat': self.origin_lat,
            'origin_lng': self.origin_lng,
            'destination': self.destination,
            'dest_lat': self.dest_lat,
            'dest_lng': self.dest_lng,
            'material': self.material,
            'load_tons': self.load_tons,
            'status': self.status,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'distance_km': self.distance_km,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }


class TruckLocation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    truck_id = db.Column(db.Integer, db.ForeignKey('truck.id'), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=True)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    speed_kmh = db.Column(db.Float, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'truck_id': self.truck_id,
            'trip_id': self.trip_id,
            'lat': self.lat,
            'lng': self.lng,
            'speed_kmh': self.speed_kmh,
            'timestamp': self.timestamp.isoformat()
        }


# ─── DECORATORS ──────────────────────────────────────────────────────────────

def premium_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or user.package != 'premium':
            return jsonify({'msg': 'This feature requires a Premium account. Please upgrade.', 'upgrade_required': True}), 403
        return fn(*args, **kwargs)
    return wrapper


def optional_jwt_user():
    """Try to get the current user from JWT if token is present; returns None if not."""
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid:
            return User.query.get(int(uid))
    except Exception:
        pass
    return None


# ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    company_name = data.get('company_name', '').strip()

    if not username or not email or not password:
        return jsonify({'msg': 'Username, email and password are required'}), 400
    if len(password) < 6:
        return jsonify({'msg': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'msg': 'Username already taken'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'msg': 'Email already registered'}), 400

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        full_name=full_name,
        company_name=company_name,
        package='free'
    )
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': token, 'user': user.to_dict()}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    identifier = data.get('username', '').strip()  # can be username or email
    password = data.get('password', '')

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'msg': 'Invalid username or password'}), 401
    if not user.is_active:
        return jsonify({'msg': 'Account is disabled'}), 403

    token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': token, 'user': user.to_dict()}), 200


@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    uid = get_jwt_identity()
    user = User.query.get(int(uid))
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    return jsonify(user.to_dict())


@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    uid = get_jwt_identity()
    user = User.query.get(int(uid))
    data = request.json or {}
    for field in ['full_name', 'company_name']:
        if field in data:
            setattr(user, field, data[field])
    db.session.commit()
    return jsonify(user.to_dict())


@app.route('/api/upgrade', methods=['POST'])
@jwt_required()
def upgrade_package():
    uid = get_jwt_identity()
    user = User.query.get(int(uid))
    data = request.json or {}
    new_pkg = data.get('package', 'premium')
    if new_pkg not in ('free', 'premium'):
        return jsonify({'msg': 'Invalid package'}), 400
    user.package = new_pkg
    db.session.commit()
    return jsonify({'msg': f'Package updated to {user.package}', 'user': user.to_dict()})


@app.route('/api/packages', methods=['GET'])
def get_packages():
    return jsonify({
        'packages': [
            {
                'id': 'free',
                'name': 'Free',
                'price': 0,
                'currency': 'INR',
                'features': [
                    'Up to 5 trucks',
                    'Up to 10 drivers',
                    'Basic trip management',
                    'Dashboard overview',
                    'Expiry alerts',
                ]
            },
            {
                'id': 'premium',
                'name': 'Premium',
                'price': 999,
                'currency': 'INR',
                'period': 'month',
                'features': [
                    'Unlimited trucks & drivers',
                    'Advanced route planner',
                    'Location autocomplete',
                    'Fleet map tracking',
                    'Analytics & reports',
                    'Priority support',
                    'Data export (CSV)',
                ]
            }
        ]
    })


# ─── ROUTES: DRIVERS ─────────────────────────────────────────────────────────

@app.route('/api/drivers', methods=['GET'])
@jwt_required()
def get_drivers():
    uid = int(get_jwt_identity())
    drivers = Driver.query.filter(
        (Driver.user_id == uid) | (Driver.user_id == None)
    ).all()
    return jsonify([d.to_dict() for d in drivers])


@app.route('/api/drivers', methods=['POST'])
@jwt_required()
def create_driver():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)

    # Free plan: max 10 drivers
    if user.package == 'free':
        count = Driver.query.filter_by(user_id=uid).count()
        if count >= 10:
            return jsonify({'msg': 'Free plan allows up to 10 drivers. Please upgrade to Premium.', 'upgrade_required': True}), 403

    data = request.json
    driver = Driver(
        user_id=uid,
        name=data['name'],
        phone=data['phone'],
        license_no=data['license_no'],
        license_expiry=date.fromisoformat(data['license_expiry']),
        address=data.get('address', ''),
        status='available'
    )
    db.session.add(driver)
    db.session.commit()
    return jsonify(driver.to_dict()), 201


@app.route('/api/drivers/<int:id>', methods=['PUT'])
@jwt_required()
def update_driver(id):
    driver = Driver.query.get_or_404(id)
    data = request.json
    for key in ['name', 'phone', 'license_no', 'address', 'status']:
        if key in data:
            setattr(driver, key, data[key])
    if 'license_expiry' in data:
        driver.license_expiry = date.fromisoformat(data['license_expiry'])
    db.session.commit()
    return jsonify(driver.to_dict())


@app.route('/api/drivers/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_driver(id):
    driver = Driver.query.get_or_404(id)
    db.session.delete(driver)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ─── ROUTES: TRUCKS ──────────────────────────────────────────────────────────

@app.route('/api/trucks', methods=['GET'])
@jwt_required()
def get_trucks():
    uid = int(get_jwt_identity())
    trucks = Truck.query.filter(
        (Truck.user_id == uid) | (Truck.user_id == None)
    ).all()
    return jsonify([t.to_dict() for t in trucks])


@app.route('/api/trucks', methods=['POST'])
@jwt_required()
def create_truck():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)

    # Free plan: max 5 trucks
    if user.package == 'free':
        count = Truck.query.filter_by(user_id=uid).count()
        if count >= 5:
            return jsonify({'msg': 'Free plan allows up to 5 trucks. Please upgrade to Premium.', 'upgrade_required': True}), 403

    data = request.json
    truck = Truck(
        user_id=uid,
        number_plate=data['number_plate'].upper(),
        model=data.get('model', ''),
        capacity_tons=data['capacity_tons'],
        fuel_type=data.get('fuel_type', 'diesel'),
        last_service=date.fromisoformat(data['last_service']) if data.get('last_service') else None,
        insurance_expiry=date.fromisoformat(data['insurance_expiry']) if data.get('insurance_expiry') else None,
        permit_expiry=date.fromisoformat(data['permit_expiry']) if data.get('permit_expiry') else None,
    )
    db.session.add(truck)
    db.session.commit()
    return jsonify(truck.to_dict()), 201


@app.route('/api/trucks/<int:id>', methods=['PUT'])
@jwt_required()
def update_truck(id):
    truck = Truck.query.get_or_404(id)
    data = request.json
    for key in ['model', 'capacity_tons', 'fuel_type', 'status']:
        if key in data:
            setattr(truck, key, data[key])
    for date_field in ['last_service', 'insurance_expiry', 'permit_expiry']:
        if date_field in data and data[date_field]:
            setattr(truck, date_field, date.fromisoformat(data[date_field]))
    db.session.commit()
    return jsonify(truck.to_dict())


@app.route('/api/trucks/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_truck(id):
    truck = Truck.query.get_or_404(id)
    db.session.delete(truck)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@app.route('/api/trucks/<int:id>/location', methods=['POST'])
@jwt_required()
def update_truck_location(id):
    Truck.query.get_or_404(id)
    data = request.json
    loc = TruckLocation(
        truck_id=id,
        trip_id=data.get('trip_id'),
        lat=data['lat'],
        lng=data['lng'],
        speed_kmh=data.get('speed_kmh', 0)
    )
    db.session.add(loc)
    db.session.commit()
    return jsonify(loc.to_dict()), 201


# ─── ROUTES: TRIPS ───────────────────────────────────────────────────────────

@app.route('/api/trips', methods=['GET'])
@jwt_required()
def get_trips():
    uid = int(get_jwt_identity())
    status = request.args.get('status')
    query = Trip.query.filter((Trip.user_id == uid) | (Trip.user_id == None))
    if status:
        query = query.filter_by(status=status)
    trips = query.order_by(Trip.created_at.desc()).all()
    return jsonify([t.to_dict() for t in trips])


@app.route('/api/trips', methods=['POST'])
@jwt_required()
def create_trip():
    uid = int(get_jwt_identity())
    data = request.json

    def float_or_none(val):
        if val is None or val == '':
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None

    trip = Trip(
        user_id=uid,
        truck_id=data['truck_id'],
        driver_id=data['driver_id'],
        origin=data['origin'],
        origin_lat=float_or_none(data.get('origin_lat')),
        origin_lng=float_or_none(data.get('origin_lng')),
        destination=data['destination'],
        dest_lat=float_or_none(data.get('dest_lat')),
        dest_lng=float_or_none(data.get('dest_lng')),
        material=data.get('material', ''),
        load_tons=data.get('load_tons'),
        status='scheduled',
        scheduled_date=datetime.fromisoformat(data['scheduled_date']) if data.get('scheduled_date') else datetime.utcnow(),
        distance_km=data.get('distance_km'),
        notes=data.get('notes', '')
    )
    truck = Truck.query.get(data['truck_id'])
    driver = Driver.query.get(data['driver_id'])
    if truck: truck.status = 'on_trip'
    if driver: driver.status = 'on_trip'
    db.session.add(trip)
    db.session.commit()
    return jsonify(trip.to_dict()), 201


@app.route('/api/trips/<int:id>', methods=['GET'])
@jwt_required()
def get_trip(id):
    trip = Trip.query.get_or_404(id)
    return jsonify(trip.to_dict())


@app.route('/api/trips/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_trip_status(id):
    trip = Trip.query.get_or_404(id)
    data = request.json
    trip.status = data['status']
    if data['status'] == 'in_progress' and not trip.start_time:
        trip.start_time = datetime.utcnow()
    if data['status'] == 'completed':
        trip.end_time = datetime.utcnow()
        truck = Truck.query.get(trip.truck_id)
        driver = Driver.query.get(trip.driver_id)
        if truck: truck.status = 'available'
        if driver: driver.status = 'available'
    db.session.commit()
    return jsonify(trip.to_dict())


@app.route('/api/trips/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_trip(id):
    trip = Trip.query.get_or_404(id)
    truck = Truck.query.get(trip.truck_id)
    driver = Driver.query.get(trip.driver_id)
    if truck and truck.status == 'on_trip': truck.status = 'available'
    if driver and driver.status == 'on_trip': driver.status = 'available'
    db.session.delete(trip)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ─── ROUTES: DASHBOARD ───────────────────────────────────────────────────────

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    uid = int(get_jwt_identity())
    total_trucks = Truck.query.filter((Truck.user_id == uid) | (Truck.user_id == None)).count()
    active_trucks = Truck.query.filter(
        ((Truck.user_id == uid) | (Truck.user_id == None)), Truck.status == 'on_trip'
    ).count()
    total_drivers = Driver.query.filter((Driver.user_id == uid) | (Driver.user_id == None)).count()
    active_drivers = Driver.query.filter(
        ((Driver.user_id == uid) | (Driver.user_id == None)), Driver.status == 'on_trip'
    ).count()
    total_trips = Trip.query.filter((Trip.user_id == uid) | (Trip.user_id == None)).count()
    active_trips = Trip.query.filter(
        ((Trip.user_id == uid) | (Trip.user_id == None)), Trip.status == 'in_progress'
    ).count()
    completed_trips = Trip.query.filter(
        ((Trip.user_id == uid) | (Trip.user_id == None)), Trip.status == 'completed'
    ).count()

    today = date.today()
    soon = today + timedelta(days=30)

    expiring_insurance = Truck.query.filter(
        (Truck.user_id == uid) | (Truck.user_id == None),
        Truck.insurance_expiry != None,
        Truck.insurance_expiry <= soon
    ).count()
    expiring_permits = Truck.query.filter(
        (Truck.user_id == uid) | (Truck.user_id == None),
        Truck.permit_expiry != None,
        Truck.permit_expiry <= soon
    ).count()
    expiring_licenses = Driver.query.filter(
        (Driver.user_id == uid) | (Driver.user_id == None),
        Driver.license_expiry != None,
        Driver.license_expiry <= soon
    ).count()

    recent_trips = Trip.query.filter(
        (Trip.user_id == uid) | (Trip.user_id == None)
    ).order_by(Trip.created_at.desc()).limit(5).all()

    return jsonify({
        'trucks': {'total': total_trucks, 'active': active_trucks},
        'drivers': {'total': total_drivers, 'active': active_drivers},
        'trips': {'total': total_trips, 'active': active_trips, 'completed': completed_trips},
        'alerts': {
            'expiring_insurance': expiring_insurance,
            'expiring_permits': expiring_permits,
            'expiring_licenses': expiring_licenses
        },
        'recent_trips': [t.to_dict() for t in recent_trips]
    })


# ─── ROUTES: LOCATION (Premium) ──────────────────────────────────────────────

@app.route('/api/fleet/locations', methods=['GET'])
@premium_required
def get_fleet_locations():
    uid = int(get_jwt_identity())
    trucks = Truck.query.filter(
        ((Truck.user_id == uid) | (Truck.user_id == None)), Truck.status == 'on_trip'
    ).all()
    result = []
    for truck in trucks:
        loc = TruckLocation.query.filter_by(truck_id=truck.id).order_by(TruckLocation.timestamp.desc()).first()
        if loc:
            result.append({
                'truck_id': truck.id,
                'number_plate': truck.number_plate,
                'lat': loc.lat, 'lng': loc.lng,
                'speed_kmh': loc.speed_kmh,
                'timestamp': loc.timestamp.isoformat()
            })
    return jsonify(result)


# ─── SEED DATA ───────────────────────────────────────────────────────────────

@app.route('/api/seed', methods=['POST'])
@jwt_required()
def seed_data():
    uid = int(get_jwt_identity())
    drivers_data = [
        dict(name='Ramesh Kumar', phone='9876543210', license_no='HR26-20180012345',
             license_expiry=date(2026, 8, 15), address='Rohtak, Haryana'),
        dict(name='Suresh Yadav', phone='9812345678', license_no='UP14-20190056789',
             license_expiry=date(2025, 3, 20), address='Meerut, UP'),
        dict(name='Mahesh Singh', phone='9898989898', license_no='RJ14-20170034567',
             license_expiry=date(2027, 1, 10), address='Jaipur, Rajasthan'),
    ]
    for d in drivers_data:
        if not Driver.query.filter_by(phone=d['phone']).first():
            db.session.add(Driver(user_id=uid, **d, status='available'))

    trucks_data = [
        dict(number_plate='HR26CA1234', model='Tata 2518', capacity_tons=15,
             last_service=date(2024, 11, 1), insurance_expiry=date(2025, 6, 30), permit_expiry=date(2025, 4, 15)),
        dict(number_plate='UP14BT5678', model='Ashok Leyland 2523', capacity_tons=20,
             last_service=date(2024, 10, 15), insurance_expiry=date(2026, 2, 28), permit_expiry=date(2025, 9, 30)),
        dict(number_plate='RJ14GH9012', model='Eicher Pro 6031', capacity_tons=12,
             last_service=date(2025, 1, 20), insurance_expiry=date(2025, 5, 10), permit_expiry=date(2026, 3, 1)),
    ]
    for t in trucks_data:
        if not Truck.query.filter_by(number_plate=t['number_plate']).first():
            db.session.add(Truck(user_id=uid, **t, status='available'))

    db.session.commit()
    return jsonify({'message': 'Sample data added!'})


# ─── HEALTH CHECK ────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'version': '2.0.0'})


# ─── INIT ────────────────────────────────────────────────────────────────────

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
