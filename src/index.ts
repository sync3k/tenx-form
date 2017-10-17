import { createStore, compose, Store } from 'redux';
import { diff } from 'deep-diff';
import { enhancer, actions } from 'sync3k-client';

type TenxFormState = {
  submitted: [{ [key: string]: string }],
  current: { [key: string]: string },
}
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

class TenxForm extends HTMLElement {
  private state: Store<TenxFormState> = createStore((state = { current: {}, submitted: [] as [{ [key: string]: string }] }, action) => {
    switch (action.type) {
      case 'UPDATE':
        return {
          ...state,
          current: {
            ...state.current,
            [action.id]: action.value
          }
        };
      case 'SUBMIT':
        return {
          ...state,
          submitted: [...state.submitted, state.current]
        }
    }

    return state;
  }, composeEnhancers(enhancer));

  get formState() {
    return this.state.getState();
  }

  connectedCallback() {
    this.state.dispatch(
      actions.initializeSync(
        this.attributes.getNamedItem('sync3k-base-url').value,
        this.attributes.getNamedItem('sync3k-topic').value,
        '',
        false));
  }

  constructor() {
    super();
    const attachEventHandler = (node: HTMLElement) => {
      if (node instanceof HTMLInputElement) {
        switch (node.type) {
          case "submit": {
            node.addEventListener("click", (e) => {
              e.preventDefault();
              this.state.dispatch({ type: 'SUBMIT', value: this.state.getState().current });
            })
            break;
          }
          default: {
            node.addEventListener("blur", () => {
              this.state.dispatch({ type: 'UPDATE', id: node.id, value: node.value });
            });
          }
        }
      }
      if (node instanceof HTMLTextAreaElement) {
        node.addEventListener("blur", () => {
          this.state.dispatch({ type: 'UPDATE', id: node.id, value: node.value });
        });
      }
    };
    if (this.querySelectorAll) {
      this.querySelectorAll('input').forEach(attachEventHandler);
      this.querySelectorAll('textarea').forEach(attachEventHandler);
    }
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((me) => {
        me.addedNodes.forEach(attachEventHandler);
      });
    });
    observer.observe(this, { childList: true });

    let prevState: TenxFormState = { current: {}, submitted: [] as [{ [key: string]: string }] };
    this.state.subscribe(() => {
      const currentDiffs = diff(prevState.current, this.state.getState().current);
      for (const diff of currentDiffs || []) {
        const target = this.querySelector(`#${diff.path[0]}`) as HTMLTextAreaElement | HTMLInputElement;
        if (target !== document.activeElement) {
          target.value = diff.rhs;
        }
      }

      const submittedDiffs = diff(prevState.submitted, this.state.getState().submitted);
      const template = document.querySelector(`#${this.attributes.getNamedItem('result-template').value}`) as HTMLTemplateElement;
      const resultDiv = document.querySelector(`#${this.attributes.getNamedItem('result-div').value}`);

      if (submittedDiffs && submittedDiffs.find((diff) => diff.kind !== 'A')) {
        // In case of complex edits, re-render everything again.
        // TODO: Find smarter way of handling concurrent submissions.
        while (resultDiv.hasChildNodes()) {
          resultDiv.removeChild(resultDiv.lastChild);
        }

        this.state.getState().submitted.map((submitted) => renderSubmission(template, submitted)).forEach((newContent) => {
          resultDiv.insertBefore(newContent, resultDiv.firstChild);
        })
      } else {
        for (const diff of submittedDiffs || []) {
          const newContent = renderSubmission(template, diff.item.rhs);

          resultDiv.insertBefore(newContent, resultDiv.firstChild);
        }
      }

      prevState = this.state.getState();
    });
  }
}

const renderSubmission = (template: HTMLTemplateElement, submitted: any) => {
  // Deep-clone document fragment from template.
  const content = template.content.cloneNode(true) as DocumentFragment;
  for (const formKey of Object.keys(submitted)) {
    (content.querySelector(`[tenx-name="${formKey}"]`) as HTMLElement).innerText = submitted[formKey];
  }

  return content;
}

customElements.define('tenx-form', TenxForm);
