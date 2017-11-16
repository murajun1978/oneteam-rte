'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Divider;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Divider(props) {
  return _react2.default.createElement('span', { className: (0, _classnames2.default)('rich-text-editor-toolbar-divider', props.className) });
}

Divider.propTypes = {
  className: _propTypes2.default.string
};