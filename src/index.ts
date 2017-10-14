import {createStore, compose, Store} from 'redux';
import {diff} from 'deep-diff';
import {enhancer, actions} from 'sync3k-client';

type TenxFormState = {
  submitted: [{[key: string]: string}],
  current: {[key: string]: string},
}
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

class TenxForm extends HTMLElement {
  private state: Store<TenxFormState> = createStore((state = {current: {}, submitted: [] as [{[key: string]: string}]}, action) => {
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
          submitted: [state.current, ...state.submitted]
        }
    }

    return state;
  }, composeEnhancers(enhancer));

  get formState() {
    return this.state.getState();
  }

  constructor() {
    super();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((me) => {
        me.addedNodes.forEach((node) => {
          if (node instanceof HTMLInputElement) {
            switch(node.type) {
              case "submit": {
                node.addEventListener("click", (e) => {
                  e.preventDefault();
                  this.state.dispatch({type: 'SUBMIT', value: this.state.getState().current});
                })
                break;
              }
              default: {
                node.addEventListener("blur", () => {
                  this.state.dispatch({type: 'UPDATE', id: node.id, value: node.value});
                });
              }
            }
          }
          if (node instanceof HTMLTextAreaElement) {
            node.addEventListener("blur", () => {
              this.state.dispatch({type: 'UPDATE', id: node.id, value: node.value});
            });
          }
        });
      })
    });
    observer.observe(this, {childList: true});

    let prevState: TenxFormState = {current: {}, submitted: [] as [{[key: string]: string}]};
    this.state.subscribe(() => {
      const diffs = diff(prevState.current, this.state.getState().current);
      for (const diff of diffs || []) {
        const target = this.querySelector(`#${diff.path[0]}`) as HTMLTextAreaElement | HTMLInputElement;
        if (target !== document.activeElement) {
          target.value = diff.rhs;
        }
      }
      console.log(diffs);
      prevState = this.state.getState();
    });

    this.state.dispatch(actions.initializeSync(`wss://demo.sync3k.io/kafka`, 'tenx-form-demo', '', false));
  }
}

customElements.define('tenx-form', TenxForm);
