const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const EmergencyRequest = require('./EmergencyRequest');

const EmergencyAnalysis = sequelize.define('EmergencyAnalysis', {
  priority: { type: DataTypes.ENUM('Critical', 'High', 'Medium', 'Low'), allowNull: false },
  severity: { type: DataTypes.ENUM('High', 'Medium', 'Low'), allowNull: false },
  confidence: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  requires_human_review: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'emergency_analysis',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

EmergencyRequest.hasOne(EmergencyAnalysis, { foreignKey: 'request_id', onDelete: 'CASCADE' });
EmergencyAnalysis.belongsTo(EmergencyRequest, { foreignKey: 'request_id' });

module.exports = EmergencyAnalysis;