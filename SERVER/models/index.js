const User = require('./User');
const Reservable = require('./Reservable');
const ReservableCollection = require('./ReservableCollection');
const Constraint = require('./Constraint');
const Validator = require('./Validator');
const Reservation = require('./Reservation');

// Define relationships between models
User.hasMany(Reservable, { foreignKey: 'user_id' });
Reservable.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Reservation, { foreignKey: 'user_id' });
Reservation.belongsTo(User, { foreignKey: 'user_id' });

Reservable.hasMany(Constraint, { foreignKey: 'reservable_id' });
Constraint.belongsTo(Reservable, { foreignKey: 'reservable_id' });

Reservable.hasMany(Validator, { foreignKey: 'reservable_id' });
Validator.belongsTo(Reservable, { foreignKey: 'reservable_id' });

Reservable.hasMany(Reservation, { foreignKey: 'reservable_id' });
Reservation.belongsTo(Reservable, { foreignKey: 'reservable_id' });

// Define many-to-many relationship for reservable collections
Reservable.belongsToMany(Reservable, { 
  through: ReservableCollection,
  as: 'Children',
  foreignKey: 'parent_id',
  otherKey: 'child_id'
});

Reservable.belongsToMany(Reservable, { 
  through: ReservableCollection,
  as: 'Parents',
  foreignKey: 'child_id',
  otherKey: 'parent_id'
});

module.exports = {
  User,
  Reservable,
  ReservableCollection,
  Constraint,
  Validator,
  Reservation
}; 