var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FormControl from 'react-bootstrap/lib/FormControl';
import Button from 'react-bootstrap/lib/Button';
import { EditorState } from 'draft-js';
import BaseButton from './BaseButton';
import toggleLink from '../functions/toggleLink';
import classnames from 'classnames';

var InsertLink = function (_Component) {
  _inherits(InsertLink, _Component);

  _createClass(InsertLink, null, [{
    key: 'propTypes',
    get: function get() {
      return {
        editorState: PropTypes.instanceOf(EditorState).isRequired,
        onInsertLink: PropTypes.func.isRequired,
        className: PropTypes.string,
        iconClassName: PropTypes.string,
        placeholder: PropTypes.string,
        validationErrorMessage: PropTypes.string,
        children: PropTypes.node,
        buttonText: PropTypes.string,
        isOpen: PropTypes.bool,
        onMouseDownToggle: PropTypes.func.isRequired
      };
    }
  }, {
    key: 'defaultProps',
    get: function get() {
      return {
        className: '',
        iconClassName: '',
        placeholder: 'Enter a URL...',
        validationErrorMessage: 'Please enter a valid URL.',
        buttonText: '✔',
        isOpen: false
      };
    }
  }]);

  function InsertLink(props) {
    _classCallCheck(this, InsertLink);

    var _this = _possibleConstructorReturn(this, (InsertLink.__proto__ || Object.getPrototypeOf(InsertLink)).call(this, props));

    _this.state = { value: '', validValue: true };

    _this.handleChangeValue = function (_ref) {
      var target = _ref.target;
      return _this.setState({ value: target.value });
    };
    _this.handleClickButton = function (ev) {
      return _this._handleClickButton(ev);
    };
    return _this;
  }

  _createClass(InsertLink, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          className = _props.className,
          children = _props.children,
          isOpen = _props.isOpen,
          onMouseDownToggle = _props.onMouseDownToggle,
          placeholder = _props.placeholder,
          buttonText = _props.buttonText,
          validationErrorMessage = _props.validationErrorMessage;

      return React.createElement(
        'span',
        { className: classnames('rich-text-editor-toolbar-button-insert-link', className) },
        React.createElement(
          BaseButton,
          { className: this.props.iconClassName, onMouseDown: onMouseDownToggle },
          children
        ),
        React.createElement(
          'div',
          { className: classnames('rich-text-editor-toolbar-button-insert-link-input', {
              'is-show': isOpen
            }) },
          React.createElement(FormControl, {
            type: 'text',
            pattern: '^https?:\\/\\/.+',
            placeholder: placeholder,
            value: this.state.value,
            onChange: this.handleChangeValue }),
          React.createElement(
            Button,
            { onClick: this.handleClickButton },
            buttonText
          ),
          React.createElement(
            'span',
            { className: classnames('insert-link-error-message', {
                'is-show': !this.state.validValue
              }) },
            validationErrorMessage
          )
        )
      );
    }
  }, {
    key: 'close',
    value: function close() {
      this.setState({ isOpen: false });
    }
  }, {
    key: '_handleClickButton',
    value: function _handleClickButton(ev) {
      var _this2 = this;

      ev.preventDefault();
      if (this._isValidValue()) {
        var value = this._hasHTTPProtocol(this.state.value) ? this.state.value : this._addHTTPProtocol(this.state.value);
        var newEditorState = toggleLink(this.props.editorState, value);
        this.props.onInsertLink(newEditorState);
        this.setState({ value: '', isOpen: false });
      } else {
        this.setState({ validValue: false }, function () {
          setTimeout(function () {
            return _this2.setState({ validValue: true });
          }, 2000);
        });
      }
    }
  }, {
    key: '_isValidValue',
    value: function _isValidValue() {
      return this.state.value !== '';
    }
  }, {
    key: '_hasHTTPProtocol',
    value: function _hasHTTPProtocol(value) {
      return (/^https?:\/\/.+/.test(value)
      );
    }
  }, {
    key: '_addHTTPProtocol',
    value: function _addHTTPProtocol(value) {
      return 'http://' + value;
    }
  }]);

  return InsertLink;
}(Component);

export default InsertLink;