import { EditorState, SelectionState } from 'draft-js';

export default function moveSelectionToEnd(editorState) {
  const blockMap = editorState.getCurrentContent().getBlockMap();
  const key = blockMap.last().getKey();
  const length = blockMap.last().getLength();
  const selection = new SelectionState({
    anchorKey: key,
    anchorOffset: length,
    focusKey: key,
    focusOffset: length
  });
  return EditorState.acceptSelection(editorState, selection);
}
