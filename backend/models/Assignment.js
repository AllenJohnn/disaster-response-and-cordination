const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const EmergencyRequest = require('./EmergencyRequest');
const User = require('./User'); // Responders are users with the role 'Responder'

const Assignment = sequelize.define('Assignment', {
  department: { 
    type: DataTypes.ENUM('Police', 'Fire Force', 'Paramedic', 'Disaster Response', 'Volunteer'), 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM('Assigned', 'Accepted', 'Completed'), 
    defaultValue: 'Assigned' 
  },
  assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  completed_at: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'assignments',
  timestamps: false
});

EmergencyRequest.hasMany(Assignment, { foreignKey: 'request_id', onDelete: 'CASCADE' });
Assignment.belongsTo(EmergencyRequest, { foreignKey: 'request_id' });

User.hasMany(Assignment, { foreignKey: 'responder_id', onDelete: 'CASCADE' });
Assignment.belongsTo(User, { foreignKey: 'responder_id' });

module.exports = Assignment;