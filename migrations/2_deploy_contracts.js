const ETBToken = artifacts.require("ETBToken");

module.exports = function (deployer) {
  deployer.deploy(ETBToken);
};
