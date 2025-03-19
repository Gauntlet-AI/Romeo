const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReservableCollection = sequelize.define('ReservableCollection', {
  parent_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'reservables',
      key: 'id'
    }
  },
  child_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'reservables',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'reservable_collections',
  timestamps: false,
  indexes: [
    {
      fields: ['parent_id', 'child_id'],
      unique: true
    }
  ]
});

module.exports = ReservableCollection; 