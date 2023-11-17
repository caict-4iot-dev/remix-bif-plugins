import { EditorUIProps, monacoTypes } from '@remix-ui/editor';
const controller = new AbortController();
const { signal } = controller;
const result: string = ''

export class RemixInLineCompletionProvider implements monacoTypes.languages.InlineCompletionsProvider {
  props: EditorUIProps
  monaco: any
  constructor(props: any, monaco: any) {
    this.props = props
    this.monaco = monaco    
  }

  async provideInlineCompletions(model: monacoTypes.editor.ITextModel, position: monacoTypes.Position, context: monacoTypes.languages.InlineCompletionContext, token: monacoTypes.CancellationToken): Promise<monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>> {
    if (context.selectedSuggestionInfo) {
    	console.log('return empty from provideInlineCompletions')
      return;
    }
    // get text before the position of the completion
    const word = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    if (!word.endsWith(' ') && !word.endsWith('\n') && !word.endsWith(';') && !word.endsWith('.')) {
      console.log('not a trigger char')
      return;
    }

    // abort if there is a signal
    if (token.isCancellationRequested) {
      console.log('aborted')
      return
    }

    let result
    try {
      result = await this.props.plugin.call('copilot-suggestion', 'suggest', word)
    } catch (err) { 
      return
    }
    
    const generatedText = (result as any).output[0].generated_text as string
    // the generated text remove a space from the context. that why we need to remove all the spaces
    const clean = generatedText.replace(/ /g, '').replace(word.replace(/ /g, ''), '')
    console.log('suggest result', clean)
    const item: monacoTypes.languages.InlineCompletion = {
      insertText: clean
    };
    
    // abort if there is a signal
    if (token.isCancellationRequested) {
      console.log('aborted')
      return
    }
    return {
      items: [item],
      enableForwardStability: true
    }

  }
  handleItemDidShow?(completions: monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>, item: monacoTypes.languages.InlineCompletion, updatedInsertText: string): void {
   
  }
  handlePartialAccept?(completions: monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>, item: monacoTypes.languages.InlineCompletion, acceptedCharacters: number): void {

  }
  freeInlineCompletions(completions: monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>): void {
    
  }
  groupId?: string;
  yieldsToGroupIds?: string[];
  toString?(): string {
    throw new Error('Method not implemented.');
  }
}