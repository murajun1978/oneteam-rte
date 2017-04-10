import merge from 'lodash/merge';
import emojione from 'emojione';
import createOneteamRTEPlugin from 'draft-js-oneteam-rte-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import createBlockBreakoutPlugin from 'draft-js-block-breakout-plugin';
import createMarkdownShortcutsPlugin from 'draft-js-markdown-shortcuts-plugin';
import createCheckableListPlugin from 'draft-js-checkable-list-plugin';
import createEmojiPlugin from 'draft-js-emoji-plugin';
import prismPlugin from './prism';

const defaultConfig = {
  oneteamRTE: {},
  blockBreakout: {
    breakoutBlocks: [
      'header-one', 'header-two', 'header-three', 'header-four', 'header-five', 'header-six'
    ]
  },
  markdownShortcuts: {},
  checkableList: { sameWrapperAsUnorderedListItem: true },
  linkifyPlugin: {},
  emojiPlugin: {
    priorityList: Object.keys(emojione.emojioneList).reduce((ret, key) => ({
      ...ret,
      [key]: emojione.emojioneList[key].unicode
    }), {})
  }
};

const createPlugins = (configs) => {
  const config = merge({}, defaultConfig, configs);
  const oneteamRTEPlugin = createOneteamRTEPlugin(config.oneteamRTE);
  const blockBreakoutPlugin = createBlockBreakoutPlugin(config.blockBreakout);
  const markdownShortcutsPlugin = createMarkdownShortcutsPlugin(config.markdownShortcuts);
  const checkableListPlugin = createCheckableListPlugin(config.checkableList);
  const linkifyPlugin = createLinkifyPlugin(config.linkifyPlugin);
  const emojiPlugin = createEmojiPlugin(config.emojiPlugin);

  // TODO: It becomes a block when pasting html containing `<code>`
  // https://github.com/ngs/draft-js-markdown-shortcuts-plugin/blob/28c6479ec137146a1bf8dedac6fae42c651fcf43/src/index.js#L24
  // I think that should be corrected like this
  // `blockRenderMap: checkboxBlockRenderMap`
  delete markdownShortcutsPlugin.blockRenderMap;

  return {
    all: [
      oneteamRTEPlugin,
      blockBreakoutPlugin,
      markdownShortcutsPlugin,
      checkableListPlugin,
      linkifyPlugin,
      prismPlugin,
      emojiPlugin
    ],
    oneteamRTEPlugin,
    emojiPlugin
  };
}

export default createPlugins;
