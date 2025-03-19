const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Constraint = sequelize.define('Constraint', {
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('date', 'time', 'integer', 'string', 'boolean', 'email', 'phone'),
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
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
  tableName: 'constraints',
  timestamps: false
});

module.exports = Constraint; 