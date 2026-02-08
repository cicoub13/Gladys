module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add mode column with default 'parallel'
    await queryInterface.addColumn('t_scene', 'mode', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'parallel', // Maintains exact current behavior
    });

    // Add max_parallel column
    await queryInterface.addColumn('t_scene', 'max_parallel', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 10,
    });

    // Explicitly set all existing scenes to 'parallel' mode
    // This ensures they continue working exactly as before
    await queryInterface.sequelize.query("UPDATE t_scene SET mode = 'parallel', max_parallel = 10");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('t_scene', 'mode');
    await queryInterface.removeColumn('t_scene', 'max_parallel');
  },
};
