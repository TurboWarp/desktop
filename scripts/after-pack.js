const fuses = require('./flip-fuses');

exports.default = async (context) => {
  await fuses.applyProduction();
};
