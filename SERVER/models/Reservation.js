const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reservable_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'reservables',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  start_time_standard: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time_standard: {
    type: DataTypes.DATE,
    allowNull: false
  },
  start_time_iso8601: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  end_time_iso8601: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'reservations',
  timestamps: false
});

module.exports = Reservation; 