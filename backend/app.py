from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, date
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///trucklogs.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
CORS(app)

db = SQLAlchemy(app)

# ─── MODELS ───────────────────────────────────────────────────────────────────

class Driver(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    license_no = db.Column(db.String(50), nullable=False)
    license_expiry = db.Column(db.Date, nullable=False)
    address = db.Column(db.String(200))
    status = db.Column(db.String(20), default='available')  # available, on_trip, off_duty
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
    number_plate = db.Column(db.String(20), nullable=False, unique=True)
    model = db.Column(db.String(100))
    capacity_tons = db.Column(db.Float, nullable=False)
    fuel_type = db.Column(db.String(20), default='diesel')
    status = db.Column(db.String(20), default='available')  # available, on_trip, maintenance
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
    truck_id = db.Column(db.Integer, db.ForeignKey('truck.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)
    origin = db.Column(db.String(200), nullable=False)
    origin_lat = db.Column(db.Float)
    origin_lng = db.Column(db.Float)
    destination = db.Column(db.String(200), nullable=False)
    dest_lat = db.Column(db.Float)
    dest_lng = db.Column(db.Float)
    material = db.Column(db.String(100))  # sand, gitti, etc.
    load_tons = db.Column(db.Float)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, in_progress, completed, cancelled
    scheduled_date = db.Column(db.DateTime)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    distance_km = db.Column(db.Float)
    route_polyline = db.Column(db.Text)  # encoded polyline
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

# ─── ROUTES: DRIVERS ──────────────────────────────────────────────────────────

@app.route('/api/drivers', methods=['GET'])
def get_drivers():
    drivers = Driver.query.all()
    return jsonify([d.to_dict() for d in drivers])

@app.route('/api/drivers', methods=['POST'])
def create_driver():
    data = request.json
    driver = Driver(
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
def delete_driver(id):
    driver = Driver.query.get_or_404(id)
    db.session.delete(driver)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

# ─── ROUTES: TRUCKS ───────────────────────────────────────────────────────────

@app.route('/api/trucks', methods=['GET'])
def get_trucks():
    trucks = Truck.query.all()
    return jsonify([t.to_dict() for t in trucks])

@app.route('/api/trucks', methods=['POST'])
def create_truck():
    data = request.json
    truck = Truck(
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
def delete_truck(id):
    truck = Truck.query.get_or_404(id)
    db.session.delete(truck)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

@app.route('/api/trucks/<int:id>/location', methods=['POST'])
def update_truck_location(id):
    truck = Truck.query.get_or_404(id)
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

# ─── ROUTES: TRIPS ────────────────────────────────────────────────────────────

@app.route('/api/trips', methods=['GET'])
def get_trips():
    status = request.args.get('status')
    if status:
        trips = Trip.query.filter_by(status=status).order_by(Trip.created_at.desc()).all()
    else:
        trips = Trip.query.order_by(Trip.created_at.desc()).all()
    return jsonify([t.to_dict() for t in trips])

@app.route('/api/trips', methods=['POST'])
def create_trip():
    data = request.json
    trip = Trip(
        truck_id=data['truck_id'],
        driver_id=data['driver_id'],
        origin=data['origin'],
        origin_lat=data.get('origin_lat'),
        origin_lng=data.get('origin_lng'),
        destination=data['destination'],
        dest_lat=data.get('dest_lat'),
        dest_lng=data.get('dest_lng'),
        material=data.get('material', ''),
        load_tons=data.get('load_tons'),
        status='scheduled',
        scheduled_date=datetime.fromisoformat(data['scheduled_date']) if data.get('scheduled_date') else datetime.utcnow(),
        distance_km=data.get('distance_km'),
        notes=data.get('notes', '')
    )
    # Update truck & driver status
    truck = Truck.query.get(data['truck_id'])
    driver = Driver.query.get(data['driver_id'])
    if truck: truck.status = 'on_trip'
    if driver: driver.status = 'on_trip'
    db.session.add(trip)
    db.session.commit()
    return jsonify(trip.to_dict()), 201

@app.route('/api/trips/<int:id>', methods=['GET'])
def get_trip(id):
    trip = Trip.query.get_or_404(id)
    return jsonify(trip.to_dict())

@app.route('/api/trips/<int:id>/status', methods=['PUT'])
def update_trip_status(id):
    trip = Trip.query.get_or_404(id)
    data = request.json
    old_status = trip.status
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
def delete_trip(id):
    trip = Trip.query.get_or_404(id)
    # Free up truck and driver
    truck = Truck.query.get(trip.truck_id)
    driver = Driver.query.get(trip.driver_id)
    if truck and truck.status == 'on_trip': truck.status = 'available'
    if driver and driver.status == 'on_trip': driver.status = 'available'
    db.session.delete(trip)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

# ─── ROUTES: DASHBOARD STATS ──────────────────────────────────────────────────

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    total_trucks = Truck.query.count()
    active_trucks = Truck.query.filter_by(status='on_trip').count()
    total_drivers = Driver.query.count()
    active_drivers = Driver.query.filter_by(status='on_trip').count()
    total_trips = Trip.query.count()
    active_trips = Trip.query.filter_by(status='in_progress').count()
    completed_trips = Trip.query.filter_by(status='completed').count()

    # Expiry alerts
    today = date.today()
    from datetime import timedelta
    soon = today + timedelta(days=30)
    expiring_insurance = Truck.query.filter(
        Truck.insurance_expiry != None,
        Truck.insurance_expiry <= soon
    ).count()
    expiring_permits = Truck.query.filter(
        Truck.permit_expiry != None,
        Truck.permit_expiry <= soon
    ).count()
    expiring_licenses = Driver.query.filter(
        Driver.license_expiry != None,
        Driver.license_expiry <= soon
    ).count()

    # Recent trips
    recent_trips = Trip.query.order_by(Trip.created_at.desc()).limit(5).all()

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

# ─── ROUTES: LOCATION TRACKING ────────────────────────────────────────────────

@app.route('/api/fleet/locations', methods=['GET'])
def get_fleet_locations():
    trucks = Truck.query.filter_by(status='on_trip').all()
    result = []
    for truck in trucks:
        loc = TruckLocation.query.filter_by(truck_id=truck.id).order_by(TruckLocation.timestamp.desc()).first()
        if loc:
            result.append({
                'truck_id': truck.id,
                'number_plate': truck.number_plate,
                'lat': loc.lat,
                'lng': loc.lng,
                'speed_kmh': loc.speed_kmh,
                'timestamp': loc.timestamp.isoformat()
            })
    return jsonify(result)

# ─── SEED DATA ────────────────────────────────────────────────────────────────

@app.route('/api/seed', methods=['POST'])
def seed_data():
    # Sample drivers
    drivers = [
        Driver(name='Ramesh Kumar', phone='9876543210', license_no='HR26-20180012345',
               license_expiry=date(2026, 8, 15), address='Rohtak, Haryana', status='available'),
        Driver(name='Suresh Yadav', phone='9812345678', license_no='UP14-20190056789',
               license_expiry=date(2025, 3, 20), address='Meerut, UP', status='available'),
        Driver(name='Mahesh Singh', phone='9898989898', license_no='RJ14-20170034567',
               license_expiry=date(2027, 1, 10), address='Jaipur, Rajasthan', status='available'),
    ]
    for d in drivers:
        existing = Driver.query.filter_by(phone=d.phone).first()
        if not existing:
            db.session.add(d)

    # Sample trucks
    trucks = [
        Truck(number_plate='HR26CA1234', model='Tata 2518', capacity_tons=15,
              last_service=date(2024, 11, 1), insurance_expiry=date(2025, 6, 30),
              permit_expiry=date(2025, 4, 15), status='available'),
        Truck(number_plate='UP14BT5678', model='Ashok Leyland 2523', capacity_tons=20,
              last_service=date(2024, 10, 15), insurance_expiry=date(2026, 2, 28),
              permit_expiry=date(2025, 9, 30), status='available'),
        Truck(number_plate='RJ14GH9012', model='Eicher Pro 6031', capacity_tons=12,
              last_service=date(2025, 1, 20), insurance_expiry=date(2025, 5, 10),
              permit_expiry=date(2026, 3, 1), status='available'),
    ]
    for t in trucks:
        existing = Truck.query.filter_by(number_plate=t.number_plate).first()
        if not existing:
            db.session.add(t)

    db.session.commit()
    return jsonify({'message': 'Sample data added!'})

# ─── INIT ─────────────────────────────────────────────────────────────────────

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
