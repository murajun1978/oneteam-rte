import React, { Component, PropTypes } from 'react';
import { Editor, EditorState, Entity, Modifier, RichUtils, KeyBindingUtil } from 'draft-js';
import { BLOCK_TYPES, ENTITY_TYPES, LIST_BLOCK_TYPES, MAX_LIST_DEPTH, OLD_BLOCK_TYPES } from 'oneteam-rte-utils';
import isFunction from 'lodash/isFunction';
import classNames from 'classnames';
import CheckableListItem from './blocks/CheckableListItem';
import AtomicImage from './blocks/AtomicImage';
import AtomicIFrame from './blocks/AtomicIFrame';
import DownloadLink from './blocks/DownloadLink';
import {
  insertBlockAfter, removeBlockStyle, adjustBlockDepth, insertText, insertWebCards,
  splitBlockInContentStateIfCursorAtStart
} from './functions';
import { isListItem, isCursorAtEnd, isCursorAtStart, getCurrentBlock } from './utils';
import URL_REGEX from './helpers/urlRegex';

const { navigator } = global;
const userAgent = navigator ? navigator.userAgent : null;

export default class Body extends Component {
  static propTypes = {
    editorState: PropTypes.instanceOf(EditorState),
    checkedState: PropTypes.objectOf(PropTypes.bool),
    changeEditorState: PropTypes.func,
    changeCheckedState: PropTypes.func,
    closeInsertLinkInput: PropTypes.func,

    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    className: PropTypes.string,
    customStyleMap: PropTypes.objectOf(PropTypes.object),
    blockRendererFn: PropTypes.func,
    blockStyleFn: PropTypes.func,
    onEnterKeyDownWithCommand: PropTypes.func,
    onPastedFiles: PropTypes.func,
    customAtomicBlockRendererFn: PropTypes.func
  }
  static defaultProps = {
    placeholder: 'Contents here...',
    readOnly: false,
    customStyleMap: {}
  }
  handleBlur = () => {
    // Not changed state if do not do this
    setTimeout(() => {
      const newEditorState = this._insertWebCardsIfNeeded();
      if (newEditorState) {
        this._changeEditorState(newEditorState);
      }
    }, 0);
    return false;
  }
  handlePastedText = text => {
    const urls = text.match(URL_REGEX);
    if (urls) {
      // Not changed state if do not do this
      setTimeout(() => {
        this._changeEditorState(insertWebCards(this.props.editorState, urls));
      }, 0);
    }
    return false;
  }
  handleClickWrapper = ev => {
    // FIXME ;(   does not respond check box in the Safari or Firefox
    if (this._shouldUnfocusAfterClicking(ev)) {
      this.blur();
      setTimeout(() => this.focus(), 100);
    }
  }
  handleMouseDownWrapper = () => {
    if (isFunction(this.props.closeInsertLinkInput)) {
      this.props.closeInsertLinkInput();
    }
  }
  handleKeyCommand = command => { // eslint-disable-line complexity
    const { editorState } = this.props;
    if (command === 'backspace') {
      const contentState = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      const currentBlock = contentState.getBlockForKey(selection.getStartKey());
      const currentBlockType = currentBlock.getType();
      const blockLength = currentBlock.getLength();

      if (LIST_BLOCK_TYPES.some(t => t === currentBlockType) && blockLength === 0) {
        const newEditorState = currentBlock.getDepth() === 0 ?
          removeBlockStyle(editorState) :
          adjustBlockDepth(
            editorState,
            contentState,
            selection,
            -1,
            MAX_LIST_DEPTH
          );
        if (newEditorState) {
          this._changeEditorState(newEditorState);
          return true;
        }
      }

      const firstBlockKey = contentState.getBlockMap().first().getKey();
      if (blockLength === 0 && currentBlock.getKey() === firstBlockKey) {
        const newEditorState = removeBlockStyle(editorState);
        if (newEditorState) {
          this._changeEditorState(newEditorState);
          return true;
        }
      }
    }

    const newEditorState = RichUtils.handleKeyCommand(editorState, command);
    if (newEditorState) {
      this._changeEditorState(newEditorState);
      return true;
    }
    return false;
  }
  handlePastedFiles = files => {
    if (isFunction(this.props.onPastedFiles)) {
      this.props.onPastedFiles(files);
      return true;
    }
    return false;
  }
  handleReturn = ev => {
    if (this._handleReturnSubmit(ev)) {
      return true;
    }

    if (this._handleReturnSpecialBlock()) {
      return true;
    }

    if (this._handleReturnListItem()) {
      return true;
    }

    if (this._handleReturnInsertWebCard()) {
      return true;
    }

    if (this._handleReturnSplitBlockIfCursorAtStart()) {
      return true;
    }

    return false;
  }
  handleTab = ev => {
    if (this._insertIndent(ev)) {
      return true;
    }
    const { editorState } = this.props;
    const newEditorState = RichUtils.onTab(ev, editorState, MAX_LIST_DEPTH);
    if (newEditorState !== editorState) {
      this._changeEditorState(newEditorState);
    }
  }
  blockRendererFn = block => {
    if (this._shouldRenderAtomicBlock(block)) {
      return this._atomicBlockRenderer(block);
    }

    if (this._shouldRenderCheckableListItem(block)) {
      return this._checkableListItemRenderer(block);
    }

    if (isFunction(this.props.blockRendererFn)) {
      return this.props.blockRendererFn(block);
    }

    return null;
  }
  blockStyleFn = block => {
    if (isFunction(this.props.blockStyleFn)) {
      return this.props.blockStyleFn(block);
    }
    const type = block.getType();
    switch (type) {
    case BLOCK_TYPES.CHECKABLE_LIST_ITEM:
    case OLD_BLOCK_TYPES.ALIGN_CENTER:
    case OLD_BLOCK_TYPES.ALIGN_RIGHT:
    case OLD_BLOCK_TYPES.ALIGN_JUSTIFY:
      return type;
    default:
      return '';
    }
  }
  handleChangeEditor = editorState => this._changeEditorState(editorState);

