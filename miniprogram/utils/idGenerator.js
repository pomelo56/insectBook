// utils/idGenerator.js
const crypto = require('crypto');

/**
 * 生成昆虫外部ID
 * @returns {string} 格式为insect_<uuid>的ID
 */
function generateInsectExternalId() {
  return `insect_${crypto.randomUUID()}`;
}

/**
 * 验证昆虫外部ID格式
 * @param {string} id - 要验证的ID
 * @returns {boolean} 是否为有效的昆虫外部ID
 */
function isValidInsectExternalId(id) {
  return /^insect_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

module.exports = {
  generateInsectExternalId,
  isValidInsectExternalId
};