  constructor(props) {
    super(props);
    this.focus = () => this.refs.editor.focus();
    this.blur = () => this.refs.editor.blur();
  }
  render() {
    return (
      <div
        className={classNames('rich-text-editor-body', {
          'RichEditor-hidePlaceholder': this._shouldHidePlaceholder()
        }, this.props.className)} onClick={this.handleClickWrapper} onMouseDown={this.handleMouseDownWrapper}>
        <Editor
          ref='editor'
          blockRendererFn={this.blockRendererFn}
          blockStyleFn={this.blockStyleFn}
          editorState={this.props.editorState}
          readOnly={this.props.readOnly}
          handleKeyCommand={this.handleKeyCommand}
          handlePastedFiles={this.handlePastedFiles}
          handlePastedText={this.handlePastedText}
          handleReturn={this.handleReturn}
          onChange={this.handleChangeEditor}
          onTab={this.handleTab}
          onBlur={this.handleBlur}
          placeholder={this.props.placeholder}
          customStyleMap={this.props.customStyleMap} />
      </div>
    );
  }
  _shouldUnfocusAfterClicking(ev) {
    return /applewebkit|safari|firefox/i.test(userAgent) &&
      ev.target.nodeName.toLowerCase() === 'input' &&
      ev.target.type === 'checkbox';
  }
  _shouldHidePlaceholder() {
    const contentState = this.props.editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== BLOCK_TYPES.UNSTYLED) {
        return true;
      }
    }
    return false;
  }
  _shouldRenderAtomicBlock(block) {
    return block.getType() === BLOCK_TYPES.ATOMIC && block.getEntityAt(0);
  }
  _shouldRenderCheckableListItem(block) {
    return block.getType() === BLOCK_TYPES.CHECKABLE_LIST_ITEM;
  }
  _atomicBlockRenderer(block) {
    const entity = Entity.get(block.getEntityAt(0));
    const type = entity.getType();
    const data = entity.getData();

    switch (type) {
    case ENTITY_TYPES.IMAGE:
      return {
        component: AtomicImage,
        props: { src: data.src, alt: data.alt },
        editable: false
      };
    case ENTITY_TYPES.DOWNLOAD_LINK:
      return {
        component: DownloadLink,
        props: data,
        editable: true
      };
    case ENTITY_TYPES.IFRAME:
      return {
        component: AtomicIFrame,
        props: data,
        editable: false
      };
    default:
      if (isFunction(this.props.customAtomicBlockRendererFn)) {
        return this.props.customAtomicBlockRendererFn(entity, block);
      }
      return null;
    }
  }
  _checkableListItemRenderer(block) {
    const blockKey = block.getKey();
    const { checkedState } = this.props;
    return {
      component: CheckableListItem,
      props: {
        checked: !!checkedState[blockKey],
        onChangeChecked: checked => {
          const newCheckedState = { ...checkedState, [blockKey]: checked };
          this._changeCheckedState(newCheckedState);
        }
      }
    };
  }
  _insertIndent(ev) {
    const { editorState } = this.props;
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const blockKey = selection.getStartKey();
    const block = content.getBlockForKey(blockKey);

    if (!isListItem(block)) {
      ev.preventDefault();
      const newEditorState = insertText(editorState, '    ');
      if (newEditorState !== editorState) {
        this._changeEditorState(newEditorState);
        return true;
      }
    }
    return false;
  }
  _insertWebCardsIfNeeded() {
    const { editorState } = this.props;
    const selection = editorState.getSelection();
    const block = getCurrentBlock(editorState);
    const webcardRendered = block.getData().get('webcardRendered');
    const urls = block.getText().match(URL_REGEX);
    if (!webcardRendered && urls && isCursorAtEnd(block, selection)) {
      const content = editorState.getCurrentContent();
      const newContent = Modifier.setBlockData(content, selection, { webcardRendered: true });
      return insertWebCards(EditorState.push(editorState, newContent, 'change-block-data'), urls);
    }
    return null;
  }
  _handleReturnInsertWebCard() {
    const newEditorState = this._insertWebCardsIfNeeded();
    if (newEditorState) {
      this._changeEditorState(newEditorState);
      return true;
    }
    return false;
  }
  _handleReturnListItem() {
    const { editorState } = this.props;
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(selection.getStartKey());

    if (isListItem(block)) {
      const key = selection.getAnchorKey();
      if(key !== selection.getFocusKey()) {
        return false;
      }

      const block = content.getBlockForKey(key);

      if (block.getLength() === 0) {
        if (block.getDepth() === 0) {
          const newEditorState = removeBlockStyle(editorState);
          if (newEditorState) {
            this._changeEditorState(newEditorState);
            return true;
          }
        } else {
          const newEditorState = adjustBlockDepth(
            editorState,
            content,
            selection,
            -1,
            MAX_LIST_DEPTH
          );
          if (newEditorState) {
            this._changeEditorState(newEditorState);
            return true;
          }
        }
      }
    }
    return false;
  }
  _handleReturnSubmit(ev) {
    if (isFunction(this.props.onEnterKeyDownWithCommand) && KeyBindingUtil.hasCommandModifier(ev)) {
      this.props.onEnterKeyDownWithCommand(ev);
      return true;
    }
    return false;
  }
  _handleReturnSpecialBlock() {
    const { editorState } = this.props;
    const selection = editorState.getSelection();
    if (selection.isCollapsed()) {
      const contentState = editorState.getCurrentContent();
      const blockKey = selection.getStartKey();
      const block = contentState.getBlockForKey(blockKey);
      if (!isListItem(block) && block.getType() !== BLOCK_TYPES.UNSTYLED) {
        if (isCursorAtEnd(block, selection)) {
          const newEditorState = insertBlockAfter(
            editorState,
            blockKey,
            BLOCK_TYPES.UNSTYLED
          );
          this._changeEditorState(newEditorState);
          return true;
        }
      }
    }
    return false;
  }
  _handleReturnSplitBlockIfCursorAtStart() {
    const { editorState } = this.props;
    const selectionState = editorState.getSelection();
    if (!selectionState.isCollapsed() || !isCursorAtStart(selectionState)) {
      return false;
    }
    this._changeEditorState(splitBlockInContentStateIfCursorAtStart(editorState));
    return true;
  }
  _changeEditorState(editorState) {
    if (isFunction(this.props.changeEditorState)) {
      this.props.changeEditorState(editorState);
    }
  }
  _changeCheckedState(checkedState) {
    if (isFunction(this.props.changeCheckedState)) {
      this.props.changeCheckedState(checkedState);
    }
  }
}
